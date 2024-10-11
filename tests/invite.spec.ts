import { Client, Session } from "@heroiclabs/nakama-js"
import axios from "axios"
import { config } from "./config"
import { PlayerStats, Rewards, Wallet } from "./types"

describe("Should buy tiles work", () => {
    describe("Should buy tiles work in Avalanche, account 4", () => {
        let client: Client
        let session: Session
        beforeEach(async () => {
            const { data } = await axios.post(config().fakeSignatureUrl, {
                chainKey: "avalanche",
                accountNumber: 4,
            })
            client = new Client(
                config().nakama.serverkey,
                config().nakama.host,
                config().nakama.port,
                config().nakama.ssl
            )
            session = await client.authenticateCustom("", false, "", {
                ...data.data,
            })
        })
        afterEach(async () => {
            await client.deleteAccount(session)
        })
        it("Should main flow work successfully", async () => {
            let session2: Session
            let session3: Session
            try {
                //get invites object
                const { objects: objects0 } = await client.readStorageObjects(session, {
                    object_ids: [
                        {
                            collection: "System",
                            key: "rewards",
                        }
                    ]
                })
                const { fromInvites, referred } = objects0[0].value as Rewards

                //first, get the refererId
                const referrerUserId = session.user_id
                console.log(`Referrer user id: ${referrerUserId}`)
                //then, let new user create account by using the refererId
                const { data } = await axios.post(config().fakeSignatureUrl, {
                    chainKey: "avalanche",
                    accountNumber: 5,
                })
                const telegramMockId = 69696969
                session2 = await client.authenticateCustom("", false, "", {
                    ...data.data,
                    telegramInitDataRaw: `${data.data.telegramInitDataRaw},${telegramMockId}`,
                    referrerUserId,
                })
                //check balance
                const account2 = await client.getAccount(session2)
                const { golds : golds2 } = (JSON.parse(account2.wallet) as Wallet)
                console.log(`Golds 2: ${golds2}`)
                //500+200, maybe edit later
                expect(golds2).toEqual(500 + referred)

                const account = await client.getAccount(session)
                const { golds } = (JSON.parse(account.wallet) as Wallet)
                console.log(`Golds: ${golds}`)
                expect(golds).toEqual(1000)

                //check the invites
                const { objects } = await client.readStorageObjects(session, {
                    object_ids: [
                        {
                            collection: "Config",
                            key: "playerStats",
                            user_id: session.user_id,
                        }
                    ]
                })
                const { invites } = objects[0].value as PlayerStats
                //equal the telegram
                console.log(`Invites at 0: ${invites.at(0)}`)
                expect(invites.at(0)).toEqual(telegramMockId)

                //retry the invite, throw error
                const { data: data1 } = await axios.post(config().fakeSignatureUrl, {
                    chainKey: "avalanche",
                    accountNumber: 6,
                })
                session3 = await client.authenticateCustom("", false, "", {
                    ...data1.data,
                    telegramInitDataRaw: `${data.data.telegramInitDataRaw},${telegramMockId}`,
                    referrerUserId,
                })
                //this will fail since same telegram id, nothing happen, do not receive golds
                const account3 = await client.getAccount(session3)
                const { golds: golds3 } = (JSON.parse(account3.wallet) as Wallet)
                console.log(`Golds: ${golds3}`)
                expect(golds3).toEqual(500)

                //repeat the process with different telegram id
                for (let i = 0; i<30; i++) {
                    let session4: Session
                    try {
                        const { data } = await axios.post(config().fakeSignatureUrl, {
                            chainKey: "avalanche",
                            accountNumber: i+10,
                        })
                        //difer mock tele id
                        const telegramMockId = 69696969 + i + 1
                        session4 = await client.authenticateCustom("", false, "", {
                            ...data.data,
                            telegramInitDataRaw: `${data.data.telegramInitDataRaw},${telegramMockId}`,
                            referrerUserId,
                        })
                    } finally {
                        await client.deleteAccount(session4) 
                    }
                    //check the invites
                }
                const { objects: objects1 } = await client.readStorageObjects(session, {
                    object_ids: [
                        {
                            collection: "Config",
                            key: "playerStats",
                            user_id: session.user_id,
                        }
                    ]
                })
                
                //expect the length
                const { invites: invites1 } = objects1[0].value as PlayerStats
                expect(invites1.length).toEqual(31)

                //check the balance
                const account4 = await client.getAccount(session)
                const { golds: golds4 } = (JSON.parse(account4.wallet) as Wallet)
                console.log(`Golds after all invites: ${golds4}`)

                expect(golds4).toEqual(500 + fromInvites.metrics[1].value+fromInvites.metrics[2].value+fromInvites.metrics[3].value+fromInvites.metrics[4].value)
            } finally {
                await client.deleteAccount(session2) 
                await client.deleteAccount(session3) 
            }    
        }, 60000)
    })
},)
import { Client, Session } from "@heroiclabs/nakama-js"
import axios from "axios"
import { config } from "./config"

describe("Should add friend work", () => {
    describe("Should add friend work in Solana, account 5", () => {
        let client: Client
        let session: Session
        beforeEach(async () => {
            const { data } = await axios.post(
                config().fakeSignatureUrl,
                {
                    chainKey: "solana",
                    accountNumber: 5,
                }
            )
            client = new Client(config().nakama.serverkey, config().nakama.host, config().nakama.port, config().nakama.ssl)
            session = await client.authenticateCustom("", false, "", {
                ...data.data
            })
            console.log(`User id: ${session.user_id}`)
        })
        afterEach(async () => {
            await client.deleteAccount(session)
        })
        it("Should main flow work successfully", async () => {
            //add friend
            const { data } = await axios.post(
                config().fakeSignatureUrl,
                {
                    chainKey: "solana",
                    accountNumber: 6,
                }
            )
            const friendSession = await client.authenticateCustom("", false, "", {
                ...data.data
            })
            console.log(`Friend user id: ${friendSession.user_id}`)

            //add friend
            await client.addFriends(session, [friendSession.user_id])
        })
    })
})
import { Client, Session } from "@heroiclabs/nakama-js"
import axios from "axios"
import { config } from "./config"
import { ClaimDailyRewardRpcResponse, DailyReward, RewardTracker, StarterConfigure, Wallet } from "./types"

describe("Should deliver work", () => {
    describe("Should deliver work in Solana, account 1", () => {
        let client: Client
        let session: Session
        beforeEach(async () => {
            const { data } = await axios.post(
                config().fakeSignatureUrl,
                {
                    chainKey: "solana",
                    accountNumber: 1,
                }
            )
            client = new Client(config().nakama.serverkey, config().nakama.host, config().nakama.port, config().nakama.ssl)
            session = await client.authenticateCustom("", false, "", {
                ...data.data
            })
            console.log("User id: ", session.user_id)
        })
        afterEach(async () => {
            await client.deleteAccount(session)
        })
        it("Should main flow work successfully", async () => {
            //all claims
            //get the starter
            const { objects: starterConfigureObjects } = await client.readStorageObjects(session, {
                object_ids: [
                    {
                        collection: "System",
                        key: "starterConfigure",
                    }
                ]
            })
            const { goldAmount } = starterConfigureObjects[0].value as StarterConfigure

            const { objects: dailyRewardObjects } = await client.listStorageObjects(session, "DailyRewards", "", 10, "")
            console.log(dailyRewardObjects)
            const getDailyReward = (day: number) => dailyRewardObjects.find(object => (object.value as DailyReward).day === day).value as DailyReward
            //first, if call 
            await client.rpc(session, "test_claim_daily_reward", {})
            //get the first claim, it is golds, so check the balance
            let cummulativeGold = goldAmount
            const account = await client.getAccount(session)
            const { golds } = JSON.parse(account.wallet)  as Wallet
            cummulativeGold += getDailyReward(1).amount
            expect(golds).toEqual(cummulativeGold)
            //after 1day1s, call again
            await client.rpc(session, "test_claim_daily_reward", { forward: 60 * 60 * 24 })
            const account2 = await client.getAccount(session)
            const { golds: golds2 } = JSON.parse(account2.wallet)  as Wallet
            cummulativeGold += getDailyReward(2).amount
            expect(golds2).toEqual(cummulativeGold)
            //after 2day1s, call again
            await client.rpc(session, "test_claim_daily_reward", { forward: 2 * 60 * 60 * 24  })
            const account3 = await client.getAccount(session)
            const { golds: golds3 } = JSON.parse(account3.wallet)  as Wallet
            cummulativeGold += getDailyReward(3).amount
            expect(golds3).toEqual(cummulativeGold)

            //after 3day1s, call again
            await client.rpc(session, "test_claim_daily_reward", { forward: 3 * 60 * 60 * 24  })
            const account4 = await client.getAccount(session)
            const { golds: golds4 } = JSON.parse(account4.wallet)  as Wallet
            cummulativeGold += getDailyReward(4).amount
            expect(golds4).toEqual(cummulativeGold)

            //repeat 100 times
            //last day claim
            for (let i = 0; i < 100; i++) {
                const { payload } = await client.rpc(session, "test_claim_daily_reward", { forward: (4+i) * 60 * 60 * 24  })
                const { lastDailyRewardPossibility } = payload as ClaimDailyRewardRpcResponse
                console.log(lastDailyRewardPossibility.key)
                expect(lastDailyRewardPossibility).not.toBeUndefined()
            }

            //
            const { objects } = await client.readStorageObjects(session, {
                object_ids: [{
                    collection: "Player",
                    key: "rewardTracker",
                    user_id: session.user_id
                }]
            })
            const { dailyRewardsInfo } = objects[0].value as RewardTracker
            expect(dailyRewardsInfo.numberOfClaims).toEqual(104)
        }, 30000)
    })
    describe("Should deliver work in Solana, account 2", () => {
        let client: Client
        let session: Session
        beforeEach(async () => {
            const { data } = await axios.post(
                config().fakeSignatureUrl,
                {
                    chainKey: "solana",
                    accountNumber: 2,
                }
            )
            client = new Client(config().nakama.serverkey, config().nakama.host, config().nakama.port, config().nakama.ssl)
            session = await client.authenticateCustom("", false, "", {
                ...data.data
            })
            console.log("User id: ", session.user_id)
        })
        afterEach(async () => {
            await client.deleteAccount(session)
        })
        it("Should 2 continue successfully", async () => {
            await client.rpc(session, "claim_daily_reward", {})
            //to be error
            try {
                await client.rpc(session, "claim_daily_reward", {})
            } catch (error) {
                console.log(error)
            }
            //await expect(client.rpc(session, "claim_daily_reward", {})).rejects.toThrow()
        }, 30000)
    })
})
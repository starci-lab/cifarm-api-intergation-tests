import { Client, Session } from "@heroiclabs/nakama-js"
import axios from "axios"
import { config } from "./config"
import { GetDeliveringProductsRpcResponse, MarketPricing, Wallet } from "./types"

describe("Should deliver work", () => {
    describe("Should deliver work in Avalanche, account 2", () => {
        let client: Client
        let session: Session
        beforeEach(async () => {
            const { data } = await axios.post(
                config().fakeSignatureUrl,
                {
                    chainKey: "avalanche",
                    accountNumber: 2,
                }
            )
            client = new Client(config().nakama.serverkey, config().nakama.host, config().nakama.port, config().nakama.ssl)
            session = await client.authenticateCustom("", false, "", {
                ...data.data,
                network: "testnet",
            })
        })
        afterEach(async () => {
            await client.deleteAccount(session)
        })

        it("Should main flow work successfully", async () => {
            //hack to get the deliveries product
            const { payload } = await client.rpc(session, "test_get_delivering_products", {})
            const { deliveringProductBasicKey, deliveringProductPremiumKey } = payload as GetDeliveringProductsRpcResponse
            console.log(`Delivering product basic key: ${deliveringProductBasicKey}`)
            console.log(`Delivering product premium key: ${deliveringProductPremiumKey}`)
            //test delivery
            await client.rpc(session, "test_delivery", {})

            //get the carrot price object
            const { objects } = await client.readStorageObjects(session, {
                object_ids: [ {
                    collection: "MarketPricings",
                    key: "carrot",
                }]
            }) 
            const { basicAmount, premiumAmount } = objects[0].value as MarketPricing
            console.log(`Carrot basic amount: ${basicAmount}`)
            console.log(`Carrot premium amount: ${premiumAmount}`)

            //temp the token method not implements
            //check your balance, check your deliveries
            const account = await client.getAccount(session)
            const golds = ((JSON.parse(account.wallet) as Wallet).golds)
            //since the api give 20, so that we can calculate the golds
            expect(golds).toEqual(500 + basicAmount * (20 + 20))

            //ensure no more delivering products
            const { objects: deliveringProducts } = await client.listStorageObjects(session, "DeliveringProducts", session.user_id, 10, "")
            expect(deliveringProducts.length).toEqual(0)
        })
    })
})
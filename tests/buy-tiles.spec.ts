import { Client, Session } from "@heroiclabs/nakama-js"
import axios from "axios"
import { config } from "./config"
import { BuyTileRpcResponse, Tile, Wallet } from "./types"

describe("Should buy tiles work", () => {
    describe("Should buy tiles work in Avalanche, account 3", () => {
        let client: Client
        let session: Session
        beforeEach(async () => {
            const { data } = await axios.post(config().fakeSignatureUrl, {
                chainKey: "avalanche",
                accountNumber: 3,
            })
            client = new Client(
                config().nakama.serverkey,
                config().nakama.host,
                config().nakama.port,
                config().nakama.ssl
            )
            session = await client.authenticateCustom("", false, "", {
                ...data.data
            })
        })
        afterEach(async () => {
            await client.deleteAccount(session)
        })
        it("Should main flow work successfully", async () => {
            //hack gold first
            await client.rpc(session, "test_hack_gold", { amount: 10000000 })

            //get tile price
            const { objects } = await client.readStorageObjects(session, {
                object_ids: [
                    {
                        collection: "Tiles",
                        key: "tileBasic1",
                    },
                ],
            })
            const { price, maxOwnership } = objects[0].value as Tile
            console.log(`Max ownership tileBasic1: ${maxOwnership}`)

            //buy 10 tiles tile 1
            for (let i = 0; i < maxOwnership; i++) {
                const { payload } = await client.rpc(session, "buy_tile", {
                    position: { x: 0, y: i },
                })
                const { placedItemTileKey } = payload as BuyTileRpcResponse
                console.log(`Placed item tile key: tileBasic1 - ${placedItemTileKey}`)
            }

            //check your balance, check your price
            const account = await client.getAccount(session)
            const golds = (JSON.parse(account.wallet) as Wallet).golds
            expect(golds).toEqual(500 + 10000000 - price * maxOwnership)

            //get tile price
            const { objects: objects1 } = await client.readStorageObjects(session, {
                object_ids: [
                    {
                        collection: "Tiles",
                        key: "tileBasic2",
                    },
                ],
            })
            const { price: price1, maxOwnership: maxOwnership1 } = objects1[0]
                .value as Tile
            console.log(`Max ownership tileBasic2: ${maxOwnership1}`)

            //buy 30 tiles tile 2
            for (let i = 0; i < maxOwnership1; i++) {
                const { payload } = await client.rpc(session, "buy_tile", {
                    position: { x: 0, y: i },
                })
                const { placedItemTileKey } = payload as BuyTileRpcResponse
                console.log(`Placed item tile key: tileBasic2 - ${placedItemTileKey}`)
            }

            //check your balance, check your price
            const account1 = await client.getAccount(session)
            const golds1 = (JSON.parse(account1.wallet) as Wallet).golds
            console.log(`Expect: ${golds1}`)
            console.log(
                `Actual: ${
                    500 + 10000000 - price * maxOwnership - price1 * maxOwnership1
                }`
            )
            expect(golds1).toEqual(
                500 + 10000000 - price * maxOwnership - price1 * maxOwnership1
            )

            //get tile price
            const { objects: objects2 } = await client.readStorageObjects(session, {
                object_ids: [
                    {
                        collection: "Tiles",
                        key: "tileBasic3",
                    },
                ],
            })
            const { price: price2, maxOwnership: maxOwnership2 } = objects2[0]
                .value as Tile
            console.log(`Max ownership tileBasic3: ${maxOwnership2}`)

            //buy 5 tiles tile 3
            for (let i = 0; i < 5; i++) {
                const { payload } = await client.rpc(session, "buy_tile", {
                    position: { x: 0, y: i },
                })
                const { placedItemTileKey } = payload as BuyTileRpcResponse
                console.log(`Placed item tile key: tileBasic3 - ${placedItemTileKey}`)
            }

            //check your balance, check your price
            const account2 = await client.getAccount(session)
            const golds2 = (JSON.parse(account2.wallet) as Wallet).golds
            console.log(`Expect: ${golds2}`)
            console.log(
                `Actual: ${
                    500 +
          10000000 -
          price * maxOwnership -
          price1 * maxOwnership1 -
          price2 * 5
                }`
            )
            expect(golds1).toEqual(
                500 +
          10000000 -
          price * maxOwnership -
          price1 * maxOwnership1 -
          price2 * 5
            )
        }, 60000)
    })
})

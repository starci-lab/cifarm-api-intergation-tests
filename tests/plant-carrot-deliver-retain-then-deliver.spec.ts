import { Client, Session } from "@heroiclabs/nakama-js"
import axios from "axios"
import { config } from "./config"
import { BuySeedsRpcResponse, DeliverProductsRpcResponse, HarvestCropRpcResponse, Inventory, PlacedItem, RetainProductsRpcResponse } from "./types"
import { sleep } from "./utils"

describe("Should plant carrot, deliver, retain then deliver", () => {
    describe("Should plant carrot, deliver, retain then deliver work in Avalanche, account 7", () => {
        let client: Client
        let session: Session
        beforeEach(async () => {
            const { data } = await axios.post(config().fakeSignatureUrl, {
                chainKey: "avalanche",
                accountNumber: 7,
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
            console.log(`User id: ${session.user_id}`)
        })
        afterEach(async () => {
            await client.deleteAccount(session)
        })
        it("Should main flow work successfully", async () => {
            //buy carrot seeds
            const { payload } = await client.rpc(session, "buy_seeds", {
                key: "carrot",
                quantity: 1
            })
            const { inventorySeedKey } = payload as BuySeedsRpcResponse
            console.log(`Inventory seed key: ${inventorySeedKey}`)

            //fetch all place item tiles items
            const { objects } = await client.listStorageObjects(session, "PlacedItems", session.user_id, 10, "")
            const tile = (objects.find(object => (object.value as PlacedItem).type === 0).value as PlacedItem)
            console.log(`Tile key: ${tile.key}`)
            
            //plant the seed
            await client.rpc(session, "plant_seed", {
                placedItemTileKey: tile.key,
                inventorySeedKey
            })
            //check the inventories, should be empty now
            const { objects: objects1 } = await client.listStorageObjects(session, "Inventories", session.user_id, 10, "")
            expect(objects1.length).toEqual(0)

            //speed up, 3601 seconds each
            await client.rpc(session, "test_speed_up", { time: 3600 })
            //wait 1.1s to process grow up
            await sleep(1100)
            //check need water or not
            const { objects: objects2 } = await client.readStorageObjects(session, {
                object_ids: [{ collection: "PlacedItems", key: tile.key, user_id: session.user_id }]
            })
            const currentTile = objects2[0].value as PlacedItem
            expect(currentTile.seedGrowthInfo.currentStage).toEqual(2)
            //state 2 is need water
            if (currentTile.seedGrowthInfo.currentState === 1) {
                //water the crop
                console.log("Need watering at stage 2")
                await client.rpc(session, "water", { placedItemTileKey: tile.key })
            }
            //speed up, 3601 seconds each
            await client.rpc(session, "test_speed_up", { time: 3600 })
            await sleep(1100)
            //wait 1.1s to process grow up
            //state 3 is need water
            const { objects: objects3 } = await client.readStorageObjects(session, {
                object_ids: [{ collection: "PlacedItems", key: tile.key, user_id: session.user_id }]
            })
            const currentTileStage3 = objects3[0].value as PlacedItem
            expect(currentTileStage3.seedGrowthInfo.currentStage).toEqual(3)
            if (currentTileStage3.seedGrowthInfo.currentState === 1) {
                //water the crop
                console.log("Need watering at stage 3")
                await client.rpc(session, "water", { placedItemTileKey: tile.key })
            }
            //speed up, 3601 seconds each
            await client.rpc(session, "test_speed_up", { time: 3600 })
            //wait 1.1s to process grow up
            await sleep(1100)

            const { objects: objects4 } = await client.readStorageObjects(session, {
                object_ids: [{ collection: "PlacedItems", key: tile.key, user_id: session.user_id }]
            })
            const currentTileStage4 = objects4[0].value as PlacedItem
            expect(currentTileStage4.seedGrowthInfo.currentStage).toEqual(4)
            //kill weeds or pests
            if (currentTileStage4.seedGrowthInfo.currentState === 2) {
                //use herbicide
                console.log("Need to use herbicide at stage 4")
                await client.rpc(session, "use_herbicide", { placedItemTileKey: tile.key })
            } else {
                //use pesticide
                console.log("Need to use pesticide at stage 4")
                await client.rpc(session, "use_pestiside", { placedItemTileKey: tile.key })
            }
            console.log("Now harvest the crop")
            //speed up, 3601 seconds each
            await client.rpc(session, "test_speed_up", { time: 3600 })
            //wait 1.1s to process grow up
            await sleep(2100)
        
            //harvest
            const { payload: payload1 } = await client.rpc(session, "harvest_crop", { placedItemTileKey: tile.key })
            const { inventoryHarvestedCropKey } = payload1 as HarvestCropRpcResponse
            console.log(`Inventory harvested crop key: ${inventoryHarvestedCropKey}`)

            //deliver
            const { payload: payload3 } = await client.rpc(session, "deliver_products", { inventoryWithIndex: {
                index: 3,
                inventory: {
                    key: inventoryHarvestedCropKey,
                    quantity: 20
                }
            } })
            const { deliveringProductKey } = payload3 as DeliverProductsRpcResponse
            console.log(`Delivery product key: ${deliveringProductKey}`)
            //check the inventories, should be empty now
            const { objects: objects5 } = await client.listStorageObjects(session, "Inventories", session.user_id, 10, "")
            expect(objects5.length).toEqual(0)
            //check your deliveries
            const { objects: objects6 } = await client.listStorageObjects(session, "DeliveringProducts", session.user_id, 10, "")
            expect(objects6.length).toEqual(1)

            //retain
            // await client.rpc(session, "retain", { deliveryProductKey: deliveryProductKeys[0] })
            const { payload: payload8 } = await client.rpc(session, "retain_products", { deliveringProduct: {
                key: deliveringProductKey,
                quantity: 20
            } })
            const { inventoryKey } = payload8 as RetainProductsRpcResponse
            console.log(`Retain inventory key: ${inventoryKey}`)
            //the delivery product should be empty now
            const { objects: objects7 } = await client.listStorageObjects(session, "DeliveringProducts", session.user_id, 10, "")
            expect(objects7.length).toEqual(0)
            //the inventories should have the retained product
            const { objects: objects8 } = await client.listStorageObjects(session, "Inventories", session.user_id, 10, "")
            expect(objects8.length).toEqual(1)
            //get the inventory
            const { objects: objects10 } = await client.readStorageObjects(session, {
                object_ids: [ {
                    collection: "Inventories",
                    key: inventoryKey,
                    user_id: session.user_id
                }]
            })
            const inventory = objects10[0].value as Inventory
            console.log(inventory)
            expect(inventory.quantity).toEqual(20)

            //deliver again
            const { payload: payload9 } = await client.rpc(session, "deliver_products", { inventoryWithIndex: {
                index: 3,
                inventory: {
                    key: inventoryKey,
                    quantity: 20
                }
            } })
            const { deliveringProductKey: deliveringProductKey2 } = payload9 as DeliverProductsRpcResponse
            console.log(`Delivery product key: ${deliveringProductKey2}`)
            //check the inventories, should be empty now
            const { objects: objects9 } = await client.listStorageObjects(session, "Inventories", session.user_id, 10, "")
            expect(objects9.length).toEqual(0)
        }, 60000)
    })
})
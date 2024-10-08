import { Client, Session } from "@heroiclabs/nakama-js"
import axios from "axios"
import { config } from "./config"
import { Animal, Building, BuyAnimalRpcResponse, BuySuppliesRpcResponse, CollectAnimalProductRpcResponse, ConstructBuildingRpcResponse, Inventory, PlacedItem, Wallet } from "./types"
import { sleep } from "./utils"

describe("Should animal procedure work", () => {
    describe("Should animal procedure work in Avalanche, account 1", () => {
        let client: Client
        let session: Session
        beforeEach(async () => {
            const { data } = await axios.post(
                config().fakeSignatureUrl,
                {
                    chainKey: "avalanche",
                    accountNumber: 1,
                }
            )
            client = new Client(config().nakama.serverkey, config().nakama.host, config().nakama.port, config().nakama.ssl)
            session = await client.authenticateCustom("", false, "", {
                ...data.data
            })
        })
        afterEach(async () => {
            await client.deleteAccount(session)
        })
        it("Should main flow work successfully", async () => {
            //hack gold first
            await client.rpc(session, "test_hack_gold", { amount: 1000000 })
            //check balance
            const account = await client.getAccount(session)
            expect((JSON.parse(account.wallet) as Wallet).golds).toEqual(1000500)

            //place chicken coop
            const { payload } = await client.rpc(session, "construct_building", { key: "chickenCoop", position: { x: 0, y: 0 } })
            //get chickencoop info
            const { objects } = await client.readStorageObjects(session, {
                object_ids: [ {
                    collection: "Buildings",
                    key: "chickenCoop",
                }]
            })
            //check balance
            const price = (objects[0].value as Building).upgradeSummaries[1].price
            console.log(`Price to build chicken coop: ${price}`)
            const account1 = await client.getAccount(session)
            expect((JSON.parse(account1.wallet) as Wallet).golds).toEqual(1000500 - price)

            //get the building
            const placedItemBuildingKey = (payload as ConstructBuildingRpcResponse).placedItemBuildingKey
            console.log(`Placed item building key: ${placedItemBuildingKey}`)

            //buy chicken
            const { payload: buyPayload } = await client.rpc(session, "buy_animal", { key: "chicken", placedItemBuildingKey })
            const placedItemAnimalKey = (buyPayload as BuyAnimalRpcResponse).placedItemAnimalKey
            console.log(`Placed item animal key: ${placedItemAnimalKey}`)
            //get the chicken info
            const { objects: objects1 } = await client.readStorageObjects(session, {
                object_ids: [ {
                    collection: "Animals",
                    key: "chicken",
                }]
            })
            //check balance
            const offspringPrice = (objects1[0].value as Animal).offspringPrice
            console.log(`Price to buy chicken: ${offspringPrice}`)
            const account2 = await client.getAccount(session)
            expect((JSON.parse(account2.wallet) as Wallet).golds).toEqual(1000500 - price - offspringPrice)

            //test chicken parent info
            const { objects: objects2 } = await client.readStorageObjects(session, {
                object_ids: [ {
                    collection: "PlacedItems",
                    key: placedItemAnimalKey,
                    user_id: session.user_id,
                }]
            })
            const chicken = objects2[0].value as PlacedItem
            expect(chicken.parentPlacedItemKey).toEqual(placedItemBuildingKey)

            //buy supplies
            const { payload: payload2 } = await client.rpc(session, "buy_supplies", { key: "chickenFeed", quantity: 100})
            const inventoryAnimalFeedKey = (payload2 as BuySuppliesRpcResponse).inventorySupplyKey
            console.log(`Inventory animal feed key: ${inventoryAnimalFeedKey}`)

            //continuosly feed the chicken
            while(true) {
                const { objects: objects4 } = await client.readStorageObjects(session, {
                    object_ids: [
                        {
                            collection: "PlacedItems",
                            key: placedItemAnimalKey,
                            user_id: session.user_id,
                        }
                    ]
                })
                if ((objects4[0].value as PlacedItem).animalInfo.isAdult) {
                    break
                }
                //grow the chicken
                //hack time, 12h, then the chicken need food
                await client.rpc(session, "test_speed_up", { time: 60 * 60 * 12 })
                //sleep 1.1s to load next chunk
                await sleep(1100)
                //check whether the animal need fed
                const { objects: objects3 } = await client.readStorageObjects(session, {
                    object_ids: [ {
                        collection: "PlacedItems",
                        key: placedItemAnimalKey,
                        user_id: session.user_id,
                    }]
                })
                expect((objects3[0].value as PlacedItem).animalInfo.needFed).toEqual(true)
            
                //feed the chicken
                await client.rpc(session, "feed_animal", { placedItemAnimalKey, inventoryAnimalFeedKey })
                console.log("Feed the chicken during its growth time")
            }

            //check whether the chicken is aldult
            const { objects: objects4 } = await client.readStorageObjects(session, {
                object_ids: [
                    {
                        collection: "PlacedItems",
                        key: placedItemAnimalKey,
                        user_id: session.user_id,
                    }
                ]
            })
            const chicken1 = objects4[0].value as PlacedItem
            expect(chicken1.animalInfo.isAdult).toEqual(true)
            console.log("Chicken become adult")
            
            //now the chicken turn into product, we feed the chicken 6 times, expect to yield > 100 eggs
            while (true) {
                await client.rpc(session, "test_speed_up", { time: 60 * 60 * 12 })
                await sleep(1100)
                //feed it
                const { objects: befores } = await client.readStorageObjects(session, {
                    object_ids: [
                        {
                            collection: "Inventories",
                            key: inventoryAnimalFeedKey,
                            user_id: session.user_id,
                        }
                    ]
                }) 
                await client.rpc(session, "feed_animal", { placedItemAnimalKey, inventoryAnimalFeedKey })
                console.log("Feed the adult chicken")
                //check quantity before and after feed 
                const { objects: afters } = await client.readStorageObjects(session, {
                    object_ids: [
                        {
                            collection: "Inventories",
                            key: inventoryAnimalFeedKey,
                            user_id: session.user_id,
                        }
                    ]
                }) 
                //ensure inventory lose 1
                expect((befores[0].value as Inventory).quantity - (afters[0].value as Inventory).quantity).toEqual(1)
                
                //get the chicken
                const { objects: objects4 } = await client.readStorageObjects(session, {
                    object_ids: [
                        {
                            collection: "PlacedItems",
                            key: placedItemAnimalKey,
                            user_id: session.user_id,
                        }
                    ]
                })
                const chicken = objects4[0].value as PlacedItem
                if (chicken.animalInfo.hasYielded) {
                    console.log("Collecting eggs")
                    const { payload } = await client.rpc(session, "collect_animal_product", {
                        placedItemAnimalKey
                    })

                    //print eggs key
                    const inventoryAnimalProductKey = (payload as CollectAnimalProductRpcResponse).inventoryAnimalProductKey
                    console.log(`Inventory animal product key: ${inventoryAnimalProductKey}`)

                    //get inventory
                    const { objects: inventories } = await client.readStorageObjects(session, {
                        object_ids: [
                            {
                                collection: "Inventories",
                                key: inventoryAnimalProductKey,
                                user_id: session.user_id,
                            }
                        ]
                    }) 
                    const inventory = inventories[0].value as Inventory
                    console.log(`Current inventory quantity: ${inventory.quantity}`)
                    if (inventory.quantity > 100) break
                }
            }
        }, 60000)
    })
})

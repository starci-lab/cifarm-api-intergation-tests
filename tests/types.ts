export interface Wallet {
  golds: number;
}

export interface UpgradeSummary {
  price: number;
  capacity: number;
}

export interface Building {
  key: string;
  availableInShop: boolean;
  maxUpgrade: number;
  upgradeSummaries: Record<number, UpgradeSummary>;
  animalKey: string;
}

export interface ConstructBuildingRpcResponse {
  placedItemBuildingKey: string;
}

export interface BuyAnimalRpcResponse {
  placedItemAnimalKey: string;
}

export interface Animal {
  key: string;
  yieldTime: number;
  offspringPrice: number;
  isNFT: boolean;
  growthTime: number;
  availableInShop: boolean;
  hungerTime: number;
  minHarvestQuantity: number;
  maxHarvestQuantity: number;
  basicHarvestExperiences: number;
  premiumHarvestExperiences: number;
}

interface Position {
  x: number;
  y: number;
}

export interface TileInfo {
    growthTimeReduction: number;
    pestResistance: number;
    productivityIncrease: number;
    weedResistance: number;
}

export interface Inventory {
    key: string;
    referenceKey: string;
    tileInfo: TileInfo;
    type: number;
    quantity: number;
    unique: boolean;
    tokenId: string;
    placeable: boolean;
    isPlaced: boolean;
    premium: boolean;
    deliverable: boolean;
}

export interface SeedGrowthInfo {
  currentStage: number;
  currentStageTimeElapsed: number;
  totalTimeElapsed: number;
  harvestQuantityRemaining: number;
  crop: Crop;
  currentState: number;
  thiefedBy: Array<string>;
  fullyMatured: boolean;
  isPlanted: boolean;
}

export interface AnimalInfo {
  currentGrowthTime: number;
  currentYieldTime: number;
  hasYielded: boolean;
  isAdult: boolean;
  animal: Animal;
  needFed: boolean;
  harvestQuantityRemaining: number;
  thiefedBy: string[];
}

export interface BuildingInfo {
  currentUpgrade: number;
  occupancy: number;
  building: Building;
}

export interface PlacedItem {
  key: string;
  referenceKey: string;
  inventoryKey: string;
  position: Position;
  type: number;
  seedGrowthInfo: SeedGrowthInfo;
  buildingInfo: BuildingInfo;
  animalInfo: AnimalInfo;
  parentPlacedItemKey: string;
}

export interface Crop {
  key: string;
  growthStageDuration: number;
  growthStages: number;
  price: number;
  premium: boolean;
  perennial: boolean;
  nextGrowthStageAfterHarvest: number;
  minHarvestQuantity: number;
  maxHarvestQuantity: number;
  basicHarvestExperiences: number;
  premiumHarvestExperiences: number;
  availableInShop: boolean;
}

export interface BuySuppliesRpcResponse {
	inventorySupplyKey: string
}

export interface CollectAnimalProductRpcResponse {
    inventoryAnimalProductKey: string
}

export interface GetDeliveringProductsRpcResponse {
  deliveringProductBasicKey: string;
  deliveringProductPremiumKey: string;
}

export interface MarketPricing {
  key: string;
  basicAmount: number; 
  premiumAmount: number; 
}

export interface BuyTileRpcResponse {
	placedItemTileKey: string
}

export interface Tile {
  key: string;              
  price: number;            
  maxOwnership: number;     
  isNft: boolean;           
  availableInShop: boolean;
}

export interface PlayerStats {
  key: string;
  experiences: number;
  experienceQuota: number;
  level: number;
  tutorialIndex: number;
  stepIndex: number;
  invites: Array<number>;
}

export interface Rewards {
  key: string;
  fromInvites: FromInvites;
  referred: number;
}

export interface FromInvites {
  key: string;
  metrics: Record<number, Metric>; // Using Record for the map type
}

export interface Metric {
  key: number;
  value: number; // Use number for int64 in TypeScript
}

export interface BuySeedsRpcParams {
  key: string;
  quantity: number;
}

export interface BuySeedsRpcResponse {
  inventorySeedKey: string;
}

export interface HarvestCropRpcParams {
  placedItemTileKey: string;
}

// Interface for HarvestCropRpcResponse
export interface HarvestCropRpcResponse {
  inventoryHarvestedCropKey: string;
}

export interface InventoryWithIndex {
  index: number;
  inventory: Inventory; // Assuming Inventory is defined elsewhere
}

// Interface for DeliverProductsRpcParams
export interface DeliverProductsRpcParams {
  inventoryWithIndex: InventoryWithIndex
}

// Interface for DeliverProductsRpcResponse
export interface DeliverProductsRpcResponse {
  deliveringProductKey: string;
}

export interface DeliveringProduct {
  key: string;
  referenceKey: string;
  type: number; // Assuming 'type' is intended to be a number (similar to Go's int)
  quantity: number;
  premium: boolean;
  index: number;
}

export interface RetainProductsRpcParams {
  deliveringProduct: DeliveringProduct;
}

// Interface for RetainProductsRpcResponse
export interface RetainProductsRpcResponse {
  inventoryKey: string;
}
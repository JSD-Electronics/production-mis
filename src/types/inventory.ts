export interface Inventory {
    _id: string;
    name: string;
    processID: string;
    productName: string;
    processQuantity: number;
    issuedKits: number;
    issuedCartons?: number;
    fgToStore?: number;
    inventoryQuantity: number;
    status: string;
    description?: string;
    productType?: string;
    cartonQuantity: number;
    cartonCapacity?: number;
    cartonsNeeded?: number;
    cartonsAllocated?: number;
    cartonShortage?: number;
    cartonAllocationStatus?: string;
    updatedAt: string;
    createdAt: string;
    productDetails?: {
        _id: string;
        name: string;
        stages: any[];
    };
    orderConfirmationNo?: string;
    fgCount?: number;
}

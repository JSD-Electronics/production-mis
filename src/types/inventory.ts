export interface Inventory {
    _id: string;
    name: string;
    processID: string;
    productName: string;
    processQuantity: number;
    issuedKits: number;
    inventoryQuantity: number;
    status: string;
    description?: string;
    productType?: string;
    cartonQuantity: number;
    updatedAt: string;
    createdAt: string;
    productDetails?: {
        _id: string;
        name: string;
        stages: any[];
    };
    orderConfirmationNo?: string;
}

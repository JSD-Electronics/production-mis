export interface PlaningData {
    _id: string;
    orderConfirmationNo: string;
    processID: string;
    productName: string;
    name: string;
    processQuantity: number;
    issuedKits: number;
    inventoryQuantity: number;
    status: string;
    imeiNo?: string;
    createdAt: string;
    updatedAt: string;
}

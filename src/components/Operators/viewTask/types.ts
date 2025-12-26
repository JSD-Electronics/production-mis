export interface Device {
  _id: string;
  serialNo: string;
  modelName?: string;
  imeiNo?: string;
  currentStage?: string;
  status?: string;
  createdAt: string | Date;
  testRecords?: TestRecord[];
  [key: string]: any; // Allow other properties for now
}

export interface TestRecord {
  _id?: string;
  stageName: string;
  status: string;
  seatNumber?: string;
  timeConsumed?: string;
  operatorId?: string;
  [key: string]: any;
}

export interface Carton {
  cartonSerial: string;
  processId: string;
  devices: string[] | any[]; // Sometimes IDs, sometimes objects?
  cartonSize?: { width: number; height: number };
  maxCapacity?: number;
  weightCarton?: number;
  status?: "empty" | "partial" | "full";
  createdAt?: string | Date;
  [key: string]: any;
}

export interface SubStep {
  isPrinterEnable?: boolean;
  isPackagingStatus?: boolean;
  isVerifySticker?: boolean;
  printerFields?: any[];
  stickerData?: any;
  packagingData?: any;
  [key: string]: any;
}

export interface ProcessAssignUserStage {
  subSteps?: SubStep[];
  [key: string]: any;
}

export interface ProcessData {
  _id: string;
  subProcess?: any[];
  [key: string]: any;
}

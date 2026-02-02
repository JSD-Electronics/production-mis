export interface Stages {
    _id: string;
    name: string;
    status: string;
    jigCategory: string;
    createdAt: string;
    updatedAt: string;
    subSteps?: any[];
    stages?: any[];
}

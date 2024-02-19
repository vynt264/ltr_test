export class CreateMaintenanceDto {
    startTime: Date;
    completionTime: Date;
    description: string;
    status: string;
    immediateMaintenance: boolean;
}
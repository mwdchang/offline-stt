export interface Position {
	x: number;
	y: number;
}

export interface NotificationItemStatus {
	status: ProgressState;
	msg: string;
	error: string;
	progress?: number;
}

export enum ProgressState {
    Cancelled = "CANCELLED",
    Complete = "COMPLETE",
    Error = "ERROR",
    Failed = "FAILED",
    Queued = "QUEUED",
    Retrieving = "RETRIEVING",
    Running = "RUNNING",
    Cancelling = "CANCELLING",
}

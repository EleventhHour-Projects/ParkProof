export type EventType = "ENTRY" | "EXIT" | "QUERY" | "AUDIT";

export interface EventLog {
  _id?: string;
  parkingLotId: string;
  sessionId?: string;     // optional for QUERY / AUDIT
  eventType: EventType;
  timestamp: Date;
}

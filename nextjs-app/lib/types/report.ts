export enum ReportType {
  OVERPARKING = 'OVERPARKING',
  UNAUTHORIZED_PARKING = 'UNAUTHORIZED_PARKING',
  TICKET_FRAUD = 'TICKET_FRAUD',
  OVERCHARGING = 'OVERCHARGING',
  OTHER = 'OTHER'
}

export interface Report {
  _id?: string;
  parkingLotId?: string; // Optional if general report
  userId?: string;
  type: ReportType;
  description?: string;
  images?: string[]; // Array of image URLs or Base64 strings
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt?: Date;
  updatedAt?: Date;
}

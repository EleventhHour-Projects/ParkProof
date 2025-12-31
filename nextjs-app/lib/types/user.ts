export type UserRole = "PARKER" | "ATTENDANT" | "ADMIN";

export interface User {
  _id?: string;
  role: UserRole;
  phone: string;
  password: string;
  createdAt?: Date;
}

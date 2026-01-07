export interface IContact {
  _id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED";
  adminResponse?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

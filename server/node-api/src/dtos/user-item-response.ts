import { IUser } from "../models/user-model";

export class UserItemResponse {
  constructor(user: IUser) {
    this.id = user.id;
    this.email = user.email;
    this.firstName = user.firstName ?? user.fullName ?? "Unknown"; // See IUser for details
    this.lastName = user.lastName ?? "";
    this.mobile = user.mobile;
    this.role = user.role;
    this.createdAt = user.createdAt;
  }

  id: string;
  email: string;
  firstName: string;
  lastName: string;
  mobile?: string;
  role: string;
  createdAt: Date;
}

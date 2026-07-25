import { IUser } from "../models/user-model";

export class UserItemResponse {
  constructor(user: IUser) {
    this.id = user.id;
    this.email = user.email;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.mobile = user.mobile;
    this.role = user.role;
  }

  id: string;
  email: string;
  firstName: string;
  lastName: string;
  mobile?: string;
  role: string;
}

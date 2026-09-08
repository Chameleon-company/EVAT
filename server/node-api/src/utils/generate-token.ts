import jwt from "jsonwebtoken";
import { IUser } from "../models/user-model";

const secret = process.env.JWT_SECRET;

const generateAccessToken = (user: IUser) => {

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in the environment variables.");
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, type: 'access' },
    secret as string,
    { expiresIn: "15m" }
  );
  return token;
};

const generateRefreshToken = (user: IUser) => {

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in the environment variables.");
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, type: 'refresh' },
    secret as string,
    { expiresIn: "7d" }
  );
  return token;
};


export default generateAccessToken; generateRefreshToken;

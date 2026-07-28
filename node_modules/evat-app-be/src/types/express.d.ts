import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any; // You can change 'any' to your specific User interface/type later
    }
  }
}
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import UserRepository from "../repositories/user-repository";

interface JwtPayload {
  id?: string;
  email?: string;
  role?: string;
  admin?: boolean;
}

export const authGuard = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      // ✅ Admin token path
      if (decoded.admin) {
        if (!allowedRoles.includes('admin')) {
          return res.status(403).json({ message: "Admin not authorized for this route" });
        }

        req.user = {
          id: 'admin',
          email: decoded.email || 'admin@evat.com',
          role: 'admin'
        };

        return next();
      }

      // ✅ Regular user path
      if (!decoded.id) {
        return res.status(401).json({ message: "Invalid token: missing user ID" });
      }

      const user = await UserRepository.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: "User no longer exists" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: "Not authorized to access this route" });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
};
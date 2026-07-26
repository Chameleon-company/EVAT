import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const isAdminAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (!decoded.admin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

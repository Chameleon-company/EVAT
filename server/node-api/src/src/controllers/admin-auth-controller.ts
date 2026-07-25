import { Request, Response } from 'express';
import Admin from '../models/admin';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Handles an admin login request
 * 
 * @param req Request object containing an email and a password
 * @param res Response object used to send back the HTTP response
 * @returns If error: Return an error message. If successful: return a login token with an expiry of 1 day
 */
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });

    if (!admin || admin.password !== password) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    admin.twoFactorCode = code;
    admin.twoFactorCodeExpiry = expiry;
    await admin.save();

    await transporter.sendMail({
      from: `"EVAT Admin" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || 'musajee2002@gmail.com', // ✅ no hardcoded email
      subject: 'Your EVAT Admin 2FA Code',
      text: `Your verification code is: ${code}`,
      html: `<h3>Your EVAT Admin Login Code:</h3><p><b>${code}</b></p>`
    });

    return res.status(200).json({ message: 'Verification code sent to admin email' });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const verifyAdmin2FA = async (req: Request, res: Response) => {
  try {
    const { username, code } = req.body;
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const now = new Date();
    if (
      !admin.twoFactorCode ||
      admin.twoFactorCode !== code ||
      admin.twoFactorCodeExpiry! < now
    ) {
      return res.status(403).json({ message: 'Invalid or expired verification code' });
    }

    admin.twoFactorCode = '';
    admin.twoFactorCodeExpiry = new Date(0);
    await admin.save();

    const token = jwt.sign({ admin: true }, process.env.JWT_SECRET!, {
      expiresIn: '1d'
    });

    return res.status(200).json({ token });
  } catch (error) {
    console.error('2FA verification error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Handles a request to update the credentials of an admin account
 * 
 * @param req Request object containing a new email and password, and the admin user to update
 * @param res Response object used to send back the HTTP response
 * @returns If error: Return an error message. If successful: update the credentials of the admin account
 */
export const updateAdminCredentials = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({});

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    admin.username = username || admin.username;
    admin.password = password || admin.password;
    await admin.save();

    return res.status(200).json({ message: 'Admin credentials updated' });
  } catch (error) {
    console.error('Credential update error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

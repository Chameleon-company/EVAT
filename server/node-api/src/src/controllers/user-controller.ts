import e, { Request, Response } from "express";
import UserService from "../services/user-service";
import { UserItemResponse } from "../dtos/user-item-response";


export default class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Registers a new user
   * 
   * @param req Request object containing a full name, email and password
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data object of the user if the request was successful
   */
  async register(req: Request, res: Response): Promise<Response> {
    const { email, password, firstName, lastName, mobile} = req.body;

    try {
      const user = await this.userService.register(email, password, firstName, lastName, mobile);
      return res
        .status(201)
        .json({ message: "User registered successfully", data: user });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  /**
   * Handles a login request
   * 
   * @param req Request object containing an email and a password
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful
   */
  async login(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body;

    try {
      const data = await this.userService.authenticate(email, password);

      // ✅ Update lastLogin timestamp
      const userToUpdate = await this.userService.getUserById(data.data._id);
      if (userToUpdate) {
        userToUpdate.lastLogin = new Date();
        await userToUpdate.save();
      }

      const token = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };

      return res.status(200).json({
        message: "Login successful",
        data: {
          user: new UserItemResponse(data.data),
          accessToken: token,
        },
      });
    } catch (error: any) {
      return res.status(401).json({ message: error.message });
    }
  }

  /**
   * Handles a request for a new access token
   * 
   * @param req Request object containing an AccessToken
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message and a new AcessToken 
   */
  async refreshToken(req: Request, res: Response): Promise<Response> {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    try {
      const { accessToken } = await this.userService.refreshAccessToken(refreshToken);
      return res.status(200).json({
        message: "Token refreshed successfully",
        data: {
          accessToken,
        },
      });
    } catch (error: any) {
      return res.status(401).json({ message: error.message });
    }
  }

  /**
   * Handles a request to get a user by ID
   * 
   * @param req Request object containing the User ID
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful   
   */
  async getUserById(req: Request, res: Response): Promise<Response> {
    const { user } = req;
    console.log("user", user);
    try {
      const existingUser = await this.userService.getUserById(user?.id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(200).json({
        message: "success",
        data: new UserItemResponse(existingUser),
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Handles adding/updating payment information for the user
   * 
   * @param req Request object containing the User ID
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful   
   */
  
  // async updatePaymentInfo(req: Request, res: Response): Promise<Response> {
  //   const { user } = req;
  //   const { cardNumber, expiryDate, cvv, billingAddress } = req.body;

  //   try {
  //     if (!cardNumber || !expiryDate || !cvv) {
  //       return res.status(400).json({ message: "Missing payment fields" });
  //     }

  //     const updatedUser = await this.userService.addOrUpdatePaymentInfo(user.id, {
  //       cardNumber,
  //       expiryDate,
  //       cvv,
  //       billingAddress,
  //     });

  //     if (!updatedUser) {
  //     return res.status(404).json({ message: "Updated user not found" }); //handles warning for if theres no updated user
  //     }

  //     return res.status(200).json({
  //       message: "Payment information updated successfully",
  //       data: updatedUser.paymentInfo, // don’t send sensitive fields back
  //     });
  //   } catch (error: any) {
  //     return res.status(500).json({ message: error.message });
  //   }
  // }

  /**
   * Handles a request to get a user by an input email
   * 
   * @param req Request object containing an email address
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful   
   */
  async getUserByEmail(req: Request, res: Response): Promise<Response> {
    const {email} = req.query;
    try {
      const existingUser = await this.userService.getUserByEmail(email as string);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(200).json({
        message: "success",
        data: new UserItemResponse(existingUser),
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Handles a request to get all users (Admin only)
   * 
   * @param req --Not used in this segment--
   * @param res Response object used to send back the HTTP response 
   * @returns Returns the status code, a relevant message, and the data if the request was successful
   */
  async getAllUser(req: Request, res: Response): Promise<Response> {
    try {
      const existingUsers = await this.userService.getAllUser();
      return res.status(200).json({
        message: "success",
        data: existingUsers.map((u) => new UserItemResponse(u)),
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * PUT /api/auth/profile
   * Update the authenticated user's own profile.
   */
  async updateUserProfile(req: Request, res: Response): Promise<Response> {
    try {
      const userIdFromToken = (req.user as any)?.id || (req.user as any)?._id;
      const userId = String(userIdFromToken || req.body?.id);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const {
        role,
        password,
        refreshToken,
        refreshTokenExpiresAt,
        ...safeBody
      } = (req.body || {}) as Record<string, unknown>;

      await this.userService.updateSelf(userId, safeBody);

      const user = await this.userService.getUserById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const data = {
        id: String((user as any)._id ?? (user as any).id),
        firstName: String((user as any).firstName ?? ""),
        lastName: String((user as any).lastName ?? ""),
        email: String((user as any).email ?? ""),
        mobile: String((user as any).mobile ?? "")
      };

      return res.status(200).json({ message: "success", data });
    } catch (e: any) {
      const msg = e?.message || "Bad request";
      const code = /No valid fields|already in use/i.test(msg) ? 400 : 500;
      return res.status(code).json({ message: msg });
    }
  }
}

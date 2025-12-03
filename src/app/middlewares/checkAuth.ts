import { NextFunction, Request, Response } from "express";
import AppError from "../errorHelpers/AppError";
import jwt, { JwtPayload } from "jsonwebtoken";
import { envVars } from "../config/env";
import status from "http-status";
import { User } from "../modules/user/user.model";

export const checkAuth =
  (...authRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.headers.authorization || req.cookies.accessToken;

      if (!accessToken) {
        throw new AppError(status.FORBIDDEN, "Not token received");
      }

      const verifiedToken = jwt.verify(
        accessToken as string,
        envVars.JWT.JWT_ACCESS_SECRET
      ) as JwtPayload;

      const isUserExist = await User.findOne({ email: verifiedToken.email });

      if (!isUserExist) {
        throw new AppError(status.BAD_REQUEST, "User does not exist");
      }
      if (!isUserExist.isVerified) {
        throw new AppError(status.BAD_REQUEST, "User is not verified");
      }
      if (isUserExist.isDeleted) {
        throw new AppError(status.BAD_REQUEST, "User is deleted");
      }

      // authRoles = ["ADMIN", "SUPER_ADMIN" ]
      if (!authRoles.includes(verifiedToken.role)) {
        throw new AppError(
          status.FORBIDDEN,
          "You are not permitted to view this route!"
        );
      }

      req.user = verifiedToken;
      next();
    } catch (error) {
      next(error);
    }
  };

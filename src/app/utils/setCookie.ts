import { Response } from "express";

export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
}

export const setAuthCookie = (res: Response, tokenInfo: AuthTokens) => {
  if (tokenInfo.accessToken) {
    res.cookie("accessToken", tokenInfo.accessToken, {
      httpOnly: true,
      // local - samin sir
      // secure: false
      // live link- samin sir
      // secure: envVars.NODE_ENV === "production",
      // sameSite: "none"
      // live link- mir sir
      secure: true,
      sameSite: "none",
    });
  }

  if (tokenInfo.refreshToken) {
    res.cookie("refreshToken", tokenInfo.refreshToken, {
      httpOnly: true,
      // local - samin sir
      // secure: false
      // live link- samin sir
      // secure: envVars.NODE_ENV === "production",
      // sameSite: "none"
      // live link- mir sir
      secure: true,
      sameSite: "none",
    });
  }
};

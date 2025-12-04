"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAuthCookie = void 0;
const setAuthCookie = (res, tokenInfo) => {
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
exports.setAuthCookie = setAuthCookie;

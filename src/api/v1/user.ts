import { httpClient } from "../interceptors";
import type { Resp } from "../response";

export interface UserInfo {
  avatar: string;
  email: string;
  enableMFA: boolean;
  id: number;
  username: string;
}

export const getUserInfo = (): Resp<UserInfo> => {
  return httpClient.get("/v1/users/me")
}

export interface EditableUserInfo {
  username?: string
  email?: string
  avatar?: string
}

export const updateUserInfo = (data: EditableUserInfo): Resp<void> => {
  return httpClient.patch("/v1/users/me", data)
}

export const changePassword = (oldPassword: string, newPassword: string): Resp<void> => {
  return httpClient.put("/v1/users/me/password", { oldPassword, newPassword })
}

// ── MFA ──
export interface TOTPSecret {
  secret: string
  accountName: string
  issuer: string
  url: string
}

export const generateTOTPSecret = (password: string): Resp<TOTPSecret> => {
  return httpClient.post("/v1/users/me/mfa/totp-secret", { password })
}

export const enableMFA = (password: string, otp: string): Resp<void> => {
  return httpClient.put("/v1/users/me/mfa/enable", { password, otp })
}

export const disableMFA = (password: string, otp: string): Resp<void> => {
  return httpClient.put("/v1/users/me/mfa/disable", { password, otp })
}
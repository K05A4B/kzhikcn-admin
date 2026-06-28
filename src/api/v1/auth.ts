import { httpClient } from "../interceptors";
import type { Resp } from "../response";

interface AuthorizedResponse {
  status: "authorized";
  token: string;        
}

interface NeedMFAResponse {
  status: "needMFA";
  challengeId: string;  
}

type LoginResponse = AuthorizedResponse | NeedMFAResponse;

interface TOTPVerifyResponse {
  token?: string;
}

export const login = (username: string, password: string): Resp<LoginResponse>  =>  {
  return httpClient.post("/v1/auth/login", {
    username,
    password,
  })
}

export const logout = (): Resp<LoginResponse>  =>  {
  return httpClient.post("/v1/auth/logout")
}

export const totpVerify = (challengeId: string, otp: string): Resp<TOTPVerifyResponse> =>  {
  return httpClient.post("/v1/auth/mfa/totp", {
    challengeId,
    otp,
  });
}
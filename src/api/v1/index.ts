import { httpClient } from "../interceptors"
import type { Resp } from "../response"


export * from "./auth"
export * from "./user"
export * from "./articles"
export * from "./categories"
export * from "./tags"

export interface PingResponse {
  apiVersion: string
  ip: string
  serverVersion: string
  timestamp: number
}

export const ping = async (): Resp<PingResponse> => {
  const result = await httpClient.post("/v1/ping", null)
  const data = result.data.data as unknown as Record<string, string>

  result.data.data = {
    apiVersion: data.api_version!,
    ip: data.ip!,
    serverVersion: data.server_version!,
    timestamp: Number(data.timestamp!),
  }

  return result
}
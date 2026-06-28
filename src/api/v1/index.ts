import { httpClient } from "../interceptors"

export * from "./auth"
export * from "./user"
export * from "./articles"
export * from "./categories"
export * from "./tags"

export const ping = () => {
  return httpClient.post("/v1/ping")
}
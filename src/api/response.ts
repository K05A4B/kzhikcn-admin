import type { AxiosResponse } from "axios";

export interface HttpResponse<T> {
  code: number;
  success: boolean;
  message: string;
  data: T;
  meta: Record<string, unknown>;
  errorCode?: string;
  traceId?: string;
}

export type Resp<T> = Promise<AxiosResponse<HttpResponse<T>>>;

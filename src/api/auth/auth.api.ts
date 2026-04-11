import api from "@/lib/axios";
import type { ApiResponse } from "@/interface/api.interface";

export const logOut = async (): Promise<ApiResponse<null>> => {
  const response = await api.post<ApiResponse<null>>("/auth/logout");
  return response.data;
};

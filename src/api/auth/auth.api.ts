import api from "@/lib/axios";
import type { ApiResponse } from "@/interface/api.interface";
import type {
  IAuthData,
  ILoginUserParams,
  IRegisterUserParams,
} from "./auth.interface";

export const logOut = async (): Promise<ApiResponse<null>> => {
  const response = await api.post<ApiResponse<null>>("/auth/logout");
  return response.data;
};

export const registerUser = async (
  params: IRegisterUserParams,
): Promise<ApiResponse<null>> => {
  const response = await api.post<ApiResponse<null>>("/auth/register", params);
  return response.data;
};

export const checkEmailExists = async (email: string): Promise<string> => {
  const response = await api.post<ApiResponse<null>>(`/users/check-email`, {
    email,
  });

  return response.data.message;
};

export const checkReferrerCodeExists = async (
  referralCode: string,
): Promise<string> => {
  const response = await api.get<ApiResponse<null>>(
    `/users/referral/${referralCode}`,
  );

  return response.data.message;
};

export const loginUser = async (
  params: ILoginUserParams,
): Promise<ApiResponse<IAuthData>> => {
  const response = await api.post<ApiResponse<IAuthData>>(
    `/auth/login`,
    params,
  );
  return response.data;
};

import api from "@/lib/axios";
import type { ApiResponse } from "@/interface/api.interface";
import type {
  IAuthData,
  ILoginUserParams,
  IRegisterUserParams,
  IUpdatePasswordParams,
  IUserSession,
  IVerifyUserPayload,
} from "./auth.interface";
import type { IForgotPasswordVerificationParams } from "@/pages/auth/forgot-password-verification/components/forgot-password-verification.schema";

export const logOut = async (): Promise<ApiResponse<null>> => {
  const response = await api.post<ApiResponse<null>>("/auth/logout");
  return response.data;
};

export const registerUser = async (
  params: IRegisterUserParams
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
  referralCode: string
): Promise<string> => {
  const response = await api.get<ApiResponse<null>>(
    `/users/referral/${referralCode}`
  );

  return response.data.message;
};

export const loginUser = async (
  params: ILoginUserParams
): Promise<ApiResponse<IAuthData>> => {
  const response = await api.post<ApiResponse<IAuthData>>(
    `/auth/login`,
    params
  );
  return response.data;
};

export const requestForgotPassword = async (
  email: string
): Promise<ApiResponse<null>> => {
  const response = await api.post<ApiResponse<null>>(
    `/auth/request-forgot-password`,
    { email }
  );
  return response.data;
};

export const checkResetTokenValidity = async (
  token: string
): Promise<ApiResponse<1 | 0>> => {
  const response = await api.get<ApiResponse<1 | 0>>(`/auth/token/${token}`);
  return response.data;
};

export const forgotPasswordVerification = async (
  params: IForgotPasswordVerificationParams,
  token: string
): Promise<ApiResponse<null>> => {
  const response = await api.post<ApiResponse<null>>(
    `/auth/forgot-password/${token}`,
    {
      newPassword: params.newPassword,
    }
  );
  return response.data;
};

export const verifyUser = async (
  token: string
): Promise<ApiResponse<IVerifyUserPayload>> => {
  const response = await api.post<ApiResponse<IVerifyUserPayload>>(
    `/auth/verify/${token}`
  );
  return response.data;
};

export const meApi = async (): Promise<ApiResponse<IUserSession>> => {
  const response = await api.get<ApiResponse<IUserSession>>(`/users/me`);
  return response.data;
};

export const changeAvatarApi = async (
  formData: FormData
): Promise<ApiResponse<IUserSession>> => {
  const response = await api.patch<ApiResponse<IUserSession>>(
    "/users/avatar",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const updatePasswordApi = async (
  params: IUpdatePasswordParams
): Promise<ApiResponse<null>> => {
  const response = await api.post<ApiResponse<null>>(
    "/auth/update-password",
    params
  );

  return response.data;
};

export const resendVerificationEmailApi = async (): Promise<
  ApiResponse<null>
> => {
  const response = await api.post<ApiResponse<null>>(
    "/auth/resend-verification-email"
  );

  return response.data;
};

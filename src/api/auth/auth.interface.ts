export type TUserRole = "CUSTOMER" | "ORGANIZER";

export interface IRegisterUserParams {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: TUserRole;
  referrerCode?: string;
}

export interface ILoginUserParams {
  email: string;
  password: string;
}

export interface IUpdatePasswordParams {
  oldPassword: string;
  newPassword: string;
}

export interface IUserSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: TUserRole;
  avatarUrl: string | null;
  isVerified: boolean;
}

export interface IAuthData {
  accessToken: string;
  user: IUserSession;
}

export interface IEmailPayload {
  email: string;
}

export interface IVerifyUserPayload {
  accessToken: string;
  user: IUserSession;
}

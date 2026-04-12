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

export interface IUserSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: TUserRole;
  avatarUrl: string | null;
}

export interface IAuthData {
  accessToken: string;
  user: IUserSession;
}

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface IUserParams {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl: string | null;
  isVerified: boolean;
}

type UserPayload = IUserParams | { user: IUserParams };

const normalizeUser = (payload: UserPayload): IUserParams =>
  "user" in payload ? payload.user : payload;

interface IAuthStore {
  user: IUserParams | null;
  accessToken: string | null;
  isHydrated: boolean;
  setSession: (user: UserPayload, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: UserPayload) => void;
  setHydrated: (state: boolean) => void;
  clearSession: () => void;
}

export const useAuthStore = create<IAuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isHydrated: false,

      setSession: (user, accessToken) =>
        set({
          user: normalizeUser(user),
          accessToken,
        }),

      setAccessToken: (accessToken) =>
        set({
          accessToken,
        }),

      setHydrated: (state) =>
        set({
          isHydrated: state,
        }),
      setUser: (user) => {
        set({
          user: normalizeUser(user),
        });
      },

      clearSession: () =>
        set({
          user: null,
          accessToken: null,
        }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Failed to hydrate auth store", error);
        }

        const hydratedUser = state?.user as UserPayload | null | undefined;

        if (hydratedUser && !("firstName" in hydratedUser) && "user" in hydratedUser) {
          state?.setUser(hydratedUser);
        }

        state?.setHydrated(true);
      },
    }
  )
);

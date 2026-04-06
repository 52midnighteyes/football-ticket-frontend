import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface IUserParams {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface IAuthStore {
  user: IUserParams | null;
  accessToken: string | null;
  isHydrated: boolean;
  setSession: (user: IUserParams, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
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
          user,
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

        state?.setHydrated(true);
      },
    },
  ),
);

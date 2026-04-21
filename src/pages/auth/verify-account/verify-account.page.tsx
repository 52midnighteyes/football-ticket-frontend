import { verifyUser } from "@/api/auth/auth.api";
import { useAuthStore } from "@/store/auth.store";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";
import type { IUserSession } from "@/api/auth/auth.interface";
import { Spinner } from "@/components/ui/spinner";
import RedirectCard from "@/components/redirect-card";

export default function VerifyAccountPage() {
  const { token } = useParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const session = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isActiveSession = isHydrated && !!session;
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    if (!isHydrated) return;
    let isCancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const finishWithRedirect = (
      message: string,
      path: string,
      hasError: boolean
    ) => {
      if (isCancelled) return;

      setErrorMessage(hasError ? message : null);
      setIsError(hasError);
      setIsLoading(false);

      if (hasError) {
        toast.error(message);
      } else {
        toast.success(message);
      }

      timer = setTimeout(() => {
        navigate(path);
      }, 3000);
    };

    const verify = async () => {
      if (!token) {
        finishWithRedirect(
          "Invalid verification link. Please request a new verification email.",
          "/",
          true
        );
        return;
      }

      if (!isActiveSession || !session) {
        finishWithRedirect(
          "Please login to your account to verify your email.",
          "/login",
          true
        );
        return;
      }

      let decoded: IUserSession;

      try {
        decoded = jwtDecode(token);
      } catch {
        finishWithRedirect(
          "Invalid verification link. Please request a new verification email.",
          "/",
          true
        );
        return;
      }

      if (session.id !== decoded.id) {
        finishWithRedirect(
          "Unauthorized access. Please login to the correct account to verify.",
          "/",
          true
        );
        return;
      }

      if (session.isVerified) {
        finishWithRedirect("Your account is already verified.", "/", true);
        return;
      }

      try {
        const response = await verifyUser(token);
        if (!response.data || isCancelled) return;
        setSession(response.data.user, response.data.accessToken);
        finishWithRedirect(
          "Your account has been successfully verified. You can now access all features.",
          "/",
          false
        );
      } catch (error) {
        if (isCancelled) return;

        if (error instanceof axios.AxiosError && error.response) {
          finishWithRedirect(
            error.response.data.message ||
              "AXIOS: Verification failed. Please request a new verification email.",
            "/",
            true
          );
          return;
        }

        finishWithRedirect(
          "NORMAL FALLBACK: Verification failed. Please request a new verification email.",
          "/",
          true
        );
      }
    };

    verify();

    return () => {
      isCancelled = true;

      if (timer) {
        clearTimeout(timer);
      }
    };
    // This flow should run once after hydration for the current verification token.
    // Adding session to the deps can re-run the verification after setSession updates it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isHydrated, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-background px-10 pt-10">
        <Spinner className="scale-200" />
      </div>
    );
  }

  if (!isActiveSession) {
    return (
      <RedirectCard
        title="You need to log in"
        description={errorMessage ?? "Please login to continue."}
      />
    );
  }

  if (!token || isError) {
    return (
      <RedirectCard
        title="Verification Failed"
        description={errorMessage ?? "Verification failed."}
      />
    );
  }

  return (
    <RedirectCard
      title="Verification Successful"
      description="Your account has been successfully verified."
    />
  );
}

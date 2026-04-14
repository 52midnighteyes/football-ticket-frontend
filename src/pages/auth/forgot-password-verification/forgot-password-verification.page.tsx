import { useNavigate, useParams } from "react-router";
import ForgotPasswordVerificationForm from "./components/form";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { checkResetTokenValidity } from "@/api/auth/auth.api";
import axios from "axios";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export default function ForgotPasswordVerificationPage() {
  const [isSubmitted, setIsSubmitted] = useState<boolean | null>(null);
  const [tokenStatus, setTokenStatus] = useState<"checking" | "valid">(
    "checking",
  );

  const userSession = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isActiveSession = isHydrated && !!userSession;
  const isLoading = !isHydrated || tokenStatus === "checking";

  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const handleSubmitChange = (submitted: boolean) => {
    setIsSubmitted(submitted);
  };

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    if (!isHydrated) return;

    if (isActiveSession) {
      const timer = setTimeout(() => {
        navigate("/");
      }, 3000);

      return () => clearTimeout(timer);
    }

    let isCancelled = false;

    const checkToken = async () => {
      try {
        const response = await checkResetTokenValidity(token);

        if (isCancelled) return;

        if (response.data === 0) {
          toast.error(
            "Invalid or expired token. Please request a new password reset.",
          );
          navigate("/");
          return;
        }

        toast.success(response.message);
        setTokenStatus("valid");
      } catch (error) {
        if (isCancelled) return;

        if (error instanceof axios.AxiosError && error.response) {
          toast.error(
            error.response.data.message ||
              "Invalid or expired token. Please request a new password reset.",
          );
        } else {
          toast.error(
            "Invalid or expired token. Please request a new password reset.",
          );
        }

        navigate("/");
      }
    };

    checkToken();

    return () => {
      isCancelled = true;
    };
  }, [token, isHydrated, isActiveSession, navigate]);

  useEffect(() => {
    if (!isSubmitted) return;
    const timer = setTimeout(() => {
      navigate("/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, [isSubmitted, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-background px-10 pt-10">
        <Spinner className="scale-200" />
      </div>
    );
  }

  if (isActiveSession) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-background px-10 pt-10">
        <div className="flex w-full min-w-70 max-w-105 h-fit flex-col items-center gap-2 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-md">
          <h3 className="text-primary  font-bold">
            You are currently logged in
          </h3>
          <p className="font-medium text-center text-muted-foreground">
            You need to log out before you can reset your password.
          </p>

          <div className="flex items-center gap-1 mt-2">
            <Spinner />
            <p className="text-sm -translate-y-1 text-accent mt-2">
              redirecting ...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-background px-10 pt-10">
        <div className="flex w-full min-w-70 max-w-105 h-fit flex-col items-center gap-2 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-md">
          <h3 className="text-primary font-bold text-center">
            Your password has been successfully reset
          </h3>
          <p className="font-medium text-center text-muted-foreground">
            You can now log in with your new password. Don't lose it again!
          </p>

          <div className="flex items-center gap-1 mt-2">
            <Spinner />
            <p className="text-sm -translate-y-1 text-accent mt-2">
              redirecting ...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-background px-10 pt-10">
      <div className="flex flex-col items-center text-center">
        <h2 className="text-primary font-black">RESET YOUR PASSWORD</h2>
        <p className="text-sm text-muted-foreground">
          Please enter your new password below.
        </p>
      </div>

      <ForgotPasswordVerificationForm
        onSubmitChange={handleSubmitChange}
        token={token!}
      />
    </div>
  );
}

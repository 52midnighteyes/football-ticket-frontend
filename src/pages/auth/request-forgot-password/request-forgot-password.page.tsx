import { useEffect, useState } from "react";
import RequestForgotPasswordForm from "./components/form";
import { useAuthStore } from "@/store/auth.store";
import { Link, useNavigate } from "react-router";
import { Spinner } from "@/components/ui/spinner";

export default function RequestForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState<boolean | null>(null);

  const userSession = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const handleSubmitChange = (submitted: boolean) => {
    setIsSubmitted(submitted);
  };

  useEffect(() => {
    if (!isHydrated) return;
    if (userSession) {
      navigate("/");
    }
  }, [userSession, isHydrated, navigate]);

  useEffect(() => {
    if (!isSubmitted) return;

    const timer = setTimeout(() => {
      navigate("/");
    }, 3000);

    return () => clearTimeout(timer);
  }, [isSubmitted, navigate]);

  if (!isSubmitted)
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-background px-10 pt-10">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-primary font-black">FORGOT YOUR PASSWORD?</h2>
          <p className="text-sm text-muted-foreground">
            enter the email you used to register your account.
          </p>
        </div>
        <RequestForgotPasswordForm onSubmitChange={handleSubmitChange} />

        <div>
          <p>
            Remembered your password?{" "}
            <Link
              to="/login"
              className="text-primary font-medium hover:underline"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    );

  if (isSubmitted)
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-background px-10 pt-10">
        <div className="flex w-full min-w-70 max-w-105 h-fit flex-col items-center gap-2 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-md">
          <h3 className="text-primary  font-bold">Request Submitted</h3>
          <p className="font-medium text-center text-muted-foreground">
            If the email address you entered is associated with an account, a
            password reset link will be sent shortly.
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

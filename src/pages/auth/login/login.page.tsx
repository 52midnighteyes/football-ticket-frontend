import { Link, useNavigate } from "react-router";
import LoginForm from "./components/form";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";

export default function LoginPage() {
  const userSession = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;
    if (userSession) {
      navigate("/");
    }
  }, [userSession, isHydrated, navigate]);
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-background px-6 py-15">
      <div className="text-center">
        <h2 className="font-black text-primary">LOGIN</h2>
        <p className="text-sm text-muted-foreground">
          Please enter your credentials to login.
        </p>
      </div>

      <LoginForm />

      <div className="mt-1 text-center">
        <span>
          Forgot your password?{" "}
          <Link
            to="/forgot-password"
            className="font-medium text-primary hover:underline"
          >
            Reset here
          </Link>
        </span>
      </div>
    </div>
  );
}

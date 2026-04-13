import { Link, useNavigate } from "react-router";
import RegisterForm from "./components/form";
import { useAuthStore } from "@/store/auth.store";
import { useEffect } from "react";

export default function RegisterPage() {
  const userSession = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;
    if (userSession) {
      navigate("/");
    }
  }, [userSession, isHydrated]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-background px-10 pt-10">
      <div className="flex flex-col items-center text-center">
        <h2 className="text-primary font-black">REGISTER</h2>
        <p className="text-sm text-muted-foreground">
          Please fill in the form to create an account.
        </p>
      </div>

      <RegisterForm />

      <div className="mt-1 flex items-center gap-1.5">
        <p>Already have an account?</p>
        <Link to="/login" className="font-medium text-primary hover:underline">
          Login here
        </Link>
      </div>
    </div>
  );
}

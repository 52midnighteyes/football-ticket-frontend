import { Field, Form, Formik, ErrorMessage } from "formik";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { useEffect, useRef, useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { loginUser } from "@/api/auth/auth.api";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/store/auth.store";

export default function LoginForm() {
  const [isHidden, setIsHidden] = useState(true);

  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const inputRef = useRef<HTMLInputElement>(null);

  const initialValues = {
    email: "",
    password: "",
  };

  const onSubmit = async (values: typeof initialValues) => {
    try {
      const response = await loginUser(values);
      if (!response.data) throw new Error("Invalid response from server");

      setSession(response.data.user, response.data.accessToken);
      toast.success("Login successful!");
      navigate("/");
    } catch {
      toast.error("An error occurred while submitting the form.");
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      {({ isSubmitting }) => (
        <Form className="flex h-fit w-full min-w-70 max-w-105 flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-md">
          <div className="w-full">
            <Label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email
            </Label>
            <Field
              ref={inputRef}
              as={Input}
              id="email"
              name="email"
              type="email"
              placeholder="example@email.com"
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <ErrorMessage
              name="email"
              component="div"
              className="mt-1 text-sm text-destructive"
            />
          </div>

          <div className="w-full">
            <Label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Password
            </Label>

            <div className="relative w-full">
              <Field
                as={Input}
                id="password"
                name="password"
                type={isHidden ? "password" : "text"}
                placeholder="Enter your password"
                className="border-input bg-background pr-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />

              <button
                type="button"
                aria-label={isHidden ? "Show password" : "Hide password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-accent"
                onClick={() => setIsHidden((prev) => !prev)}
              >
                {isHidden ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            <ErrorMessage
              name="password"
              component="div"
              className="mt-1 text-sm text-destructive"
            />
          </div>

          <Button
            type="submit"
            className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isSubmitting}
          >
            Login
          </Button>
        </Form>
      )}
    </Formik>
  );
}

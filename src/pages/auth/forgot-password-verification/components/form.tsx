import { Formik, Form, Field, ErrorMessage } from "formik";
import {
  forgotPasswordVerificationSchema,
  type IForgotPasswordVerificationParams,
} from "./forgot-password-verification.schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { forgotPasswordVerification } from "@/api/auth/auth.api";
import axios from "axios";
import type { ForgotPasswordVerificationFormProps } from "./types";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function ForgotPasswordVerificationForm({
  onSubmitChange,
  token,
}: ForgotPasswordVerificationFormProps) {
  const [isHidden, setIsHidden] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);

  const onSubmit = async (
    values: IForgotPasswordVerificationParams,
    { setStatus }: { setStatus: (status?: string) => void },
  ) => {
    setStatus(undefined);

    try {
      const response = await forgotPasswordVerification(values, token);
      if (!response.message) {
        const errorMessage = "Failed to reset password. Please try again.";
        setStatus(errorMessage);
        toast.error(errorMessage);
        return;
      }
      toast.success(response.message);
      onSubmitChange(true);
    } catch (error) {
      if (error instanceof axios.AxiosError && error.response) {
        const errorMessage =
          error.response.data.message || "An error occurred. Please try again.";
        setStatus(errorMessage);
        toast.error(errorMessage);
        return;
      }

      setStatus("An error occurred. Please try again.");
      toast.error("An error occurred. Please try again.");
    }
  };

  const initialValues: IForgotPasswordVerificationParams = {
    newPassword: "",
    confirmPassword: "",
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={forgotPasswordVerificationSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting, status }) => (
        <Form className="flex h-fit w-full min-w-70 max-w-105 flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-md">
          <div className="w-full gap-1.5">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative w-full">
              <Field
                as={Input}
                ref={inputRef}
                id="newPassword"
                type={isHidden ? "password" : "text"}
                name="newPassword"
                placeholder="New Password"
                className="border-input bg-background pr-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />

              <button
                type="button"
                aria-label={isHidden ? "Show password" : "Hide password"}
                onClick={() => setIsHidden((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-accent"
              >
                {isHidden ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            <ErrorMessage
              name="newPassword"
              component="div"
              className="text-sm text-destructive"
            />
          </div>

          <div className="w-full gap-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Field
              name="confirmPassword"
              type={isHidden ? "password" : "text"}
              placeholder="Confirm Password"
              as={Input}
            />
            <ErrorMessage
              name="confirmPassword"
              component="div"
              className="text-sm text-destructive"
            />
          </div>

          {status ? (
            <div className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {status}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            Submit
          </Button>
        </Form>
      )}
    </Formik>
  );
}

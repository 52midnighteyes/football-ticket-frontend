import { Formik, Field, Form, ErrorMessage } from "formik";
import { requestForgotPasswordSchema } from "./request-forgot-password.schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { IEmailPayload } from "@/api/auth/auth.interface";
import { requestForgotPassword } from "@/api/auth/auth.api";
import { toast } from "sonner";
import axios from "axios";
import { useEffect, useRef } from "react";

export default function RequestForgotPasswordForm({
  onSubmitChange,
}: {
  onSubmitChange: (submitted: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleSubmit = async (
    values: IEmailPayload,
    { setStatus }: { setStatus: (status?: string) => void },
  ) => {
    setStatus(undefined);

    try {
      const response = await requestForgotPassword(values.email);
      if (!response.message) {
        const errorMessage = "Failed to send reset password email. Please try again.";
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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  return (
    <Formik
      initialValues={{ email: "" }}
      validationSchema={requestForgotPasswordSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, status }) => (
        <Form className="flex w-full min-w-70 max-w-105 h-fit flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-md">
          <div className="w-full">
            <label htmlFor="email">Email</label>
            <Field as={Input} ref={inputRef} type="email" name="email" />
            <ErrorMessage
              name="email"
              component="div"
              className="text-sm text-destructive"
            />
          </div>

          {status ? (
            <div className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {status}
            </div>
          ) : null}

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            Submit
          </Button>
        </Form>
      )}
    </Formik>
  );
}

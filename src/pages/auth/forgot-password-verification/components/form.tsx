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

export default function ForgotPasswordVerificationForm({
  onSubmitChange,
  token,
}: ForgotPasswordVerificationFormProps) {
  const onSubmit = async (values: IForgotPasswordVerificationParams) => {
    try {
      const response = await forgotPasswordVerification(values, token);
      if (!response.message) {
        toast.error("Failed to reset password. Please try again.");
        return;
      }
      toast.success(response.message);
      onSubmitChange(true);
    } catch (error) {
      if (error instanceof axios.AxiosError && error.response) {
        toast.error(
          error.response.data.message || "An error occurred. Please try again.",
        );
      }

      toast.error("An error occurred. Please try again.");
    }
  };

  const initialValues: IForgotPasswordVerificationParams = {
    newPassword: "",
    confirmPassword: "",
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={forgotPasswordVerificationSchema}
      onSubmit={(values) => onSubmit(values)}
    >
      {({ isSubmitting }) => (
        <Form className="flex h-fit w-full min-w-70 max-w-105 flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-md">
          <div className="w-full gap-1">
            <Label htmlFor="newPassword">New Password</Label>
            <Field
              name="newPassword"
              type="password"
              placeholder="New Password"
              as={Input}
            />
            <ErrorMessage
              name="newPassword"
              component="div"
              className="text-sm text-destructive"
            />
          </div>

          <div className="w-full gap-1">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Field
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              as={Input}
            />
            <ErrorMessage
              name="confirmPassword"
              component="div"
              className="text-sm text-destructive"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            Submit
          </Button>
        </Form>
      )}
    </Formik>
  );
}

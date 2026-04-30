import { updatePasswordApi } from "@/api/auth/auth.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { updatePasswordSchema } from "./schema";

interface UpdatePasswordFormValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UpdatePasswordForm({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [isHidden, setIsHidden] = useState(true);

  const initialValues: UpdatePasswordFormValues = {
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  };

  const handleSubmit = async (values: UpdatePasswordFormValues) => {
    try {
      await updatePasswordApi({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });

      toast.success("Password updated!");
      onSuccess();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update password";
      toast.error(message);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={updatePasswordSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting }) => (
        <Form className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="oldPassword">Old password</Label>
            <div className="relative w-full">
              <Field
                as={Input}
                id="oldPassword"
                name="oldPassword"
                type={isHidden ? "password" : "text"}
                autoComplete="current-password"
                className="pr-10"
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
              name="oldPassword"
              component="div"
              className="text-sm text-destructive"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Field
              as={Input}
              id="newPassword"
              name="newPassword"
              type={isHidden ? "password" : "text"}
              autoComplete="new-password"
            />
            <ErrorMessage
              name="newPassword"
              component="div"
              className="text-sm text-destructive"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Field
              as={Input}
              id="confirmPassword"
              name="confirmPassword"
              type={isHidden ? "password" : "text"}
              autoComplete="new-password"
            />
            <ErrorMessage
              name="confirmPassword"
              component="div"
              className="text-sm text-destructive"
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update password"}
          </Button>
        </Form>
      )}
    </Formik>
  );
}

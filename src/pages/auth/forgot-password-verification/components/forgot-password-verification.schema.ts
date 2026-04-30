import * as Yup from "yup";

export interface IForgotPasswordVerificationParams {
  newPassword: string;
  confirmPassword: string;
}

export const forgotPasswordVerificationSchema: Yup.ObjectSchema<IForgotPasswordVerificationParams> =
  Yup.object({
    newPassword: Yup.string()
      .required("Password is required")
      .max(20, "Password must not exceed 20 characters")
      .matches(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
        "Min 8 chars, 1 uppercase, 1 number, 1 symbol.",
      ),

    confirmPassword: Yup.string()
      .required("Confirm password is required")
      .oneOf([Yup.ref("newPassword")], "Passwords must match"),
  });

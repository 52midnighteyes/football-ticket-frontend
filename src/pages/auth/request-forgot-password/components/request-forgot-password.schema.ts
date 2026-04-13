import * as yup from "yup";

export const requestForgotPasswordSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .email("Email format is invalid")
    .required("Email is required"),
});

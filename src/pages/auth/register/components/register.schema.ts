import * as Yup from "yup";

const userRoles = ["CUSTOMER", "ORGANIZER"] as const;

export const registerUserSchema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .email("Email format is invalid")
    .required("Email is required"),

  firstName: Yup.string().trim().required("First name is required"),

  lastName: Yup.string().trim().required("Last name is required"),

  password: Yup.string()
    .required("Password is required")
    .max(20, "Password must not exceed 20 characters")
    .matches(
      /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
      "Min 8 chars, 1 uppercase, 1 number, 1 symbol.",
    ),

  role: Yup.mixed()
    .oneOf(userRoles, "Role must be USER or ORGANIZER")
    .default("CUSTOMER"),

  referrerCode: Yup.string()
    .min(6, "Referral code must be at least 6 characters")
    .optional(),
});

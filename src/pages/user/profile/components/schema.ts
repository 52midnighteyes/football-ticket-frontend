import * as Yup from "yup";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export const changeAvatarSchema = Yup.object({
  avatar: Yup.mixed<File>()
    .required("Avatar is required")
    .test({
      name: "fileValidation",
      message: "Avatar must be JPG, PNG, or WEBP and max 2MB.",
      test(value) {
        if (!(value instanceof File)) return false;
        return allowedMimeTypes.has(value.type) && value.size <= MAX_FILE_SIZE;
      },
    }),
});

export const updatePasswordSchema = Yup.object({
  oldPassword: Yup.string().required("Old password is required"),
  newPassword: Yup.string()
    .required("Password is required")
    .max(20, "Password must not exceed 20 characters")
    .matches(
      /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
      "Password must be at least 8 characters long and include at least 1 uppercase letter, 1 number, and 1 special character"
    ),
  confirmPassword: Yup.string()
    .required("Confirm password is required")
    .oneOf([Yup.ref("newPassword")], "Confirm password must match"),
});

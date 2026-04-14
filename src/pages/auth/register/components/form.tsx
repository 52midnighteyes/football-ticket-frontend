import type { IRegisterUserParams } from "@/api/auth/auth.interface";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { registerUserSchema } from "./register.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  checkEmailExists,
  checkReferrerCodeExists,
  registerUser,
} from "@/api/auth/auth.api";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hook/useDebounce";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import axios from "axios";
import { EyeOffIcon, EyeIcon } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [referral, setReferral] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const [referralMsg, setReferralMsg] = useState("");
  const [isEmailAvailable, setIsEmailAvailable] = useState(false);
  const [isReferralValid, setIsReferralValid] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [isHidden, setIsHidden] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const emailQuery = useDebounce(email);
  const referralQuery = useDebounce(referral);
  const navigate = useNavigate();

  const initialValues: IRegisterUserParams = {
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    role: "CUSTOMER",
    referrerCode: "",
  };

  const onSubmit = async (values: IRegisterUserParams) => {
    try {
      await registerUser(values);
      toast.success("Registration successful! Please log in.");
      navigate("/login");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Registration failed");
        return;
      }

      toast.error("Registration failed");
    }
  };

  useEffect(() => {
    let isMounted = true;

    const checkEmailAvailability = async () => {
      if (
        emailQuery.trim() === "" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailQuery)
      ) {
        if (!isMounted) {
          return;
        }

        setEmailMsg("");
        setIsEmailAvailable(false);
        setIsDebouncing(false);
        return;
      }

      setIsDebouncing(true);

      const response = await checkEmailExists(emailQuery);

      if (!isMounted) {
        return;
      }

      if (!response) {
        setEmailMsg("Error checking email availability");
        setIsEmailAvailable(false);
        setIsDebouncing(false);
        return;
      }

      setEmailMsg(response);
      setIsEmailAvailable(response.toLowerCase().includes("available"));
      setIsDebouncing(false);
    };

    void checkEmailAvailability();

    return () => {
      isMounted = false;
    };
  }, [emailQuery]);

  useEffect(() => {
    let isMounted = true;

    const checkReferralAvailability = async () => {
      if (referralQuery.trim() === "" || referralQuery.trim().length < 6) {
        if (!isMounted) {
          return;
        }

        setReferralMsg("");
        setIsReferralValid(false);
        setIsDebouncing(false);
        return;
      }

      setIsDebouncing(true);

      const response = await checkReferrerCodeExists(referralQuery);

      if (!isMounted) {
        return;
      }

      if (!response) {
        setReferralMsg("Error checking referral availability");
        setIsReferralValid(false);
        setIsDebouncing(false);
        return;
      }

      setReferralMsg(response);
      setIsReferralValid(!response.toLowerCase().includes("invalid"));
      setIsDebouncing(false);
    };

    void checkReferralAvailability();

    return () => {
      isMounted = false;
    };
  }, [referralQuery]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={registerUserSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting, setFieldValue, values, errors }) => (
        <Form className="flex min-h-120 w-full min-w-70 max-w-105 flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-md">
          <div className="w-full">
            <Label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email
            </Label>
            <Field
              ref={inputRef}
              as={Input}
              id="email"
              type="email"
              name="email"
              placeholder="example@example.com"
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFieldValue("email", e.target.value);
                setEmail(e.target.value);
              }}
            />
            <ErrorMessage
              name="email"
              component="div"
              className="mt-1 text-sm text-destructive"
            />

            {!errors.email && emailMsg && (
              <div
                className={`mt-1 text-sm ${
                  emailMsg.toLowerCase().includes("available")
                    ? "text-accent"
                    : "text-destructive"
                }`}
              >
                {emailMsg}
              </div>
            )}
          </div>

          <div className="w-full">
            <Label
              htmlFor="firstName"
              className="mb-2 block text-sm font-medium"
            >
              First Name
            </Label>
            <Field
              as={Input}
              id="firstName"
              type="text"
              name="firstName"
              placeholder="First Name"
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <ErrorMessage
              name="firstName"
              component="div"
              className="mt-1 text-sm text-destructive"
            />
          </div>

          <div className="w-full">
            <Label
              htmlFor="lastName"
              className="mb-2 block text-sm font-medium"
            >
              Last Name
            </Label>
            <Field
              as={Input}
              id="lastName"
              type="text"
              name="lastName"
              placeholder="Last Name"
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <ErrorMessage
              name="lastName"
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
                type={isHidden ? "password" : "text"}
                name="password"
                placeholder="Password"
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
              name="password"
              component="div"
              className="mt-1 text-sm text-destructive"
            />
          </div>

          <div className="w-full">
            <Label htmlFor="role" className="mb-2 block text-sm font-medium">
              Role
            </Label>
            <Select
              name="role"
              onValueChange={(value) => setFieldValue("role", value)}
              defaultValue={values.role}
            >
              <SelectTrigger className="w-full border-input bg-background text-foreground focus:ring-2 focus:ring-ring">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                  <SelectItem value="ORGANIZER">Organizer</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <ErrorMessage
              name="role"
              component="div"
              className="mt-1 text-sm text-destructive"
            />
          </div>

          <div className="w-full">
            <Label
              htmlFor="referrerCode"
              className="mb-2 block text-sm font-medium"
            >
              Referral Code
            </Label>
            <Field
              as={Input}
              id="referrerCode"
              type="text"
              name="referrerCode"
              placeholder="Referrer Code (optional)"
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFieldValue("referrerCode", e.target.value);
                setReferral(e.target.value);
              }}
            />
            <ErrorMessage
              name="referrerCode"
              component="div"
              className="mt-1 text-sm text-destructive"
            />

            {!errors.referrerCode &&
              values.referrerCode !== "" &&
              referralMsg && (
                <div
                  className={`mt-1 text-sm ${
                    isReferralValid ? "text-accent" : "text-destructive"
                  }`}
                >
                  {referralMsg}
                </div>
              )}
          </div>

          <Button
            type="submit"
            className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={
              isSubmitting ||
              !isEmailAvailable ||
              Boolean(errors.email) ||
              isDebouncing
            }
          >
            Register
          </Button>
        </Form>
      )}
    </Formik>
  );
}

import { avatarFallback } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { IUserParams } from "@/store/auth.store";
import { useAuthStore } from "@/store/auth.store";
import InfoRow from "./info-row";
import { meApi, resendVerificationEmailApi } from "@/api/auth/auth.api";
import { useEffect, useState } from "react";
import ChangeAvatar from "./change-avatar";
import ChangePassword from "./change-password";
import { toast } from "sonner";

interface ProfileCardProps {
  user: IUserParams;
}

export default function ProfileCard({ user }: ProfileCardProps) {
  const [isResendingVerification, setIsResendingVerification] =
    useState(false);
  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  const roleLabel = user.role;
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const handleProfile = async () => {
      const response = await meApi();
      if (!response.data) throw new Error("Failed to fetch user profile");
      setUser(response.data);
    };

    handleProfile();
  }, [setUser]);

  const handleResendVerificationEmail = async () => {
    try {
      setIsResendingVerification(true);
      const response = await resendVerificationEmailApi();
      toast.success(response.message);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to resend verification email";
      toast.error(message);
    } finally {
      setIsResendingVerification(false);
    }
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-18 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted text-lg font-semibold text-primary">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl || avatarFallback}
                  alt={`${fullName} profile picture`}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{roleLabel}</Badge>
                <Badge variant={user.isVerified ? "default" : "outline"}>
                  {user.isVerified ? "Verified" : "Unverified"}
                </Badge>
              </div>

              <div>
                <CardTitle className="text-2xl font-semibold">
                  {fullName}
                </CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:w-44">
            {!user.isVerified ? (
              <Button
                variant="secondary"
                type="button"
                disabled={isResendingVerification}
                onClick={handleResendVerificationEmail}
              >
                {isResendingVerification ? "Sending..." : "Resend verification"}
              </Button>
            ) : null}
            <ChangeAvatar />
            <ChangePassword />
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="grid gap-3 sm:grid-cols-2">
        <InfoRow label="First name" value={user.firstName} />
        <InfoRow label="Last name" value={user.lastName} />
        <InfoRow label="Email" value={user.email} />
        <InfoRow label="Role" value={roleLabel} />
      </CardContent>
    </Card>
  );
}

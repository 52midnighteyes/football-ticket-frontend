import { useEffect, useState } from "react";
import { Link } from "react-router";
import { CopyIcon } from "lucide-react";
import { getMyAvailablePoints } from "@/api/transaction/transaction.api";
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
import ChangeAvatar from "./change-avatar";
import ChangePassword from "./change-password";
import { toast } from "sonner";

interface ProfileCardProps {
  user: IUserParams;
}

export default function ProfileCard({ user }: ProfileCardProps) {
  const [isResendingVerification, setIsResendingVerification] =
    useState(false);
  const [availablePoints, setAvailablePoints] = useState<number | null>(
    typeof user.points === "number" ? user.points : null,
  );
  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  const roleLabel = user.role;
  const setUser = useAuthStore((state) => state.setUser);
  const referralCode = user.referralCode?.trim() || null;

  useEffect(() => {
    const loadProfileContext = async () => {
      try {
        const profileResponse = await meApi();
        if (!profileResponse.data) {
          throw new Error("Failed to fetch user profile");
        }

        setUser(profileResponse.data);

        if (profileResponse.data.role !== "CUSTOMER") {
          return;
        }

        const pointsResponse = await getMyAvailablePoints();
        setAvailablePoints(pointsResponse.data?.totalAvailablePoints ?? 0);
      } catch (error) {
        console.error(error);
      }
    };

    void loadProfileContext();
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

  const handleCopyReferralCode = async () => {
    if (!referralCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(referralCode);
      toast.success("Referral code copied");
    } catch {
      toast.error("Failed to copy referral code");
    }
  };

  return (
    <Card className="overflow-hidden border-border shadow-sm">
      <CardHeader className="gap-6 bg-linear-to-br from-primary/6 via-card to-accent/8 py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
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

            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{roleLabel}</Badge>
                <Badge variant={user.isVerified ? "default" : "outline"}>
                  {user.isVerified ? "Verified" : "Unverified"}
                </Badge>
              </div>

              <div className="min-w-0 space-y-1">
                <CardTitle className="line-clamp-2 break-words text-2xl font-semibold">
                  {fullName}
                </CardTitle>
                <CardDescription className="break-words text-sm leading-6">
                  {user.email}
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:w-60 lg:grid-cols-1">
            {user.role === "CUSTOMER" ? (
              <Button asChild variant="outline" type="button">
                <Link to="/transactions">View transactions</Link>
              </Button>
            ) : null}
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

      <CardContent className="grid gap-3 py-5 sm:grid-cols-2">
        {referralCode ? (
          <InfoRow
            label="Referral code"
            className="sm:col-span-2"
            value={
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-mono text-base tracking-[0.16em] text-primary">
                  {referralCode}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => void handleCopyReferralCode()}
                >
                  <CopyIcon className="mr-2 h-4 w-4" />
                  Copy code
                </Button>
              </div>
            }
          />
        ) : null}
        <InfoRow label="First name" value={user.firstName} />
        <InfoRow label="Last name" value={user.lastName} />
        <InfoRow label="Email" value={user.email} />
        <InfoRow label="Role" value={roleLabel} />
        {typeof availablePoints === "number" ? (
          <InfoRow
            label="Available points"
            value={`${new Intl.NumberFormat("id-ID").format(availablePoints)} pts`}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

import { useEffect } from "react";
import { useNavigate } from "react-router";

import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth.store";
import ProfileCard from "./components/profile-card";

export default function UserProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;

    if (!user) {
      navigate("/login");
    }
  }, [isHydrated, navigate, user]);

  if (!isHydrated || !user) {
    return (
      <div className="min-h-screen bg-muted/30 px-6 pt-28 pb-10 lg:px-20">
        <Card className="mx-auto w-full max-w-3xl border-border shadow-sm">
          <CardContent>
            <p className="text-sm text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 px-6 pt-28 pb-10 lg:px-20">
      <div className="mx-auto w-full max-w-3xl">
        <ProfileCard user={user} />
      </div>
    </div>
  );
}

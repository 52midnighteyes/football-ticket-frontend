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
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(210,82,32,0.12),_transparent_34%),linear-gradient(180deg,_rgba(245,247,244,1)_0%,_rgba(236,241,236,1)_100%)] px-6 pt-28 pb-12 lg:px-16">
        <Card className="mx-auto w-full max-w-5xl border-border/80 bg-card shadow-sm">
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(210,82,32,0.12),_transparent_34%),linear-gradient(180deg,_rgba(245,247,244,1)_0%,_rgba(236,241,236,1)_100%)] px-6 pt-28 pb-12 lg:px-16">
      <div className="mx-auto w-full max-w-6xl">
        <ProfileCard user={user} />
      </div>
    </div>
  );
}

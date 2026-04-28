import { useEffect } from "react";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth.store";
import CreateEventForm from "./components/create-event-form";

export default function CreateEventPage() {
  const navigate = useNavigate();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!user) {
      navigate("/login");
    }
  }, [isHydrated, navigate, user]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-muted/30 px-6 pt-28 pb-10 lg:px-20">
        <Card className="mx-auto w-full max-w-5xl border-border shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Loading create event page...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAllowedRole = ["ORGANIZER", "ADMIN"].includes(user.role);

  if (!isAllowedRole) {
    return (
      <div className="min-h-screen bg-muted/30 px-6 pt-28 pb-10 lg:px-20">
        <Card className="mx-auto w-full max-w-2xl border-border shadow-sm">
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">
                Organizer access required
              </h2>
              <p className="text-sm text-muted-foreground">
                This page is only available for organizer accounts.
              </p>
            </div>

            <div>
              <Button type="button" onClick={() => navigate("/")}>
                Back to home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 px-6 pt-28 pb-10 lg:px-20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="w-full overflow-hidden border-border bg-card shadow-sm">
          <CardContent className="relative flex  items-end p-6">
            <div className="pointer-events-none absolute -top-14 right-0 h-44 w-44 rounded-full bg-primary/12 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-10 h-32 w-32 rounded-full bg-accent/10 blur-3xl" />

            <div className="relative flex w-full flex-col gap-3">
              <h1 className=" text-4xl font-semibold tracking-tight text-foreground">
                Create Your Match!
              </h1>

              <p className=" text-sm leading-6 text-foreground/75">
                Keep the setup sharp from the start: strong banner, clear venue
                info, clean scheduling, and a status that is ready for the next
                publishing step.
              </p>
            </div>
          </CardContent>
        </Card>

        <CreateEventForm user={user} />
      </div>
    </div>
  );
}

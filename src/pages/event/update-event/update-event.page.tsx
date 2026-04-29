import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import axios from "axios";
import { ArrowLeftIcon, PencilLineIcon } from "lucide-react";
import { toast } from "sonner";

import { getEventById } from "@/api/event/event.api";
import type { IEvent } from "@/api/event/event.interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/store/auth.store";
import UpdateEventForm from "./components/update-event-form";

export default function UpdateEventPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);
  const [event, setEvent] = useState<IEvent | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    if (!id) {
      navigate("/dashboard");
      return;
    }

    const fetchEvent = async () => {
      try {
        setIsLoadingEvent(true);
        const response = await getEventById(id);

        if (!response.data) {
          toast.error("Event not found");
          navigate("/dashboard");
          return;
        }

        setEvent(response.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          toast.error(error.response?.data?.message ?? "Failed to load event");
        } else {
          toast.error("Failed to load event");
        }

        navigate("/dashboard");
      } finally {
        setIsLoadingEvent(false);
      }
    };

    void fetchEvent();
  }, [id, isHydrated, navigate, user]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-muted/30 px-6 pt-28 pb-10 lg:px-20">
        <Card className="mx-auto w-full max-w-5xl border-border shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Loading update event page...
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

  if (isLoadingEvent) {
    return (
      <div className="min-h-screen bg-muted/30 px-6 pt-28 pb-10 lg:px-20">
        <Card className="mx-auto w-full max-w-5xl border-border shadow-sm">
          <CardContent className="flex items-center gap-3 pt-6 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" />
            Loading event details...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const isOwnedByCurrentUser =
    user.role === "ADMIN" || event.organizerId === user.id;

  if (!isOwnedByCurrentUser) {
    return (
      <div className="min-h-screen bg-muted/30 px-6 pt-28 pb-10 lg:px-20">
        <Card className="mx-auto w-full max-w-2xl border-border shadow-sm">
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">
                You cannot edit this event
              </h2>
              <p className="text-sm text-muted-foreground">
                The event belongs to another organizer account.
              </p>
            </div>

            <div>
              <Button type="button" onClick={() => navigate("/dashboard")}>
                Back to dashboard
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
          <CardContent className="relative flex items-end p-6">
            <div className="relative flex w-full flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back to dashboard
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <PencilLineIcon className="h-5 w-5" />
                  </div>
                  <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                    Update Event
                  </h1>
                </div>

                <p className="text-sm leading-6 text-foreground/75">
                  Adjust the details that changed, keep old ticket types active
                  or inactive as needed, and upload a new banner only if you
                  want to replace the current one.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <UpdateEventForm user={user} event={event} onUpdated={setEvent} />
      </div>
    </div>
  );
}

import axios from "axios";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { updateEvent } from "@/api/event/event.api";
import type { IEvent } from "@/api/event/event.interface";
import EventForm from "@/pages/event/components/event-form";
import type { IUserParams } from "@/store/auth.store";
import {
  mapEventToFormValues,
  type ICreateEventFormValues,
} from "@/pages/event/create-event/components/create-event.schema";

interface UpdateEventFormProps {
  user: IUserParams;
  event: IEvent;
  onUpdated: (event: IEvent) => void;
}

export default function UpdateEventForm({
  user,
  event,
  onUpdated,
}: UpdateEventFormProps) {
  const navigate = useNavigate();

  const handleSubmit = async (
    values: ICreateEventFormValues,
    helpers: {
      resetForm: () => void;
      resetBannerField: () => void;
    },
  ) => {
    try {
      const response = await updateEvent(event.id, {
        categoryId: values.categoryId,
        cityId: values.cityId,
        name: values.name.trim(),
        description: values.description.trim(),
        venue: values.venue.trim(),
        address: values.address.trim(),
        startAt: new Date(values.startAt).toISOString(),
        endAt: new Date(values.endAt).toISOString(),
        status: values.status,
        bannerUrl: values.bannerUrl,
        ticketTypes: values.ticketTypes.map((ticketType) => ({
          ...(ticketType.id ? { id: ticketType.id } : {}),
          name: ticketType.name.trim(),
          price: Number(ticketType.price),
          quota: Number(ticketType.quota),
          isActive: ticketType.isActive,
        })),
      });

      if (response.data) {
        onUpdated(response.data);
      }

      helpers.resetBannerField();
      toast.success(response.message || "Event updated successfully");
      navigate("/dashboard");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message ?? "Failed to update event");
        return;
      }

      toast.error("Failed to update event");
    }
  };

  return (
    <EventForm
      user={user}
      mode="update"
      title="Update event"
      description="Keep the banner, schedule, and ticket availability in sync from one place."
      submitLabel="Update Event"
      submittingLabel="Updating..."
      initialValues={mapEventToFormValues(event)}
      initialBannerUrl={event.bannerUrl}
      onSubmit={handleSubmit}
    />
  );
}

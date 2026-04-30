import axios from "axios";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { createEvent } from "@/api/event/event.api";
import EventForm from "@/pages/event/components/event-form";
import type { IUserParams } from "@/store/auth.store";
import {
  createEventInitialValues,
  type ICreateEventFormValues,
} from "./create-event.schema";

interface CreateEventFormProps {
  user: IUserParams;
}

export default function CreateEventForm({ user }: CreateEventFormProps) {
  const navigate = useNavigate();

  const handleSubmit = async (
    values: ICreateEventFormValues,
    helpers: {
      resetForm: () => void;
      resetBannerField: () => void;
    },
  ) => {
    if (!values.bannerUrl) {
      toast.error("Banner image is required");
      return;
    }

    try {
      const response = await createEvent(user.id, {
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
          name: ticketType.name.trim(),
          price: Number(ticketType.price),
          quota: Number(ticketType.quota),
          isActive: ticketType.isActive,
        })),
      });

      toast.success(response.message || "Event created successfully");
      helpers.resetForm();
      helpers.resetBannerField();
      navigate("/dashboard");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ??
            "Failed to create event and ticket types",
        );
        return;
      }

      toast.error("Failed to create event and ticket types");
    }
  };

  return (
    <EventForm
      user={user}
      mode="create"
      title="Create a new event"
      description="Set the banner, schedule, and ticket setup in one clean flow."
      submitLabel="Create Event"
      submittingLabel="Creating..."
      initialValues={createEventInitialValues}
      onSubmit={handleSubmit}
    />
  );
}

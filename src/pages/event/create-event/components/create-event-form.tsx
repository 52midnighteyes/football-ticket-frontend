import { useEffect, useRef, useState } from "react";
import { ErrorMessage, Field, FieldArray, Form, Formik } from "formik";
import axios from "axios";
import { ImagePlusIcon, MapPinIcon, PlusIcon, TicketIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  createEvent,
  getCategories,
  getCities,
} from "@/api/event/event.api";
import type {
  EventStatus,
  ICategory,
  ICity,
} from "@/api/event/event.interface";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import type { IUserParams } from "@/store/auth.store";
import {
  createEventInitialValues,
  createEventSchema,
  type ICreateEventFormValues,
} from "./create-event.schema";
import DateTimePicker from "./date-time-picker";

const statusOptions: Array<{
  value: EventStatus;
  label: string;
  description: string;
}> = [
  {
    value: "DRAFT",
    label: "Draft",
    description: "Save the event before publishing it live.",
  },
  {
    value: "PUBLISHED",
    label: "Published",
    description: "Make the event visible right after submit.",
  },
  {
    value: "CANCELED",
    label: "Canceled",
    description: "Not recommended for new events.",
  },
  {
    value: "COMPLETED",
    label: "Completed",
    description: "Not recommended for new events.",
  },
];

interface CreateEventFormProps {
  user: IUserParams;
}

export default function CreateEventForm({ user }: CreateEventFormProps) {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchOptions = async () => {
      try {
        const [categoriesResponse, citiesResponse] = await Promise.all([
          getCategories(),
          getCities(),
        ]);

        if (!isMounted) {
          return;
        }

        setCategories(categoriesResponse.data ?? []);
        setCities(citiesResponse.data ?? []);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (axios.isAxiosError(error)) {
          toast.error(
            error.response?.data?.message ?? "Failed to load event options",
          );
        } else {
          toast.error("Failed to load event options");
        }
      } finally {
        if (isMounted) {
          setIsLoadingOptions(false);
        }
      }
    };

    void fetchOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (bannerPreviewUrl) {
        URL.revokeObjectURL(bannerPreviewUrl);
      }
    };
  }, [bannerPreviewUrl]);

  const resetBannerField = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (bannerPreviewUrl) {
      URL.revokeObjectURL(bannerPreviewUrl);
    }

    setBannerPreviewUrl(null);
  };

  const handleSubmit = async (
    values: ICreateEventFormValues,
    resetForm: () => void,
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
      resetForm();
      resetBannerField();
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
    <Formik
      initialValues={createEventInitialValues}
      validationSchema={createEventSchema}
      onSubmit={async (values, { resetForm }) => {
        await handleSubmit(values, resetForm);
      }}
    >
      {({
        errors,
        isSubmitting,
        resetForm,
        setFieldTouched,
        setFieldValue,
        touched,
        values,
      }) => (
        <Form className="flex flex-col gap-6">
          <Card className="overflow-hidden border-border bg-card/95 shadow-sm">
            <CardHeader className="gap-3 border-b border-border/70">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">Create a new event</CardTitle>
                  <CardDescription>
                    Fill in the essentials first. You can add ticket types after
                    the event is created.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-8 pt-6 xl:gap-8">
              <div className="flex flex-col lg:flex-row-reverse gap-8  w-full">
                <section className="flex flex-col gap-4 w-full h-full">
                  <div className="overflow-hidden md:min-h-120 rounded-2xl border border-border bg-muted/20 p-4 ">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Banner Preview
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Best results use a wide 16:9 composition
                        </p>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-dashed border-primary/25 bg-background/75 shadow-inner">
                      {bannerPreviewUrl ? (
                        <img
                          src={bannerPreviewUrl}
                          alt="Selected event banner preview"
                          className="aspect-video w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-video flex-col items-center justify-center gap-3 px-6 text-center">
                          <div className="rounded-full bg-primary/10 p-3 text-primary">
                            <ImagePlusIcon className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">
                              Upload a clean event banner
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Wide visuals work best for event discovery pages.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid gap-2">
                      <Label
                        htmlFor="bannerUrl"
                        className="text-sm font-medium text-foreground"
                      >
                        Banner Image
                      </Label>
                      <Input
                        ref={fileInputRef}
                        id="bannerUrl"
                        name="bannerUrl"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="h-10 bg-background"
                        onChange={(event) => {
                          const nextFile =
                            event.currentTarget.files?.[0] ?? null;

                          setFieldTouched("bannerUrl", true, false);
                          void setFieldValue("bannerUrl", nextFile);

                          if (bannerPreviewUrl) {
                            URL.revokeObjectURL(bannerPreviewUrl);
                          }

                          setBannerPreviewUrl(
                            nextFile ? URL.createObjectURL(nextFile) : null,
                          );
                        }}
                      />
                      <ErrorMessage
                        name="bannerUrl"
                        component="div"
                        className="text-sm text-destructive"
                      />
                    </div>
                  </div>
                </section>

                <section className="flex flex-col gap-4 w-full h-full ">
                  <div className="flex h-full md:min-h-120 flex-col gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4 md:p-5">
                    <div className="flex flex-col gap-2">
                      <Label
                        htmlFor="name"
                        className="text-sm font-medium text-foreground"
                      >
                        Event Name
                      </Label>
                      <Field
                        as={Input}
                        id="name"
                        name="name"
                        placeholder="Input your event name here..."
                        className="h-10 bg-background"
                      />
                      <ErrorMessage
                        name="name"
                        component="div"
                        className="text-sm text-destructive"
                      />
                    </div>

                    <div className="flex w-full gap-4 md:flex-row md:gap-4">
                      <div className="flex flex-col gap-2 w-full">
                        <Label className="text-sm font-medium text-foreground">
                          Category
                        </Label>
                        <Select
                          value={values.categoryId}
                          onValueChange={(value) => {
                            void setFieldValue("categoryId", value);
                          }}
                          disabled={isLoadingOptions}
                        >
                          <SelectTrigger className="h-10 w-full bg-background">
                            <SelectValue placeholder="Choose a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {touched.categoryId && errors.categoryId ? (
                          <div className="text-sm text-destructive">
                            {errors.categoryId}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-2 w-full">
                        <Label className="text-sm font-medium text-foreground">
                          City
                        </Label>
                        <Select
                          value={values.cityId}
                          onValueChange={(value) => {
                            void setFieldValue("cityId", value);
                          }}
                          disabled={isLoadingOptions}
                        >
                          <SelectTrigger className="h-10 w-full bg-background">
                            <SelectValue placeholder="Choose a city" />
                          </SelectTrigger>
                          <SelectContent>
                            {cities.map((city) => (
                              <SelectItem key={city.id} value={city.id}>
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {touched.cityId && errors.cityId ? (
                          <div className="text-sm text-destructive">
                            {errors.cityId}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label
                        htmlFor="description"
                        className="text-sm font-medium text-foreground"
                      >
                        Description
                      </Label>
                      <Field
                        as="textarea"
                        id="description"
                        name="description"
                        rows={7}
                        placeholder="Describe the match atmosphere, what people can expect, and why they should come."
                        className="min-h-50 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <ErrorMessage
                          name="description"
                          component="div"
                          className="text-sm text-destructive"
                        />
                        <p className="text-xs text-muted-foreground">
                          Minimum 20 characters
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
              <Separator className="" />
              <div>
                <section className="flex flex-col gap-4 ">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-accent/10 p-2 text-accent">
                      <MapPinIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        Venue and schedule
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Make the logistics easy to scan and trust.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4 md:p-5">
                    <div className="flex flex-col gap-4  md:gap-4">
                      <div className="flex flex-col gap-2">
                        <Label
                          htmlFor="venue"
                          className="text-sm font-medium text-foreground"
                        >
                          Venue
                        </Label>
                        <div className="relative flex justify-start">
                          <MapPinIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Field
                            as={Input}
                            id="venue"
                            name="venue"
                            placeholder="Input your venue name"
                            className="h-10 w-full bg-background pl-10"
                          />
                        </div>
                        <ErrorMessage
                          name="venue"
                          component="div"
                          className="text-sm text-destructive"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label
                          htmlFor="address"
                          className="text-sm font-medium text-foreground"
                        >
                          Full Address
                        </Label>
                        <Field
                          as="textarea"
                          id="address"
                          name="address"
                          rows={3}
                          placeholder="Input your full event address here so attendees can find it easily."
                          className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
                        />
                        <ErrorMessage
                          name="address"
                          component="div"
                          className="text-sm text-destructive"
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                          <DateTimePicker
                            id="startAt"
                            label="Start Date"
                            placeholder="Pick event start"
                            value={values.startAt}
                            onChange={(nextValue) => {
                              void setFieldValue("startAt", nextValue);
                              void setFieldTouched("startAt", true, false);
                            }}
                          />
                          <ErrorMessage
                            name="startAt"
                            component="div"
                            className="text-sm text-destructive"
                          />
                        </div>

                        <div className="grid gap-2">
                          <DateTimePicker
                            id="endAt"
                            label="End Date"
                            placeholder="Pick event end"
                            value={values.endAt}
                            onChange={(nextValue) => {
                              void setFieldValue("endAt", nextValue);
                              void setFieldTouched("endAt", true, false);
                            }}
                          />
                          <ErrorMessage
                            name="endAt"
                            component="div"
                            className="text-sm text-destructive"
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-sm font-medium text-foreground">
                          Status
                        </Label>
                        <Select
                          value={values.status}
                          onValueChange={(value) => {
                            void setFieldValue("status", value);
                          }}
                        >
                          <SelectTrigger className="h-10 w-full bg-background">
                            <SelectValue placeholder="Choose event status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem
                                key={status.value}
                                value={status.value}
                              >
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {touched.status && errors.status ? (
                          <div className="text-sm text-destructive">
                            {errors.status}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {
                              statusOptions.find(
                                (status) => status.value === values.status,
                              )?.description
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
              <Separator className="" />
              <div>
                <section className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <TicketIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        Ticket types
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Add the tickets here so the event is ready in one flow.
                      </p>
                    </div>
                  </div>

                  <FieldArray name="ticketTypes">
                    {({ push, remove }) => (
                      <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4 md:p-5">
                        {values.ticketTypes.map((_, index: number) => (
                            <div
                              key={`ticket-type-${index}`}
                              className="flex flex-col gap-4 rounded-2xl border border-border bg-background/70 p-4"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">
                                    Ticket Type {index + 1}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Name, price, quota, and availability for this ticket.
                                  </p>
                                </div>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => remove(index)}
                                  disabled={values.ticketTypes.length === 1}
                                >
                                  <Trash2Icon className="h-4 w-4" />
                                  Remove
                                </Button>
                              </div>

                                <div className="flex flex-col gap-4">
                                  <div className="flex flex-col gap-2">
                                  <Label
                                    htmlFor={`ticketTypes.${index}.name`}
                                    className="text-sm font-medium text-foreground"
                                  >
                                    Ticket Name
                                  </Label>
                                  <Field
                                    as={Input}
                                    id={`ticketTypes.${index}.name`}
                                    name={`ticketTypes.${index}.name`}
                                    placeholder="VIP, Regular, Tribune A"
                                    className="h-10 bg-background"
                                  />
                                  <ErrorMessage
                                    name={`ticketTypes.${index}.name`}
                                    component="div"
                                    className="text-sm text-destructive"
                                  />
                                  </div>

                                  <div className="flex flex-col gap-2">
                                    <Label className="text-sm font-medium text-foreground">
                                      Ticket Status
                                    </Label>
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        variant={
                                          values.ticketTypes[index]?.isActive
                                            ? "default"
                                            : "outline"
                                        }
                                        className="h-10 w-fit px-5"
                                        onClick={() => {
                                          void setFieldValue(
                                            `ticketTypes.${index}.isActive`,
                                            true,
                                          );
                                        }}
                                      >
                                        Active
                                      </Button>
                                      <Button
                                        type="button"
                                        variant={
                                          values.ticketTypes[index]?.isActive
                                            ? "outline"
                                            : "default"
                                        }
                                        className="h-10 w-fit px-5"
                                        onClick={() => {
                                          void setFieldValue(
                                            `ticketTypes.${index}.isActive`,
                                            false,
                                          );
                                        }}
                                      >
                                        Inactive
                                      </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      Existing ticket types should be set inactive instead of deleted.
                                    </p>
                                  </div>

                                <div className="flex flex-col gap-4 md:flex-row">
                                  <div className="flex w-full flex-col gap-2">
                                    <Label
                                      htmlFor={`ticketTypes.${index}.price`}
                                      className="text-sm font-medium text-foreground"
                                    >
                                      Price
                                    </Label>
                                    <Field
                                      as={Input}
                                      id={`ticketTypes.${index}.price`}
                                      name={`ticketTypes.${index}.price`}
                                      type="number"
                                      min="0"
                                      placeholder="250000"
                                      className="h-10 bg-background"
                                    />
                                    <ErrorMessage
                                      name={`ticketTypes.${index}.price`}
                                      component="div"
                                      className="text-sm text-destructive"
                                    />
                                  </div>

                                  <div className="flex w-full flex-col gap-2">
                                    <Label
                                      htmlFor={`ticketTypes.${index}.quota`}
                                      className="text-sm font-medium text-foreground"
                                    >
                                      Quota
                                    </Label>
                                    <Field
                                      as={Input}
                                      id={`ticketTypes.${index}.quota`}
                                      name={`ticketTypes.${index}.quota`}
                                      type="number"
                                      min="1"
                                      placeholder="100"
                                      className="h-10 bg-background"
                                    />
                                    <ErrorMessage
                                      name={`ticketTypes.${index}.quota`}
                                      component="div"
                                      className="text-sm text-destructive"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-fit px-5"
                          onClick={() =>
                            push({
                              name: "",
                              price: "",
                              quota: "",
                              isActive: true,
                            })
                          }
                        >
                          <PlusIcon className="h-4 w-4" />
                          Add ticket type
                        </Button>
                      </div>
                    )}
                  </FieldArray>
                </section>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/95 shadow-sm">
            <CardContent className="flex flex-col  gap-4 md:flex-row items-center md:justify-between">
              <div className="bg-white">
                <p className="text-sm font-medium text-foreground">
                  Organizer account
                </p>
                <p className="text-sm text-muted-foreground">
                  {user.firstName} {user.lastName} ({user.email})
                </p>
              </div>

              <div className="flex  gap-3 ">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-fit px-5"
                  onClick={() => {
                    resetForm();
                    resetBannerField();
                  }}
                >
                  Reset
                </Button>

                <Button
                  type="submit"
                  className="h-10 w-fit px-5"
                  disabled={isSubmitting || isLoadingOptions}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      Creating...
                    </>
                  ) : (
                    "Create Event"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </Form>
      )}
    </Formik>
  );
}

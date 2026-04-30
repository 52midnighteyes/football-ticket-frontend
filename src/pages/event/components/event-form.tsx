import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ErrorMessage, Field, FieldArray, Form, Formik } from "formik";
import axios from "axios";
import {
  CheckIcon,
  ChevronDownIcon,
  ImagePlusIcon,
  MapPinIcon,
  PlusIcon,
  SearchIcon,
  TicketIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { getCategories, getCities } from "@/api/event/event.api";
import type {
  EventStatus,
  ICategory,
  ICity,
} from "@/api/event/event.interface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EventBanner from "@/components/event-banner";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/hook/useDebounce";
import type { IUserParams } from "@/store/auth.store";
import {
  createEventInitialValues,
  createEventSchema,
  updateEventSchema,
  type ICreateEventFormValues,
} from "../create-event/components/create-event.schema";
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
    description: "Use this only when the event should stop selling.",
  },
  {
    value: "COMPLETED",
    label: "Completed",
    description: "Use this when the event has already ended.",
  },
];

interface EventFormSubmitHelpers {
  resetForm: () => void;
  resetBannerField: () => void;
}

interface EventFormProps {
  user: IUserParams;
  mode: "create" | "update";
  title: string;
  description: string;
  submitLabel: string;
  submittingLabel: string;
  initialValues?: ICreateEventFormValues;
  initialBannerUrl?: string | null;
  onSubmit: (
    values: ICreateEventFormValues,
    helpers: EventFormSubmitHelpers,
  ) => Promise<void>;
}

interface SearchableOption {
  id: string;
  name: string;
}

interface SearchableSelectProps<TOption extends SearchableOption> {
  disabled?: boolean;
  emptyMessage: string;
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onSelect: (option: SearchableOption) => void;
  options: TOption[];
  placeholder: string;
  searchPlaceholder: string;
  selectedFallbackOption?: SearchableOption | null;
  selectedLabel?: string | null;
  searchValue: string;
  selectedValue: string;
}

function SearchableSelect<TOption extends SearchableOption>({
  disabled = false,
  emptyMessage,
  isLoading,
  onSearchChange,
  onSelect,
  options,
  placeholder,
  searchPlaceholder,
  selectedFallbackOption = null,
  selectedLabel = null,
  searchValue,
  selectedValue,
}: SearchableSelectProps<TOption>) {
  const [open, setOpen] = useState(false);
  const [highlightedOptionId, setHighlightedOptionId] = useState<string | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();
  const displayedOptions = useMemo(() => {
    if (
      !selectedValue ||
      !selectedFallbackOption ||
      options.some((option) => option.id === selectedValue)
    ) {
      return options;
    }

    return [selectedFallbackOption, ...options];
  }, [options, selectedFallbackOption, selectedValue]);
  const highlightedIndex = displayedOptions.findIndex(
    (option) => option.id === highlightedOptionId,
  );
  const resolvedHighlightedIndex =
    highlightedIndex >= 0 ? highlightedIndex : displayedOptions.length > 0 ? 0 : -1;

  useEffect(() => {
    if (!open) {
      return;
    }

    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || resolvedHighlightedIndex < 0) {
      return;
    }

    optionRefs.current[resolvedHighlightedIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [open, resolvedHighlightedIndex]);

  const selectOption = (option: SearchableOption) => {
    onSelect(option);
    onSearchChange("");
    setHighlightedOptionId(option.id);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          onSearchChange("");
          setHighlightedOptionId(null);
          return;
        }

        setHighlightedOptionId(selectedValue || displayedOptions[0]?.id || null);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          className="h-10 w-full justify-between bg-background px-3 text-sm font-normal"
          disabled={disabled}
          onKeyDown={(event) => {
            if (disabled) {
              return;
            }

            if (
              event.key === "ArrowDown" ||
              event.key === "ArrowUp" ||
              event.key === "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();
              setHighlightedOptionId(
                selectedValue || displayedOptions[0]?.id || null,
              );
              setOpen(true);
            }
          }}
        >
          <span className="truncate text-left">
            {selectedLabel || placeholder}
          </span>
          <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-(--radix-popover-trigger-width) p-2" align="start">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 bg-background pl-9"
            disabled={isLoading}
            role="searchbox"
            aria-controls={listboxId}
            aria-activedescendant={
              open && resolvedHighlightedIndex >= 0
                ? `${listboxId}-option-${resolvedHighlightedIndex}`
                : undefined
            }
            onKeyDown={(event) => {
              if (displayedOptions.length === 0) {
                if (event.key === "Escape") {
                  setOpen(false);
                }

                return;
              }

              if (event.key === "ArrowDown") {
                event.preventDefault();
                const nextIndex =
                  resolvedHighlightedIndex >= displayedOptions.length - 1
                    ? 0
                    : resolvedHighlightedIndex + 1;
                setHighlightedOptionId(displayedOptions[nextIndex].id);
              }

              if (event.key === "ArrowUp") {
                event.preventDefault();
                const nextIndex =
                  resolvedHighlightedIndex <= 0
                    ? displayedOptions.length - 1
                    : resolvedHighlightedIndex - 1;
                setHighlightedOptionId(displayedOptions[nextIndex].id);
              }

              if (event.key === "Enter" && resolvedHighlightedIndex >= 0) {
                event.preventDefault();
                selectOption(displayedOptions[resolvedHighlightedIndex]);
              }

              if (event.key === "Escape") {
                event.preventDefault();
                setOpen(false);
              }
            }}
          />
        </div>

        <div
          id={listboxId}
          role="listbox"
          className="max-h-56 overflow-y-auto rounded-md border border-border bg-background"
        >
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" />
              Loading options...
            </div>
          ) : options.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            displayedOptions.map((option, index) => (
              <button
                key={option.id}
                id={`${listboxId}-option-${index}`}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                type="button"
                role="option"
                aria-selected={selectedValue === option.id}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                  resolvedHighlightedIndex === index
                    ? "bg-accent text-accent-foreground"
                    : ""
                }`}
                tabIndex={-1}
                onMouseEnter={() => setHighlightedOptionId(option.id)}
                onClick={() => selectOption(option)}
              >
                <span className="truncate">{option.name}</span>
                {selectedValue === option.id ? (
                  <CheckIcon className="h-4 w-4 shrink-0" />
                ) : null}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function EventForm({
  user,
  mode,
  title,
  description,
  submitLabel,
  submittingLabel,
  initialValues = createEventInitialValues,
  initialBannerUrl = null,
  onSubmit,
}: EventFormProps) {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [selectedCategoryOption, setSelectedCategoryOption] =
    useState<SearchableOption | null>(null);
  const [selectedCityOption, setSelectedCityOption] =
    useState<SearchableOption | null>(null);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewBannerUrl = bannerPreviewUrl ?? initialBannerUrl;
  const validationSchema =
    mode === "create" ? createEventSchema : updateEventSchema;
  const debouncedCategorySearchTerm = useDebounce(categorySearchTerm.trim(), 500);
  const debouncedCitySearchTerm = useDebounce(citySearchTerm.trim(), 500);
  const isLoadingOptions = isLoadingCategories || isLoadingCities;

  useEffect(() => {
    let isCurrent = true;

    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const categoriesResponse = await getCategories({
          nameLike: debouncedCategorySearchTerm || undefined,
        });

        if (!isCurrent) {
          return;
        }

        setCategories(categoriesResponse.data ?? []);
        const matchedCategory = (categoriesResponse.data ?? []).find(
          (category) =>
            category.id === (selectedCategoryOption?.id || initialValues.categoryId),
        );

        if (matchedCategory) {
          setSelectedCategoryOption({
            id: matchedCategory.id,
            name: matchedCategory.name,
          });
        }
      } catch (error) {
        if (!isCurrent) {
          return;
        }

        if (axios.isAxiosError(error)) {
          toast.error(
            error.response?.data?.message ?? "Failed to load categories",
          );
        } else {
          toast.error("Failed to load categories");
        }
      } finally {
        if (isCurrent) {
          setIsLoadingCategories(false);
        }
      }
    };

    void fetchCategories();

    return () => {
      isCurrent = false;
    };
  }, [
    debouncedCategorySearchTerm,
    initialValues.categoryId,
    selectedCategoryOption?.id,
  ]);

  useEffect(() => {
    let isCurrent = true;

    const fetchCities = async () => {
      try {
        setIsLoadingCities(true);
        const citiesResponse = await getCities({
          nameLike: debouncedCitySearchTerm || undefined,
        });

        if (!isCurrent) {
          return;
        }

        setCities(citiesResponse.data ?? []);
        const matchedCity = (citiesResponse.data ?? []).find(
          (city) => city.id === (selectedCityOption?.id || initialValues.cityId),
        );

        if (matchedCity) {
          setSelectedCityOption({
            id: matchedCity.id,
            name: matchedCity.name,
          });
        }
      } catch (error) {
        if (!isCurrent) {
          return;
        }

        if (axios.isAxiosError(error)) {
          toast.error(error.response?.data?.message ?? "Failed to load cities");
        } else {
          toast.error("Failed to load cities");
        }
      } finally {
        if (isCurrent) {
          setIsLoadingCities(false);
        }
      }
    };

    void fetchCities();

    return () => {
      isCurrent = false;
    };
  }, [debouncedCitySearchTerm, initialValues.cityId, selectedCityOption?.id]);

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

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={async (values, { resetForm }) => {
        await onSubmit(values, {
          resetForm,
          resetBannerField,
        });
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
      }) => {
        const currentCategoryOption =
          categories.find((category) => category.id === values.categoryId) ??
          selectedCategoryOption;
        const currentCityOption =
          cities.find((city) => city.id === values.cityId) ??
          selectedCityOption;

        return (
          <Form className="flex flex-col gap-6">
          <Card className="overflow-hidden border-border bg-card/95 shadow-sm">
            <CardHeader className="gap-3 border-b border-border/70">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-8 pt-6 xl:gap-8">
              <div className="flex w-full flex-col gap-8 lg:flex-row-reverse">
                <section className="flex h-full w-full flex-col gap-4">
                  <div className="overflow-hidden rounded-2xl border border-border bg-muted/20 p-4 md:min-h-120">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Banner Preview
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Best results use a wide 16:9 composition.
                        </p>
                      </div>
                      {mode === "update" && initialBannerUrl ? (
                        <Badge variant="outline">Current banner</Badge>
                      ) : null}
                    </div>

                    <div className="overflow-hidden rounded-xl border border-dashed border-primary/25 bg-background/75 shadow-inner">
                      {previewBannerUrl ? (
                        <EventBanner
                          src={previewBannerUrl}
                          alt="Selected event banner preview"
                          placeholder="Upload a clean event banner"
                          className="w-full"
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

                    <div className="mt-4 flex flex-col gap-2">
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
                      <p className="text-xs text-muted-foreground">
                        Use a 16:9 image. A size like 1600 x 900 keeps the
                        banner sharp and easy to crop.
                      </p>
                      <ErrorMessage
                        name="bannerUrl"
                        component="div"
                        className="text-sm text-destructive"
                      />
                    </div>
                  </div>
                </section>

                <section className="flex h-full w-full flex-col gap-4">
                  <div className="flex h-full flex-col gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4 md:min-h-120 md:p-5">
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

                    <div className="flex w-full flex-col gap-4 md:flex-row">
                      <div className="flex w-full flex-col gap-2">
                        <Label className="text-sm font-medium text-foreground">
                          Category
                        </Label>
                        <SearchableSelect
                          selectedValue={values.categoryId}
                          selectedLabel={currentCategoryOption?.name ?? null}
                          selectedFallbackOption={currentCategoryOption}
                          searchValue={categorySearchTerm}
                          onSearchChange={setCategorySearchTerm}
                          onSelect={(option) => {
                            setSelectedCategoryOption(option);
                            void setFieldValue("categoryId", option.id);
                          }}
                          options={categories}
                          placeholder="Choose a category"
                          searchPlaceholder="Search category"
                          emptyMessage="No categories found."
                          isLoading={isLoadingCategories}
                          disabled={isLoadingCategories}
                        />
                        {touched.categoryId && errors.categoryId ? (
                          <div className="text-sm text-destructive">
                            {errors.categoryId}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex w-full flex-col gap-2">
                        <Label className="text-sm font-medium text-foreground">
                          City
                        </Label>
                        <SearchableSelect
                          selectedValue={values.cityId}
                          selectedLabel={currentCityOption?.name ?? null}
                          selectedFallbackOption={currentCityOption}
                          searchValue={citySearchTerm}
                          onSearchChange={setCitySearchTerm}
                          onSelect={(option) => {
                            setSelectedCityOption(option);
                            void setFieldValue("cityId", option.id);
                          }}
                          options={cities}
                          placeholder="Choose a city"
                          searchPlaceholder="Search city"
                          emptyMessage="No cities found."
                          isLoading={isLoadingCities}
                          disabled={isLoadingCities}
                        />
                        {touched.cityId && errors.cityId ? (
                          <div className="text-sm text-destructive">
                            {errors.cityId}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
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

              <Separator />

              <section className="flex flex-col gap-4">
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
                  <div className="flex flex-col gap-4">
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

                    <div className="flex flex-col gap-2">
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

                    <div className="flex flex-col gap-4 md:flex-row">
                      <div className="flex w-full flex-col gap-2">
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

                      <div className="flex w-full flex-col gap-2">
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

                    <div className="flex flex-col gap-2">
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
                            <SelectItem key={status.value} value={status.value}>
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

              <Separator />

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
                      Keep ticket availability accurate from the same form.
                    </p>
                  </div>
                </div>

                <FieldArray name="ticketTypes">
                  {({ push, remove }) => (
                    <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4 md:p-5">
                      {values.ticketTypes.map((ticketType, index: number) => {
                        const isExistingTicketType = Boolean(ticketType.id);
                        const canRemove =
                          values.ticketTypes.length > 1 &&
                          !isExistingTicketType;

                        return (
                          <div
                            key={ticketType.id ?? `ticket-type-${index}`}
                            className="flex flex-col gap-4 rounded-2xl border border-border bg-background/70 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-foreground">
                                    Ticket Type {index + 1}
                                  </p>
                                  {isExistingTicketType ? (
                                    <Badge variant="outline">Saved</Badge>
                                  ) : (
                                    <Badge variant="secondary">New</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Name, price, quota, and availability for this
                                  ticket.
                                </p>
                              </div>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => remove(index)}
                                disabled={!canRemove}
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
                                  Existing ticket types stay in the system, so
                                  set them inactive instead of deleting them.
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
                        );
                      })}

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
            </CardContent>
          </Card>

          <Card className="border-border bg-card/95 shadow-sm">
            <CardContent className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Organizer account
                </p>
                <p className="text-sm text-muted-foreground">
                  {user.firstName} {user.lastName} ({user.email})
                </p>
              </div>

              <div className="flex gap-3">
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
                      {submittingLabel}
                    </>
                  ) : (
                    submitLabel
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          </Form>
        );
      }}
    </Formik>
  );
}

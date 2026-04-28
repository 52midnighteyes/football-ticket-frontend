import { format } from "date-fns";
import { CalendarDaysIcon, Clock3Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateTimePickerProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function parseDateTime(value: string) {
  if (!value) {
    return { date: undefined, time: "" };
  }

  const [datePart, timePart] = value.split("T");
  const [year, month, day] = (datePart ?? "").split("-").map(Number);
  const [hours, minutes] = (timePart ?? "00:00").split(":").map(Number);

  if (!year || !month || !day) {
    return { date: undefined, time: "" };
  }

  return {
    date: new Date(year, month - 1, day, hours || 0, minutes || 0),
    time: timePart?.slice(0, 5) ?? "00:00",
  };
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function buildDateTime(date: Date | undefined, time: string) {
  if (!date) {
    return "";
  }

  const [hours, minutes] = (time || "00:00").split(":");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-").concat(`T${hours ?? "00"}:${minutes ?? "00"}`);
}

function formatDateTimeLabel(value: string) {
  if (!value) {
    return null;
  }

  const { date, time } = parseDateTime(value);

  if (!date) {
    return null;
  }

  return `${format(date, "dd MMM yyyy")}${time ? ` at ${time}` : ""}`;
}

export default function DateTimePicker({
  id,
  label,
  placeholder,
  value,
  onChange,
  disabled = false,
}: DateTimePickerProps) {
  const { date, time } = parseDateTime(value);
  const formattedValue = formatDateTimeLabel(value);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-10 w-full justify-between bg-background px-3 font-normal text-foreground hover:bg-background"
          >
            <span
              className={
                formattedValue ? "text-foreground" : "text-muted-foreground"
              }
            >
              {formattedValue ?? placeholder}
            </span>
            <CalendarDaysIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-[min(24rem,calc(100vw-2rem))] gap-0 overflow-hidden p-0"
        >
          <PopoverHeader className="border-b border-border bg-muted/35 px-4 py-3">
            <PopoverTitle>{label}</PopoverTitle>
            <PopoverDescription className="text-xs">
              Choose the date on the calendar, then adjust the kickoff time.
            </PopoverDescription>
          </PopoverHeader>

          <div className="grid gap-3 px-4 py-4">
            <div className="overflow-hidden rounded-xl border border-border bg-background">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(nextDate) => {
                  onChange(buildDateTime(nextDate, time));
                }}
                captionLayout="dropdown"
                className="w-full"
              />
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor={`${id}-time`}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <Clock3Icon className="h-3.5 w-3.5" />
                Time
              </Label>
              <Input
                id={`${id}-time`}
                type="time"
                value={time}
                onChange={(event) => {
                  onChange(buildDateTime(date, event.target.value));
                }}
                className="h-10 bg-background"
                disabled={!date}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange("")}
              >
                Clear
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

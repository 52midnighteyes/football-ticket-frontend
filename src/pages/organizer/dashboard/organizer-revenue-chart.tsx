import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { getOrganizerRevenue } from "@/api/transaction/transaction.api";
import type {
  IOrganizerRevenueAnalytics,
  IOrganizerRevenueItem,
  OrganizerRevenueGroupBy,
} from "@/api/transaction/transaction.interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { formatRupiah } from "@/pages/transaction/transaction.utils";

const monthOptions = [
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },
];

const groupByOptions: Array<{
  label: string;
  value: OrganizerRevenueGroupBy;
}> = [
  { label: "By year", value: "year" },
  { label: "By month", value: "month" },
  { label: "By day", value: "day" },
];

interface OrganizerRevenueChartProps {
  organizerId?: string;
}

export function OrganizerRevenueChart({
  organizerId,
}: OrganizerRevenueChartProps) {
  const [overview, setOverview] = useState<IOrganizerRevenueAnalytics | null>(
    null,
  );
  const [analytics, setAnalytics] = useState<IOrganizerRevenueAnalytics | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<OrganizerRevenueGroupBy>("year");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1,
  );
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    const loadOverview = async () => {
      try {
        const response = await getOrganizerRevenue({
          groupBy: "year",
          organizerId,
        });

        if (isCancelled) {
          return;
        }

        const nextOverview = response.data ?? null;
        setOverview(nextOverview);

        const latestYear = nextOverview?.items.at(-1)?.period;
        setSelectedYear(
          (currentValue) =>
            currentValue ??
            (latestYear ? Number(latestYear) : new Date().getFullYear()),
        );
      } catch (error) {
        if (isCancelled) {
          return;
        }

        const message = axios.isAxiosError(error)
          ? (error.response?.data?.message ??
            "Failed to load organizer revenue")
          : "Failed to load organizer revenue";

        setErrorMessage(message);
        toast.error(message);
      }
    };

    void loadOverview();

    return () => {
      isCancelled = true;
    };
  }, [organizerId, refreshKey]);

  useEffect(() => {
    let isCancelled = false;

    const loadAnalytics = async () => {
      if ((groupBy === "month" || groupBy === "day") && !selectedYear) {
        return;
      }

      if (groupBy === "day" && !selectedMonth) {
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);

        const response =
          groupBy === "year"
            ? await getOrganizerRevenue({
                groupBy: "year",
                organizerId,
              })
            : await getOrganizerRevenue({
                groupBy,
                organizerId,
                year: selectedYear ?? undefined,
                month: groupBy === "day" ? selectedMonth : undefined,
              });

        if (isCancelled) {
          return;
        }

        setAnalytics(response.data ?? null);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        const message = axios.isAxiosError(error)
          ? (error.response?.data?.message ?? "Failed to load revenue chart")
          : "Failed to load revenue chart";

        setErrorMessage(message);
        toast.error(message);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadAnalytics();

    return () => {
      isCancelled = true;
    };
  }, [groupBy, organizerId, refreshKey, selectedMonth, selectedYear]);

  const availableYears = useMemo(() => {
    return (overview?.items ?? [])
      .map((item) => Number(item.period))
      .filter((value) => Number.isFinite(value));
  }, [overview?.items]);

  const chartData = analytics?.items ?? [];

  const activeSummary = analytics ?? overview;

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">Revenue analytics</CardTitle>
            <p className="text-sm text-muted-foreground">
              Combined organizer revenue from all finished event transactions.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex w-full flex-col gap-2 sm:w-44">
              <span className="text-sm font-medium text-foreground">
                Group by
              </span>
              <Select
                value={groupBy}
                onValueChange={(value) =>
                  setGroupBy(value as OrganizerRevenueGroupBy)
                }
              >
                <SelectTrigger className="h-10 w-full bg-background">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  {groupByOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {groupBy !== "year" ? (
              <div className="flex w-full flex-col gap-2 sm:w-36">
                <span className="text-sm font-medium text-foreground">
                  Year
                </span>
                <Select
                  value={selectedYear ? String(selectedYear) : undefined}
                  onValueChange={(value) => setSelectedYear(Number(value))}
                >
                  <SelectTrigger className="h-10 w-full bg-background">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {groupBy === "day" ? (
              <div className="flex w-full flex-col gap-2 sm:w-40">
                <span className="text-sm font-medium text-foreground">
                  Month
                </span>
                <Select
                  value={String(selectedMonth)}
                  onValueChange={(value) => setSelectedMonth(Number(value))}
                >
                  <SelectTrigger className="h-10 w-full bg-background">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((month) => (
                      <SelectItem key={month.value} value={String(month.value)}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            label="Total revenue"
            value={formatRupiah(activeSummary?.totalRevenue ?? 0)}
          />
          <SummaryCard label="Buckets shown" value={String(chartData.length)} />
          <SummaryCard
            label="Active grain"
            value={
              groupByOptions.find((option) => option.value === groupBy)
                ?.label ?? "By year"
            }
          />
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex min-h-72 items-center justify-center gap-3 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" />
            Loading revenue analytics...
          </div>
        ) : errorMessage ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAnalytics(null);
                setIsLoading(true);
                setErrorMessage(null);
                setRefreshKey((currentValue) => currentValue + 1);
              }}
            >
              Retry
            </Button>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex min-h-72 items-center justify-center text-sm text-muted-foreground">
            No finished transactions yet for revenue analytics.
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 12, left: 12, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  stroke="var(--muted-foreground)"
                />
                <YAxis
                  width={72}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  stroke="var(--muted-foreground)"
                  tickFormatter={(value: number) => formatCompactRupiah(value)}
                />
                <Tooltip
                  cursor={{ fill: "rgba(34, 94, 52, 0.08)" }}
                  content={<RevenueTooltip />}
                />
                <Bar
                  dataKey="revenue"
                  radius={[10, 10, 0, 0]}
                  fill="var(--color-chart-2)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 truncate text-xl font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: IOrganizerRevenueItem }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const revenue = payload[0]?.value ?? 0;

  return (
    <div className="rounded-2xl border border-border/80 bg-popover px-4 py-3 text-sm shadow-lg">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-muted-foreground">{formatRupiah(revenue)}</p>
    </div>
  );
}

function formatCompactRupiah(value: number) {
  if (value >= 1_000_000_000) {
    return `Rp${(value / 1_000_000_000).toFixed(1)}B`;
  }

  if (value >= 1_000_000) {
    return `Rp${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `Rp${(value / 1_000).toFixed(0)}K`;
  }

  return `Rp${value}`;
}

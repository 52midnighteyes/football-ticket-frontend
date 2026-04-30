import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted/30 px-6 pt-28 pb-10 lg:px-20">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card className="overflow-hidden border-border bg-card shadow-sm">
          <CardContent className="flex flex-col gap-6 p-8 text-center md:p-10">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
                404 Error
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                Page not found
              </h1>
              <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                The page you are looking for does not exist, may have been
                moved, or is temporarily unavailable.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button type="button" onClick={() => navigate("/")}>
                Go to home
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Go back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Spinner } from "./ui/spinner";
interface IRedirectCardParams {
  title: string;
  description: string;
}

export default function RedirectCard(params: IRedirectCardParams) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-background px-10 pt-10">
      <div className="flex min-w-70 w-fit h-fit flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-md">
        <h3 className="text-primary font-bold text-center">{params.title}</h3>
        <p className="font-medium text-center text-muted-foreground">
          {params.description}
        </p>

        <div className="flex items-center gap-1 mt-2">
          <Spinner />
          <p className="text-sm -translate-y-1 text-accent mt-2">
            redirecting ...
          </p>
        </div>
      </div>
    </div>
  );
}

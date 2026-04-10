import { cn } from "@/lib/utils";

type Tone = "error" | "success" | "info";

const tones: Record<Tone, string> = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-ink-200 bg-ink-100 text-ink-700",
};

type Props = React.HTMLAttributes<HTMLDivElement> & { tone?: Tone };

export function Alert({ tone = "info", className, ...props }: Props) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

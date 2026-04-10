import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "success" | "muted";

const tones: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-700",
  accent: "bg-accent-soft text-accent-hover",
  success: "bg-emerald-50 text-emerald-700",
  muted: "bg-ink-50 text-ink-500 border border-ink-200",
};

type Props = React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone };

export function Badge({ tone = "neutral", className, ...props }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide uppercase",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

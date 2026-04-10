import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-16 text-center",
        className,
      )}
    >
      <h3 className="font-display text-2xl text-ink-900">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-ink-500">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

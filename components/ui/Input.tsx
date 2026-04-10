import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-11 w-full rounded-xl border border-ink-200 bg-white px-4 text-sm",
          "placeholder:text-ink-400",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;
export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn("text-sm font-medium text-ink-700", className)}
      {...props}
    />
  );
}

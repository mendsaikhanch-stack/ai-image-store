import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  width?: "tight" | "wide";
};

export function Container({
  width = "tight",
  className,
  children,
  ...props
}: Props) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        width === "tight" ? "max-w-6xl" : "max-w-7xl",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

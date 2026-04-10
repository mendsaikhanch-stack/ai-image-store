import { Container } from "@/components/ui/Container";

export default function ShopLoading() {
  return (
    <Container className="py-16">
      <div className="h-6 w-24 animate-pulse rounded bg-ink-100" />
      <div className="mt-4 h-10 w-80 animate-pulse rounded bg-ink-100" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/5] animate-pulse rounded-2xl bg-ink-100"
          />
        ))}
      </div>
    </Container>
  );
}

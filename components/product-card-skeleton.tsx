import { cn } from "@/lib/utils";

type ProductCardSkeletonProps = {
  layout?: "grid" | "list";
};

export function ProductCardSkeleton({ layout = "grid" }: ProductCardSkeletonProps) {
  const isList = layout === "list";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "grid min-h-full animate-pulse overflow-hidden rounded-card border border-black/10 bg-white",
        isList ? "grid-cols-[132px_1fr] sm:grid-cols-[180px_1fr]" : "grid-rows-[auto_1fr]"
      )}
    >
      <div
        className={cn(
          "bg-industrial-paper",
          isList ? "min-h-36 border-r border-black/10 sm:min-h-44" : "aspect-[4/3]"
        )}
      />
      <div
        className={cn(
          "flex flex-col gap-3 border-t border-black/10 p-4",
          isList && "border-t-0"
        )}
      >
        <div className="h-2.5 w-1/3 rounded bg-industrial-paper" />
        <div className="h-3.5 w-4/5 rounded bg-industrial-paper" />
        <div className="h-3.5 w-3/5 rounded bg-industrial-paper" />
        <div className="mt-2 h-6 w-1/2 rounded bg-industrial-paper" />
        <div className="h-9 w-full rounded-md bg-industrial-paper" />
      </div>
    </div>
  );
}

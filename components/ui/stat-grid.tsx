import { cn } from "@/lib/utils";

type Stat = {
  label: string;
  value: string | number;
};

type StatGridProps = {
  stats: Stat[];
  className?: string;
};

export function StatGrid({ stats, className }: StatGridProps) {
  return (
    <div
      className={cn(
        "grid divide-x divide-industrial-rail border border-industrial-rail text-center text-xs font-bold",
        className
      )}
      style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
    >
      {stats.map((stat) => (
        <div className="px-4 py-2" key={stat.label}>
          <span className="block text-industrial-pine">{stat.value}</span>
          {stat.label}
        </div>
      ))}
    </div>
  );
}


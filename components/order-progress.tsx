import type { FulfillmentMethod, OrderStatus } from "@/lib/platform-backend";
import { cn } from "@/lib/utils";

type OrderProgressProps = {
  status: OrderStatus;
  fulfillmentMethod: FulfillmentMethod;
  compact?: boolean;
};

type ProgressStep = {
  id: string;
  label: string;
  note: string;
};

const pickupSteps: ProgressStep[] = [
  {
    id: "draft",
    label: "Placed",
    note: "Order captured and awaiting processing."
  },
  {
    id: "confirmed",
    label: "Confirmed",
    note: "Order details approved and routed to fulfillment."
  },
  {
    id: "picking",
    label: "Picking",
    note: "Warehouse is assembling your order."
  },
  {
    id: "ready_for_pickup",
    label: "Ready",
    note: "Order is staged and ready for pickup."
  },
  {
    id: "completed",
    label: "Picked up",
    note: "Customer has picked up the order."
  }
];

const deliverySteps: ProgressStep[] = [
  {
    id: "draft",
    label: "Placed",
    note: "Order captured and awaiting processing."
  },
  {
    id: "confirmed",
    label: "Confirmed",
    note: "Order details approved and routed to fulfillment."
  },
  {
    id: "picking",
    label: "Picking",
    note: "Warehouse is assembling your order."
  },
  {
    id: "out_for_delivery",
    label: "En route",
    note: "Package is out for delivery."
  },
  {
    id: "completed",
    label: "Delivered",
    note: "Delivery has been completed."
  }
];

const progressIndexByStatus: Record<OrderStatus, number> = {
  draft: 0,
  submitted: 0,
  confirmed: 1,
  picking: 2,
  ready_for_pickup: 3,
  out_for_delivery: 3,
  completed: 4,
  cancelled: 0
};

const progressLabelByStatus: Record<OrderStatus, string> = {
  draft: "Order received",
  submitted: "Order received",
  confirmed: "In processing queue",
  picking: "Warehouse picking",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled"
};

function getProgressStatus(status: OrderStatus, fulfillmentMethod: FulfillmentMethod) {
  const steps = fulfillmentMethod === "pickup" ? pickupSteps : deliverySteps;
  if (status === "cancelled") {
    return {
      steps,
      activeIndex: 0,
      currentStep: steps[0],
      completed: true,
      cancelled: true,
      percent: 0,
      label: "Order cancelled"
    };
  }

  const normalizedStatus = status === "submitted" ? "submitted" : status;
  const activeIndex = Math.min(
    Math.max(progressIndexByStatus[normalizedStatus] ?? 0, 0),
    steps.length - 1
  );

  return {
    steps,
    activeIndex,
    currentStep: steps[activeIndex],
    completed: status === "completed",
    cancelled: false,
    percent:
      activeIndex === steps.length - 1
        ? 100
        : (activeIndex / (steps.length - 1)) * 100,
    label: progressLabelByStatus[status]
  };
}

export function OrderProgressBar({
  status,
  fulfillmentMethod,
  compact = false
}: OrderProgressProps) {
  const { steps, activeIndex, currentStep, cancelled, percent, label } =
    getProgressStatus(status, fulfillmentMethod);

  if (compact) {
    return (
      <div className="grid gap-2">
        <div className="flex items-center justify-between text-xs text-industrial-steel">
          <span className="font-semibold text-industrial-ink">{label}</span>
          <span>{cancelled ? "0" : `${activeIndex + 1}/${steps.length}`}</span>
        </div>
        <div className="h-2 rounded-full bg-industrial-paper">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              cancelled
                ? "bg-industrial-rail"
                : "bg-industrial-ink"
            )}
            style={{ width: `${cancelled ? 0 : percent}%` }}
          />
        </div>
        <p className="text-xs text-industrial-muted">{currentStep?.note}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-xs text-industrial-steel">
        <span className="font-semibold text-industrial-ink">{label}</span>
        <span>{currentStep?.label}</span>
      </div>
      <div className="h-2 rounded-full bg-industrial-paper">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            cancelled ? "bg-industrial-rail" : "bg-industrial-ink"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <ol className="grid gap-1 text-[11px] text-industrial-muted sm:flex sm:items-center sm:justify-between">
        {steps.map((step, index) => (
          <li
            className={cn(
              "flex items-center gap-2",
              index <= activeIndex
                ? "font-semibold text-industrial-ink"
                : "text-industrial-muted"
            )}
            key={step.id}
          >
            <span
              className={cn(
                "grid size-4 shrink-0 place-items-center rounded-full border text-[10px]",
                index <= activeIndex
                  ? "border-industrial-ink bg-industrial-ink text-white"
                  : "border-industrial-rail text-industrial-ink"
              )}
            >
              {index + 1}
            </span>
            <span>{step.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

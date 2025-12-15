import { TURNAROUND_OPTIONS } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

type TurnaroundType = keyof typeof TURNAROUND_OPTIONS;

interface TurnaroundSelectorProps {
  value: TurnaroundType;
  onChange: (value: TurnaroundType) => void;
}

export function TurnaroundSelector({ value, onChange }: TurnaroundSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Turnaround Time</label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.entries(TURNAROUND_OPTIONS) as [TurnaroundType, typeof TURNAROUND_OPTIONS[TurnaroundType]][]).map(
          ([key, option]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`p-4 rounded-md border text-left transition-all hover-elevate active-elevate-2 ${
                value === key
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border"
              }`}
              data-testid={`button-turnaround-${key}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{option.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{option.description}</p>
              {option.multiplier > 1 && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  +{Math.round((option.multiplier - 1) * 100)}%
                </Badge>
              )}
            </button>
          )
        )}
      </div>
    </div>
  );
}

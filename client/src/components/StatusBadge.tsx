import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_LABELS } from "@shared/schema";

type JobStatus = keyof typeof JOB_STATUS_LABELS;

const STATUS_COLORS: Record<JobStatus, string> = {
  draft: "bg-muted text-muted-foreground border-muted-border",
  quoted: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  pending_payment: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  paid: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  assigned: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  in_review: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  revision_requested: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  disputed: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

interface StatusBadgeProps {
  status: JobStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`${STATUS_COLORS[status]} border`}
      data-testid={`badge-status-${status}`}
    >
      {JOB_STATUS_LABELS[status]}
    </Badge>
  );
}

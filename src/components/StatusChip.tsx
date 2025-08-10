import { Badge } from "@/components/ui/badge";

export const StatusChip = ({ status }: { status: string }) => {
  const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    Pending: { variant: "outline", label: "Pending" },
    Calling: { variant: "secondary", label: "Calling" },
    Placing: { variant: "secondary", label: "Placing" },
    Ringing: { variant: "default", label: "Ringing" },
    Answered: { variant: "default", label: "Answered" },
    Voicemail: { variant: "secondary", label: "Voicemail" },
    Failed: { variant: "destructive", label: "Failed" },
    Completed: { variant: "default", label: "Completed" },
    completed: { variant: "default", label: "Completed" },
    "in-progress": { variant: "secondary", label: "In Progress" },
    "no-answer": { variant: "secondary", label: "No Answer" },
    busy: { variant: "secondary", label: "Busy" },
  };

  const cfg = map[status] || { variant: "outline", label: String(status || "Unknown") };
  return <Badge variant={cfg.variant as any}>{cfg.label}</Badge>;
};

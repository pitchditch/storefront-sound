import { Badge } from "@/components/ui/badge";
import { CallStatus } from "@/lib/storage";

export const StatusChip = ({ status }: { status: CallStatus }) => {
  const map: Record<CallStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    Pending: { variant: "outline", label: "Pending" },
    Placing: { variant: "secondary", label: "Placing" },
    Ringing: { variant: "default", label: "Ringing" },
    Answered: { variant: "default", label: "Answered" },
    Voicemail: { variant: "secondary", label: "Voicemail" },
    Failed: { variant: "destructive", label: "Failed" },
  };

  const cfg = map[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

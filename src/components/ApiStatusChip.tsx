import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { STORAGE_KEYS } from "@/lib/storage";

type Status = "unset" | "ok" | "warn" | "error";

export const ApiStatusChip = () => {
  const [status, setStatus] = useState<Status>("unset");
  const [message, setMessage] = useState<string>("No Trigger URL set");

  const triggerUrl = useMemo(() => localStorage.getItem(STORAGE_KEYS.CALL_TRIGGER_URL) || "", []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!triggerUrl) return;
      try {
        const r = await fetch(triggerUrl, { method: "GET" });
        // Our function returns 405 for non-POST. That's good.
        if (!cancelled) {
          if (r.status === 405) {
            setStatus("ok");
            setMessage("Endpoint reachable (405 as expected)");
          } else if (r.ok) {
            setStatus("warn");
            setMessage(`Unexpected ${r.status} — expected 405`);
          } else {
            setStatus("error");
            setMessage(`Status ${r.status}`);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setStatus("error");
          setMessage("Network error");
        }
      }
    };
    run();
    return () => { cancelled = true; };
  }, [triggerUrl]);

  const variant = status === "ok" ? "default" : status === "warn" ? "secondary" : status === "unset" ? "outline" : "destructive";
  const label = !triggerUrl ? "API: not set" : status === "ok" ? "API: OK" : status === "warn" ? "API: Check" : status === "error" ? "API: Error" : "API";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant as any}>{label}</Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-xs">{message}{triggerUrl ? "" : " — add it in Settings"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

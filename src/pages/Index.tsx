import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEYS, CallLogEntry } from "@/lib/storage";
import { isValidE164, normalizeToE164Draft } from "@/lib/phone";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PhoneCall } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [notes, setNotes] = useState("");
  const [openConfirm, setOpenConfirm] = useState(false);

  const triggerUrl = useMemo(() => localStorage.getItem(STORAGE_KEYS.CALL_TRIGGER_URL) || "", []);

  useEffect(() => {
    document.title = "Call Storefronts — BC Pressure Washing";
  }, []);

  const disabled = !triggerUrl;

  const appendLog = (entry: CallLogEntry) => {
    const raw = localStorage.getItem(STORAGE_KEYS.CALL_LOGS);
    const list: CallLogEntry[] = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    localStorage.setItem(STORAGE_KEYS.CALL_LOGS, JSON.stringify(list));
  };

  const startCall = async () => {
    const normalized = normalizeToE164Draft(phone);
    if (!isValidE164(normalized)) {
      toast({ title: "Invalid phone number", description: "Use E.164 like +16045550123" });
      return;
    }
    if (!triggerUrl) {
      toast({ title: "Missing Trigger URL", description: "Add it in Settings" });
      return;
    }

    const payload = {
      toPhoneNumber: normalized,
      businessName: businessName || undefined,
      notes: notes || undefined,
    } as const;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      const res = await fetch(triggerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      const ok = res.ok;

      appendLog({
        id,
        timestamp: new Date().toISOString(),
        phone: normalized,
        businessName,
        notes,
        status: ok ? (data.status ?? "Calling") : "Failed",
        callSid: data.callSid ?? data.sid,
        recordingUrl: data.recordingUrl,
        outcome: data.outcome,
      });

      if (ok) {
        toast({ title: "Call triggered", description: "Check Logs for status" });
      } else {
        const code = (data && (data.code || data.error_code)) as string | number | undefined;
        const msg = (data && (data.message || data.error || data.detail)) || res.statusText || "Request failed";
        const hint = res.status === 404
          ? "Endpoint not found — verify your Vercel URL and deployment."
          : res.status === 500 && typeof msg === "string" && msg.toLowerCase().includes("environment")
          ? "Missing env vars on Vercel (TWILIO_* / PUBLIC_BASE_URL)."
          : undefined;
        const description = [msg, code ? `Code: ${code}` : null, hint].filter(Boolean).join(" — ");
        toast({ title: "Failed to trigger", description });
      }
    } catch (e) {
      appendLog({
        id,
        timestamp: new Date().toISOString(),
        phone: normalized,
        businessName,
        notes,
        status: "Failed",
      });
      toast({ title: "Network error", description: "Could not reach your Vercel endpoint (CORS or offline)" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startCall();
  };

  const prefillTest = () => {
    setPhone("+16045550123");
    setBusinessName("Test Store");
    setNotes("");
    setOpenConfirm(true);
  };

  return (
    <AppLayout>
      <section className="container mx-auto px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Call Storefronts & Win More Business</h1>
            <p className="text-muted-foreground">Book monthly window cleaning packages in minutes with our AI caller.</p>
          </header>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Call Launcher</CardTitle>
              <CardDescription>Trigger a single outbound call via your Vercel API.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Phone number (E.164)</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(normalizeToE164Draft(e.target.value))}
                    placeholder="+16045550123"
                    inputMode="tel"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Business name (optional)</label>
                  <Input value={businessName} onChange={(e)=>setBusinessName(e.target.value)} placeholder="Acme Coffee" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Notes (optional)</label>
                  <Textarea value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Caller tips, context, etc." />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button type="submit" disabled={disabled} className="flex-1">
                    <PhoneCall className="mr-2 h-4 w-4" /> Start Call
                  </Button>
                  <Dialog open={openConfirm} onOpenChange={setOpenConfirm}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="secondary" onClick={prefillTest}>Test Call</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send Test Call?</DialogTitle>
                      </DialogHeader>
                      <div className="text-sm">
                        <p className="mb-2">Payload to be sent:</p>
                        <pre className="bg-muted p-3 rounded-md overflow-auto">
{JSON.stringify({ toPhoneNumber: normalizeToE164Draft(phone||"+16045550123"), businessName: businessName||"Test Store", notes: notes||undefined }, null, 2)}
                        </pre>
                        <div className="mt-4 flex justify-end gap-3">
                          <Button variant="secondary" onClick={()=>setOpenConfirm(false)}>Cancel</Button>
                          <Button onClick={()=>{ setOpenConfirm(false); startCall(); }}>Send</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {disabled && (
                  <p className="text-sm text-muted-foreground">Add your Vercel Trigger URL in <Link to="/settings" className="underline">Settings</Link> to enable calls.</p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppLayout>
  );
};

export default Index;

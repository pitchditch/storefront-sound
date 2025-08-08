import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { STORAGE_KEYS } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
const DEFAULT_SMS = "Hey {{business_name}}, it’s Jayden from BC Pressure Washing. Here’s your quote link: {{quote_link}} — reply YES to book.";

const Settings = () => {
  const { toast } = useToast();
  const [url, setUrl] = useLocalStorage<string>(STORAGE_KEYS.CALL_TRIGGER_URL, "https://storefront-sound.vercel.app/api/trigger-call");
  const [sms, setSms] = useLocalStorage<string>(STORAGE_KEYS.SMS_TEMPLATE, DEFAULT_SMS);
  const [vm, setVm] = useLocalStorage<string>(STORAGE_KEYS.VOICEMAIL_SCRIPT, "Friendly voicemail script for your agent.");

  useEffect(() => { document.title = "Settings — BC Pressure Washing"; }, []);

  const [running, setRunning] = useState(false);
  const [checks, setChecks] = useState<{ name: string; status: "ok" | "warn" | "error"; detail?: string }[]>([]);
  const baseOrigin = useMemo(() => {
    try { return url ? new URL(url).origin : ""; } catch { return ""; }
  }, [url]);

  const save = () => {
    // useLocalStorage already persists on state change; trigger a toast
    toast({ title: "Settings saved" });
  };

  const runHealthChecks = async () => {
    if (!url) {
      toast({ title: "Add Trigger URL first" });
      return;
    }
    setRunning(true);
    const results: { name: string; status: "ok" | "warn" | "error"; detail?: string }[] = [];

    // 1) GET should return 405 (method not allowed)
    try {
      const r = await fetch(url, { method: "GET" });
      results.push({ name: "GET /api/trigger-call", status: r.status === 405 ? "ok" : (r.ok ? "warn" : "error"), detail: `HTTP ${r.status}` });
    } catch {
      results.push({ name: "GET /api/trigger-call", status: "error", detail: "Network error" });
    }

    // 2) OPTIONS should be 200 with CORS
    try {
      const r = await fetch(url, { method: "OPTIONS" });
      results.push({ name: "OPTIONS (CORS)", status: r.ok ? "ok" : "error", detail: `HTTP ${r.status}` });
    } catch {
      results.push({ name: "OPTIONS (CORS)", status: "error", detail: "Network error" });
    }

    // 3) GET /api/twiml should be 200 and XML
    if (baseOrigin) {
      try {
        const tw = await fetch(`${baseOrigin}/api/twiml`);
        const ct = tw.headers.get("content-type") || "";
        const isXml = ct.includes("xml");
        results.push({ name: "GET /api/twiml", status: tw.ok && isXml ? "ok" : (tw.ok ? "warn" : "error"), detail: `HTTP ${tw.status}${isXml?" (xml)":""}` });
      } catch {
        results.push({ name: "GET /api/twiml", status: "error", detail: "Network error" });
      }
    } else {
      results.push({ name: "GET /api/twiml", status: "warn", detail: "Invalid base URL" });
    }

    // 4) POST reachability (may 400/500 if env vars missing)
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "X-Health-Check": "true" }, body: JSON.stringify({ toPhoneNumber: "+15005550006" }) });
      const txt = await r.text();
      results.push({ name: "POST /api/trigger-call", status: r.ok ? "ok" : "warn", detail: `HTTP ${r.status}${txt?": "+txt.slice(0,120):""}` });
    } catch {
      results.push({ name: "POST /api/trigger-call", status: "error", detail: "Network/CORS error" });
    }

    setChecks(results);
    setRunning(false);

    const allOk = results.every(r => r.status === "ok" || r.status === "warn");
    toast({ title: allOk ? "Health checks complete" : "Some checks failed" });
  };
  return (
    <AppLayout>
      <section className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vercel Trigger URL</CardTitle>
              <CardDescription>POST requests will be sent here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="https://your-app.vercel.app/api/trigger-call" />
              <Button onClick={save} disabled={!url}>Save Settings</Button>
              <p className="text-sm text-muted-foreground">Saved under key <code className="font-mono">{STORAGE_KEYS.CALL_TRIGGER_URL}</code>.</p>
              <p className="text-sm text-muted-foreground">Your Trigger URL is stored in localStorage under <code className="font-mono">{STORAGE_KEYS.CALL_TRIGGER_URL}</code>.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Follow-up SMS Template</CardTitle>
              <CardDescription>Use placeholders like <code className="font-mono">{"{{business_name}}"}</code> and <code className="font-mono">{"{{quote_link}}"}</code>.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={sms} onChange={(e)=>setSms(e.target.value)} rows={4} />
              <Button onClick={save}>Save Template</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Voicemail Script</CardTitle>
              <CardDescription>Display-only helper for your agent.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={vm} onChange={(e)=>setVm(e.target.value)} rows={4} />
              <Button onClick={save}>Save Script</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vercel Environment Hints</CardTitle>
              <CardDescription>Set these in your Vercel project for your API.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 text-sm space-y-1">
                <li>TWILIO_ACCOUNT_SID</li>
                <li>TWILIO_AUTH_TOKEN</li>
                <li>TWILIO_FROM_NUMBER</li>
                <li>ELEVENLABS_AGENT_ID</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Run Health Checks</CardTitle>
              <CardDescription>Quickly verify your deployed endpoints and CORS.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Button onClick={runHealthChecks} disabled={!url || running}>{running ? "Running..." : "Run Health Checks"}</Button>
                <span className="text-xs text-muted-foreground truncate">{url}</span>
              </div>
              <div className="space-y-2">
                {checks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No results yet. Click "Run Health Checks".</p>
                ) : (
                  <ul className="space-y-2">
                    {checks.map((c, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-3">
                        <div className="text-sm">{c.name}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant={c.status === "ok" ? "default" : c.status === "warn" ? "secondary" : "destructive"}>{c.status.toUpperCase()}</Badge>
                          {c.detail && <span className="text-xs text-muted-foreground">{c.detail}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppLayout>
  );
};

export default Settings;

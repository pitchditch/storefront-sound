import { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { STORAGE_KEYS } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_SMS = "Hey {{business_name}}, it’s Jayden from BC Pressure Washing. Here’s your quote link: {{quote_link}} — reply YES to book.";

const Settings = () => {
  const { toast } = useToast();
  const [url, setUrl] = useLocalStorage<string>(STORAGE_KEYS.CALL_TRIGGER_URL, "");
  const [sms, setSms] = useLocalStorage<string>(STORAGE_KEYS.SMS_TEMPLATE, DEFAULT_SMS);
  const [vm, setVm] = useLocalStorage<string>(STORAGE_KEYS.VOICEMAIL_SCRIPT, "Friendly voicemail script for your agent.");

  useEffect(() => { document.title = "Settings — BC Pressure Washing"; }, []);

  const save = () => {
    // useLocalStorage already persists on state change; trigger a toast
    toast({ title: "Settings saved" });
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
              <p className="text-sm text-muted-foreground">TODO: Paste your final Vercel Trigger URL above.</p>
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
        </div>
      </section>
    </AppLayout>
  );
};

export default Settings;

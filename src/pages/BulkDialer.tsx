import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEYS, CallLogEntry, CallStatus } from "@/lib/storage";
import { isValidE164, normalizeToE164Draft } from "@/lib/phone";
import { StatusChip } from "@/components/StatusChip";

interface CsvRow { phone_number?: string; business_name?: string; notes?: string }

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const BulkDialer = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<(CsvRow & { status: CallStatus })[]>([]);
  const [running, setRunning] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const triggerUrl = useMemo(() => localStorage.getItem(STORAGE_KEYS.CALL_TRIGGER_URL) || "", []);

  useEffect(() => { document.title = "Bulk Dialer — BC Pressure Washing"; }, []);

  const appendLog = (entry: CallLogEntry) => {
    const raw = localStorage.getItem(STORAGE_KEYS.CALL_LOGS);
    const list: CallLogEntry[] = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    localStorage.setItem(STORAGE_KEYS.CALL_LOGS, JSON.stringify(list));
  };

  const onFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const mapped = (res.data as CsvRow[]).map((r) => ({
          phone_number: r.phone_number ? normalizeToE164Draft(String(r.phone_number)) : "",
          business_name: r.business_name?.toString() || "",
          notes: r.notes?.toString() || "",
          status: "Pending" as CallStatus,
        }));
        setRows(mapped.filter(r => r.phone_number));
      },
      error: () => toast({ title: "CSV parse error", description: "Please check your file" }),
    });
  };

  const downloadTemplate = () => {
    const csv = "phone_number,business_name,notes\n+16045550123,Test Store,Optional note";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const startBatch = async () => {
    if (!triggerUrl) {
      toast({ title: "Missing Trigger URL", description: "Add it in Settings" });
      return;
    }
    setRunning(true);
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const phone = normalizeToE164Draft(r.phone_number || "");
      if (!isValidE164(phone)) {
        rows[i].status = "Failed";
        setRows([...rows]);
        continue;
      }

      rows[i].status = "Placing";
      setRows([...rows]);

      const payload = {
        toPhoneNumber: phone,
        businessName: r.business_name || undefined,
        notes: r.notes || undefined,
      } as const;

      const id = `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`;

      try {
        const res = await fetch(triggerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        const ok = res.ok;
        rows[i].status = ok ? (data.status ?? "Answered") : "Failed";
        setRows([...rows]);

        appendLog({
          id,
          timestamp: new Date().toISOString(),
          phone,
          businessName: r.business_name || undefined,
          notes: r.notes || undefined,
          status: rows[i].status,
          recordingUrl: data.recordingUrl,
          outcome: data.outcome,
        });
      } catch {
        rows[i].status = "Failed";
        setRows([...rows]);
      }

      await delay(4000);
    }
    setRunning(false);
    toast({ title: "Batch complete", description: "Check Logs for details" });
  };

  return (
    <AppLayout>
      <section className="container mx-auto px-4 py-10">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Dialer</CardTitle>
              <CardDescription>Upload a CSV and place calls sequentially (every 4 seconds).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input type="file" accept=".csv" ref={fileRef} onChange={(e)=>{ const f=e.target.files?.[0]; if (f) onFile(f); }} />
                <Button type="button" variant="secondary" onClick={downloadTemplate}>Download Template</Button>
                <Button onClick={startBatch} disabled={!rows.length || running || !triggerUrl} className="sm:ml-auto">{running?"Running...":"Start Batch"}</Button>
              </div>

              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono">{r.phone_number}</TableCell>
                        <TableCell>{r.business_name}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{r.notes}</TableCell>
                        <TableCell><StatusChip status={r.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {rows.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">No rows yet. Upload a CSV with columns: phone_number, business_name, notes.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppLayout>
  );
};

export default BulkDialer;

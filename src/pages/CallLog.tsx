import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STORAGE_KEYS, CallLogEntry } from "@/lib/storage";
import { StatusChip } from "@/components/StatusChip";

const withinDays = (iso: string, days: number) => {
  const t = new Date(iso).getTime();
  const now = Date.now();
  return now - t <= days * 24 * 60 * 60 * 1000;
};

const CallLog = () => {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("today");
  const [logs, setLogs] = useState<CallLogEntry[]>([]);

  useEffect(() => {
    document.title = "Call Log — BC Pressure Washing";
    const raw = localStorage.getItem(STORAGE_KEYS.CALL_LOGS);
    setLogs(raw ? JSON.parse(raw) : []);
  }, []);

  const filtered = useMemo(() => {
    let base = logs;
    if (tab === "today") base = logs.filter((l) => withinDays(l.timestamp, 1));
    if (tab === "7days") base = logs.filter((l) => withinDays(l.timestamp, 7));
    if (search) {
      const q = search.toLowerCase();
      base = base.filter((l) => l.phone.includes(q) || (l.businessName || "").toLowerCase().includes(q));
    }
    return base;
  }, [logs, search, tab]);

  return (
    <AppLayout>
      <section className="container mx-auto px-4 py-10">
        <div className="max-w-6xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Call Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
                <Tabs value={tab} onValueChange={setTab} className="w-full md:w-auto">
                  <TabsList>
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="7days">7 days</TabsTrigger>
                    <TabsTrigger value="all">All</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Input placeholder="Search phone or business" value={search} onChange={(e)=>setSearch(e.target.value)} className="md:w-72" />
              </div>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>Recording</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>{new Date(l.timestamp).toLocaleString()}</TableCell>
                        <TableCell className="font-mono">{l.phone}</TableCell>
                        <TableCell>{l.businessName}</TableCell>
                        <TableCell><StatusChip status={l.status} /></TableCell>
                        <TableCell>{l.outcome || "-"}</TableCell>
                        <TableCell>{l.recordingUrl ? <a className="underline" href={l.recordingUrl} target="_blank" rel="noreferrer">Link</a> : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filtered.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">No logs yet. Trigger a call from Home or run a batch from Bulk Dialer.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppLayout>
  );
};

export default CallLog;

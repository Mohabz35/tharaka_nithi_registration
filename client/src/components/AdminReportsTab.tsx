import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { downloadCsv } from "@/lib/csv";
import { toast } from "sonner";
import { Download, Loader2, Send, ShieldCheck, Users } from "lucide-react";
import { COUNCIL_SEATS, councilSeatLabel } from "@shared/const";

const kes = (n: number) => `KES ${n.toLocaleString()}`;

function SummaryCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <Card className="bg-[#2a0a1a] border-[#d4af37] border">
      <CardHeader className="pb-2">
        <CardDescription className="text-gray-400 text-xs uppercase tracking-widest">{title}</CardDescription>
        <CardTitle className="text-[#d4af37] text-xl">{value}</CardTitle>
      </CardHeader>
      {hint && (
        <CardContent className="pt-0">
          <p className="text-gray-500 text-xs">{hint}</p>
        </CardContent>
      )}
    </Card>
  );
}

export default function AdminReportsTab() {
  const utils = trpc.useContext();
  const { data: report, isLoading: isLoadingReport } = trpc.admin.getFinancialReport.useQuery();
  const { data: digest, refetch: refetchDigest } = trpc.admin.digestStatus.useQuery();
  const { data: team, isLoading: isLoadingTeam } = trpc.admin.listUsers.useQuery();

  const [sendingDigest, setSendingDigest] = useState(false);
  const [savingRole, setSavingRole] = useState<number | null>(null);
  const [savingSeat, setSavingSeat] = useState<number | null>(null);

  const digestMutation = trpc.admin.sendWeeklyDigest.useMutation({
    onSuccess: res => {
      setSendingDigest(false);
      if (res.sent) {
        toast.success("Weekly digest sent to the admin inbox.");
        refetchDigest();
      } else {
        toast.error(`Digest not sent${res.reason ? ` (${res.reason})` : ""}.`);
      }
    },
    onError: err => {
      setSendingDigest(false);
      toast.error(err.message || "Failed to send digest");
    },
  });

  const roleMutation = trpc.admin.setUserRole.useMutation({
    onSuccess: (_data, vars) => {
      setSavingRole(null);
      toast.success("Role updated.");
      utils.admin.listUsers.invalidate();
    },
    onError: (err, vars) => {
      setSavingRole(null);
      toast.error(err.message || "Failed to update role");
      utils.admin.listUsers.invalidate();
    },
  });

  const seatMutation = trpc.council.setSeat.useMutation({
    onSuccess: (_data, vars) => {
      setSavingSeat(null);
      toast.success(vars.staffRole ? `Seat assigned: ${councilSeatLabel(vars.staffRole)}.` : "Seat cleared.");
      utils.admin.listUsers.invalidate();
    },
    onError: (err) => {
      setSavingSeat(null);
      toast.error(err.message || "Failed to assign seat");
      utils.admin.listUsers.invalidate();
    },
  });

  const handleSendDigest = () => {
    setSendingDigest(true);
    digestMutation.mutate();
  };

  const handleRoleChange = (userId: number, role: "user" | "admin" | "committee") => {
    setSavingRole(userId);
    roleMutation.mutate({ userId, role });
  };

  const handleSeatChange = (userId: number, staffRole: string) => {
    setSavingSeat(userId);
    // "none" clears the seat; council seats require the committee role.
    seatMutation.mutate({ userId, staffRole: staffRole === "none" ? null : staffRole });
  };

  const exportTransactionsCSV = () => {
    if (!report?.recentTransactions.length) return;
    const headers = ["Date", "Transaction ID", "Customer", "Email", "Amount (KES)", "Method", "Status"];
    const rows = report.recentTransactions.map((tx) => [
      new Date(tx.createdAt).toLocaleString(),
      tx.transactionId,
      tx.orderName ?? "",
      tx.orderEmail ?? "",
      tx.amount,
      tx.paymentMethod,
      tx.status,
    ]);
    downloadCsv("payments", headers, rows);
  };

  const orderTotals = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    (report?.orders || []).forEach(o => {
      map[o.status] = { count: o.count, total: o.total };
    });
    return map;
  }, [report?.orders]);

  if (isLoadingReport) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4af37] mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total collected" value={kes(report?.totalCollected ?? 0)} hint={`${report?.successfulTxCount ?? 0} successful transactions`} />
        <SummaryCard title="Last 7 days" value={kes(report?.collectedLast7Days ?? 0)} hint={`${report?.failedTxCount ?? 0} failed all-time`} />
        <SummaryCard title="Last 30 days" value={kes(report?.collectedLast30Days ?? 0)} hint={`${report?.pendingTxCount ?? 0} pending transactions`} />
        <SummaryCard
          title="Installments outstanding"
          value={kes(report?.installments.outstanding ?? 0)}
          hint={`${report?.installments.overdueCount ?? 0} overdue`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard title="Orders paid" value={String(orderTotals.paid?.count ?? 0)} hint={kes(orderTotals.paid?.total ?? 0)} />
        <SummaryCard title="Orders pending" value={String(orderTotals.pending?.count ?? 0)} hint={kes(orderTotals.pending?.total ?? 0)} />
        <SummaryCard title="Orders cancelled" value={String(orderTotals.cancelled?.count ?? 0)} hint={kes(orderTotals.cancelled?.total ?? 0)} />
      </div>

      {/* Transactions */}
      <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-[#d4af37]">Recent Transactions</CardTitle>
            <CardDescription className="text-gray-400">Latest 50 payment events (all merchandise &amp; instalments)</CardDescription>
          </div>
          <Button onClick={exportTransactionsCSV} disabled={!report?.recentTransactions.length} className="bg-[#d4af37] text-black hover:bg-[#e5c158]">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#d4af37]/30">
                  <TableHead className="text-[#d4af37]">Date</TableHead>
                  <TableHead className="text-[#d4af37]">Customer</TableHead>
                  <TableHead className="text-[#d4af37]">Amount</TableHead>
                  <TableHead className="text-[#d4af37]">Method</TableHead>
                  <TableHead className="text-[#d4af37]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(report?.recentTransactions || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500">No transactions yet.</TableCell>
                  </TableRow>
                )}
                {(report?.recentTransactions || []).map(tx => (
                  <TableRow key={tx.id} className="border-[#d4af37]/20">
                    <TableCell className="text-white text-sm">{new Date(tx.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-white text-sm">
                      {tx.orderName || "—"}
                      <span className="block text-gray-500 text-xs">{tx.orderEmail}</span>
                    </TableCell>
                    <TableCell className="text-[#d4af37]">{kes(tx.amount)}</TableCell>
                    <TableCell className="text-gray-300 text-sm">{tx.paymentMethod}</TableCell>
                    <TableCell>
                      <span className={`text-xs uppercase px-2 py-1 rounded ${tx.status === "success" ? "bg-green-900/50 text-green-400" : tx.status === "failed" ? "bg-red-900/50 text-red-400" : "bg-yellow-900/50 text-yellow-400"}`}>
                        {tx.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Weekly digest */}
      <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-[#d4af37]">Weekly Digest</CardTitle>
            <CardDescription className="text-gray-400">
              A summary email (new registrations, payments, bookings) sent to the admin inbox every 7 days.
            </CardDescription>
          </div>
          <Button onClick={handleSendDigest} disabled={sendingDigest || digestMutation.isPending} className="bg-[#d4af37] text-black hover:bg-[#e5c158]">
            {sendingDigest || digestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Send now
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-white text-sm">
            Last sent:{" "}
            <span className="text-[#d4af37]">
              {digest?.lastSentAt ? new Date(digest.lastSentAt).toLocaleString() : "never"}
            </span>
            {" · "}
            <span className={digest?.due ? "text-yellow-400" : "text-green-400"}>
              {digest?.due ? "due now (auto-sends when an admin opens the dashboard)" : "not due yet"}
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Team access */}
      <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
        <CardHeader>
          <CardTitle className="text-[#d4af37] flex items-center gap-2">
            <Users className="w-5 h-5" /> Team Access
          </CardTitle>
          <CardDescription className="text-gray-400">
            <strong className="text-white">Committee</strong> can view registrations, stats, CSV exports and booking
            enquiries. Only <strong className="text-white">Admin</strong> sees settings, payments, reports and team
            management. Promote someone by having them register an account first, then changing their role here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTeam ? (
            <Loader2 className="w-6 h-6 animate-spin text-[#d4af37]" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#d4af37]/30">
                    <TableHead className="text-[#d4af37]">Name</TableHead>
                    <TableHead className="text-[#d4af37]">Email</TableHead>
                    <TableHead className="text-[#d4af37]">Last signed in</TableHead>
                    <TableHead className="text-[#d4af37]">Role</TableHead>
                    <TableHead className="text-[#d4af37]">Council seat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(team || []).map(u => (
                    <TableRow key={u.id} className="border-[#d4af37]/20">
                      <TableCell className="text-white">{u.name || "—"}</TableCell>
                      <TableCell className="text-gray-300 text-sm">{u.email}</TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString() : "never"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          onValueChange={val => handleRoleChange(u.id, val as "user" | "admin" | "committee")}
                          disabled={savingRole === u.id}
                        >
                          <SelectTrigger className="bg-[#4a1a2a] border-[#d4af37] text-white w-40">
                            <SelectValue />
                          </SelectTrigger>
                              <SelectContent className="bg-[#4a1a2a] border-[#d4af37] text-white">
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="committee">Committee</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        {u.role === "admin" && <ShieldCheck className="w-4 h-4 text-[#d4af37] inline ml-2" />}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={u.staffRole ?? "none"}
                          onValueChange={val => handleSeatChange(u.id, val)}
                          disabled={savingSeat === u.id || u.role === "user"}
                        >
                          <SelectTrigger className="bg-[#4a1a2a] border-[#d4af37] text-white w-52">
                            <SelectValue placeholder="No seat" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#4a1a2a] border-[#d4af37] text-white">
                            <SelectItem value="none">No seat</SelectItem>
                            {COUNCIL_SEATS.map(seat => (
                              <SelectItem key={seat.key} value={seat.key}>
                                {seat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {u.staffRole && (
                          <span className="text-[#d4af37] text-xs ml-2">{councilSeatLabel(u.staffRole)}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

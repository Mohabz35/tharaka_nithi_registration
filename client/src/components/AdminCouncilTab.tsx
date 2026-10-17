import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle2, Crown, Loader2, Send, Wallet, XCircle } from "lucide-react";
import { COUNCIL_SEATS, councilSeatLabel } from "@shared/const";

const kes = (n: number) => `KES ${n.toLocaleString()}`;

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-900/50 text-yellow-400",
  approved: "bg-blue-900/50 text-blue-300",
  rejected: "bg-red-900/50 text-red-400",
  paid: "bg-green-900/50 text-green-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs uppercase px-2 py-1 rounded ${STATUS_STYLES[status] ?? "bg-gray-800 text-gray-300"}`}>
      {status}
    </span>
  );
}

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

export default function AdminCouncilTab() {
  const { user } = useAuth();
  const utils = trpc.useContext();
  const isAdmin = user?.role === "admin";
  const isTreasurer = isAdmin || user?.staffRole === "treasurer";
  const canReadReports = isAdmin || user?.staffRole === "treasurer" || user?.staffRole === "president";

  // Queries (enabled flags keep hooks stable while gating sections)
  const { data: ledger, isLoading: isLoadingLedger } = trpc.council.getFinanceLedger.useQuery(undefined, {
    enabled: isTreasurer,
  });
  const { data: myRequests } = trpc.council.listMyFundRequests.useQuery(undefined, { enabled: isTreasurer });
  const { data: allRequests } = trpc.council.listFundRequests.useQuery(undefined, { enabled: isAdmin });
  const { data: reports } = trpc.council.listFinanceReports.useQuery(undefined, { enabled: canReadReports });
  const { data: vpApplications } = trpc.council.listVpApplications.useQuery(undefined, { enabled: isAdmin });

  // Fund request form
  const [reqType, setReqType] = useState<"advance" | "payout">("payout");
  const [reqAmount, setReqAmount] = useState("");
  const [reqPurpose, setReqPurpose] = useState("");
  const [reqEventDate, setReqEventDate] = useState("");
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  // Report form
  const [repTitle, setRepTitle] = useState("");
  const [repBody, setRepBody] = useState("");
  const [repAmount, setRepAmount] = useState("");
  const [repCategory, setRepCategory] = useState("general");

  // VP account creation state
  const [creatingFor, setCreatingFor] = useState<number | null>(null);
  const [vpName, setVpName] = useState("");
  const [vpEmail, setVpEmail] = useState("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const submitRequest = trpc.council.submitFundRequest.useMutation({
    onSuccess: () => {
      toast.success("Fund request submitted for admin approval.");
      setReqAmount("");
      setReqPurpose("");
      setReqEventDate("");
      utils.council.listMyFundRequests.invalidate();
      utils.council.listFundRequests.invalidate();
    },
    onError: err => toast.error(err.message || "Failed to submit request"),
  });

  const submitReport = trpc.council.submitFinanceReport.useMutation({
    onSuccess: () => {
      toast.success("Finance report submitted.");
      setRepTitle("");
      setRepBody("");
      setRepAmount("");
      utils.council.listFinanceReports.invalidate();
    },
    onError: err => toast.error(err.message || "Failed to submit report"),
  });

  const reviewRequest = trpc.council.reviewFundRequest.useMutation({
    onSuccess: (_data, vars) => {
      setReviewingId(null);
      toast.success(vars.action === "approve" ? "Request approved." : "Request rejected.");
      utils.council.listFundRequests.invalidate();
      utils.council.listMyFundRequests.invalidate();
    },
    onError: err => {
      setReviewingId(null);
      toast.error(err.message || "Failed to review request");
    },
  });

  const markPaid = trpc.council.markFundRequestPaid.useMutation({
    onSuccess: () => {
      toast.success("Marked as paid / disbursed.");
      utils.council.listFundRequests.invalidate();
      utils.council.listMyFundRequests.invalidate();
      utils.council.getFinanceLedger.invalidate();
    },
    onError: err => toast.error(err.message || "Failed to mark paid"),
  });

  const reviewVp = trpc.council.reviewVpApplication.useMutation({
    onSuccess: (res, vars) => {
      if (vars.action === "approve" && "tempPassword" in res && res.tempPassword) {
        setTempPassword(res.tempPassword);
        toast.success("VP account created. Copy the temporary password now.");
      } else {
        toast.success(vars.action === "approve" ? "Application approved." : "Application rejected.");
      }
      setCreatingFor(null);
      utils.council.listVpApplications.invalidate();
      utils.admin.listUsers.invalidate();
    },
    onError: err => {
      setCreatingFor(null);
      toast.error(err.message || "Failed to review application");
    },
  });

  const requestQueue = useMemo(() => allRequests ?? [], [allRequests]);

  if (!isTreasurer && !canReadReports) {
    return (
      <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
        <CardContent className="py-10 text-center text-gray-400">
          Council finance tools are available to the Treasurer and Admin only.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ledger */}
      {isTreasurer && (
        <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
          <CardHeader>
            <CardTitle className="text-[#d4af37] flex items-center gap-2">
              <Wallet className="w-5 h-5" /> Fund Ledger
            </CardTitle>
            <CardDescription className="text-gray-400">
              Auto-tallied from completed registrations, successful payments and disbursed fund requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingLedger ? (
              <Loader2 className="w-6 h-6 animate-spin text-[#d4af37]" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                  title="Funds generated"
                  value={kes(ledger?.fundsGenerated ?? 0)}
                  hint={`${ledger?.completedRegistrationCount ?? 0} paid registrations · ${ledger?.successfulTxCount ?? 0} transactions`}
                />
                <SummaryCard title="Registration fees" value={kes(ledger?.registrationFees ?? 0)} />
                <SummaryCard title="Payments collected" value={kes(ledger?.paymentsCollected ?? 0)} />
                <SummaryCard
                  title="Available balance"
                  value={kes(ledger?.balance ?? 0)}
                  hint={`Disbursed: ${kes(ledger?.disbursed ?? 0)} · Pending out: ${kes(ledger?.pendingOut ?? 0)}`}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fund request form (treasurer / admin) */}
      {isTreasurer && (
        <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
          <CardHeader>
            <CardTitle className="text-[#d4af37]">Request Funds</CardTitle>
            <CardDescription className="text-gray-400">
              Advances and payouts are reviewed and approved by the admin before any disbursement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-gray-300 text-sm">Type</label>
                <Select value={reqType} onValueChange={v => setReqType(v as "advance" | "payout")}>
                  <SelectTrigger className="bg-[#4a1a2a] border-[#d4af37] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#4a1a2a] border-[#d4af37] text-white">
                    <SelectItem value="advance">Advance</SelectItem>
                    <SelectItem value="payout">Payout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-gray-300 text-sm">Amount (KES)</label>
                <Input
                  type="number"
                  min={1}
                  value={reqAmount}
                  onChange={e => setReqAmount(e.target.value)}
                  className="bg-[#4a1a2a] border-[#d4af37] text-white"
                  placeholder="e.g. 15000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-gray-300 text-sm">Purpose</label>
              <Textarea
                value={reqPurpose}
                onChange={e => setReqPurpose(e.target.value)}
                className="bg-[#4a1a2a] border-[#d4af37] text-white"
                placeholder="What is the money for?"
              />
            </div>
            <div className="space-y-2 max-w-xs">
              <label className="text-gray-300 text-sm">Event date (optional)</label>
              <Input
                type="date"
                value={reqEventDate}
                onChange={e => setReqEventDate(e.target.value)}
                className="bg-[#4a1a2a] border-[#d4af37] text-white"
              />
            </div>
            <Button
              onClick={() =>
                submitRequest.mutate({
                  type: reqType,
                  amount: Number(reqAmount),
                  purpose: reqPurpose,
                  eventDate: reqEventDate || undefined,
                })
              }
              disabled={submitRequest.isPending || !reqAmount || !reqPurpose}
              className="bg-[#d4af37] text-black hover:bg-[#e5c158]"
            >
              {submitRequest.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Submit request
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Admin: review queue */}
      {isAdmin && (
        <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
          <CardHeader>
            <CardTitle className="text-[#d4af37]">Fund Request Queue</CardTitle>
            <CardDescription className="text-gray-400">
              Approve or reject treasurer requests. Approved requests can then be marked paid once disbursed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#d4af37]/30">
                    <TableHead className="text-[#d4af37]">Date</TableHead>
                    <TableHead className="text-[#d4af37]">Requester</TableHead>
                    <TableHead className="text-[#d4af37]">Type</TableHead>
                    <TableHead className="text-[#d4af37]">Amount</TableHead>
                    <TableHead className="text-[#d4af37]">Purpose</TableHead>
                    <TableHead className="text-[#d4af37]">Status</TableHead>
                    <TableHead className="text-[#d4af37] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestQueue.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500">
                        No fund requests yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {requestQueue.map(r => (
                    <TableRow key={r.id} className="border-[#d4af37]/20">
                      <TableCell className="text-white text-sm">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-white text-sm">
                        {r.requesterName ?? "—"}
                        <span className="block text-gray-500 text-xs">{r.requesterEmail}</span>
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm capitalize">{r.type}</TableCell>
                      <TableCell className="text-[#d4af37]">{kes(r.amount)}</TableCell>
                      <TableCell className="text-gray-300 text-sm max-w-[220px] truncate" title={r.purpose}>
                        {r.purpose}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {r.status === "pending" && (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              disabled={reviewingId === r.id || reviewRequest.isPending}
                              onClick={() => {
                                setReviewingId(r.id);
                                reviewRequest.mutate({ requestId: r.id, action: "approve" });
                              }}
                              className="bg-green-700 hover:bg-green-600 text-white"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              disabled={reviewingId === r.id || reviewRequest.isPending}
                              onClick={() => {
                                setReviewingId(r.id);
                                reviewRequest.mutate({ requestId: r.id, action: "reject" });
                              }}
                              className="bg-red-700 hover:bg-red-600 text-white"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        {r.status === "approved" && (
                          <Button
                            size="sm"
                            disabled={markPaid.isPending}
                            onClick={() => markPaid.mutate({ requestId: r.id })}
                            className="bg-[#d4af37] text-black hover:bg-[#e5c158]"
                          >
                            Mark paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My requests (treasurer / admin) */}
      {isTreasurer && (
        <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
          <CardHeader>
            <CardTitle className="text-[#d4af37]">My Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#d4af37]/30">
                    <TableHead className="text-[#d4af37]">Date</TableHead>
                    <TableHead className="text-[#d4af37]">Type</TableHead>
                    <TableHead className="text-[#d4af37]">Amount</TableHead>
                    <TableHead className="text-[#d4af37]">Purpose</TableHead>
                    <TableHead className="text-[#d4af37]">Status</TableHead>
                    <TableHead className="text-[#d4af37]">Admin note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(myRequests ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500">
                        You have not submitted any fund requests.
                      </TableCell>
                    </TableRow>
                  )}
                  {(myRequests ?? []).map(r => (
                    <TableRow key={r.id} className="border-[#d4af37]/20">
                      <TableCell className="text-white text-sm">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-gray-300 text-sm capitalize">{r.type}</TableCell>
                      <TableCell className="text-[#d4af37]">{kes(r.amount)}</TableCell>
                      <TableCell className="text-gray-300 text-sm max-w-[220px] truncate" title={r.purpose}>
                        {r.purpose}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="text-gray-400 text-xs">{r.adminNote ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Finance reports */}
      {canReadReports && (
        <>
          <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Submit Finance Report</CardTitle>
              <CardDescription className="text-gray-400">
                Treasurer and admin submissions appear in the reports inbox below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-gray-300 text-sm">Title</label>
                  <Input
                    value={repTitle}
                    onChange={e => setRepTitle(e.target.value)}
                    className="bg-[#4a1a2a] border-[#d4af37] text-white"
                    placeholder="e.g. Week 1 field spend"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-gray-300 text-sm">Category</label>
                  <Select value={repCategory} onValueChange={setRepCategory}>
                    <SelectTrigger className="bg-[#4a1a2a] border-[#d4af37] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#4a1a2a] border-[#d4af37] text-white">
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="advance">Advance</SelectItem>
                      <SelectItem value="payout">Payout</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2 max-w-xs">
                <label className="text-gray-300 text-sm">Total amount (KES, optional)</label>
                <Input
                  type="number"
                  min={0}
                  value={repAmount}
                  onChange={e => setRepAmount(e.target.value)}
                  className="bg-[#4a1a2a] border-[#d4af37] text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-gray-300 text-sm">Report</label>
                <Textarea
                  value={repBody}
                  onChange={e => setRepBody(e.target.value)}
                  className="bg-[#4a1a2a] border-[#d4af37] text-white min-h-[120px]"
                  placeholder="Breakdown of income, expenditures, receipts held, etc."
                />
              </div>
              <Button
                onClick={() =>
                  submitReport.mutate({
                    title: repTitle,
                    body: repBody,
                    amount: repAmount ? Number(repAmount) : undefined,
                    category: repCategory,
                  })
                }
                disabled={submitReport.isPending || !repTitle || !repBody}
                className="bg-[#d4af37] text-black hover:bg-[#e5c158]"
              >
                {submitReport.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Submit report
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Reports Inbox</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(reports ?? []).length === 0 && <p className="text-gray-500 text-sm">No finance reports yet.</p>}
              {(reports ?? []).map(rep => (
                <div key={rep.id} className="border border-[#d4af37]/30 rounded p-4 bg-[#3a1525]">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h4 className="text-white font-semibold">{rep.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {rep.amount != null && <span className="text-[#d4af37]">{kes(rep.amount)}</span>}
                      <span className="uppercase tracking-widest">{rep.category}</span>
                      <span>{new Date(rep.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{rep.body}</p>
                  <p className="text-gray-500 text-xs mt-2">
                    {rep.submitterName ?? "Unknown"} ({councilSeatLabel(rep.staffRole) || rep.submitterEmail})
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {/* Admin: VP applications */}
      {isAdmin && (
        <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
          <CardHeader>
            <CardTitle className="text-[#d4af37]">Vice President Applications</CardTitle>
            <CardDescription className="text-gray-400">
              Applications for the vacant VP seat. Approving can create the council account with a one-time password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tempPassword && (
              <div className="border border-green-500 bg-green-900/30 rounded p-4">
                <p className="text-green-300 text-sm mb-2">
                  VP account created. Copy this temporary password now — it will not be shown again:
                </p>
                <code className="block bg-black/40 text-[#d4af37] text-lg font-mono p-2 rounded select-all">
                  {tempPassword}
                </code>
                <Button size="sm" variant="ghost" className="text-green-300 mt-2" onClick={() => setTempPassword(null)}>
                  I have copied it
                </Button>
              </div>
            )}
            {(vpApplications ?? []).length === 0 && (
              <p className="text-gray-500 text-sm">No applications yet. The public form is at /vice-president.</p>
            )}
            {(vpApplications ?? []).map(app => (
              <div key={app.id} className="border border-[#d4af37]/30 rounded p-4 bg-[#3a1525]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-white font-semibold">{app.fullName}</h4>
                    <p className="text-gray-400 text-xs">
                      {app.email} · {app.phoneNumber} · {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
                <p className="text-gray-300 text-sm whitespace-pre-wrap mb-3">{app.statement}</p>
                {app.status === "pending" && (
                  <div className="flex flex-wrap items-end gap-3">
                    {creatingFor === app.id ? (
                      <>
                        <div className="space-y-1">
                          <label className="text-gray-300 text-xs">Account name</label>
                          <Input
                            value={vpName}
                            onChange={e => setVpName(e.target.value)}
                            className="bg-[#4a1a2a] border-[#d4af37] text-white h-9 w-48"
                            placeholder={app.fullName}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-gray-300 text-xs">Account email</label>
                          <Input
                            value={vpEmail}
                            onChange={e => setVpEmail(e.target.value)}
                            className="bg-[#4a1a2a] border-[#d4af37] text-white h-9 w-60"
                            placeholder={app.email}
                          />
                        </div>
                        <Button
                          size="sm"
                          disabled={reviewVp.isPending}
                          onClick={() =>
                            reviewVp.mutate({
                              applicationId: app.id,
                              action: "approve",
                              createAccount: true,
                              name: vpName || app.fullName,
                              email: vpEmail || app.email,
                            })
                          }
                          className="bg-green-700 hover:bg-green-600 text-white"
                        >
                          Approve &amp; create account
                        </Button>
                        <Button size="sm" variant="ghost" className="text-gray-400" onClick={() => setCreatingFor(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          disabled={reviewVp.isPending}
                          onClick={() => {
                            setVpName(app.fullName);
                            setVpEmail(app.email);
                            setCreatingFor(app.id);
                          }}
                          className="bg-green-700 hover:bg-green-600 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          disabled={reviewVp.isPending}
                          onClick={() => reviewVp.mutate({ applicationId: app.id, action: "reject" })}
                          className="bg-red-700 hover:bg-red-600 text-white"
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                )}
                {app.adminNote && <p className="text-gray-500 text-xs mt-2">Note: {app.adminNote}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Admin: council seats overview */}
      {isAdmin && (
        <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
          <CardHeader>
            <CardTitle className="text-[#d4af37] flex items-center gap-2">
              <Crown className="w-5 h-5" /> Executive Council Seats
            </CardTitle>
            <CardDescription className="text-gray-400">
              Assign seats from Reports &amp; Team, or create a council account here. Seats map to login accounts via the Committee role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {COUNCIL_SEATS.map(seat => (
                <div key={seat.key} className="border border-[#d4af37]/30 rounded p-3 bg-[#3a1525]">
                  <p className="text-[#d4af37] text-sm font-semibold">{seat.label}</p>
                  <p className="text-white text-sm">{seat.holder ?? <span className="text-yellow-400">Vacant — applications open</span>}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

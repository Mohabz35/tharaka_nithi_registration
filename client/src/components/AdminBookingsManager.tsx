import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, Trash2, Mail, Phone, CalendarDays, BadgeCheck, MessageSquare, CalendarCheck } from "lucide-react";

interface BookingEnquiry {
  id: number;
  registrationId: number;
  modelName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  eventType: string | null;
  eventDate: string | null;
  budget: string | null;
  message: string;
  status: string;
  createdAt: string | Date;
}

const statusStyles: Record<string, string> = {
  new: "bg-yellow-900 text-yellow-200 border-yellow-500/50",
  contacted: "bg-blue-900 text-blue-200 border-blue-500/50",
  closed: "bg-green-900 text-green-200 border-green-500/50",
};

export default function AdminBookingsManager() {
  const [filter, setFilter] = useState<"all" | "new" | "contacted" | "closed">("all");

  const { data: bookings, isLoading } = trpc.bookings.getAll.useQuery();
  const utils = trpc.useContext();

  const invalidate = () => utils.bookings.getAll.invalidate();

  const updateStatus = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => invalidate(),
    onError: () => toast.error("Failed to update status"),
  });

  const deleteBooking = trpc.bookings.delete.useMutation({
    onSuccess: () => {
      toast.success("Enquiry deleted");
      invalidate();
    },
    onError: () => toast.error("Failed to delete enquiry"),
  });

  const filtered = (bookings || []).filter((b: BookingEnquiry) => filter === "all" || b.status === filter);
  const counts = {
    new: (bookings || []).filter((b: BookingEnquiry) => b.status === "new").length,
    contacted: (bookings || []).filter((b: BookingEnquiry) => b.status === "contacted").length,
    closed: (bookings || []).filter((b: BookingEnquiry) => b.status === "closed").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-[#d4af37]">Booking Enquiries</h2>
        <div className="flex gap-2">
          {(["all", "new", "contacted", "closed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs uppercase tracking-widest border transition-colors ${
                filter === s
                  ? "bg-[#d4af37] text-black border-[#d4af37]"
                  : "border-[#d4af37]/40 text-[#d4af37] hover:bg-[#d4af37]/10"
              }`}
            >
              {s} {s !== "all" ? `(${counts[s]})` : `(${(bookings || []).length})`}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-[#d4af37]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm uppercase tracking-widest">Loading enquiries...</span>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-16 text-sm uppercase tracking-widest">No booking enquiries</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((b: BookingEnquiry) => (
            <div key={b.id} className="bg-[#1a0a1a] border border-[#d4af37]/30 p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[#d4af37] font-serif text-xl font-bold">{b.modelName}</p>
                  <p className="text-gray-400 text-sm">
                    <span className="text-white font-semibold">{b.clientName}</span> · for registration #{b.registrationId}
                  </p>
                </div>
                <span className={`text-[10px] uppercase tracking-widest border px-3 py-1 ${statusStyles[b.status] || statusStyles.new}`}>
                  {b.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                <a href={`mailto:${b.clientEmail}`} className="flex items-center gap-1.5 text-[#d4af37] hover:underline">
                  <Mail className="w-3.5 h-3.5" /> {b.clientEmail}
                </a>
                {b.clientPhone && (
                  <a href={`tel:${b.clientPhone}`} className="flex items-center gap-1.5 text-[#d4af37] hover:underline">
                    <Phone className="w-3.5 h-3.5" /> {b.clientPhone}
                  </a>
                )}
                {b.eventType && <span className="flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5 text-[#d4af37]/60" /> {b.eventType}</span>}
                {b.eventDate && <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-[#d4af37]/60" /> {b.eventDate}</span>}
                {b.budget && <span className="text-[#d4af37]">Budget: {b.budget}</span>}
              </div>

              <div className="bg-[#0a0508] border border-[#d4af37]/15 p-3">
                <p className="text-gray-200 text-sm whitespace-pre-line">{b.message}</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-gray-600 text-xs">
                  {new Date(b.createdAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
                </p>
                <div className="flex flex-wrap gap-2">
                  {b.status !== "new" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus.mutate({ id: b.id, status: "new" })}
                      disabled={updateStatus.isPending}
                      className="border-gray-600 text-gray-400 text-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1" /> Mark new
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus.mutate({ id: b.id, status: "contacted" })}
                      disabled={updateStatus.isPending}
                      className="border-blue-500/50 text-blue-300 text-xs"
                    >
                      <Phone className="w-3.5 h-3.5 mr-1" /> Mark contacted
                    </Button>
                  )}
                  {b.status !== "closed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus.mutate({ id: b.id, status: "closed" })}
                      disabled={updateStatus.isPending}
                      className="border-green-500/50 text-green-300 text-xs"
                    >
                      <CalendarCheck className="w-3.5 h-3.5 mr-1" /> Close
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm("Delete this enquiry?")) deleteBooking.mutate(b.id);
                    }}
                    disabled={deleteBooking.isPending}
                    className="border-red-500/50 text-red-400 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

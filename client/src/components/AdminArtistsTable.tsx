import { trpc } from "@/lib/trpc";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function AdminArtistsTable() {
  const { data, isLoading } = trpc.admin.getArtists.useQuery();

  if (isLoading) return <div className="text-center py-8 text-white"><Loader2 className="animate-spin mx-auto w-8 h-8 text-[#d4af37]" /></div>;

  return (
    <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
      <CardHeader>
        <CardTitle className="text-[#d4af37]">Artist Registrations ({data?.length || 0})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#d4af37]">
                <TableHead className="text-[#d4af37]">Art Type</TableHead>
                <TableHead className="text-[#d4af37]">Name</TableHead>
                <TableHead className="text-[#d4af37]">Stage Name</TableHead>
                <TableHead className="text-[#d4af37]">Email</TableHead>
                <TableHead className="text-[#d4af37]">Phone</TableHead>
                <TableHead className="text-[#d4af37]">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((item) => (
                <TableRow key={item.id} className="border-[#4a1a2a] hover:bg-[#4a1a2a]">
                  <TableCell className="text-white font-bold">{item.artType}</TableCell>
                  <TableCell className="text-white">{item.fullName}</TableCell>
                  <TableCell className="text-white">{item.stageName || "-"}</TableCell>
                  <TableCell className="text-white">{item.email}</TableCell>
                  <TableCell className="text-white">{item.phoneNumber}</TableCell>
                  <TableCell className="text-white">{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-white py-4">No artists found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

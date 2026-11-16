import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, Download, Calendar, Package, Pencil, Trash2, Share2, Search, Send } from "lucide-react";
import { format } from "date-fns";
import { formatMoney } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import EditReceiptDialog from "./EditReceiptDialog";

interface ProcessedFile {
  id: string;
  fileName: string;
  originalFileName: string;
  uploadedAt: string;
  status: 'processing' | 'completed' | 'failed';
  merchant?: string;
  total?: string;
  itemCount?: number;
  category?: string;
  processedData?: any;
}

type ExportFormat = 'excel' | 'csv' | 'json';

interface ProcessedFilesListProps {
  files: ProcessedFile[];
  onDownload: (fileIds: string[], format: ExportFormat) => Promise<void>;
  onChanged: () => void;
  userTier: 'freemium' | 'premium';
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Month the bill is dated (Indian bills print day first), or the upload month if the date can't be read.
export const billMonth = (file: ProcessedFile): string => {
  const text = String(file.processedData?.date || "").trim();
  let m = /^(\d{4})-(\d{1,2})-\d{1,2}/.exec(text);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}`;
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(text);
  if (m) {
    let [d, mo, y] = [Number(m[1]), Number(m[2]), m[3]];
    if (mo > 12 && d <= 12) [d, mo] = [mo, d]; // written month-first
    if (mo >= 1 && mo <= 12) return `${y.length === 2 ? "20" + y : y}-${String(mo).padStart(2, "0")}`;
  }
  m = /^(\d{1,2})[\s-]([A-Za-z]{3})[A-Za-z]*[\s-,]+(\d{4})$/.exec(text);
  if (m) {
    const idx = MONTHS.findIndex((x) => x.toLowerCase() === m![2].toLowerCase());
    if (idx >= 0) return `${m[3]}-${String(idx + 1).padStart(2, "0")}`;
  }
  return format(new Date(file.uploadedAt), "yyyy-MM");
};

const monthLabel = (ym: string) => {
  const [y, mo] = ym.split("-");
  return `${MONTHS[Number(mo) - 1]} ${y}`;
};

const EXT: Record<ExportFormat, string> = { excel: "xlsx", csv: "csv", json: "json" };

const ProcessedFilesList: React.FC<ProcessedFilesListProps> = ({ files, onDownload, onChanged, userTier }) => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("all");
  const [editing, setEditing] = useState<ProcessedFile | null>(null);
  const [deleting, setDeleting] = useState<ProcessedFile | null>(null);
  const [busy, setBusy] = useState(false);

  const exportFormats: ExportFormat[] = userTier === 'premium' ? ['excel', 'csv', 'json'] : ['csv'];
  const caFormat: ExportFormat = userTier === 'premium' ? 'excel' : 'csv';

  const months = useMemo(
    () => Array.from(new Set(files.map(billMonth))).sort().reverse(),
    [files]
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return files.filter((f) => {
      if (month !== "all" && billMonth(f) !== month) return false;
      if (!q) return true;
      const d = f.processedData || {};
      return [f.merchant, f.originalFileName, f.category, d.gstin, d.invoiceNumber, d.date]
        .some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [files, query, month]);

  const shownIds = shown.filter((f) => f.status === 'completed').map((f) => f.id);
  const shownTotal = shown.reduce((s, f) => s + (parseFloat(f.total || "0") || 0), 0);

  // On phones this opens the share sheet (WhatsApp, Gmail, ...). Elsewhere it downloads the file.
  const share = async (ids: string[], fmt: ExportFormat) => {
    if (!ids.length) return;
    setBusy(true);
    try {
      const ext = EXT[fmt];
      const file = await api.file(`/receipts/export?format=${ext}&ids=${encodeURIComponent(ids.join(','))}`, `receipts.${ext}`);
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: "Receipts", text: `${ids.length} receipt${ids.length > 1 ? 's' : ''} from SlickReceipts` });
      } else {
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast({ title: "File downloaded", description: "Sharing isn't available in this browser. Attach the file in WhatsApp or email." });
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        toast({ title: "Could not share", description: err.message, variant: "destructive" });
      }
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/receipts/${deleting.id}`);
      toast({ title: "Receipt deleted" });
      onChanged();
    } catch (err: any) {
      toast({ title: "Could not delete", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  if (files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Processed Files
          </CardTitle>
          <CardDescription>Files you've uploaded and processed will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No files processed yet</p>
            <p className="text-sm">Upload your first receipt or document to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Your Processed Files ({files.length})
        </CardTitle>
        <CardDescription>Search, fix, download or share your receipts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search shop, GSTIN, invoice no."
              aria-label="Search receipts"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="sm:w-44" aria-label="Filter by month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All months</SelectItem>
              {months.map((m) => (
                <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* The month's bills in one file: what a CA asks for. */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm text-blue-900">
            <strong>{shownIds.length}</strong> receipt{shownIds.length !== 1 ? 's' : ''}
            {month !== "all" ? ` in ${monthLabel(month)}` : ""}, total <strong>{formatMoney(shownTotal)}</strong>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" disabled={!shownIds.length || busy} onClick={() => share(shownIds, caFormat)}>
              <Send className="mr-1 h-4 w-4" /> Send to my CA
            </Button>
            <Button size="sm" variant="outline" disabled={!shownIds.length || busy} onClick={() => onDownload(shownIds, caFormat)}>
              <Download className="mr-1 h-4 w-4" /> Download {caFormat === 'excel' ? 'Excel' : 'CSV'}
            </Button>
          </div>
          <p className="mt-2 text-xs text-blue-800">
            {userTier === 'premium'
              ? "Excel includes a GST summary sheet: one row per bill with GSTIN, taxable value, CGST, SGST and IGST."
              : "Pick a month above, then share the file on WhatsApp or email."}
          </p>
        </div>

        {shown.length === 0 && <p className="py-6 text-center text-sm text-gray-500">No receipts match.</p>}

        <div className="space-y-3">
          {shown.map((file) => {
            const d = file.processedData || {};
            return (
              <div key={file.id} className="rounded-lg border p-3 md:p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="min-w-0 flex-1 truncate font-medium">{file.merchant || file.originalFileName}</h3>
                  {file.total && <span className="font-semibold">{formatMoney(file.total)}</span>}
                </div>
                <div className="mb-3 grid grid-cols-2 gap-1 text-sm text-gray-600 md:grid-cols-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {d.date || format(new Date(file.uploadedAt), 'MMM d, yyyy')}
                  </div>
                  {!!file.itemCount && (
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {file.itemCount} items
                    </div>
                  )}
                  {d.invoiceNumber && <div className="truncate">Inv. {d.invoiceNumber}</div>}
                  {d.gstin && <div className="truncate">GSTIN {d.gstin}</div>}
                </div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {file.category && <Badge variant="outline" className="text-xs">{file.category}</Badge>}
                  {file.status !== 'completed' && <Badge className="bg-red-100 text-red-800">{file.status}</Badge>}
                  <span className="truncate text-xs text-gray-400">{file.originalFileName}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {file.status === 'completed' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setEditing(file)}>
                        <Pencil className="mr-1 h-3 w-3" /> Edit
                      </Button>
                      {exportFormats.map((fmt) => (
                        <Button key={fmt} size="sm" variant="outline" onClick={() => onDownload([file.id], fmt)}>
                          <Download className="mr-1 h-3 w-3" />
                          {fmt === 'excel' ? 'Excel' : fmt.toUpperCase()}
                        </Button>
                      ))}
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => share([file.id], 'csv')}>
                        <Share2 className="mr-1 h-3 w-3" /> Share
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => setDeleting(file)}>
                    <Trash2 className="mr-1 h-3 w-3" /> Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      <EditReceiptDialog receipt={editing} onClose={() => setEditing(null)} onSaved={onChanged} />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this receipt?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.merchant || deleting?.originalFileName} will be removed from your history. This can't be undone.
              {userTier === 'freemium' && " It still counts towards your 10 free files."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ProcessedFilesList;

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface EditableReceipt {
  id: string;
  merchant?: string;
  total?: string;
  category?: string;
  processedData?: any;
}

interface Item {
  description: string;
  amount: string;
  category: string;
}

interface Props {
  receipt: EditableReceipt | null;
  onClose: () => void;
  onSaved: () => void;
}

const num = (v: string) => {
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// Lets the user fix what the scan got wrong before they download or send it to their CA.
const EditReceiptDialog = ({ receipt, onClose, onSaved }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    merchant: "", date: "", invoiceNumber: "", gstin: "", category: "",
    cgst: "", sgst: "", igst: "", total: "",
  });
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!receipt) return;
    const d = receipt.processedData || {};
    setForm({
      merchant: receipt.merchant || d.merchant || "",
      date: d.date || "",
      invoiceNumber: d.invoiceNumber || "",
      gstin: d.gstin || "",
      category: receipt.category || d.category || "",
      cgst: d.cgst ? String(d.cgst) : "",
      sgst: d.sgst ? String(d.sgst) : "",
      igst: d.igst ? String(d.igst) : "",
      total: receipt.total ?? d.total ?? "",
    });
    setItems(
      (d.items || []).map((i: any) => ({
        description: i.description || "",
        amount: i.amount != null ? String(i.amount) : "",
        category: i.category || "",
      }))
    );
  }, [receipt]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const setItem = (idx: number, key: keyof Item, value: string) =>
    setItems((list) => list.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));

  const save = async () => {
    if (!receipt) return;
    setSaving(true);
    try {
      await api.patch(`/receipts/${receipt.id}`, {
        merchant: form.merchant,
        date: form.date,
        invoiceNumber: form.invoiceNumber,
        gstin: form.gstin,
        category: form.category,
        cgst: num(form.cgst),
        sgst: num(form.sgst),
        igst: num(form.igst),
        total: num(form.total),
        items: items
          .filter((i) => i.description.trim() || i.amount.trim())
          .map((i) => ({ description: i.description.trim(), amount: num(i.amount), category: i.category.trim() })),
      });
      toast({ title: "Receipt saved" });
      onSaved();
      onClose();
    } catch (err: any) {
      toast({ title: "Could not save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="space-y-1">
      <Label htmlFor={`edit-${key}`} className="text-xs text-gray-600">{label}</Label>
      <Input id={`edit-${key}`} value={form[key]} onChange={set(key)} {...props} />
    </div>
  );

  return (
    <Dialog open={!!receipt} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit receipt</DialogTitle>
          <DialogDescription>Fix anything the scan read wrong. Downloads use what you save here.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">{field("merchant", "Shop / merchant")}</div>
          {field("date", "Bill date", { placeholder: "14/11/2026" })}
          {field("invoiceNumber", "Invoice no.")}
          <div className="col-span-2">{field("gstin", "Seller GSTIN", { placeholder: "33ABCDE1234F1Z5", maxLength: 15 })}</div>
          {field("cgst", "CGST ₹", { inputMode: "decimal" })}
          {field("sgst", "SGST ₹", { inputMode: "decimal" })}
          {field("igst", "IGST ₹", { inputMode: "decimal" })}
          {field("total", "Bill total ₹", { inputMode: "decimal" })}
          <div className="col-span-2">{field("category", "Category", { placeholder: "groceries" })}</div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Items</p>
            <Button type="button" size="sm" variant="ghost" onClick={() => setItems((l) => [...l, { description: "", amount: "", category: "" }])}>
              <Plus className="mr-1 h-4 w-4" /> Add item
            </Button>
          </div>
          {items.length === 0 && <p className="text-sm text-gray-500">No items.</p>}
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input aria-label={`Item ${idx + 1} name`} className="flex-1" value={it.description} onChange={(e) => setItem(idx, "description", e.target.value)} />
              <Input aria-label={`Item ${idx + 1} amount`} className="w-24" inputMode="decimal" value={it.amount} onChange={(e) => setItem(idx, "amount", e.target.value)} />
              <Button type="button" size="icon" variant="ghost" aria-label={`Remove item ${idx + 1}`} onClick={() => setItems((l) => l.filter((_, i) => i !== idx))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditReceiptDialog;

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, Share2, Settings } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/utils";
import { CaContact, prettyWhatsapp } from "./CaContactSettings";

interface Props {
  open: boolean;
  onClose: () => void;
  ids: string[];
  label: string; // e.g. "Oct 2026", or "" for all
  total: number;
  fileKind: string; // "Excel" or "CSV"
  onShareOther: () => void;
  onOpenSettings: () => void;
}

const SendToCaDialog = ({ open, onClose, ids, label, total, fileKind, onShareOther, onOpenSettings }: Props) => {
  const { toast } = useToast();
  const [ca, setCa] = useState<CaContact | null>(null);
  const [confirmEmail, setConfirmEmail] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setConfirmEmail(false);
    api.get<CaContact>("/settings/ca").then(setCa).catch(() => setCa(null));
  }, [open]);

  const what = `${ids.length} receipt${ids.length !== 1 ? "s" : ""}${label ? ` for ${label}` : ""}`;
  const caName = ca?.name || "your CA";

  // WhatsApp can't attach a file from a link, so the message carries a private download link (valid 7 days).
  const sendWhatsapp = async () => {
    if (!ca?.whatsapp) return;
    const win = window.open("", "_blank"); // open now, so the browser doesn't block it after the wait
    setBusy(true);
    try {
      const link = await api.post<{ url: string; days: number }>("/ca/link", { ids, label });
      const text =
        `Hello${ca.name ? " " + ca.name : ""}, here are my ${label ? label + " " : ""}bills ` +
        `(${ids.length} receipt${ids.length !== 1 ? "s" : ""}, total ${formatMoney(total)}). ` +
        `Download the ${fileKind} file: ${link.url}\n(Link works for ${link.days} days.)`;
      const url = `https://wa.me/${ca.whatsapp}?text=${encodeURIComponent(text)}`;
      if (win) win.location.href = url;
      else window.location.href = url;
      onClose();
    } catch (err: any) {
      win?.close();
      toast({ title: "Could not prepare the link", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const sendEmail = async () => {
    setBusy(true);
    try {
      const r = await api.post<{ sent_to: string }>("/ca/email", { ids, label });
      toast({ title: "Email sent", description: `Sent to ${r.sent_to}. You'll get a copy too.` });
      onClose();
    } catch (err: any) {
      toast({ title: "Could not send", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const hasContact = !!(ca?.whatsapp || ca?.email);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
        <DialogHeader>
          <DialogTitle>Send to my CA</DialogTitle>
          <DialogDescription>
            {what}, total {formatMoney(total)}, as {fileKind}.
          </DialogDescription>
        </DialogHeader>

        {confirmEmail && ca?.email ? (
          <div className="space-y-4">
            <p className="text-sm">
              Send {what} as an {fileKind} attachment to <strong>{ca.email}</strong>? You'll get a copy, and replies come to you.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmEmail(false)} disabled={busy}>Cancel</Button>
              <Button onClick={sendEmail} disabled={busy}>{busy ? "Sending..." : "Yes, send email"}</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {ca?.whatsapp && (
              <Button className="w-full justify-start bg-green-600 hover:bg-green-700" onClick={sendWhatsapp} disabled={busy}>
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp {caName} ({prettyWhatsapp(ca.whatsapp)})
              </Button>
            )}
            {ca?.email && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setConfirmEmail(true)}
                disabled={busy || !ca.email_enabled}
              >
                <Mail className="mr-2 h-4 w-4" />
                {ca.email_enabled ? `Email ${caName}` : "Email (coming soon)"}
              </Button>
            )}
            <Button variant="outline" className="w-full justify-start" onClick={() => { onClose(); onShareOther(); }} disabled={busy}>
              <Share2 className="mr-2 h-4 w-4" />
              Other app or download
            </Button>
            {!hasContact && (
              <Button variant="link" className="h-auto w-full justify-start px-0 text-sm" onClick={() => { onClose(); onOpenSettings(); }}>
                <Settings className="mr-2 h-4 w-4" />
                Save your CA's WhatsApp or email in Settings for one-tap sending
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SendToCaDialog;

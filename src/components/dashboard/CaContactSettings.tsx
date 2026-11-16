import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface CaContact {
  name: string;
  whatsapp: string;
  email: string;
  email_enabled: boolean;
}

// Shows a saved number as +91 98765 43210 for Indian numbers.
export const prettyWhatsapp = (digits: string) =>
  digits.startsWith("91") && digits.length === 12 ? `+91 ${digits.slice(2, 7)} ${digits.slice(7)}` : digits ? `+${digits}` : "";

// Settings: who "Send to my CA" sends to.
const CaContactSettings = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", whatsapp: "", email: "" });
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<CaContact>("/settings/ca")
      .then((c) => {
        setForm({ name: c.name, whatsapp: c.whatsapp ? prettyWhatsapp(c.whatsapp) : "", email: c.email });
        setEmailEnabled(c.email_enabled);
      })
      .catch(() => undefined);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const c = await api.put<CaContact>("/settings/ca", form);
      setForm({ name: c.name, whatsapp: c.whatsapp ? prettyWhatsapp(c.whatsapp) : "", email: c.email });
      toast({ title: "CA details saved" });
    } catch (err: any) {
      toast({ title: "Could not save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div>
      <h3 className="font-medium mb-1">Your CA (accountant)</h3>
      <p className="text-sm text-gray-600 mb-3">Used by "Send to my CA" in History. Only you can see these details.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="ca-name" className="text-xs text-gray-600">Name</Label>
          <Input id="ca-name" placeholder="Ravi & Co." value={form.name} onChange={set("name")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ca-whatsapp" className="text-xs text-gray-600">WhatsApp number</Label>
          <Input id="ca-whatsapp" type="tel" inputMode="tel" placeholder="98765 43210" value={form.whatsapp} onChange={set("whatsapp")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ca-email" className="text-xs text-gray-600">Email</Label>
          <Input id="ca-email" type="email" placeholder="ca@example.com" value={form.email} onChange={set("email")} />
        </div>
      </div>
      {!emailEnabled && form.email && (
        <p className="mt-2 text-xs text-gray-500">Sending by email is coming soon. WhatsApp works now.</p>
      )}
      <Button className="mt-3" variant="outline" onClick={save} disabled={saving}>
        {saving ? "Saving..." : "Save CA details"}
      </Button>
    </div>
  );
};

export default CaContactSettings;

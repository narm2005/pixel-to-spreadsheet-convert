import React, { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AppConfig, useAppConfig } from "@/hooks/useAppConfig";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Coins, Crown, Search, ShieldCheck, Users } from "lucide-react";

interface AdminUser {
  id: string;
  email: string | null;
  name: string | null;
  tier: string;
  files_used: number;
  receipts: number;
  created_at: string | null;
}

const preview = (currency: string, value: number) => {
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en", {
      style: "currency",
      currency,
      maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value || 0);
  } catch {
    return `${currency} ${value}`;
  }
};

const PricingSettings = () => {
  const { config, apply } = useAppConfig();
  const { toast } = useToast();
  const [currency, setCurrency] = useState(config.currency);
  const [monthly, setMonthly] = useState(String(config.premium_monthly));
  const [yearly, setYearly] = useState(String(config.premium_yearly));
  const [saving, setSaving] = useState(false);

  const m = Number(monthly);
  const y = Number(yearly);
  const valid = m > 0 && y > 0;
  const changed = currency !== config.currency || m !== config.premium_monthly || y !== config.premium_yearly;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      const result = await api.put<AppConfig>("/admin/config", { currency, premium_monthly: m, premium_yearly: y });
      apply(result);
      toast({ title: "Saved", description: "The new prices show on the Pricing page straight away." });
    } catch (err: any) {
      toast({ title: "Could not save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Currency and Premium prices
        </CardTitle>
        <CardDescription>The currency is used for every amount in the app and on the Pricing page.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adm-currency">Currency</Label>
            <select
              id="adm-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {config.currencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="adm-monthly">Monthly price</Label>
              <Input id="adm-monthly" type="number" inputMode="decimal" min="0" step="0.01" value={monthly}
                onChange={(e) => setMonthly(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adm-yearly">Yearly price</Label>
              <Input id="adm-yearly" type="number" inputMode="decimal" min="0" step="0.01" value={yearly}
                onChange={(e) => setYearly(e.target.value)} />
            </div>
          </div>
          <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-700" data-testid="price-preview">
            {valid ? (
              <>
                Premium: <strong>{preview(currency, m)}</strong> a month or <strong>{preview(currency, y)}</strong> a year
                {Math.floor(12 - y / m) > 0 && <> (yearly saves about {Math.floor(12 - y / m)} month{Math.floor(12 - y / m) > 1 ? "s" : ""})</>}.
              </>
            ) : (
              "Enter both prices."
            )}
          </p>
          <Button type="submit" className="w-full sm:w-auto" disabled={!valid || !changed || saving}>
            {saving ? "Saving..." : "Save prices"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const UserList = () => {
  const { user: me, refreshUser } = useAuth();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totals, setTotals] = useState({ users: 0, premium: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const r = await api.get<{ users: AdminUser[]; totals: { users: number; premium: number } }>(
        `/admin/users?q=${encodeURIComponent(query)}`
      );
      setUsers(r.users);
      setTotals(r.totals);
    } catch (err: any) {
      toast({ title: "Could not load users", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const t = setTimeout(() => load(q), 300);
    return () => clearTimeout(t);
  }, [q, load]);

  const setTier = async (u: AdminUser, tier: string) => {
    setBusy(u.id);
    try {
      const updated = await api.patch<AdminUser>(`/admin/users/${u.id}`, { tier });
      setUsers((list) => list.map((x) => (x.id === u.id ? updated : x)));
      setTotals((t) => ({ ...t, premium: t.premium + (tier === "premium" ? 1 : -1) }));
      if (u.id === me?.id) await refreshUser();
    } catch (err: any) {
      toast({ title: "Could not change plan", description: err.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Users
        </CardTitle>
        <CardDescription>
          {totals.users} users, {totals.premium} on Premium. Until online payment is live, move a user to Premium here after they pay.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search by email or name" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        {loading && users.length === 0 ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-500">No users found.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {users.map((u) => (
              <li key={u.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between" data-testid="admin-user">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{u.email || "(no email)"}</p>
                  <p className="text-xs text-gray-500">
                    {u.name ? `${u.name} · ` : ""}
                    {u.receipts} receipts
                    {u.created_at ? ` · joined ${new Date(u.created_at).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {u.tier === "premium" ? (
                    <>
                      <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        <Crown className="h-3 w-3" /> Premium
                      </span>
                      <Button size="sm" variant="outline" disabled={busy === u.id} onClick={() => setTier(u, "freemium")}>
                        Move to Free
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">Free</span>
                      <Button size="sm" disabled={busy === u.id} onClick={() => setTier(u, "premium")}>
                        Make Premium
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {users.length >= 50 && <p className="text-xs text-gray-500">Showing the newest 50. Search to find others.</p>}
      </CardContent>
    </Card>
  );
};

const Admin = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/signin" replace />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <ShieldCheck className="h-6 w-6 text-blue-600" />
          Admin
        </h1>
        {user.is_admin ? (
          <>
            <PricingSettings />
            <UserList />
          </>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-gray-600">This page is for admins only.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Admin;

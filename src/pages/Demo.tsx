import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, ScanLine, CheckCircle2, ArrowRight, RotateCcw } from "lucide-react";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import { useAuth } from "@/hooks/useAuth";
import { formatMoney } from "@/lib/utils";

// A made-up sample bill, so visitors can see the result without signing in or using OCR credits.
const SAMPLE = {
  merchant: "Sri Lakshmi Stores",
  address: "12 Gandhi Road, Chennai",
  billNo: "SLS/2026/04817",
  date: "14/11/2026",
  items: [
    { name: "Basmati Rice 5kg", qty: 1, amount: 520 },
    { name: "Toor Dal 1kg", qty: 1, amount: 165 },
    { name: "Sunflower Oil 1L", qty: 1, amount: 148 },
    { name: "Milk 1L", qty: 2, amount: 116 },
    { name: "Tea Powder 250g", qty: 1, amount: 135 },
  ],
  cgst: 27.1,
  sgst: 27.1,
};
const SUBTOTAL = SAMPLE.items.reduce((s, i) => s + i.amount, 0);
const TOTAL = SUBTOTAL + SAMPLE.cgst + SAMPLE.sgst;

type Step = "idle" | "scanning" | "done";

const downloadSampleCsv = () => {
  const rows = [
    ["Merchant", "Date", "Bill No", "Item", "Qty", "Amount"],
    ...SAMPLE.items.map((i) => [SAMPLE.merchant, SAMPLE.date, SAMPLE.billNo, i.name, String(i.qty), i.amount.toFixed(2)]),
    [SAMPLE.merchant, SAMPLE.date, SAMPLE.billNo, "CGST 2.5%", "", SAMPLE.cgst.toFixed(2)],
    [SAMPLE.merchant, SAMPLE.date, SAMPLE.billNo, "SGST 2.5%", "", SAMPLE.sgst.toFixed(2)],
    [SAMPLE.merchant, SAMPLE.date, SAMPLE.billNo, "TOTAL", "", TOTAL.toFixed(2)],
  ];
  const csv = "﻿" + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "slickreceipts-sample.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const SampleBill = ({ scanning }: { scanning: boolean }) => (
  <div className="relative mx-auto w-full max-w-xs overflow-hidden rounded-md bg-white p-5 font-mono text-[13px] text-gray-800 shadow-lg ring-1 ring-gray-200">
    <div className="text-center">
      <p className="text-base font-bold">{SAMPLE.merchant.toUpperCase()}</p>
      <p className="text-xs">{SAMPLE.address}</p>
      <p className="text-xs">GSTIN: 33XXXXX0000X1Z5</p>
    </div>
    <div className="my-2 border-t border-dashed border-gray-400" />
    <div className="flex justify-between text-xs">
      <span>Bill: {SAMPLE.billNo}</span>
      <span>{SAMPLE.date}</span>
    </div>
    <div className="my-2 border-t border-dashed border-gray-400" />
    {SAMPLE.items.map((i) => (
      <div key={i.name} className="flex justify-between">
        <span>
          {i.name} {i.qty > 1 ? `x${i.qty}` : ""}
        </span>
        <span>{i.amount.toFixed(2)}</span>
      </div>
    ))}
    <div className="my-2 border-t border-dashed border-gray-400" />
    <div className="flex justify-between"><span>Subtotal</span><span>{SUBTOTAL.toFixed(2)}</span></div>
    <div className="flex justify-between"><span>CGST 2.5%</span><span>{SAMPLE.cgst.toFixed(2)}</span></div>
    <div className="flex justify-between"><span>SGST 2.5%</span><span>{SAMPLE.sgst.toFixed(2)}</span></div>
    <div className="mt-1 flex justify-between font-bold"><span>TOTAL</span><span>{TOTAL.toFixed(2)}</span></div>
    <p className="mt-3 text-center text-xs">Thank you! Visit again</p>
    {scanning && (
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 animate-[scan_1.4s_ease-in-out_infinite] bg-blue-500 shadow-[0_0_12px_4px_rgba(59,130,246,0.6)]" />
    )}
    <style>{`@keyframes scan { 0% { transform: translateY(0) } 50% { transform: translateY(420px) } 100% { transform: translateY(0) } }`}</style>
  </div>
);

const Demo = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("idle");

  const scan = () => {
    setStep("scanning");
    setTimeout(() => setStep("done"), 1800);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAuthenticated={!!user} />
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-8 text-center">
          <Badge variant="secondary" className="mb-3">Demo · sample bill, no sign-in</Badge>
          <h1 className="text-2xl font-bold text-gray-900 md:text-4xl">See how SlickReceipts reads a bill</h1>
          <p className="mt-2 text-gray-600">Tap "Scan this bill" to watch it turn into a clean table you can download.</p>
        </div>

        <div className="grid items-start gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <SampleBill scanning={step === "scanning"} />
            <div className="flex justify-center">
              {step === "done" ? (
                <Button variant="outline" onClick={() => setStep("idle")}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
              ) : (
                <Button size="lg" className="h-12 px-8 text-base" onClick={scan} disabled={step === "scanning"}>
                  <ScanLine className="mr-2 h-5 w-5" />
                  {step === "scanning" ? "Reading the bill..." : "Scan this bill"}
                </Button>
              )}
            </div>
          </div>

          <Card className={step === "done" ? "" : "opacity-60"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {step === "done" ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <ScanLine className="h-5 w-5" />}
                Extracted data
              </CardTitle>
              <CardDescription>
                {step === "done" ? "Ready to export to Excel, CSV or JSON." : "The result appears here after scanning."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === "done" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-gray-500">Merchant</p><p className="font-medium">{SAMPLE.merchant}</p></div>
                    <div><p className="text-gray-500">Date</p><p className="font-medium">{SAMPLE.date}</p></div>
                    <div><p className="text-gray-500">Bill no.</p><p className="font-medium">{SAMPLE.billNo}</p></div>
                    <div><p className="text-gray-500">Category</p><p className="font-medium">Groceries</p></div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-500">
                          <th className="py-1 font-normal">Item</th>
                          <th className="py-1 text-right font-normal">Qty</th>
                          <th className="py-1 text-right font-normal">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SAMPLE.items.map((i) => (
                          <tr key={i.name} className="border-b border-gray-100">
                            <td className="py-1">{i.name}</td>
                            <td className="py-1 text-right">{i.qty}</td>
                            <td className="py-1 text-right">{formatMoney(i.amount)}</td>
                          </tr>
                        ))}
                        <tr><td className="pt-2 text-gray-500">GST (CGST + SGST)</td><td /><td className="pt-2 text-right">{formatMoney(SAMPLE.cgst + SAMPLE.sgst)}</td></tr>
                        <tr className="font-semibold"><td className="py-1">Total</td><td /><td className="py-1 text-right">{formatMoney(TOTAL)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <Button variant="outline" className="w-full" onClick={downloadSampleCsv}>
                    <Download className="mr-2 h-4 w-4" /> Download sample CSV
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 animate-pulse rounded bg-gray-200" style={{ width: `${90 - i * 8}%` }} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 text-center">
          <p className="mb-3 text-gray-700">Try it with your own bills: the first 10 are free.</p>
          <Link to={user ? "/dashboard" : "/signin"}>
            <Button size="lg" className="h-12 bg-blue-600 px-8 text-base hover:bg-blue-700">
              {user ? "Go to Dashboard" : "Try It Free"} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
};

export default Demo;

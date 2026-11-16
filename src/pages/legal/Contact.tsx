import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, MessageSquare, ShieldCheck } from "lucide-react";
import LegalLayout from "@/components/LegalLayout";
import { BUSINESS, operatorName } from "@/lib/business";

const Row = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div className="flex gap-3 rounded-lg border p-4">
    <div className="mt-0.5 text-blue-600">{icon}</div>
    <div>
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <div className="text-gray-700">{children}</div>
    </div>
  </div>
);

const Contact = () => (
  <LegalLayout
    title="Contact Us"
    intro={<p>We're a small team and we read every message. We reply within 2 working days (Monday to Saturday).</p>}
  >
    <section className="space-y-3">
      <Row icon={<Mail className="h-5 w-5" />} label="Email">
        <a href={`mailto:${BUSINESS.supportEmail}`}>{BUSINESS.supportEmail}</a>
      </Row>
      {BUSINESS.phone && (
        <Row icon={<Phone className="h-5 w-5" />} label="Phone / WhatsApp">
          <a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`}>{BUSINESS.phone}</a>
        </Row>
      )}
      <Row icon={<MessageSquare className="h-5 w-5" />} label="Feedback or feature ideas">
        <Link to="/feedback">Send us feedback</Link>
      </Row>
      {BUSINESS.address && (
        <Row icon={<MapPin className="h-5 w-5" />} label="Business address">
          <p className="mb-0">{operatorName()}</p>
          <p className="mb-0 whitespace-pre-line">{BUSINESS.address}</p>
        </Row>
      )}
      <Row icon={<ShieldCheck className="h-5 w-5" />} label="Grievance Officer (privacy and complaints)">
        {BUSINESS.grievanceOfficer && <p className="mb-0">{BUSINESS.grievanceOfficer}</p>}
        <a href={`mailto:${BUSINESS.grievanceEmail}`}>{BUSINESS.grievanceEmail}</a>
      </Row>
    </section>

    <section>
      <h2>Payments and refunds</h2>
      <p>
        For billing questions, include your account email and the payment date. See our{" "}
        <Link to="/refunds">Refund &amp; Cancellation Policy</Link>.
      </p>
    </section>
  </LegalLayout>
);

export default Contact;

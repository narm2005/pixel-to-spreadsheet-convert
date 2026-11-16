import LegalLayout from "@/components/LegalLayout";
import { BUSINESS } from "@/lib/business";

const Refunds = () => (
  <LegalLayout
    title="Refund & Cancellation Policy"
    intro={<p>We want you to be happy with {BUSINESS.brand} Premium. This page explains how cancelling and refunds work.</p>}
  >
    <section>
      <h2>1. Try before you pay</h2>
      <p>Every account gets 10 receipts free, with no card needed, so you can check that {BUSINESS.brand} works for your bills before upgrading.</p>
    </section>

    <section>
      <h2>2. Cancelling</h2>
      <ul>
        <li>You can cancel Premium at any time by emailing <a href={`mailto:${BUSINESS.supportEmail}`}>{BUSINESS.supportEmail}</a>, or from your account once online payment is available.</li>
        <li>Premium stays active until the end of the period you have paid for, then your account moves to the Free plan.</li>
        <li>Your receipts are not deleted when you cancel. You can still view and download them as CSV.</li>
        <li>If your plan renews automatically, cancel at least 24 hours before the renewal date to avoid the next charge.</li>
      </ul>
    </section>

    <section>
      <h2>3. Refunds</h2>
      <ul>
        <li><strong>First purchase, 7 days:</strong> if you are not satisfied, ask within 7 days of your first Premium payment and we will refund it in full.</li>
        <li><strong>Charged by mistake:</strong> duplicate payments, or a charge after you cancelled on time, are always refunded in full.</li>
        <li><strong>Service problem:</strong> if Premium was unavailable for a long period because of a fault on our side, we will extend your plan or refund the affected period.</li>
        <li>Otherwise, we do not give refunds for partly used monthly or yearly periods.</li>
      </ul>
    </section>

    <section>
      <h2>4. How refunds are paid</h2>
      <p>
        Approved refunds are sent back to the original payment method (UPI, card or bank account). We start the refund within
        2 working days of approval. It usually reaches you within 5–7 working days, depending on your bank.
      </p>
    </section>

    <section>
      <h2>5. How to ask</h2>
      <p>
        Email <a href={`mailto:${BUSINESS.supportEmail}`}>{BUSINESS.supportEmail}</a> from your account email with the payment
        date and amount (or the payment ID). We reply within 2 working days.
      </p>
    </section>
  </LegalLayout>
);

export default Refunds;

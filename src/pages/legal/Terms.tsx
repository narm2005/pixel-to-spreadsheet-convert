import { Link } from "react-router-dom";
import LegalLayout from "@/components/LegalLayout";
import { BUSINESS, operatorName } from "@/lib/business";

const Terms = () => (
  <LegalLayout
    title="Terms of Service"
    intro={
      <p>
        These terms are an agreement between you and {operatorName()} ("we", "us") for using {BUSINESS.brand} at{" "}
        {BUSINESS.website} and its apps. By creating an account or using the service, you agree to them. If you do not
        agree, please do not use {BUSINESS.brand}.
      </p>
    }
  >
    <section>
      <h2>1. The service</h2>
      <p>
        {BUSINESS.brand} reads photos and PDFs of bills and receipts, extracts the details (such as shop, date, items,
        amounts and GST) and lets you edit, store, download and share them. We may improve or change features over time.
      </p>
    </section>

    <section>
      <h2>2. Your account</h2>
      <ul>
        <li>You must be 18 or older and give accurate details.</li>
        <li>You are responsible for activity on your account. Keep your sign-in secure and tell us at once if you think it has been misused.</li>
        <li>One person or business per account. Do not share or resell accounts.</li>
      </ul>
    </section>

    <section>
      <h2>3. Plans and limits</h2>
      <ul>
        <li><strong>Free:</strong> 10 receipts in total, with CSV download.</li>
        <li><strong>Premium:</strong> paid monthly or yearly, as shown on the <Link to="/pricing">Pricing page</Link>, with the features listed there.</li>
        <li>
          <strong>Fair use:</strong> Premium includes up to 1,000 receipts a month and 100 a day, and up to 20 files per upload,
          so the service stays fast and affordable for everyone. We may change these limits with notice.
        </li>
        <li>Deleting receipts does not give back used receipts on any plan.</li>
      </ul>
    </section>

    <section>
      <h2>4. Payments</h2>
      <ul>
        <li>Prices are in Indian rupees (₹) and include applicable taxes unless stated otherwise.</li>
        <li>Premium is paid in advance for the period you choose. Cancellations and refunds follow our <Link to="/refunds">Refund &amp; Cancellation Policy</Link>.</li>
        <li>We will tell you at least 30 days before any price increase applies to your plan.</li>
      </ul>
    </section>

    <section>
      <h2>5. Your content</h2>
      <ul>
        <li>Your receipts and data stay yours. You give us permission to process them only to run the service for you, as described in our <Link to="/privacy">Privacy Policy</Link>.</li>
        <li>Only upload documents you have the right to use. Do not upload other people's personal documents without their permission.</li>
        <li>You are responsible for who you share files and links with, including links sent to your CA.</li>
      </ul>
    </section>

    <section>
      <h2>6. Check the results</h2>
      <p>
        Reading receipts automatically is never perfect. Extracted amounts, GST details and dates can be wrong or missing,
        especially on faded, handwritten or unclear bills. <strong>Always check the data before using it</strong> for
        accounts, tax returns, GST filing or payments. {BUSINESS.brand} is a data-entry tool. It does not give tax,
        accounting or legal advice; please consult your CA.
      </p>
    </section>

    <section>
      <h2>7. Acceptable use</h2>
      <p>You must not:</p>
      <ul>
        <li>Upload anything illegal, fake or fraudulent, or use the service to create or alter bills.</li>
        <li>Try to access other people's data, break security, or overload the service (for example with automated uploads).</li>
        <li>Copy, resell or reverse-engineer the service.</li>
      </ul>
      <p>We may suspend or close accounts that break these rules.</p>
    </section>

    <section>
      <h2>8. Third-party services</h2>
      <p>
        We rely on providers such as Google (text reading), DeepSeek (structuring), Supabase, Render, email and payment
        providers, and WhatsApp when you choose it. We are not responsible for outages or changes on their side, but we
        will do our best to keep the service running.
      </p>
    </section>

    <section>
      <h2>9. Availability</h2>
      <p>
        We aim to keep {BUSINESS.brand} available at all times but do not guarantee it will be uninterrupted or error-free.
        We may pause it for maintenance. Please download copies of anything important.
      </p>
    </section>

    <section>
      <h2>10. Ending your account</h2>
      <p>
        You can delete your account at any time in Settings. We may suspend or end an account that breaks these terms or
        the law, and will tell you why unless the law prevents it. If we close the service entirely, we will give you at
        least 30 days to download your data and refund any unused prepaid period.
      </p>
    </section>

    <section>
      <h2>11. Liability</h2>
      <p>
        To the extent the law allows, {BUSINESS.brand} is provided "as is". We are not liable for indirect losses (such as
        lost profit, penalties or interest caused by relying on unchecked data). Our total liability for any claim is
        limited to the amount you paid us in the 3 months before the claim. Nothing in these terms limits rights you have
        under the Consumer Protection Act, 2019 that cannot be limited.
      </p>
    </section>

    <section>
      <h2>12. Changes to these terms</h2>
      <p>
        We may update these terms. For important changes we will update the date above and tell you in the app or by
        email before they apply. Continuing to use {BUSINESS.brand} after that means you accept the new terms.
      </p>
    </section>

    <section>
      <h2>13. Law and disputes</h2>
      <p>
        These terms are governed by the laws of India. Please contact us first so we can try to resolve any problem.
        Otherwise, disputes will be handled by the courts{BUSINESS.jurisdictionCity ? ` of ${BUSINESS.jurisdictionCity}` : " in India"}.
      </p>
    </section>
  </LegalLayout>
);

export default Terms;

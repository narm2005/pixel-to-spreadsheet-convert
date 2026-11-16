import { Link } from "react-router-dom";
import LegalLayout from "@/components/LegalLayout";
import { BUSINESS, operatorName } from "@/lib/business";

const Privacy = () => (
  <LegalLayout
    title="Privacy Policy"
    intro={
      <p>
        This policy explains what personal data {BUSINESS.brand} ({BUSINESS.website}), operated by {operatorName()}, collects,
        why, who it is shared with, and the choices you have. It is written to meet India's Digital Personal Data Protection
        Act, 2023 and the Information Technology Act, 2000. By using {BUSINESS.brand} you agree to this policy.
      </p>
    }
  >
    <section>
      <h2>1. What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your name, email address and profile picture, from Google sign-in or the email you register with.</li>
        <li><strong>Receipts you upload:</strong> photos or PDFs of bills. We read them to extract the data and then discard the image or PDF. We do not keep the original files.</li>
        <li><strong>Extracted data:</strong> shop name, bill date, items, amounts, totals, GSTIN, invoice number and GST amounts, plus any changes you make.</li>
        <li><strong>Your CA's details:</strong> the name, WhatsApp number and email of your accountant, if you choose to save them.</li>
        <li><strong>Usage data:</strong> how many receipts you process each day and month (for plan limits), and basic server logs such as IP address and time of request (for security and troubleshooting).</li>
        <li><strong>Payment details:</strong> when online payment is available, payments are handled by the payment provider. We never see or store your card, UPI PIN or bank login.</li>
      </ul>
    </section>

    <section>
      <h2>2. Why we use it</h2>
      <ul>
        <li>To sign you in and keep your account secure.</li>
        <li>To read your receipts and turn them into tables, files (CSV, Excel, JSON) and spending summaries.</li>
        <li>To send files to your CA when you ask us to.</li>
        <li>To apply plan limits, prevent misuse and fix problems.</li>
        <li>To reply to you when you contact us, and to tell you about important changes to the service.</li>
      </ul>
      <p>We do not sell your data, and we do not use your receipts for advertising.</p>
    </section>

    <section>
      <h2>3. Who processes your data for us</h2>
      <p>We use trusted service providers to run {BUSINESS.brand}. They may only use your data to provide their service to us:</p>
      <ul>
        <li><strong>Supabase</strong>: sign-in and database (where your account and extracted data are stored).</li>
        <li><strong>Render</strong>: hosts the app and the server.</li>
        <li><strong>Google Cloud Vision</strong>: reads the text on your receipt image.</li>
        <li><strong>DeepSeek</strong>: turns the receipt text into structured fields (shop, items, amounts, GST).</li>
        <li><strong>Brevo</strong>: sends the email to your CA, only when you choose to send one.</li>
        <li><strong>WhatsApp</strong>: when you send to your CA on WhatsApp, the message is sent from your own WhatsApp account and is covered by WhatsApp's privacy policy.</li>
        <li><strong>Payment provider</strong> (for example Razorpay): processes payments, once online payment is available.</li>
      </ul>
    </section>

    <section>
      <h2>4. Where your data is stored</h2>
      <p>
        Some of these providers store or process data outside India, including in the United States (database and hosting)
        and in China (DeepSeek, for receipt text). We transfer data abroad only as needed to provide the service and as
        permitted under Indian law. If the Government of India restricts transfers to a country, we will stop using
        providers there.
      </p>
    </section>

    <section>
      <h2>5. Sharing links and sending to your CA</h2>
      <p>
        When you use "Send to my CA" on WhatsApp, we create a private download link for the receipts you chose. Anyone
        who has the link can download that file for 7 days, so only send it to people you trust. When you email your
        CA, we send the file to the address you saved and a copy to you.
      </p>
    </section>

    <section>
      <h2>6. How long we keep it</h2>
      <ul>
        <li>Your account and receipt data are kept until you delete them.</li>
        <li>Deleting a receipt removes it from your history straight away.</li>
        <li>Deleting your account (Settings → Delete my account) removes your receipts, CA details and account data.</li>
        <li>
          To avoid paying twice for the same file, we keep the extracted result of each processed file under a fingerprint of
          the file, without your name or account. Server logs are kept for a short time for security.
        </li>
        <li>We may keep records we are required to keep by law, such as payment invoices.</li>
      </ul>
    </section>

    <section>
      <h2>7. Your rights</h2>
      <p>Under the Digital Personal Data Protection Act, 2023 you can:</p>
      <ul>
        <li>Get a summary of the personal data we hold about you and who we have shared it with.</li>
        <li>Correct or update it. You can edit any receipt yourself.</li>
        <li>Erase it. You can delete receipts or your whole account yourself.</li>
        <li>Withdraw consent at any time by deleting your account. This does not affect processing already done.</li>
        <li>Nominate someone to exercise these rights if you die or become unable to.</li>
        <li>Raise a complaint with our Grievance Officer (below), and if you are not satisfied, with the Data Protection Board of India.</li>
      </ul>
      <p>To make a request, email <a href={`mailto:${BUSINESS.grievanceEmail}`}>{BUSINESS.grievanceEmail}</a> from your account email.</p>
    </section>

    <section>
      <h2>8. Security</h2>
      <p>
        Data is sent over encrypted connections (HTTPS). Only you can see your receipts: every request is checked against
        your signed-in account. No system is perfectly secure, so please use a strong password and keep your Google
        account safe. If we learn of a breach that affects you, we will tell you and the authorities as the law requires.
      </p>
    </section>

    <section>
      <h2>9. Cookies and storage</h2>
      <p>
        We store your sign-in session in your browser so you stay signed in. We do not use advertising or tracking cookies.
      </p>
    </section>

    <section>
      <h2>10. Children</h2>
      <p>{BUSINESS.brand} is for businesses and adults. You must be 18 or older to use it.</p>
    </section>

    <section>
      <h2>11. Grievance Officer</h2>
      <p>
        {BUSINESS.grievanceOfficer && <>{BUSINESS.grievanceOfficer}<br /></>}
        Email: <a href={`mailto:${BUSINESS.grievanceEmail}`}>{BUSINESS.grievanceEmail}</a>
        {BUSINESS.address && <><br />Address: {BUSINESS.address}</>}
      </p>
      <p>We acknowledge complaints within 48 hours and aim to resolve them within 30 days.</p>
    </section>

    <section>
      <h2>12. Changes to this policy</h2>
      <p>
        If we make important changes, we will update the date above and tell you in the app or by email. See also our{" "}
        <Link to="/terms">Terms of Service</Link>.
      </p>
    </section>
  </LegalLayout>
);

export default Privacy;

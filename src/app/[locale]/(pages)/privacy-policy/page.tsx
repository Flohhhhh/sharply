import type { Metadata } from "next";
import { ScrollProgress } from "~/components/ui/skiper-ui/scroll-progress";

export const metadata: Metadata = {
  title: "Privacy Policy",
  openGraph: {
    title: "Privacy Policy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto mt-24 min-h-screen max-w-3xl px-6 pb-24">
      <article className="prose prose-zinc prose-sm dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p>
          <em>Last updated: September 25, 2025</em>
        </p>
        <p>
          This Privacy Policy explains how Sharply collects, uses, and shares
          information when you use our website, applications, and services
          (collectively, the "Service"). By using the Service, you consent to
          this Policy.
        </p>

        <h2>1. Information We Collect</h2>
        <ul>
          <li>
            <strong>Account Information</strong>: Information you provide when
            you create an account or profile (e.g., name, email).
          </li>
          <li>
            <strong>Usage Data</strong>: Information about how you use the
            Service, including device and browser type, pages viewed, and
            interactions.
          </li>
          <li>
            <strong>User Contributions</strong>: Content you submit (e.g.,
            reviews, specifications, images, suggestions).
          </li>
          <li>
            <strong>Cookies &amp; Similar Technologies</strong>: We use cookies
            and similar technologies to operate the Service and understand
            usage.
          </li>
          <li>
            <strong>Third-Party Sources</strong>: Where permitted, we may
            receive information from service providers or partners to improve
            the Service.
          </li>
        </ul>

        <h2>2. How We Use Information</h2>
        <ul>
          <li>Provide, maintain, and improve the Service.</li>
          <li>Personalize features and content.</li>
          <li>Communicate with you about updates, security, and support.</li>
          <li>Monitor usage, perform analytics, and prevent abuse.</li>
          <li>Comply with legal obligations and enforce our terms.</li>
        </ul>

        <h2>3. Cookies and Tracking</h2>
        <p>
          We use cookies and similar technologies to enable essential
          functionality, remember preferences, and analyze traffic. You can
          manage cookies in your browser settings; some features may not
          function properly without cookies.
        </p>

        <h2>4. Analytics and Service Providers</h2>
        <p>
          We may use third-party providers to perform analytics, hosting, and
          other services on our behalf. These providers may process information
          as necessary to deliver their services to us and are subject to
          appropriate confidentiality obligations.
        </p>

        <h2>5. Information Sharing</h2>
        <ul>
          <li>
            <strong>Vendors and Service Providers</strong>: We share information
            with trusted providers who assist in operating the Service.
          </li>
          <li>
            <strong>Legal</strong>: We may disclose information to comply with
            law, regulation, or legal process, or to protect the rights,
            property, or safety of Sharply, our users, or others.
          </li>
          <li>
            <strong>Business Transfers</strong>: In connection with a merger,
            acquisition, or asset sale, information may be transferred.
          </li>
        </ul>
        <p>We do not sell your personal information.</p>

        <h2>6. Data Retention</h2>
        <p>
          We retain information for as long as necessary to provide the Service,
          comply with legal obligations, resolve disputes, and enforce our
          agreements. Retention periods vary depending on the type of data and
          our operational needs.
        </p>

        <h2>7. Your Choices and Rights</h2>
        <ul>
          <li>Access, update, or delete certain account information.</li>
          <li>Opt out of non-essential emails where applicable.</li>
          <li>
            Request a copy of your data or object to certain processing, subject
            to applicable law.
          </li>
        </ul>

        <h2>8. Children's Privacy</h2>
        <p>
          The Service is not directed to children under 13 (or as defined by
          local law). If we learn that we have collected personal information
          from a child without appropriate consent, we will take steps to delete
          it.
        </p>

        <h2>9. International Transfers</h2>
        <p>
          Your information may be processed in countries other than your own.
          Where required, we take steps to ensure appropriate safeguards for
          international transfers.
        </p>

        <h2>10. Security</h2>
        <p>
          We employ reasonable administrative, technical, and physical measures
          to protect information. No method of transmission or storage is 100%
          secure.
        </p>

        <h2>11. Changes to this Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. If changes are
          material, we will take reasonable steps to notify you. Your continued
          use of the Service after the changes take effect means you accept the
          updated Policy.
        </p>

        <h2>12. Contact</h2>
        <p>
          Questions about this Policy? Please contact us via the support channel
          listed on our website.
        </p>
      </article>
      <ScrollProgress bottomOffset={300} />
    </div>
  );
}

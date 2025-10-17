import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  openGraph: {
    title: "Terms of Service",
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto mt-24 min-h-screen max-w-3xl px-6 pb-24">
      <article className="prose prose-sm dark:prose-invert">
        <h1>Terms of Service</h1>
        <p>
          <em>Last updated: September 25, 2025</em>
        </p>
        <p>
          Welcome to Sharply. By accessing or using our website, applications,
          or services (collectively, the "Service"), you agree to these Terms of
          Service ("Terms"). If you do not agree, do not use the Service.
        </p>

        <h2>1. What Sharply Is</h2>
        <p>
          Sharply is a photography gear database and cataloging platform. We
          aggregate and organize camera equipment data, allow users to create
          collections, and enable community contributions and editorial content.
        </p>

        <h2>2. Your Account</h2>
        <ul>
          <li>
            You must be able to form a binding contract to use the Service.
          </li>
          <li>
            You are responsible for the activity on your account and for keeping
            your credentials secure.
          </li>
          <li>
            We may suspend or terminate accounts that violate these Terms.
          </li>
        </ul>

        <h2>3. User Contributions & License</h2>
        <p>
          You may submit content such as specifications, images, ratings,
          reviews, and suggestions ("User Content"). You represent that you have
          the necessary rights to post User Content and that it does not
          infringe the rights of others or violate any law.
        </p>
        <p>
          By submitting User Content, you grant Sharply a non-exclusive,
          worldwide, royalty-free, sublicensable license to host, store,
          reproduce, modify for formatting, translate, create derivative works
          for presentation, publish, publicly display, and distribute such User
          Content in connection with operating and improving the Service. You
          can remove your User Content at any time; this may not affect prior
          copies or derivatives already made, used, or shared as permitted
          above.
        </p>
        <p>
          We may moderate, edit for clarity, refuse, or remove User Content at
          our discretion, including to comply with law or protect the community.
        </p>

        <h2>4. Prohibited Activities</h2>
        <ul>
          <li>
            Posting unlawful, misleading, defamatory, or infringing content.
          </li>
          <li>
            Uploading malware or attempting to interfere with the Service.
          </li>
          <li>
            Impersonating any person or entity or misrepresenting affiliation.
          </li>
          <li>
            Scraping, harvesting, or bulk-downloading data without our prior
            written permission (use an official API if and when provided).
          </li>
          <li>
            Circumventing access controls, rate limits, or security measures.
          </li>
          <li>
            Using the Service for commercial exploitation that replicates or
            competes with Sharply without authorization.
          </li>
        </ul>

        <h2>5. Intellectual Property</h2>
        <p>
          The Service, including our software, design, and original content, is
          owned by or licensed to Sharply and protected by intellectual property
          laws. Product names, logos, and trademarks referenced on the Service
          are the property of their respective owners and do not imply
          endorsement.
        </p>

        <h2>6. Information Accuracy; No Professional Advice</h2>
        <p>
          We strive for accurate gear data and editorial content, but
          information may be incomplete, outdated, or contain errors. Content is
          provided for informational purposes only and does not constitute
          professional advice. You are responsible for verifying information
          before making purchasing or usage decisions.
        </p>

        <h2>7. Third-Party Links</h2>
        <p>
          The Service may include links to third-party websites or services. We
          are not responsible for their content, policies, or practices.
        </p>

        <h2>8. Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES
          OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
          WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
          NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
          UNINTERRUPTED, SECURE, OR ERROR-FREE.
        </p>

        <h2>9. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, SHARPLY AND ITS AFFILIATES
          WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS,
          REVENUE, DATA, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF
          THE SERVICE.
        </p>

        <h2>10. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless Sharply and its affiliates
          from and against any claims, liabilities, damages, losses, and
          expenses, including reasonable legal fees, arising out of or in any
          way connected with your use of the Service or your User Content.
        </p>

        <h2>11. Changes to the Service and Terms</h2>
        <p>
          We may modify the Service and these Terms at any time. If changes are
          material, we will take reasonable steps to notify you (for example,
          via the site or by email if available). Your continued use of the
          Service after changes become effective constitutes acceptance of the
          updated Terms.
        </p>

        <h2>12. Termination</h2>
        <p>
          We may suspend or terminate your access to the Service at any time,
          including for breach of these Terms or to protect the Service or other
          users. You may stop using the Service at any time.
        </p>

        <h2>13. Contact</h2>
        <p>
          Questions about these Terms or the Service? Please contact us via the
          support channel listed on our website. See also our{" "}
          <a href="/privacy-policy">Privacy Policy</a>.
        </p>
      </article>
    </div>
  );
}

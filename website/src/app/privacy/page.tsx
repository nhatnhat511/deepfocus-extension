import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Review how DeepFocus Time collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-600">Last updated: March 10, 2026</p>

      <div className="mt-6 space-y-5 text-sm leading-6 text-slate-700">
        <section>
          <h2 className="text-base font-semibold text-slate-900">1. Data we collect</h2>
          <p>
            We collect information needed to provide the DeepFocus Time website and Chrome extension, including account
            identifiers (such as email), entitlement status, subscription metadata, and basic support communications.
            We also store extension configuration and usage metrics necessary to deliver features like reminders and
            productivity insights.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">2. How we use data</h2>
          <p>
            We use data to authenticate users, maintain premium access, synchronize settings between the extension and
            the website, provide support, and improve reliability. We do not sell personal information.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">3. Third-party services</h2>
          <p>
            We rely on trusted providers for hosting, authentication, analytics, and billing operations. Payment
            transactions are handled by our billing partner, and we do not store full payment card details on DeepFocus
            Time infrastructure.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">4. Retention and security</h2>
          <p>
            We retain data only as long as needed for service delivery, legal obligations, and support continuity.
            Reasonable technical and organizational safeguards are applied to protect user data.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">5. Your rights</h2>
          <p>
            You may request account assistance or data-related support by contacting support@deepfocustime.com. We
            review requests according to applicable regulations, including requests to access, correct, or delete your
            data where required.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">6. Children’s privacy</h2>
          <p>
            DeepFocus Time is not intended for children under 13, and we do not knowingly collect personal information
            from children. If you believe a child has provided personal data, please contact us to remove it.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">7. Contact</h2>
          <p>
            For privacy questions, contact support@deepfocustime.com. We aim to respond promptly and transparently.
          </p>
        </section>
      </div>
    </article>
  );
}

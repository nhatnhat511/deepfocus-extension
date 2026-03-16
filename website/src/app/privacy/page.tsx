import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Review how DeepFocus Time handles account data and privacy.",
};

export default function PrivacyPage() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-600">Last updated: March 16, 2026</p>

      <div className="mt-6 space-y-5 text-sm leading-6 text-slate-700">
        <section>
          <h2 className="text-base font-semibold text-slate-900">1. Overview</h2>
          <p>
            This Privacy Policy explains how DeepFocus Time collects, uses, and protects information from the website
            and Chrome extension.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">2. Data we collect</h2>
          <p>
            We collect the minimum data needed to operate the service:
          </p>
          <p>
            Account data: email address, account identifiers, trial status, and premium entitlement.
          </p>
          <p>
            Authentication data: session tokens used to keep you signed in.
          </p>
          <p>
            Extension settings: focus and break durations, reminders, distraction lists, and automation preferences.
          </p>
          <p>
            Usage signals: local session counts, focus minutes, interruptions, and streaks used to power insights.
          </p>
          <p>
            Support communications: messages you send to support and diagnostic details you share with us.
          </p>
          <p>
            Website analytics: basic page usage metrics collected on the website to understand performance and improve
            the product.
          </p>
          <p>
            Billing data: subscription status and transaction metadata handled by our billing provider. We do not store
            full payment card details on DeepFocus Time infrastructure.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">3. How we use data</h2>
          <p>
            We use data to authenticate users, provide premium access, deliver reminders and insights, and respond to
            support requests. We do not sell personal information.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">4. Where data is stored</h2>
          <p>
            Extension settings and usage signals are stored locally in your browser. Account and entitlement data is
            stored on our servers so you can sign in and manage premium access.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">5. Sharing and third parties</h2>
          <p>
            We rely on trusted providers for hosting, authentication, analytics, email delivery, and billing. These
            providers process data on our behalf under contractual safeguards. We do not sell personal information.
          </p>
          <p>
            Providers may include Supabase (authentication and account data), Paddle (billing), Resend (contact email
            delivery), and Google Analytics (website analytics).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">6. Cookies and local storage</h2>
          <p>
            We use cookies and local storage to keep you signed in and to remember preferences. You can clear local
            storage in your browser or extension settings.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">7. Data retention</h2>
          <p>
            We retain account data for as long as needed to provide the service and meet legal obligations. You can
            request deletion of your account, and we will follow applicable laws.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">8. Security</h2>
          <p>
            We apply reasonable technical and organizational safeguards to protect your data, but no system can be
            guaranteed 100 percent secure.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">9. Your rights and choices</h2>
          <p>
            You may request access, correction, or deletion of your account data by contacting support@deepfocustime.com.
            We review requests according to applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">10. International transfers</h2>
          <p>
            Your information may be processed in countries where we or our providers operate. We apply safeguards
            required by applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">11. Children's privacy</h2>
          <p>
            DeepFocus Time is not intended for children under 13. We do not knowingly collect personal data from
            children. If you believe a child has provided data, contact us so we can delete it.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">12. Contact</h2>
          <p>
            For privacy questions, contact support@deepfocustime.com. We aim to respond promptly and transparently.
          </p>
        </section>
      </div>
    </article>
  );
}

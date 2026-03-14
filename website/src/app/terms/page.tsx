import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for the DeepFocus Time Chrome extension and website.",
};

export default function TermsPage() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-slate-600">Last updated: March 14, 2026</p>

      <div className="mt-6 space-y-5 text-sm leading-6 text-slate-700">
        <section>
          <h2 className="text-base font-semibold text-slate-900">1. Acceptance of terms</h2>
          <p>
            By accessing or using the DeepFocus Time website or Chrome extension, you agree to these Terms of Service
            and applicable platform policies.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">2. Eligibility</h2>
          <p>
            You must be at least 13 years old to use DeepFocus Time. If you are using the service on behalf of an
            organization, you represent that you have authority to bind that organization.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">3. Accounts and security</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all activity
            under your account. Please notify us immediately of any unauthorized use.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">4. License and permitted use</h2>
          <p>
            We grant you a limited, non-exclusive, non-transferable license to use the extension and website for
            personal or internal business purposes, in accordance with these terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">5. Prohibited use</h2>
          <p>
            You agree not to misuse the service, interfere with our infrastructure, attempt unauthorized access, or use
            the service in violation of applicable laws or third-party rights.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">6. Premium subscriptions and trials</h2>
          <p>
            Premium features require an active subscription. Trials may be offered and are limited to one per account
            unless otherwise stated. We may modify premium features over time.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">7. Billing, renewals, and cancellation</h2>
          <p>
            Subscriptions renew automatically unless canceled before the renewal date. You can manage or cancel your
            subscription from your account page. After cancellation, premium access remains active until the end of the
            current billing period.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">8. Refunds</h2>
          <p>
            Refunds are handled according to our refund policy. Please review the refund policy on the website or
            contact support if you need help.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">9. Third-party services</h2>
          <p>
            We use third-party providers for hosting, authentication, analytics, and billing. Your use of those
            services may be subject to their terms and policies.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">10. Availability and changes</h2>
          <p>
            We aim for stable service but cannot guarantee uninterrupted availability. We may update or change features
            as the product evolves.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">11. Intellectual property</h2>
          <p>
            DeepFocus Time, including the extension, website, and related content, is owned by us and protected by
            intellectual property laws. You may not copy, modify, or redistribute it beyond what is allowed by law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">12. Termination</h2>
          <p>
            We may suspend or terminate access to the service if you violate these terms or if required to protect the
            service. You may stop using the service at any time.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">13. Disclaimers</h2>
          <p>
            The service is provided on an "as is" and "as available" basis. We disclaim all warranties to the maximum
            extent permitted by law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">14. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, DeepFocus Time will not be liable for any indirect, incidental, or
            consequential damages arising from your use of the service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">15. Updates to terms</h2>
          <p>
            We may revise these terms when needed. Continued use after updates indicates acceptance of revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">16. Contact</h2>
          <p>Questions about these terms can be sent to support@deepfocustime.com.</p>
        </section>
      </div>
    </article>
  );
}

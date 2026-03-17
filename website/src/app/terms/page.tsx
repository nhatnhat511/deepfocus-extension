import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for the DeepFocus Time Chrome extension and website.",
};

export default function TermsPage() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-slate-600">Last updated: March 17, 2026</p>

      <div className="mt-6 space-y-5 text-sm leading-6 text-slate-700">
        <section>
          <h2 className="text-base font-semibold text-slate-900">1. Acceptance of terms</h2>
          <p>
            By accessing or using the DeepFocus Time website, account services, or browser extension, you agree to these
            Terms of Service and applicable platform policies.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">2. Eligibility</h2>
          <p>
            You must be at least 13 years old to use DeepFocus Time. If you use the service on behalf of an
            organization, you represent that you have authority to bind that organization.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">3. The service</h2>
          <p>
            DeepFocus Time is a productivity service that provides a focus timer, session settings, and account-based
            features through a website and browser extension. Features may evolve over time.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">4. Accounts and security</h2>
          <p>
            You are responsible for safeguarding your login credentials and for all activity under your account.
            Notify us promptly of any unauthorized use.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">5. License and permitted use</h2>
          <p>
            We grant you a limited, non-exclusive, non-transferable license to use the service for personal or internal
            business purposes in accordance with these terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">6. Prohibited use</h2>
          <p>
            You agree not to misuse the service, interfere with our systems, attempt unauthorized access, or use the
            service in violation of applicable laws or third-party rights.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">7. Subscriptions and trials</h2>
          <p>
            Premium features require an active subscription. Trials may be offered and are limited to one per account
            unless otherwise stated. We may modify premium features or trial terms over time.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">8. Billing, renewals, and taxes</h2>
          <p>
            Subscriptions renew automatically unless canceled before the renewal date. You can manage or cancel your
            subscription from your account page. Prices may exclude VAT or other applicable taxes, which will be shown
            at checkout when required.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">9. Cancellation</h2>
          <p>
            You can cancel at any time. After cancellation, premium access remains active until the end of the current
            billing period unless otherwise required by law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">10. Refunds</h2>
          <p>
            Refunds are handled according to our{" "}
            <a href="/refund" className="font-semibold text-sky-700 underline decoration-sky-300">
              Refund Policy
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">11. Third-party services</h2>
          <p>
            We use third-party providers for hosting, authentication, analytics, and payment processing. Your use of
            those services may be subject to their terms and policies.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">12. Availability and changes</h2>
          <p>
            We aim for stable service but cannot guarantee uninterrupted availability. We may update or change features
            to improve the service or comply with legal requirements.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">13. Intellectual property</h2>
          <p>
            DeepFocus Time, including the extension, website, and related content, is owned by us and protected by
            intellectual property laws. You may not copy, modify, or redistribute it beyond what is allowed by law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">14. Termination</h2>
          <p>
            We may suspend or terminate access to the service if you violate these terms or if required to protect the
            service or other users. You may stop using the service at any time.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">15. Disclaimers</h2>
          <p>
            The service is provided on an "as is" and "as available" basis. We disclaim all warranties to the maximum
            extent permitted by law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">16. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, DeepFocus Time will not be liable for any indirect, incidental, or
            consequential damages arising from your use of the service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">17. Governing law</h2>
          <p>
            These terms are governed by the laws of Vietnam, unless your local law requires otherwise.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">18. Contact</h2>
          <p>
            Questions about these terms can be sent to{" "}
            <a href="mailto:support@deepfocustime.com" className="font-semibold text-sky-700 underline decoration-sky-300">
              support@deepfocustime.com
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}

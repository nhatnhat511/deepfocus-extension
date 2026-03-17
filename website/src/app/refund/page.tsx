import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Refund and cancellation policy for DeepFocus Time subscriptions.",
};

export default function RefundPage() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Refund Policy</h1>
      <p className="mt-2 text-sm text-slate-600">Last updated: March 17, 2026</p>

      <div className="mt-6 space-y-5 text-sm leading-6 text-slate-700">
        <section>
          <h2 className="text-base font-semibold text-slate-900">1. Eligibility</h2>
          <p>
            Paddle is our Merchant of Record and handles all payments, billing, refunds, and chargebacks. Refund
            requests are reviewed by Paddle in accordance with Paddle’s policies and buyer terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">2. How to request</h2>
          <p>
            You can request a refund directly through Paddle at https://paddle.net. You may also contact us at
            support@deepfocustime.com with the purchase email, order reference, charge date, and a short description of
            the issue, and we will assist with your request.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">3. Processing</h2>
          <p>
            Refunds are processed by Paddle and issued to the original payment method. Card refunds typically take 3–5
            business days to appear, and other payment methods may vary.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">4. Subscription cancellation</h2>
          <p>
            Cancellation stops future renewals. Cancellation alone does not automatically create a refund for previous
            charges unless specifically approved or required by law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">5. Billing provider</h2>
          <p>
            Paddle is the Merchant of Record and is responsible for all payment processing, billing, refunds, and
            chargebacks. Refund decisions are made by Paddle in accordance with their policies.
          </p>
        </section>
      </div>
    </article>
  );
}

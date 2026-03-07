export default function RefundPage() {
  return (
    <section className="max-w-3xl space-y-4 text-slate-700">
      <h1 className="text-3xl font-bold text-slate-900">Refund Policy</h1>
      <p>Effective date: March 7, 2026</p>

      <h2 className="text-xl font-semibold text-slate-900">No Refund Policy</h2>
      <p>
        DeepFocus Time premium charges are non-refundable after payment is processed.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">Cancellation Effect</h2>
      <p>
        If you cancel your premium subscription, only future billing cycles are stopped. You keep access until the end of your already paid period.
        The already paid amount is not refunded.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">Platform and Processor Terms</h2>
      <p>
        Billing may be managed through Chrome Web Store terms and/or Paddle checkout terms depending on the purchase flow. This refund policy is intended
        to be consistent with those payment environments.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">Support</h2>
      <p>
        For billing questions, contact support@deepfocustime.com and include your account email and transaction reference.
      </p>
    </section>
  );
}

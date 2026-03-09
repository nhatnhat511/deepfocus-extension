export default function RefundPage() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Refund Policy</h1>
      <p className="mt-2 text-sm text-slate-600">Last updated: March 9, 2026</p>

      <div className="mt-6 space-y-4 text-sm leading-6 text-slate-700">
        <p>
          Refund requests for DeepFocus Time Premium are handled through Paddle, our payment provider, and reviewed on
          a case-by-case basis.
        </p>
        <p>
          If you were charged unexpectedly, experienced a billing issue, or canceled but were still billed, contact us
          at support@deepfocustime.com with your order reference.
        </p>
        <p>
          For eligible requests, we will coordinate with Paddle to process the refund according to Paddle billing
          policies and local regulations.
        </p>
        <p>
          Subscription cancellations stop future renewals. Cancellation does not automatically issue a refund for past
          charges unless explicitly approved.
        </p>
      </div>
    </article>
  );
}


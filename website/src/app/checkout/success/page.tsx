import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <section className="max-w-2xl space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-8">
      <h1 className="text-3xl font-bold text-emerald-900">Payment Successful</h1>
      <p className="text-emerald-800">
        Thank you. Your premium access will be activated as soon as billing sync completes.
      </p>
      <p className="text-emerald-800">
        Open the DeepFocus extension and use <strong>Account &gt; Refresh</strong> to update your plan status.
      </p>
      <Link href="/" className="inline-block rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
        Back to Home
      </Link>
    </section>
  );
}

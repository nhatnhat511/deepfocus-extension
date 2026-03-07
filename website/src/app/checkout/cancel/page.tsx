import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <section className="max-w-2xl space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-8">
      <h1 className="text-3xl font-bold text-amber-900">Payment Cancelled</h1>
      <p className="text-amber-800">No charge was completed. You can restart checkout whenever you are ready.</p>
      <Link href="/pricing" className="inline-block rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white">
        Back to Pricing
      </Link>
    </section>
  );
}

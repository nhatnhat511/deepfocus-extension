import Link from "next/link";

export default function SupportPage() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Support</h1>
      <p className="mt-2 text-sm text-slate-600">
        Need help with account access, billing, trial status, or technical issues? We are here to help.
      </p>

      <div className="mt-6 space-y-4 text-sm leading-6 text-slate-700">
        <p>Email: support@deepfocustime.com</p>
        <p>Response time: typically within 1-2 business days.</p>
        <p>
          For payment-specific issues, include your Paddle receipt email and any relevant transaction details to speed
          up support.
        </p>
      </div>

      <Link
        href="/contact"
        className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
      >
        Contact Support
      </Link>
    </article>
  );
}


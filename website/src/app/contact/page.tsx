export default function ContactPage() {
  return (
    <section className="max-w-3xl space-y-4 text-slate-700">
      <h1 className="text-3xl font-bold text-slate-900">Support and Contact</h1>
      <p>Need help with DeepFocus Time, account access, or billing?</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>Email: support@deepfocustime.com</li>
        <li>Response target: within 2 business days</li>
        <li>Preferred language: English or Vietnamese</li>
      </ul>

      <h2 className="text-xl font-semibold text-slate-900">For Faster Support</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Use your registered account email when contacting support.</li>
        <li>Include browser version, extension version, and screenshots for technical issues.</li>
        <li>For billing cases, include transaction reference and payment email.</li>
      </ul>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl space-y-4 text-slate-700">
      <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
      <p>Effective date: March 7, 2026</p>
      <p>
        DeepFocus Time is designed to work with minimal data collection. Free users can use core timer features without creating an account.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">Data We Process</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Extension preferences stored locally in your browser (timer lengths, reminders, audio, overlay position, advanced settings).</li>
        <li>Account data when you sign in (email, user id, auth session tokens, profile plan metadata).</li>
        <li>Subscription status fields used for premium access control (for example plan and premium expiration).</li>
        <li>Operational logs from infrastructure providers (Cloudflare, Supabase) for reliability and security.</li>
      </ul>

      <h2 className="text-xl font-semibold text-slate-900">How We Use Data</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Run focus and break sessions, reminders, visual overlays, and user-selected settings.</li>
        <li>Authenticate accounts and determine free or premium access.</li>
        <li>Support billing lifecycle actions such as subscription activation and cancellation handling.</li>
        <li>Respond to support, privacy, and account deletion requests.</li>
      </ul>

      <h2 className="text-xl font-semibold text-slate-900">Data Sharing</h2>
      <p>
        We do not sell personal data. We share data only with service providers needed to operate the product, such as Supabase (auth and database),
        Cloudflare (hosting and routing), Paddle (billing), and Chrome Web Store distribution systems.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">Retention and Deletion</h2>
      <p>
        Local extension settings remain in your browser unless you clear extension storage. Account and profile data remain until deletion is requested
        or required for legal and fraud-prevention obligations.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">Your Choices</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>You can use the extension for free without registration.</li>
        <li>You can sign out and stop premium renewal by canceling subscription before the next billing period.</li>
        <li>You can request data deletion through the Delete Data page.</li>
      </ul>

      <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
      <p>For privacy and data requests, contact: support@deepfocustime.com</p>
    </article>
  );
}

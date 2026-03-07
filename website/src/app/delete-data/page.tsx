export default function DeleteDataPage() {
  return (
    <section className="max-w-3xl space-y-4 text-slate-700">
      <h1 className="text-3xl font-bold text-slate-900">Data Deletion Request</h1>
      <p>
        To request account or settings deletion, email support@deepfocustime.com from your registered account email.
      </p>
      <h2 className="text-xl font-semibold text-slate-900">What to Include</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Registered email address</li>
        <li>Request type: delete account, settings, or both</li>
        <li>Optional note about urgency</li>
      </ul>
      <p>We will confirm deletion after verification.</p>
    </section>
  );
}

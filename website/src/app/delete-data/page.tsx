export default function DeleteDataPage() {
  return (
    <section className="max-w-3xl space-y-4 text-slate-700">
      <h1 className="text-3xl font-bold text-slate-900">Data Deletion Request</h1>
      <p>
        To request deletion of account-related data, email support@deepfocustime.com from your registered account email address.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">What to Include</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Registered email address</li>
        <li>Request type: delete account, settings, or both</li>
        <li>Optional note about urgency</li>
      </ul>

      <h2 className="text-xl font-semibold text-slate-900">Scope of Deletion</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Account profile and premium linkage data can be deleted after verification.</li>
        <li>Locally stored extension preferences can also be removed by uninstalling the extension or clearing browser extension storage.</li>
      </ul>

      <h2 className="text-xl font-semibold text-slate-900">Processing Time</h2>
      <p>We aim to process verified deletion requests within 7 business days.</p>
    </section>
  );
}

import { NextResponse } from "next/server";

export const runtime = "edge";

type ContactBody = {
  name?: string;
  email?: string;
  message?: string;
  company?: string;
};

function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as ContactBody;
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const message = String(body.message || "").trim();
    const company = String(body.company || "").trim();

    if (company) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }
    if (!message || message.length < 10) {
      return NextResponse.json({ error: "Please enter a longer message." }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY || "";
    const contactTo = process.env.CONTACT_TO_EMAIL || "support@deepfocustime.com";
    const contactFrom = process.env.CONTACT_FROM_EMAIL || "DeepFocus Time <onboarding@resend.dev>";

    if (!resendApiKey) {
      return NextResponse.json({ error: "Contact service is not configured yet." }, { status: 500 });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: contactFrom,
        to: [contactTo],
        reply_to: email,
        subject: "New message from contact form",
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      }),
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail =
        (payload as { message?: string; error?: { message?: string } })?.error?.message ||
        (payload as { message?: string })?.message ||
        "Unable to send message.";
      return NextResponse.json({ error: detail }, { status: 502 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}

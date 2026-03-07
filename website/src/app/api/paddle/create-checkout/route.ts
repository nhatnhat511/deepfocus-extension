import { NextResponse } from "next/server";

export const runtime = "edge";

type PaddleTransactionResponse = {
  data?: {
    id?: string;
  };
};

function getPaddleApiBase() {
  const env = (process.env.PADDLE_ENV || "sandbox").toLowerCase();
  return env === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";
}

export async function POST(req: Request) {
  const apiKey = process.env.PADDLE_API_KEY;
  const priceId = process.env.PADDLE_PRICE_ID;

  if (!apiKey || !priceId) {
    return NextResponse.json({ error: "Paddle server env is missing." }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  const payload = {
    items: [{ price_id: priceId, quantity: 1 }],
    customer: { email },
    custom_data: {
      account_email: email,
      source: "deepfocus-web-pricing",
    },
  };

  const res = await fetch(`${getPaddleApiBase()}/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responsePayload = (await res.json().catch(() => ({}))) as PaddleTransactionResponse & {
    error?: { detail?: string };
  };

  if (!res.ok) {
    const error = responsePayload?.error?.detail || "Unable to create Paddle transaction.";
    return NextResponse.json({ error }, { status: 400 });
  }

  const transactionId = responsePayload?.data?.id;
  if (!transactionId) {
    return NextResponse.json({ error: "Missing transaction id from Paddle." }, { status: 500 });
  }

  return NextResponse.json({ transactionId });
}

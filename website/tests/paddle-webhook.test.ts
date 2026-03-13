import { describe, expect, it, vi, beforeAll, afterAll } from "vitest";

async function ensureWebCrypto() {
  if (globalThis.crypto?.subtle) return;
  const { webcrypto } = await import("node:crypto");
  // @ts-expect-error: Node webcrypto polyfill for tests
  globalThis.crypto = webcrypto;
}

describe("paddle webhook verification", () => {
  it("accepts a valid signature", async () => {
    await ensureWebCrypto();
    const { verifyPaddleSignature, signHmacSha256Hex } = await import(
      "../src/app/api/paddle/webhook/route"
    );

    const secret = "test_secret";
    const rawBody = JSON.stringify({ hello: "world" });
    const ts = Math.floor(Date.now() / 1000).toString();
    const signature = await signHmacSha256Hex(secret, `${ts}:${rawBody}`);
    const header = `ts=${ts}; h1=${signature}`;

    await expect(verifyPaddleSignature(rawBody, header, secret)).resolves.toBe(true);
  });

  it("rejects an invalid signature", async () => {
    await ensureWebCrypto();
    const { verifyPaddleSignature } = await import("../src/app/api/paddle/webhook/route");

    const secret = "test_secret";
    const rawBody = JSON.stringify({ hello: "world" });
    const ts = Math.floor(Date.now() / 1000).toString();
    const header = `ts=${ts}; h1=deadbeef`;

    await expect(verifyPaddleSignature(rawBody, header, secret)).resolves.toBe(false);
  });

  it("enforces a timestamp window", async () => {
    const { isRecentSignature } = await import("../src/app/api/paddle/webhook/route");
    const now = Math.floor(Date.now() / 1000);
    const header = `ts=${now - 4000}; h1=abc`;
    expect(isRecentSignature(header, 300)).toBe(false);
  });
});

describe("plan inference", () => {
  const fixedNow = new Date("2026-03-13T12:00:00.000Z");

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
    process.env.PADDLE_PRICE_ID = "pri_monthly";
    process.env.PADDLE_PRICE_ID_YEARLY = "pri_yearly";
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("prefers yearly when price_id matches", async () => {
    const { derivePlanAndUntilFromSubscription } = await import("../src/app/api/paddle/webhook/route");
    const sub = {
      status: "active",
      items: [{ price_id: "pri_yearly" }],
      current_billing_period: {
        starts_at: "2026-03-13T00:00:00.000Z",
        ends_at: "2027-03-13T00:00:00.000Z",
      },
    };

    const result = derivePlanAndUntilFromSubscription(sub, "");
    expect(result.plan).toBe("premium_yearly");
  });

  it("falls back to billing interval when price_id is missing", async () => {
    const { derivePlanAndUntilFromSubscription } = await import("../src/app/api/paddle/webhook/route");
    const sub = {
      status: "active",
      items: [{ price: { billing_cycle: { interval: "month" } } }],
      current_billing_period: {
        starts_at: "2026-03-13T00:00:00.000Z",
        ends_at: "2026-04-13T00:00:00.000Z",
      },
    };

    const result = derivePlanAndUntilFromSubscription(sub, "");
    expect(result.plan).toBe("premium_monthly");
  });

  it("falls back to period length when items are missing", async () => {
    const { inferPlanFromPeriod } = await import("../src/app/api/paddle/webhook/route");
    const sub = {
      current_billing_period: {
        starts_at: "2026-03-13T00:00:00.000Z",
        ends_at: "2026-04-13T00:00:00.000Z",
      },
    };

    expect(inferPlanFromPeriod(sub)).toBe("premium_monthly");
  });

  it("returns free when subscription is inactive and no future window", async () => {
    const { derivePlanAndUntilFromSubscription } = await import("../src/app/api/paddle/webhook/route");
    const sub = {
      status: "canceled",
      current_billing_period: {
        starts_at: "2025-01-01T00:00:00.000Z",
        ends_at: "2025-02-01T00:00:00.000Z",
      },
    };

    const result = derivePlanAndUntilFromSubscription(sub, "");
    expect(result.plan).toBe("free");
    expect(result.premiumUntil).toBeNull();
  });
});

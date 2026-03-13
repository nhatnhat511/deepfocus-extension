import { describe, expect, it } from "vitest";

describe("upgrade proration payload", () => {
  it("uses proration and yearly price", async () => {
    const { buildUpgradePayload } = await import("../src/app/api/paddle/upgrade-subscription/route");

    const payload = buildUpgradePayload({
      userId: "user_123",
      email: "user@example.com",
      priceId: "pri_yearly",
    });

    expect(payload.proration_billing_mode).toBe("prorated_immediately");
    expect(payload.items[0]?.price_id).toBe("pri_yearly");
    expect(payload.custom_data.deepfocus_plan).toBe("premium_yearly");
    expect(payload.custom_data.deepfocus_user_id).toBe("user_123");
    expect(payload.custom_data.deepfocus_email).toBe("user@example.com");
  });
});

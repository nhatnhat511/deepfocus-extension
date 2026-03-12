"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type PlanChoice = "monthly" | "yearly";

type PricingUpgradeButtonProps = {
  plan: PlanChoice;
  className?: string;
  children: string;
};

function buildTarget(plan: PlanChoice) {
  return `/account?plan=${plan}#billing-plan`;
}

export default function PricingUpgradeButton({ plan, className, children }: PricingUpgradeButtonProps) {
  async function handleClick() {
    if (typeof window === "undefined") return;
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const target = buildTarget(plan);

    if (data.session?.access_token) {
      window.location.assign(target);
      return;
    }

    const nextParam = encodeURIComponent(target);
    window.location.assign(`/login?next=${nextParam}`);
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}

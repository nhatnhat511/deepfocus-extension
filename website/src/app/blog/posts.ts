export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  author?: string;
  excerpt: string;
  content: string[];
  featuredImage?: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "deepfocus-time-complete-user-guide",
    title: "DeepFocus Time – Complete User Guide",
    date: "2026-03-16",
    author: "DeepFocus Team",
    excerpt:
      "A complete guide to installing, configuring, and mastering DeepFocus Time for consistent, distraction-free work.",
    content: [
      "Learn how to set up DeepFocus Time, configure your focus and break cycles, and use the timer across your day.",
      "Explore advanced features like automatic theme-aware timer styles, break visuals, and distraction muting.",
      "Get a walkthrough of productivity analytics and how to refine your focus habits over time.",
    ],
    featuredImage: "/articles/deepfocus-time-complete-user-guide/media/img-02ccaf5ba1.png",
  },
  {
    slug: "build-focus-routines",
    title: "Build Focus Routines That Actually Stick",
    date: "2026-03-01",
    author: "DeepFocus Team",
    excerpt:
      "Practical ways to structure focus sessions, breaks, and reminders so your routine feels sustainable, not rigid.",
    content: [
      "Strong focus routines are built on repeatable cues. Start by setting a realistic focus window and protecting it with a short ritual: clear tabs, mute distractions, and set a timer.",
      "Use short breaks to reset your attention, not to spiral into more work. A clean break restores momentum and reduces burnout across the day.",
      "Consistency beats intensity. A reliable daily routine is more valuable than a single marathon session.",
    ],
    featuredImage: "/deepfocus-logo.svg",
  },
  {
    slug: "daily-focus-goals",
    title: "How to Set Daily Focus Goals Without Burning Out",
    date: "2026-02-18",
    author: "DeepFocus Team",
    excerpt:
      "Daily goals should motivate you, not punish you. Here is a lightweight approach for setting weekly targets.",
    content: [
      "Set a baseline target that you can hit on an average day. Then create a stretch goal for high-energy days.",
      "Review your weekly patterns. The best time to focus is often a recurring window each day.",
      "Track your interruptions and reduce the biggest sources first before adding more work.",
    ],
  },
  {
    slug: "meeting-aware-focus",
    title: "Meeting-Aware Focus Sessions for Hybrid Teams",
    date: "2026-02-02",
    author: "DeepFocus Team",
    excerpt:
      "Hybrid teams need timers that respect live meetings. Here is how to avoid double-booking your focus sessions.",
    content: [
      "Use meeting-aware pauses so focus timers do not compete with calls. This keeps your stats clean and reduces friction.",
      "Plan focus sessions around recurring meetings instead of trying to fight calendar reality.",
      "Clear signals to teammates help protect your focus time and support better collaboration.",
    ],
  },
];

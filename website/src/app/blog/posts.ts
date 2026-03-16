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
];

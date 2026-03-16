export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  content: string[];
  featuredImage: string;
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
    slug: 'the-real-reason-you-cant-focus-while-working-in-chrome-and-how-to-fix-it',
    title: "The Real Reason You Can't Focus While Working in Chrome (And How to Fix It)",
    date: "2026-03-16",
    author: "DeepFocus Team",
    excerpt:
      "If you’ve ever opened Chrome to start an important task and ended up switching between tabs, checking notifications, and watching random videos instead — you're not alone.",
    content: [
      "If you’ve ever opened Chrome to start an important task and ended up switching between tabs, checking notifications, and watching random videos instead — you're not alone.",
      'Modern browsers are incredibly powerful tools for work, but they are also the biggest source of digital distraction . Emails, Slack messages, social media feeds, and endless tabs compete for your attention every second.',
      'The problem isn’t that you lack discipline. The real problem is that your work environment inside the browser was never designed for deep focus.',
    ],
  },
  {
    slug: 'deep-work-vs-pomodoro-which-method-actually-works-better',
    title: 'Deep Work vs Pomodoro: Which Method Actually Works Better',
    date: "2026-03-16",
    author: "DeepFocus Team",
    excerpt:
      "If you've ever searched for ways to improve your productivity, you've probably come across two popular methods: Deep Work and the Pomodoro Technique .",
    content: [
      "If you've ever searched for ways to improve your productivity, you've probably come across two popular methods: Deep Work and the Pomodoro Technique .",
      'Both approaches promise to help you stay focused and get more done. But they work in very different ways. Some people swear by long, uninterrupted focus sessions, while others prefer short bursts of work with frequent breaks.',
      'So which method actually works better',
    ],
    featuredImage: "/deepfocus-logo.svg",
  },
  {
    slug: '10-digital-distractions-that-are-destroying-your-productivity',
    title: '10 Digital Distractions That Are Destroying Your Productivity',
    date: "2026-03-16",
    author: "DeepFocus Team",
    excerpt:
      'If you work on a computer for most of the day, you’ve probably experienced this before: you sit down to focus on an important task, open your browser… and somehow end up checkin...',
    content: [
      'If you work on a computer for most of the day, you’ve probably experienced this before: you sit down to focus on an important task, open your browser… and somehow end up checking email, scrolling social media, watching a video, or jumping between tabs.',
      'Digital distractions have become one of the biggest obstacles to productivity in modern work environments. With notifications, messages, and endless content competing for our attention, staying focused for long periods has become increasingly difficult.',
      'The problem isn’t a lack of discipline. Many of the tools we use every day are intentionally designed to capture and hold our attention.',
    ],
    featuredImage: "/deepfocus-logo.svg",
  },
  {
    slug: 'the-science-of-focus-why-your-brain-needs-breaks',
    title: 'The Science of Focus: Why Your Brain Needs Breaks',
    date: "2026-03-16",
    author: "DeepFocus Team",
    excerpt:
      'Many people believe that the secret to productivity is simple: work harder and work longer. If you want to accomplish more, just stay at your desk and keep pushing forward.',
    content: [
      'Many people believe that the secret to productivity is simple: work harder and work longer. If you want to accomplish more, just stay at your desk and keep pushing forward.',
      'But modern neuroscience tells a very different story.',
      'The human brain was not designed to maintain intense concentration for endless hours. In fact, trying to work continuously without breaks often leads to mental fatigue, slower thinking, and lower-quality work .',
    ],
    featuredImage: "/deepfocus-logo.svg",
  },
  {
    slug: 'best-focus-timer-extensions-for-chrome-2026-guide',
    title: 'Best Focus Timer Extensions for Chrome (2026 Guide)',
    date: "2026-03-16",
    author: "DeepFocus Team",
    excerpt:
      'Staying focused while working on a computer has become increasingly difficult. With endless tabs, notifications, and digital distractions competing for attention, even simple ta...',
    content: [
      'Staying focused while working on a computer has become increasingly difficult. With endless tabs, notifications, and digital distractions competing for attention, even simple tasks can take much longer than they should.',
      'That’s why many professionals use focus timer extensions to structure their work sessions. These tools help create clear boundaries between focused work and breaks, making it easier to maintain concentration throughout the day.',
      'In this guide, we’ll look at some of the best focus timer extensions for Chrome in 2026 , how they work, and which one might be the best fit for your workflow.',
    ],
    featuredImage: "/deepfocus-logo.svg",
  },
];

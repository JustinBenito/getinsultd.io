// Trigger Definitions and Configuration
export const TRIGGER_CONFIG = {
  // Social Media Triggers
  EXCESSIVE_SOCIAL_MEDIA: {
    id: "excessive_social_media",
    name: "Excessive Social Media Use",
    description: "Staying too long on social media platforms",
    domains: [
      "twitter.com",
      "www.twitter.com",
      "instagram.com",
      "www.instagram.com",
      "facebook.com",
      "www.facebook.com",
      "youtube.com",
      "www.youtube.com",
      "tiktok.com",
      "www.tiktok.com",
    ],
    timeThreshold: 1 * 60 * 1000, // 1 minute in milliseconds
    type: "duration",
  },

  YOUTUBE_SHORTS: {
    id: "youtube_shorts",
    name: "YouTube Shorts Detection",
    description: "Why are you watching YouTube Shorts?",
    domains: ["youtube.com", "www.youtube.com"],
    type: "instant",
  },

  NON_EDUCATIONAL_YOUTUBE: {
    id: "non_educational_youtube",
    name: "Non-Educational YouTube",
    description: "Watching entertainment instead of learning content",
    domains: ["youtube.com"],
    educationalKeywords: [
      "tutorial",
      "learn",
      "course",
      "education",
      "programming",
      "development",
      "lecture",
      "study",
    ],
    type: "content",
  },

  ENDLESS_SCROLLING: {
    id: "endless_scrolling",
    name: "Endless Scrolling",
    description: "Excessive scrolling behavior",
    domains: ["reddit.com", "instagram.com", "twitter.com", "facebook.com"],
    scrollThreshold: 8,
    timeWindow: 1 * 60 * 1000, // 10 minutes in milliseconds
    type: "behavior",
  },

  BINGE_WATCHING: {
    id: "binge_watching",
    name: "Binge Watching",
    description: "Extended streaming during work hours",
    domains: ["netflix.com", "primevideo.com", "hulu.com", "disney.com"],
    timeThreshold: 1 * 60 * 1000, // 5 minutes in milliseconds
    type: "duration",
  },

  OVERLOADED_TABS: {
    id: "overloaded_tabs",
    name: "Overloaded Tabs",
    description: "Too many inactive tabs",
    tabThreshold: 15,
    engagementThreshold: 0.05, // 5% engagement
    type: "behavior",
  },

  SHOPPING_NEWS: {
    id: "shopping_news",
    name: "Shopping/News Browsing",
    description: "Excessive shopping or news browsing",
    domains: [
      "amazon.com",
      "flipkart.com",
      "ebay.com",
      "ndtv.com",
      "cnn.com",
      "bbc.com",
      "news.google.com",
    ],
    visitThreshold: 5,
    type: "frequency",
  },

  RAPID_TAB_SWITCHING: {
    id: "rapid_tab_switching",
    name: "Rapid Tab Switching",
    description: "10+ tab switches within 60 seconds",
    switchThreshold: 10,
    timeWindow: 60 * 1000, // 60 seconds in milliseconds
    type: "behavior",
  },

  FREQUENT_TYPING_DELETING: {
    id: "frequent_typing_deleting",
    name: "Frequent Typing and Deleting",
    description:
      "Repeatedly typing and deleting - are you unsure about what to write?",
    actionThreshold: 10, // 10 typing actions
    deleteThreshold: 5, // 5 delete actions
    patternRepetitions: 2, // Need to see the pattern repeat this many times
    timeWindow: 10 * 1000, // 10 seconds for each pattern
    patternWindow: 60 * 1000, // 1 minute to catch all repetitions
    cooldownPeriod: 120 * 1000, // 2 minute cooldown after trigger
    type: "behavior",
  },

  REWARD_SWITCHING: {
    id: "reward_switching",
    name: "Reward-Based Switching",
    description: "Switching to entertainment after work",
    productiveApps: [
      "github.com",
      "gitlab.com",
      "notion.so",
      "docs.google.com",
    ],
    rewardApps: ["youtube.com", "netflix.com"],
    timeThreshold: 5 * 1000, // 5 seconds threshold
    type: "behavior",
  },

  CLICKBAIT_NEWS: {
    id: "clickbait_news",
    name: "Clickbait Consumption",
    description: "Extended news browsing",
    domains: [
      "news.google.com",
      "cnn.com",
      "bbc.com",
      "ndtv.com",
      "foxnews.com",
      "reuters.com",
      "bloomberg.com",
    ],
    timeThreshold: 1 * 60 * 1000, // 10 minutes in milliseconds
    type: "duration",
  },

  MESSAGING_PLATFORMS: {
    id: "messaging_platforms",
    name: "Messaging Platforms",
    description: "Extended messaging platform use",
    domains: ["web.whatsapp.com", "discord.com", "slack.com", "telegram.org"],
    timeThreshold: 1 * 60 * 1000, // 10 minutes in milliseconds
    type: "duration",
  },

  WEB_GAMES: {
    id: "web_games",
    name: "Web-Based Games",
    description: "Playing browser games during work",
    domains: [
      "1v1.lol",
      "slither.io",
      "agar.io",
      "miniclip.com",
      "poki.com",
      "coolmathgames.com",
    ],
    type: "instant",
  },
};

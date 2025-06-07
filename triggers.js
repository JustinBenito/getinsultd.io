// Export all the confetti functions we need
import {
  fireConfetti,
  fireCelebrationConfetti,
  fireStarConfetti,
  fireFireworks,
} from "./canvas-confetti.js";

// Trigger Definitions and Configuration
export const TRIGGER_CONFIG = {
  PRODUCTIVE_WEBSITE: {
    id: "productive_website",
    name: "Visited a Productive Website",
    type: "instant",
    message:
      "Power move! You're on a productive site — keep going, you're on fire 🔥",
    domains: [
      "notion.so",
      "github.com",
      "leetcode.com",
      "docs.google.com",
      "stackoverflow.com",
      "medium.com",
      "dev.to",
      "udemy.com",
      "coursera.org",
      "office.com",
    ],
  },

  PRODUCTIVE_SEARCH: {
    id: "productive_search",
    name: "Searched Something Productive on Google",
    type: "instant",
    message: "Smart search! That query screams growth mindset 💡",
    domains: ["google.com"],
    keywords: ["how to", "learn", "tutorial", "guide", "documentation"],
    requiresSearch: true,
  },

  PRODUCTIVE_YOUTUBE: {
    id: "productive_youtube",
    name: "Watching a Productive YouTube Video",
    type: "instant",
    message: "You're not just watching — you're learning. That's next-level 📈",
    domains: ["youtube.com"],
    keywords: [
      "tutorial",
      "learn",
      "course",
      "documentation",
      "guide",
      "explained",
      "education",
      "development",
      "programming",
    ],
    requiresVideoTitle: true,
  },

  CLOSED_DISTRACTION: {
    id: "closed_distraction",
    name: "Closed a Distracting Tab",
    type: "instant",
    message: "Boom 💥! You just took back control of your focus!",
    domains: [
      "instagram.com",
      "twitter.com",
      "netflix.com",
      "facebook.com",
      "tiktok.com",
      "reddit.com",
    ],
    requiresClosing: true, // Indicates this trigger requires tab closure
  },

  DISTRACTION_FREE: {
    id: "distraction_free",
    name: "Stayed Away From Distraction Sites",
    type: "duration",
    message:
      "Great going! 10 minutes without distractions - your focus is on point! 🧠💪",
    timeThreshold: 10 * 60 * 1000, // 10 minutes
    domains: [
      "instagram.com",
      "twitter.com",
      "netflix.com",
      "facebook.com",
      "tiktok.com",
      "reddit.com",
    ],
    requiresDistractionFree: true, // Indicates this trigger requires distraction-free period
  },

  WORK_DOCUMENT: {
    id: "work_document",
    name: "Opened a Work Document",
    type: "instant",
    message: "Docs opened. Game face on. Let's do this! 📄✅",
    domains: ["docs.google.com", "notion.so", "office.com"],
  },

  PRODUCTIVE_DURATION: {
    id: "productive_duration",
    name: "Spent Long Time on a Productive Site",
    type: "duration",
    message: "That's some deep grind time. Focus like yours moves mountains 🏔️",
    timeThreshold: 10 * 60 * 1000, // 10 minutes
    domains: [
      "notion.so",
      "github.com",
      "leetcode.com",
      "docs.google.com",
      "stackoverflow.com",
      "medium.com",
      "dev.to",
      "udemy.com",
      "coursera.org",
      "office.com",
    ],
  },

  FIRST_TAB: {
    id: "first_tab",
    name: "First Tab of the Day is Productive",
    type: "instant",
    message: "Started the day strong 💪 — this is how winners begin mornings!",
    requiresFirstTab: true,
    domains: [
      "notion.so",
      "github.com",
      "leetcode.com",
      "docs.google.com",
      "stackoverflow.com",
      "medium.com",
      "dev.to",
      "udemy.com",
      "coursera.org",
      "office.com",
    ],
  },

  MORNING_SURGE: {
    id: "morning_surge",
    name: "Morning Productivity Surge",
    type: "instant",
    message: "Early bird gets the breakthroughs. You're ahead of 99% 🌅",
    requiresMorningHours: true,
    morningHourLimit: 7, // Must be before 7 AM
    domains: [
      "notion.so",
      "github.com",
      "leetcode.com",
      "docs.google.com",
      "stackoverflow.com",
      "medium.com",
      "dev.to",
      "udemy.com",
      "coursera.org",
      "office.com",
    ],
  },

  PRODUCTIVE_STREAK: {
    id: "productive_streak",
    name: "Completed 5 Productive Actions",
    type: "counter",
    message:
      "5 solid wins already. You're on a roll 🚀 — keep stacking those Ws!",
    threshold: 5,
    resetOnThreshold: true,
  },

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

  SHOPPING_SITES: {
    id: "shopping_sites",
    name: "Shopping Sites",
    description: "Browsing shopping websites during work",
    domains: [
      "amazon",
      "flipkart.com",
      "ebay.com",
      "walmart.com",
      "etsy.com",
      "aliexpress.com",
      "bestbuy.com",
      "target.com",
    ],
    type: "instant",
  },

  NEWS_SITES: {
    id: "news_sites",
    name: "News Browsing",
    description: "Excessive news browsing",
    domains: [
      "ndtv.com",
      "cnn.com",
      "bbc.com",
      "news.google.com",
      "foxnews.com",
      "reuters.com",
      "bloomberg.com",
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

// Productivity trigger definitions and helper functions
const DISTRACTION_DOMAINS = [
  "instagram.com",
  "twitter.com",
  "netflix.com",
  "facebook.com",
  "tiktok.com",
  "reddit.com",
  "youtube.com", // Note: YouTube is both productive and distracting based on content
];

const PRODUCTIVE_DOMAINS = [
  "notion.so",
  "github.com",
  "leetcode.com",
  "docs.google.com",
  "stackoverflow.com",
  "medium.com",
  "dev.to",
  "udemy.com",
  "coursera.org",
  "office.com",
];

const PRODUCTIVE_KEYWORDS = [
  "tutorial",
  "learn",
  "course",
  "documentation",
  "guide",
  "explained",
  "how to",
  "education",
  "development",
  "programming",
];

class ProductivityTriggers {
  constructor() {
    // State tracking
    this.lastDistractionTime = Date.now();
    this.productiveActionCount = 0;
    this.firstTabOfDay = true;
    this.activeTabStartTime = Date.now();
    this.currentActiveTab = null;
    this.lastFireworkTime = 0;

    console.log("ProductivityTriggers initialized");
  }

  init() {
    console.log("Initializing productivity triggers...");
    this.initializeChecks();
  }

  initializeChecks() {
    console.log("Setting up checks and listeners...");

    // Check every 10 seconds for time-based triggers
    setInterval(() => {
      console.log("Running periodic checks...");
      this.runPeriodicChecks();
    }, 10000);

    // Add a new interval specifically for productive time tracking
    setInterval(() => {
      console.log("Checking current tab productive time...");
      this.checkCurrentTabProductiveTime();
    }, 60000);

    // Listen for tab changes
    if (chrome && chrome.tabs) {
      console.log("Setting up Chrome tab listeners...");

      chrome.tabs.onActivated.addListener((activeInfo) => {
        console.log("Tab activated:", activeInfo);
        this.handleTabChange(activeInfo.tabId);
      });

      chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
        console.log("Tab removed:", tabId);
        this.handleTabClose(tabId);
      });

      chrome.tabs.onCreated.addListener((tab) => {
        console.log("New tab created:", tab);
        this.handleNewTab(tab);
      });

      // Add listener for tab updates (URL changes)
      chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        console.log("Tab updated:", tabId, changeInfo);
        if (changeInfo.status === "complete") {
          this.handleTabChange(tabId);
        }
      });

      // Get current tab on startup
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          console.log("Initial tab check:", tabs[0]);
          this.handleTabChange(tabs[0].id);
        }
      });
    } else {
      console.warn("Chrome tabs API not available");
    }
  }

  async handleTabChange(tabId) {
    const tab = await this.getTabInfo(tabId);
    if (!tab) {
      console.warn("Could not get tab info for:", tabId);
      return;
    }

    console.log("Handling tab change:", tab.url);

    // Update timing info
    const now = Date.now();

    // Check time spent on previous tab before switching
    if (this.currentActiveTab) {
      const timeSpent = now - this.activeTabStartTime;
      console.log("Time spent on previous tab:", timeSpent / 1000, "seconds");

      if (timeSpent >= 10 * 60 * 1000) {
        try {
          const url = new URL(this.currentActiveTab.url);
          console.log("Checking previous tab domain:", url.hostname);
          if (this.isProductiveDomain(url.hostname)) {
            console.log("Triggering long-time productivity celebration");
            this.triggerCelebration({
              title: "Spent Long Time on a Productive Site",
              message:
                "That's some deep grind time. Focus like yours moves mountains 🏔️",
            });
          }
        } catch (error) {
          console.error("Error checking previous tab:", error);
        }
      }
    }

    // Update current tab info
    this.currentActiveTab = tab;
    this.activeTabStartTime = now;

    // Immediately check if new tab is productive
    try {
      const url = new URL(tab.url);
      const domain = url.hostname;
      console.log("Checking current tab domain:", domain);

      if (this.isProductiveDomain(domain)) {
        console.log("Productive domain detected:", domain);
        this.triggerCelebration({
          title: "Visited a Productive Website",
          message:
            "Power move! You're on a productive site — keep going, you're on fire 🔥",
        });
        this.incrementProductiveActions();
      }

      // Check various other triggers
      await Promise.all([
        this.checkGoogleSearch(tab),
        this.checkYouTubeVideo(tab),
        this.checkWorkDocument(tab),
      ]);
    } catch (error) {
      console.error("Error checking tab productivity:", error);
    }
  }

  async handleTabClose(tabId) {
    const tab = await this.getTabInfo(tabId);
    if (!tab) return;

    try {
      const url = new URL(tab.url);
      if (this.isDistractionDomain(url.hostname)) {
        this.triggerCelebration({
          title: "Closed a Distracting Tab",
          message: "Boom 💥! You just took back control of your focus!",
        });
      }
    } catch (error) {
      console.error("Error handling tab close:", error);
    }
  }

  async handleNewTab(tab) {
    try {
      const url = new URL(tab.url);

      if (this.firstTabOfDay) {
        this.firstTabOfDay = false;
        if (this.isProductiveDomain(url.hostname)) {
          this.triggerCelebration({
            title: "First Tab of the Day is Productive",
            message:
              "Started the day strong 💪 — this is how winners begin mornings!",
          });
        }
      }

      // Check for morning productivity
      const hour = new Date().getHours();
      if (hour < 7 && this.isProductiveDomain(url.hostname)) {
        this.triggerCelebration({
          title: "Morning Productivity Surge",
          message: "Early bird gets the breakthroughs. You're ahead of 99% 🌅",
        });
      }
    } catch (error) {
      console.error("Error handling new tab:", error);
    }
  }

  async runPeriodicChecks() {
    // Check for 15-minute distraction-free periods
    const timeSinceDistraction = Date.now() - this.lastDistractionTime;
    if (timeSinceDistraction >= 15 * 60 * 1000) {
      // 15 minutes
      this.triggerCelebration({
        title: "Stayed Away From Distraction Sites for 15 Minutes",
        message: "15 mins of deep focus complete — your brain thanks you 🧠💪",
      });
      this.lastDistractionTime = Date.now(); // Reset the timer
    }
  }

  async checkCurrentTabProductiveTime() {
    if (!this.currentActiveTab) return;

    const timeSpent = Date.now() - this.activeTabStartTime;
    if (timeSpent >= 10 * 60 * 1000) {
      // 10 minutes
      try {
        const url = new URL(this.currentActiveTab.url);
        if (this.isProductiveDomain(url.hostname)) {
          this.triggerCelebration({
            title: "Spent Long Time on a Productive Site",
            message:
              "That's some deep grind time. Focus like yours moves mountains 🏔️",
          });
          // Reset the start time to avoid repeated triggers
          this.activeTabStartTime = Date.now();
        }
      } catch (error) {
        console.error("Error checking productive time:", error);
      }
    }
  }

  async checkGoogleSearch(tab) {
    try {
      const url = new URL(tab.url);
      if (
        url.hostname.includes("google.com") &&
        url.pathname.includes("/search")
      ) {
        const query = url.searchParams.get("q");
        if (this.isProductiveSearch(query)) {
          this.incrementProductiveActions();
          this.triggerCelebration({
            title: "Searched Something Productive on Google",
            message: "Smart search! That query screams growth mindset 💡",
          });
        }
      }
    } catch (error) {
      console.error("Error checking Google search:", error);
    }
  }

  async checkYouTubeVideo(tab) {
    try {
      const url = new URL(tab.url);
      if (
        url.hostname.includes("youtube.com") &&
        url.pathname.includes("/watch")
      ) {
        const title = tab.title;
        if (this.isProductiveContent(title)) {
          this.incrementProductiveActions();
          this.triggerCelebration({
            title: "Watching a Productive YouTube Video",
            message:
              "You're not just watching — you're learning. That's next-level 📈",
          });
        }
      }
    } catch (error) {
      console.error("Error checking YouTube video:", error);
    }
  }

  async checkWorkDocument(tab) {
    try {
      const url = new URL(tab.url);
      const isWorkDoc =
        url.hostname.includes("docs.google.com") ||
        url.hostname.includes("notion.so") ||
        url.hostname.includes("office.com");

      if (isWorkDoc) {
        this.incrementProductiveActions();
        this.triggerCelebration({
          title: "Opened a Work Document",
          message: "Docs opened. Game face on. Let's do this! 📄✅",
        });
      }
    } catch (error) {
      console.error("Error checking work document:", error);
    }
  }

  incrementProductiveActions() {
    this.productiveActionCount++;
    if (this.productiveActionCount === 5) {
      this.triggerCelebration({
        title: "Completed 5 Productive Actions",
        message:
          "5 solid wins already. You're on a roll 🚀 — keep stacking those Ws!",
      });
      this.productiveActionCount = 0; // Reset counter
    }
  }

  // Helper methods
  isProductiveDomain(domain) {
    const isProductive = PRODUCTIVE_DOMAINS.some((pd) => domain.includes(pd));
    console.log("Domain productivity check:", domain, isProductive);
    return isProductive;
  }

  isDistractionDomain(domain) {
    return DISTRACTION_DOMAINS.some((dd) => domain.includes(dd));
  }

  isProductiveSearch(query) {
    if (!query) return false;
    query = query.toLowerCase();
    return (
      query.includes("how to") ||
      query.includes("learn") ||
      query.includes("tutorial") ||
      query.includes("guide") ||
      query.includes("documentation")
    );
  }

  isProductiveContent(title) {
    if (!title) return false;
    title = title.toLowerCase();
    return PRODUCTIVE_KEYWORDS.some((keyword) =>
      title.includes(keyword.toLowerCase())
    );
  }

  async getTabInfo(tabId) {
    return new Promise((resolve) => {
      if (!chrome || !chrome.tabs) {
        resolve(null);
        return;
      }
      chrome.tabs.get(tabId, (tab) => {
        resolve(tab);
      });
    });
  }

  triggerCelebration(trigger) {
    const now = Date.now();
    console.log("Attempting to trigger celebration:", trigger.title);

    if (now - this.lastFireworkTime < 30000) {
      console.log("Celebration skipped - too soon since last celebration");
      return;
    }

    this.lastFireworkTime = now;
    console.log("Triggering celebration:", trigger.title);

    try {
      // Use the imported confetti functions
      const celebrations = [
        fireConfetti,
        fireCelebrationConfetti,
        fireStarConfetti,
        fireFireworks,
      ];
      const celebration =
        celebrations[Math.floor(Math.random() * celebrations.length)];

      // Trigger the celebration
      celebration();

      // Show the message
      this.showMessage(trigger.title, trigger.message);

      // Send message to content script to add border effect
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: "SHOW_BORDER_EFFECT",
            duration: 3000, // 3 seconds
          });
        }
      });
    } catch (error) {
      console.error("Error during celebration:", error);
    }
  }

  showMessage(title, message) {
    console.log("Showing message:", title, message);

    // Create notification element
    const notification = document.createElement("div");
    notification.className = "productivity-notification";
    notification.innerHTML = `
      <h3>${title}</h3>
      <p>${message}</p>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease-in forwards";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Create and export the singleton instance
export const productivityTriggers = new ProductivityTriggers();

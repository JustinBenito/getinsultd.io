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
    // Initialize trigger checks
    this.initializeChecks();
  }

  initializeChecks() {
    console.log("Initializing checks...");

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

    if (this.isDistractionDomain(new URL(tab.url).hostname)) {
      this.triggerCelebration({
        title: "Closed a Distracting Tab",
        message: "Boom 💥! You just took back control of your focus!",
      });
    }
  }

  async handleNewTab(tab) {
    if (this.firstTabOfDay) {
      this.firstTabOfDay = false;
      if (this.isProductiveDomain(new URL(tab.url).hostname)) {
        this.triggerCelebration({
          title: "First Tab of the Day is Productive",
          message:
            "Started the day strong 💪 — this is how winners begin mornings!",
        });
      }
    }

    // Check for morning productivity
    const hour = new Date().getHours();
    if (hour < 7 && this.isProductiveDomain(new URL(tab.url).hostname)) {
      this.triggerCelebration({
        title: "Morning Productivity Surge",
        message: "Early bird gets the breakthroughs. You're ahead of 99% 🌅",
      });
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

  async checkGoogleSearch(tab) {
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
  }

  async checkYouTubeVideo(tab) {
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
  }

  async checkWorkDocument(tab) {
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

    // Prevent celebrations from firing too frequently (minimum 30 seconds apart)
    if (now - this.lastFireworkTime < 30000) {
      console.log("Celebration skipped - too soon since last celebration");
      return;
    }

    this.lastFireworkTime = now;
    console.log("Triggering celebration:", trigger.title);

    try {
      // Import confetti functions from your existing file
      const {
        fireConfetti,
        fireCelebrationConfetti,
        fireStarConfetti,
        fireFireworks,
      } = require("./canvas-confetti.js");

      // Randomly choose a celebration effect
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
    } catch (error) {
      console.error("Error during celebration:", error);
    }
  }

  showMessage(title, message) {
    console.log("Showing message:", title, message);

    // First try browser notifications
    if (chrome && chrome.notifications) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "path/to/your/icon.png",
        title: title,
        message: message,
      });
    } else {
      // Fallback to console
      console.log("Notification:", title, message);
    }
  }

  // New method to check productive time on current tab
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
}

// Export the class
export const productivityTriggers = new ProductivityTriggers();

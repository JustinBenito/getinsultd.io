import { TRIGGER_CONFIG } from "./triggers.js";

class TriggerDetector {
  constructor() {
    // Initialize tracking data
    this.scrollEvents = new Map();
    this.tabHistory = new Map();
    this.typeDeleteHistory = new Map();
    this.siteVisits = new Map();
    this.activeTabStartTime = Date.now();
    this.lastActiveTime = this.activeTabStartTime;
    this.lastTabTimestamp = Date.now();
    this.activeTriggers = new Set();
    this.callbacks = new Map();

    console.log(
      "TriggerDetector initialized, start time:",
      this.activeTabStartTime
    );

    // Initialize listeners
    this.initializeListeners();

    // Start periodic checks
    this.startPeriodicChecks();

    // Set up tab change listener
    if (chrome.tabs) {
      chrome.tabs.onActivated.addListener(this.handleTabActivated.bind(this));
      chrome.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));
    }
  }

  // Initialize all event listeners
  initializeListeners() {
    console.log("Setting up event listeners...");

    // Scroll detection
    document.addEventListener(
      "scroll",
      this.debounce(this.handleScroll.bind(this), 100)
    );

    // Tab switching detection
    document.addEventListener(
      "visibilitychange",
      this.handleTabVisibility.bind(this)
    );

    // Typing detection
    document.addEventListener(
      "input",
      this.debounce(this.handleTyping.bind(this), 100)
    );

    // Clean up old data periodically
    setInterval(this.cleanupOldData.bind(this), 60000);

    // Set initial time if document is visible
    if (!document.hidden) {
      this.activeTabStartTime = Date.now();
      console.log(
        "Initial tab visible, setting start time:",
        this.activeTabStartTime
      );
    }

    console.log("Event listeners set up complete");
  }

  // Utility function for debouncing events
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Register callback for trigger events
  onTrigger(callback) {
    const callbackId = Math.random().toString(36).substr(2, 9);
    this.callbacks.set(callbackId, callback);
    return callbackId;
  }

  // Remove callback
  removeCallback(callbackId) {
    this.callbacks.delete(callbackId);
  }

  // Notify all registered callbacks
  notifyCallbacks(trigger, data) {
    this.callbacks.forEach((callback) => {
      try {
        callback(trigger, data);
      } catch (error) {
        console.error("Error in trigger callback:", error);
      }
    });
  }

  // Handle scroll events
  handleScroll() {
    const currentDomain = window.location.hostname;
    const config = Object.values(TRIGGER_CONFIG).find(
      (t) => t.id === "endless_scrolling" && t.domains.includes(currentDomain)
    );

    if (!config) return;

    const now = Date.now();
    if (!this.scrollEvents.has(currentDomain)) {
      this.scrollEvents.set(currentDomain, []);
    }

    const events = this.scrollEvents.get(currentDomain);
    events.push(now);

    // Check scroll threshold
    const recentEvents = events.filter(
      (time) => now - time < config.timeWindow
    );
    if (recentEvents.length >= config.scrollThreshold) {
      this.triggerDetected(config, { scrollCount: recentEvents.length });
    }
  }

  // Handle tab visibility changes
  handleTabVisibility() {
    const currentDomain = window.location.hostname;
    const now = Date.now();

    if (document.hidden) {
      // Tab became inactive
      const duration = now - this.activeTabStartTime;
      this.checkDurationTriggers(currentDomain, duration);
      this.lastActiveTime = now;
    } else {
      // Tab became active - only reset time if it's been a while
      const timeSinceLastActive = now - this.lastActiveTime;
      if (timeSinceLastActive > 5 * 60 * 1000) {
        // If inactive for more than 5 minutes
        this.activeTabStartTime = now;
      }
      this.lastActiveTime = now;
      this.checkTabLooping(currentDomain);
      this.checkRewardSwitching(currentDomain);
    }
  }

  // Helper function to match domains
  domainMatches(domain, pattern) {
    // Remove www. from both domain and pattern for comparison
    const normalizedDomain = domain.toLowerCase();
    const normalizedPattern = pattern.replace(/^www\./, "").toLowerCase();
    return normalizedDomain.includes(normalizedPattern);
  }

  // Check duration-based triggers
  checkDurationTriggers(domain, duration) {
    console.log("Checking duration triggers:", { domain, duration });
    const triggers = Object.values(TRIGGER_CONFIG).filter(
      (t) =>
        t.type === "duration" &&
        t.domains.some((d) => this.domainMatches(domain, d))
    );

    console.log("Found matching triggers:", triggers);

    for (const trigger of triggers) {
      console.log("Checking trigger:", {
        trigger,
        threshold: trigger.timeThreshold,
        duration,
      });
      if (duration >= trigger.timeThreshold) {
        console.log("Trigger threshold met!");
        this.triggerDetected(trigger, { duration });
      }
    }
  }

  // Check tab looping behavior
  checkTabLooping(domain) {
    const config = TRIGGER_CONFIG.TAB_LOOPING;
    const now = Date.now();

    if (!this.tabHistory.has(domain)) {
      this.tabHistory.set(domain, []);
    }

    const history = this.tabHistory.get(domain);
    history.push(now);

    const recentVisits = history.filter(
      (time) => now - time < config.timeWindow
    );
    if (recentVisits.length >= config.repeatThreshold) {
      this.triggerDetected(config, { visits: recentVisits.length });
    }
  }

  // Handle tab activation
  async handleTabActivated(activeInfo) {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      const currentDomain = new URL(tab.url).hostname;
      const now = Date.now();
      const timeSinceLastTab = now - this.lastTabTimestamp;

      console.log("Tab activated:", {
        currentDomain,
        timeSinceLastTab,
      });

      this.checkRewardSwitching(currentDomain, timeSinceLastTab);
      this.lastTabTimestamp = now;
    } catch (error) {
      console.error("Error handling tab activation:", error);
    }
  }

  // Handle tab URL updates
  async handleTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status === "complete" && tab.active) {
      try {
        const currentDomain = new URL(tab.url).hostname;
        const now = Date.now();
        const timeSinceLastTab = now - this.lastTabTimestamp;

        console.log("Tab updated:", {
          currentDomain,
          timeSinceLastTab,
        });

        this.checkRewardSwitching(currentDomain, timeSinceLastTab);
        this.lastTabTimestamp = now;
      } catch (error) {
        console.error("Error handling tab update:", error);
      }
    }
  }

  // Helper function to check if domain matches any in the list
  isDomainInList(domain, list) {
    const normalizedDomain = domain.toLowerCase();
    return list.some((app) => normalizedDomain.includes(app.toLowerCase()));
  }

  // Check reward-based switching
  async checkRewardSwitching(currentDomain, timeSinceLastTab) {
    const config = TRIGGER_CONFIG.REWARD_SWITCHING;
    const lastProductiveVisit = await this.getLastProductiveVisit();

    console.log("Checking reward switching:", {
      currentDomain,
      lastProductiveVisit,
      timeSinceLastTab,
      timeThreshold: config.timeThreshold,
      isCurrentDomainReward: this.isDomainInList(
        currentDomain,
        config.rewardApps
      ),
      wasLastTabProductive: lastProductiveVisit
        ? config.productiveApps.includes(lastProductiveVisit.domain)
        : false,
      productiveApps: config.productiveApps,
      rewardApps: config.rewardApps,
    });

    console.log(
      "Domain checks:",
      this.isDomainInList(currentDomain, config.rewardApps),
      lastProductiveVisit &&
        config.productiveApps.includes(lastProductiveVisit.domain)
    );

    // Check if we're switching from productive to reward
    if (
      lastProductiveVisit &&
      config.productiveApps.includes(lastProductiveVisit.domain) &&
      this.isDomainInList(currentDomain, config.rewardApps)
    ) {
      console.log("Reward switching detected!", {
        from: lastProductiveVisit.domain,
        to: currentDomain,
        timeTaken: timeSinceLastTab,
        timeThreshold: config.timeThreshold,
      });
      this.triggerDetected(config, {
        from: lastProductiveVisit.domain,
        to: currentDomain,
        timeTaken: timeSinceLastTab,
      });
    }

    // Update last productive tab if current site is productive
    await this.handleTabChange(currentDomain, config);
  }

  async handleTabChange(currentDomain, config) {
    if (config.productiveApps.includes(currentDomain)) {
      console.log("Productive site visited:", currentDomain);
      await this.storeProductiveVisit(currentDomain);
    }
  }

  // Handle typing events
  handleTyping(event) {
    const config = TRIGGER_CONFIG.FREQUENT_TYPING_DELETING;
    const now = Date.now();

    if (!this.typeDeleteHistory.has("input")) {
      this.typeDeleteHistory.set("input", []);
    }

    const actions = this.typeDeleteHistory.get("input");
    actions.push(now);

    const recentActions = actions.filter(
      (time) => now - time < config.timeWindow
    );
    if (recentActions.length >= config.actionThreshold) {
      this.triggerDetected(config, { actionCount: recentActions.length });
    }
  }

  // Check for non-educational YouTube content
  checkYouTubeContent() {
    if (window.location.hostname.includes("youtube.com")) {
      const config = TRIGGER_CONFIG.NON_EDUCATIONAL_YOUTUBE;
      const title = document.title.toLowerCase();

      const isEducational = config.educationalKeywords.some((keyword) =>
        title.includes(keyword.toLowerCase())
      );

      if (!isEducational) {
        this.triggerDetected(config, { title });
      }
    }
  }

  // Trigger detection handler
  triggerDetected(trigger, data) {
    // Prevent duplicate triggers within a time window
    const triggerId = trigger.id;
    if (this.activeTriggers.has(triggerId)) return;

    this.activeTriggers.add(triggerId);
    this.notifyCallbacks(trigger, data);

    // Clear trigger after delay
    setTimeout(() => {
      this.activeTriggers.delete(triggerId);
    }, 0.5 * 60 * 1000); // 5 minutes cooldown
  }

  // Cleanup old tracking data
  cleanupOldData() {
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    // Clean up scroll events
    this.scrollEvents.forEach((events, domain) => {
      this.scrollEvents.set(
        domain,
        events.filter((time) => now - time < ONE_HOUR)
      );
    });

    // Clean up tab history
    this.tabHistory.forEach((visits, domain) => {
      this.tabHistory.set(
        domain,
        visits.filter((time) => now - time < ONE_HOUR)
      );
    });

    // Clean up type/delete history
    this.typeDeleteHistory.forEach((actions, key) => {
      this.typeDeleteHistory.set(
        key,
        actions.filter((time) => now - time < ONE_HOUR)
      );
    });
  }

  startPeriodicChecks() {
    // Check every 10 seconds for all duration-based triggers
    setInterval(() => {
      if (!document.hidden) {
        const currentDomain = window.location.hostname;
        const now = Date.now();
        const duration = now - this.activeTabStartTime;
        this.checkDurationTriggers(currentDomain, duration);
      }
    }, 10000);
  }

  // Helper function to store productive site visit
  async storeProductiveVisit(domain) {
    await chrome.storage.local.set({
      productiveVisit: {
        domain: domain,
        startTime: Date.now(),
      },
    });
    console.log("✅ Stored productive visit in trigger:", {
      domain: domain,
      startTime: Date.now(),
    });
  }

  // Helper function to get last productive visit
  async getLastProductiveVisit() {
    const result = await chrome.storage.local.get("productiveVisit");
    console.log("📖 Reading productive visit in trigger:", result);
    return result.productiveVisit || null;
  }
}

export { TriggerDetector };

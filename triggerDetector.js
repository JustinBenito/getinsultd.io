import { TRIGGER_CONFIG } from "./triggers.js";

export class TriggerDetector {
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
    this.youtubeMonitoring = null;
    this.lastTabCount = 0;
    this.lastUrl = window.location.href;

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

    // Initialize YouTube monitoring if we're on YouTube
    this.initializeYouTubeMonitoring();

    // Listen for messages from background script
    this.setupMessageListener();

    // Set up URL change observer
    this.setupUrlChangeObserver();

    // Check initial URL
    this.checkForYouTubeShorts(window.location.href);
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "TAB_COUNT_UPDATE") {
        this.handleTabCountUpdate(message.data);
      }
      // Make sure to return false since we're not using sendResponse
      return false;
    });
  }

  handleTabCountUpdate(data) {
    const { tabCount, isOverloaded } = data;
    this.lastTabCount = tabCount;

    console.log("📊 Tab Count Update:", {
      timestamp: new Date().toLocaleTimeString(),
      currentTabCount: tabCount,
      threshold: TRIGGER_CONFIG.OVERLOADED_TABS.tabThreshold,
      isOverloaded,
    });

    if (isOverloaded) {
      this.triggerDetected(TRIGGER_CONFIG.OVERLOADED_TABS, {
        tabCount,
        threshold: TRIGGER_CONFIG.OVERLOADED_TABS.tabThreshold,
      });
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

      // Stop YouTube monitoring when tab is hidden
      if (currentDomain.includes("youtube.com") && this.youtubeMonitoring) {
        this.youtubeMonitoring.stop();
      }
    } else {
      // Tab became active
      const timeSinceLastActive = now - this.lastActiveTime;
      if (timeSinceLastActive > 5 * 60 * 1000) {
        // If inactive for more than 5 minutes
        this.activeTabStartTime = now;
      }
      this.lastActiveTime = now;

      // Restart YouTube monitoring when tab becomes active
      if (currentDomain.includes("youtube.com")) {
        this.initializeYouTubeMonitoring();
      }
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

    // Initialize separate tracking for typing and deleting
    if (!this.typeDeleteHistory.has("typing")) {
      this.typeDeleteHistory.set("typing", []);
    }
    if (!this.typeDeleteHistory.has("deleting")) {
      this.typeDeleteHistory.set("deleting", []);
    }

    // Determine if this is a delete action
    const isDelete =
      event.inputType === "deleteContentBackward" ||
      event.inputType === "deleteContentForward" ||
      event.key === "Backspace" ||
      event.key === "Delete";

    // Get the appropriate action array
    const actionType = isDelete ? "deleting" : "typing";
    const actions = this.typeDeleteHistory.get(actionType);
    actions.push(now);

    // Get recent actions within the time window
    const recentTyping = this.typeDeleteHistory
      .get("typing")
      .filter((time) => now - time < config.timeWindow);
    const recentDeleting = this.typeDeleteHistory
      .get("deleting")
      .filter((time) => now - time < config.timeWindow);

    // Update the history with only recent actions
    this.typeDeleteHistory.set("typing", recentTyping);
    this.typeDeleteHistory.set("deleting", recentDeleting);

    // Check if we've hit both thresholds
    if (
      recentTyping.length >= config.actionThreshold &&
      recentDeleting.length >= config.deleteThreshold
    ) {
      // Calculate typing speed (actions per second)
      const totalActions = recentTyping.length + recentDeleting.length;
      const timeSpan =
        (Math.max(...recentTyping, ...recentDeleting) -
          Math.min(...recentTyping, ...recentDeleting)) /
        1000;
      const actionsPerSecond = totalActions / timeSpan;

      console.log("⌨️ Typing Pattern:", {
        typingCount: recentTyping.length,
        deletingCount: recentDeleting.length,
        timeWindow: config.timeWindow / 1000 + "s",
        actionsPerSecond: actionsPerSecond.toFixed(2),
      });

      this.triggerDetected(config, {
        typingCount: recentTyping.length,
        deletingCount: recentDeleting.length,
        actionsPerSecond: actionsPerSecond.toFixed(2),
        timeWindow: config.timeWindow / 1000,
      });
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

  // Initialize YouTube monitoring if on YouTube
  async initializeYouTubeMonitoring() {
    const currentDomain = window.location.hostname;
    if (currentDomain.includes("youtube.com")) {
      console.log("Initializing YouTube monitoring...");
      try {
        const youtubeTriggerUrl = chrome.runtime.getURL("youtubeTrigger.js");
        const { startYouTubeMonitoring, stopYouTubeMonitoring } = await import(
          youtubeTriggerUrl
        );
        this.youtubeMonitoring = {
          start: startYouTubeMonitoring,
          stop: stopYouTubeMonitoring,
        };
        this.youtubeMonitoring.start((trigger, data) =>
          this.triggerDetected(trigger, data)
        );
      } catch (error) {
        console.error("Error initializing YouTube monitoring:", error);
      }
    }
  }

  setupUrlChangeObserver() {
    // Create a MutationObserver to watch for URL changes
    const observer = new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== this.lastUrl) {
        console.log("🔄 URL changed:", currentUrl);
        this.lastUrl = currentUrl;
        this.checkForYouTubeShorts(currentUrl);
      }
    });

    // Start observing
    observer.observe(document, { subtree: true, childList: true });
  }

  checkForYouTubeShorts(url) {
    try {
      // Check if we're on YouTube
      if (!url.includes("youtube.com")) return;

      // Check if this is a shorts URL
      if (url.includes("/shorts/")) {
        console.log("🎬 YouTube Shorts detected!");
        const trigger = TRIGGER_CONFIG.YOUTUBE_SHORTS;

        // Get the shorts ID from the URL
        const shortsId = url.split("/shorts/")[1]?.split("?")[0] || "unknown";

        this.triggerDetected(trigger, {
          url: url,
          shortsId: shortsId,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (error) {
      console.error("Error checking for YouTube Shorts:", error);
    }
  }
}

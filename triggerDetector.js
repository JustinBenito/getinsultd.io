import { TRIGGER_CONFIG } from "./triggers.js";

class TriggerDetector {
  constructor() {
    // Initialize tracking data
    this.scrollEvents = new Map();
    this.tabHistory = new Map();
    this.typeDeleteHistory = new Map();
    this.hoverHistory = new Map();
    this.tabSwitches = [];
    this.siteVisits = new Map();
    this.activeTabStartTime = Date.now();
    this.lastProductiveTab = null;
    this.activeTriggers = new Set();
    this.callbacks = new Map();

    // Initialize listeners
    this.initializeListeners();
  }

  // Initialize all event listeners
  initializeListeners() {
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

    // Mouse hover detection
    document.addEventListener(
      "mouseover",
      this.debounce(this.handleHover.bind(this), 100)
    );

    // Typing detection
    document.addEventListener(
      "input",
      this.debounce(this.handleTyping.bind(this), 100)
    );

    // Clean up old data periodically
    setInterval(this.cleanupOldData.bind(this), 60000);
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
      this.checkDurationTriggers(currentDomain, now - this.activeTabStartTime);
    } else {
      // Tab became active
      this.activeTabStartTime = now;
      this.checkTabLooping(currentDomain);
      this.checkRewardSwitching(currentDomain);
    }
  }

  // Check duration-based triggers
  checkDurationTriggers(domain, duration) {
    const triggers = Object.values(TRIGGER_CONFIG).filter(
      (t) => t.type === "duration" && t.domains.includes(domain)
    );

    for (const trigger of triggers) {
      if (duration >= trigger.timeThreshold) {
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

  // Check reward-based switching
  checkRewardSwitching(currentDomain) {
    const config = TRIGGER_CONFIG.REWARD_SWITCHING;
    const now = Date.now();

    if (
      config.productiveApps.includes(this.lastProductiveTab) &&
      config.rewardApps.includes(currentDomain)
    ) {
      this.triggerDetected(config, {
        from: this.lastProductiveTab,
        to: currentDomain,
      });
    }

    if (config.productiveApps.includes(currentDomain)) {
      this.lastProductiveTab = currentDomain;
    }
  }

  // Handle hover events
  handleHover(event) {
    const config = TRIGGER_CONFIG.HOVER_WITHOUT_ACTION;
    const now = Date.now();

    if (!this.hoverHistory.has("tabs")) {
      this.hoverHistory.set("tabs", []);
    }

    const hovers = this.hoverHistory.get("tabs");
    hovers.push(now);

    const recentHovers = hovers.filter(
      (time) => now - time < config.timeWindow
    );
    if (recentHovers.length >= config.hoverThreshold) {
      this.triggerDetected(config, { hoverCount: recentHovers.length });
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
    }, 5 * 60 * 1000); // 5 minutes cooldown
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

    // Clean up hover history
    this.hoverHistory.forEach((hovers, key) => {
      this.hoverHistory.set(
        key,
        hovers.filter((time) => now - time < ONE_HOUR)
      );
    });
  }
}

export { TriggerDetector };

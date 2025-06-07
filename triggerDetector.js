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
    this.productiveActionCount = 0;
    this.hasFirstTabBeenChecked = false;

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

    // Initialize distraction tracking
    this.initializeDistractionTracking();

    // Track current tab for proper closure detection
    this.currentTab = null;
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

      // Check for productive duration
      if (
        timeSinceLastActive >= TRIGGER_CONFIG.PRODUCTIVE_DURATION.timeThreshold
      ) {
        const productiveDurationTrigger = TRIGGER_CONFIG.PRODUCTIVE_DURATION;
        if (
          productiveDurationTrigger.domains.some((d) =>
            this.domainMatches(currentDomain, d)
          )
        ) {
          this.triggerDetected(productiveDurationTrigger, {
            domain: currentDomain,
            duration: timeSinceLastActive,
          });
        }
      }

      // Check for distraction-free period
      const distractionFreeTrigger = TRIGGER_CONFIG.DISTRACTION_FREE;
      if (timeSinceLastActive >= distractionFreeTrigger.timeThreshold) {
        const hasVisitedDistractions = distractionFreeTrigger.domains.some(
          (d) =>
            this.tabHistory.has(d) &&
            now - this.tabHistory.get(d) < distractionFreeTrigger.timeThreshold
        );

        if (!hasVisitedDistractions) {
          this.triggerDetected(distractionFreeTrigger, {
            duration: timeSinceLastActive,
          });
        }
      }

      // Restart YouTube monitoring when tab becomes active
      if (currentDomain.includes("youtube.com")) {
        this.initializeYouTubeMonitoring();
      }
    }
  }

  // Helper function to check if domain matches any in the list
  domainMatches(domain, pattern) {
    // Remove www. and normalize both domain and pattern
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, "");
    const normalizedPattern = pattern.toLowerCase().replace(/^www\./, "");

    // Check if the domain includes the pattern or vice versa
    return (
      normalizedDomain.includes(normalizedPattern) ||
      normalizedPattern.includes(normalizedDomain)
    );
  }

  // Check duration-based triggers
  checkDurationTriggers(domain, duration) {
    console.log("🕒 Checking duration triggers:", {
      domain,
      duration: Math.floor(duration / 1000) + "s",
      timestamp: new Date().toLocaleTimeString(),
    });

    // Get all duration and instant type triggers
    const triggers = Object.values(TRIGGER_CONFIG).filter(
      (t) =>
        (t.type === "duration" || t.type === "instant") &&
        t.domains?.some((d) => this.domainMatches(domain, d))
    );

    console.log(
      "📍 Found matching triggers:",
      triggers.map((t) => t.name)
    );

    for (const trigger of triggers) {
      // For instant triggers, trigger immediately
      if (trigger.type === "instant") {
        console.log("⚡ Instant trigger activated:", trigger.name);
        this.triggerDetected(trigger, { domain });
        continue;
      }

      // For duration triggers, check threshold
      console.log("⏱️ Checking duration trigger:", {
        trigger: trigger.name,
        threshold: Math.floor(trigger.timeThreshold / 1000) + "s",
        currentDuration: Math.floor(duration / 1000) + "s",
      });

      if (duration >= trigger.timeThreshold) {
        console.log("🎯 Trigger threshold met for:", trigger.name);
        this.triggerDetected(trigger, {
          duration,
          domain,
          threshold: trigger.timeThreshold,
        });
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
    const tab = await this.getTabInfo(activeInfo.tabId);
    if (!tab || !tab.url) return;

    // Update current tab reference
    this.currentTab = tab;

    try {
      const currentDomain = new URL(tab.url).hostname;
      const now = Date.now();
      const state = this.getDistractionState();

      // Check if current site is a distraction
      const isDistraction = this.isDistractionDomain(currentDomain);
      console.log("Tab activated:", { currentDomain, isDistraction });

      if (isDistraction) {
        console.log("🚫 Distraction site visited:", currentDomain);
        // Reset the distraction-free period
        this.updateDistractionState({
          distractionFreeStartTime: now,
          lastDistractionTime: now,
          isCurrentlyOnDistraction: true,
        });
      } else {
        // If coming from a distraction site, reset the timer
        if (state.isCurrentlyOnDistraction) {
          this.updateDistractionState({
            distractionFreeStartTime: now,
            isCurrentlyOnDistraction: false,
          });
          return; // Don't check for streak yet, we just started
        }

        // If not a distraction site, check how long we've been distraction-free
        const timeSinceLastDistraction = now - state.distractionFreeStartTime;

        console.log(
          "Time since last distraction (minutes):",
          Math.floor(timeSinceLastDistraction / (1000 * 60))
        );

        // If it's been 10 minutes since last distraction
        if (timeSinceLastDistraction >= 10 * 60 * 1000) {
          // 10 minutes
          const lastTriggerTime = state.lastTriggerTimes?.distraction_free || 0;
          const timeSinceLastTrigger = now - lastTriggerTime;

          // Only trigger if we haven't triggered in the last 10 minutes
          if (timeSinceLastTrigger >= 10 * 60 * 1000) {
            console.log("✨ Triggering distraction-free celebration");

            this.updateDistractionState({
              lastTriggerTimes: {
                ...state.lastTriggerTimes,
                distraction_free: now,
              },
            });

            this.triggerDetected(TRIGGER_CONFIG.DISTRACTION_FREE, {
              timeSinceLastDistraction: Math.floor(
                timeSinceLastDistraction / (1000 * 60)
              ),
            });
          }
        }
      }

      // Check for morning productivity with strict conditions
      const currentHour = new Date().getHours();
      const morningSurgeTrigger = TRIGGER_CONFIG.MORNING_SURGE;

      console.log("Morning Productivity Check:", {
        currentHour,
        currentDomain,
        morningHourLimit: morningSurgeTrigger.morningHourLimit,
        requiresMorningHours: morningSurgeTrigger.requiresMorningHours,
        isProductiveDomain: morningSurgeTrigger.domains.some((d) =>
          this.domainMatches(currentDomain, d)
        ),
      });

      // Only proceed with morning surge if ALL conditions are met
      if (
        morningSurgeTrigger.requiresMorningHours &&
        currentHour < morningSurgeTrigger.morningHourLimit &&
        morningSurgeTrigger.domains.some((d) =>
          this.domainMatches(currentDomain, d)
        )
      ) {
        console.log("✅ All morning productivity conditions met:", {
          currentHour,
          hourLimit: morningSurgeTrigger.morningHourLimit,
          domain: currentDomain,
        });
        this.triggerDetected(morningSurgeTrigger, {
          domain: currentDomain,
          hour: currentHour,
        });
      } else {
        console.log("❌ Morning productivity conditions not met:", {
          isBeforeLimit: currentHour < morningSurgeTrigger.morningHourLimit,
          requiresMorningHours: morningSurgeTrigger.requiresMorningHours,
          isProductiveDomain: morningSurgeTrigger.domains.some((d) =>
            this.domainMatches(currentDomain, d)
          ),
        });
      }

      // Check for productive website visit
      const productiveWebsiteTrigger = TRIGGER_CONFIG.PRODUCTIVE_WEBSITE;
      if (
        productiveWebsiteTrigger.domains.some((d) =>
          this.domainMatches(currentDomain, d)
        )
      ) {
        this.triggerDetected(productiveWebsiteTrigger, {
          domain: currentDomain,
        });
        this.incrementProductiveActions();
      }

      // Check for work document
      const workDocTrigger = TRIGGER_CONFIG.WORK_DOCUMENT;
      if (
        workDocTrigger.domains.some((d) => this.domainMatches(currentDomain, d))
      ) {
        this.triggerDetected(workDocTrigger, { domain: currentDomain });
        this.incrementProductiveActions();
      }

      // Check Google search
      if (currentDomain.includes("google.com")) {
        const searchParams = new URL(tab.url).searchParams;
        const query = searchParams.get("q");
        if (query) {
          const productiveSearchTrigger = TRIGGER_CONFIG.PRODUCTIVE_SEARCH;
          if (
            productiveSearchTrigger.keywords.some((k) =>
              query.toLowerCase().includes(k)
            )
          ) {
            this.triggerDetected(productiveSearchTrigger, { query });
            this.incrementProductiveActions();
          }
        }
      }

      // Continue with existing tab change logic
      await this.checkRewardSwitching(currentDomain, timeSinceLastDistraction);
    } catch (error) {
      console.error("Error handling tab activation:", error);
    }
  }

  // Handle tab URL updates
  async handleTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status === "complete" && tab.url) {
      // Update current tab reference if it's the active tab
      if (this.currentTab && this.currentTab.id === tabId) {
        this.currentTab = tab;

        try {
          const domain = new URL(tab.url).hostname;
          const isDistraction = this.isDistractionDomain(domain);
          const state = this.getDistractionState();

          if (isDistraction && !state.isCurrentlyOnDistraction) {
            console.log("🚫 Distraction site loaded:", domain);
            // Reset the distraction-free period
            this.updateDistractionState({
              distractionFreeStartTime: Date.now(),
              lastDistractionTime: Date.now(),
              isCurrentlyOnDistraction: true,
            });
          } else if (!isDistraction && state.isCurrentlyOnDistraction) {
            // Transitioning from distraction to non-distraction
            this.updateDistractionState({
              distractionFreeStartTime: Date.now(),
              isCurrentlyOnDistraction: false,
            });
          }
        } catch (error) {
          console.error("Error checking updated tab URL:", error);
        }
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

    // Initialize tracking arrays if they don't exist
    if (!this.typeDeleteHistory.has("typing")) {
      this.typeDeleteHistory.set("typing", []);
    }
    if (!this.typeDeleteHistory.has("deleting")) {
      this.typeDeleteHistory.set("deleting", []);
    }
    if (!this.typeDeleteHistory.has("patterns")) {
      this.typeDeleteHistory.set("patterns", []);
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

    // Check if we've hit the thresholds for a single pattern
    if (
      recentTyping.length >= config.actionThreshold &&
      recentDeleting.length >= config.deleteThreshold
    ) {
      // Get the patterns array and clean old patterns
      const patterns = this.typeDeleteHistory
        .get("patterns")
        .filter((pattern) => now - pattern.timestamp < config.patternWindow);

      // Add this pattern
      patterns.push({
        timestamp: now,
        typingCount: recentTyping.length,
        deletingCount: recentDeleting.length,
      });

      // Update patterns array
      this.typeDeleteHistory.set("patterns", patterns);

      // Calculate typing speed for this pattern
      const totalActions = recentTyping.length + recentDeleting.length;
      const timeSpan =
        (Math.max(...recentTyping, ...recentDeleting) -
          Math.min(...recentTyping, ...recentDeleting)) /
        1000;
      const actionsPerSecond = totalActions / timeSpan;

      console.log("⌨️ Typing Pattern Detected:", {
        patternCount: patterns.length,
        requiredPatterns: config.patternRepetitions,
        typingCount: recentTyping.length,
        deletingCount: recentDeleting.length,
        timeWindow: config.timeWindow / 1000 + "s",
        actionsPerSecond: actionsPerSecond.toFixed(2),
      });

      // Clear the current pattern's actions to prepare for next pattern
      this.typeDeleteHistory.set("typing", []);
      this.typeDeleteHistory.set("deleting", []);

      // Check if we've seen enough patterns
      if (patterns.length >= config.patternRepetitions) {
        console.log("🎯 Multiple Erratic Typing Patterns Detected!", {
          patternCount: patterns.length,
          timeSpan: (now - patterns[0].timestamp) / 1000 + "s",
        });

        this.triggerDetected(config, {
          patternCount: patterns.length,
          totalTyping: patterns.reduce((sum, p) => sum + p.typingCount, 0),
          totalDeleting: patterns.reduce((sum, p) => sum + p.deletingCount, 0),
          timeSpan: (now - patterns[0].timestamp) / 1000,
          actionsPerSecond: actionsPerSecond.toFixed(2),
        });

        // Clear patterns after triggering
        this.typeDeleteHistory.set("patterns", []);
      }
    }
  }

  // Check for non-educational YouTube content
  checkYouTubeContent() {
    const videoTitle = document.querySelector(
      "h1.ytd-video-primary-info-renderer"
    )?.textContent;
    if (videoTitle) {
      const productiveYouTubeTrigger = TRIGGER_CONFIG.PRODUCTIVE_YOUTUBE;
      if (
        productiveYouTubeTrigger.keywords.some((k) =>
          videoTitle.toLowerCase().includes(k)
        )
      ) {
        this.triggerDetected(productiveYouTubeTrigger, { title: videoTitle });
        this.incrementProductiveActions();
      }
    }
  }

  // Trigger detection handler
  triggerDetected(trigger, data) {
    // Special validation for morning surge trigger
    if (trigger.id === "morning_surge") {
      const currentHour = new Date().getHours();
      if (currentHour >= trigger.morningHourLimit) {
        console.log(
          "🚫 Blocked morning surge trigger outside morning hours:",
          currentHour
        );
        return; // Don't trigger if not morning hours
      }
    }

    console.log(`🎯 Trigger detected: ${trigger.name}`, {
      triggerId: trigger.id,
      triggerData: data,
      timestamp: new Date().toLocaleTimeString(),
    });

    // Notify all registered callbacks
    this.notifyCallbacks(trigger, data);
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
    // Check every minute for distraction-free status
    setInterval(() => {
      if (!this.currentTab) return;

      try {
        const now = Date.now();
        const state = this.getDistractionState();
        const currentDomain = new URL(this.currentTab.url).hostname;

        // Only check if current tab is not a distraction site
        if (
          !this.isDistractionDomain(currentDomain) &&
          !state.isCurrentlyOnDistraction
        ) {
          const timeSinceLastDistraction = now - state.distractionFreeStartTime;

          // If it's been 10 minutes since last distraction
          if (timeSinceLastDistraction >= 10 * 60 * 1000) {
            const lastTriggerTime =
              state.lastTriggerTimes?.distraction_free || 0;
            const timeSinceLastTrigger = now - lastTriggerTime;

            // Only trigger if we haven't triggered in the last 10 minutes
            if (timeSinceLastTrigger >= 10 * 60 * 1000) {
              this.triggerDetected(TRIGGER_CONFIG.DISTRACTION_FREE, {
                timeSinceLastDistraction: Math.floor(
                  timeSinceLastDistraction / (1000 * 60)
                ),
              });

              this.updateDistractionState({
                lastTriggerTimes: {
                  ...state.lastTriggerTimes,
                  distraction_free: now,
                },
              });
            }
          }
        }
      } catch (error) {
        console.error("Error in periodic check:", error);
      }
    }, 60000); // Check every minute

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

  incrementProductiveActions() {
    this.productiveActionCount++;
    const streakTrigger = TRIGGER_CONFIG.PRODUCTIVE_STREAK;
    if (this.productiveActionCount >= streakTrigger.threshold) {
      this.triggerDetected(streakTrigger, {
        count: this.productiveActionCount,
      });
      if (streakTrigger.resetOnThreshold) {
        this.productiveActionCount = 0;
      }
    }
  }

  // Add helper method for getting tab info
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

  initializeDistractionTracking() {
    // Initialize tracking state in session storage
    const now = Date.now();
    if (!sessionStorage.getItem("distractionState")) {
      sessionStorage.setItem(
        "distractionState",
        JSON.stringify({
          lastDistractionTime: now,
          distractionFreeStartTime: now,
          closedDistractions: [],
          lastTriggerTimes: {},
          isCurrentlyOnDistraction: false,
        })
      );
    }
  }

  getDistractionState() {
    return JSON.parse(sessionStorage.getItem("distractionState"));
  }

  updateDistractionState(updates) {
    const currentState = this.getDistractionState();
    const newState = { ...currentState, ...updates };
    sessionStorage.setItem("distractionState", JSON.stringify(newState));
    return newState;
  }

  async handleTabClose(tabId) {
    // Only handle tab close if we have a record of the tab that's being closed
    if (!this.currentTab || this.currentTab.id !== tabId) {
      console.log("Tab close ignored - not current tab:", tabId);
      return;
    }

    try {
      const url = new URL(this.currentTab.url);
      const domain = url.hostname;
      const state = this.getDistractionState();

      // Check if it's a distraction domain
      if (this.isDistractionDomain(domain)) {
        console.log("🎯 Checking distraction site closure:", domain);

        // Only celebrate if:
        // 1. We haven't celebrated this domain before
        // 2. We're currently on a distraction site
        // 3. Haven't triggered recently
        if (
          !state.closedDistractions.includes(domain) &&
          state.isCurrentlyOnDistraction
        ) {
          console.log("✨ New distraction site closed:", domain);

          // Update state
          this.updateDistractionState({
            closedDistractions: [...state.closedDistractions, domain],
            lastTriggerTimes: {
              ...state.lastTriggerTimes,
              closed_distraction: Date.now(),
            },
          });

          // Trigger the celebration
          this.triggerDetected(TRIGGER_CONFIG.CLOSED_DISTRACTION, {
            domain: domain,
            timestamp: Date.now(),
          });
        } else {
          console.log("Skipping distraction closure trigger:", {
            alreadyCelebrated: state.closedDistractions.includes(domain),
            isOnDistraction: state.isCurrentlyOnDistraction,
          });
        }
      }
    } catch (error) {
      console.error("Error handling tab close:", error);
    }

    // Clear current tab reference
    this.currentTab = null;
  }

  isDistractionDomain(domain) {
    const distractionDomains = [
      "instagram.com",
      "twitter.com",
      "netflix.com",
      "facebook.com",
      "tiktok.com",
      "reddit.com",
    ];

    return distractionDomains.some((d) => domain.includes(d));
  }
}

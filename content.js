// Import trigger detector
let triggerDetector;

async function initializeModules() {
  try {
    console.log("Initializing modules...");
    const triggerConfigUrl = chrome.runtime.getURL("triggers.js");
    const triggerDetectorUrl = chrome.runtime.getURL("triggerDetector.js");
    const confettiUrl = chrome.runtime.getURL("canvas-confetti.js");

    console.log("Loading from URLs:", {
      triggerConfigUrl,
      triggerDetectorUrl,
      confettiUrl,
    });

    // Import modules
    const { TriggerDetector } = await import(triggerDetectorUrl);
    const { fireCelebrationConfetti } = await import(confettiUrl);

    console.log("TriggerDetector loaded:", TriggerDetector);

    // Initialize after modules are loaded
    await initializeTriggerDetector(TriggerDetector);
    addFloatingEmoji(fireCelebrationConfetti);
  } catch (error) {
    console.error("Error initializing modules:", error);
  }
}

// Track website visit data
let startTime = Date.now();
let isStatsBubbleVisible = false;
let retryCount = 0;
const MAX_RETRIES = 5;
let storageUpdateInterval;
let lastStorageUpdate = Date.now();
let containerFindAttempts = 0;
const MAX_CONTAINER_FIND_ATTEMPTS = 10;
let triggerBubble = null;

// Function to check if we're on ChatGPT
function isChatGPT() {
  return (
    window.location.hostname.includes("chat.openai.com") ||
    window.location.hostname.includes("chatgpt.com")
  );
}

// Function to check if we're on YouTube
function isYouTube() {
  return window.location.hostname.includes("youtube.com");
}

// Function to check if extension context is valid
function isExtensionContextValid() {
  try {
    // Try to access chrome.runtime.id which throws if context is invalid
    return Boolean(chrome.runtime && chrome.runtime.id);
  } catch (e) {
    return false;
  }
}

// Function to safely find DOM elements
function safeDOMQuery(selector, context = document) {
  try {
    return context.querySelector(selector);
  } catch (e) {
    console.warn(`Error finding element ${selector}:`, e);
    return null;
  }
}

// Function to find suitable container for ChatGPT with retry
function findChatGPTContainer() {
  if (containerFindAttempts >= MAX_CONTAINER_FIND_ATTEMPTS) {
    console.warn("Max container find attempts reached, falling back to body");
    return document.body;
  }

  try {
    // Try different possible containers in order of preference
    const containerSelectors = [
      // ChatGPT main content area
      "#__next > div > div.flex > div.flex",
      // Main content
      "main",
      // Root app container
      "#__next",
      // Common div patterns in ChatGPT
      ".flex-1.overflow-hidden",
      ".flex.flex-1.flex-col",
      // Fallback containers
      "#root",
      ".main-content",
      "body",
    ];

    for (const selector of containerSelectors) {
      const container = safeDOMQuery(selector);
      if (container) {
        // Verify the container is actually in the document
        if (document.contains(container)) {
          containerFindAttempts = 0; // Reset attempts on success
          return container;
        }
      }
    }

    // If no suitable container found, increment attempts and try again
    containerFindAttempts++;

    if (containerFindAttempts < MAX_CONTAINER_FIND_ATTEMPTS) {
      // Try again after a short delay
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(findChatGPTContainer());
        }, 500);
      });
    }

    // Fallback to body if all attempts failed
    console.warn("No suitable container found, falling back to body");
    return document.body;
  } catch (e) {
    console.warn("Error finding container:", e);
    return document.body;
  }
}

// Function to safely execute chrome API calls with retry
async function safeExecuteChromeAPI(operation, maxRetries = 3) {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      if (!isExtensionContextValid()) {
        console.warn("Extension context invalid, cleaning up...");
        cleanupAndRemoveListeners();
        return null;
      }

      return await operation();
    } catch (error) {
      attempts++;

      if (error.message.includes("Extension context invalidated")) {
        console.warn("Extension context invalidated, cleaning up...");
        cleanupAndRemoveListeners();
        return null;
      }

      if (attempts === maxRetries) {
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
    }
  }
}

// Function to safely add elements to the DOM
async function safelyAddElementToDOM(element, container) {
  try {
    if (!document.contains(container)) {
      throw new Error("Container is not in document");
    }

    // Check if element is already in DOM
    if (element.parentNode === container) {
      return true;
    }

    // Remove element if it exists elsewhere in DOM
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }

    // Add element to container
    container.appendChild(element);
    return true;
  } catch (e) {
    console.warn("Error adding element to DOM:", e);
    return false;
  }
}

// Function to format time duration
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Function to get website metadata
function getWebsiteMetadata() {
  const metadata = {
    title: document.title || "Unknown Title",
    description: "",
    url: window.location.href,
    hostname: window.location.hostname,
    favicon: "",
  };

  // Try to get description
  const metaDescription =
    document.querySelector('meta[name="description"]') ||
    document.querySelector('meta[property="og:description"]');
  metadata.description = metaDescription
    ? metaDescription.content
    : "No description available";

  // Try to get favicon
  const faviconLink =
    document.querySelector('link[rel="icon"]') ||
    document.querySelector('link[rel="shortcut icon"]');
  metadata.favicon = faviconLink ? faviconLink.href : "";

  return metadata;
}

// Function to update storage with visit data
async function updateVisitData(force = false) {
  // Only update if forced or if it's been more than 5 seconds since last update
  if (!force && Date.now() - lastStorageUpdate < 5000) {
    return;
  }

  const currentUrl = window.location.hostname;
  const metadata = getWebsiteMetadata();

  await safeExecuteChromeAPI(async () => {
    const data = await chrome.storage.local.get(currentUrl);
    const existingData = data[currentUrl] || {
      totalTime: 0,
      visits: 0,
      lastVisit: null,
      metadata: metadata,
    };

    const newData = {
      [currentUrl]: {
        totalTime: existingData.totalTime + (Date.now() - startTime),
        visits: existingData.visits + 1,
        lastVisit: new Date().toISOString(),
        metadata: metadata,
      },
    };

    await chrome.storage.local.set(newData);
    lastStorageUpdate = Date.now();
  });
}

// Function to create stats bubble
function createStatsBubble() {
  const bubble = document.createElement("div");
  bubble.className = "stats-bubble";
  return bubble;
}

// Function to sort websites by total time
function sortWebsitesByTime(sites) {
  return Object.entries(sites).sort((a, b) => {
    const totalTimeA =
      a[1].totalTime +
      (a[0] === window.location.hostname ? Date.now() - startTime : 0);
    const totalTimeB =
      b[1].totalTime +
      (b[0] === window.location.hostname ? Date.now() - startTime : 0);
    return totalTimeB - totalTimeA;
  });
}

// Function to update stats display
async function updateStatsBubble(bubble) {
  try {
    console.log("Updating stats bubble...");
    const data = await safeExecuteChromeAPI(() =>
      chrome.storage.local.get(null)
    );
    console.log("Retrieved storage data:", data);

    if (!data) {
      console.warn("No data available in storage");
      bubble.innerHTML = "<h3>Statistics Unavailable</h3>";
      return;
    }

    const sortedSites = sortWebsitesByTime(data);
    console.log("Sorted sites:", sortedSites);

    let html = "<h3>All Websites Statistics</h3>";

    for (const [hostname, siteData] of sortedSites) {
      const isCurrentSite = hostname === window.location.hostname;
      const currentSessionTime = isCurrentSite ? Date.now() - startTime : 0;
      const totalTime = siteData.totalTime + currentSessionTime;

      console.log("Processing site:", {
        hostname,
        isCurrentSite,
        currentSessionTime,
        totalTime,
        metadata: siteData.metadata,
      });

      html += `
        <div class="website-stats-item ${isCurrentSite ? "current-site" : ""}">
          <div class="website-title">${
            siteData.metadata?.title || hostname
          }</div>
          <div class="website-url">${hostname}</div>
          <div class="stats-details">
            <span>Visits: ${siteData.visits}${
        isCurrentSite ? " (Current)" : ""
      }</span>
            <span class="time">${formatDuration(totalTime)}</span>
          </div>
        </div>
      `;
    }

    bubble.innerHTML = html;
  } catch (error) {
    console.error("Error updating stats bubble:", error);
    console.error("Error stack:", error.stack);
    bubble.innerHTML = `<h3>Error loading statistics</h3><p>${error.message}</p>`;
  }
}

// Function to cleanup intervals and listeners
function cleanupAndRemoveListeners() {
  if (storageUpdateInterval) {
    clearInterval(storageUpdateInterval);
  }

  // Remove the observer if it exists
  if (window.statsObserver) {
    window.statsObserver.disconnect();
  }

  // Remove existing elements
  const existingEmoji = document.querySelector(".floating-emoji");
  const existingBubble = document.querySelector(".stats-bubble");
  if (existingEmoji) existingEmoji.remove();
  if (existingBubble) existingBubble.remove();
}

// Initialize trigger detector
async function initializeTriggerDetector(TriggerDetector) {
  try {
    console.log("Initializing TriggerDetector...");
    triggerDetector = new TriggerDetector();
    triggerDetector.onTrigger((trigger, data) => {
      showTriggerNotification(trigger, data);
    });
    console.log("TriggerDetector initialized successfully");
  } catch (error) {
    console.error("Error initializing TriggerDetector:", error);
  }
}

// Function to create and show trigger notification
function showTriggerNotification(trigger, data) {
  console.log("Showing trigger notification:", { trigger, data });
  if (triggerBubble) {
    triggerBubble.remove();
  }

  triggerBubble = document.createElement("div");
  triggerBubble.className = "trigger-bubble";

  const content = document.createElement("div");
  content.className = "trigger-content";

  const header = document.createElement("div");
  header.className = "trigger-header";
  header.innerHTML = `
    <h3>${trigger.name}</h3>
    <span class="close-trigger">×</span>
  `;

  const body = document.createElement("div");
  body.className = "trigger-body";

  // Format trigger-specific data
  let detailsHtml = `<p>${trigger.description}</p>`;

  switch (trigger.type) {
    case "duration":
      detailsHtml += `<p>Time spent: ${formatDuration(data.duration)}</p>`;
      break;
    case "behavior":
      if (data.scrollCount) {
        detailsHtml += `<p>Scroll count: ${data.scrollCount}</p>`;
      }
      if (data.visits) {
        detailsHtml += `<p>Repeated visits: ${data.visits}</p>`;
      }
      if (data.from && data.to) {
        detailsHtml += `<p>Switched from: ${data.from}<br>To: ${data.to}</p>`;
      }
      break;
    case "content":
      detailsHtml += `<p>Current content: ${data.title || "N/A"}</p>`;
      break;
  }

  body.innerHTML = detailsHtml;

  content.appendChild(header);
  content.appendChild(body);
  triggerBubble.appendChild(content);

  // Add styles
  const styles = document.createElement("style");
  styles.textContent = `
    .trigger-bubble {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 300px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999997;
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      pointer-events: auto !important;
    }
    
    .trigger-bubble.visible {
      opacity: 1;
      transform: translateY(0);
    }
    
    .trigger-content {
      padding: 16px;
    }
    
    .trigger-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .trigger-header h3 {
      margin: 0;
      color: #e74c3c;
      font-size: 16px;
    }
    
    .close-trigger {
      cursor: pointer;
      font-size: 20px;
      color: #666;
      padding: 4px;
    }
    
    .trigger-body {
      font-size: 14px;
      color: #666;
    }
    
    .trigger-body p {
      margin: 8px 0;
    }
  `;

  document.head.appendChild(styles);
  document.body.appendChild(triggerBubble);

  // Add close button handler
  const closeButton = triggerBubble.querySelector(".close-trigger");
  closeButton.addEventListener("click", () => {
    triggerBubble.classList.remove("visible");
    setTimeout(() => triggerBubble.remove(), 300);
  });

  // Show the bubble with animation
  requestAnimationFrame(() => {
    triggerBubble.classList.add("visible");
  });

  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (triggerBubble && triggerBubble.parentNode) {
      triggerBubble.classList.remove("visible");
      setTimeout(() => {
        if (triggerBubble && triggerBubble.parentNode) {
          triggerBubble.remove();
        }
      }, 300);
    }
  }, 10000);
}

// Function to check if extension storage is accessible
async function checkStorageAccess() {
  try {
    await chrome.storage.local.get(null);
    return true;
  } catch (error) {
    console.error("Storage access error:", error);
    return false;
  }
}

// Function to initialize storage if empty
async function initializeStorageIfNeeded() {
  try {
    const data = await chrome.storage.local.get(null);
    if (!data || Object.keys(data).length === 0) {
      console.log("Initializing empty storage...");
      const currentDomain = window.location.hostname;
      const initialData = {
        [currentDomain]: {
          totalTime: 0,
          visits: 1,
          lastVisit: new Date().toISOString(),
          metadata: getWebsiteMetadata(),
        },
      };
      await chrome.storage.local.set(initialData);
      console.log("Storage initialized with:", initialData);
    }
  } catch (error) {
    console.error("Error initializing storage:", error);
  }
}

// Function to add the emoji element with retry mechanism
async function addFloatingEmoji(fireCelebrationConfetti) {
  if (!isExtensionContextValid()) {
    console.warn("Extension context invalid, not adding emoji");
    return;
  }

  try {
    // Check storage access
    if (!(await checkStorageAccess())) {
      console.error("Cannot access extension storage");
      return;
    }

    // Initialize storage if needed
    await initializeStorageIfNeeded();

    // Initialize trigger detector if not already initialized
    if (!triggerDetector) {
      initializeTriggerDetector();
    }

    // Remove existing elements
    const existingEmoji = safeDOMQuery(".floating-emoji");
    const existingBubble = safeDOMQuery(".stats-bubble");
    if (existingEmoji) existingEmoji.remove();
    if (existingBubble) existingBubble.remove();

    // Create new elements
    const floatingEmoji = document.createElement("div");
    floatingEmoji.className = "floating-emoji";
    floatingEmoji.innerHTML = "😊";

    const statsBubble = createStatsBubble();

    // Get appropriate container
    let targetNode;
    if (isChatGPT()) {
      targetNode = await findChatGPTContainer();
    } else {
      targetNode = document.body;
    }

    // Safely add elements to DOM
    if (
      !targetNode ||
      !(await safelyAddElementToDOM(floatingEmoji, targetNode)) ||
      !(await safelyAddElementToDOM(statsBubble, targetNode))
    ) {
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        setTimeout(() => addFloatingEmoji(fireCelebrationConfetti), 1000);
        return;
      }
      throw new Error("Failed to add elements to DOM");
    }

    // Reset retry count on success
    retryCount = 0;

    // Toggle border and stats state
    let isBorderActive = false;

    // Add click event listener
    floatingEmoji.addEventListener("click", async (e) => {
      e.stopPropagation(); // Prevent event bubbling

      if (!isExtensionContextValid()) {
        alert("Extension needs to be reloaded. Please refresh the page.");
        return;
      }

      // Fire confetti celebration
      fireCelebrationConfetti();

      isBorderActive = !isBorderActive;
      isStatsBubbleVisible = !isStatsBubbleVisible;

      if (isBorderActive) {
        if (isChatGPT()) {
          const mainContent = await findChatGPTContainer();
          if (mainContent) {
            mainContent.style.border = "8px solid #4CAF50";
          }
        } else if (isYouTube()) {
          document.documentElement.classList.add("webpage-border");
          const app = document.querySelector("ytd-app");
          if (app) {
            app.style.border = "8px solid #4CAF50";
          }
        } else {
          document.body.classList.add("webpage-border");
        }
      } else {
        if (isChatGPT()) {
          const mainContent = await findChatGPTContainer();
          if (mainContent) {
            mainContent.style.border = "none";
          }
        } else if (isYouTube()) {
          document.documentElement.classList.remove("webpage-border");
          const app = document.querySelector("ytd-app");
          if (app) {
            app.style.border = "none";
          }
        } else {
          document.body.classList.remove("webpage-border");
        }
      }

      // Toggle stats bubble
      if (isStatsBubbleVisible) {
        await updateStatsBubble(statsBubble);
        statsBubble.classList.add("visible");
      } else {
        statsBubble.classList.remove("visible");
      }
    });

    // Set up intervals
    if (storageUpdateInterval) {
      clearInterval(storageUpdateInterval);
    }

    storageUpdateInterval = setInterval(() => {
      if (isExtensionContextValid()) {
        updateVisitData();
      } else {
        cleanupAndRemoveListeners();
      }
    }, 30000);

    // Update stats every minute if visible
    setInterval(() => {
      if (isStatsBubbleVisible && isExtensionContextValid()) {
        updateStatsBubble(statsBubble);
      }
    }, 60000);
  } catch (error) {
    console.error("Error in addFloatingEmoji:", error);
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      setTimeout(() => addFloatingEmoji(fireCelebrationConfetti), 1000);
    }
  }
}

// Move the initial call inside an async function
async function initialize() {
  console.log("Starting initialization...");
  await initializeModules();
  console.log("Initialization complete");
}

initialize();

// Create MutationObserver for dynamic content
const observer = new MutationObserver((mutations) => {
  if (!isExtensionContextValid()) {
    cleanupAndRemoveListeners();
    return;
  }

  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      if (!document.querySelector(".floating-emoji")) {
        addFloatingEmoji();
      }
    }
  }
});

// Store observer reference for cleanup
window.statsObserver = observer;

// Observe different parts of the page depending on the site
if (isChatGPT() || isYouTube()) {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Update storage when leaving the page
window.addEventListener("beforeunload", () => {
  if (isExtensionContextValid()) {
    updateVisitData(true);
  }
});

// Create and append the confetti container
const confettiContainer = document.createElement("div");
confettiContainer.id = "confetti-container";
confettiContainer.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 999999;
`;
document.body.appendChild(confettiContainer);

// Function to add temporary border effect
function showBorderEffect(duration = 3000) {
  document.body.style.transition = "outline 0.3s ease-in-out";
  document.body.style.outline = "3px solid #4CAF50";

  setTimeout(() => {
    document.body.style.outline = "none";
  }, duration);
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SHOW_BORDER_EFFECT") {
    showBorderEffect(message.duration);
  }
});

// Check if productivity triggers are initialized
chrome.runtime.sendMessage({ type: "GET_PRODUCTIVITY_STATUS" }, (response) => {
  if (response && response.isInitialized) {
    console.log("Productivity triggers are active");
  }
});

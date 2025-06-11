# GetInsultd.io - Productivity Enhancement Browser Extension

## Overview

GetInsultd.io is a powerful Chrome extension designed to help users maintain focus and productivity by monitoring browsing behavior and providing real-time feedback through various triggers and celebrations. The extension combines behavior tracking, productivity monitoring, and positive reinforcement to create a unique productivity tool.

## Features

### 1. Productivity Triggers System

The extension implements a sophisticated trigger system that monitors various aspects of browsing behavior:

#### Core Trigger Types:

- **Duration-based** triggers
- **Instant** triggers
- **Behavior-based** triggers
- **Content-based** triggers
- **Frequency-based** triggers

### 2. Visual Feedback

- Dynamic border animations
- Confetti celebrations for positive behaviors
- Custom notifications and alerts

### 3. Comprehensive Monitoring

- Tab management and switching patterns
- Social media usage
- Content consumption patterns
- Work-entertainment balance

## Technical Documentation

### Core Components

#### 1. Trigger Configuration (`triggers.js`)

The trigger system is defined in `triggers.js`, which contains all trigger definitions and their configurations. Here's a detailed breakdown of the trigger types:

```javascript
export const TRIGGER_CONFIG = {
  EXCESSIVE_SOCIAL_MEDIA: {
    id: "excessive_social_media",
    name: "Excessive Social Media Use",
    description: "Staying too long on social media platforms",
    domains: ["twitter.com", "instagram.com", "facebook.com" /* ... */],
    timeThreshold: 1 * 60 * 1000, // 1 minute in milliseconds
    type: "duration",
  },
  // ... other triggers
};
```

Each trigger configuration includes:

- `id`: Unique identifier
- `name`: Display name
- `description`: Detailed description of the trigger
- `type`: Trigger type (duration/instant/behavior/content/frequency)
- Additional type-specific parameters

#### 2. Trigger Detection System (`triggerDetector.js`)

The TriggerDetector class handles the core logic for monitoring and detecting trigger conditions. Key functionalities include:

```javascript
class TriggerDetector {
  // Initialize tracking state
  initializeDistractionTracking() {
    // Sets up session storage for tracking:
    // - Last distraction time
    // - Distraction-free periods
    // - Closed distractions
    // - Trigger timestamps
  }

  // Handle tab state changes
  async handleTabActivated(activeInfo) {
    // Monitors active tab changes
    // Updates distraction tracking
    // Triggers relevant celebrations
  }

  // Monitor tab closures
  async handleTabClose(tabId) {
    // Tracks distraction site closures
    // Manages celebration triggers
    // Updates tracking state
  }
}
```

#### 3. Background Service (`background.js`)

Manages extension-wide state and handles browser events:

- Tab management
- Storage operations
- Message passing between components

#### 4. Content Script (`content.js`)

Handles DOM manipulation and user interface elements:

- Border animations
- Notification displays
- User interaction tracking

### State Management

The extension implements a sophisticated state management system using Chrome's storage API and session storage:

#### Background State (`background.js`)

```javascript
// Productive site tracking
async function storeProductiveVisit(domain) {
  const data = {
    productiveVisit: {
      domain: domain,
      startTime: Date.now(),
    },
  };
  await chrome.storage.local.set(data);
}

// State retrieval
async function getLastProductiveVisit() {
  const result = await chrome.storage.local.get("productiveVisit");
  return result.productiveVisit || null;
}
```

Key features:

- Tracks productive site visits
- Monitors reward-switching behavior
- Maintains tab statistics
- Implements periodic checks

#### Session Storage (TriggerDetector)

```javascript
// Distraction state management
{
  lastDistractionTime: timestamp,
  distractionFreeStartTime: timestamp,
  closedDistractions: [],
  lastTriggerTimes: {},
  isCurrentlyOnDistraction: false
}
```

### Event Handling System

#### Tab Events

The extension monitors various tab events:

1. **Tab Activation**

```javascript
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // Handle active tab changes
  // Check for productivity patterns
  // Update tracking state
});
```

2. **Tab Updates**

```javascript
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Monitor URL changes
  // Track site transitions
  // Update productivity metrics
});
```

3. **Periodic Checks**

```javascript
setInterval(async () => {
  // Check tab count
  // Verify productivity status
  // Update trigger states
}, 60000); // Every minute
```

### Productivity Classification

The extension classifies sites into different categories:

```javascript
const PRODUCTIVE_APPS = [
  "github.com",
  "gitlab.com",
  "notion.so",
  "docs.google.com",
];

const REWARD_APPS = ["youtube.com", "netflix.com"];
```

#### Domain Handling

```javascript
function normalizeDomain(domain) {
  return domain.toLowerCase();
}

function isDomainInList(domain, list) {
  const normalizedDomain = normalizeDomain(domain);
  return list.some((app) => normalizedDomain.includes(normalizeDomain(app)));
}
```

### Notification System

The extension uses Chrome's messaging system for communication between components:

```javascript
// Send notifications
chrome.tabs.sendMessage(tabId, {
  type: "REWARD_SWITCH_DETECTED",
  data: {
    from: lastProductiveVisit.domain,
    to: currentDomain,
    timeSpent: timeSpentOnProductive,
  },
});
```

### Performance Optimizations

1. **Storage Operations**

   - Batched updates to reduce write operations
   - Verification of storage operations
   - Cleanup of stale data

2. **Event Debouncing**

   ```javascript
   let lastTabTimestamp = Date.now();
   // ... in event handlers:
   const now = Date.now();
   const timeSinceLastEvent = now - lastTabTimestamp;
   ```

3. **Resource Management**
   - Periodic cleanup of unused storage
   - Efficient DOM operations
   - Memory leak prevention

### Trigger Types Explained

1. **Duration Triggers**

   - Monitor time spent on specific sites
   - Example: EXCESSIVE_SOCIAL_MEDIA trigger

   ```javascript
   {
     type: "duration",
     timeThreshold: 1 * 60 * 1000, // 1 minute
     domains: ["twitter.com", "facebook.com"]
   }
   ```

2. **Instant Triggers**

   - Fire immediately upon certain conditions
   - Example: WEB_GAMES trigger

   ```javascript
   {
     type: "instant",
     domains: ["1v1.lol", "slither.io"]
   }
   ```

3. **Behavior Triggers**
   - Monitor user actions and patterns
   - Example: RAPID_TAB_SWITCHING trigger
   ```javascript
   {
     type: "behavior",
     switchThreshold: 10,
     timeWindow: 60 * 1000 // 60 seconds
   }
   ```

### Special Features

#### YouTube Integration

The extension includes specialized handling for YouTube content through dedicated modules:

#### 1. Video Content Analysis (`youtubeUtils.js`)

Extracts and analyzes video information:

```javascript
export async function extractYouTubeVideoInfo() {
  // Handle different YouTube layouts
  const titleElement = await waitForElement(
    "h1.ytd-video-primary-info-renderer"
  );
  const description = await extractDescription();

  return { title, description };
}
```

Features:

- Smart layout detection
- Robust element waiting
- Multiple fallback strategies

#### 2. Educational Content Detection (`youtubeTrigger.js`)

Determines if content is educational:

```javascript
function isEducationalContent(title, description) {
  const { educationalKeywords } = TRIGGER_CONFIG.NON_EDUCATIONAL_YOUTUBE;
  const combinedText = `${title} ${description}`.toLowerCase();

  return educationalKeywords.some((keyword) =>
    combinedText.includes(keyword.toLowerCase())
  );
}
```

Educational keywords include:

- tutorial
- learn
- course
- education
- programming
- development
- lecture
- study

#### 3. Content Monitoring System

Continuous monitoring of YouTube activity:

```javascript
export function startYouTubeMonitoring(triggerCallback) {
  monitoringInterval = setInterval(
    () => processYouTubeContent(triggerCallback),
    CHECK_INTERVAL
  );
}
```

Features:

- Real-time URL change detection
- Automatic content reprocessing
- Memory-efficient interval management

#### 4. URL Change Detection

Handles navigation between videos:

```javascript
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    if (url.includes("youtube.com/watch")) {
      processYouTubeContent();
    }
  }
}).observe(document, { subtree: true, childList: true });
```

### YouTube-Specific Triggers

1. **YouTube Shorts Detection**

```javascript
YOUTUBE_SHORTS: {
  id: "youtube_shorts",
  name: "YouTube Shorts Detection",
  description: "Why are you watching YouTube Shorts?",
  domains: ["youtube.com", "www.youtube.com"],
  type: "instant"
}
```

2. **Non-Educational Content**

```javascript
NON_EDUCATIONAL_YOUTUBE: {
  id: "non_educational_youtube",
  name: "Non-Educational YouTube",
  description: "Watching entertainment instead of learning content",
  domains: ["youtube.com"],
  educationalKeywords: [/* ... */],
  type: "content"
}
```

### YouTube Integration Flow

1. **Initialization**

   - Load YouTube-specific modules
   - Set up content monitoring
   - Initialize trigger handlers

2. **Content Processing**

   ```javascript
   async function processYouTubeContent(triggerCallback) {
     const videoInfo = await extractYouTubeVideoInfo();
     const isEducational = isEducationalContent(
       videoInfo.title,
       videoInfo.description
     );

     if (!isEducational) {
       triggerCallback(TRIGGER_CONFIG.NON_EDUCATIONAL_YOUTUBE, videoInfo);
     }
   }
   ```

3. **Trigger Handling**

   - Fire appropriate celebrations/notifications
   - Update browsing statistics
   - Log educational vs. entertainment time

4. **Cleanup**
   ```javascript
   export function stopYouTubeMonitoring() {
     if (monitoringInterval) {
       clearInterval(monitoringInterval);
       monitoringInterval = null;
     }
   }
   ```

### User Interface Components

#### 1. Floating Emoji Interface

The extension provides a floating emoji interface that serves as the main interaction point:

```javascript
async function addFloatingEmoji(fireCelebrationConfetti) {
  const emoji = document.createElement("div");
  emoji.className = "floating-emoji";
  // ... emoji setup and positioning
}
```

Features:

- Draggable interface
- Click interactions
- Celebration animations
- Status indicators

#### 2. Stats Bubble

Provides real-time statistics about browsing behavior:

```javascript
function createStatsBubble() {
  const bubble = document.createElement("div");
  bubble.className = "stats-bubble";
  // ... stats display setup
}
```

Data displayed:

- Time spent on current site
- Visit frequency
- Productivity metrics
- Trigger status

#### 3. Trigger Notifications

Custom notification system for productivity triggers:

```javascript
function showTriggerNotification(trigger, data) {
  const notification = document.createElement("div");
  notification.className = "trigger-notification";
  // ... notification content and animation
}
```

### DOM Management

#### 1. Safe DOM Operations

The extension implements robust DOM manipulation:

```javascript
async function safelyAddElementToDOM(element, container) {
  try {
    if (!document.contains(container)) {
      throw new Error("Container is not in document");
    }
    // ... safe DOM insertion
  } catch (e) {
    console.warn("Error adding element to DOM:", e);
    return false;
  }
}
```

#### 2. Container Detection

Smart container detection for different websites:

```javascript
function findChatGPTContainer() {
  const containerSelectors = [
    "#__next > div > div.flex > div.flex",
    "main",
    "#__next",
    // ... other selectors
  ];
  // ... container detection logic
}
```

### Data Collection & Privacy

#### 1. Website Metadata Collection

```javascript
function getWebsiteMetadata() {
  return {
    title: document.title || "Unknown Title",
    description: getMetaDescription(),
    url: window.location.href,
    hostname: window.location.hostname,
    favicon: getFaviconUrl(),
  };
}
```

#### 2. Visit Tracking

```javascript
async function updateVisitData(force = false) {
  const currentUrl = window.location.hostname;
  const metadata = getWebsiteMetadata();
  // ... update storage with visit data
}
```

### Error Handling & Recovery

#### 1. Extension Context Validation

```javascript
function isExtensionContextValid() {
  try {
    return Boolean(chrome.runtime && chrome.runtime.id);
  } catch (e) {
    return false;
  }
}
```

#### 2. Safe API Operations

```javascript
async function safeExecuteChromeAPI(operation, maxRetries = 3) {
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      // ... safe API execution
    } catch (error) {
      // ... error handling and retry logic
    }
  }
}
```

### Initialization Process

The extension follows a careful initialization sequence:

1. **Module Loading**

```javascript
async function initializeModules() {
  try {
    const { TriggerDetector } = await import(triggerDetectorUrl);
    const { fireCelebrationConfetti } = await import(confettiUrl);
    // ... module initialization
  } catch (error) {
    console.error("Error initializing modules:", error);
  }
}
```

2. **Storage Setup**

```javascript
async function initializeStorageIfNeeded() {
  const data = await chrome.storage.local.get("initialized");
  if (!data.initialized) {
    await chrome.storage.local.set({
      initialized: true,
      // ... initial storage setup
    });
  }
}
```

3. **UI Component Initialization**

```javascript
async function initialize() {
  await initializeModules();
  await initializeStorageIfNeeded();
  // ... UI component setup
}
```

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/getinsultd.io.git
```

2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory

## Configuration

### Permissions Required:

```json
{
  "permissions": ["activeTab", "storage", "scripting", "tabs"],
  "host_permissions": [
    "*://*.youtube.com/*",
    "*://*.openai.com/*",
    "*://chat.openai.com/*",
    "<all_urls>"
  ]
}
```

### Customization

Users can modify trigger configurations in `triggers.js`:

- Adjust time thresholds
- Modify domain lists
- Add new trigger types

## Development

### Project Structure

```
getinsultd.io/
├── manifest.json          # Extension configuration
├── background.js         # Service worker
├── content.js           # Content script
├── triggers.js         # Trigger definitions
├── triggerDetector.js # Core detection logic
├── youtubeUtils.js   # YouTube-specific utilities
├── styles.css       # CSS styles
└── canvas-confetti.js # Visual effects
```

### Adding New Triggers

1. Define the trigger in `triggers.js`
2. Implement detection logic in `triggerDetector.js`
3. Add any necessary UI components in `content.js`

Example of adding a new trigger:

```javascript
// In triggers.js
export const TRIGGER_CONFIG = {
  NEW_TRIGGER: {
    id: "new_trigger",
    name: "New Trigger",
    description: "Description of new trigger",
    type: "duration",
    timeThreshold: 5 * 60 * 1000,
    domains: ["example.com"],
  },
};
```

## Best Practices

1. **Performance Considerations**

   - Use efficient DOM operations
   - Implement debouncing for frequent events
   - Minimize storage operations

2. **Security**

   - Validate all user inputs
   - Use secure storage methods
   - Follow Content Security Policy guidelines

3. **Maintenance**
   - Keep trigger configurations updated
   - Monitor for browser API changes
   - Regular testing across different sites

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and feature requests, please use the GitHub issue tracker.

---

**Note**: This extension is designed to help improve productivity while respecting user privacy and maintaining performance. All tracking is done locally within the browser.

## Debugging

### Console Logging

The extension implements comprehensive logging:

```javascript
console.log("📊 Current state:", {
  currentDomain,
  lastProductiveVisit,
  isProductiveSite: isDomainInList(currentDomain, PRODUCTIVE_APPS),
  isRewardSite: isDomainInList(currentDomain, REWARD_APPS),
});
```

### Error Handling

```javascript
try {
  // Operation code
} catch (error) {
  console.error("❌ Error in background handler:", error);
}
```

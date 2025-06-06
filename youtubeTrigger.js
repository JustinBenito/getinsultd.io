const triggersUrl = chrome.runtime.getURL("triggers.js");
const youtubeUtilsUrl = chrome.runtime.getURL("youtubeUtils.js");

// Dynamic imports
const { TRIGGER_CONFIG } = await import(triggersUrl);
const { extractYouTubeVideoInfo } = await import(youtubeUtilsUrl);

let monitoringInterval = null;
const CHECK_INTERVAL = 10000; // Check every 10 seconds

/**
 * Checks if the content is educational based on keywords
 * @param {string} title
 * @param {string} description
 * @returns {boolean}
 */
function isEducationalContent(title, description) {
  const { educationalKeywords } = TRIGGER_CONFIG.NON_EDUCATIONAL_YOUTUBE;
  const combinedText = `${title} ${description}`.toLowerCase();

  return educationalKeywords.some((keyword) =>
    combinedText.includes(keyword.toLowerCase())
  );
}

/**
 * Processes YouTube video content and determines if it's non-educational
 * @param {Function} triggerCallback - Callback function to handle trigger events
 * @returns {Promise<void>}
 */
export async function processYouTubeContent(triggerCallback) {
  try {
    const videoInfo = await extractYouTubeVideoInfo();

    if (!videoInfo) {
      console.log("No video information available");
      return;
    }

    const { title, description } = videoInfo;
    const isEducational = isEducationalContent(title, description);

    console.log("YouTube Video Information:");
    console.log("Title:", title);
    console.log("Description:", description);
    console.log("Is Educational:", isEducational);

    // If content is not educational, trigger the notification
    if (!isEducational && triggerCallback) {
      const trigger = TRIGGER_CONFIG.NON_EDUCATIONAL_YOUTUBE;
      triggerCallback(trigger, { title, description });
    }
  } catch (error) {
    console.error("Error processing YouTube content:", error);
  }
}

/**
 * Starts monitoring YouTube content
 * @param {Function} triggerCallback - Callback function to handle trigger events
 */
export function startYouTubeMonitoring(triggerCallback) {
  // Clear any existing interval
  stopYouTubeMonitoring();

  // Start new monitoring interval
  monitoringInterval = setInterval(
    () => processYouTubeContent(triggerCallback),
    CHECK_INTERVAL
  );

  // Also process immediately on start
  processYouTubeContent(triggerCallback);
}

/**
 * Stops monitoring YouTube content
 */
export function stopYouTubeMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
}

// Listen for URL changes to handle navigation between videos
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    if (url.includes("youtube.com/watch")) {
      processYouTubeContent(); // Process immediately on URL change
    }
  }
}).observe(document, { subtree: true, childList: true });

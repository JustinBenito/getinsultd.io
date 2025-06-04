// Track website visit data
let startTime = Date.now();
let isStatsBubbleVisible = false;

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
async function updateVisitData() {
  const currentUrl = window.location.hostname;
  const metadata = getWebsiteMetadata();

  try {
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
  } catch (error) {
    console.error("Error updating visit data:", error);
  }
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
    const data = await chrome.storage.local.get(null); // Get all stored data
    const sortedSites = sortWebsitesByTime(data);

    let html = "<h3>All Websites Statistics</h3>";

    for (const [hostname, siteData] of sortedSites) {
      const isCurrentSite = hostname === window.location.hostname;
      const currentSessionTime = isCurrentSite ? Date.now() - startTime : 0;
      const totalTime = siteData.totalTime + currentSessionTime;

      html += `
        <div class="website-stats-item ${isCurrentSite ? "current-site" : ""}">
          <div class="website-title">${siteData.metadata.title}</div>
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
    bubble.innerHTML = "<h3>Error loading statistics</h3>";
  }
}

// Function to add the emoji element
function addFloatingEmoji() {
  // Remove existing emoji if any
  const existingEmoji = document.querySelector(".floating-emoji");
  if (existingEmoji) {
    existingEmoji.remove();
  }

  // Create the floating emoji element
  const floatingEmoji = document.createElement("div");
  floatingEmoji.className = "floating-emoji";
  floatingEmoji.innerHTML = "😊";

  // Create stats bubble
  const statsBubble = createStatsBubble();

  // For YouTube, we need to append to a specific container
  if (window.location.hostname.includes("youtube.com")) {
    const targetNode = document.body;
    if (targetNode) {
      targetNode.appendChild(floatingEmoji);
      targetNode.appendChild(statsBubble);
    }
  } else {
    document.body.appendChild(floatingEmoji);
    document.body.appendChild(statsBubble);
  }

  // Toggle border and stats state
  let isBorderActive = false;

  // Add click event listener
  floatingEmoji.addEventListener("click", async () => {
    isBorderActive = !isBorderActive;
    isStatsBubbleVisible = !isStatsBubbleVisible;

    if (isBorderActive) {
      if (window.location.hostname.includes("youtube.com")) {
        document.documentElement.classList.add("webpage-border");
        const app = document.querySelector("ytd-app");
        if (app) {
          app.style.border = "8px solid #4CAF50";
        }
      } else {
        document.body.classList.add("webpage-border");
      }
    } else {
      if (window.location.hostname.includes("youtube.com")) {
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

  // Update stats every minute
  setInterval(() => {
    if (isStatsBubbleVisible) {
      updateStatsBubble(statsBubble);
    }
  }, 60000);
}

// Initial addition of emoji
addFloatingEmoji();

// Handle YouTube's dynamic navigation
if (window.location.hostname.includes("youtube.com")) {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        if (!document.querySelector(".floating-emoji")) {
          addFloatingEmoji();
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Update storage when leaving the page
window.addEventListener("beforeunload", () => {
  updateVisitData();
});

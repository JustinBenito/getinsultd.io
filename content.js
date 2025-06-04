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

// Function to update stats display
async function updateStatsBubble(bubble) {
  const currentUrl = window.location.hostname;
  const data = await chrome.storage.local.get(currentUrl);
  const siteData = data[currentUrl] || {
    totalTime: 0,
    visits: 0,
    lastVisit: null,
    metadata: getWebsiteMetadata(),
  };

  const currentSession = Date.now() - startTime;
  const totalTime = siteData.totalTime + currentSession;

  bubble.innerHTML = `
    <h3>${siteData.metadata.title}</h3>
    <div class="stats-item">
      <span class="label">Current Session:</span>
      <span class="value">${formatDuration(currentSession)}</span>
    </div>
    <div class="stats-item">
      <span class="label">Total Time:</span>
      <span class="value">${formatDuration(totalTime)}</span>
    </div>
    <div class="stats-item">
      <span class="label">Total Visits:</span>
      <span class="value">${siteData.visits + 1}</span>
    </div>
    <div class="meta-section">
      <div class="stats-item">
        <span class="label">Description:</span>
      </div>
      <div style="font-size: 12px; color: #666; margin-top: 4px;">
        ${siteData.metadata.description.slice(0, 100)}${
    siteData.metadata.description.length > 100 ? "..." : ""
  }
      </div>
    </div>
  `;
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

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

  // For YouTube, we need to append to a specific container
  if (window.location.hostname.includes("youtube.com")) {
    // Wait for YouTube's content to load
    const targetNode = document.body;
    if (targetNode) {
      targetNode.appendChild(floatingEmoji);
    }
  } else {
    document.body.appendChild(floatingEmoji);
  }

  // Toggle border state
  let isBorderActive = false;

  // Add click event listener
  floatingEmoji.addEventListener("click", () => {
    isBorderActive = !isBorderActive;
    if (isBorderActive) {
      if (window.location.hostname.includes("youtube.com")) {
        // For YouTube, apply border to specific elements
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
  });
}

// Initial addition of emoji
addFloatingEmoji();

// Handle YouTube's dynamic navigation
if (window.location.hostname.includes("youtube.com")) {
  // Create a MutationObserver to detect YouTube's SPA navigation
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        // Check if our emoji is still present
        if (!document.querySelector(".floating-emoji")) {
          addFloatingEmoji();
        }
      }
    }
  });

  // Start observing the document with the configured parameters
  observer.observe(document.body, { childList: true, subtree: true });
}

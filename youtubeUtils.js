// YouTube utility functions for trigger handling

/**
 * Extracts video information from a YouTube page
 * @returns {Promise<{title: string, description: string} | null>}
 */
export async function extractYouTubeVideoInfo() {
  try {
    // Handle different YouTube URL patterns
    if (!window.location.hostname.includes("youtube.com")) {
      return null;
    }

    // Only process if we're on a video page
    if (!window.location.pathname.includes("/watch")) {
      return null;
    }

    // Wait for title element to be available
    const titleElement = await waitForElement(
      "h1.ytd-video-primary-info-renderer"
    );
    if (!titleElement) {
      console.warn("YouTube title element not found");
      return null;
    }

    // Get video title
    const title = titleElement.textContent?.trim() || "";

    // Try to get description - new YouTube layout with attributed string
    let description = "";
    const attributedString = document.querySelector(
      "yt-attributed-string.ytd-text-inline-expander"
    );
    if (attributedString) {
      // Get all text content from spans inside
      const spans = attributedString.querySelectorAll(
        "span.yt-core-attributed-string"
      );
      description = Array.from(spans)
        .map((span) => span.textContent?.trim())
        .filter(Boolean)
        .join(" ");
    }

    // If no description found in new layout, try the old layout
    if (!description) {
      const oldDescriptionElement = document.querySelector(
        "#description ytd-formatted-string"
      );
      description = oldDescriptionElement?.textContent?.trim() || "";
    }

    // If still no description, try other potential selectors
    if (!description) {
      const alternativeDescriptionElement = document.querySelector(
        "#description-inline-expander"
      );
      description = alternativeDescriptionElement?.textContent?.trim() || "";
    }

    console.log("Extracted YouTube info:", { title, description });
    return { title, description };
  } catch (error) {
    console.error("Error extracting YouTube video info:", error);
    return null;
  }
}

/**
 * Waits for an element matching the selector to appear in the DOM
 * @param {string} selector - CSS selector to wait for
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<Element|null>}
 */
async function waitForElement(selector, timeout = 5000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return null;
}

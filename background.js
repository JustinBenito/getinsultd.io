// Background script to handle tab events
let lastTabTimestamp = Date.now();

const PRODUCTIVE_APPS = [
  "github.com",
  "gitlab.com",
  "notion.so",
  "docs.google.com",
];

const REWARD_APPS = ["youtube.com", "netflix.com"];

// Helper function to normalize domain
function normalizeDomain(domain) {
  return domain.toLowerCase();
}

// Helper function to check if domain is in list
function isDomainInList(domain, list) {
  const normalizedDomain = normalizeDomain(domain);
  return list.some((app) => normalizedDomain.includes(normalizeDomain(app)));
}

// Helper function to store productive site visit
async function storeProductiveVisit(domain) {
  const data = {
    productiveVisit: {
      domain: domain,
      startTime: Date.now(),
    },
  };
  await chrome.storage.local.set(data);
  console.log("✅ Stored productive visit:", data);

  // Verify storage
  const verification = await chrome.storage.local.get("productiveVisit");
  console.log("✅ Storage verification:", verification);
}

// Helper function to get last productive visit
async function getLastProductiveVisit() {
  const result = await chrome.storage.local.get("productiveVisit");
  console.log("📖 Reading productive visit from storage:", result);
  return result.productiveVisit || null;
}

// Helper function to clear productive visit
async function clearProductiveVisit() {
  console.log("🗑️ About to clear productive visit");
  const before = await getLastProductiveVisit();
  console.log("🗑️ Current value before clearing:", before);

  await chrome.storage.local.remove("productiveVisit");

  const after = await getLastProductiveVisit();
  console.log("🗑️ Verified clear - new value:", after);
}

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    const currentDomain = new URL(tab.url).hostname;
    const now = Date.now();

    console.log("\n🔄 Tab Activated Event:", {
      tabId: activeInfo.tabId,
      currentDomain,
      timestamp: new Date(now).toISOString(),
    });

    // Get the last productive visit
    const lastProductiveVisit = await getLastProductiveVisit();
    console.log("📊 Current state:", {
      currentDomain,
      lastProductiveVisit,
      isProductiveSite: isDomainInList(currentDomain, PRODUCTIVE_APPS),
      isRewardSite: isDomainInList(currentDomain, REWARD_APPS),
    });

    // If current site is productive, store it
    if (isDomainInList(currentDomain, PRODUCTIVE_APPS)) {
      console.log("🎯 Productive site detected, storing visit:", currentDomain);
      await storeProductiveVisit(currentDomain);
    }
    // If current site is a reward site, check for quick switching
    else if (isDomainInList(currentDomain, REWARD_APPS)) {
      console.log("🎮 Reward site detected, checking for quick switch");

      if (lastProductiveVisit) {
        const timeSpentOnProductive = now - lastProductiveVisit.startTime;
        console.log("⏱️ Quick switch check:", {
          from: lastProductiveVisit.domain,
          to: currentDomain,
          timeSpentOnProductive,
          threshold: 10000, // 10 seconds
          isQuickSwitch: timeSpentOnProductive <= 10000,
        });

        if (timeSpentOnProductive <= 10000) {
          // 10 seconds
          console.log("⚡ Quick reward switch detected!", {
            from: lastProductiveVisit.domain,
            to: currentDomain,
            timeSpent: timeSpentOnProductive,
          });

          // Notify content script
          chrome.tabs.sendMessage(activeInfo.tabId, {
            type: "REWARD_SWITCH_DETECTED",
            data: {
              from: lastProductiveVisit.domain,
              to: currentDomain,
              timeSpent: timeSpentOnProductive,
            },
          });

          // Only clear after successful notification
          await clearProductiveVisit();
        }
      } else {
        console.log(
          "ℹ️ No previous productive visit found for reward site check"
        );
      }
    }
    // Only clear the productive visit if we're on a non-productive AND non-reward site
    else if (
      !isDomainInList(currentDomain, PRODUCTIVE_APPS) &&
      !isDomainInList(currentDomain, REWARD_APPS)
    ) {
      console.log(
        "🌐 Non-productive, non-reward site detected. Clearing visit data."
      );
      await clearProductiveVisit();
    }
  } catch (error) {
    console.error("❌ Error in background tab handler:", error);
  }
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    try {
      const currentDomain = new URL(tab.url).hostname;
      const now = Date.now();

      console.log("\n🔄 Tab Updated Event:", {
        tabId,
        currentDomain,
        timestamp: new Date(now).toISOString(),
      });

      // Get the last productive visit
      const lastProductiveVisit = await getLastProductiveVisit();
      console.log("📊 Tab update state:", {
        currentDomain,
        lastProductiveVisit,
        isProductiveSite: isDomainInList(currentDomain, PRODUCTIVE_APPS),
        isRewardSite: isDomainInList(currentDomain, REWARD_APPS),
      });

      // If current site is productive, store it
      if (isDomainInList(currentDomain, PRODUCTIVE_APPS)) {
        console.log(
          "🎯 Productive site detected in update, storing visit:",
          currentDomain
        );
        await storeProductiveVisit(currentDomain);
      }
      // If current site is a reward site, check for quick switching
      else if (isDomainInList(currentDomain, REWARD_APPS)) {
        console.log(
          "🎮 Reward site detected in update, checking for quick switch"
        );

        if (lastProductiveVisit) {
          const timeSpentOnProductive = now - lastProductiveVisit.startTime;
          console.log("⏱️ Quick switch check in update:", {
            from: lastProductiveVisit.domain,
            to: currentDomain,
            timeSpentOnProductive,
            threshold: 10000,
            isQuickSwitch: timeSpentOnProductive <= 10000,
          });

          if (timeSpentOnProductive <= 10000) {
            // 10 seconds
            console.log("⚡ Quick reward switch detected in update!", {
              from: lastProductiveVisit.domain,
              to: currentDomain,
              timeSpent: timeSpentOnProductive,
            });

            // Notify content script
            chrome.tabs.sendMessage(tabId, {
              type: "REWARD_SWITCH_DETECTED",
              data: {
                from: lastProductiveVisit.domain,
                to: currentDomain,
                timeSpent: timeSpentOnProductive,
              },
            });

            // Only clear after successful notification
            await clearProductiveVisit();
          }
        } else {
          console.log(
            "ℹ️ No previous productive visit found for reward site check in update"
          );
        }
      }
      // Only clear the productive visit if we're on a non-productive AND non-reward site
      else if (
        !isDomainInList(currentDomain, PRODUCTIVE_APPS) &&
        !isDomainInList(currentDomain, REWARD_APPS)
      ) {
        console.log(
          "🌐 Non-productive, non-reward site detected in update. Clearing visit data."
        );
        await clearProductiveVisit();
      }
    } catch (error) {
      console.error("❌ Error in background update handler:", error);
    }
  }
});

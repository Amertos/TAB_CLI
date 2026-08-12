chrome.runtime.onInstalled.addListener(() => {
  console.log("[Tab Chaos Cleaner] Extension installed.");
});


chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "toggleAutoSleep") {
    if (message.enabled) {
      
      chrome.alarms.create("autoSleepAlarm", { periodInMinutes: 30 });
      console.log("Auto-Sleep alarm has been activated and seet to trigger every 30 minutes.");
    } else {
      chrome.alarms.clear("autoSleepAlarm");
      console.log("Auto-Sleep alarm has been deactivated.");
    }
  }
});


chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "autoSleepAlarm") {
    const tabs = await chrome.tabs.query({activate: false });


    for (const tab of tabs) {
      if (!tab.discarded && tab.url && !tab.url.startsWith("chrome://")) {
        try {
          await chrome.tabs.discard(tab.id);
        } catch (e) {}
      }
    }
    console.log("Auto-Sleep has automaticly frozed not active tabs in background.")
  }
})

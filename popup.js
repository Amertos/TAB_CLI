const $ = (id) => document.getElementById(id);

const DOMAIN_GROUPS = {
  "🤖 AI & Chat": ["chatgpt.com", "claude.ai", "gemini.google.com", "huggingface.co"],
  "🎥 Media": ["youtube.com", "netflix.com", "spotify.com", "twitch.tv", "cineby.at"],
  "💻 Dev": ["github.com", "gitlab.com", "stackoverflow.com", "localhost", "aistudio.google.com"],
  "📰 Social": ["x.com", "twitter.com", "reddit.com", "linkedin.com", "instagram.com"],
  "Design" : ["figma.com", "canva.com", "motionsites.ai" ],
  "News" : ["sandzakpress.net"]
  
};

function estimateRam(tab) {
  if (tab.discarded) return 15;
  const url = tab.url || tab.pendingUrl || "";
  if (/youtube|netflix|twitch/.test(url)) return 412;
  if (/github|figma|canva/.test(url)) return 245;
  if (/chatgpt|claude|gemini/.test(url)) return 180;
  if (url.startsWith("chrome://")) return 20;
  return 89;
}

document.addEventListener("DOMContentLoaded", async () => {
  setupNavTabs();

  // Connecting all groups
  bindButton("btn-group", groupTabsByCategory);
  bindButton("btn-ungroup", ungroupAllTabs);
  bindButton("btn-focus", activateFocusMode);
  bindButton("btn-dedupe", removeDuplicateTabs);
  bindButton("btn-discard", freeUpRam);
  bindButton("btn-save-later", saveCurrentTabForLater);
  bindButton("btn-save-session", saveCurrentSession);

  // refreshing of data
  await updateStats();
  await loadActiveNodes();
  await loadSessions();
  await loadLaterItems();
});

// 1.CHANGING DASH | SAVED | LATER
function setupNavTabs() {
  const navBtns = document.querySelectorAll(".nav-btn");
  navBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const tabId = e.currentTarget.getAttribute("data-tab");
      switchTab(tabId);
    });
  });
}

function switchTab(tabId) {
  if (!tabId) return;

  // Updating active state of buttons
  document.querySelectorAll(".nav-btn").forEach(b => {
    if (b.getAttribute("data-tab") === tabId) {
      b.classList.add("active");
    } else {
      b.classList.remove("active");
    }
  });


  document.querySelectorAll(".tab-view").forEach(view => {
    if (view.id === tabId) {
      view.classList.add("active");
      view.style.display = "block";
    } else {
      view.classList.remove("active");
      view.style.display = "none";
    }
  });

  // Refresh stuff after 
  if (tabId === "tab-saved") loadSessions();
  if (tabId === "tab-later") loadLaterItems();
}

function showToast(msg) {
  const toast = $("toast");
  if (toast) toast.textContent = msg;
}

function bindButton(id, handler) {
  const el = $(id);
  if (el) {
    el.addEventListener("click", async () => {
      try {
        await handler();
      } catch (err) {
        console.error(`Greška [${id}]:`, err);
      }
    });
  }
}

// Update RAM and LED bar
async function updateStats() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  
  const badge = $("tab-badge");
  if (badge) badge.textContent = tabs.length;

  const nodesBadge = $("nodes-count");
  if (nodesBadge) nodesBadge.textContent = tabs.length;

  let totalRamMb = tabs.reduce((sum, tab) => sum + estimateRam(tab), 0);
  let totalRamGb = (totalRamMb / 1024).toFixed(1);

  const ramVal = $("ram-val");
  if (ramVal) ramVal.textContent = totalRamGb;

  const percent = Math.min(100, Math.round((totalRamMb / 3000) * 100));
  const activeBarsCount = Math.ceil((percent / 100) * 10);

  for (let i = 1; i <= 10; i++) {
    const bar = document.querySelector(`.led-bar.b${i}`);
    if (bar) {
      bar.className = `led-bar b${i}`;
      if (i <= activeBarsCount) {
        if (i >= 8) bar.classList.add("active", "alert");
        else if (i >= 5) bar.classList.add("active", "warn");
        else bar.classList.add("active");
      }
    }
  }
}

// Showing open ports 
async function loadActiveNodes() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const list = $("active-nodes-list");
  if (!list) return;

  list.innerHTML = "";

  tabs.forEach(tab => {
    const ram = estimateRam(tab);
    let barClass = "";
    if (ram > 300) barClass = "alert";
    else if (ram > 150) barClass = "warn";

    let host = "local";
    try {
      if (tab.url) host = new URL(tab.url).hostname.replace("www.", "");
    } catch(e) {}

    const li = document.createElement("li");
    li.className = "node-item";
    li.innerHTML = `
      <div class="node-title-box">
        <div class="node-bar ${barClass}"></div>
        <div>
          <div class="node-title">${tab.title || "Untitled Node"}</div>
          <div class="node-sub">${host}</div>
        </div>
      </div>
      <div class="node-ram">
        <span>${ram}M</span>
        <button class="node-close-btn" data-id="${tab.id}" title="Close Node">✖</button>
      </div>
    `;

    li.querySelector(".node-close-btn").addEventListener("click", async (e) => {
      const tabId = parseInt(e.target.dataset.id);
      await chrome.tabs.remove(tabId);
      showToast("NODE_CLOSED // PURGED");
      await updateStats();
      await loadActiveNodes();
    });

    list.appendChild(li);
  });
}

// 1. AUTO_GROUP (CMD_G)
async function groupTabsByCategory() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const groupsMap = {};

  tabs.forEach(tab => {
    const url = tab.url || tab.pendingUrl || "";
    if (!url || url.startsWith("chrome://")) return;

    let groupTitle = null;

    for (const [title, domains] of Object.entries(DOMAIN_GROUPS)) {
      if (domains.some(d => url.includes(d))) {
        groupTitle = title;
        break;
      }
    }

    if (!groupTitle) {
      try {
        const host = new URL(url).hostname.replace("www.", "");
        const rawName = host.split(".")[0];
        if (rawName) groupTitle = rawName.toUpperCase();
      } catch (e) {
        return;
      }
    }

    if (groupTitle) {
      if (!groupsMap[groupTitle]) groupsMap[groupTitle] = [];
      groupsMap[groupTitle].push(tab.id);
    }
  });

  const groupColors = ["blue", "red", "yellow", "green", "pink", "purple", "cyan"];
  let colorIdx = 0;
  let count = 0;

  for (const [title, tabIds] of Object.entries(groupsMap)) {
    if (tabIds.length > 0) {
      const groupId = await chrome.tabs.group({ tabIds });
      await chrome.tabGroups.update(groupId, {
        title,
        color: groupColors[colorIdx % groupColors.length]
      });
      colorIdx++;
      count++;
    }
  }

  showToast(`CMD_EXEC // GROUPS_CREATED [${count}]`);
  await updateStats();
}

// 2. UNGROUP (CMD_U)
async function ungroupAllTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const groupedTabIds = tabs.filter(t => t.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE).map(t => t.id);

  if (groupedTabIds.length > 0) {
    await chrome.tabs.ungroup(groupedTabIds);
    showToast("CMD_EXEC // GROUPS_UNGROUPED");
  } else {
    showToast("SYS_MSG // NO_GROUPS_FOUND");
  }
}

// 3. DEDUPE_EXE (CMD_D)
async function removeDuplicateTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const seenUrls = new Set();
  const duplicateIds = [];

  tabs.forEach(tab => {
    const url = tab.url || tab.pendingUrl;
    if (url && seenUrls.has(url)) {
      duplicateIds.push(tab.id);
    } else if (url) {
      seenUrls.add(url);
    }
  });

  if (duplicateIds.length > 0) {
    await chrome.tabs.remove(duplicateIds);
    showToast(`DEDUPE // PURGED [${duplicateIds.length}] DUPES`);
    await updateStats();
    await loadActiveNodes();
  } else {
    showToast("SYS_MSG // NO_DUPLICATES_FOUND");
  }
}

// 4. FOCUS_MODE (CMD_F)
async function activateFocusMode() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const activeTab = tabs.find(t => t.active);
  if (!activeTab) return;

  const tabsToClose = tabs.filter(t => t.id !== activeTab.id);
  if (tabsToClose.length === 0) return;

  const session = {
    id: Date.now(),
    name: `FOCUS_VAULT (${tabsToClose.length} NODES)`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    tabs: tabsToClose.map(t => ({ title: t.title || "Node", url: t.url || t.pendingUrl || "" }))
  };

  const { sessions = [] } = await chrome.storage.local.get("sessions");
  await chrome.storage.local.set({ sessions: [session, ...sessions] });

  await chrome.tabs.remove(tabsToClose.map(t => t.id));

  showToast("FOCUS_MODE // LOCKDOWN_SEALED");
  await updateStats();
  await loadActiveNodes();
  await loadSessions();
}

// 5. FREEZE_RAM (CMD_Z)
async function freeUpRam() {
  const tabs = await chrome.tabs.query({ currentWindow: true, active: false });
  let count = 0;

  for (const tab of tabs) {
    if (!tab.discarded && tab.url && !tab.url.startsWith("chrome://")) {
      try {
        await chrome.tabs.discard(tab.id);
        count++;
      } catch (e) {}
    }
  }

  showToast(`FREEZE_RAM // CRYO_STASIS [${count}] NODES`);
  await updateStats();
  await loadActiveNodes();
}

// 6. PARK_TAB (CMD_P)
async function saveCurrentTabForLater() {
  const [activeTab] = await chrome.tabs.query({ currentWindow: true, active: true });
  if (!activeTab || !activeTab.url) return;

  const newItem = {
    id: Date.now(),
    title: activeTab.title || "Node",
    url: activeTab.url
  };

  const { readLater = [] } = await chrome.storage.local.get("readLater");
  await chrome.storage.local.set({ readLater: [newItem, ...readLater] });

  await chrome.tabs.remove(activeTab.id);

  showToast("PARK_TAB // NODE_VAULTED");
  await updateStats();
  await loadActiveNodes();
  await loadLaterItems();
  
  // Automaticly change to LATER
  switchTab("tab-later");
}

// SAVE_NOW
async function saveCurrentSession() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const newSession = {
    id: Date.now(),
    name: `BUNKER_LOG (${tabs.length} NODES)`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    tabs: tabs.map(t => ({ title: t.title || "Node", url: t.url || t.pendingUrl || "" }))
  };

  const { sessions = [] } = await chrome.storage.local.get("sessions");
  await chrome.storage.local.set({ sessions: [newSession, ...sessions] });
  showToast("BUNKER_LOG // SAVED");
  await loadSessions();
}

// Loading Sessions in SAVED_tab
async function loadSessions() {
  const { sessions = [] } = await chrome.storage.local.get("sessions");
  const list = $("session-list");
  if (!list) return;

  list.innerHTML = "";
  if (sessions.length === 0) {
    list.innerHTML = `<li class="node-item"><span class="node-sub">NO_SAVED_LOGS</span></li>`;
    return;
  }

  sessions.forEach(item => {
    const li = document.createElement("li");
    li.className = "node-item";
    li.innerHTML = `
      <span class="node-title">${item.name}</span>
      <div class="item-btn-group">
        <button class="mini-btn btn-open">RESTORE</button>
        <button class="mini-btn btn-del">DEL</button>
      </div>
    `;

    li.querySelector(".btn-open").addEventListener("click", () => {
      item.tabs.forEach(t => { if (t.url) chrome.tabs.create({ url: t.url, active: false }); });
    });

    li.querySelector(".btn-del").addEventListener("click", async () => {
      const { sessions: current = [] } = await chrome.storage.local.get("sessions");
      const filtered = current.filter(s => s.id !== item.id);
      await chrome.storage.local.set({ sessions: filtered });
      showToast("LOG_DELETED");
      await loadSessions();
    });

    list.appendChild(li);
  });
}

// Loading Parked Sites in LATER tab
async function loadLaterItems() {
  const { readLater = [] } = await chrome.storage.local.get("readLater");
  const list = $("later-list");
  if (!list) return;

  list.innerHTML = "";
  if (readLater.length === 0) {
    list.innerHTML = `<li class="node-item"><span class="node-sub">VAULT_EMPTY</span></li>`;
    return;
  }

  readLater.forEach(item => {
    const li = document.createElement("li");
    li.className = "node-item";
    li.innerHTML = `
      <span class="node-title">${item.title}</span>
      <div class="item-btn-group">
        <button class="mini-btn btn-open">OPEN</button>
        <button class="mini-btn btn-del">DEL</button>
      </div>
    `;

    li.querySelector(".btn-open").addEventListener("click", async () => {
      chrome.tabs.create({ url: item.url });
      const { readLater: current = [] } = await chrome.storage.local.get("readLater");
      const filtered = current.filter(i => i.id !== item.id);
      await chrome.storage.local.set({ readLater: filtered });
      await loadLaterItems();
    });

    li.querySelector(".btn-del").addEventListener("click", async () => {
      const { readLater: current = [] } = await chrome.storage.local.get("readLater");
      const filtered = current.filter(i => i.id !== item.id);
      await chrome.storage.local.set({ readLater: filtered });
      showToast("VAULT_ITEM_DELETED");
      await loadLaterItems();
    });

    list.appendChild(li);
  });
}
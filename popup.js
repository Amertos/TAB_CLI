const $ = (id) => document.getElementById(id);

// If you are reading this, i will add more :) 
const DOMAIN_GROUPS = {
  "🤖 AI & Chat": ["chatgpt.com", "claude.ai", "gemini.google.com", "huggingface.co", "perplexity.ai", "poe.com", "character.ai", "meta.ai", "copilot.microsoft.com", "you.com"],
  "🎥 Media": ["youtube.com", "netflix.com", "spotify.com", "twitch.tv", "cineby.at", "hbomax.com", "primevideo.com", "disneyplus.com", "soundcloud.com", "vimeo.com", "9anime.to"],
  "💻 Dev": ["github.com", "gitlab.com", "stackoverflow.com", "localhost", "aistudio.google.com", "npmjs.com", "vercel.com", "netlify.app", "codesandbox.io", "replit.com", "supabase.com", "developer.mozilla.org", "bitbucket.org"],
  "📰 Social": ["x.com", "twitter.com", "reddit.com", "linkedin.com", "instagram.com", "facebook.com", "tiktok.com", "threads.net", "discord.com", "telegram.org"],
  "Design" : ["figma.com", "canva.com", "motionsites.ai", "dribbble.com", "behance.net", "coolors.co" ],
  "News" : ["sandzakpress.net", "bbc.com", "rts.rs", "n1info.rs", "danas.rs"],
  "🛒 Shopping": ["amazon.com", "aliexpress.com", "ebay.com", "temu.com", "kupujemprodajem.com"],
  "📚 Learning": ["udemy.com", "coursera.org", "edx.org", "khanacademy.org", "freecodecamp.org", "leetcode.com"],
  "🏦 Finance": ["paypal.com", "wise.com", "binance.com", "raiffeisenbank.rs", "revolut.com"],
  "☁️ Google": ["docs.google.com", "drive.google.com", "sheets.google.com", "mail.google.com", "calendar.google.com"],
  "Email": ["outlook.com", "gmail.com", "yahoo.com"]
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

  bindButton("btn-group", groupTabsByCategory);
  bindButton("btn-ungroup", ungroupAllTabs);
  bindButton("btn-focus", activateFocusMode);
  bindButton("btn-dedupe", removeDuplicateTabs);
  bindButton("btn-discard", freeUpRam);
  bindButton("btn-save-later", saveCurrentTabForLater);
  bindButton("btn-save-session", saveCurrentSession);

  await updateStats();
  await loadActiveNodes();
  await loadSessions();
  await loadLaterItems();
});

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

  document.querySelectorAll(".nav-btn").forEach(b => {
    b.classList.toggle("active", b.getAttribute("data-tab") === tabId);
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

  if (tabId === "tab-saved") loadSessions();
  if (tabId === "tab-later") loadLaterItems();
}

function showToast(msg) {
  const toast = $("toast");
  if (toast) toast.textContent = msg;
}

function bindButton(id, handler) {
  const el = $(id);
  if (!el) return;
  el.addEventListener("click", async () => {
    try {
      await handler();
    } catch (err) {
      console.error(`Greška [${id}]:`, err);
    }
  });
}

async function updateStats() {
  const tabs = await chrome.tabs.query({ currentWindow: true });

  const badge = $("tab-badge");
  if (badge) badge.textContent = tabs.length;

  const nodesBadge = $("nodes-count");
  if (nodesBadge) nodesBadge.textContent = tabs.length;

  let totalRamMb = 0;
  for (const tab of tabs) totalRamMb += estimateRam(tab);
  const totalRamGb = (totalRamMb / 1024).toFixed(1);

  const ramVal = $("ram-val");
  if (ramVal) ramVal.textContent = totalRamGb;

  const percent = Math.min(100, Math.round((totalRamMb / 3000) * 100));
  const activeBarsCount = Math.ceil((percent / 100) * 10);

  // led bars are just plain divs now, going off dom order instead of the old b1..b10 classes
  const bars = document.querySelectorAll(".led-meter .led-bar");
  bars.forEach((bar, idx) => {
    const position = bars.length - idx; // first bar in the markup = top = "10"
    bar.className = "led-bar";
    if (position <= activeBarsCount) {
      if (position >= 8) bar.classList.add("active", "alert");
      else if (position >= 5) bar.classList.add("active", "warn");
      else bar.classList.add("active");
    }
  });
}

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
    } catch (e) {
      // pending tabs / new tab page throw here, ignore
    }

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

// CMD_G
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
    if (tabIds.length === 0) continue;
    const groupId = await chrome.tabs.group({ tabIds });
    await chrome.tabGroups.update(groupId, {
      title,
      color: groupColors[colorIdx % groupColors.length]
    });
    colorIdx++;
    count++;
  }

  showToast(`CMD_EXEC // GROUPS_CREATED [${count}]`);
  await updateStats();
}

// CMD_U
async function ungroupAllTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const groupedTabIds = tabs.filter(t => t.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE).map(t => t.id);

  if (groupedTabIds.length === 0) {
    showToast("SYS_MSG // NO_GROUPS_FOUND");
    return;
  }

  await chrome.tabs.ungroup(groupedTabIds);
  showToast("CMD_EXEC // GROUPS_UNGROUPED");
}

// CMD_D
async function removeDuplicateTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const seenUrls = new Set();
  const duplicateIds = [];

  tabs.forEach(tab => {
    const url = tab.url || tab.pendingUrl;
    if (!url) return;
    if (seenUrls.has(url)) duplicateIds.push(tab.id);
    else seenUrls.add(url);
  });

  if (duplicateIds.length === 0) {
    showToast("SYS_MSG // NO_DUPLICATES_FOUND");
    return;
  }

  await chrome.tabs.remove(duplicateIds);
  showToast(`DEDUPE // PURGED [${duplicateIds.length}] DUPES`);
  await updateStats();
  await loadActiveNodes();
}

// CMD_F
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

// CMD_Z - discards background tabs, doesnt actually free JS memory til chrome feels like it
async function freeUpRam() {
  const tabs = await chrome.tabs.query({ currentWindow: true, active: false });
  let count = 0;

  for (const tab of tabs) {
    if (tab.discarded || !tab.url || tab.url.startsWith("chrome://")) continue;
    try {
      await chrome.tabs.discard(tab.id);
      count++;
    } catch (e) {
      // some tabs just refuse to discard, whatever
    }
  }

  showToast(`FREEZE_RAM // CRYO_STASIS [${count}] NODES`);
  await updateStats();
  await loadActiveNodes();
}

// CMD_P
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
  switchTab("tab-later");
}

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

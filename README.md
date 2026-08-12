<div align="center">

```text
  ████████╗ █████╗ ██████╗     ██████╗██╗     ██╗
  ╚══██╔══╝██╔══██╗██╔══██╗   ██╔════╝██║     ██║
     ██║   ███████║██████╔╝   ██║     ██║     ██║
     ██║   ██╔══██║██╔══██╗   ██║     ██║     ██║
     ██║   ██║  ██║██████╔╝   ╚██████╗███████╗██║
     ╚═╝   ╚═╝  ╚═╝╚═════╝     ╚═════╝╚══════╝╚═╝
           M N T - 9 9 - A L P H A   S Y S T E M
```

# ☢️ TAB_CLI // Tactical Survival System

**A Metro Exodus-inspired tactical command console for managing Chrome tab radiation and saving system RAM.**

[![Latest Release](https://img.shields.io/badge/Download-Latest_Release_.ZIP-10B981?style=for-the-badge&logo=github)](https://github.com/Amertos/TAB_CLI/releases)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest_V3-3B82F6?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge)](LICENSE)
[![Privacy: 100% Offline](https://img.shields.io/badge/Privacy-100%25_Offline-8B5CF6?style=for-the-badge)](#)

</div>

---

## 📌 Short Description

> **TAB_CLI** is a hardware-inspired Chrome Extension that turns tab clutter management into a post-apocalyptic tactical survival console. Auto-group tab leaks, trigger emergency Focus Mode airlocks, freeze RAM radiation in cryo-stasis, and vault tabs into long-term bunker storage.

---

## 📜 The Lore

In the digital post-apocalyptic wasteland, open browser tabs are **radioactive leaks** consuming your PC's precious life support (RAM). Left unmanaged, your system succumbs to memory overload.

`TAB_CLI MNT-99-ALPHA` is a hardware-grade tactical console mounted straight into your browser. It monitors your memory load like a Geiger counter, purges duplicate signal anomalies, seals airlocks in **Focus Lockdown**, and freezes inactive nodes into cryo-stasis.

---

## ⚡ Tactical Commands & Features

| Command Code | Tactical Button | Operation Description |
| :--- | :--- | :--- |
| **`CMD_G`** | `AUTO_GROUP` | Automatically clusters radioactive tabs by domain & category into native colored Chrome tab groups. |
| **`CMD_F`** | `FOCUS_MODE` | Emergency bunker lockdown. Saves all background nodes into the bunker log and seals all airlocks, leaving only your active tab. |
| **`CMD_D`** | `DEDUPE_EXE` | Purges duplicate node signals across the window to instantly reclaim wasted memory. |
| **`CMD_Z`** | `FREEZE_RAM` | Places inactive tabs into cryo-stasis (`chrome.tabs.discard`), freeing RAM while keeping tabs accessible. |
| **`CMD_P`** | `PARK_TAB` | Vaults the current tab into long-term bunker storage for later reading and closes the tab. |
| **`CMD_U`** | `UNGROUP` | Dissolves active tab group clusters back into single nodes. |

---

## 🛠️ System Architecture & UI Features

### 1. 📊 Vertical LED Memory Geiger Meter (`MEM_LOAD`)
* 10-bar LED tower updates in real-time.
* **Teal Green**: Optimal system operation (< 50% RAM load).
* **Amber Yellow**: Moderate memory stress (50% – 75% load).
* **Flashing Red Alert**: Critical radiation leak (> 80% RAM load).

### 2. 🖥️ Live Terminal Node Monitor (`SESSION_LOG // ACTIVE_NODES`)
* Lists all active nodes with domain subtext and estimated RAM consumption in MB.
* Quick-purge node killer (`✖`) allows manual single-tab execution straight from the terminal.

### 3. 📂 Bunker Vault & Session Persistence
* **SAVED Tab**: Store complete window session states into the local vault and restore them at any time.
* **LATER Tab**: Access parked tab vaults (`PARK_TAB`) to read later without clogging system resources.

### 4. 🔒 100% Offline & Private
* Zero external API calls, zero telemetry, zero analytics tracking.
* All data remains strictly inside your local Chrome storage (`chrome.storage.local`).

---

## 📥 Installation & Setup

### Method 1: Direct Download (GitHub Releases - Recommended)

1. Go to the **[GitHub Releases Page](https://github.com/Amertos/TAB_CLI/releases)**.
2. Download the latest `TAB_CLI.zip` archive under **Assets**.
3. Unzip the downloaded file onto your computer.
4. Open Chrome and navigate to `chrome://extensions/`.
5. Enable **Developer mode** in the top-right corner.
6. Click **Load unpacked** in the top-left corner and select the unzipped folder.

---

### Method 2: Clone via Git (For Developers)

```bash
# 1. Clone the repository
git clone https://github.com/Amertos/TAB_CLI.git

# 2. Open chrome://extensions/ in Chrome
# 3. Enable Developer Mode (top-right toggle)
# 4. Click "Load unpacked" and select the TAB_CLI folder
```

---

## 📁 Repository Structure

```text
TAB_CLI/
├── manifest.json       # Chrome Extension Manifest V3 configuration
├── popup.html          # Terminal console layout & DOM structure
├── popup.css           # Tactical 3D dark-mode Metro Exodus stylesheet
├── popup.js            # Engine logic, RAM calculation & Tab API bindings
├── background.js       # Background service worker & auto-sleep alarm
├── LICENSE             # MIT License
└── README.md           # Tactical System Documentation
```

---

## 🛡️ License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

<div align="center">
<sub>Engineered for tactical efficiency. Built with pure HTML5, CSS3, & Vanilla JavaScript.</sub>
</div>

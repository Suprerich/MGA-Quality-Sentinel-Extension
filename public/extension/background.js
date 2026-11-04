/* MGA Quality Sentinel - background.js (v1.4.3)
   Supports Side Panel, action popup, and opening Full Dashboard tab */
chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
  } catch (e) {}
});

chrome.runtime.onStartup && chrome.runtime.onStartup.addListener(() => {
  try {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
  } catch (e) {}
});

/* Open Dashboard message listener */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'QC_OPEN_DASHBOARD') {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    sendResponse({ ok: true });
  }
  return true;
});

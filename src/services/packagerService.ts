import JSZip from 'jszip';

export async function generateExtensionZip(): Promise<Blob> {
  const zip = new JSZip();

  // 1. manifest.json
  const manifest = {
    manifest_version: 3,
    name: 'MGA Quality Sentinel - Quality Monitoring Dashboard',
    version: '1.4.3',
    description: 'Enterprise quality monitoring extension for QA/QAE teams tracking ratings, consumer complaints, and defect risks across Walmart, Amazon, and Target.',
    permissions: [
      'activeTab',
      'tabs',
      'scripting',
      'downloads',
      'sidePanel',
      'storage'
    ],
    host_permissions: [
      'https://www.walmart.com/*',
      'https://www.walmart.ca/*',
      'https://www.amazon.com/*',
      'https://www.amazon.ca/*',
      'https://www.target.com/*'
    ],
    action: {
      default_title: 'MGA Quality Sentinel',
      default_popup: 'popup.html'
    },
    content_scripts: [
      {
        matches: [
          'https://www.walmart.com/*',
          'https://www.walmart.ca/*',
          'https://www.amazon.com/*',
          'https://www.amazon.ca/*',
          'https://www.target.com/*'
        ],
        js: [
          'content.js',
          'deep_review.js',
          'classification_v2.js'
        ],
        run_at: 'document_idle'
      }
    ],
    side_panel: {
      default_path: 'sidepanel.html'
    },
    background: {
      service_worker: 'background.js'
    }
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // 2. background.js
  const backgroundJs = `/* MGA Quality Sentinel - background.js (v1.4.3)
   Supports Side Panel, action popup, and opening Full Dashboard tab */
chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
  } catch (e) {}
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'QC_OPEN_DASHBOARD') {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    sendResponse({ ok: true });
  }
  return true;
});
`;
  zip.file('background.js', backgroundJs);

  // 3. fetch existing scripts from public/extension or bundle them
  // Let's bundle the scripts cleanly
  try {
    const fileNames = [
      'content.js',
      'deep_review.js',
      'classification_v2.js',
      'sku_core.js',
      'summary.js',
      'sku_validation.js',
      'trend_tracking.js',
      'popup.js',
      'sidepanel.js',
      'style.css',
      'sidepanel.css',
      'popup.html',
      'sidepanel.html'
    ];

    for (const fileName of fileNames) {
      try {
        const resp = await fetch(`/extension/${fileName}`);
        if (resp.ok) {
          const text = await resp.text();
          zip.file(fileName, text);
        }
      } catch (err) {
        console.warn('Could not fetch /extension/' + fileName, err);
      }
    }
  } catch (e) {
    // fallback
  }

  // 4. README_INSTALL.txt
  const readme = `========================================================================
MGA Quality Sentinel - Chrome & Microsoft Edge Installation Guide
========================================================================

COMPATIBILITY:
- Google Chrome (Version 114+)
- Microsoft Edge (Version 114+)
Manifest V3 architecture. No cloud database, no server, 100% Local-First.

QUICK INSTALLATION (Takes 30 seconds):
------------------------------------------------------------------------
1. Extract this entire zip archive to a local folder on your computer.
   (e.g., C:\\MGA_Quality_Sentinel or ~/Documents/MGA_Quality_Sentinel)

2. Open your Chromium browser:
   - For Google Chrome: Navigate to  chrome://extensions
   - For Microsoft Edge: Navigate to edge://extensions

3. Turn ON "Developer mode" toggle (usually at top right).

4. Click the "Load unpacked" button (top left).

5. Select the extracted folder containing "manifest.json".

6. Done! The MGA Quality Sentinel icon will appear in your browser toolbar.
   Click the puzzle icon to Pin it to your toolbar.

HOW TO USE:
------------------------------------------------------------------------
- Open any Walmart (US/CA), Amazon (US/CA), or Target search or product page.
- Click the MGA Sentinel icon in your toolbar.
- You can use the Quick Side Panel or open the Full Modern Dashboard!
`;
  zip.file('README_INSTALL.txt', readme);

  return await zip.generateAsync({ type: 'blob' });
}

export function downloadExtensionZip(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MGA_Quality_Sentinel_Extension_v1.4.3.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

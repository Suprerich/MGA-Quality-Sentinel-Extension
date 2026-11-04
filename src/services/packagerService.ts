import JSZip from 'jszip';

export async function generateExtensionZip(): Promise<Blob> {
  // 1. Try to fetch the pre-bundled complete zip from the server (has compiled index.html, assets, logo, content scripts)
  try {
    const response = await fetch('/mga-sentinel-extension.zip');
    if (response.ok) {
      const blob = await response.blob();
      if (blob.size > 50000) {
        return blob;
      }
    }
  } catch (err) {
    console.warn('Pre-bundled zip fetch failed, generating dynamically:', err);
  }

  // 2. Dynamic fallback packaging
  const zip = new JSZip();

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
      'https://www.target.com/*',
      'https://www.costco.com/*',
      'https://www.costco.ca/*',
      'https://*/*'
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
          'https://www.target.com/*',
          'https://www.costco.com/*',
          'https://www.costco.ca/*'
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
    },
    web_accessible_resources: [
      {
        resources: [
          'index.html',
          'assets/*',
          'content.js',
          'deep_review.js',
          'classification_v2.js'
        ],
        matches: ['<all_urls>']
      }
    ]
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  const backgroundJs = `/* MGA Quality Sentinel - background.js (v1.4.3) */
chrome.runtime.onInstalled.addListener(() => {
  try {
    if (chrome.sidePanel?.setPanelBehavior) {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
    }
  } catch (e) {}
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'QC_OPEN_DASHBOARD') {
    const url = chrome.runtime.getURL('index.html');
    chrome.tabs.create({ url });
    sendResponse({ ok: true, url });
  }
  return true;
});
`;
  zip.file('background.js', backgroundJs);

  // Fetch index.html
  try {
    const resp = await fetch('/index.html');
    if (resp.ok) {
      zip.file('index.html', await resp.text());
    }
  } catch (e) {}

  // Fetch extension scripts
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
        zip.file(fileName, await resp.text());
      }
    } catch (e) {}
  }

  const readme = `========================================================================
MGA Quality Sentinel - Chrome & Microsoft Edge Installation Guide
========================================================================

QUICK INSTALLATION:
1. Extract this entire zip file to a permanent folder on your computer.
2. Open Chrome (chrome://extensions) or Edge (edge://extensions).
3. Enable "Developer mode" in the top right.
4. Click "Load unpacked" and select the extracted folder.
5. Click the extension icon or "Open Full Quality Dashboard" to launch!
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

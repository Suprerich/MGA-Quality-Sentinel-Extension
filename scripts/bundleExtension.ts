import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function buildExtensionZip() {
  console.log('[Extension Packager] Creating complete Chromium Extension package...');
  const zip = new JSZip();

  const distDir = path.join(rootDir, 'dist');
  const publicExtDir = path.join(rootDir, 'public', 'extension');
  const publicAssetsDir = path.join(rootDir, 'public', 'assets');

  // 1. Enhanced Manifest V3
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
    },
    web_accessible_resources: [
      {
        resources: [
          'index.html',
          'assets/*',
          'assets/aistudio/*',
          'content.js',
          'deep_review.js',
          'classification_v2.js'
        ],
        matches: ['<all_urls>']
      }
    ]
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // 2. background.js
  const backgroundJs = `/* MGA Quality Sentinel - background.js (v1.4.3)
   Enterprise Chromium Extension Service Worker */

chrome.runtime.onInstalled.addListener(() => {
  try {
    if (chrome.sidePanel?.setPanelBehavior) {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
    }
  } catch (e) {}
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'QC_OPEN_DASHBOARD') {
    const dashboardUrl = chrome.runtime.getURL('index.html');
    chrome.tabs.create({ url: dashboardUrl });
    sendResponse({ ok: true, url: dashboardUrl });
    return true;
  }
  return true;
});
`;
  zip.file('background.js', backgroundJs);

  // 3. Include compiled dashboard index.html & assets/
  if (fs.existsSync(path.join(distDir, 'index.html'))) {
    const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
    zip.file('index.html', indexHtml);
    console.log('  -> Added compiled index.html');
  } else {
    console.warn('  ! dist/index.html not found, using root index.html');
    const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
    zip.file('index.html', indexHtml);
  }

  // Add all files from dist/assets into assets/
  const distAssetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(distAssetsDir)) {
    function addDirToZip(localDir: string, zipPrefix: string) {
      const items = fs.readdirSync(localDir);
      for (const item of items) {
        const fullPath = path.join(localDir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          addDirToZip(fullPath, `${zipPrefix}/${item}`);
        } else {
          const content = fs.readFileSync(fullPath);
          zip.file(`${zipPrefix}/${item}`, content);
        }
      }
    }
    addDirToZip(distAssetsDir, 'assets');
    console.log('  -> Added compiled assets/ bundle');
  }

  // 4. Include public extension scripts & html/css
  if (fs.existsSync(publicExtDir)) {
    const extFiles = fs.readdirSync(publicExtDir);
    for (const f of extFiles) {
      if (f === 'manifest.json' || f === 'background.js') continue; // Use updated ones
      const content = fs.readFileSync(path.join(publicExtDir, f));
      zip.file(f, content);
    }
    console.log(`  -> Added ${extFiles.length} original extension files (content.js, popup, sidepanel, etc.)`);
  }

  // 5. Include MGA logo in assets/aistudio/
  const logoSource = path.join(publicAssetsDir, 'aistudio', 'MGA_LOGO_6f40ad1b.png');
  if (fs.existsSync(logoSource)) {
    zip.file('assets/aistudio/MGA_LOGO_6f40ad1b.png', fs.readFileSync(logoSource));
  }

  // 6. Installation README
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

HOW TO OPEN THE FULL DASHBOARD:
------------------------------------------------------------------------
Method 1: Click the MGA extension icon in your toolbar, then click:
          "📊 Open Full Quality Dashboard ↗"
Method 2: Open a new tab and navigate to:
          chrome-extension://<EXTENSION_ID>/index.html
Method 3: Right-click page -> MGA Quality Sentinel Side Panel -> Open Full Dashboard.

Inside the Extension, Search & Scan has full native permissions to open
Walmart, Amazon, and Target tabs, scan ratings and reviews, and monitor trends!
`;
  zip.file('README_INSTALL.txt', readme);

  // Generate buffer and write to public/ & dist/
  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

  const targetPublicZip = path.join(rootDir, 'public', 'mga-sentinel-extension.zip');
  fs.writeFileSync(targetPublicZip, buffer);

  if (fs.existsSync(distDir)) {
    const targetDistZip = path.join(distDir, 'mga-sentinel-extension.zip');
    fs.writeFileSync(targetDistZip, buffer);
  }

  console.log(`[Extension Packager] Successfully generated ${targetPublicZip} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

buildExtensionZip().catch(console.error);

/* v1.2.0 - open the docked Side Panel when the toolbar icon is clicked. */
chrome.runtime.onInstalled.addListener(()=>{
  try{chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:true}).catch(()=>{});}catch(e){}
});
chrome.runtime.onStartup&&chrome.runtime.onStartup.addListener(()=>{
  try{chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:true}).catch(()=>{});}catch(e){}
});
/* Fallback: if setPanelBehavior unsupported, open panel manually on click. */
try{
  chrome.action.onClicked.addListener(async(tab)=>{
    try{await chrome.sidePanel.open({windowId:tab.windowId});}catch(e){}
  });
}catch(e){}

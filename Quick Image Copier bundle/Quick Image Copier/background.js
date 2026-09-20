// Create the right-click menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "copyImageExtension",
    title: "Copy Image Data",
    contexts: ["image"]
  });
});

// Send the image URL down to the content script on the page
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "copyImageExtension" && info.srcUrl) {
    chrome.tabs.sendMessage(tab.id, { 
      action: "copyImage", 
      url: info.srcUrl 
    }).catch(err => console.log("Content script not ready yet:", err));
  }
});

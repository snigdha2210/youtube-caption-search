// Listener for extension installed or updated events
chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Caption Search extension installed.');
});

// Listener to handle messages from popup.js or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getCaptions') {
    // Send a command to the content script to fetch captions
    chrome.tabs.sendMessage(
      sender.tab.id,
      { action: 'fetchCaptions' },
      (response) => {
        if (response && response.captions) {
          sendResponse({ captions: response.captions });
        } else {
          sendResponse({ captions: [] });
        }
      }
    );
    return true; // Indicates async response
  }
});

// Handle any action clicks or injected scripts
chrome.action.onClicked.addListener((tab) => {
  // Open popup if required or toggle some feature
  console.log('Extension action clicked on tab:', tab);
});
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.url.includes('youtube.com/watch')) {
    chrome.scripting.executeScript(
      {
        target: { tabId: details.tabId },
        files: ['content.js'],
      },
      () => {
        console.log(
          'Content script injected via webNavigation event:',
          details.url
        );
      }
    );
  }
});

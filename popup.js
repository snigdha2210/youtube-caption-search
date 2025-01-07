document
  .getElementById('search-bar')
  .addEventListener('input', async function () {
    const query = this.value.trim().toLowerCase();

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    console.log('query found:', query);
    if (!query) return;

    const captions = await getCaptions();
    const matches = captions.filter((cap) =>
      cap.text.toLowerCase().includes(query)
    );
    console.log('captions found:', captions);
    console.log('Matches found:', matches);

    if (matches.length === 0) {
      resultsDiv.textContent = 'No matches found.';
      return;
    }

    matches.forEach((match) => {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'result';
      resultDiv.textContent = `${formatTime(match.start)} - ${match.text}`;
      resultDiv.addEventListener('click', () => {
        snapToTimestamp(match.start);
      });
      resultsDiv.appendChild(resultDiv);
    });
  });

async function getCaptions() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) {
        console.error('No active tab found.');
        resolve([]);
        return;
      }

      console.log('Sending message to content script...');
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'fetchCaptions' },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              'Error communicating with content script:',
              chrome.runtime.lastError.message
            );
            resolve([]);
            return;
          }
          console.log('Response from content script:', response);
          resolve(response?.captions || []);
        }
      );
    });
  });
}

function snapToTimestamp(timestamp) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: (time) => {
        const video = document.querySelector('video');
        if (video) video.currentTime = time;
      },
      args: [timestamp],
    });
  });
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}

document.addEventListener('DOMContentLoaded', () => {
  const searchBar = document.getElementById('search-bar');
  const searchIcon = document.getElementById('search-icon');
  const resultsDiv = document.getElementById('results');

  // Event listener for 'Enter' key press
  searchBar.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      await performSearch(searchBar.value.trim());
    }
  });

  // Event listener for search icon click
  searchIcon.addEventListener('click', async () => {
    await performSearch(searchBar.value.trim());
  });

  // Function to perform the search
  async function performSearch(query) {
    resultsDiv.innerHTML = '';
    if (!query) return;

    console.log('Searching for:', query);

    const captions = await getCaptions();
    const matches = captions.filter((cap) =>
      cap.text.toLowerCase().includes(query.toLowerCase())
    );

    console.log('Matches found:', matches);

    if (matches.length === 0) {
      resultsDiv.textContent = 'No matches found.';
      return;
    }

    matches.forEach((match) => {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'result';
      resultDiv.textContent = `${formatTime(
        match.start
      )} - ${decodeHtmlEntitiesRecursively(match.text)}`;
      //   resultDiv.textContent = `${formatTime(match.start)} - ${match.text}`;
      resultDiv.addEventListener('click', () => {
        snapToTimestamp(match.start);
      });
      resultsDiv.appendChild(resultDiv);
    });
  }

  // Helper functions

  // Function to decode HTML entities
  function decodeHtmlEntitiesRecursively(text) {
    if (!text) return text;

    const parser = new DOMParser();
    let decodedText = text;

    // Decode repeatedly until there are no more entities
    while (decodedText.includes('&')) {
      const doc = parser.parseFromString(decodedText, 'text/html');
      const newText = doc.documentElement.textContent || decodedText;

      // Break if no further decoding happens
      if (newText === decodedText) break;
      decodedText = newText;
    }

    return decodedText;
  }

  //   function decodeHtmlEntities(text) {
  //     // Check if the text contains any HTML entities
  //     if (!text || !text.includes('&')) return text;

  //     const parser = new DOMParser();
  //     const doc = parser.parseFromString(text, 'text/html');
  //     return doc.documentElement.textContent || text;
  //   }

  async function getCaptions() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]) {
          console.error('No active tab found.');
          resolve([]);
          return;
        }

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
});

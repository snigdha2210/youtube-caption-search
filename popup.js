document
  .getElementById('search-bar')
  .addEventListener('input', async function () {
    const query = this.value.trim().toLowerCase();
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    if (!query) return;

    const captions = await getCaptions(); // Fetch captions dynamically
    const matches = captions.filter((cap) =>
      cap.text.toLowerCase().includes(query)
    );

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
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: fetchCaptions,
        },
        (results) => {
          resolve(results[0].result || []);
        }
      );
    });
  });
}

function fetchCaptions() {
  const captions = [];
  const tracks = document.querySelectorAll('track');
  tracks.forEach((track) => {
    if (track.kind === 'subtitles') {
      const cues = track.track.cues;
      if (cues) {
        Array.from(cues).forEach((cue) => {
          captions.push({
            start: cue.startTime,
            end: cue.endTime,
            text: cue.text,
          });
        });
      }
    }
  });
  return captions;
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

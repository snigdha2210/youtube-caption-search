const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

// Regular expressions for parsing transcript and video ID
const RE_XML_TRANSCRIPT =
  /<text start="([\d.]+)" dur="([\d.]+)">(.+?)<\/text>/g;
const RE_YOUTUBE = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]+)/;

/**
 * Retrieve video ID from a URL or video ID string.
 * @param {string} videoId - The YouTube video URL or ID.
 * @returns {string} - The YouTube video ID.
 */
function retrieveVideoId(videoId) {
  if (videoId.length === 11) {
    return videoId;
  }
  const matchId = videoId.match(RE_YOUTUBE);
  if (matchId && matchId.length) {
    return matchId[1];
  }
  throw new Error('Unable to retrieve YouTube video ID.');
}

/**
 * Fetch transcript for a YouTube video.
 * @param {string} videoId - The YouTube video URL or ID.
 * @param {Object} [config] - Configuration object (e.g., language).
 * @param {string} [config.lang] - Language code (ISO).
 * @returns {Promise<Array>} - Parsed transcript entries.
 */
async function fetchTranscript(videoId, config) {
  const identifier = retrieveVideoId(videoId);

  // Fetch the YouTube video page
  const videoPageResponse = await fetch(
    `https://www.youtube.com/watch?v=${identifier}`,
    {
      headers: {
        ...(config?.lang && { 'Accept-Language': config.lang }),
        'User-Agent': USER_AGENT,
      },
    }
  );

  const videoPageBody = await videoPageResponse.text();
  const splittedHTML = videoPageBody.split('"captions":');
  if (splittedHTML.length <= 1) {
    throw new Error('Captions are unavailable for this video.');
  }

  // Extract captions data
  const captions = (() => {
    try {
      return JSON.parse(
        splittedHTML[1].split(',"videoDetails')[0].replace('\n', '')
      );
    } catch (e) {
      throw new Error('Failed to parse captions data.');
    }
  })()?.playerCaptionsTracklistRenderer;

  if (!captions || !('captionTracks' in captions)) {
    throw new Error('Captions are unavailable or disabled for this video.');
  }

  // Find the appropriate transcript URL
  const transcriptURL =
    config?.lang &&
    captions.captionTracks.some((track) => track.languageCode === config.lang)
      ? captions.captionTracks.find(
          (track) => track.languageCode === config.lang
        ).baseUrl
      : captions.captionTracks[0].baseUrl;

  // Fetch and parse the transcript
  const transcriptResponse = await fetch(transcriptURL, {
    headers: {
      ...(config?.lang && { 'Accept-Language': config.lang }),
      'User-Agent': USER_AGENT,
    },
  });

  const transcriptBody = await transcriptResponse.text();
  const results = [...transcriptBody.matchAll(RE_XML_TRANSCRIPT)];

  // Return parsed transcript entries
  return results.map((result) => ({
    text: result[3],
    duration: parseFloat(result[2]),
    start: parseFloat(result[1]),
    lang: config?.lang || captions.captionTracks[0].languageCode,
  }));
}

/**
 * Listener to handle messages from the popup.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fetchCaptions') {
    const videoId = window.location.href;

    fetchTranscript(videoId, { lang: 'en' })
      .then((captions) => {
        console.log('Captions fetched:', captions);
        sendResponse({ captions });
      })
      .catch((error) => {
        console.error('Error fetching captions:', error);
        sendResponse({ captions: [] });
      });

    return true; // Indicates asynchronous response
  }
});
// console.log('Content script loaded on:', window.location.href);
// if (!window.contentScriptLoaded) {
//   window.contentScriptLoaded = true;

//   console.log('Content script loaded on:', window.location.href);

//   // Observer to detect changes in the DOM
//   const observer = new MutationObserver(() => {
//     const trackElements = document.querySelectorAll('track');
//     if (trackElements.length > 0) {
//       console.log('Tracks detected:', trackElements);
//       observer.disconnect(); // Stop observing once tracks are found
//     }
//   });

//   observer.observe(document.body, { childList: true, subtree: true });
// }
// async function fetchTranscript() {
//   console.log('Attempting to fetch transcript via YouTube API...');

//   // Extract the video ID from the URL
//   const videoId = new URLSearchParams(window.location.search).get('v');
//   if (!videoId) {
//     console.error('No video ID found in URL.');
//     return [];
//   }

//   try {
//     // Call YouTube's transcript API
//     const response = await fetch(
//       `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`
//     );
//     if (!response.ok) {
//       console.error('Failed to fetch transcript:', response.status);
//       return [];
//     }

//     const text = await response.text();

//     // Parse the XML response
//     const parser = new DOMParser();
//     const xml = parser.parseFromString(text, 'application/xml');
//     const transcript = Array.from(xml.getElementsByTagName('text')).map(
//       (node) => ({
//         start: parseFloat(node.getAttribute('start')),
//         duration: parseFloat(node.getAttribute('dur')),
//         text: node.textContent,
//       })
//     );

//     console.log('Transcript fetched:', transcript);
//     return transcript;
//   } catch (error) {
//     console.error('Error fetching transcript:', error);
//     return [];
//   }
// }

// async function fetchCaptions() {
//   console.log('fetchCaptions function called');

//   const captions = [];
//   const trackElements = document.querySelectorAll('track');

//   if (trackElements.length > 0) {
//     console.log('Tracks detected:', trackElements);

//     trackElements.forEach((track) => {
//       if (track.kind === 'subtitles' || track.kind === 'captions') {
//         const cues = track.track?.cues;
//         if (cues) {
//           Array.from(cues).forEach((cue) => {
//             captions.push({
//               start: cue.startTime,
//               end: cue.endTime,
//               text: cue.text,
//             });
//           });
//         }
//       }
//     });

//     console.log('Captions fetched from <track> elements:', captions);
//     return captions;
//   } else {
//     console.log('No <track> elements found. Falling back to YouTube API...');
//     const transcript = await fetchTranscript();
//     return transcript;
//   }
// }

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === 'fetchCaptions') {
//     const captions = fetchCaptions();
//     console.log('Captions sent to popup:', captions);
//     sendResponse({ captions });
//   }
// });

// // // Ensure captions are fetched when present
// // const observer = new MutationObserver(() => {
// //   const trackElements = document.querySelectorAll('track');
// //   if (trackElements.length > 0) {
// //     console.log('Tracks detected:', trackElements);
// //     observer.disconnect(); // Stop observing once tracks are found
// //   }
// // });

// // observer.observe(document.body, { childList: true, subtree: true });

// // function fetchCaptions() {
// //   console.log('fetch function called');
// //   const captions = [];
// //   const trackElements = document.querySelectorAll('track');

// //   trackElements.forEach((track) => {
// //     if (track.kind === 'subtitles' || track.kind === 'captions') {
// //       const cues = track.track?.cues;
// //       if (cues) {
// //         Array.from(cues).forEach((cue) => {
// //           captions.push({
// //             start: cue.startTime,
// //             end: cue.endTime,
// //             text: cue.text,
// //           });
// //         });
// //       }
// //     }
// //   });

// //   console.log('Captions fetched:', captions);
// //   return captions;
// // }

// // chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
// //   if (message.action === 'fetchCaptions') {
// //     const captions = fetchCaptions();
// //     console.log('Captions sent to popup:', captions);
// //     sendResponse({ captions });
// //   }
// // });

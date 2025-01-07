const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

// Regular expressions for parsing transcript and video ID
const RE_XML_TRANSCRIPT =
  /<text start="([\d.]+)" dur="([\d.]+)">(.+?)<\/text>/g;
const RE_YOUTUBE = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]+)/;

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

# **YouTube Caption Search Chrome Extension**

A Chrome extension that allows users to search through captions of YouTube videos and jump directly to the corresponding timestamp. This extension supports decoding HTML entities in captions, making them human-readable, and offers a clean and user-friendly interface.

---

## **Features**

- Search captions by keywords.
- Navigate directly to the video timestamp of the matched caption.
- Decode and display HTML entities (e.g., `&amp;`, `&#39;`) as human-readable text.
- Trigger searches by pressing `Enter` or clicking a search icon.
- Works with both user-provided captions and auto-generated transcripts.

---

## **Installation**

### **1. Clone or Download the Repository**

```bash
git clone https://github.com/yourusername/youtube-caption-search.git
cd youtube-caption-search
```

### **2. Load the Extension in Chrome**

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** and select the project directory.

---

## **Usage**

1. Open any YouTube video with captions or transcripts enabled.
2. Click the extension icon in the Chrome toolbar to open the popup.
3. Enter a keyword in the search bar and press `Enter` or click the search icon.
4. View the matching captions in the popup.
5. Click on any caption to jump to its corresponding timestamp in the video.

---

## **Project Structure**

```
youtube-caption-search/
├── manifest.json          # Chrome extension manifest file
├── popup.html             # HTML structure for the extension popup
├── popup.js               # Handles search functionality and UI interactions
├── content.js             # Fetches captions and communicates with YouTube's DOM
├── README.md              # Project documentation
```

---

## **Technical Details**

### **1. Fetching Captions**

- **Track-Based Captions**: The extension uses `<track>` elements in the YouTube DOM for videos with subtitles.
- **Transcript API**: If no `<track>` elements are found, the extension fetches captions via YouTube’s transcript API.

### **2. HTML Entity Decoding**

- Captions containing HTML entities (e.g., `&amp;`, `&#39;`) are decoded using a recursive DOM parser.

### **3. Communication**

- The extension uses `chrome.runtime.onMessage` and `chrome.tabs.sendMessage` for communication between the popup and the content script.

---

## **Customization**

- **Default Language**: To change the language used in the transcript API, modify the `lang` parameter in `content.js`:

  ```javascript
  fetchTranscript(videoId, { lang: 'en' });
  ```

---

## **Limitations**

1. Only works with videos that have captions or auto-generated transcripts available.
2. The accuracy of captions depends on YouTube’s transcription.

---

## **Future Enhancements**

- Support for searching captions across multiple languages.
- Add keyboard shortcuts for improved usability.
- Highlight the matched text in the captions for better visibility.

---

## **Acknowledgments**

- [YouTube Transcript API](https://www.youtube.com/) for providing transcript data.
- The Chrome Extensions API documentation for guidance.

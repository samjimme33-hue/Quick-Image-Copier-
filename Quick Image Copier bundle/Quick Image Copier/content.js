chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "copyImage") {
    try {
      const response = await fetch(message.url);
      const blob = await response.blob();

      let mimeType = blob.type;
      if (!mimeType.includes('png') && !mimeType.includes('jpeg') && !mimeType.includes('gif')) {
        mimeType = 'image/png';
      }

      await navigator.clipboard.write([
        new ClipboardItem({ [mimeType]: blob })
      ]);
      
      // SUCCESS: Save image url to history storage
      saveToHistory(message.url);
      console.log("Copied and saved to history UI!");
      
    } catch (error) {
      // Fallback: draw to canvas if direct fetch is blocked by cross-origin policies
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = message.url;
        img.onload = function () {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob(async (fallbackBlob) => {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": fallbackBlob })
            ]);
            
            // Convert to dataUrl to safely save locally
            const fallbackUrl = canvas.toDataURL("image/png");
            saveToHistory(fallbackUrl);
            console.log("Copied via canvas fallback and saved to history UI!");
          }, "image/png");
        };
      } catch (canvasErr) {
        alert("Unable to copy this specific image due to website security policies.");
      }
    }
  }
});

// Helper function to save items to Chrome local storage (limits to last 15 items)
async function saveToHistory(urlItem) {
  const data = await chrome.storage.local.get({ imageHistory: [] });
  let currentHistory = data.imageHistory;
  
  currentHistory.push(urlItem);
  
  // Cap at 15 items so it doesn't take up too much browser memory
  if (currentHistory.length > 15) {
    currentHistory.shift(); 
  }
  
  await chrome.storage.local.set({ imageHistory: currentHistory });
}

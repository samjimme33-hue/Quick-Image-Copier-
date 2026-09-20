document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('history-list');
  const emptyState = document.getElementById('empty-state');
  const clearBtn = document.getElementById('clear-all');
  const downloadBtn = document.getElementById('download-all');

  // Load saved images from extension storage
  const data = await chrome.storage.local.get({ imageHistory: [] });
  let history = data.imageHistory;

  if (history.length === 0) {
    downloadBtn.style.display = 'none';
    clearBtn.style.display = 'none';
  } else {
    emptyState.style.display = 'none';
    
    // Loop backward so newest copies show up first
    for (let i = history.length - 1; i >= 0; i--) {
      const imageUrl = history[i];
      const originalIndex = i;

      const card = document.createElement('div');
      card.className = 'image-card';
      card.title = "Click to re-copy image";
      
      const img = document.createElement('img');
      img.src = imageUrl;
      card.appendChild(img);
      
      // 1. Mini download button overlay
      const singleDlBtn = document.createElement('button');
      singleDlBtn.className = 'download-single-btn';
      singleDlBtn.innerHTML = '↓';
      singleDlBtn.title = 'Download';
      card.appendChild(singleDlBtn);

      singleDlBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        chrome.downloads.download({
          url: imageUrl,
          filename: `saved_photo_${originalIndex + 1}.png`,
          conflictAction: 'uniquify'
        });
      });

      // 2. Mini remove button overlay
      const singleRmBtn = document.createElement('button');
      singleRmBtn.className = 'remove-single-btn';
      singleRmBtn.innerHTML = '✕';
      singleRmBtn.title = 'Remove';
      card.appendChild(singleRmBtn);

      singleRmBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        history.splice(originalIndex, 1);
        await chrome.storage.local.set({ imageHistory: history });
        window.location.reload();
      });
      
      // Card click to re-copy mechanism
      card.addEventListener('click', async () => {
        try {
          const res = await fetch(imageUrl);
          const blob = await res.blob();
          await navigator.clipboard.write([
            new ClipboardItem({ [blob.type]: blob })
          ]);
          
          card.style.outline = "1.5px solid #22c55e";
          setTimeout(() => card.style.outline = "none", 400);
        } catch (err) {
          console.error("Failed to re-copy image:", err);
        }
      });
      
      container.appendChild(card);
    }
  }

  // Master total file download execution
  downloadBtn.addEventListener('click', () => {
    history.forEach((url, index) => {
      chrome.downloads.download({
        url: url,
        filename: `copied_photo_${index + 1}.png`,
        conflictAction: 'uniquify'
      });
    });
  });

  // Full clean reset utility loop
  clearBtn.addEventListener('click', async () => {
    await chrome.storage.local.set({ imageHistory: [] });
    window.location.reload();
  });
});

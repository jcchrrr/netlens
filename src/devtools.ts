// Create the NetLens panel in Chrome DevTools
chrome.devtools.panels.create(
  "NetLens", // Panel title
  "", // Icon path (empty for now)
  "src/panel/index.html", // Panel HTML page
  (panel) => {
    // Panel created callback
    console.log("NetLens panel created", panel);
  }
);

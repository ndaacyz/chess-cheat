let engine = null;
let currentTab = null;

// INIT ENGINE
function initEngine() {
  engine = new Worker(chrome.runtime.getURL("stockfish.js"));

  engine.postMessage("uci");

  engine.onmessage = (e) => {
    const line = e.data;

    if (typeof line !== "string") return;

    console.log("SF:", line);

    if (line.startsWith("bestmove")) {
      const move = line.split(" ")[1];

      if (currentTab) {
        chrome.tabs.sendMessage(currentTab, {
          type: "bestmove",
          move: move
        });
      }
    }
  };
}

// TERIMA FEN DARI CONTENT
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "analyze") {
    currentTab = sender.tab.id;

    if (!engine) initEngine();

    engine.postMessage("stop");
    engine.postMessage("position fen " + msg.fen);
    engine.postMessage("go depth 12");
  }
});

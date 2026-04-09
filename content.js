let engine = null;
let currentFen = null;

// ======================
// INIT STOCKFISH
// ======================
function initEngine() {
  engine = new Worker(chrome.runtime.getURL("stockfish.js"));

  engine.onmessage = function (event) {
    const line = event.data;

    if (typeof line !== "string") return;

    if (line.startsWith("bestmove")) {
      const move = line.split(" ")[1];
      handleBestMove(move);
    }
  };

  engine.postMessage("uci");
}

// ======================
// ANALYZE POSITION
// ======================
function analyzePosition(fen) {
  if (!engine) return;

  engine.postMessage("stop");
  engine.postMessage("position fen " + fen);
  engine.postMessage("go depth 12");
}

// ======================
// HANDLE BEST MOVE
// ======================
function handleBestMove(move) {
  if (!move || move.length < 4) return;

  const from = move.substring(0, 2);
  const to = move.substring(2, 4);

  drawArrow(from, to);
}

// ======================
// WATCH BOARD (AUTO)
// ======================
function watchBoard() {
  const board = document.querySelector("cg-board");
  if (!board) return;

  const observer = new MutationObserver(() => {
    const fen = board.getAttribute("data-fen");

    if (fen && fen !== currentFen) {
      currentFen = fen;
      analyzePosition(fen);
    }
  });

  observer.observe(board, {
    attributes: true,
    attributeFilter: ["data-fen"]
  });
}

// ======================
// DRAW ARROW
// ======================
function drawArrow(from, to) {
  const board = document.querySelector("cg-board");
  if (!board) return;

  const old = document.getElementById("sf-arrow");
  if (old) old.remove();

  const rect = board.getBoundingClientRect();
  const size = rect.width / 8;

  const flipped = board.classList.contains("orientation-black");

  function pos(square) {
    let file = square.charCodeAt(0) - 97;
    let rank = parseInt(square[1]) - 1;

    if (!flipped) {
      rank = 7 - rank;
    } else {
      file = 7 - file;
    }

    return {
      x: file * size + size / 2,
      y: rank * size + size / 2
    };
  }

  const a = pos(from);
  const b = pos(to);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "sf-arrow";

  Object.assign(svg.style, {
    position: "fixed",
    top: rect.top + "px",
    left: rect.left + "px",
    width: rect.width + "px",
    height: rect.height + "px",
    pointerEvents: "none",
    zIndex: 9999
  });

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

  const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
  marker.setAttribute("id", "arrowhead");
  marker.setAttribute("markerWidth", "10");
  marker.setAttribute("markerHeight", "7");
  marker.setAttribute("refX", "10");
  marker.setAttribute("refY", "3.5");
  marker.setAttribute("orient", "auto");

  const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
  polygon.setAttribute("fill", "lime");

  marker.appendChild(polygon);
  defs.appendChild(marker);

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", a.x);
  line.setAttribute("y1", a.y);
  line.setAttribute("x2", b.x);
  line.setAttribute("y2", b.y);
  line.setAttribute("stroke", "lime");
  line.setAttribute("stroke-width", "6");
  line.setAttribute("marker-end", "url(#arrowhead)");

  svg.appendChild(defs);
  svg.appendChild(line);

  document.body.appendChild(svg);
}

// ======================
// START
// ======================
window.addEventListener("load", () => {
  setTimeout(() => {
    initEngine();
    watchBoard();
  }, 2000);
});

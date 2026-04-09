let currentFen = null;

// ======================
// KIRIM FEN KE BACKGROUND
// ======================
function analyzePosition(fen) {
  chrome.runtime.sendMessage({
    type: "analyze",
    fen: fen
  });
}

// ======================
// TERIMA BEST MOVE
// ======================
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "bestmove") {
    const move = msg.move;

    if (!move || move.length < 4) return;

    const from = move.substring(0, 2);
    const to = move.substring(2, 4);

    drawArrow(from, to);
  }
});

// ======================
// WATCH BOARD
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
// WAIT BOARD
// ======================
function waitBoard() {
  const interval = setInterval(() => {
    const board = document.querySelector("cg-board");

    if (board) {
      clearInterval(interval);
      console.log("Board ready ✅");
      watchBoard();
    }
  }, 1000);
}

// ======================
// DRAW ARROW (FIXED)
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
    position: "absolute",
    top: board.offsetTop + "px",
    left: board.offsetLeft + "px",
    width: board.offsetWidth + "px",
    height: board.offsetHeight + "px",
    pointerEvents: "none",
    zIndex: 99999
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
  line.setAttribute("stroke-width", "8");
  line.setAttribute("marker-end", "url(#arrowhead)");

  svg.appendChild(defs);
  svg.appendChild(line);

  board.parentElement.appendChild(svg);
}

// ======================
// START
// ======================
window.addEventListener("load", () => {
  setTimeout(() => {
    waitBoard();
  }, 2000);
});

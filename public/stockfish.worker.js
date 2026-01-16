// Web Worker for Stockfish integration
// Using stockfish.js for web compatibility
importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.min.js');

let stockfish = null;
let isReady = false;
let currentFen = '';

self.onmessage = function(e) {
  const { type, data } = e.data;

  switch (type) {
    case 'init':
      initStockfish();
      break;
    case 'set_position':
      currentFen = data.fen;
      setPosition(data.fen);
      break;
    case 'get_best_move':
      getBestMove(data.time || 1000);
      break;
    case 'quit':
      if (stockfish) {
        stockfish.postMessage('quit');
      }
      self.close();
      break;
  }
};

function initStockfish() {
  if (typeof Stockfish === 'function') {
    stockfish = Stockfish();

    stockfish.onmessage = function(e) {
      const message = e.data || e;

      if (message === 'readyok') {
        isReady = true;
        self.postMessage({ type: 'ready' });
      } else if (message.startsWith('bestmove')) {
        // Parse best move from "bestmove e2e4 ponder e7e5"
        const parts = message.split(' ');
        const move = parts[1];
        self.postMessage({ type: 'best_move', move: move });
      }
    };

    // Initialize Stockfish
    stockfish.postMessage('uci');
    stockfish.postMessage('isready');
  } else {
    console.error('Stockfish not available');
    self.postMessage({ type: 'error', message: 'Stockfish not loaded' });
  }
}

function setPosition(fen) {
  if (!isReady || !stockfish) return;

  stockfish.postMessage(`position fen ${fen}`);
}

function getBestMove(time = 1000) {
  if (!isReady || !stockfish) {
    self.postMessage({ type: 'best_move', move: null });
    return;
  }

  stockfish.postMessage(`go movetime ${time}`);
}

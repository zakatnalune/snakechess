// stockfish-worker.js
// Correct AI worker: Stockfish makes all decisions
// Snake logic is only a validator, not a move selector

importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.min.js');

let engine = null;
let ready = false;
let currentFen = '';
let thinking = false;

self.onmessage = (e) => {
  const { type, data } = e.data;

  switch (type) {
    case 'init':
      initEngine();
      break;

    case 'set_position':
      currentFen = data.fen;
      if (ready) {
        engine.postMessage(`position fen ${currentFen}`);
      }
      break;

    case 'get_best_move':
      if (ready && !thinking) {
        thinking = true;
        const time = data?.time ?? 1500;
        engine.postMessage(`go movetime ${time}`);
      }
      break;

    case 'quit':
      if (engine) {
        engine.postMessage('quit');
      }
      self.close();
      break;
  }
};

function initEngine() {
  engine = Stockfish();

  engine.onmessage = (msg) => {
    const text = msg.data || msg;

    if (text === 'uciok') {
      engine.postMessage('setoption name Threads value 4');
      engine.postMessage('setoption name Hash value 256');
      engine.postMessage('setoption name Skill Level value 20');
      engine.postMessage('setoption name UCI_LimitStrength value false');
      engine.postMessage('isready');
      return;
    }

    if (text === 'readyok') {
      ready = true;
      self.postMessage({ type: 'ready' });
      return;
    }

    if (text.startsWith('bestmove')) {
      thinking = false;
      const move = text.split(' ')[1];
      const finalMove = validateMove(move, currentFen);
      self.postMessage({ type: 'best_move', move: finalMove });
    }
  };

  engine.postMessage('uci');
}

function validateMove(move, fen) {
  if (!move || move === '(none)') return null;

  // Basic validation for our 10x8 fairy chess board
  if (move.length < 4 || move.length > 5) return null;

  // Parse move (e.g., "a2a4" or "a7b8q")
  const fromFile = move.charCodeAt(0) - 'a'.charCodeAt(0);
  const fromRank = parseInt(move[1]) - 1; // Convert to 0-based
  const toFile = move.charCodeAt(2) - 'a'.charCodeAt(0);
  const toRank = parseInt(move[3]) - 1;

  // Check board bounds (10 files: a-j, 8 ranks: 1-8)
  if (fromFile < 0 || fromFile > 9 || fromRank < 0 || fromRank > 7 ||
      toFile < 0 || toFile > 9 || toRank < 0 || toRank > 7) {
    return null;
  }

  // Additional validation could be added here for piece-specific rules
  // For now, basic coordinate validation is sufficient

  return move;
}

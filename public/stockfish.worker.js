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
  console.log('Worker received message:', type, data);

  switch (type) {
    case 'init':
      console.log('Initializing Stockfish engine');
      initEngine();
      break;

    case 'set_position':
      currentFen = data.fen;
      console.log('Setting position:', currentFen);
      if (ready) {
        engine.postMessage(`position fen ${currentFen}`);
      } else {
        console.log('Engine not ready yet');
      }
      break;

    case 'get_best_move':
      console.log('Requesting best move, ready:', ready, 'thinking:', thinking);
      if (ready && !thinking) {
        thinking = true;
        const time = data?.time ?? 1500;
        console.log('Sending go command with time:', time);
        engine.postMessage(`go movetime ${time}`);
      } else {
        console.log('Cannot request move: ready=', ready, 'thinking=', thinking);
        self.postMessage({ type: 'best_move', move: null });
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
  console.log('Creating Stockfish engine');
  engine = Stockfish();
  console.log('Stockfish engine created:', !!engine);

  engine.onmessage = (msg) => {
    const text = msg.data || msg;
    console.log('Stockfish message:', text);

    if (text === 'uciok') {
      console.log('UCI ok, setting options');
      engine.postMessage('setoption name Threads value 4');
      engine.postMessage('setoption name Hash value 256');
      engine.postMessage('setoption name Skill Level value 20');
      engine.postMessage('setoption name UCI_LimitStrength value false');
      engine.postMessage('isready');
      return;
    }

    if (text === 'readyok') {
      console.log('Engine ready');
      ready = true;
      self.postMessage({ type: 'ready' });
      return;
    }

    if (text.startsWith('bestmove')) {
      console.log('Received bestmove:', text);
      thinking = false;
      const move = text.split(' ')[1];
      console.log('Parsed move:', move);
      const finalMove = validateMove(move, currentFen);
      console.log('Validated move:', finalMove);
      self.postMessage({ type: 'best_move', move: finalMove });
    }
  };

  engine.postMessage('uci');
}

function validateMove(move, fen) {
  console.log('Validating move:', move, 'for FEN:', fen);

  if (!move || move === '(none)') {
    console.log('Move is null or none');
    return null;
  }

  // Basic validation for our 10x8 fairy chess board
  if (move.length < 4 || move.length > 5) {
    console.log('Invalid move length:', move.length);
    return null;
  }

  // Parse move (e.g., "a2a4" or "a7b8q")
  const fromFile = move.charCodeAt(0) - 'a'.charCodeAt(0);
  const fromRank = parseInt(move[1]) - 1; // Convert to 0-based
  const toFile = move.charCodeAt(2) - 'a'.charCodeAt(0);
  const toRank = parseInt(move[3]) - 1;

  console.log('Parsed coordinates:', {fromFile, fromRank, toFile, toRank});

  // Check board bounds (10 files: a-j, 8 ranks: 1-8)
  if (fromFile < 0 || fromFile > 9 || fromRank < 0 || fromRank > 7 ||
      toFile < 0 || toFile > 9 || toRank < 0 || toRank > 7) {
    console.log('Move out of bounds');
    return null;
  }

  console.log('Move validation passed');
  return move;
}

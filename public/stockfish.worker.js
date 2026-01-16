// Web Worker for enhanced Stockfish with snake evaluation
// Using stockfish.js with custom fairy chess logic
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
        let move = parts[1];

        // Apply snake-aware move filtering
        move = enhanceMoveWithSnakeLogic(move, currentFen);
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

// Enhanced move evaluation with snake logic
function enhanceMoveWithSnakeLogic(stockfishMove, fen) {
  // Parse FEN to get board state
  const board = parseFenToBoard(fen);

  // Get all legal moves for black (bot)
  const allMoves = generateAllLegalMoves(board, 'b');

  // Evaluate each move with snake-aware scoring
  const evaluatedMoves = allMoves.map(move => ({
    move: move,
    score: evaluateMove(board, move, 'b')
  }));

  // Sort by score (highest first)
  evaluatedMoves.sort((a, b) => b.score - a.score);

  // Return best move in UCI format
  if (evaluatedMoves.length > 0) {
    return moveToUCI(evaluatedMoves[0].move);
  }

  return null; // No legal moves
}

// Parse FEN string to board representation
function parseFenToBoard(fen) {
  const board = Array(8).fill().map(() => Array(10).fill(null));
  const parts = fen.split(' ');
  const position = parts[0];

  let x = 0, y = 0;
  for (let i = 0; i < position.length; i++) {
    const char = position[i];
    if (char === '/') {
      y++;
      x = 0;
    } else if (/\d/.test(char)) {
      x += parseInt(char);
    } else {
      const color = char === char.toUpperCase() ? 'w' : 'b';
      const type = char.toLowerCase();
      const pieceTypes = {
        'p': 'pawn', 'r': 'rook', 'n': 'knight', 'b': 'bishop',
        'q': 'queen', 'k': 'king', 's': 'snake'
      };
      board[y][x] = { type: pieceTypes[type], color: color };
      x++;
    }
  }

  return board;
}

// Generate all legal moves for a color (simplified version)
function generateAllLegalMoves(board, color) {
  const moves = [];

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 10; x++) {
      const piece = board[y][x];
      if (piece && piece.color === color) {
        const pieceMoves = generatePieceMoves(board, x, y, piece);
        pieceMoves.forEach(move => {
          moves.push({ from: { x, y }, to: move });
        });
      }
    }
  }

  return moves;
}

// Generate moves for a specific piece (simplified)
function generatePieceMoves(board, x, y, piece) {
  const moves = [];

  // Simplified move generation - focus on snake for now
  if (piece.type === 'snake') {
    // Snake moves: 3 diagonal steps with alternating directions
    const directions = [
      [[-1,-1], [1,-1]], // NW, NE
      [[1,-1], [-1,-1]], // NE, NW
      [[1,-1], [1,1]],   // NE, SE
      [[1,1], [1,-1]],   // SE, NE
      [[1,1], [-1,1]],   // SE, SW
      [[-1,1], [1,1]],   // SW, SE
      [[-1,1], [-1,-1]], // SW, NW
      [[-1,-1], [-1,1]]  // NW, SW
    ];

    for (const pattern of directions) {
      let cx = x, cy = y;
      for (let step = 0; step < 3; step++) {
        const dirIndex = step % 2;
        cx += pattern[dirIndex][0];
        cy += pattern[dirIndex][1];

        if (cx < 0 || cx >= 10 || cy < 0 || cy >= 8) break;

        const target = board[cy][cx];
        if (target && target.color === piece.color) break;

        moves.push({ x: cx, y: cy });
        if (target) break; // Can't move through pieces
      }
    }
  } else {
    // Basic moves for other pieces (simplified)
    const deltas = piece.type === 'pawn' ? [[0, piece.color === 'w' ? -1 : 1]] :
                   piece.type === 'rook' ? [[0,1], [0,-1], [1,0], [-1,0]] :
                   piece.type === 'bishop' ? [[1,1], [1,-1], [-1,1], [-1,-1]] :
                   piece.type === 'queen' ? [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]] :
                   piece.type === 'king' ? [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]] :
                   piece.type === 'knight' ? [[2,1], [2,-1], [-2,1], [-2,-1], [1,2], [1,-2], [-1,2], [-1,-2]] : [];

    for (const [dx, dy] of deltas) {
      let cx = x + dx, cy = y + dy;
      if (cx >= 0 && cx < 10 && cy >= 0 && cy < 8) {
        const target = board[cy][cx];
        if (!target || target.color !== piece.color) {
          moves.push({ x: cx, y: cy });
        }
      }
    }
  }

  return moves;
}

// Evaluate a move with snake-aware logic
function evaluateMove(board, move, color) {
  let score = 0;

  // Material balance (simplified)
  const pieceValues = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 100, snake: 4 };

  // Check if move captures a piece
  const capturedPiece = board[move.to.y][move.to.x];
  if (capturedPiece) {
    score += pieceValues[capturedPiece.type] * 10;
  }

  // Snake-specific evaluation
  const movingPiece = board[move.from.y][move.from.x];
  if (movingPiece.type === 'snake') {
    // Prefer central positions for snakes
    const centerX = Math.abs(move.to.x - 5);
    const centerY = Math.abs(move.to.y - 3.5);
    score += (5 - centerX) + (4 - centerY); // Bonus for central positions

    // Snake mobility bonus
    score += 5; // Snakes are valuable for their unique movement
  }

  // Position bonuses
  if (move.to.y >= 2 && move.to.y <= 5) score += 2; // Central ranks
  if (move.to.x >= 3 && move.to.x <= 6) score += 1; // Central files

  return score + Math.random() * 2; // Add small random factor to avoid identical evaluations
}

// Convert move object to UCI format
function moveToUCI(move) {
  const files = 'abcdefghij';
  const fromFile = files[move.from.x];
  const fromRank = (8 - move.from.y).toString();
  const toFile = files[move.to.x];
  const toRank = (8 - move.to.y).toString();

  return fromFile + fromRank + toFile + toRank;
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

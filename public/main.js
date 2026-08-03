// ================== CONFIG ==================
const COLS = 8;
const ROWS = 8;
const IMG = 'img/';

const cellsImg = { w: 'wcell.jpg', b: 'bcell.jpg' };

// bull временно использует картинки слона
const piecesImg = {
  w:{rook:'wrook.png',queen:'wqueen.png',king:'wking.png',pawn:'wpawn.png',snake:'wsnake.png',bull:'wbishop.png'},
  b:{rook:'brook.png',queen:'bqueen.png',king:'bking.png',pawn:'bpawn.png',snake:'bsnake.png',bull:'bbishop.png'}
};

// 8x8: змея на месте коня, бык на месте слона
const backRank = [
  'rook','snake','bull','queen','king','bull','snake','rook'
];

// ================== STATE ==================
let board = [];
let selected = null;
let turn = 'w';
let gameOver = false;

// Game state for advanced rules
let positionHistory = new Map(); // For threefold repetition
let lastPawnDoubleMove = null; // {x, y, color} - for en passant

// ================== APP STATE ==================
let currentUser = null;
let currentGame = null;
let gameMode = 'local'; // 'local', 'bot', 'online'
let ws = null;
let fairyStockfish = null;

// ================== HELPERS ==================
function inside(x,y){ return x>=0 && x<COLS && y>=0 && y<ROWS; }
function isAlly(p,c){ return p && p.color===c; }
function cloneBoard(b){ return b.map(r=>r.map(c=>c?{...c}:null)); }

const boardEl = document.getElementById('board');

// ================== SETUP ==================
function setup(){
  board = Array.from({length:ROWS},()=>Array(COLS).fill(null));
  for(let x=0;x<COLS;x++){
    board[0][x]={type:backRank[x],color:'b',moved:false};
    board[1][x]={type:'pawn',color:'b',moved:false};
    board[6][x]={type:'pawn',color:'w',moved:false};
    board[7][x]={type:backRank[x],color:'w',moved:false};
  }
}

// ================== RENDER ==================
function render(){
  boardEl.innerHTML='';
  for(let y=0;y<ROWS;y++){
    for(let x=0;x<COLS;x++){
      const cell=document.createElement('div');
      cell.className='cell';
      cell.dataset.x=x; cell.dataset.y=y;

      const bg=document.createElement('div');
      bg.className='cell-bg';
      bg.style.backgroundImage =
        `url(${IMG}${((x+y)%2===0)?cellsImg.w:cellsImg.b})`;
      cell.appendChild(bg);

      const ov=document.createElement('div');
      ov.className='overlay';
      ov.onclick=()=>clickCell(x,y);
      cell.appendChild(ov);

      const p=board[y][x];
      if(p){
        const img=document.createElement('img');
        img.className='piece';
        img.src=IMG+piecesImg[p.color][p.type];
        cell.appendChild(img);
      }
      boardEl.appendChild(cell);
    }
  }
  highlight();
}

// ================== INPUT ==================
function clickCell(x,y){
  if(gameOver) return;

  // In online mode, only allow moves on your turn
  if(gameMode === 'online' && currentGame){
    const isWhitePlayer = currentGame.white._id === currentUser?.id;
    const isBlackPlayer = currentGame.black && currentGame.black._id === currentUser?.id;

    if((turn === 'w' && !isWhitePlayer) || (turn === 'b' && !isBlackPlayer)){
      return; // Not your turn
    }
  }

  // In bot mode, don't allow black moves
  if(gameMode === 'bot' && turn === 'b'){
    return;
  }

  if(selected){
    const moves=getLegalMoves(selected.x,selected.y);
    const targetMove = moves.find(m=>m.x===x&&m.y===y);
    if(targetMove){
      const isEnPassant = targetMove.enPassant || false;
      movePiece(selected.x,selected.y,x,y, isEnPassant);
      selected=null;
      render();
      checkGameEnd();
      return;
    }
  }

  if(board[y][x] && board[y][x].color===turn){
    selected={x,y};
  } else {
    selected=null;
  }
  render();
}

// ================== BOT MOVE ==================
function makeBotMove(){
  if(gameMode !== 'bot' || gameOver || turn !== 'b') return;

  console.log('Bot move requested, fairyStockfish:', !!fairyStockfish);

  if (fairyStockfish) {
    // Use enhanced Stockfish with snake logic
    const fen = boardToFen();
    console.log('Sending FEN to Stockfish:', fen);
    fairyStockfish.postMessage({ type: 'set_position', data: { fen } });
    fairyStockfish.postMessage({ type: 'get_best_move', data: { time: 1000 } });
  } else {
    console.log('Using fallback intelligent move');
    // Fallback to intelligent snake-aware move selection
    makeIntelligentMove();
  }
}

function makeIntelligentMove(){
  const allMoves = [];
  for(let y=0;y<ROWS;y++){
    for(let x=0;x<COLS;x++){
      if(board[y][x] && board[y][x].color === 'b'){
        const moves = getLegalMoves(x,y);
        moves.forEach(m => {
          allMoves.push({
            from:{x,y},
            to:m,
            score: evaluateMoveForBot({from:{x,y}, to:m})
          });
        });
      }
    }
  }

  if(allMoves.length > 0){
    // Sort by score and pick the best move
    allMoves.sort((a, b) => b.score - a.score);
    const bestMove = allMoves[0];

    movePiece(bestMove.from.x, bestMove.from.y, bestMove.to.x, bestMove.to.y);
    render();
    checkGameEnd();
  }
}

function evaluateMoveForBot(move) {
  let score = 0;

  // Material gain
  const capturedPiece = board[move.to.y][move.to.x];
  if (capturedPiece) {
    const pieceValues = { pawn: 1, rook: 5, queen: 9, king: 100, snake: 4, bull: 3 };
    score += (pieceValues[capturedPiece.type] || 2) * 10;
  }

  // Snake-specific evaluation
  const movingPiece = board[move.from.y][move.from.x];
  if (movingPiece.type === 'snake') {
    // Snakes are powerful - prefer moves that increase their mobility
    score += 8; // Base snake value

    // Prefer central positions
    const centerDistance = Math.abs(move.to.x - 3.5) + Math.abs(move.to.y - 3.5);
    score += Math.max(0, 6 - centerDistance);

    // Bonus for attacking enemy pieces
    if (capturedPiece) {
      score += 5; // Snakes are great at capturing
    }
  }

  // Position bonuses
  if (move.to.y >= 2 && move.to.y <= 5) score += 2;
  if (move.to.x >= 2 && move.to.x <= 5) score += 1;

  return score + Math.random() * 3; // Add small randomness
}

function makeRandomMove(){
  const allMoves = [];
  for(let y=0;y<ROWS;y++){
    for(let x=0;x<COLS;x++){
      if(board[y][x] && board[y][x].color === 'b'){
        const moves = getLegalMoves(x,y);
        moves.forEach(m => {
          allMoves.push({from:{x,y}, to:m});
        });
      }
    }
  }

  if(allMoves.length > 0){
    const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    movePiece(randomMove.from.x, randomMove.from.y, randomMove.to.x, randomMove.to.y);
    render();
    checkGameEnd();
  }
}

// ================== MOVE ==================
function movePiece(sx,sy,tx,ty,enPassant = false){
  const piece=board[sy][sx];
  board[ty][tx]={...piece,moved:true};
  board[sy][sx]=null;

  // ===== EN PASSANT CAPTURE =====
  if(enPassant && piece.type === 'pawn'){
    // Remove the captured pawn (it's on the same rank as the target square)
    board[sy][tx] = null;
  }

  // ===== TRACK PAWN DOUBLE MOVES =====
  if(piece.type === 'pawn' && Math.abs(ty - sy) === 2){
    lastPawnDoubleMove = {x: tx, y: ty, color: piece.color};
  } else {
    lastPawnDoubleMove = null;
  }

  // ===== CASTLING =====
  if(piece.type==='king' && Math.abs(tx-sx)===2){
    // короткая
    if(tx>sx){
      board[ty][tx-1]={...board[ty][COLS-1],moved:true};
      board[ty][COLS-1]=null;
    }
    // длинная
    else{
      board[ty][tx+1]={...board[ty][0],moved:true};
      board[ty][0]=null;
    }
  }

  const p=board[ty][tx];

  // Pawn promotion
  if(p.type==='pawn'){
    if((p.color==='w'&&ty===0)||(p.color==='b'&&ty===ROWS-1)){
      const choice=prompt('queen, rook, snake, bull','queen');
      const ok=['queen','rook','snake','bull'];
      p.type=ok.includes(choice)?choice:'queen';
    }
  }

  turn = turn==='w'?'b':'w';

  // Send move to server if playing online
  if (gameMode === 'online' && currentGame && ws && ws.readyState === WebSocket.OPEN) {
    const moveData = {
      from: { x: sx, y: sy },
      to: { x: tx, y: ty },
      piece: piece.type,
      color: piece.color
    };

    ws.send(JSON.stringify({
      type: 'make-move',
      gameId: currentGame._id,
      move: moveData
    }));
  }

  // Handle bot moves
  if (gameMode === 'bot' && turn === 'b' && !gameOver) {
    setTimeout(makeBotMove, 500); // Delay for better UX
  }
}

// ================== CHECK / MATE / STALEMATE ==================
function findKing(color,b){
  for(let y=0;y<ROWS;y++)
    for(let x=0;x<COLS;x++){
      const p=b[y][x];
      if(p&&p.type==='king'&&p.color===color) return {x,y};
    }
  return null;
}

function isKingInCheck(color,b){
  const k=findKing(color,b);
  if(!k) return false;
  const enemy=color==='w'?'b':'w';
  return isSquareAttacked(k.x,k.y,enemy,b);
}


function isSquareAttacked(x,y,by,b){
  for(let yy=0;yy<ROWS;yy++){
    for(let xx=0;xx<COLS;xx++){
      const p=b[yy][xx];
      if(!p || p.color!==by) continue;

      let moves=[];
      switch(p.type){
        case 'pawn': {
          const dir = by==='w'?-1:1;
          for(const dx of [-1,1]){
            const nx=xx+dx, ny=yy+dir;
            if(nx===x && ny===y) return true;
          }
          break;
        }
        case 'king': {
          for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
            if(xx+dx===x && yy+dy===y) return true;
          }
          break;
        }
        case 'rook':
          moves=genRook(xx,yy,by,b); break;
        case 'queen':
          moves=genQueen(xx,yy,by,b); break;
        case 'snake':
          moves=genSnake(xx,yy,by,b); break;
        case 'bull':
          moves=genBull(xx,yy,by,b); break;
      }

      if(moves.some(m=>m.x===x && m.y===y)) return true;
    }
  }
  return false;
}


function anyLegalMoves(color){
  for(let y=0;y<ROWS;y++)
    for(let x=0;x<COLS;x++){
      const p=board[y][x];
      if(p&&p.color===color){
        if(getLegalMoves(x,y).length) return true;
      }
    }
  return false;
}

function checkGameEnd(){
  // Check for threefold repetition
  const currentFen = boardToFen().split(' ')[0]; // Only position, ignore turn/castling/etc
  const count = (positionHistory.get(currentFen) || 0) + 1;
  positionHistory.set(currentFen, count);

  if(count >= 3){
    gameOver=true;
    alert('Ничья по троекратному повторению позиции!');
    const winner = 'draw';

    // Save game result if authenticated and playing rated game
    if (currentUser && (gameMode === 'online' || gameMode === 'bot') && currentGame) {
      saveGameResult(winner);
    }
    return;
  }

  const inCheck=isKingInCheck(turn,board);
  if(!anyLegalMoves(turn)){
    gameOver=true;
    const result = inCheck ? 'checkmate' : 'stalemate';
    const winner = result === 'checkmate' ? (turn === 'w' ? 'black' : 'white') : 'draw';

    alert(inCheck?'Мат':'Пат');

    // Save game result if authenticated and playing rated game
    if (currentUser && (gameMode === 'online' || gameMode === 'bot') && currentGame) {
      saveGameResult(winner);
    }
  }
}

async function saveGameResult(winner) {
  try {
    const response = await fetch(`/api/games/${currentGame._id}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ winner }),
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Game saved:', data);
      // Update user rating display
      if (currentUser) {
        currentUser.rating = data.game.white._id === currentUser.id ?
          data.game.white.rating : data.game.black.rating;
        updateUserDisplay();
      }
    } else {
      console.error('Failed to save game result');
    }
  } catch (error) {
    console.error('Error saving game result:', error);
  }
}

// ================== LEGAL MOVES ==================
function getLegalMoves(x,y){
  const raw=generateMoves(x,y,board);
  const legal=[];
  for(const m of raw){
    const copy=cloneBoard(board);
    copy[m.y][m.x]=copy[y][x];
    copy[y][x]=null;
    if(!isKingInCheck(board[y][x].color,copy)) legal.push(m);
  }
  return legal;
}

// ================== MOVE GENERATION ==================
function generateMoves(x,y,b){
  const p=b[y][x];
  if(!p) return [];
  switch(p.type){
    case 'king': return genKing(x,y,p.color,b);
    case 'queen': return genQueen(x,y,p.color,b);
    case 'rook': return genRook(x,y,p.color,b);
    case 'pawn': return genPawn(x,y,p.color,b);
    case 'snake': return genSnake(x,y,p.color,b);
    case 'bull': return genBull(x,y,p.color,b);
  }
  return [];
}

function ray(x,y,dirs,c,b){
  const r=[];
  for(const d of dirs){
    let nx=x+d[0],ny=y+d[1];
    while(inside(nx,ny)){
      const t=b[ny][nx];
      if(!t) r.push({x:nx,y:ny});
      else{ if(t.color!==c) r.push({x:nx,y:ny}); break; }
      nx+=d[0]; ny+=d[1];
    }
  }
  return r;
}

const genQueen=(x,y,c,b)=>ray(x,y,[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],c,b);
const genRook=(x,y,c,b)=>ray(x,y,[[1,0],[-1,0],[0,1],[0,-1]],c,b);
const genBishop=(x,y,c,b)=>ray(x,y,[[1,1],[1,-1],[-1,1],[-1,-1]],c,b);

function genKing(x,y,c,b){
  const r=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]
    .map(v=>({x:x+v[0],y:y+v[1]}))
    .filter(m=>inside(m.x,m.y)&&!isAlly(b[m.y][m.x],c));

  const king=b[y][x];
  if(king.moved) return r;

  if(isKingInCheck(c,b)) return r;

  const enemy=c==='w'?'b':'w';

  // длинная
  const left=b[y][0];
  if(left&&left.type==='rook'&&!left.moved){
    let ok=true;
    for(let i=1;i<x;i++){
      if(b[y][i]||isSquareAttacked(i,y,enemy,b)) ok=false;
    }
    if(ok) r.push({x:x-2,y});
  }

  // короткая
  const right=b[y][COLS-1];
  if(right&&right.type==='rook'&&!right.moved){
    let ok=true;
    for(let i=x+1;i<COLS-1;i++){
      if(b[y][i]||isSquareAttacked(i,y,enemy,b)) ok=false;
    }
    if(ok) r.push({x:x+2,y});
  }

  return r;
}

function genKnight(x,y,c,b){
  const d=[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
  return d.map(v=>({x:x+v[0],y:y+v[1]}))
    .filter(m=>inside(m.x,m.y)&&!isAlly(b[m.y][m.x],c));
}

function genPawn(x,y,c,b){
  const dir=c==='w'?-1:1;
  const r=[];

  // Normal move forward
  if(inside(x,y+dir)&&!b[y+dir][x]) r.push({x,y:y+dir});

  // Double move from starting position
  const start=(c==='w'?6:1);
  if(y===start && !b[y+dir][x] && !b[y+2*dir][x])
    r.push({x,y:y+2*dir});

  // Normal captures
  for(const dx of [-1,1]){
    const nx=x+dx,ny=y+dir;
    if(inside(nx,ny)&&b[ny][nx]&&b[ny][nx].color!==c)
      r.push({x:nx,y:ny});
  }

  // En passant (битье на проходе)
  if(lastPawnDoubleMove && lastPawnDoubleMove.color !== c){
    // Check if the last double pawn move is adjacent to current pawn
    if(Math.abs(lastPawnDoubleMove.x - x) === 1 && lastPawnDoubleMove.y === y){
      // The en passant capture square
      const enPassantY = c === 'w' ? lastPawnDoubleMove.y - 1 : lastPawnDoubleMove.y + 1;
      if(inside(lastPawnDoubleMove.x, enPassantY)){
        r.push({x: lastPawnDoubleMove.x, y: enPassantY, enPassant: true});
      }
    }
  }

  return r;
}

// 🐍 SNAKE — 3 steps
function genSnake(x,y,c,b){
  const d={NE:[1,-1],NW:[-1,-1],SE:[1,1],SW:[-1,1]};
  const p=[['NW','NE'],['NE','NW'],['NE','SE'],['SE','NE'],['SE','SW'],['SW','SE'],['SW','NW'],['NW','SW']];
  const r=[];
  for(const pat of p){
    let cx=x,cy=y;
    for(let i=0;i<3;i++){
      const v=d[pat[i%2]];
      cx+=v[0]; cy+=v[1];
      if(!inside(cx,cy)) break;
      const t=b[cy][cx];
      if(t&&t.color===c) break;
      r.push({x:cx,y:cy});
      if(t) break;
    }
  }
  return [...new Map(r.map(m=>[m.x+','+m.y,m])).values()];
}

// 🐂 BULL — 1 diagonal sidestep, then up to 2 straight (same for all 4 sides)
function genBull(x,y,c,b){
  const paths = [
    // up
    { first:[-1,-1], step:[0,-1] },
    { first:[ 1,-1], step:[0,-1] },
    // down
    { first:[-1, 1], step:[0, 1] },
    { first:[ 1, 1], step:[0, 1] },
    // left
    { first:[-1,-1], step:[-1, 0] },
    { first:[-1, 1], step:[-1, 0] },
    // right
    { first:[ 1,-1], step:[ 1, 0] },
    { first:[ 1, 1], step:[ 1, 0] },
  ];
  const r=[];
  for(const path of paths){
    let cx=x+path.first[0];
    let cy=y+path.first[1];
    if(!inside(cx,cy)) continue;
    let t=b[cy][cx];
    if(t&&t.color===c) continue;
    r.push({x:cx,y:cy});
    if(t) continue;

    for(let i=0;i<2;i++){
      cx+=path.step[0];
      cy+=path.step[1];
      if(!inside(cx,cy)) break;
      t=b[cy][cx];
      if(t&&t.color===c) break;
      r.push({x:cx,y:cy});
      if(t) break;
    }
  }
  return [...new Map(r.map(m=>[m.x+','+m.y,m])).values()];
}

// ================== HIGHLIGHT ==================
function highlight(){
  document.querySelectorAll('.overlay').forEach(o=>{
    o.className='overlay';
  });

  if(!selected) return;

  document
    .querySelector(`.cell[data-x='${selected.x}'][data-y='${selected.y}'] .overlay`)
    ?.classList.add('highlight-selected');

  const moves=getLegalMoves(selected.x,selected.y);
  moves.forEach(m=>{
    const o=document
      .querySelector(`.cell[data-x='${m.x}'][data-y='${m.y}'] .overlay`);
    if(o){
      o.classList.add(
        board[m.y][m.x]?'highlight-capture':'highlight-move'
      );
    }
  });
}

// ================== UI MANAGEMENT ==================
function initUI() {
  // Navigation buttons
  document.getElementById('play-local').addEventListener('click', () => startLocalGame());
  document.getElementById('play-bot').addEventListener('click', () => startBotGame());
  document.getElementById('play-online').addEventListener('click', () => showOnlineGame());
  document.getElementById('lobby').addEventListener('click', () => showLobby());
  document.getElementById('leaderboard').addEventListener('click', () => showLeaderboard());
  document.getElementById('game-history').addEventListener('click', () => showGameHistory());

  // Auth buttons
  document.getElementById('login-btn').addEventListener('click', () => showAuthModal('login'));
  document.getElementById('register-btn').addEventListener('click', () => showAuthModal('register'));
  document.getElementById('logout-btn').addEventListener('click', () => logout());

  // Modal controls
  document.querySelectorAll('.modal-close').forEach(close => {
    close.addEventListener('click', () => hideModals());
  });

  // Auth form
  document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);
  document.getElementById('auth-toggle-link').addEventListener('click', toggleAuthMode);

  // Lobby controls
  document.getElementById('create-room-btn').addEventListener('click', createGameRoom);
  document.getElementById('refresh-lobby-btn').addEventListener('click', loadWaitingGames);

  // Check if user is logged in
  checkAuthStatus();

  // Initialize WebSocket
  initWebSocket();
}

function startLocalGame() {
  gameMode = 'local';
  resetGame();
  updateGameInfo();
}

function startBotGame() {
  gameMode = 'bot';
  resetGame();
  updateGameInfo();
  initFairyStockfish();
}

function showOnlineGame() {
  if (!currentUser) {
    showAuthModal('login');
    return;
  }

  showLobby();
}

function showAuthModal(mode) {
  const modal = document.getElementById('auth-modal');
  const title = document.getElementById('auth-modal-title');
  const registerFields = document.getElementById('register-fields');
  const registerEmail = document.getElementById('register-email');
  const loginFields = document.getElementById('login-fields');
  const submitBtn = document.getElementById('auth-submit-btn');

  if (mode === 'register') {
    title.textContent = 'Регистрация';
    registerFields.style.display = 'block';
    registerEmail.style.display = 'block';
    loginFields.style.display = 'none';
    submitBtn.textContent = 'Зарегистрироваться';
  } else {
    title.textContent = 'Вход';
    registerFields.style.display = 'none';
    registerEmail.style.display = 'none';
    loginFields.style.display = 'block';
    submitBtn.textContent = 'Войти';
  }

  modal.style.display = 'flex';
}

function hideModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.style.display = 'none';
  });
}

function toggleAuthMode(e) {
  e.preventDefault();
  const registerFields = document.getElementById('register-fields');
  const registerEmail = document.getElementById('register-email');
  const loginFields = document.getElementById('login-fields');
  const title = document.getElementById('auth-modal-title');
  const submitBtn = document.getElementById('auth-submit-btn');
  const toggleText = document.getElementById('auth-toggle-text');
  const toggleLink = document.getElementById('auth-toggle-link');

  if (registerFields.style.display === 'none') {
    title.textContent = 'Регистрация';
    registerFields.style.display = 'block';
    registerEmail.style.display = 'block';
    loginFields.style.display = 'none';
    submitBtn.textContent = 'Зарегистрироваться';
    toggleText.textContent = 'Уже есть аккаунт? ';
    toggleLink.textContent = 'Войти';
  } else {
    title.textContent = 'Вход';
    registerFields.style.display = 'none';
    registerEmail.style.display = 'none';
    loginFields.style.display = 'block';
    submitBtn.textContent = 'Войти';
    toggleText.textContent = 'Нет аккаунта? ';
    toggleLink.textContent = 'Зарегистрироваться';
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const isRegister = document.getElementById('register-fields').style.display !== 'none';

  try {
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister ? {
      username: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password')
    } : {
      usernameOrEmail: formData.get('usernameOrEmail'),
      password: formData.get('password')
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      credentials: 'include'
    });

    const data = await response.json();

    if (response.ok) {
      currentUser = data.user;
      updateUserDisplay();
      hideModals();
      e.target.reset();
    } else {
      alert(data.error || 'Ошибка аутентификации');
    }
  } catch (error) {
    console.error('Auth error:', error);
    alert('Ошибка сети');
  }
}

async function checkAuthStatus() {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      updateUserDisplay();
    }
  } catch (error) {
    console.error('Auth check error:', error);
  }
}

function updateUserDisplay() {
  const userInfo = document.getElementById('user-info');
  const authButtons = document.getElementById('auth-buttons');

  if (currentUser) {
    document.getElementById('username-display').textContent = currentUser.username;
    document.getElementById('rating-display').textContent = `Рейтинг: ${currentUser.rating}`;
    userInfo.style.display = 'flex';
    authButtons.style.display = 'none';
  } else {
    userInfo.style.display = 'none';
    authButtons.style.display = 'flex';
  }
}

async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    currentUser = null;
    updateUserDisplay();
    if (ws) {
      ws.close();
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}

function updateGameInfo() {
  const turnDisplay = document.getElementById('current-turn');
  const opponentInfo = document.getElementById('opponent-info');
  const gameStatus = document.getElementById('game-status');

  // Don't update turn display if element doesn't exist
  if (turnDisplay) {
    turnDisplay.textContent = turn === 'w' ? 'Белых' : 'Черных';
  }

  if (gameMode === 'bot' && opponentInfo) {
    const opponentName = document.getElementById('opponent-name');
    if (opponentName) {
      opponentName.textContent = 'Бот (Fairy Stockfish)';
    }
    opponentInfo.style.display = 'block';
  } else if (gameMode === 'online' && currentGame && opponentInfo) {
    const opponent = currentGame.white._id === currentUser.id ? currentGame.black : currentGame.white;
    if (opponent) {
      const opponentName = document.getElementById('opponent-name');
      if (opponentName) {
        opponentName.textContent = opponent.username;
      }
      opponentInfo.style.display = 'block';
    }
  } else if (opponentInfo) {
    opponentInfo.style.display = 'none';
  }

  if (gameStatus) {
    if (gameOver) {
      gameStatus.textContent = 'Игра окончена';
    } else {
      gameStatus.textContent = '';
    }
  }
}

// ================== WEBSOCKET ==================
function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('WebSocket connected');
    if (currentUser) {
      // Send authentication
      ws.send(JSON.stringify({
        type: 'auth',
        token: document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1]
      }));
    }
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleWebSocketMessage(message);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    // Attempt to reconnect after delay
    setTimeout(initWebSocket, 3000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

function handleWebSocketMessage(message) {
  console.log('Received WS message:', message.type);

  switch (message.type) {
    case 'auth':
      if (message.success) {
        console.log('WebSocket authenticated');
      }
      break;

    case 'game-joined':
      currentGame = message.game;
      gameMode = 'online';
      resetGame();
      updateGameInfo();
      break;

    case 'move-made':
      // Update board with opponent's move
      if (message.move) {
        // Apply move to local board
        applyMoveToBoard(message.move);
        turn = message.turn;
        render();
        updateGameInfo();
      }
      break;

    case 'player-joined':
      updateGameInfo();
      break;

    case 'player-left':
      alert('Соперник покинул игру');
      break;

    case 'lobby-chat':
      // Handle lobby chat messages
      break;

    case 'error':
      alert(message.message);
      break;
  }
}

function applyMoveToBoard(move) {
  // Convert move notation to board coordinates and apply
  // This would need to be implemented based on how moves are stored
  console.log('Applying move:', move);
}

// ================== LOBBY FUNCTIONS ==================
function showLobby() {
  const modal = document.getElementById('lobby-modal');
  modal.style.display = 'flex';
  loadWaitingGames();
}

async function loadWaitingGames() {
  const waitingGamesDiv = document.getElementById('waiting-games');

  try {
    waitingGamesDiv.innerHTML = '<div class="loading">Загрузка...</div>';

    const response = await fetch('/api/games/lobby/waiting', {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      displayWaitingGames(data.games);
    } else {
      waitingGamesDiv.innerHTML = '<div class="error">Ошибка загрузки лобби</div>';
    }
  } catch (error) {
    console.error('Load lobby error:', error);
    waitingGamesDiv.innerHTML = '<div class="error">Ошибка сети</div>';
  }
}

function displayWaitingGames(games) {
  const waitingGamesDiv = document.getElementById('waiting-games');

  if (games.length === 0) {
    waitingGamesDiv.innerHTML = '<div class="no-games">Нет доступных игр. Создайте новую!</div>';
    return;
  }

  let html = '<div class="games-list">';
  games.forEach(game => {
    html += `
      <div class="game-item">
        <div class="game-info">
          <div class="host">${game.white.username} (рейтинг: ${game.white.rating})</div>
          <div class="game-type">Человек vs Человек</div>
        </div>
        <button class="join-btn" onclick="joinGame('${game._id}')">Присоединиться</button>
      </div>
    `;
  });
  html += '</div>';

  waitingGamesDiv.innerHTML = html;
}

async function createGameRoom() {
  try {
    const response = await fetch('/api/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gameType: 'human-vs-human',
        timeControl: { initial: 600, increment: 0 }
      }),
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      currentGame = data.game;
      hideModals();
      alert(`Комната создана! Код комнаты: ${data.game.roomId}`);
      // Wait for opponent to join
    } else {
      const error = await response.json();
      alert(error.error || 'Ошибка создания комнаты');
    }
  } catch (error) {
    console.error('Create room error:', error);
    alert('Ошибка сети');
  }
}

async function joinGame(gameId) {
  try {
    const response = await fetch(`/api/games/${gameId}/join`, {
      method: 'POST',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      currentGame = data.game;

      // Join WebSocket room
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'join-game',
          gameId: gameId
        }));
      }

      hideModals();
      gameMode = 'online';
      resetGame();
      updateGameInfo();
    } else {
      const error = await response.json();
      alert(error.error || 'Ошибка присоединения к игре');
    }
  } catch (error) {
    console.error('Join game error:', error);
    alert('Ошибка сети');
  }
}

// Make joinGame available globally for onclick handlers
window.joinGame = joinGame;

// ================== LEADERBOARD FUNCTIONS ==================
function showLeaderboard() {
  const modal = document.getElementById('leaderboard-modal');
  modal.style.display = 'flex';
  loadLeaderboard();
}

async function loadLeaderboard() {
  const leaderboardDiv = document.getElementById('leaderboard-list');

  try {
    leaderboardDiv.innerHTML = '<div class="loading">Загрузка...</div>';

    const response = await fetch('/api/games/leaderboard/top', {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      displayLeaderboard(data.users);
    } else {
      leaderboardDiv.innerHTML = '<div class="error">Ошибка загрузки рейтинга</div>';
    }
  } catch (error) {
    console.error('Load leaderboard error:', error);
    leaderboardDiv.innerHTML = '<div class="error">Ошибка сети</div>';
  }
}

function displayLeaderboard(users) {
  const leaderboardDiv = document.getElementById('leaderboard-list');

  let html = '<table class="leaderboard-table">';
  html += `
    <thead>
      <tr>
        <th>#</th>
        <th>Игрок</th>
        <th>Рейтинг</th>
        <th>Игры</th>
        <th>Победы</th>
        <th>Поражения</th>
      </tr>
    </thead>
  `;

  html += '<tbody>';
  users.forEach((user, index) => {
    html += `
      <tr>
        <td>${index + 1}</td>
        <td>${user.username}</td>
        <td>${user.rating}</td>
        <td>${user.gamesPlayed}</td>
        <td>${user.wins}</td>
        <td>${user.losses}</td>
      </tr>
    `;
  });
  html += '</tbody></table>';

  leaderboardDiv.innerHTML = html;
}

// ================== GAME HISTORY FUNCTIONS ==================
function showGameHistory() {
  if (!currentUser) {
    showAuthModal('login');
    return;
  }

  const modal = document.getElementById('history-modal');
  modal.style.display = 'flex';
  loadGameHistory();
}

async function loadGameHistory() {
  const historyDiv = document.getElementById('game-history-list');

  try {
    historyDiv.innerHTML = '<div class="loading">Загрузка...</div>';

    const response = await fetch(`/api/games/user/${currentUser.id}`, {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      displayGameHistory(data.games);
    } else {
      historyDiv.innerHTML = '<div class="error">Ошибка загрузки истории</div>';
    }
  } catch (error) {
    console.error('Load history error:', error);
    historyDiv.innerHTML = '<div class="error">Ошибка сети</div>';
  }
}

function displayGameHistory(games) {
  const historyDiv = document.getElementById('game-history-list');

  if (games.length === 0) {
    historyDiv.innerHTML = '<div class="no-games">У вас пока нет завершенных игр</div>';
    return;
  }

  let html = '<div class="games-history-list">';
  games.forEach(game => {
    const opponent = game.white._id === currentUser.id ? game.black : game.white;
    const result = game.winner === 'draw' ? 'Ничья' :
                  (game.winner === (game.white._id === currentUser.id ? 'white' : 'black') ? 'Победа' : 'Поражение');

    html += `
      <div class="history-item">
        <div class="history-info">
          <div class="opponent">${opponent ? opponent.username : 'Бот'}</div>
          <div class="result ${result.toLowerCase()}">${result}</div>
          <div class="date">${new Date(game.finishedAt).toLocaleDateString()}</div>
        </div>
        <div class="game-details">
          <div class="moves-count">${game.moves.length} ходов</div>
        </div>
      </div>
    `;
  });
  html += '</div>';

  historyDiv.innerHTML = html;
}

// ================== FAIRY STOCKFISH INTEGRATION ==================
function initFairyStockfish() {
  if (fairyStockfish) {
    fairyStockfish.postMessage({ type: 'quit' });
  }

  try {
    fairyStockfish = new Worker('stockfish.worker.js');

    fairyStockfish.onmessage = function(e) {
      const { type, move } = e.data;
      console.log('Received message from Stockfish worker:', type, move);

      if (type === 'best_move' && move) {
        console.log('Processing Stockfish move:', move);
        // Convert move from UCI format to coordinates
        const fromX = move.charCodeAt(0) - 'a'.charCodeAt(0);
        const fromY = ROWS - parseInt(move[1]); // UCI uses 1-8 from bottom, convert to 0-7 from top
        const toX = move.charCodeAt(2) - 'a'.charCodeAt(0);
        const toY = ROWS - parseInt(move[3]);

        console.log('Converted coordinates:', {fromX, fromY, toX, toY});

        // Make the move
        movePiece(fromX, fromY, toX, toY);
        render();
        checkGameEnd();
      } else if (type === 'best_move' && !move) {
        console.log('Stockfish returned no move, using fallback');
        // Fallback to random move if stockfish fails
        makeRandomMove();
      }
    };

    console.log('Fairy Stockfish worker initialized');
  } catch (error) {
    console.error('Failed to initialize Fairy Stockfish:', error);
    fairyStockfish = null;
  }
}

// ================== FEN CONVERSION ==================
function pieceToFen(piece) {
  if (!piece) return '';

  const typeMap = {
    'pawn': 'p',
    'rook': 'r',
    'queen': 'q',
    'king': 'k',
    'snake': 's',
    'bull': 'u'
  };

  const symbol = typeMap[piece.type];
  return piece.color === 'w' ? symbol.toUpperCase() : symbol;
}

function boardToFen() {
  let fen = '';

  // Convert board to FEN position
  for (let y = 0; y < ROWS; y++) {
    let emptyCount = 0;

    for (let x = 0; x < COLS; x++) {
      const piece = board[y][x];

      if (piece) {
        if (emptyCount > 0) {
          fen += emptyCount;
          emptyCount = 0;
        }
        fen += pieceToFen(piece);
      } else {
        emptyCount++;
      }
    }

    if (emptyCount > 0) {
      fen += emptyCount;
    }

    if (y < ROWS - 1) {
      fen += '/';
    }
  }

  // Add turn
  fen += ' ' + turn;

  // Add castling rights (simplified - no castling for now)
  fen += ' -';

  // Add en passant target (not implemented)
  fen += ' -';

  // Add halfmove clock and fullmove number (simplified)
  fen += ' 0 1';

  return fen;
}

function resetGame() {
  setup();
  selected = null;
  turn = 'w';
  gameOver = false;
  positionHistory.clear();
  lastPawnDoubleMove = null;
  render();
  updateGameInfo();
}

// ================== START ==================
setup();
render();
initUI();

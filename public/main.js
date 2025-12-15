// ================= CONFIG =================
const COLS = 10;
const ROWS = 8;
const IMG = 'img/';

const cellsImg = { w:'wcell.jpg', b:'bcell.jpg' };

const piecesImg = {
  w:{rook:'wrook.png',knight:'wknight.png',bishop:'wbishop.png',queen:'wqueen.png',king:'wking.png',pawn:'wpawn.png',snake:'wsnake.png'},
  b:{rook:'brook.png',knight:'bknight.png',bishop:'bbishop.png',queen:'bqueen.png',king:'bking.png',pawn:'bpawn.png',snake:'bsnake.png'}
};

const backRank = ['rook','knight','bishop','snake','queen','king','snake','bishop','knight','rook'];

// ================= STATE =================
let board = [];
let selected = null;
let turn = 'w';
let history = [];
let capWhite = [], capBlack = [];

// ================= DOM =================
const boardEl = document.getElementById('board');
const capWhiteEl = document.getElementById('cap-white');
const capBlackEl = document.getElementById('cap-black');

// ================= HELPERS =================
function inside(x,y){ return x>=0 && x<COLS && y>=0 && y<ROWS; }
function isAlly(p,c){ return p && p.color===c; }
function cloneBoard(b){ return b.map(r=>r.map(c=>c?{...c}:null)); }

// ================= SETUP =================
function setup(){
  board = Array.from({length:ROWS},()=>Array(COLS).fill(null));
  for(let x=0;x<COLS;x++){
    board[0][x]={type:backRank[x],color:'b',moved:false};
    board[1][x]={type:'pawn',color:'b',moved:false};
    board[6][x]={type:'pawn',color:'w',moved:false};
    board[7][x]={type:backRank[x],color:'w',moved:false};
  }
  history=[];
}

// ================= RENDER =================
function render(){
  boardEl.innerHTML='';
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    const cell=document.createElement('div');
    cell.className='cell';
    cell.dataset.x=x; cell.dataset.y=y;

    const bg=document.createElement('div');
    bg.className='cell-bg';
    bg.style.backgroundImage=`url(${IMG}${((x+y)%2===0)?cellsImg.w:cellsImg.b})`;
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
  refreshHighlights();
  renderCaptured();
  highlightCheck();
}

// ================= INPUT =================
function clickCell(x,y){
  if(selected){
    const moves=getLegalMoves(selected.x,selected.y);
    if(moves.some(m=>m.x===x && m.y===y)){
      movePiece(selected.x,selected.y,x,y);
      selected=null;
      turn = turn==='w'?'b':'w';
      savePosition();
      render();
      checkGameEnd();
      return;
    }
  }
  if(board[y][x] && board[y][x].color===turn) selected={x,y};
  else selected=null;
  render();
}

// ================= MOVE =================
function movePiece(sx,sy,tx,ty){
  const p = board[sy][sx];
  const t = board[ty][tx];
  if(t) (t.color==='w'?capWhite:capBlack).push(t);

  // рокировка
  if(p.type==='king' && Math.abs(tx-sx)===2){
    const rookFrom = tx>sx ? COLS-1 : 0;
    const rookTo = tx>sx ? tx-1 : tx+1;
    board[ty][rookTo] = {...board[ty][rookFrom], moved:true};
    board[ty][rookFrom] = null;
  }

  board[ty][tx] = {...p, moved:true};
  board[sy][sx] = null;
}

// ================= HIGHLIGHT =================
function refreshHighlights(){
  document.querySelectorAll('.overlay').forEach(o=>{
    o.classList.remove('highlight-selected','highlight-move','highlight-capture','highlight-check');
  });
  if(!selected) return;

  document.querySelector(`.cell[data-x='${selected.x}'][data-y='${selected.y}'] .overlay`)
    ?.classList.add('highlight-selected');

  getLegalMoves(selected.x,selected.y).forEach(m=>{
    const o=document.querySelector(`.cell[data-x='${m.x}'][data-y='${m.y}'] .overlay`);
    if(!o) return;
    o.classList.add(board[m.y][m.x] ? 'highlight-capture' : 'highlight-move');
  });
}

// ================= LEGAL MOVES =================
function getLegalMoves(x,y){
  const p=board[y][x];
  if(!p) return [];
  let raw = generateMoves(x,y,board);
  if(p.type==='king') raw.push(...castleMoves(x,y,p.color));
  return raw.filter(m=>{
    const copy = cloneBoard(board);
    copy[m.y][m.x]=copy[y][x];
    copy[y][x]=null;
    return !isKingInCheck(p.color,copy);
  });
}

// ================= MOVE GENERATION =================
function generateMoves(x,y,state){
  const p=state[y][x];
  if(!p) return [];
  switch(p.type){
    case 'king': return genKing(x,y,p.color,state);
    case 'queen': return ray(x,y,[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],p.color,state);
    case 'rook': return ray(x,y,[[1,0],[-1,0],[0,1],[0,-1]],p.color,state);
    case 'bishop': return ray(x,y,[[1,1],[1,-1],[-1,1],[-1,-1]],p.color,state);
    case 'knight': return genKnight(x,y,p.color,state);
    case 'pawn': return genPawn(x,y,p.color,state);
    case 'snake': return genSnake(x,y,p.color,state);
  }
  return [];
}

function ray(x,y,dirs,c,s){
  const r=[];
  for(const d of dirs){
    let nx=x+d[0], ny=y+d[1];
    while(inside(nx,ny)){
      const t=s[ny][nx];
      if(!t) r.push({x:nx,y:ny});
      else { if(t.color!==c) r.push({x:nx,y:ny}); break; }
      nx+=d[0]; ny+=d[1];
    }
  }
  return r;
}

function genKing(x,y,c,s){
  return [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]
    .map(v=>({x:x+v[0],y:y+v[1]}))
    .filter(m=>inside(m.x,m.y)&&!isAlly(s[m.y][m.x],c));
}

function genKnight(x,y,c,s){
  return [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]
    .map(v=>({x:x+v[0],y:y+v[1]}))
    .filter(m=>inside(m.x,m.y)&&!isAlly(s[m.y][m.x],c));
}

// ✔ ИСПРАВЛЕННАЯ ПЕШКА
function genPawn(x,y,c,s){
  const r=[];
  const p=s[y][x];
  const dir=c==='w'?-1:1;
  const start=c==='w'?6:1;

  if(inside(x,y+dir)&&!s[y+dir][x]){
    r.push({x,y:y+dir});
    if(y===start && !p.moved && !s[y+2*dir][x]){
      r.push({x,y:y+2*dir});
    }
  }
  for(const dx of[-1,1]){
    const nx=x+dx, ny=y+dir;
    if(inside(nx,ny)&&s[ny][nx]&&s[ny][nx].color!==c){
      r.push({x:nx,y:ny});
    }
  }
  return r;
}

// 🐍 SNAKE
function genSnake(x,y,c,s){
  const d={NE:[1,-1],NW:[-1,-1],SE:[1,1],SW:[-1,1]};
  const p=[['NW','NE'],['NE','NW'],['NE','SE'],['SE','NE'],['SE','SW'],['SW','SE'],['SW','NW'],['NW','SW']];
  const r=[];
  for(const pat of p){
    let cx=x,cy=y;
    for(let i=0;i<4;i++){
      const v=d[pat[i%2]];
      cx+=v[0]; cy+=v[1];
      if(!inside(cx,cy)) break;
      const t=s[cy][cx];
      if(t&&t.color===c) break;
      r.push({x:cx,y:cy});
      if(t) break;
    }
  }
  return [...new Map(r.map(m=>[m.x+','+m.y,m])).values()];
}

// ================= CHECK =================
function findKing(c,s){
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    const p=s[y][x];
    if(p&&p.type==='king'&&p.color===c) return {x,y};
  }
  return null;
}

function isSquareAttacked(x,y,c,state){
  const e=c==='w'?'b':'w';
  for(let yy=0;yy<ROWS;yy++)for(let xx=0;xx<COLS;xx++){
    const p=state[yy][xx];
    if(p&&p.color===e){
      if(generateMoves(xx,yy,state).some(m=>m.x===x&&m.y===y)) return true;
    }
  }
  return false;
}

function isKingInCheck(c,state){
  const k=findKing(c,state);
  return k ? isSquareAttacked(k.x,k.y,c,state) : false;
}

// ================= CASTLING =================
function castleMoves(x,y,c){
  const res=[];
  const row=c==='w'?7:0;
  const king=board[row][5];
  if(!king||king.moved||isKingInCheck(c,board)) return res;

  if(board[row][9]?.type==='rook'&&!board[row][9].moved &&
     !board[row][6]&&!board[row][7] &&
     !isSquareAttacked(6,row,c,board)&&!isSquareAttacked(7,row,c,board)){
    res.push({x:7,y:row});
  }
  if(board[row][0]?.type==='rook'&&!board[row][0].moved &&
     !board[row][1]&&!board[row][2]&&!board[row][3] &&
     !isSquareAttacked(4,row,c,board)&&!isSquareAttacked(3,row,c,board)){
    res.push({x:3,y:row});
  }
  return res;
}

// ================= END GAME =================
function hasLegalMove(c){
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    if(board[y][x]?.color===c && getLegalMoves(x,y).length) return true;
  }
  return false;
}

function checkGameEnd(){
  const check=isKingInCheck(turn,board);
  if(!hasLegalMove(turn)){
    alert(check?'МАТ':'ПАТ');
  }
}

// ================= REPETITION =================
function serialize(){
  return board.map(r=>r.map(p=>p?`${p.color}${p.type[0]}`:'..').join('')).join('/')+turn;
}

function savePosition(){
  const s=serialize();
  history.push(s);
  if(history.filter(x=>x===s).length===3){
    alert('НИЧЬЯ (3 повтора)');
  }
}

// ================= VISUAL CHECK =================
function highlightCheck(){
  ['w','b'].forEach(c=>{
    if(isKingInCheck(c,board)){
      const k=findKing(c,board);
      const o=document.querySelector(`.cell[data-x='${k.x}'][data-y='${k.y}'] .overlay`);
      o.classList.add('highlight-check');
    }
  });
}

// ================= START =================
setup();
savePosition();
render();

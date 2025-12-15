// ================== CONFIG ==================
const COLS = 10;
const ROWS = 8;
const IMG = 'img/';

const cellsImg = { w: 'wcell.jpg', b: 'bcell.jpg' };

const piecesImg = {
  w: {
    rook:'wrook.png', knight:'wknight.png', bishop:'wbishop.png',
    queen:'wqueen.png', king:'wking.png', pawn:'wpawn.png', snake:'wsnake.png'
  },
  b: {
    rook:'brook.png', knight:'bknight.png', bishop:'bbishop.png',
    queen:'bqueen.png', king:'bking.png', pawn:'bpawn.png', snake:'bsnake.png'
  }
};

const backRank = [
  'rook','knight','bishop','snake',
  'queen','king',
  'snake','bishop','knight','rook'
];

// ================== STATE ==================
let board = [];
let selected = null;
let turn = 'w';

let capWhite = [];
let capBlack = [];

// ================== HELPERS ==================
function inside(x,y){ return x>=0 && x<COLS && y>=0 && y<ROWS; }
function isAlly(p,c){ return p && p.color===c; }

const boardEl = document.getElementById('board');
const capWhiteEl = document.getElementById('cap-white');
const capBlackEl = document.getElementById('cap-black');

// ================== SETUP ==================
function setup(){
  board = Array.from({length:ROWS},()=>Array(COLS).fill(null));
  for(let x=0;x<COLS;x++){
    board[0][x] = {type:backRank[x], color:'b', moved:false};
    board[1][x] = {type:'pawn', color:'b', moved:false};
    board[6][x] = {type:'pawn', color:'w', moved:false};
    board[7][x] = {type:backRank[x], color:'w', moved:false};
  }
}

// ================== RENDER ==================
function render(){
  boardEl.innerHTML='';
  for(let y=0;y<ROWS;y++){
    for(let x=0;x<COLS;x++){
      const cell = document.createElement('div');
      cell.className='cell';
      cell.dataset.x=x;
      cell.dataset.y=y;

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
  refreshHighlights();
  renderCaptured();
}

// ================== INPUT ==================
function clickCell(x,y){
  if(selected){
    const moves = getLegalMoves(selected.x,selected.y);
    if(moves.some(m=>m.x===x && m.y===y)){
      movePiece(selected.x,selected.y,x,y);
      selected=null;
      turn = turn==='w'?'b':'w';
      render();
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

// ================== MOVE ==================
function movePiece(sx,sy,tx,ty){
  const target = board[ty][tx];
  if(target){
    (target.color==='w'?capWhite:capBlack).push(target);
  }
  board[ty][tx] = {...board[sy][sx], moved:true};
  board[sy][sx] = null;
}

// ================== HIGHLIGHT ==================
function refreshHighlights(){
  document.querySelectorAll('.overlay').forEach(o=>{
    o.classList.remove('highlight-selected','highlight-move','highlight-capture');
  });
  if(!selected) return;

  document
    .querySelector(`.cell[data-x='${selected.x}'][data-y='${selected.y}'] .overlay`)
    ?.classList.add('highlight-selected');

  const moves = getLegalMoves(selected.x,selected.y);
  const color = board[selected.y][selected.x].color;

  moves.forEach(m=>{
    const ov = document
      .querySelector(`.cell[data-x='${m.x}'][data-y='${m.y}'] .overlay`);
    if(!ov) return;
    const t = board[m.y][m.x];
    ov.classList.add(t && t.color!==color
      ? 'highlight-capture'
      : 'highlight-move');
  });
}

// ================== LEGAL MOVES (CHECK) ==================
function getLegalMoves(x,y){
  const p = board[y][x];
  if(!p) return [];

  const raw = generateMoves(x,y);
  const legal = [];

  for(const m of raw){
    const copy = board.map(r=>r.map(c=>c?{...c}:null));
    copy[m.y][m.x] = copy[y][x];
    copy[y][x] = null;

    if(!isKingInCheck(p.color, copy)){
      legal.push(m);
    }
  }
  return legal;
}

// ================== CHECK ==================
function findKing(color, state){
  for(let y=0;y<ROWS;y++){
    for(let x=0;x<COLS;x++){
      const p = state[y][x];
      if(p && p.type==='king' && p.color===color){
        return {x,y};
      }
    }
  }
  return null;
}

function isKingInCheck(color, state){
  const king = findKing(color, state);
  if(!king) return false;

  const enemy = color==='w'?'b':'w';

  for(let y=0;y<ROWS;y++){
    for(let x=0;x<COLS;x++){
      const p = state[y][x];
      if(p && p.color===enemy){
        const moves = generateMoves(x,y, state);
        if(moves.some(m=>m.x===king.x && m.y===king.y)){
          return true;
        }
      }
    }
  }
  return false;
}

// ================== MOVE GENERATION ==================
function generateMoves(x,y,state=board){
  const p = state[y][x];
  if(!p) return [];
  switch(p.type){
    case 'king': return genKing(x,y,p.color,state);
    case 'queen': return genQueen(x,y,p.color,state);
    case 'rook': return genRook(x,y,p.color,state);
    case 'bishop': return genBishop(x,y,p.color,state);
    case 'knight': return genKnight(x,y,p.color,state);
    case 'pawn': return genPawn(x,y,p.color,state);
    case 'snake': return genSnake(x,y,p.color,state);
  }
  return [];
}

function rayMoves(x,y,dirs,c,state){
  const r=[];
  for(const d of dirs){
    let nx=x+d[0], ny=y+d[1];
    while(inside(nx,ny)){
      const t=state[ny][nx];
      if(!t) r.push({x:nx,y:ny});
      else { if(t.color!==c) r.push({x:nx,y:ny}); break; }
      nx+=d[0]; ny+=d[1];
    }
  }
  return r;
}

function genKing(x,y,c,state){
  const d=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  return d.map(v=>({x:x+v[0],y:y+v[1]}))
    .filter(m=>inside(m.x,m.y)&&!isAlly(state[m.y][m.x],c));
}

const genQueen=(x,y,c,s)=>rayMoves(x,y,[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],c,s);
const genRook=(x,y,c,s)=>rayMoves(x,y,[[1,0],[-1,0],[0,1],[0,-1]],c,s);
const genBishop=(x,y,c,s)=>rayMoves(x,y,[[1,1],[1,-1],[-1,1],[-1,-1]],c,s);

function genKnight(x,y,c,state){
  const d=[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
  return d.map(v=>({x:x+v[0],y:y+v[1]}))
    .filter(m=>inside(m.x,m.y)&&!isAlly(state[m.y][m.x],c));
}

function genPawn(x,y,c,state){
  const dir=c==='w'?-1:1,res=[];
  if(inside(x,y+dir) && !state[y+dir][x]) res.push({x,y:y+dir});
  for(const dx of [-1,1]){
    const nx=x+dx, ny=y+dir;
    if(inside(nx,ny)&&state[ny][nx]&&state[ny][nx].color!==c)
      res.push({x:nx,y:ny});
  }
  return res;
}

// 🐍 SNAKE
function genSnake(x,y,c,state){
  const d={NE:[1,-1],NW:[-1,-1],SE:[1,1],SW:[-1,1]};
  const p=[['NW','NE'],['NE','NW'],['NE','SE'],['SE','NE'],['SE','SW'],['SW','SE'],['SW','NW'],['NW','SW']];
  const r=[];
  for(const pat of p){
    let cx=x,cy=y;
    for(let i=0;i<4;i++){
      const v=d[pat[i%2]];
      cx+=v[0]; cy+=v[1];
      if(!inside(cx,cy)) break;
      const t=state[cy][cx];
      if(t&&t.color===c) break;
      r.push({x:cx,y:cy});
      if(t) break;
    }
  }
  return [...new Map(r.map(m=>[m.x+','+m.y,m])).values()];
}

// ================== CAPTURED ==================
function renderCaptured(){
  capWhiteEl.innerHTML='';
  capBlackEl.innerHTML='';
  capWhite.forEach(p=>{
    const i=document.createElement('img');
    i.src=IMG+piecesImg[p.color][p.type];
    capWhiteEl.appendChild(i);
  });
  capBlack.forEach(p=>{
    const i=document.createElement('img');
    i.src=IMG+piecesImg[p.color][p.type];
    capBlackEl.appendChild(i);
  });
}

// ================== START ==================
setup();
render();

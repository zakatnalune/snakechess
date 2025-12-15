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

// ================== HELPERS ==================
function inside(x,y){ return x>=0 && x<COLS && y>=0 && y<ROWS; }
function isAlly(p,c){ return p && p.color===c; }

const boardEl = document.getElementById('board');

// ================== SETUP ==================
function setup(){
  board = Array.from({length:ROWS},()=>Array(COLS).fill(null));
  for(let x=0;x<COLS;x++){
    board[0][x] = {type:backRank[x], color:'b'};
    board[1][x] = {type:'pawn', color:'b'};
    board[6][x] = {type:'pawn', color:'w'};
    board[7][x] = {type:backRank[x], color:'w'};
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
  highlight();
}

// ================== INPUT ==================
function clickCell(x,y){
  if(selected){
    const moves = generateMoves(selected.x,selected.y);
    if(moves.some(m=>m.x===x && m.y===y)){
      board[y][x] = board[selected.y][selected.x];
      board[selected.y][selected.x] = null;
      selected=null;
      turn = (turn==='w')?'b':'w';
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

// ================== HIGHLIGHT ==================
function refreshHighlights(){
  document.querySelectorAll('.overlay').forEach(o=>{
    o.classList.remove(
      'highlight-selected',
      'highlight-move',
      'highlight-capture'
    );
  });

  if(!selected) return;

  // подсветка выбранной фигуры
  const sel = document.querySelector(
    `.cell[data-x='${selected.x}'][data-y='${selected.y}'] .overlay`
  );
  if(sel) sel.classList.add('highlight-selected');

  const moves = generateMoves(selected.x, selected.y);
  const color = board[selected.y][selected.x].color;

  moves.forEach(m=>{
    const cell = document.querySelector(
      `.cell[data-x='${m.x}'][data-y='${m.y}'] .overlay`
    );
    if(!cell) return;

    const target = board[m.y][m.x];
    if(target && target.color !== color){
      cell.classList.add('highlight-capture'); // 🟥 можно побить
    } else {
      cell.classList.add('highlight-move'); // 🟩 обычный ход
    }
  });
}


// ================== RAYS ==================
function rayMoves(x,y,dirs,color){
  const res=[];
  for(const d of dirs){
    let nx=x+d[0], ny=y+d[1];
    while(inside(nx,ny)){
      const t=board[ny][nx];
      if(!t) res.push({x:nx,y:ny});
      else{
        if(t.color!==color) res.push({x:nx,y:ny});
        break;
      }
      nx+=d[0]; ny+=d[1];
    }
  }
  return res;
}

// ================== PIECES ==================
function genKing(x,y,c){
  const d=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  return d
    .map(v=>({x:x+v[0],y:y+v[1]}))
    .filter(m=>inside(m.x,m.y) && !isAlly(board[m.y][m.x],c));
}

function genQueen(x,y,c){
  return rayMoves(x,y,
    [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],c);
}

function genRook(x,y,c){
  return rayMoves(x,y,[[1,0],[-1,0],[0,1],[0,-1]],c);
}

function genBishop(x,y,c){
  return rayMoves(x,y,[[1,1],[1,-1],[-1,1],[-1,-1]],c);
}

function genKnight(x,y,c){
  const d=[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
  return d
    .map(v=>({x:x+v[0],y:y+v[1]}))
    .filter(m=>inside(m.x,m.y) && !isAlly(board[m.y][m.x],c));
}

function genPawn(x,y,c){
  const dir = c==='w'?-1:1;
  const res=[];
  const ny=y+dir;

  if(inside(x,ny) && !board[ny][x]) res.push({x,y:ny});

  const start = c==='w'?6:1;
  if(y===start && !board[ny][x] && !board[y+2*dir][x])
    res.push({x,y:y+2*dir});

  for(const dx of [-1,1]){
    const nx=x+dx;
    if(inside(nx,ny) && board[ny][nx] && board[ny][nx].color!==c)
      res.push({x:nx,y:ny});
  }
  return res;
}

// ================== 🐍 SNAKE ==================
function genSnake(x,y,color){
  const diag={
    NE:[1,-1], NW:[-1,-1],
    SE:[1,1],  SW:[-1,1]
  };

  const patterns=[
    ['NW','NE'],['NE','NW'],
    ['NE','SE'],['SE','NE'],
    ['SE','SW'],['SW','SE'],
    ['SW','NW'],['NW','SW']
  ];

  const res=[];
  for(const pat of patterns){
    let cx=x, cy=y;
    for(let step=1;step<=4;step++){
      const d=diag[pat[(step-1)%2]];
      cx+=d[0]; cy+=d[1];
      if(!inside(cx,cy)) break;
      const t=board[cy][cx];
      if(t && t.color===color) break;
      res.push({x:cx,y:cy});
      if(t) break;
    }
  }

  const uniq={};
  return res.filter(m=>{
    const k=m.x+','+m.y;
    if(uniq[k]) return false;
    uniq[k]=1;
    return true;
  });
}

// ================== START ==================
setup();
render();

// ================== CONFIG ==================
const COLS = 10;
const ROWS = 8;
const IMG = 'img/';

const cellsImg = { w: 'wcell.jpg', b: 'bcell.jpg' };

const piecesImg = {
  w:{rook:'wrook.png',knight:'wknight.png',bishop:'wbishop.png',queen:'wqueen.png',king:'wking.png',pawn:'wpawn.png',snake:'wsnake.png'},
  b:{rook:'brook.png',knight:'bknight.png',bishop:'bbishop.png',queen:'bqueen.png',king:'bking.png',pawn:'bpawn.png',snake:'bsnake.png'}
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
let gameOver = false;

ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
function inside(x,y){ return x>=0 && x<COLS && y>=0 && y<ROWS; }
function isAlly(p,c){ return p && p.color===c; }
function cloneBoard(b){ return b.map(r=>r.map(c=>c?{...c}:null)); }

ИНИЦИАЛИЗАЦИЯ И РЕНДЕР

const boardEl = document.getElementById('board');

function setup(){
  board = Array.from({length:ROWS},()=>Array(COLS).fill(null));
  for(let x=0;x<COLS;x++){
    board[0][x]={type:backRank[x],color:'b',moved:false};
    board[1][x]={type:'pawn',color:'b',moved:false};
    board[6][x]={type:'pawn',color:'w',moved:false};
    board[7][x]={type:backRank[x],color:'w',moved:false};
  }
}

function render(){
  boardEl.innerHTML='';
  for(let y=0;y<ROWS;y++){
    for(let x=0;x<COLS;x++){
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
  }
  highlight();
}
ВВОД И ХОДЫ
function clickCell(x,y){
  if(gameOver) return;

  if(selected){
    const moves = getLegalMoves(selected.x,selected.y);
    if(moves.some(m=>m.x===x && m.y===y)){
      movePiece(selected.x,selected.y,x,y);
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
ПЕРЕМЕЩЕНИЕ + ПРЕВРАЩЕНИЕ ПЕШКИ
function movePiece(sx,sy,tx,ty){
  const piece=board[sy][sx];
  board[ty][tx]={...piece,moved:true};
  board[sy][sx]=null;

  const moved=board[ty][tx];

  // pawn promotion
  if(moved.type==='pawn'){
    const lastRank =
      (moved.color==='w' && ty===0) ||
      (moved.color==='b' && ty===ROWS-1);

    if(lastRank){
      const choice = prompt(
        'queen, rook, bishop, knight, snake',
        'queen'
      );
      const ok=['queen','rook','bishop','knight','snake'];
      moved.type = ok.includes(choice)?choice:'queen';
    }
  }

  turn = turn==='w'?'b':'w';
}
ШАХ / МАТ / ПАТ
function findKing(color,b){
  for(let y=0;y<ROWS;y++)
    for(let x=0;x<COLS;x++){
      const p=b[y][x];
      if(p && p.type==='king' && p.color===color)
        return {x,y};
    }
  return null;
}

function isKingInCheck(color,b){
  const k=findKing(color,b);
  if(!k) return false;
  const enemy=color==='w'?'b':'w';

  for(let y=0;y<ROWS;y++)
    for(let x=0;x<COLS;x++){
      const p=b[y][x];
      if(p && p.color===enemy){
        const m=generateMoves(x,y,b,true);
        if(m.some(v=>v.x===k.x && v.y===k.y)) return true;
      }
    }
  return false;
}

function checkGameEnd(){
  const movesExist = anyLegalMoves(turn);
  const inCheck = isKingInCheck(turn,board);

  if(!movesExist){
    gameOver=true;
    alert(inCheck?'Мат':'Пат');
  }
}

function anyLegalMoves(color){
  for(let y=0;y<ROWS;y++)
    for(let x=0;x<COLS;x++){
      const p=board[y][x];
      if(p && p.color===color){
        if(getLegalMoves(x,y).length) return true;
      }
    }
  return false;
}
ЛЕГАЛЬНЫЕ ХОДЫ
function getLegalMoves(x,y){
  const raw=generateMoves(x,y,board,false);
  const legal=[];
  for(const m of raw){
    const copy=cloneBoard(board);
    copy[m.y][m.x]=copy[y][x];
    copy[y][x]=null;
    if(!isKingInCheck(board[y][x].color,copy))
      legal.push(m);
  }
  return legal;
}
ГЕНЕРАЦИЯ ХОДОВ ФИГУР
function generateMoves(x,y,b,forCheck){
  const p=b[y][x];
  if(!p) return [];
  switch(p.type){
    case 'king': return genKing(x,y,p.color,b);
    case 'queen': return genQueen(x,y,p.color,b);
    case 'rook': return genRook(x,y,p.color,b);
    case 'bishop': return genBishop(x,y,p.color,b);
    case 'knight': return genKnight(x,y,p.color,b);
    case 'pawn': return genPawn(x,y,p.color,b);
    case 'snake': return genSnake(x,y,p.color,b);
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
  return [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]
    .map(v=>({x:x+v[0],y:y+v[1]}))
    .filter(m=>inside(m.x,m.y)&&!isAlly(b[m.y][m.x],c));
}

function genKnight(x,y,c,b){
  const d=[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
  return d.map(v=>({x:x+v[0],y:y+v[1]}))
    .filter(m=>inside(m.x,m.y)&&!isAlly(b[m.y][m.x],c));
}

function genPawn(x,y,c,b){
  const dir=c==='w'?-1:1;
  const r=[];
  if(inside(x,y+dir)&&!b[y+dir][x]) r.push({x,y:y+dir});
  for(const dx of [-1,1]){
    const nx=x+dx,ny=y+dir;
    if(inside(nx,ny)&&b[ny][nx]&&b[ny][nx].color!==c)
      r.push({x:nx,y:ny});
  }
  return r;
}
Змея три шага
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

Подсветка 
function highlight(){
  document.querySelectorAll('.overlay')
    .forEach(o=>o.className='overlay');

  if(!selected) return;

  document
    .querySelector(`.cell[data-x='${selected.x}'][data-y='${selected.y}'] .overlay`)
    ?.classList.add('highlight-selected');

  const moves=getLegalMoves(selected.x,selected.y);
  const c=board[selected.y][selected.x].color;

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
setup();
render();

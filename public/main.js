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

  if(selected){
    const moves=getLegalMoves(selected.x,selected.y);
    if(moves.some(m=>m.x===x&&m.y===y)){
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

// ================== MOVE ==================
function movePiece(sx,sy,tx,ty){
  const piece=board[sy][sx];
  board[ty][tx]={...piece,moved:true};
  board[sy][sx]=null;

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
      const choice=prompt('queen, rook, bishop, knight, snake','queen');
      const ok=['queen','rook','bishop','knight','snake'];
      p.type=ok.includes(choice)?choice:'queen';
    }
  }

  turn = turn==='w'?'b':'w';
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

  for(let y=0;y<ROWS;y++)
    for(let x=0;x<COLS;x++){
      const p=b[y][x];
      if(p&&p.color===enemy){
        const m=generateMoves(x,y,b);
        if(m.some(v=>v.x===k.x&&v.y===k.y)) return true;
      }
    }
  return false;
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
        case 'bishop':
          moves=genBishop(xx,yy,by,b); break;
        case 'queen':
          moves=genQueen(xx,yy,by,b); break;
        case 'knight':
          moves=genKnight(xx,yy,by,b); break;
        case 'snake':
          moves=genSnake(xx,yy,by,b); break;
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
  const inCheck=isKingInCheck(turn,board);
  if(!anyLegalMoves(turn)){
    gameOver=true;
    alert(inCheck?'Мат':'Пат');
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
  if(inside(x,y+dir)&&!b[y+dir][x]) r.push({x,y:y+dir});

  const start=(c==='w'?6:1);
  if(y===start && !b[y+dir][x] && !b[y+2*dir][x])
    r.push({x,y:y+2*dir});

  for(const dx of [-1,1]){
    const nx=x+dx,ny=y+dir;
    if(inside(nx,ny)&&b[ny][nx]&&b[ny][nx].color!==c)
      r.push({x:nx,y:ny});
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

// ================== START ==================
setup();
render();

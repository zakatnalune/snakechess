// ================== CONFIG ==================
const COLS = 10;
const ROWS = 8;
const IMG = 'img/';

const cellsImg = { w:'wcell.jpg', b:'bcell.jpg' };

const piecesImg = {
  w:{rook:'wrook.png',knight:'wknight.png',bishop:'wbishop.png',queen:'wqueen.png',king:'wking.png',pawn:'wpawn.png',snake:'wsnake.png'},
  b:{rook:'brook.png',knight:'bknight.png',bishop:'bbishop.png',queen:'bqueen.png',king:'bking.png',pawn:'bpawn.png',snake:'bsnake.png'}
};

const backRank = ['rook','knight','bishop','snake','queen','king','snake','bishop','knight','rook'];

// ================== STATE ==================
let board = [];
let selected = null;
let turn = 'w';

let capWhitePawns=[], capWhitePieces=[];
let capBlackPawns=[], capBlackPieces=[];

// ================== DOM ==================
const boardEl = document.getElementById('board');
const capW = document.getElementById('cap-white');
const capB = document.getElementById('cap-black');

// ================== HELPERS ==================
function inside(x,y){ return x>=0 && x<COLS && y>=0 && y<ROWS; }
function cloneBoard(b){ return b.map(r=>r.map(c=>c?{...c}:null)); }

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
setup();

// ================== RENDER ==================
function render(){
  boardEl.innerHTML='';
  for(let y=0;y<ROWS;y++){
    for(let x=0;x<COLS;x++){
      const cell=document.createElement('div');
      cell.className='cell';

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
  renderCaptured();
}
render();

// ================== CLICK ==================
function clickCell(x,y){
  if(selected){
    const moves=getLegalMoves(selected.x,selected.y);
    const ok=moves.find(m=>m.x===x&&m.y===y);
    if(ok){
      makeMove(selected.x,selected.y,x,y);
      selected=null;
      turn=turn==='w'?'b':'w';
      render();
      checkGameEnd();
      return;
    }
  }
  if(board[y][x] && board[y][x].color===turn) selected={x,y};
  else selected=null;
  render();
}

// ================== HIGHLIGHT ==================
function highlight(){
  document.querySelectorAll('.overlay').forEach(o=>o.className='overlay');
  if(!selected) return;

  const i=selected.y*COLS+selected.x;
  boardEl.children[i].querySelector('.overlay').classList.add('sel');

  getLegalMoves(selected.x,selected.y).forEach(m=>{
    const idx=m.y*COLS+m.x;
    const o=boardEl.children[idx].querySelector('.overlay');
    if(board[m.y][m.x]) o.classList.add('kill');
    else o.classList.add('move');
  });
}

// ================== MOVE ==================
function makeMove(sx,sy,tx,ty){
  const p=board[sy][sx];
  const t=board[ty][tx];
  if(t){
    if(t.color==='w'){
      t.type==='pawn'?capWhitePawns.push(t):capWhitePieces.push(t);
    }else{
      t.type==='pawn'?capBlackPawns.push(t):capBlackPieces.push(t);
    }
  }
  board[ty][tx]={...p,moved:true};
  board[sy][sx]=null;

  if(p.type==='pawn'){
    if((p.color==='w'&&ty===0)||(p.color==='b'&&ty===ROWS-1)){
      const c=prompt('promotion: queen rook bishop knight snake','queen');
      board[ty][tx].type=['queen','rook','bishop','knight','snake'].includes(c)?c:'queen';
    }
  }
}

// ================== CAPTURED ==================
function renderCaptured(){
  capW.innerHTML=''; capB.innerHTML='';
  [...capWhitePawns,...capWhitePieces].forEach(p=>{
    const i=document.createElement('img');
    i.src=IMG+piecesImg[p.color][p.type];
    capW.appendChild(i);
  });
  [...capBlackPawns,...capBlackPieces].forEach(p=>{
    const i=document.createElement('img');
    i.src=IMG+piecesImg[p.color][p.type];
    capB.appendChild(i);
  });
}

// ================== MOVE GENERATION ==================
function getLegalMoves(x,y){
  const p=board[y][x];
  if(!p) return [];
  let moves=[];
  if(p.type==='king') moves=genKing(x,y,p.color);
  if(p.type==='queen') moves=ray(x,y,[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],p.color);
  if(p.type==='rook') moves=ray(x,y,[[1,0],[-1,0],[0,1],[0,-1]],p.color);
  if(p.type==='bishop') moves=ray(x,y,[[1,1],[1,-1],[-1,1],[-1,-1]],p.color);
  if(p.type==='knight') moves=genKnight(x,y,p.color);
  if(p.type==='pawn') moves=genPawn(x,y,p.color);
  if(p.type==='snake') moves=genSnake(x,y,p.color);

  // фильтр шаха
  return moves.filter(m=>{
    const b=cloneBoard(board);
    b[m.y][m.x]=b[y][x];
    b[y][x]=null;
    return !isKingInCheck(p.color,b);
  });
}

function ray(x,y,dirs,color){
  const r=[];
  for(const d of dirs){
    let nx=x+d[0], ny=y+d[1];
    while(inside(nx,ny)){
      const t=board[ny][nx];
      if(!t) r.push({x:nx,y:ny});
      else{ if(t.color!==color) r.push({x:nx,y:ny}); break; }
      nx+=d[0]; ny+=d[1];
    }
  }
  return r;
}

function genKnight(x,y,c){
  const d=[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
  return d.map(v=>({x:x+v[0],y:y+v[1]}))
    .filter(m=>inside(m.x,m.y)&&(!board[m.y][m.x]||board[m.y][m.x].color!==c));
}

function genKing(x,y,c){
  const d=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  return d.map(v=>({x:x+v[0],y:y+v[1]}))
    .filter(m=>inside(m.x,m.y)&&(!board[m.y][m.x]||board[m.y][m.x].color!==c));
}

function genPawn(x,y,c){
  const r=[], d=c==='w'?-1:1;
  if(inside(x,y+d)&&!board[y+d][x]) r.push({x,y:y+d});
  const start=c==='w'?6:1;
  if(y===start&&!board[y+d][x]&&!board[y+2*d][x]) r.push({x,y:y+2*d});
  for(const dx of[-1,1]){
    const nx=x+dx, ny=y+d;
    if(inside(nx,ny)&&board[ny][nx]&&board[ny][nx].color!==c) r.push({x:nx,y:ny});
  }
  return r;
}

// ================== 🐍 SNAKE ==================
function genSnake(x,y,color){
  const diag={NE:[1,-1],NW:[-1,-1],SE:[1,1],SW:[-1,1]};
  const pat=[['NW','NE'],['NE','NW'],['NE','SE'],['SE','NE'],['SE','SW'],['SW','SE'],['SW','NW'],['NW','SW']];
  const res=[];
  for(const p of pat){
    let cx=x,cy=y;
    for(let s=0;s<4;s++){
      const d=diag[p[s%2]];
      cx+=d[0]; cy+=d[1];
      if(!inside(cx,cy)) break;
      const t=board[cy][cx];
      if(t&&t.color===color) break;
      res.push({x:cx,y:cy});
      if(t) break;
    }
  }
  return [...new Map(res.map(m=>[m.x+','+m.y,m])).values()];
}

// ================== CHECK ==================
function isKingInCheck(color,b){
  let kx,ky;
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    const p=b[y][x];
    if(p&&p.type==='king'&&p.color===color){kx=x;ky=y;}
  }
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    const p=b[y][x];
    if(p&&p.color!==color){
      const ms=getLegalMovesRaw(x,y,p,b);
      if(ms.find(m=>m.x===kx&&m.y===ky)) return true;
    }
  }
  return false;
}

function getLegalMovesRaw(x,y,p,b){
  board=b;
  let r=[];
  if(p.type==='queen') r=ray(x,y,[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],p.color);
  if(p.type==='rook') r=ray(x,y,[[1,0],[-1,0],[0,1],[0,-1]],p.color);
  if(p.type==='bishop') r=ray(x,y,[[1,1],[1,-1],[-1,1],[-1,-1]],p.color);
  if(p.type==='knight') r=genKnight(x,y,p.color);
  if(p.type==='pawn') r=genPawn(x,y,p.color);
  if(p.type==='snake') r=genSnake(x,y,p.color);
  if(p.type==='king') r=genKing(x,y,p.color);
  return r;
}

// ================== END GAME ==================
function hasAnyLegalMove(c){
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    if(board[y][x]&&board[y][x].color===c){
      if(getLegalMoves(x,y).length) return true;
    }
  }
  return false;
}

function checkGameEnd(){
  const check=isKingInCheck(turn,board);
  const moves=hasAnyLegalMove(turn);
  if(!moves){
    alert(check?'МАТ':'ПАТ');
  }else if(check){
    alert('ШАХ');
  }
}

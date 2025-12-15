<<<<<<< HEAD
const COLS = 10;
const ROWS = 8;
const IMG = 'img/';

const cellsImg = {
  w: 'wcell.jpg',
  b: 'bcell.jpg'
};

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

const back = ['rook','knight','bishop','snake','queen','king','snake','bishop','knight','rook'];

let board = [];
let selected = null;
let turn = 'w';

const boardEl = document.getElementById('board');

function inside(x,y){ return x>=0 && x<COLS && y>=0 && y<ROWS; }

function setup(){
  board = Array.from({length:ROWS},()=>Array(COLS).fill(null));
  for(let x=0;x<COLS;x++){
    board[0][x]={type:back[x],color:'b'};
    board[1][x]={type:'pawn',color:'b'};
    board[6][x]={type:'pawn',color:'w'};
    board[7][x]={type:back[x],color:'w'};
  }
}

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
}

function clickCell(x,y){
  if(selected){
    const ms = snakeMoves(selected.x,selected.y,board[selected.y][selected.x].color);
    if(ms.some(m=>m.x===x && m.y===y)){
      board[y][x]=board[selected.y][selected.x];
      board[selected.y][selected.x]=null;
      selected=null;
      render();
      return;
    }
  }
  if(board[y][x]) selected={x,y};
  else selected=null;
  render();
}

function highlight(){
  document.querySelectorAll('.overlay').forEach(o=>o.classList.remove('sel','move'));
  if(!selected) return;
  const idx = selected.y*COLS+selected.x;
  boardEl.children[idx].querySelector('.overlay').classList.add('sel');
  snakeMoves(selected.x,selected.y,board[selected.y][selected.x].color)
    .forEach(m=>{
      const i=m.y*COLS+m.x;
      boardEl.children[i].querySelector('.overlay').classList.add('move');
    });
}

/* 🐍 ЗМЕЯ — ПРАВИЛЬНЫЙ МАЯТНИК */
function snakeMoves(x,y,color){
  const patterns = [
    [[-1,-1],[1,-1],[-1,-1],[1,-1]],
    [[1,-1],[-1,-1],[1,-1],[-1,-1]],
    [[1,-1],[1,1],[1,-1],[1,1]],
    [[1,1],[1,-1],[1,1],[1,-1]],
    [[1,1],[-1,1],[1,1],[-1,1]],
    [[-1,1],[1,1],[-1,1],[1,1]],
    [[-1,1],[-1,-1],[-1,1],[-1,-1]],
    [[-1,-1],[-1,1],[-1,-1],[-1,1]]
  ];

  const res=[];
  for(const seq of patterns){
    let cx=x, cy=y;
    for(const d of seq){
      cx+=d[0]; cy+=d[1];
      if(!inside(cx,cy)) break;
      if(board[cy][cx] && board[cy][cx].color===color) break;
      res.push({x:cx,y:cy});
      if(board[cy][cx]) break;
    }
  }
  return res;
}

setup();
render();
=======
const COLS = 10;
const ROWS = 8;
const IMG = 'img/';

const cellsImg = {
  w: 'wcell.jpg',
  b: 'bcell.jpg'
};

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

const back = ['rook','knight','bishop','snake','queen','king','snake','bishop','knight','rook'];

let board = [];
let selected = null;
let turn = 'w';

const boardEl = document.getElementById('board');

function inside(x,y){ return x>=0 && x<COLS && y>=0 && y<ROWS; }

function setup(){
  board = Array.from({length:ROWS},()=>Array(COLS).fill(null));
  for(let x=0;x<COLS;x++){
    board[0][x]={type:back[x],color:'b'};
    board[1][x]={type:'pawn',color:'b'};
    board[6][x]={type:'pawn',color:'w'};
    board[7][x]={type:back[x],color:'w'};
  }
}

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
}

function clickCell(x,y){
  if(selected){
    const ms = snakeMoves(selected.x,selected.y,board[selected.y][selected.x].color);
    if(ms.some(m=>m.x===x && m.y===y)){
      board[y][x]=board[selected.y][selected.x];
      board[selected.y][selected.x]=null;
      selected=null;
      render();
      return;
    }
  }
  if(board[y][x]) selected={x,y};
  else selected=null;
  render();
}

function highlight(){
  document.querySelectorAll('.overlay').forEach(o=>o.classList.remove('sel','move'));
  if(!selected) return;
  const idx = selected.y*COLS+selected.x;
  boardEl.children[idx].querySelector('.overlay').classList.add('sel');
  snakeMoves(selected.x,selected.y,board[selected.y][selected.x].color)
    .forEach(m=>{
      const i=m.y*COLS+m.x;
      boardEl.children[i].querySelector('.overlay').classList.add('move');
    });
}

/* 🐍 ЗМЕЯ — ПРАВИЛЬНЫЙ МАЯТНИК */
function snakeMoves(x,y,color){
  const patterns = [
    [[-1,-1],[1,-1],[-1,-1],[1,-1]],
    [[1,-1],[-1,-1],[1,-1],[-1,-1]],
    [[1,-1],[1,1],[1,-1],[1,1]],
    [[1,1],[1,-1],[1,1],[1,-1]],
    [[1,1],[-1,1],[1,1],[-1,1]],
    [[-1,1],[1,1],[-1,1],[1,1]],
    [[-1,1],[-1,-1],[-1,1],[-1,-1]],
    [[-1,-1],[-1,1],[-1,-1],[-1,1]]
  ];

  const res=[];
  for(const seq of patterns){
    let cx=x, cy=y;
    for(const d of seq){
      cx+=d[0]; cy+=d[1];
      if(!inside(cx,cy)) break;
      if(board[cy][cx] && board[cy][cx].color===color) break;
      res.push({x:cx,y:cy});
      if(board[cy][cx]) break;
    }
  }
  return res;
}

setup();
render();
>>>>>>> 0130a033ac6cffbcadfba197d3490fc212a542f2

// This imports the socket.io client code
import { io } from "socket.io-client";

// This imports the INCREMENT value from the /common/chess.js file. Files in the
// /common directory should be accessible from both the client and server.
import State, { BLACK_OWNER, INCREMENT, WHITE_OWNER } from "../common/chess";


console.log("Hello from the browser!");
console.log(`The increment is: ${INCREMENT}`);

// Create a socket.io client instance (this will automatically connect to
// the socket.io server).
const socket = io();

// This will be called when the socket gets connected.
socket.on("connect", () => {
    console.log(`${socket.id} connected!`);
});

const myCanvas = document.getElementById("chessBoard");
const ctx = myCanvas.getContext("2d");

const state = State.default();
const moveDot= new Image();
moveDot.src = 'assets/textures/move_dot.png';
const pieceNames = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
const whitePieceImgs = pieceNames.map(name => 'assets/textures/light_' + name + '.png')
    .map(path => {
        const image = new Image();
        image.src = path;
        return image;
    });
const blackPieceImgs = pieceNames.map(name => 'assets/textures/dark_' + name + '.png')
    .map(path => {
        const image = new Image();
        image.src = path;
        return image;
    });


console.log(whitePieceImgs)

console.log(state);
const devicePixelRatio = window.devicePixelRatio || 1; //get the ratio of any display 
const displayWidth = 880;
const displayHeight = 880;
myCanvas.width = displayWidth * devicePixelRatio;  //canvas resolution 
myCanvas.height = displayHeight * devicePixelRatio;
myCanvas.style.width = displayWidth + 'px';  //scale canvas height + width 
myCanvas.style.height = displayHeight + 'px';
ctx.scale(devicePixelRatio, devicePixelRatio); //scale according to the API value, in this case 2  //so it scale by a value of 200%


let grid = [];
let columns = 16;
let rows = 16;
 //imagine clockwised direction where up is on top of your head, then right, then down, and then left

let turn = 0;

let mouseTileX = 0, mouseTileY = 0;
let selected = false, selectedX = 0, selectedY = 0;

let size = (displayHeight / columns);  //calculate the size of each square

let gridInitialized = false;

//create a Cell object, which can be assigned method for later use
class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.isWall = false;
        this.isMud = false
        this.isObstacle = false;
    }
    show(color) {
        let x_coor = this.x * size;
        let y_coor = this.y * size;
        ctx.fillStyle = color;
        ctx.fillRect(x_coor, y_coor, size, size);
    }
    setWall(color) {  //create a new method to color the wall and set the state
        this.isWall = true;
        this.isObstacle = true
        this.colorWall = color;
        this.show(color);
    }
    setMud(color) {  //create a new method to color the wall and set the state
        this.isMud = true;
        this.isObstacle = true
        this.colorMud = color;
        this.show(color);
    }
}

function drawBoard() {
    colorBoard();   //the board has to be drawn first
    drawObstacles(); //draw the obstacle again each time the board is drawn
    drawPieces();
    if (selected) {
        showMoves();
    }

    if (turn === WHITE_OWNER) {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText('white\'s turn.', 10, 600);
        ctx.strokeText('white\'s turn.', 10, 600);
    } else {
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'white';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText('black\'s turn.', 10, 600);
        ctx.strokeText('black\'s turn.', 10, 600);
    }
}

window.addEventListener('load', function(){   //draw the board after the html/css load
    createGrid();
    drawBoard();
    randomObstacle();
});

myCanvas.addEventListener('mousemove',function(event){ //mouse listener that displays possible moves of pieces when clicked 
    mouseTileX = Math.floor(event.offsetX / size);
    mouseTileY = Math.floor(event.offsetY / size);
});

myCanvas.addEventListener('click', () => {
    if (selected) {
        const piece = state.pieceAt(selectedX, selectedY);
        const moves = state.pieceMoves(piece);
        const requestedMove = moves.find((m) => m.getX() === mouseTileX && m.getY() === mouseTileY);
        
        if (requestedMove) {
            state.makeMove(requestedMove);
            selected = false;
            turn = 1 - turn;
        } else {
            selected = false;
        }
    } else {
        const piece = state.pieceAt(mouseTileX, mouseTileY);
        if (piece && piece.owner === turn) {
            selected = true;
            selectedX = mouseTileX;
            selectedY = mouseTileY;
        }
    }

    drawBoard();
    if (selected) {
        showMoves();
    }
});


function createGrid(){
    if(!gridInitialized){    //only create the grid one time 
        for( let y = 0; y < rows; y++){      //for each row, iterate for each column
            for( let x = 0; x < columns; x++){      
                let cell = new Cell(x, y);          // make new Cell objects
                grid.push(cell);                    //push those Cells into the grid            
            }
        }
        gridInitialized = true;   // this function is done after the grid is create
    }
}

function colorBoard(){
    for(let i = 0; i < grid.length; i++){    
        let row = Math.floor(i / columns);       
        let col = i % columns;
        if((row + col) % 2 === 0) {     //if 
            grid[i].show('#F5DCE0');    //Since grid[i] is a Cell object, we can use the show() method
        } else {
            grid[i].show('#E18AAA');
        }
    }
}

function drawObstacles() {   
    for(let i = 0; i < grid.length; i++) {
        if (grid[i].isWall) {
            grid[i].show(grid[i].colorWall);
        }
        else if(grid[i].isMud){
            grid[i].show(grid[i].colorMud);
        }
    }
}

function drawPieces(){
    for(const piece of state.pieces){
        if(piece.owner===BLACK_OWNER){
            ctx.drawImage(blackPieceImgs[piece.type],piece.x*size,piece.y*size,size,size);
        }
        else {
            ctx.drawImage(whitePieceImgs[piece.type],piece.x*size,piece.y*size,size,size);
        }
    }
}

function showMoves(){
    const piece = state.pieceAt(Math.floor(selectedX), Math.floor(selectedY));
    if (piece) {
        console.log(piece);
        const moves = state.pieceMoves(piece);
        console.log(moves);
        for (const move of moves) {
            ctx.drawImage(moveDot, move.x * size, move.y * size, size, size);
        }
    }
}

function randomObstacle(){
    let wallColor = 'orange';
    let mudColor = 'brown';
    let minRow = 5;
    let maxRow = 11;
    let numWall = 7;
    let numMud = 12;
    let drawMud = "Mud"
    let drawWall = "Wall"
    const direction_mud = [
        [ 0, -1], [ 0, 1],//up and down diretion respectively
        [ 1,  0], [-1, 0],//right and left direction respectively
        [ 1, -1], [ 1, 1],//diagonal up right and down right respectively
        [-1, -1], [-1, 1] //diagonal up left and down left respectively
    ];
    const directions_wall = [
        [ 0, -1],  //up
        [ 1,  0],  //right
        [ 0,  1],  //down
        [-1,  0],   //left
    ];
    //generateWall(numWall, minRow,maxRow, wallColor);
    generateObstacles(direction_mud, numMud, minRow, maxRow, mudColor, drawMud);
    generateObstacles(directions_wall, numWall, minRow, maxRow, wallColor, drawWall);

}

function generateObstacles(directionChoice, number, minRow, maxRow, Color, type){
    const startX = 13 - 2 + 1;
    const startY = maxRow - minRow + 1;
    let currentX = Math.floor(Math.random()  * startX) + 2;
    let currentY = Math.floor(Math.random()  * startY) + minRow;

    let ranDirection = Math.floor(Math.random() * directionChoice.length);  //random a number between 0 and 7 to access the direction
    let numCell = 0;
    let nextX,nextY;
    while(numCell < number){
        let gridIndex = currentY * columns + currentX;  //choose a Cell to start
        if (currentX >= 0 && currentX < columns && 
            currentY >= 0 && currentY < rows &&
            gridIndex >= 0 && gridIndex < grid.length){   //if the coordinate is not out of bound
            // Check if there's a piece at this designated position
            const piece = state.pieceAt(currentX, currentY);
            // Only place obscacle if cell is empty (no piece, not a wall, not mud)
            if (!piece && !grid[gridIndex].isWall && !grid[gridIndex].isMud) {
                if(type == "Mud"){
                    grid[gridIndex].setMud(Color); 
                    numCell += 1; 
                }
                else if(type == "Wall"){
                    grid[gridIndex].setWall(Color);
                    numCell += 1; 
                }
            }
        }
        //create 2 variable to check if the next X and Y is valid
        ranDirection = Math.floor(Math.random() * directionChoice.length);
        nextX = currentX + directionChoice[ranDirection][0];
        nextY = currentY + directionChoice[ranDirection][1];
        gridIndex = nextY * columns + nextX;
        let isNextValid = false   //initiallize it to unvalid
        while(!isNextValid){  
            if (nextX >= 0 && nextX < columns && 
                nextY >= 0 && nextY < rows && grid[gridIndex].isObstacle == false){
                    currentX += directionChoice[ranDirection][0];
                    currentY += directionChoice[ranDirection][1];
                    isNextValid = true;
                }
            else{
                ranDirection = Math.floor(Math.random() * directionChoice.length);
                nextX = currentX + directionChoice[ranDirection][0];
                nextY = currentY + directionChoice[ranDirection][1];
                gridIndex = nextY * columns + nextX;
            }
        }
    }
}
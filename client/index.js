// This imports the socket.io client code
import { io } from "socket.io-client";

// This imports the INCREMENT value from the /common/chess.js file. Files in the
// /common directory should be accessible from both the client and server.
import { BLACK_OWNER, INCREMENT, State } from "../common/chess";


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
const pieceNames = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
const whitePieceImgs = pieceNames.map(name => 'textures/light_' + name + '.png')
    .map(path => {
        const image = new Image();
        image.src = path;
        return image;
    });
const blackPieceImgs = pieceNames.map(name => 'textures/dark_' + name + '.png')
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
const directions = [
    0,  //up
    1,  //right
    2,  //down
    3   //left
];

let size = (displayHeight / columns);  //calculate the size of each square

//create a Cell object, which can be assigned method for later use
class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.isObstacle = false;
    }
    show(color) {
        let x_coor = this.x * size;
        let y_coor = this.y * size;
        ctx.fillStyle = color;
        ctx.fillRect(x_coor, y_coor, size, size);
    }
}

window.addEventListener('load', function() {   //draw the board after the html/css load
    createGrid();
    colorBoard();
    randomObstacle();
    drawPieces();
})

function createGrid(){
    for( let y = 0; y < rows; y++){      //for each row, iterate for each column
        for( let x = 0; x < columns; x++){      
            let cell = new Cell(x, y);          // make new Cell objects
            grid.push(cell);                    //push those Cells into the grid            
        }
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

function drawPieces(){
    for(const piece of state.pieces){
        if(piece.owner===BLACK_OWNER){
            ctx.drawImage(blackPieceImgs[piece.type],piece.x*size,piece.y*size,size,size)
        }
        else {
            ctx.drawImage(whitePieceImgs[piece.type],piece.x*size,piece.y*size,size,size)
        }
    }
}

function randomObstacle(){
    const wallColor = 'orange';
    const mudColor = 'brown';
    const minRow = 5;
    const maxRow = 11;
    generateDirection(minRow,maxRow, wallColor);
    generateDirection(minRow, maxRow, mudColor);
}

function generateDirection(minRow, maxRow, Color){
    console.log("Hello")
    //choose a random start Cell between row 4-12
    //Math.random() creates a float between 0 and 1, startRange indicates we only want the wall to generates
    //in the 7 rows length, minRow is our start row
    const startRange = maxRow - minRow + 1;
    let ranDirection;
    let ranStart = Math.floor(Math.random() * (16 * startRange)) + 16*minRow;  

    while(grid[ranStart].isObstacle == true){
       ranStart = Math.floor(Math.random() * (16 * startRange)) + 16*minRow; 
    }

    //choose a random number of direction between 0 and 3
    ranDirection = Math.floor(Math.random() * directions.length); 
    grid[ranStart].show(Color);   //color the obstacle cell 
    grid[ranStart].isObstacle = true;     //set the obstacle status of that cell
    //create a current variable to keep track of the current Cell
    let current = ranStart;

    //loop to draw 5 more cells
    for(let i = 0; i < 5 ; i++){  
        //choose the next Cell
        let chooseCell = false;  //mark that we haven't chose any cell to be our next cell
        while (chooseCell == false){   //loop until we choose a valid next cell
            if (ranDirection == 0 && grid[current].y > minRow && !grid[current - 16].isObstacle){    //if direction is up, not out of bound, and the cell is not an obstacle when we apply the math
                current = current - 16;   
                chooseCell = true;
            }
            else if (ranDirection == 1 && grid[current].x < 15 && !grid[current + 1].isObstacle){ //if direction is right and not in the last column
                current = current + 1;
                chooseCell = true;
            }
            else if (ranDirection == 2 && grid[current].y < (startRange + minRow) && !grid[current + 16].isObstacle){  //if direction is down and not out of bound
                current = current + 16;
                chooseCell = true;
            }
            else if (ranDirection == 3 && grid[current].x > 0 && !grid[current - 1].isObstacle){  //if direction is left and not in the 1st column
                current = current - 1;
                chooseCell = true;
            }
            else{    //if those conditions above is not fulfilled, choose another direction
                ranDirection = Math.floor(Math.random() * directions.length);
            }
        }
        grid[current].show(Color);   //color the obstacle cell 
        grid[current].isObstacle = true;     //set the obstacle status of that cell
    }   
}



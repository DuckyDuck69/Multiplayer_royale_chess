// This imports the socket.io client code
import { io } from "socket.io-client";

// This imports the INCREMENT value from the /common/chess.js file. Files in the
// /common directory should be accessible from both the client and server.
import { INCREMENT } from "../common/chess";

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

let size = (displayHeight / columns);  //calculate the size of each square

//create a Cell object, which can be assigned method for later use
function Cell(x, y){                        
    this.x = x;
    this.y = y;
    this.show = function(color){              //declare a method of the Cell object, which is used to color Cell
        let x_coor = this.x * size;           
        let y_coor = this.y * size;
        ctx.fillStyle = color;
        ctx.fillRect(x_coor, y_coor, size, size);
    }
}

window.addEventListener('load', function() {   //draw the board after the html/css load
    createGrid();
    colorBoard();
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




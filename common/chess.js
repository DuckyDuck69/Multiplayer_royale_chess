const myCanvas = document.getElementById("chessBoard");
const ctx = myCanvas.getContext("2d");
myCanvas.width = 1600;
myCanvas.height = 1600;

let grid = [];
let columns = 16;
let rows = 16;

let size = Math.floor(myCanvas.height / columns);  //calculate the size of each square

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




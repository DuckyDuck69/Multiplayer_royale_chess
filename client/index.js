// This imports the socket.io client code
import JSum from "jsum";
import { io } from "socket.io-client";

// This imports the INCREMENT value from the /common/chess.js file. Files in the
// /common directory should be accessible from both the client and server.
import State, { BLACK_OWNER, INCREMENT, WHITE_OWNER } from "../common/chess";
import { ObstacleType } from "../common/obstacle";
import { PieceTags, PieceType } from "../common/piece";
import Move from "../common/move";

console.log("Hello from the browser!");
console.log(`The increment is: ${INCREMENT}`);

// Create a socket.io client instance (this will automatically connect to
// the socket.io server).
const socket = io();
let state = State.default();
let owner, stateSum;

// This will be called when the socket gets connected.
socket.on("connect", () => {
    console.log(`${socket.id} connected!`);
});

socket.on("state", (data) => {
    state = State.deserialize(data.state);
    stateSum = data.sum;
    owner = data.owner;
    if (!grid.length) {
        createGrid();
    }
    drawBoard();
});

socket.on("move", (data) => {
    const { move, sum } = data;
    const execMove = Move.deserialize(move);
    state.makeMove(execMove);

    if (
        execMove.getPiece().getX() === selectedX &&
        execMove.getPiece().getY() === selectedY
    ) {
        selected = false;
    }

    stateSum = JSum.digest(state, "SHA256", "hex");

    if (stateSum !== sum) {
        socket.emit("state_request");
    }

    drawBoard();
});

function makeMove(move) {
    socket.emit("move", { move: move.serialize(), sum: stateSum });
}

const myCanvas = document.getElementById("chessBoard");
const ctx = myCanvas.getContext("2d");

const stunImg = new Image();
stunImg.src = "assets/textures/stun.png";

const chimeraMoveableImg = new Image();
chimeraMoveableImg.src = "assets/textures/chimera_moveable.png";

const juggernautStrengthImg = [1, 2, 3].map((n) => {
    const image = new Image();
    image.src = `assets/textures/juggernaut_strength_${n}.png`;
    return image;
});

const moveDot = new Image();
moveDot.src = "assets/textures/move_dot.png";
const pieceNames = [
    "pawn",
    "knight",
    "bishop",
    "rook",
    "queen",
    "king",
    "lion_chimera",
    "goat_chimera",
    "medusa",
    "pegasus",
    "juggernaut",
    "builder",
];
const whitePieceImgs = pieceNames
    .map((name) => "assets/textures/light_" + name + ".png")
    .map((path) => {
        const image = new Image();
        image.src = path;
        return image;
    });
const blackPieceImgs = pieceNames
    .map((name) => "assets/textures/dark_" + name + ".png")
    .map((path) => {
        const image = new Image();
        image.src = path;
        return image;
    });

const obstacleImages = ["mountain", "mud"]
    .map((name) => `assets/textures/${name}.png`)
    .map((path) => {
        const image = new Image();
        image.src = path;
        return image;
    });

console.log(whitePieceImgs);

console.log(state);
const devicePixelRatio = window.devicePixelRatio || 1; //get the ratio of any display
const displayWidth = 880;
const displayHeight = 880;
myCanvas.width = displayWidth * devicePixelRatio; //canvas resolution
myCanvas.height = displayHeight * devicePixelRatio;
myCanvas.style.width = displayWidth + "px"; //scale canvas height + width
myCanvas.style.height = displayHeight + "px";
ctx.scale(devicePixelRatio, devicePixelRatio); //scale according to the API value, in this case 2  //so it scale by a value of 200%

let grid = [];
let columns = 100;
let rows = 100;

//initialize camera view
let camX = 0;
let camY = 0;
const visibleRows = 16;
const visibleCols = 16;

let mouseTileX = 0,
    mouseTileY = 0;
let selected = false,
    selectedX = 0,
    selectedY = 0;

let size = displayHeight / visibleCols; //calculate the size of each square

let gridInitialized = false;

//create a Cell object, which can be assigned method for later use
class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.isWall = false;
        this.isMud = false;
        this.isObstacle = false;
    }
    show(color) {
        let x_coor = (this.x - camX) * size;
        let y_coor = (this.y - camY) * size;
        console.log("This is x coor", x_coor);
        ctx.fillStyle = color;
        ctx.fillRect(x_coor, y_coor, size, size);
    }
    setWall(color) {
        //create a new method to color the wall and set the state
        this.isWall = true;
        this.isObstacle = true;
        this.colorWall = color;
        this.show(color);
    }
    setMud(color) {
        //create a new method to color the wall and set the state
        this.isMud = true;
        this.isObstacle = true;
        this.colorMud = color;
        this.show(color);
    }
}

function drawBoard() {
    colorBoard(); //the board has to be drawn first
    drawObstacles(); //draw the obstacle again each time the board is drawn
    drawPieces();
    if (selected) {
        showMoves();
    }
}

window.addEventListener("load", function () {
    //draw the board after the html/css load
    createGrid();
    drawBoard();
    // randomObstacle();
});

myCanvas.addEventListener("mousemove", function (event) {
    //mouse listener that displays possible moves of pieces when clicked
    mouseTileX = Math.floor(event.offsetX / size);
    mouseTileY = Math.floor(event.offsetY / size);
});

myCanvas.addEventListener("click", () => {
    if (selected) {
        const piece = state.pieceAt(selectedX, selectedY);
        const moves = state.pieceMoves(piece);
        const requestedMove = moves.find(
            (m) => m.getX() === mouseTileX && m.getY() === mouseTileY
        );

        if (requestedMove) {
            // state.makeMove(requestedMove);
            makeMove(requestedMove);
        }

        selected = false;
    } else {
        const piece = state.pieceAt(mouseTileX, mouseTileY);
        if (piece && state.pieceMoves(piece).length > 0) {
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

function createGrid() {
    if (!gridInitialized) {
        //only create the grid one time
        for (let y = 0; y < rows; y++) {
            //for each row, iterate for each column
            for (let x = 0; x < columns; x++) {
                let cell = new Cell(x, y); // make new Cell objects
                grid.push(cell); //push those Cells into the grid
            }
        }
        gridInitialized = true; // this function is done after the grid is create
    }
}

function colorBoard() {
    /*
    Color the visible board
    */
    for (let x = camX; x < camX + visibleCols; x++) {
        for (let y = camY; y < camY + visibleRows; y++) {
            let num = x + y * columns; //retrive the Cell number
            let row = y;
            //color differently for even and odd rows since now the board is 100x100 and we only color a part of it
            if (row % 2 === 0) {
                if (num % 2 === 0) {
                    grid[num].show("#F5DCE0"); //Since grid[i] is a Cell object, we can use the show() method
                } else {
                    grid[num].show("#E18AAA");
                }
            } else {
                if (num % 2 != 0) {
                    grid[num].show("#F5DCE0"); //Since grid[i] is a Cell object, we can use the show() method
                } else {
                    grid[num].show("#E18AAA");
                }
            }
        }
    }
}

function drawObstacles() {
    for (const obstacle of state.board.obstacles) {
        ctx.drawImage(
            obstacleImages[obstacle.getType()],
            obstacle.x * size,
            obstacle.y * size,
            size,
            size
        );
    }
}

function drawPieces() {
    for (const piece of state.pieces) {
        if (piece.owner === BLACK_OWNER) {
            ctx.drawImage(
                blackPieceImgs[piece.type],
                piece.x * size,
                piece.y * size,
                size,
                size
            );
        } else {
            ctx.drawImage(
                whitePieceImgs[piece.type],
                piece.x * size,
                piece.y * size,
                size,
                size
            );
        }
        if (piece.isStunned()) {
            ctx.drawImage(stunImg, piece.x * size, piece.y * size, size, size);
        }
        if (piece.getType() === PieceType.Juggernaut) {
            ctx.drawImage(
                juggernautStrengthImg[piece.getJuggernautStrength() - 1],
                piece.x * size,
                piece.y * size,
                size,
                size
            );
        }
        if (piece.isChimera() && piece.hasTag(PieceTags.ChimeraMoveable)) {
            ctx.drawImage(
                chimeraMoveableImg,
                piece.x * size,
                piece.y * size,
                size,
                size
            );
        }
    }
}

function showMoves() {
    const piece = state.pieceAt(Math.floor(selectedX), Math.floor(selectedY));
    if (piece) {
        const moves = state.pieceMoves(piece);
        for (const move of moves) {
            ctx.drawImage(moveDot, move.x * size, move.y * size, size, size);
        }
    }
}

//button redirection
document.getElementById("tutorialButton").addEventListener("click", () => {
    window.location.href = "tutorial.html"; // Redirect to the tutorial page
});
///Modal
document.addEventListener("DOMContentLoaded", function () {
    // Get the modal
    const modal = document.getElementById("guideModal");

    // Get the button that opens the modal
    const btn = document.getElementById("guideButton");

    // Get the <span> element that closes the modal
    const span = document.getElementsByClassName("close-button")[0];

    // When the user clicks on the button, open the modal
    btn.onclick = function () {
        modal.style.display = "block";
    };

    // When the user clicks on <span> (x), close the modal
    span.onclick = function () {
        modal.style.display = "none";
    };

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
});

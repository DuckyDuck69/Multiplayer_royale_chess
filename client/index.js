// This imports the socket.io client code
import { io } from "socket.io-client";

// This imports the INCREMENT value from the /common/chess.js file. Files in the
// /common directory should be accessible from both the client and server.
import State, { BLACK_OWNER, WHITE_OWNER } from "../common/chess";
import { ObstacleType } from "../common/obstacle";
import Piece, { PieceTags, PieceType } from "../common/piece";
import Move from "../common/move";

console.log("Hello from the browser!");
// console.log(`The increment is: ${INCREMENT}`);

// Create a socket.io client instance (this will automatically connect to
// the socket.io server).
const socket = io();
let state = State.default();
let owner, stateSum;

const start = Date.now();

// This will be called when the socket gets connected.
socket.on("connect", () => {
    console.log(`${socket.id} connected!`);
});

socket.on("state", (data) => {
    state = State.deserialize(data.state);

    if (state.hasLost(WHITE_OWNER)) {
        showWinScreen("Black");
        return;
    } else if (state.hasLost(BLACK_OWNER)) {
        showWinScreen("White");
        return;
    }

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

    if (state.hasLost(WHITE_OWNER)) {
        showWinScreen("Black");
        return;
    } else if (state.hasLost(BLACK_OWNER)) {
        showWinScreen("White");
        return;
    }

    if (
        execMove.getPiece().getX() === selectedX &&
        execMove.getPiece().getY() === selectedY
    ) {
        selected = false;
    }

    stateSum = State.sum(state);

    if (stateSum !== sum) {
        console.warn("client-server desync, requesting full update...");
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

const resourceImages = ["resource_1", "resource_2", "resource_5"]
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
export const BOARD_WIDTH = 160;
export const BOARD_HEIGHT = 160;

//initialize camera view
let camX = 0;
let camY = 0;
let visibleRow = 16;
let visibleCols = 16;
let dragSpeed = 1;

let mouseTileX = 0,
    mouseTileY = 0;
let selected = false,
    selectedX = 0,
    selectedY = 0;

let size = displayHeight / visibleCols; //calculate the size of each square

let gridInitialized = false;

//declare camera movements
let isDragging = false;
let moveStartX = 0,
    moveStartY = 0;
let dragTileX, dragTileY;

//create a Cell object, which can be assigned method for later use
export default class Tile {
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
        ctx.fillStyle = color;
        ctx.fillRect(x_coor, y_coor, size, size);
    }
    setWall() {
        //create a new method to color the wall and set the state
        this.isWall = true;
        this.isObstacle = true;
    }
    setMud() {
        //create a new method to color the wall and set the state
        this.isMud = true;
        this.isObstacle = true;
    }
    toScreenCoor() {
        return {
            screenX: (this.x - camX) * size,
            screenY: (this.y - camY) * size
        }
    }
}

function zoomIn() {
    if (visibleCols > 2) {
        visibleCols -= 2;
        visibleRow -= 2;
        size = displayHeight / visibleCols
        drawBoard();
    }
    console.log("zoom in")
}
function zoomOut() {
    console.log("zoom out")
    if (visibleCols <= BOARD_HEIGHT - 2) {
        console.log(visibleCols)
        visibleCols += 2;
        visibleRow += 2;
        size = displayHeight / visibleCols
        drawBoard();
    }
}
createGrid()

let needsRedraw = true;

//draw the board at a consistent fps
function renderLoop() {
    colorBoard(); //the board has to be drawn first
    drawObstacles(); //draw the obstacle again each time the board is drawn
    drawResources();
    cooldownHighLight();
    drawPieces();
    if (selected) {
        showMoves();
    }
    requestAnimationFrame(renderLoop);
}


function updateCamera(tileX, tileY) {
    //handle bounds
    if (camX + tileX < 0) {
        camX = 0;
    } else {
        if (camX + tileX < BOARD_WIDTH - visibleCols) {
            camX = camX + tileX;
        } else {
            camX = BOARD_WIDTH - visibleCols;
        }
    }
    if (camY + tileY < 0) {
        camY = 0;
    } else {
        if (camY + tileY < BOARD_HEIGHT - visibleRow) {
            camY = camY + tileY;
        } else {
            camY = BOARD_HEIGHT - visibleRow;
        }
    }
}

window.addEventListener("load", function () {
    //draw the board after the html/css load
    createGrid();
    drawBoard();
    //randomObstacle();

});

document.getElementById("zoomIn").addEventListener("click", zoomIn);
document.getElementById("zoomOut").addEventListener("click", zoomOut);

myCanvas.addEventListener("mousedown", function (event) {
    /*
    This event store the x and y position of the client 
    */
    isDragging = true;

    moveStartX = event.clientX; //retrive the client's X cursor position
    moveStartY = event.clientY; //retrive the client's Y cursor position

    dragTileX = 0;
    dragTileY = 0;

    needsRedraw = true;
    console.log("mousedown");
});

myCanvas.addEventListener("mousemove", function (event) {
    //mouse listener that displays possible moves of pieces when clicked
    if (isDragging) {
        //get the coordinate after moving the mouse

        const xDistance = event.clientX - moveStartX;
        const yDistance = event.clientY - moveStartY;

        dragTileX += xDistance;
        dragTileY += yDistance;

        const threshold = size;

        //only move if drag pass threshold to avoid issues
        while (Math.abs(dragTileX) >= threshold) {
            //move 1 tile at a time (current dragspeed value)

            //the minus sign is to treat our dragging cursor movement better since
            //we drag from right->left to make the chess move to the right
            const moveX = dragTileX > 0 ? -dragSpeed : dragSpeed;
            updateCamera(moveX, 0);
            console.log("camX:", camX);
            dragTileX += moveX * threshold;

            needsRedraw = true; //signal that we need to draw the board
        }
        while (Math.abs(dragTileY) >= threshold) {
            //move 1 tile at a time (current dragspeed value)
            const moveY = dragTileY > 0 ? -dragSpeed : dragSpeed;
            updateCamera(0, moveY);
            console.log("camY", camY);
            dragTileY += moveY * threshold;

            needsRedraw = true;
        }
        moveStartX = event.clientX;
        moveStartY = event.clientY;
    }
    mouseTileX = Math.floor((event.offsetX) / size) + camX;
    mouseTileY = Math.floor((event.offsetY) / size) + camY;
});

myCanvas.addEventListener("mouseup", function (event) {
    isDragging = false; //if the user is not clicking the board, disable the map moving function
    needsRedraw = true;
    console.log("mouseup");
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
    update();
    cooldownHighLight();
});

function createGrid() {
    if (!gridInitialized) {
        //only create the grid one time
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            //for each row, iterate for each column
            for (let x = 0; x < BOARD_WIDTH; x++) {
                let tile = new Tile(x, y); // make new Tile objects
                grid.push(tile); //push those Tile into the grid
            }
        }
        gridInitialized = true; // this function is done after the grid is create
    }
}

function colorBoard() {
    /*
    Color the visible board
    */
    for (let x = camX; x < BOARD_WIDTH; x++) {
        for (let y = camY; y < BOARD_HEIGHT; y++) {
            let num = x + y * BOARD_WIDTH; //retrive the tile number

            //color differently for even and odd BOARD_HEIGHT differently
            if (y % 2 === 0) {
                if (num % 2 === 0) {
                    grid[num].show("#F5DCE0");
                } else {
                    grid[num].show("#E18AAA");
                }
            } else {
                if (num % 2 != 0) {
                    grid[num].show("#F5DCE0");
                } else {
                    grid[num].show("#E18AAA");
                }
            }
        }
    }
}

function drawObstacles() {
    for (const obstacle of state.board.obstacles) {
        //check if the obstacle is within the visible section
        if (
            obstacle.x >= camX &&
            obstacle.x < camX + visibleCols &&
            obstacle.y >= camY &&
            obstacle.y < camY + visibleRow
        ) {
            ctx.drawImage(
                obstacleImages[obstacle.getType()],
                (obstacle.x - camX) * size, //update the coordinate of the obstacles
                (obstacle.y - camY) * size,
                size,
                size
            );
        }
    }
}

function drawResources() {
    const rotation = (Date.now() - start) * 0.0001;
    for (const resource of state.board.resources) {
        if (
            resource.x >= camX &&
            resource.x < camX + visibleCols &&
            resource.y >= camY &&
            resource.y < camY + visibleRow
        ) {

            ctx.translate((resource.x - camX + 0.5) * size, (resource.y - camY + 0.5) * size);
            ctx.rotate(resource.x + resource.y * 1.22222 + rotation);
            ctx.drawImage(
                resourceImages[resource.getAmount() >= 5 ? 2 : (resource.getAmount() === 2 ? 1 : 0)],
                -0.5 * size,
                -0.5 * size,
                size,
                size
            );
            ctx.rotate(-1.0 * (resource.x + resource.y * 1.22222 + rotation));
            ctx.translate(-(resource.x - camX + 0.5) * size, -(resource.y - camY + 0.5) * size);
        }
    }
}

function drawPieces() {
    for (const piece of state.pieces) {
        //check for pieces' coordinate
        if (
            piece.x >= camX &&
            piece.x < camX + visibleCols &&
            piece.y >= camY &&
            piece.y < camY + visibleRow
        ) {
            const pieceX = (piece.x - camX) * size;
            const pieceY = (piece.y - camY) * size;
            if (piece.owner === BLACK_OWNER) {
                ctx.drawImage(
                    blackPieceImgs[piece.type],
                    pieceX,
                    pieceY,
                    size,
                    size
                );
            } else {
                ctx.drawImage(
                    whitePieceImgs[piece.type],
                    pieceX,
                    pieceY,
                    size,
                    size
                );
            }
            if (piece.isStunned()) {
                ctx.drawImage(stunImg, pieceX, pieceY, size, size);
            }
            if (piece.getType() === PieceType.Juggernaut) {
                ctx.drawImage(
                    juggernautStrengthImg[piece.getJuggernautStrength() - 1],
                    pieceX,
                    pieceY,
                    size,
                    size
                );
            }
            if (piece.isChimera() && piece.hasTag(PieceTags.ChimeraMoveable)) {
                ctx.drawImage(chimeraMoveableImg, pieceX, pieceY, size, size);
            }
        }
    }
}

function showMoves() {
    const piece = state.pieceAt(Math.floor(selectedX), Math.floor(selectedY));
    if (piece) {
        const moves = state.pieceMoves(piece);
        for (const move of moves) {
            ctx.drawImage(moveDot, (move.x - camX) * size, (move.y - camY) * size, size, size);
        }
    }
}

function cooldownHighLight() {
    console.log("Cooldown function")
    for (const piece of state.pieces) {
        if (piece.isOnCooldown()) {

            let fillSize = piece.cooldownPercent() * size;
            //get Tile num, then color them according to the cooling percent
            const xCoor = (piece.getX() - camX) * size;
            const yCoor = (piece.getY() - camY) * size + (size - fillSize);;

            const percent = 1 - piece.cooldownPercent()  //flip it because this method go from 0 to 1
            //math rgb to fade in this order: red -> yellow -> green
            let red, green;
            const blue = 0
            if (percent < 0.5) {
                // red to yellow
                red = 255;
                green = Math.floor(255 * (percent / 0.5)); // fade green in
            } else {
                // yellow to green
                red = Math.floor(255 * ((1 - percent) / 0.5)); // fade red out
                green = 255;
            }
            ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.6)`

            ctx.fillRect(xCoor, yCoor, size, fillSize);
        }
    }
}

//button redirection
document.getElementById("tutorialButton").addEventListener("click", () => {
    window.location.href = "tutorial.html"; // Redirect to the tutorial page
});

renderLoop();

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
// Win screen
function showWinScreen(winner) {
    const canvas = document.getElementById("confetti-screen");
    const jsConfetti = new JSConfetti({ canvas });
    const winScreen = document.getElementById("win-screen");
    const message = document.getElementById("winner-message");
    document.querySelector(".win-screen").style.display = "flex";
    message.textContent = `${winner} Wins!`;
    document.getElementById("chessContainer").style.border = "none";
    document.getElementById("chessBoard").style.border = "none";
    winScreen.style.display = "flex";
    jsConfetti.addConfetti({
        confettiColors: [
            "#ff0a54",
            "#ff477e",
            "#ff7096",
            "#ff85a1",
            "#fbb1bd",
            "#f9bec7",
        ],
        confettiRadius: 6,
        confettiNumber: 500,
    });
}

function restartGame() {
    // Reset the game state and redraw everything
    selected = false;
    turn = WHITE_OWNER;
    state = State.default(); // Reset to default state
    drawBoard();
    document.getElementById("win-screen").style.display = "none";
}

document
    .getElementById("play-again-button")
    .addEventListener("click", function () {
        restartGame();
    });

document
    .getElementById("win-screen-test")
    .addEventListener("click", function () {
        showWinScreen("White");
    });

//Piece Tracking Menu
const menu = document.getElementById("piecesMenu")
const pieceButtons = [];
for (const piece of state.pieces) {
    if (piece.owner === WHITE_OWNER) {
        const pieceButton = document.createElement("button");

        pieceName = pieceNames[piece.type];

        label = "" + pieceName//+" at ("+(piece.x+1)+","+(16-piece.y)+")"

        const whitePieceIcon = new Image()
        whitePieceIcon.src = whitePieceImgs[piece.type].src;

        pieceButton.appendChild(whitePieceIcon);
        pieceButton.append(label);
        //pieceButton.onclick = () =>
        piecesMenu.appendChild(pieceButton);
    }
}

//Updates piece position at menu 
function update(buttonID) {

}

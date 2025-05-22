// This imports the socket.io client code
import { io } from "socket.io-client";
import { Noise } from "noisejs";

const noise = new Noise(0xc4ee5);

// This imports the INCREMENT value from the /common/chess.js file. Files in the
// /common directory should be accessible from both the client and server.
import State, {COLOR_VALUES, COLORS, WHITE_OWNER, NPC_OWNER} from "../common/chess";
import { ObstacleType } from "../common/obstacle";
import Piece, { PieceTags, PieceType } from "../common/piece";
import Move from "../common/move";
import { XP_LEVEL } from "../common/piece";
import NPC from "../common/npc";

let state = new State(160, 160);
let owners = {};
let socket, stateSum;
let owner = null;
// Store currently active upgrade modal to prevent duplicates
let activeUpgradeModal = null;

//create NPC list and add 1 npc for testing
const npcList = []

const npcPiece1 = new NPC(PieceType.Knight, 10, 10)
npcList.push(npcPiece1)

const start = Date.now();

async function init() {
    if (!localStorage.getItem("session")) {
        window.location.href = '/';
    }
    const session = localStorage.getItem("session");
    const { exists } = await fetch(`/me?session=${session}`)
        .then(async res => await res.json());

    if (!exists) {
        window.location.href = '/';
    }

    let recvFirstState = false;

    // Create a socket.io client instance (this will automatically connect to
    // the socket.io server).
    socket = io(undefined, { query: { session } });

    // This will be called when the socket gets connected.
    socket.on("connect", () => {
        console.log(`${socket.id} connected!`);
    });

    socket.on("state", (data) => {
        state = State.deserialize(data.state);

        stateSum = data.sum;
        if (data.owner) {
            owner = data.owner;
        }
        owners = data.owners;

        if (!recvFirstState) {

            const king = state.findKing(owner);
            if (!king) { // king died, need to make a new owner
                localStorage.clear();
                window.location.href = '/';
                return;
            }

            cameraX = king.getX() + 0.5;
            cameraY = king.getY() + 0.5;

            recvFirstState = true;
        }

        if (!grid.length) {
            createGrid();
        }
        markPieceMenuForUpdate();

        if (!npcSpawned) {
            // place a single Knight (example test for NPC) at (10,10)
            const npcPiece = new Piece(PieceType.Knight, 10, 10, NPC_OWNER);
            state.pieces.push(npcPiece);
            //console.log("NPC "+ npcPiece1.getNpcType())
            npcSpawned = true;
        }
    });

    socket.on("move", (data) => {
        const { move, sum } = data;
        const execMove = Move.deserialize(move);
        state.makeMove(execMove);

        // only fire NPC after a non-NPC piece moves
        if (execMove.getPiece().getOwner() !== NPC_OWNER) {
            const npc = state.pieces.find(p => p.getOwner() === NPC_OWNER);
            const moves = state.pieceMoves(npc);
            if (moves.length) {
                // pick a random legal move
                const choice = moves[Math.floor(Math.random() * moves.length)];
                socket.emit("move", { move: choice.serialize(), sum: stateSum });
            }
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
        markPieceMenuForUpdate();
    });

    socket.on("owners", (data) => {
        owners = data;
    });
}

init();

function makeMove(move) {
    socket.emit("move", { move: move.serialize(), sum: stateSum });
    markPieceMenuForUpdate();
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

function createPieceImageAtlas() {
    const PIECE_SIZE = 64;
    const offscreenCanvas = document.createElement("canvas");

    offscreenCanvas.width = pieceNames.length * PIECE_SIZE;
    offscreenCanvas.height = COLORS.length * PIECE_SIZE;
    const octx = offscreenCanvas.getContext('2d');

    for (let y = 0; y < COLORS.length; y += 1) {
        for (let x = 0; x < pieceNames.length; x += 1) {
            const src = (y === 0 ? blackPieceImgs[x] : whitePieceImgs[x]);

            octx.drawImage(src, x * PIECE_SIZE, y * PIECE_SIZE, PIECE_SIZE, PIECE_SIZE);
        }
    }

    const imageData = octx.getImageData(0, 0, pieceNames.length * PIECE_SIZE, COLORS.length * PIECE_SIZE);

    for (let y = 0; y < COLORS.length; y += 1) {
        const color = COLOR_VALUES[y] || COLOR_VALUES[0];
        for (let x = 0; x < pieceNames.length; x += 1) {

            for (let yy = y * PIECE_SIZE; yy < (y + 1) * PIECE_SIZE; yy += 1) {
                for (let xx = 0; xx < imageData.width; xx += 1) {
                    const i = yy + xx;
                    const index = (yy * imageData.width + xx) * 4;

                    const value = imageData.data[index] + imageData.data[index + 1] + imageData.data[index + 2];
                    if (value < 384) {
                        imageData.data[index] = 0;
                        imageData.data[index + 1] = 0;
                        imageData.data[index + 2] = 0;
                    } else {
                        imageData.data[index] = color[0] === 0 ? 0 : (i % color[0] === 0 ? 255 : 0);
                        imageData.data[index + 1] = color[1] === 0 ? 0 : (i % color[1] === 0 ? 255 : 0);
                        imageData.data[index + 2] = color[2] === 0 ? 0 : (i % color[2] === 0 ? 255 : 0);
                    }

                }
            }
        }
    }

    octx.putImageData(imageData, 0, 0);

    return offscreenCanvas;
}

let pieceAtlas = new Image();
// some bs incoming

Promise.all(whitePieceImgs.concat(blackPieceImgs).map(img => new Promise((res) => img.onload = res)))
    .then(() => pieceAtlas = createPieceImageAtlas());

const obstacleImages = ["mountain", "mud", "water", "grass"]
    .map((name) => `assets/textures/obstacle_${name}.png`)
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
const camX = 0;
const camY = 0;

let cameraX = 0;
let cameraY = 0;
let cameraZoom = 10;


let visibleRow = 16;
let visibleCols = 16;
let dragSpeed = 1;

let mouseTileX = 0,
    mouseTileY = 0;
let selected = false,
    selectedX = 0,
    selectedY = 0;

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
        let x_coor = (this.x - camX);
        let y_coor = (this.y - camY);
        ctx.fillStyle = color;
        ctx.fillRect(x_coor, y_coor, 1, 1);
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
            screenX: (this.x - camX),
            screenY: (this.y - camY),
        }
    }
}

createGrid();

function zoomIn() {
    if (visibleCols > 2) {
        visibleCols -= 2;
        visibleRow -= 2;
        needsRedraw = true;
    }
    console.log("zoom in")
}
function zoomOut() {
    console.log("zoom out")
    if (visibleCols <= BOARD_HEIGHT - 2) {
        console.log(visibleCols)
        visibleCols += 2;
        visibleRow += 2;
        needsRedraw = true;
    }
}

let needsRedraw = true;
let pieceMenuNeedsUpdate = true;

function markPieceMenuForUpdate() {
    pieceMenuNeedsUpdate = true;
}

function canvasSpaceToWorldSpace(xPx, yPx) {
    return {
        x: ((xPx - myCanvas.clientWidth / 2) / myCanvas.clientWidth) * cameraZoom + cameraX,
        y: ((yPx - myCanvas.clientHeight / 2) / myCanvas.clientHeight) * cameraZoom + cameraY,
    }
}

//draw the board at a consistent fps
function renderLoop() {
    if (!owner) {
        requestAnimationFrame(renderLoop);
        return;
    }

    ctx.resetTransform();
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, myCanvas.width, myCanvas.height);

    ctx.translate(myCanvas.width / 2, myCanvas.height / 2);
    ctx.scale(myCanvas.width / cameraZoom, myCanvas.height / cameraZoom);
    ctx.translate(-cameraX, -cameraY);


    colorBoard(); //the board has to be drawn first
    drawObstacles(); //draw the obstacle again each time the board is drawn
    drawResources();
    cooldownHighLight();
    drawPieces();
    updateMenuState();

    if (selected) {
        showMoves();
    }
    if (pieceMenuNeedsUpdate) {
        pieceMenu();
        pieceMenuNeedsUpdate = false;
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
    //randomObstacle();

});
let zoomInInterval = null;
let zoomOutInterval = null;
let zoomSpeed = 100;

document.getElementById("zoomIn").addEventListener("mousedown", function () {
    zoomIn();
    zoomInInterval = setInterval(zoomIn, zoomSpeed);
});
document.getElementById("zoomIn").addEventListener("mouseup", function () {
    if (zoomInInterval) {
        clearInterval(zoomInInterval)
        zoomInInterval = null;
    }
});
document.getElementById("zoomIn").addEventListener("mouseleave", function () {
    if (zoomInInterval) {
        clearInterval(zoomInInterval)
        zoomInInterval = null;
    }
});
document.getElementById("zoomIn").addEventListener("mouseup", function () {
    if (zoomInInterval) {
        clearInterval(zoomInInterval)
        zoomInInterval = null;
    }
});
document.getElementById("zoomOut").addEventListener("mousedown", function () {
    zoomOut();
    zoomOutInterval = setInterval(zoomOut, zoomSpeed);
});
document.getElementById("zoomOut").addEventListener("mouseup", function () {
    if (zoomOutInterval) {
        clearInterval(zoomOutInterval)
        zoomOutInterval = null;
    }
});
document.getElementById("zoomOut").addEventListener("mouseleave", function () {
    if (zoomOutInterval) {
        clearInterval(zoomOutInterval)
        zoomOutInterval = null;
    }
});
document.getElementById("zoomOut").addEventListener("mouseup", function () {
    if (zoomOutInterval) {
        clearInterval(zoomOutInterval)
        zoomOutInterval = null;
    }
});

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

function ensureCameraInBounds() {
    cameraX = Math.min(Math.max(cameraX, cameraZoom / 2), BOARD_WIDTH - cameraZoom / 2);
    cameraY = Math.min(Math.max(cameraY, cameraZoom / 2), BOARD_HEIGHT - cameraZoom / 2);
}

myCanvas.addEventListener("mousemove", function (event) {
    //mouse listener that displays possible moves of pieces when clicked
    if (isDragging) {
        //get the coordinate after moving the mouse

        const xDistance = event.clientX - moveStartX;
        const yDistance = event.clientY - moveStartY;

        const xWorld = (xDistance / myCanvas.clientWidth) * cameraZoom;
        const yWorld = (yDistance / myCanvas.clientHeight) * cameraZoom;

        cameraX -= xWorld;
        cameraY -= yWorld;

        moveStartX = event.clientX;
        moveStartY = event.clientY;
    }
    const { x, y } = canvasSpaceToWorldSpace(event.offsetX, event.offsetY);
    mouseTileX = Math.min(Math.max(Math.floor(x), 0), BOARD_WIDTH - 1);
    mouseTileY = Math.min(Math.max(Math.floor(y), 0), BOARD_HEIGHT - 1);

    ensureCameraInBounds();
});

myCanvas.addEventListener("mousewheel", (event) => {
    event.preventDefault();

    cameraZoom = Math.min(Math.max(cameraZoom * (1.0 + event.deltaY * 0.002), 4), 32);
    ensureCameraInBounds();
});

myCanvas.addEventListener("mouseup", function (event) {
    isDragging = false; //if the user is not clicking the board, disable the map moving function
    needsRedraw = true;
    console.log("mouseup");
});
window.addEventListener("mouseup", function (event) {
    if (isDragging) {
        isDragging = false;
        needsRedraw = true;
        console.log("global mouseup - stopped dragging");
    }
});
myCanvas.addEventListener("mouseleave", function (event) {
    if (isDragging) {
        isDragging = false;
        needsRedraw = true;
        console.log("mouse left canvas - stopped dragging");
    }
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

            markPieceMenuForUpdate();
        }

        selected = false;
    } else {
        const piece = state.pieceAt(mouseTileX, mouseTileY);
        if (piece && piece.owner === owner && state.pieceMoves(piece).length > 0) {
            selected = true;
            selectedX = mouseTileX;
            selectedY = mouseTileY;

            markPieceMenuForUpdate();
        }
    }


    if (selected) {
        showMoves();
    }
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

function cameraBounds() {
    const { x: left, y: top } = canvasSpaceToWorldSpace(0, 0);
    const { x: right, y: bottom } = canvasSpaceToWorldSpace(myCanvas.clientWidth, myCanvas.clientHeight);
    return {
        left: Math.floor(left),
        top: Math.floor(top),
        right: Math.ceil(right),
        bottom: Math.ceil(bottom),
    }
}

function colorBoard() {
    /*
    Color the visible board
    */

    const { left, top, right, bottom } = cameraBounds();
    for (let x = left; x <= right; x++) {
        for (let y = top; y <= bottom; y++) {
            if (x < 0 || y < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) {
                continue;
            }

            let num = x + y * BOARD_WIDTH; //retrive the tile number
            //color differently for even and odd BOARD_HEIGHT differently
            if (!grid[num]) {
                continue;
            }
            const light = (x + y) % 2 === 0;
            const hue = noise.simplex2(x * 0.01, y * 0.01) * 360;

            const color = `hsl(${hue}deg ${light ? "80%" : "10%"} ${light ? "95%" : "50%"})`;
            grid[num].show(color);
        }
    }
}

function drawObstacles() {
    const { left, top, right, bottom } = cameraBounds();
    for (const obstacle of state.board.obstacles) {
        //check if the obstacle is within the visible section
        if (
            obstacle.x >= left &&
            obstacle.x < right &&
            obstacle.y >= top &&
            obstacle.y < bottom
        ) {
            ctx.drawImage(
                obstacleImages[obstacle.getType()],
                (obstacle.x - camX),  //update the coordinate of the obstacles
                (obstacle.y - camY),
                1,
                1
            );
        }
    }
}

function drawResources() {
    const rotation = (Date.now() - start) * 0.0001;
    const { left, top, right, bottom } = cameraBounds();
    for (const resource of state.board.resources) {
        if (
            resource.x >= left &&
            resource.x < right &&
            resource.y >= top &&
            resource.y < bottom
        ) {

            ctx.translate((resource.x - camX + 0.5), (resource.y - camY + 0.5));
            ctx.rotate(resource.x + resource.y * 1.22222 + rotation);
            ctx.drawImage(
                resourceImages[resource.getAmount() >= 5 ? 2 : (resource.getAmount() === 2 ? 1 : 0)],
                -0.5,
                -0.5,
                1,
                1
            );
            ctx.rotate(-1.0 * (resource.x + resource.y * 1.22222 + rotation));
            ctx.translate(-(resource.x - camX + 0.5), -(resource.y - camY + 0.5));
        }
    }
}

function drawPieces() {
    const { left, top, right, bottom } = cameraBounds();
    for (const piece of
        state.pieces
            .sort((a, b) => +(a.getType() === PieceType.King) - +(b.getType() === PieceType.King))) {
        //check for pieces' coordinate

        //declare normal owner and npc owner
        const ownerData = owners[piece.owner] || { color: "white", username: "NPC" };
        const colorIndex = COLORS.indexOf(ownerData.color) * 64;
        if (
            piece.x >= left &&
            piece.x < right &&
            piece.y >= top &&
            piece.y < bottom
        ) {
            if (piece.owner !== owner && state.board.obstaclesAt(piece.x, piece.y).some(o => o.getType() === ObstacleType.TallGrass)) {
                continue;
            }
            const idleTime = (Date.now() - start) / 1000 + (piece.x + piece.y);
            const squish = 1.0 + Math.sin(idleTime * 2.0) * 0.04;
            ctx.drawImage(
                pieceAtlas,

                piece.type * 64,
                colorIndex,
                64,
                64,

                piece.x - (squish - 1) / 2.0,
                piece.y - (1.0 / squish - 1) / 2.0,
                squish,
                1.0 / squish,
            );
            if (piece.isStunned()) {
                ctx.drawImage(stunImg, piece.x, piece.y, 1, 1);
            }
            if (piece.getType() === PieceType.Juggernaut) {
                ctx.drawImage(
                    juggernautStrengthImg[piece.getJuggernautStrength() - 1],
                    piece.x,
                    piece.y,
                    1,
                    1
                );
            }
            if (piece.isChimera() && piece.hasTag(PieceTags.ChimeraMoveable)) {
                ctx.drawImage(chimeraMoveableImg, piece.x, piece.y, 1, 1);
            }

            if (piece.getType() == PieceType.King) {
                const name = owners[piece.owner].username;
                ctx.font = '1px sans-serif';
                ctx.textAlign = 'center';

                ctx.fillStyle = '#000000';
                ctx.fillText(name, piece.x + 0.05 + 0.5, piece.y + 0.05);

                ctx.fillStyle = '#ffffff';
                ctx.fillText(name, piece.x + 0.5, piece.y);
            }
        }
    }
}

function showMoves() {
    const piece = state.pieceAt(Math.floor(selectedX), Math.floor(selectedY));
    if (piece) {
        const moves = state.pieceMoves(piece);
        for (const move of moves) {
            ctx.drawImage(moveDot, (move.x - camX), (move.y - camY), 1, 1);
        }
    }
}

function cooldownHighLight() {
    for (const piece of state.pieces) {
        if (piece.isOnCooldown()) {

            let fillSize = piece.cooldownPercent();
            //get Tile num, then color them according to the cooling percent
            const xCoor = (piece.getX() - camX);
            const yCoor = (piece.getY() - camY) + (1 - fillSize);

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

            ctx.fillRect(xCoor, yCoor, 1, fillSize);
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

    document.getElementById("win-screen").style.display = "none";
    document.querySelector(".win-screen").style.display = "none";

    document.getElementById("chessContainer").style.border = ""; // Reset to CSS default
    document.getElementById("chessBoard").style.border = ""; // Reset to CSS default

    selected = false;

    // Request new game state from server
    socket.emit("restart_game");
    // needs to redraw the board
    needsRedraw = true;

    markPieceMenuForUpdate();
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

function pieceMenu() {
    const menu = document.getElementById("blackPiecesMenu");
    menu.innerHTML = "";

    for (const piece of state.pieces) {
        let pieceButton = document.createElement("button");
        pieceButton.piece = piece;

        // Teleport to the piece's location
        pieceButton.addEventListener("click", () => {
            const centerRange = Math.floor(visibleCols / 2);
            camX = Math.max(0, Math.min(piece.getX() - centerRange, BOARD_WIDTH - visibleCols));
            camY = Math.max(0, Math.min(piece.getY() - centerRange, BOARD_HEIGHT - visibleRow));
            needsRedraw = true;
        });

        // Piece icon image
        const pieceIcon = new Image();
        pieceIcon.src = (piece.owner === WHITE_OWNER ? whitePieceImgs : blackPieceImgs)[piece.type].src;

        // Label of the piece
        var pieceName = pieceNames[piece.type];
        switch (pieceNames[piece.type]){
            case "pawn":pieceName="Pawn";
            break;
            case "knight":pieceName="Knight";
            break;
            case "bishop":pieceName="Bishop";
            break;
            case "rook":pieceName="Rook";
            break;
            case "queen":pieceName="Queen";
            break;
            case "king":pieceName="King";
            break;
            case "lion_chimera":pieceName="Chimera's Lion";
            break;
            case "goat_chimera":pieceName="Chimera's Goat";
            break;
            case "medusa":pieceName="Gorgon";
            break;
            case "pegasus":pieceName="Pegasus";
            break;
            case "juggernaut":pieceName="Juggernaut";
            break;
            case "builder":pieceName="Builder";
            break;
        }
        const label = document.createTextNode(`${pieceName} at (${piece.getX()},${piece.getY()}) ${piece.getXP()} xp `);

        // Cooldown percent 
        const percent = Math.floor(piece.cooldownPercent() * 100);
        const percentSpan = document.createElement("span");
        percentSpan.textContent = ` ${percent}% `;

        // XP bar container
        const xpBarContainer = document.createElement("div");
        xpBarContainer.style.width = "100%";
        xpBarContainer.style.background = "#ddd";
        xpBarContainer.style.borderRadius = "4px";
        xpBarContainer.style.marginTop = "4px";

        // XP bar fill
        const xpBar = document.createElement("div");
        xpBar.style.height = "10px";
        xpBar.style.borderRadius = "4px";
        xpBar.style.backgroundColor = "#4caf50";
        xpBar.style.width = Math.min(100, Math.floor((piece.getXP() / piece.getXPLevel()) * 100)) + "%";
        xpBarContainer.appendChild(xpBar);

        // Upgrade button
        const upButton = document.createElement("button");
        upButton.innerHTML = "UPGRADE";
        upButton.style.height = '100%';
        upButton.style.width = '100%';
        upButton.style.background = '#8922c1';

        upButton.addEventListener("click", (event) => {
            console.log("Upgrade button clicked for", pieceNames[piece.type], "at", piece.getX(), piece.getY());
            try {
                console.log("Piece properties: ", {
                    type: piece.type,
                    xp: piece.getXP(),
                    promote: typeof piece.promoteTo === 'function'
                });

                upgradeMenu(piece);
            } catch (error) {
                console.error("Error handling upgrade button click:", error);
            }
        });

        // Append all elements to the button
        pieceButton.appendChild(pieceIcon);
        pieceButton.appendChild(label);
        pieceButton.appendChild(xpBarContainer);
        pieceButton.appendChild(percentSpan);
        pieceButton.appendChild(upButton);

        // Append the piece button to the menu
        menu.appendChild(pieceButton);
    }
}


function updateMenuState() {
    const menu = document.getElementById("blackPiecesMenu");
    for (const button of menu.children) {
        const piece = button.piece;

        const percentSpan = button.querySelector("span");
        const percent = Math.floor(piece.cooldownPercent() * 100);
        percentSpan.textContent = ` ${percent}% `;

        if (percent >= 75) {
            button.style.backgroundColor = 'red';
        } else if (percent > 25) {
            button.style.backgroundColor = 'yellow';
        } else {
            button.style.backgroundColor = 'green';
        }
    }
}



function upgradeMenu(piece) {
    // If there's already an active modal, remove it first
    if (activeUpgradeModal && document.body.contains(activeUpgradeModal)) {
        document.body.removeChild(activeUpgradeModal);
    }

    console.log("Opening upgrade menu for:", piece);
    console.log("Piece type:", piece.type, "XP:", piece.getXP());
    console.log("XP_LEVEL defined:", typeof XP_LEVEL !== 'undefined');

    // Create modal container
    const modalContainer = document.createElement("div");
    modalContainer.id = "upgrade-modal";
    modalContainer.style.position = "fixed";
    modalContainer.style.top = "0";
    modalContainer.style.left = "0";
    modalContainer.style.width = "100%";
    modalContainer.style.height = "100%";
    modalContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    modalContainer.style.display = "flex";
    modalContainer.style.justifyContent = "center";
    modalContainer.style.alignItems = "center";
    modalContainer.style.zIndex = "1000";

    // Create modal content
    const modalContent = document.createElement("div");
    modalContent.style.backgroundColor = "#fff";
    modalContent.style.padding = "20px";
    modalContent.style.borderRadius = "5px";
    modalContent.style.width = "400px";
    modalContent.style.maxWidth = "90%";

    // Title
    const title = document.createElement("h2");
    title.textContent = "Upgrade " + pieceNames[piece.type];
    modalContent.appendChild(title);

    // Close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "Cancel";
    closeButton.style.marginTop = "20px";
    closeButton.style.float = "right";
    closeButton.addEventListener("click", () => {
        if (document.body.contains(modalContainer)) {
            document.body.removeChild(modalContainer);
            activeUpgradeModal = null;
        }
    });

    const upgradeOptions = [];

    try {
        // Get current piece XP and type
        const pieceXP = piece.getXP();
        const pieceType = piece.getType();

        console.log("Processing upgrades for", pieceNames[pieceType], "with XP:", pieceXP);

        // Level 0 Promotions: Pawn Promotion
        if (pieceXP >= XP_LEVEL[0] && pieceType === PieceType.Pawn) {
            console.log("Adding pawn promotion options");
            upgradeOptions.push(
                { type: PieceType.Knight, name: "Knight" },
                { type: PieceType.Bishop, name: "Bishop" },
                { type: PieceType.Rook, name: "Rook" }
            );
        }
        // Level 1 Promotions: King
        else if (pieceXP >= XP_LEVEL[1] && pieceType === PieceType.King) {
            console.log("Adding king promotion options");
            upgradeOptions.push(
                { type: PieceType.Pawn, name: "Spawn Pawn" }
            );
        }
        // Level 2 Promotions: Mythical pieces
        else if (pieceXP >= XP_LEVEL[2]) {
            console.log("Processing level 2 promotions");
            switch (pieceType) {
                case PieceType.Knight:
                    upgradeOptions.push(
                        { type: PieceType.Pegasus, name: "Pegasus" },
                        { type: PieceType.ChimeraGoat, name: "Chimera (creates lion)" }
                    );
                    break;
                case PieceType.Bishop:
                    upgradeOptions.push(
                        { type: PieceType.Gorgon, name: "Gorgon" }
                    );
                    break;
                case PieceType.Rook:
                    upgradeOptions.push(
                        { type: PieceType.Juggernaut, name: "Juggernaut" },
                        { type: PieceType.Builder, name: "Builder" }
                    );
                    break;
            }
        }
    } catch (error) {
        console.error("Error determining upgrade options:", error);
    }

    // Create option buttons
    if (upgradeOptions.length > 0) {
        const optionsContainer = document.createElement("div");
        optionsContainer.style.display = "grid";
        optionsContainer.style.gridTemplateColumns = "repeat(auto-fit, minmax(120px, 1fr))";
        optionsContainer.style.gap = "10px";
        optionsContainer.style.marginTop = "15px";

        upgradeOptions.forEach(option => {
            const optionButton = document.createElement("button");

            // Create image if available
            const pieceIcon = new Image();
            pieceIcon.src = (piece.owner === WHITE_OWNER ? whitePieceImgs : blackPieceImgs)[option.type].src;
            pieceIcon.style.width = "40px";
            pieceIcon.style.height = "40px";
            pieceIcon.style.display = "block";
            pieceIcon.style.margin = "0 auto 5px";

            const nameSpan = document.createElement("div");
            nameSpan.textContent = option.name;

            optionButton.appendChild(pieceIcon);
            optionButton.appendChild(nameSpan);

            optionButton.style.padding = "10px";
            optionButton.style.display = "flex";
            optionButton.style.flexDirection = "column";
            optionButton.style.alignItems = "center";
            optionButton.style.cursor = "pointer";

            // Click handler to perform the promotion
            optionButton.addEventListener("click", () => {
                console.log("Promoting", pieceNames[piece.type], "to", option.name);
                //update on the server side
                socket.emit("promote", {
                    x: piece.getX(),
                    y: piece.getY(),
                    type: option.type,
                });

                if (document.body.contains(modalContainer)) {
                    document.body.removeChild(modalContainer);
                    activeUpgradeModal = null;
                }

                // If a new piece was created (for the king)
                if (newPiece) {
                    state.pieces.push(newPiece);
                }

                pieceMenu();

                // Log promotion
                console.log(`Upgraded ${pieceNames[piece.type]} at (${piece.getX()},${piece.getY()})`);
                if (newPiece) {
                    console.log(`Created new ${pieceNames[newPiece.type]} at (${newPiece.getX()},${newPiece.getY()})`);
                }
            });

            optionsContainer.appendChild(optionButton);
        });

        modalContent.appendChild(optionsContainer);
    } else {
        // No upgrades available
        const noUpgradeMsg = document.createElement("p");
        noUpgradeMsg.textContent = "This piece doesn't have enough XP or cannot be upgraded.";
        modalContent.appendChild(noUpgradeMsg);
    }

    modalContent.appendChild(closeButton);
    modalContainer.appendChild(modalContent);
    document.body.appendChild(modalContainer);

    activeUpgradeModal = modalContainer;
}


renderLoop();

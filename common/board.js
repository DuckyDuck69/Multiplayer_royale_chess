import Obstacle from "./obstacle.js";
import Resource from "./resource.js";
// Holds state about the board such as obstacles (portals? walls?)
export default class Board {
    constructor(obstacles = [], resources = []) {
        this.obstacles = obstacles;
        this.resources = resources;
    }

    static generate(state) {
        const board = new Board();
        board.randomObstacle(state);
        board.randomResource();
        return board;
    }

    static deserialize(from) {
        return new Board(from.obstacles.map((o) => Obstacle.deserialize(o)), from.resources.map((o) => Resource.deserialize(o)));
    }

    addObstacle(obstacle) {
        this.obstacles.push(obstacle);
    }

    obstaclesAt(x, y) {
        return this.obstacles.filter(
            (o) =>
                x >= o.getX() &&
                y >= o.getY() &&
                x < o.getX() + o.getWidth() &&
                y < o.getY() + o.getHeight()
        );
    }


    resourceAt(x, y) {
        return this.resources.filter(
            (o) =>
                x == o.getX() &&
                y == o.getY()
        );
    }

    removeResourceAt(x, y) {
        const captured = this.resources.filter((r) => (x === r.getX() && y === r.getY()))
            .reduce((sum, r) => sum + r.getAmount(), 0);
        this.resources = this.resources.filter((r) => !(x === r.getX() && y === r.getY()));
        return captured;
    }

    removeObstaclesAt(x, y) {
        this.obstacles = this.obstacles.filter(
            (o) =>
                !(
                    x >= o.getX() &&
                    y >= o.getY() &&
                    x < o.getX() + o.getWidth() &&
                    y < o.getY() + o.getHeight()
                )
        );
    }

    randomResource() {
        for (let i = 0; i < 160 * 160 / 10; i += 1) {
            let randomX = Math.floor(Math.random() * 160);
            let randomY = Math.floor(Math.random() * 160);

            while (this.resources.some((r) => r.getX() == randomX && r.getY() == randomY)) {
                randomX = Math.floor(Math.random() * 160);
                randomY = Math.floor(Math.random() * 160);
            }

            this.resources.push(new Resource(Resource.randomAmount(), randomX, randomY));
        }
    }
    randomObstacle(state) {
        // let wallColor = 'orange';
        // let mudColor = 'brown';
        let minRow = 5;
        let maxRow = 11;
        let numWall = 8;
        let numMud = 13;
        let drawMud = "Mud";
        let drawWall = "Wall";
        const directionMud = [
            [0, -1],
            [0, 1], //up and down diretion respectively
            [1, 0],
            [-1, 0], //right and left direction respectively
            [1, -1],
            [1, 1], //diagonal up right and down right respectively
            [-1, -1],
            [-1, 1], //diagonal up left and down left respectively
        ];
        const directionsWall = [
            [0, -1], //up
            [1, 0], //right
            [0, 1], //down
            [-1, 0], //left
        ];
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) {
                //generateWall;
                this.generateObstacles(
                    state,
                    directionsWall,
                    x,
                    y,
                    numMud,
                    minRow,
                    maxRow,
                    drawMud);
                //generateMud
                this.generateObstacles(
                    state,
                    directionMud,
                    x,
                    y,
                    numWall,
                    minRow,
                    maxRow,
                    drawWall
                );
            }
        }
    }


    generateObstacles(state, directionChoice, chunkX, chunkY, number, minRow, maxRow, type) {
        const columns = 16;
        const rows = 16; // todo: unhardcode

        const boardWidth = 160;
        const boardHeight = 160;

        const startX = ((chunkX + 1) * columns - 2) - (chunkX * columns + 2) + 1;
        const startY = chunkY * rows + (maxRow - minRow) + 1;

        //this is the x and y coordinate locally, only generate in the 16x16 origin board scale
        const localCols = columns - 4; //available columns to generate obstacle
        const localRows = maxRow - minRow + 1; //available rows to generate obstacle
        let localX = Math.floor(Math.random() * localCols) + 2;
        let localY = Math.floor(Math.random() * localRows) + minRow;

        //convert it to the current chunk on a global scale
        let currentX = chunkX * columns + localX;
        let currentY = chunkY * rows + localY;

        let ranDirection = Math.floor(Math.random() * directionChoice.length); //random a number between 0 and 7 to access the direction
        let numCell = 0;
        let nextX, nextY;

        let attempts = 0;
        let maxAttempts = 200;
        while (numCell < number && attempts <= maxAttempts) {
            // let gridIndex = currentY * columns + currentX;  //choose a Cell to start
            const inChunk = currentX >= 0 && currentX < boardWidth &&
                currentY >= 0 && currentY < boardHeight;
            if (inChunk) {
                //if the coordinate is not out of bound
                // Check if there's a piece at this designated position
                // const piece = state.pieceAt(currentX, currentY);
                // Only place obscacle if cell is not a piece, wall, or mud)
                if (
                    !state.pieceAt(currentX, currentY) &&
                    !this.obstaclesAt(currentX, currentY).length
                ) {
                    if (type == "Mud") {
                        this.addObstacle(Obstacle.mud(currentX, currentY));
                        numCell += 1;
                    } else if (type == "Wall") {
                        this.addObstacle(Obstacle.wall(currentX, currentY));
                        numCell += 1;
                    }
                }
            }
            // gridIndex = nextY * columns + nextX;

            let isNextValid = false;

            //loop through and find a valid direction 
            for (let i = 0; i < directionChoice.length; i++) {
                //create 2 variable to check if the next X and Y is valid
                ranDirection = Math.floor(Math.random() * directionChoice.length);
                nextX = currentX + directionChoice[ranDirection][0];
                nextY = currentY + directionChoice[ranDirection][1];

                let pieceWouldBeHere = state.pieceAt(nextX, nextY) != null;

                //check the valiation of the next cell
                const inChunkNext = nextX >= 0 && nextX < boardWidth &&
                    nextY >= 0 && nextY < boardHeight;
                if (inChunkNext && !pieceWouldBeHere && !this.obstaclesAt(nextX, nextY).length) {
                    currentX = nextX;
                    currentY = nextY;
                    isNextValid = true;
                    break; //stop if find a valid direction
                }
            }
            if (!isNextValid) {
                localX = Math.floor(Math.random() * startX) + 2;
                localY = Math.floor(Math.random() * startY) + minRow;
                currentX = chunkX * columns + localX;
                currentY = chunkY * rows + localY;
            }

            //try not to have an infinite loop
            attempts++;
        }
    }
}

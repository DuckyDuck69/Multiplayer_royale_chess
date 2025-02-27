import Obstacle from "./obstacle.js";

// Holds state about the board such as obstacles (portals? walls?)
export default class Board {

    constructor(obstacles = []) {
        this.obstacles = obstacles;
        this.randomObstacle();

        console.log(this.obstacles);
    }

    addObstacle(obstacle) {
        this.obstacles.push(obstacle);
    }

    obstaclesAt(x, y) {
        return this.obstacles.filter(o => x >= o.getX() 
                && y >= o.getY() 
                && x < o.getX() + o.getWidth() 
                && y < o.getY() + o.getHeight()
            );
    }

    randomObstacle(){
        // let wallColor = 'orange';
        // let mudColor = 'brown';
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
        this.generateObstacles(direction_mud, numMud, minRow, maxRow, drawMud);
        this.generateObstacles(directions_wall, numWall, minRow, maxRow, drawWall);
    
    }
    
    generateObstacles(directionChoice, number, minRow, maxRow, type){
        const columns = 16;
        const rows = 16; // todo: unhardcode

        const startX = 13 - 2 + 1;
        const startY = maxRow - minRow + 1;
        let currentX = Math.floor(Math.random()  * startX) + 2;
        let currentY = Math.floor(Math.random()  * startY) + minRow;
    
        let ranDirection = Math.floor(Math.random() * directionChoice.length);  //random a number between 0 and 7 to access the direction
        let numCell = 0;
        let nextX,nextY;
        while(numCell < number){
            // let gridIndex = currentY * columns + currentX;  //choose a Cell to start
            if (currentX >= 0 && currentX < columns && 
                currentY >= 0 && currentY < rows){   //if the coordinate is not out of bound
                // Check if there's a piece at this designated position
                // const piece = state.pieceAt(currentX, currentY);
                
                const pieceWouldBeHere = currentY < 2 || currentY > 15 - 2;

                // Only place obscacle if cell is not a piece, wall, or mud)
                if (!pieceWouldBeHere && !this.obstaclesAt(currentX, currentY).length) {
                    if(type == "Mud"){
                        this.addObstacle(Obstacle.mud(currentX, currentY));
                        numCell += 1; 
                    }
                    else if(type == "Wall"){
                        this.addObstacle(Obstacle.wall(currentX, currentY));
                        numCell += 1; 
                    }
                }
            }
            //create 2 variable to check if the next X and Y is valid
            ranDirection = Math.floor(Math.random() * directionChoice.length);
            nextX = currentX + directionChoice[ranDirection][0];
            nextY = currentY + directionChoice[ranDirection][1];
            // gridIndex = nextY * columns + nextX;
            let isNextValid = false   //initiallize it to unvalid
            while(!isNextValid){  
                if (nextX >= 0 && nextX < columns && 
                    nextY >= 0 && nextY < rows && !this.obstaclesAt(nextX, nextY).length){  //if the coordinate is not out of bound and that grid is not an obstacle
                        currentX += directionChoice[ranDirection][0];
                        currentY += directionChoice[ranDirection][1];
                        isNextValid = true;
                    }
                else{    //generate direction until we have a valid grid
                    ranDirection = Math.floor(Math.random() * directionChoice.length);
                    nextX = currentX + directionChoice[ranDirection][0];
                    nextY = currentY + directionChoice[ranDirection][1];
                    // gridIndex = nextY * columns + nextX;
                }
            }
        }
    }

}

// Holds state about the board such as obstacles (portals? walls?)
export default class Board {

    constructor(obstacles = []) {
        this.obstacles = obstacles;
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

}

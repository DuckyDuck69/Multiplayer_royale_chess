export const ObstacleType = {
    Wall: 0,
    Mud: 1, // Allows piece movement to, but cannot move past until another move after.
    Water: 2, // Doubles cooldown when moving inside
    TallGrass: 3, // Can only see own pieces
};

export default class Obstacle {
    constructor(type, x, y, data = {}) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.data = data;
    }

    static deserialize(from) {
        return new Obstacle(from.type, from.x, from.y, from.data);
    }

    static wall(x, y, w = 1, h = 1) {
        return new Obstacle(ObstacleType.Wall, x, y, { w, h });
    }

    static mud(x, y, w = 1, h = 1) {
        return new Obstacle(ObstacleType.Mud, x, y, { w, h });
    }

    static water(x, y, w = 1, h = 1) {
        return new Obstacle(ObstacleType.Water, x, y, { w, h });
    }

    static tallGrass(x, y, w = 1, h = 1) {
        return new Obstacle(ObstacleType.TallGrass, x, y, { w, h });
    }

    getType() {
        return this.type;
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }

    getWidth() {
        return this.data.w || 0;
    }

    getHeight() {
        return this.data.h || 0;
    }
}

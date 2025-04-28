
export default class Resource {
    constructor(amount, x, y) {
        this.amount = amount;
        this.x = x;
        this.y = y;
    }

    static deserialize(data) {
        return new Resource(data.amount, data.x, data.y);
    }

    randomAmount() {
        const rng = Math.random();

        if (rng < 0.1) {
            return 5;
        } else if (rng < 0.4) {
            return 2;
        } else {
            return 1;
        }
    }

    getAmount() {
        return this.amount;
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }
}

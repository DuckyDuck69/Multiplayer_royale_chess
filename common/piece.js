// Different types of pieces in the game to determine movesets
export const PieceType = {
    Pawn: 0,
    Knight: 1,
    Bishop: 2,
    Rook: 3,
    Queen: 4,
    King: 5,
    ChimeraLion: 6,
    ChimeraGoat: 7,
    Gorgon: 8,
    Pegasus: 9,
    Juggernaut: 10,
    Builder: 11,
};

export const PieceTags = {
    ChimeraMoveable: 0,
};

export default class Piece {
    constructor(type, x, y, owner) {
        // The type of the piece (an integer representing the PieceType above)
        this.type = type;
        // Position of the piece on the board (integer)
        this.x = x;
        this.y = y;
        // Owner index (integer)
        this.owner = owner;

        // How many times the piece has moved
        this.moveCount = 0;

        // How many turns this piece is stunned
        this.stun = 0;

        // Last movement
        this.lastDx = 0;
        this.lastDy = 0;

        // Cooldown
        this.cooldown = 0;
        this.cooldownStart = 0;

        // XP / Leveling
        this.xp = 0;

        // Piece tags representing state, i.e. "canEnPassant" or "canCastle"
        this.tags = new Set();

        if (this.type === PieceType.Juggernaut) {
            this.juggernautStrength = 1;
        } else if (
            this.type === PieceType.ChimeraGoat ||
            this.type === PieceType.ChimeraLion
        ) {
            this.tags.add(PieceTags.ChimeraMoveable);
        }
    }

    serialize() {
        return { ...this, tags: [...this.tags.values()] };
    }

    static deserialize(from) {
        let piece = new Piece(from.type, from.x, from.y, from.owner);
        piece = Object.assign(piece, from);
        piece.tags = new Set(piece.tags);
        return piece;
    }

    static name(pieceType) {
        switch (pieceType) {
            case PieceType.Rook:
                return "R";
            case PieceType.Bishop:
                return "B";
            case PieceType.Queen:
                return "Q";
            case PieceType.King:
                return "K";
            case PieceType.Pawn:
                return "";
            case PieceType.Knight:
                return "N";
            case PieceType.ChimeraLion:
                return "L";
            case PieceType.ChimeraGoat:
                return "G";
            case PieceType.Gorgon:
                return "O";
            case PieceType.Pegasus:
                return "P";
            case PieceType.Juggernaut:
                return "J";
            case PieceType.Builder:
                return "U";
        }
        return "?";
    }

    static value(pieceType) {
        switch (pieceType) {
            case PieceType.King:
            case PieceType.Pawn:
                return 1;
            case PieceType.Knight:
            case PieceType.Bishop:
                return 3;
            default:
                return 5;
        }
    }

    toString() {
        return Piece.name(this.getType());
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }

    hasNotMoved() {
        return this.moveCount === 0;
    }

    getLastDx() {
        return this.lastDx;
    }

    getLastDy() {
        return this.lastDy;
    }

    moveTo(x, y) {
        const [prevX, prevY] = [this.x, this.y];

        this.x = x;
        this.y = y;

        this.moveCount += 1;

        if (this.getType() === PieceType.Pawn && this.moveCount >= 8) {
            // TODO: Implement underpromotion
            this.type = PieceType.Queen;
        }

        const [dx, dy] = [this.x - prevX, this.y - prevY];

        if (this.getType() === PieceType.Juggernaut) {
            // If the juggernaut keeps moving in the same direction, it gains strength
            console.log(
                Math.sign(dx),
                Math.sign(this.lastDx),
                Math.sign(dy),
                Math.sign(this.lastDy)
            );
            if (
                Math.sign(dx) === Math.sign(this.lastDx) &&
                Math.sign(dy) === Math.sign(this.lastDy)
            ) {
                if (this.juggernautStrength < 3) {
                    this.juggernautStrength += 1;
                }
            } else {
                this.juggernautStrength = 1;
            }
        }

        this.lastDx = dx;
        this.lastDy = dy;

        this.addCooldown(Piece.value(this.getType()));
    }

    addCooldown(seconds) {
        this.cooldownStart = Date.now();
        this.cooldown = this.cooldownStart + 1000 * seconds;
    }

    addXp(amount) {
        this.xp += amount;
    }

    cooldownSecondsLeft() {
        return Math.max(0.0, this.cooldown - Date.now());
    }

    cooldownPercent() {
        const duration = this.cooldown - this.cooldownStart;
        return duration > 0 ? this.cooldownSecondsLeft() / duration : 0;
    }

    isOnCooldown() {
        return Date.now() < this.cooldown;
    }

    inCoordinatesList(coordinatesList = []) {
        return coordinatesList.some(
            (coordinates) =>
                this.getX() === coordinates[0] && this.getY() === coordinates[1]
        );
    }

    isChimera() {
        return (
            this.getType() === PieceType.ChimeraGoat ||
            this.getType() === PieceType.ChimeraLion
        );
    }

    getType() {
        return this.type;
    }

    getXP() {
        return this.xp;
    }

    getOwner() {
        return this.owner;
    }

    hasTag(tag) {
        return this.tags.has(tag);
    }

    addTag(tag) {
        this.tags.add(tag);
    }

    removeTag(tag) {
        return this.tags.delete(tag);
    }

    isStunned() {
        return this.stun > 0;
    }

    getJuggernautStrength() {
        return this.juggernautStrength || 0;
    }

    stunPiece(turns) {
        this.stun = turns;
    }

    update() {
        if (this.isStunned()) {
            this.stun -= 1;
        }
    }
}

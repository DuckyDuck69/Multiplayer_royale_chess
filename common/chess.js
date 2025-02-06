export const INCREMENT = 1;

export const PieceType = {
    Pawn: 0,
    Knight: 1,
    Bishop: 2,
    Rook: 3,
    Queen: 4,
    King: 5,
};


export class State {

    constructor() {
        this.board = new Board();
        this.pieces = [];
    }

    pieceAt(x, y){

    }

    possibleMovesFor(piece) {

    }

    // recursive function for piece movement
    calculateMoves(piece, x, y, dx, dy, depth) {

    }

}

export class Board {

    constructor(obstacles = []) {
        this.obstacles = obstacles;
    }

}

export class Move {

    constructor(piece, x, y) {
        this.piece = piece;
        this.x = x;
        this.y = y;
    }

}

export class Piece {

    constructor(type, x, y, owner) {
        // The type of the piece (an integer representing the PieceType above)
        this.type = type;
        // Position of the piece on the board (integer)
        this.x = x;
        this.y = y;
        // Owner index (integer)
        this.owner = owner;

        // Piece tags representing state, i.e. "canEnPassant" or "canCastle"
        this.tags = [];
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }

    getType() {
        return this.type;
    }

    getOwner() {
        return this.owner;
    }

}
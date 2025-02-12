// MoveType.None: The piece cannot move here
// MoveType.Move: The piece can move here

import Piece from "./piece.js";

// MoveType.Capture: The piece can move here but cannot go further
export const MoveType = {
    None: 0,
    Move: 1,
    Capture: 2,
};

// Class to represent a single move
export default class Move {

    constructor(piece, x, y) {
        this.piece = piece;
        this.x = x;
        this.y = y;
    }

    getPiece() {
        return this.piece;
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }


    toString() {
        return `${Piece.name(this.piece.type)}${String.fromCharCode(97 + this.x)}${this.y + 1}`;
    }

}
// MoveType.None: The piece cannot move here
// MoveType.Move: The piece can move here

import Piece from "./piece.js";

// MoveType.Capture: The piece can move here but cannot go further
export const MoveType = {
    None: 0,
    Move: 1,
    Capture: 2,
};

export const CastleType = {
    KingSide: 1,
    QueenSide: 2,
};

// Class to represent a single move
export default class Move {
    constructor(piece, x, y, { promoteTo, castle } = {}) {
        this.piece = piece;
        this.x = x;
        this.y = y;

        if (promoteTo) {
            this.promoteTo = promoteTo;
        }
        if (castle) {
            this.castle = castle;
        }
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

    getCoordinates() {
        return [this.x, this.y];
    }

    inCoordinatesList(coordinatesList = []) {
        return (coordinatesList || []).some(
            (coordinates) =>
                this.getX() === coordinates[0] && this.getY() === coordinates[1]
        );
    }

    toString() {
        return `${Piece.name(this.piece.type)}${String.fromCharCode(
            97 + this.x
        )}${this.y + 1}`;
    }
}

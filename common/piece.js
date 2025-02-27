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
    Stun3: 0,
    Stun2: 1,
    Stun1: 2,
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

        // Piece tags representing state, i.e. "canEnPassant" or "canCastle"
        this.tags = new Set();
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
                return "CL";
            case PieceType.ChimeraGoat:
                return "CG";
            case PieceType.Gorgon:
                return "G";
            case PieceType.Pegasus:
                return "P";
        }
        return "?";
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

    moveTo(x, y) {
        this.x = x;
        this.y = y;
        this.moveCount += 1;

        if (this.pieceType === PieceType.Pawn && this.moveCount >= 8) {
            // TODO: Implement underpromotion
            this.pieceType = PieceType.Queen;
        }
    }

    inCoordinatesList(coordinatesList = []) {
        return coordinatesList.some(
            (coordinates) =>
                this.getX() === coordinates[0] && this.getY() === coordinates[1]
        );
    }

    getType() {
        return this.type;
    }

    getOwner() {
        return this.owner;
    }

    addTag(tag) {
        this.tags.add(tag);
    }

    isStunned() {
        return this.tags.has(PieceTags.Stun1) || this.tags.has(PieceTags.Stun2) || this.tags.has(PieceTags.Stun3);
    }

    update() {
        if (this.tags.has(PieceTags.Stun3)) {
            this.tags.delete(PieceTags.Stun3);
            this.addTag(PieceTags.Stun2);
        } else if (this.tags.has(PieceTags.Stun2)) {
            this.tags.delete(PieceTags.Stun2);
            this.addTag(PieceTags.Stun1);
        } else if (this.tags.has(PieceTags.Stun1)) {
            this.tags.delete(PieceTags.Stun1);
        }
    }
}

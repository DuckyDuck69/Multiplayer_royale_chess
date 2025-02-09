// Different types of pieces in the game to determine movesets
export const PieceType = {
    Pawn: 0,
    Knight: 1,
    Bishop: 2,
    Rook: 3,
    Queen: 4,
    King: 5,
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

        // Piece tags representing state, i.e. "canEnPassant" or "canCastle"
        this.tags = [];
    }

    static name(pieceType) {
        switch (pieceType) {
            case PieceType.Rook: return 'R';
            case PieceType.Bishop: return 'B';
            case PieceType.Queen: return 'Q';
            case PieceType.King: return 'K';
            case PieceType.Pawn: return '';
            case PieceType.Knight: return 'N';
        }
        return '?';
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
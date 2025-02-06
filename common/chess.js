export const INCREMENT = 1;

// Different types of pieces in the game to determine movesets
export const PieceType = {
    Pawn: 0,
    Knight: 1,
    Bishop: 2,
    Rook: 3,
    Queen: 4,
    King: 5,
};

// A pawn can only capture diagonally and only move orthogonally, this could be
// applied to other future pieces as well
const CaptureMode = {
    Any: 0,
    OnlyCapture: 1,
    OnlyMove: 2,
}

// MoveType.None: The piece cannot move here
// MoveType.Move: The piece can move here
// MoveType.Capture: The piece can move here but cannot go further
const MoveType = {
    None: 0,
    Move: 1,
    Capture: 2,
};

// Vectors for each of the types of movement
const ORTHOGONAL = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const DIAGONAL = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
const KNIGHT = [[2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2], [1, 2]];
export class State {

    constructor(width = 16, height = 16) {
        this.width = width;
        this.height = height;

        this.board = new Board();
        this.pieces = [];
    }

    // Get piece at x and y coordinates
    pieceAt(x, y) {
        return this.pieces.find(p => p.getX() === x && p.getY() === y);
    }

    // Returns a MoveType integer:
    // MoveType.None: The piece cannot move here
    // MoveType.Move: The piece can move here
    // MoveType.Capture: The piece can move here but cannot go further
    pieceCanMoveTo(owner, x, y) {
        const at = this.pieceAt(x, y);
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return MoveType.None;
        }
        if (at) {
            if (at.owner === owner) {
                return MoveType.None;
            } else {
                return MoveType.Capture;
            }
        } else {
            return MoveType.Move;
        }
    }

    // Return a list of moves that the piece can make
    pieceMoves(piece) {
        switch (piece.getType()) {
            case PieceType.Rook: {
                return ORTHOGONAL
                    .flatMap(([dx, dy]) => this.calculateLineMoves(piece, dx, dy));
            }
            case PieceType.Bishop: {
                return DIAGONAL
                    .flatMap(([dx, dy]) => this.calculateLineMoves(piece, dx, dy));
            }
            case PieceType.Queen: {
                return [...ORTHOGONAL, ...DIAGONAL]
                    .flatMap(([dx, dy]) => this.calculateLineMoves(piece, dx, dy));
            }
            case PieceType.King: {
                return [...ORTHOGONAL, ...DIAGONAL]
                    .flatMap(([dx, dy]) => this.calculateLineMoves(piece, dx, dy, 1));
            }
            case PieceType.Pawn: {
                return [
                    ...ORTHOGONAL.flatMap(([dx, dy]) => this.calculateLineMoves(piece, dx, dy, 1, CaptureMode.OnlyMove)),
                    ...DIAGONAL.flatMap(([dx, dy]) => this.calculateLineMoves(piece, dx, dy, 1, CaptureMode.OnlyCapture))
                ];
            }
            case PieceType.Knight: {
                return KNIGHT.flatMap(([dx, dy]) => this.pieceCanMoveTo(piece.owner, piece.x + dx, piece.y + dy));
            }
        }
    }

    // recursive function for piece movement
    calculateLineMoves(piece, dx, dy, maxDistance = 8, captureMode = CaptureMode.Any) {
        let distance = 1;
        const moves = [];
        while (distance < maxDistance) {
            const [x, y] = [piece.x + dx * distance, piece.y + dy * distance];
            const moveType = this.pieceCanMoveTo(piece.owner, x, y);

            if (moveType !== MoveType.None) {
                if (captureMode === CaptureMode.Any 
                    || (captureMode === CaptureMode.OnlyCapture && moveType === MoveType.Capture)
                    || (captureMode === CaptureMode.OnlyMove && moveType === MoveType.Move)) {
                    moves.push(new Move(piece, x, y));
                }
            }
            if (moveType !== MoveType.Move) {
                return moves;
            }
        }
        return moves;
    }

}

// Holds state about the board such as obstacles (portals? walls?)
export class Board {

    constructor(obstacles = []) {
        this.obstacles = obstacles;
    }

}

// Class to represent a single move
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
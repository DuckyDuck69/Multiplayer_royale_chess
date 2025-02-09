import Board from './board.js';
import Move, { MoveType } from './move.js';
import Piece, { PieceType } from './piece.js';

export const INCREMENT = 1;

// A pawn can only capture diagonally and only move orthogonally, this could be
// applied to other future pieces as well
const CaptureMode = {
    Any: 0,
    OnlyCapture: 1,
    OnlyMove: 2,
}

// Vectors for each of the types of movement
const ORTHOGONAL = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const DIAGONAL = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
const KNIGHT = [[2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2], [1, 2]];

const DEFAULT_LAYOUT = [PieceType.Rook, PieceType.Knight, PieceType.Bishop, PieceType.Queen, PieceType.King, PieceType.Bishop, PieceType.Knight, PieceType.Rook];

export const BLACK_OWNER = 1;
export const WHITE_OWNER = 0;

export default class State {

    constructor(width = 16, height = 16) {
        this.width = width;
        this.height = height;

        this.board = new Board();
        this.pieces = [];
    }

    static default() {
        const state = new State();

        for (let i = 0; i < 8; i += 1) {
            state.pieces.push(new Piece(DEFAULT_LAYOUT[i], i, 0, BLACK_OWNER));
            state.pieces.push(new Piece(PieceType.Pawn, i, 1, BLACK_OWNER));
            state.pieces.push(new Piece(PieceType.Pawn, i, 6, WHITE_OWNER));
            state.pieces.push(new Piece(DEFAULT_LAYOUT[i], i, 7, WHITE_OWNER));
        }

        return state;
    }

    allMovesFor(owner) {
        return this.pieces.filter(p => p.owner === owner)
            .flatMap(p => this.pieceMoves(p));
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
                return KNIGHT.map(([dx, dy]) => {
                    const [x, y] = [piece.x + dx, piece.y + dy];
                    const moveType = this.pieceCanMoveTo(piece.owner, x, y);
                    if (moveType !== MoveType.None) {
                        return new Move(piece, x, y);
                    } else {
                        return null;
                    }
                }).filter(p => p);
            }
        }
    }



    calculateLineMoves(piece, dx, dy, maxDistance = 8, captureMode = CaptureMode.Any) {
        let distance = 1;
        const moves = [];
        while (distance <= maxDistance) {
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
            distance += 1;
        }
        return moves;
    }

}
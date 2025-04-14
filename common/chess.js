import Board from "./board.js";
import Move, { CastleType, MoveType } from "./move.js";
import Obstacle, { ObstacleType } from "./obstacle.js";
import Piece, { PieceTags, PieceType } from "./piece.js";

export const INCREMENT = 1;

// A pawn can only capture diagonally and only move orthogonally, this could be
// applied to other future pieces as well
const CaptureMode = {
    Any: 0,
    OnlyCapture: 1,
    OnlyMove: 2,
};

// Vectors for each of the types of movement
const ORTHOGONAL = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
];
const DIAGONAL = [
    [1, 1],
    [-1, 1],
    [-1, -1],
    [1, -1],
];
const KNIGHT = [
    [2, 1],
    [2, -1],
    [1, -2],
    [-1, -2],
    [-2, -1],
    [-2, 1],
    [-1, 2],
    [1, 2],
];

const DEFAULT_LAYOUT = [
    PieceType.Rook,
    PieceType.Builder,
    PieceType.Pegasus,
    PieceType.ChimeraGoat,
    PieceType.ChimeraLion,
    PieceType.Knight,
    PieceType.Bishop,
    PieceType.Queen,
    PieceType.King,
    PieceType.Bishop,
    PieceType.Knight,
    PieceType.Gorgon,
    PieceType.Juggernaut,
    PieceType.Pegasus,
    PieceType.Builder,
    PieceType.Rook,
];

export const BLACK_OWNER = 1;
export const WHITE_OWNER = 0;

export default class State {
    constructor(width = 100, height = 100) {
        this.width = width;
        this.height = height;

        this.board = new Board();

        // Map of piece owners to all of the squares attacked by all other owners (to determine checks etc.)
        this.attackMap = {};
        this.pieces = [];
    }

    // Prepare state to be sent across network
    serialize() {
        const stateObject = {
            ...this,
            pieces: this.pieces.map((p) => p.serialize()),
        };
        delete stateObject.attackMap;
        return stateObject;
    }

    // Create state from state sent across network
    static deserialize(from) {
        const state = new State();
        state.width = from.width;
        state.height = from.height;
        state.board = Board.deserialize(from.board);
        state.pieces = from.pieces.map((p) => Piece.deserialize(p));
        state.recalculateAttackMap();

        return state;
    }

    static default() {
        const state = new State();

        for (let i = 0; i < 16; i += 1) {
            state.pieces.push(new Piece(DEFAULT_LAYOUT[i], i, 0, BLACK_OWNER));
            state.pieces.push(new Piece(PieceType.Pawn, i, 1, BLACK_OWNER));
            state.pieces.push(new Piece(PieceType.Pawn, i, 14, WHITE_OWNER));
            state.pieces.push(new Piece(DEFAULT_LAYOUT[i], i, 15, WHITE_OWNER));
        }

        state.board = Board.generate(state);

        // state.board.addObstacle(Obstacle.wall(7, 10));
        // state.board.addObstacle(Obstacle.mud(0, 10));
        state.recalculateAttackMap();
        return state;
    }

    allOwners() {
        return [...new Set(this.pieces.map((piece) => piece.getOwner()))];
    }

    recalculateAttackMap() {
        const owners = this.allOwners();
        this.attackMap = {};
        for (const owner of owners) {
            this.attackMap[owner] = [
                ...new Set(
                    owners
                        .filter((other) => other !== owner)
                        .flatMap((other) =>
                            this.allMovesFor(other).map((m) =>
                                m.getCoordinates()
                            )
                        )
                ),
            ];
        }
    }

    update() {
        this.recalculateAttackMap();
        this.pieces.forEach((p) => p.update());
    }

    allMovesFor(owner) {
        return this.pieces
            .filter((p) => p.owner === owner)
            .flatMap((p) => this.pieceMoves(p));
    }

    // Get piece at x and y coordinates
    pieceAt(x, y) {
        return this.pieces.find((p) => p.getX() === x && p.getY() === y);
    }

    // Returns a MoveType integer:
    // MoveType.None: The piece cannot move here
    // MoveType.Move: The piece can move here
    // MoveType.Capture: The piece can move here but cannot go further
    pieceCanMoveTo(owner, x, y, ignoresObstacles = false) {
        const at = this.pieceAt(x, y);
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return MoveType.None;
        }
        if (at) {
            if (at.getOwner() === owner) {
                return MoveType.None;
            } else {
                return MoveType.Capture;
            }
        }
        const obstacles = this.board.obstaclesAt(x, y);
        if (
            !ignoresObstacles &&
            obstacles.some((o) => o.getType() === ObstacleType.Wall)
        ) {
            return MoveType.None;
        }
        if (
            !ignoresObstacles &&
            obstacles.some((o) => o.getType() === ObstacleType.Mud)
        ) {
            return MoveType.Capture;
        }
        return MoveType.Move;
    }

    findKing(owner) {
        return this.pieces.find(
            (piece) =>
                piece.getOwner() === owner && piece.getType() === PieceType.King
        );
    }

    findChimeraGoat(owner) {
        return this.pieces.find(
            (piece) =>
                piece.getOwner() === owner &&
                piece.getType() === PieceType.ChimeraGoat
        );
    }

    findChimeraLion(owner) {
        return this.pieces.find(
            (piece) =>
                piece.getOwner() === owner &&
                piece.getType() === PieceType.ChimeraLion
        );
    }

    findOtherChimera(piece) {
        return piece.getType() === PieceType.ChimeraGoat
            ? this.findChimeraLion(piece.owner)
            : this.findChimeraGoat(piece.owner);
    }

    isUnderAttack(owner, x, y) {
        return (this.attackMap[owner] || []).some(
            ([xx, yy]) => xx === x && yy === y
        );
    }

    isInCheck(owner) {
        return this.findKing(owner).inCoordinatesList(this.attackMap[owner]);
    }

    hasLost(owner) {
        return !this.findKing(owner);
    }

    manhattanDistance(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    // Return a list of moves that the piece can make
    pieceMoves(piece) {
        if (this.hasLost(piece.owner)) {
            return [];
        }
        if (piece.isStunned()) {
            return [];
        }
        switch (piece.getType()) {
            case PieceType.Rook: {
                return ORTHOGONAL.flatMap(([dx, dy]) =>
                    this.calculateLineMoves(piece, dx, dy)
                );
            }
            case PieceType.Bishop: {
                return DIAGONAL.flatMap(([dx, dy]) =>
                    this.calculateLineMoves(piece, dx, dy)
                );
            }
            case PieceType.Queen: {
                return [...ORTHOGONAL, ...DIAGONAL].flatMap(([dx, dy]) =>
                    this.calculateLineMoves(piece, dx, dy)
                );
            }
            case PieceType.King: {
                const moves = [...ORTHOGONAL, ...DIAGONAL].flatMap(([dx, dy]) =>
                    this.calculateLineMoves(piece, dx, dy, 1).filter(
                        // Cannot move into check
                        (move) =>
                            !move.inCoordinatesList(this.attackMap[piece.owner])
                    )
                );
                if (piece.hasNotMoved()) {
                    // king side
                    const kingSideRook = this.pieceAt(piece.x + 3, piece.y);
                    const kingSideCastlePossible =
                        kingSideRook &&
                        kingSideRook.getType() === PieceType.Rook &&
                        kingSideRook.hasNotMoved() &&
                        !this.pieceAt(piece.x + 1, piece.y) &&
                        !this.pieceAt(piece.x + 2, piece.y) &&
                        !this.isUnderAttack(
                            piece.owner,
                            piece.x + 1,
                            piece.y
                        ) &&
                        !this.isUnderAttack(
                            piece.owner,
                            piece.x + 2,
                            piece.y
                        ) &&
                        !this.isUnderAttack(piece.owner, piece.x + 3, piece.y);

                    if (kingSideCastlePossible) {
                        moves.push(
                            new Move(piece, piece.x + 2, piece.y, {
                                castle: CastleType.KingSide,
                            })
                        );
                    }

                    const queenSideRook = this.pieceAt(piece.x - 4, piece.y);
                    const queenSideCastlePossible =
                        queenSideRook &&
                        queenSideRook.getType() === PieceType.Rook &&
                        queenSideRook.hasNotMoved() &&
                        !this.pieceAt(piece.x - 1, piece.y) &&
                        !this.pieceAt(piece.x - 2, piece.y) &&
                        !this.pieceAt(piece.x - 3, piece.y) &&
                        !this.isUnderAttack(
                            piece.owner,
                            piece.x - 1,
                            piece.y
                        ) &&
                        !this.isUnderAttack(
                            piece.owner,
                            piece.x - 2,
                            piece.y
                        ) &&
                        !this.isUnderAttack(
                            piece.owner,
                            piece.x - 3,
                            piece.y
                        ) &&
                        !this.isUnderAttack(piece.owner, piece.x - 4, piece.y);

                    if (queenSideCastlePossible) {
                        moves.push(
                            new Move(piece, piece.x - 2, piece.y, {
                                castle: CastleType.QueenSide,
                            })
                        );
                    }
                }
                return moves;
            }
            case PieceType.Pawn: {
                return [
                    ...ORTHOGONAL.flatMap(([dx, dy]) =>
                        this.calculateLineMoves(
                            piece,
                            dx,
                            dy,
                            piece.hasNotMoved() ? 2 : 1,
                            CaptureMode.OnlyMove
                        )
                    ),
                    ...DIAGONAL.flatMap(([dx, dy]) =>
                        this.calculateLineMoves(
                            piece,
                            dx,
                            dy,
                            1,
                            CaptureMode.OnlyCapture
                        )
                    ),
                ];
            }
            case PieceType.Pegasus:
            case PieceType.Knight: {
                return KNIGHT.map(([dx, dy]) => {
                    const [x, y] = [piece.x + dx, piece.y + dy];
                    const moveType = this.pieceCanMoveTo(
                        piece.owner,
                        x,
                        y,
                        piece.getType() === PieceType.Pegasus
                    );
                    if (moveType !== MoveType.None) {
                        return new Move(piece, x, y);
                    } else {
                        return null;
                    }
                }).filter((p) => p);
            }
            case PieceType.Gorgon: {
                return [
                    ...ORTHOGONAL.flatMap(([dx, dy]) =>
                        this.calculateLineMoves(
                            piece,
                            dx,
                            dy,
                            2,
                            CaptureMode.OnlyMove
                        )
                    ),
                    ...DIAGONAL.flatMap(([dx, dy]) =>
                        this.calculateLineMoves(
                            piece,
                            dx,
                            dy,
                            2,
                            CaptureMode.Any
                        )
                    ),
                ];
            }
            case PieceType.Builder: {
                return [...ORTHOGONAL, ...DIAGONAL].flatMap(([dx, dy]) =>
                    this.calculateLineMoves(
                        piece,
                        dx,
                        dy,
                        1,
                        CaptureMode.OnlyMove // Builder cannot capture? That would be kinda cool.
                    )
                );
            }
            case PieceType.Juggernaut: {
                return [...ORTHOGONAL, ...DIAGONAL].flatMap(([dx, dy]) => {
                    const isInDirection =
                        Math.sign(piece.getLastDx()) === dx &&
                        Math.sign(piece.getLastDy()) === dy;
                    const moveCount = isInDirection
                        ? [0, 1, 3, 6][piece.getJuggernautStrength()]
                        : 1;
                    return this.calculateLineMoves(
                        piece,
                        dx,
                        dy,
                        moveCount,
                        CaptureMode.Any,
                        piece.getJuggernautStrength() === 3
                    );
                });
            }
            case PieceType.ChimeraGoat:
            case PieceType.ChimeraLion: {
                const otherChimera = this.findOtherChimera(piece);
                if (!piece.hasTag(PieceTags.ChimeraMoveable)) {
                    return [];
                }
                const moves = KNIGHT.map(([dx, dy]) => {
                    const [x, y] = [piece.x + dx, piece.y + dy];
                    const distanceAfterMove = this.manhattanDistance(
                        otherChimera.getX(),
                        otherChimera.getY(),
                        x,
                        y
                    );
                    if (distanceAfterMove > 8) {
                        // Chimera twins cannot move that far apart
                        return null;
                    }
                    const moveType = this.pieceCanMoveTo(piece.owner, x, y);
                    if (moveType !== MoveType.None) {
                        return new Move(piece, x, y);
                    } else {
                        return null;
                    }
                }).filter((p) => p);

                // special move
                if (
                    (piece.getY() !== otherChimera.getY() ||
                        piece.getX() !== otherChimera.getX() - 1) &&
                    piece.getX() < otherChimera.getX() &&
                    this.pieceCanMoveTo(
                        piece.owner,
                        otherChimera.getX() - 1,
                        otherChimera.getY()
                    )
                ) {
                    return [
                        ...moves.filter(
                            (m) =>
                                m.getX() !== otherChimera.getX() - 1 ||
                                m.getY() !== otherChimera.getY()
                        ),
                        new Move(
                            piece,
                            otherChimera.getX() - 1,
                            otherChimera.getY(),
                            { chimeraSpecial: true }
                        ),
                    ];
                } else if (
                    (piece.getY() !== otherChimera.getY() ||
                        piece.getX() !== otherChimera.getX() + 1) &&
                    piece.getX() > otherChimera.getX() &&
                    this.pieceCanMoveTo(
                        piece.owner,
                        otherChimera.getX() + 1,
                        otherChimera.getY()
                    )
                ) {
                    return [
                        ...moves.filter(
                            (m) =>
                                m.getX() !== otherChimera.getX() + 1 ||
                                m.getY() !== otherChimera.getY()
                        ),
                        new Move(
                            piece,
                            otherChimera.getX() + 1,
                            otherChimera.getY(),
                            { chimeraSpecial: true }
                        ),
                    ];
                } else {
                    return moves;
                }
            }
        }
        return [];
    }

    calculateLineMoves(
        piece,
        dx,
        dy,
        maxDistance = 8,
        captureMode = CaptureMode.Any,
        ignoresObstacles = false
    ) {
        let distance = 1;
        const moves = [];
        while (distance <= maxDistance) {
            const [x, y] = [piece.x + dx * distance, piece.y + dy * distance];
            const moveType = this.pieceCanMoveTo(
                piece.owner,
                x,
                y,
                ignoresObstacles
            );

            if (moveType !== MoveType.None) {
                if (
                    captureMode === CaptureMode.Any ||
                    (captureMode === CaptureMode.OnlyCapture &&
                        moveType === MoveType.Capture) ||
                    (captureMode === CaptureMode.OnlyMove &&
                        moveType === MoveType.Move)
                ) {
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

    bresenhamsBetween(x1, y1, x2, y2) {
        let [mx1, mx2] = [Math.min(x1, x2), Math.max(x1, x2)];
        let [my1, my2] = [Math.min(y1, y2), Math.max(y1, y2)];
        let [dx, dy] = [mx2 - mx1, my2 - my1];
        let flipped = false;

        if (dy > dx) {
            flipped = true;

            let temp = mx1;
            mx1 = mx2;
            mx2 = temp;

            temp = my1;
            my1 = my2;
            my2 = temp;

            temp = dy;
            dx = dy;
            dy = temp;
        }

        let x = mx1;
        let y = my1;

        let e = 0;
        const points = [];

        while (x <= mx2) {
            console.log(points, x, y, mx1, mx2, my1, my2);
            if (flipped) {
                points.push([y, x]);
            } else {
                points.push([x, y]);
            }
            e += dy;
            if (2 * e > dx) {
                y += 1;
                e -= dx;
            }
            x += 1;
        }
        return points;
    }

    // Assumes move is valid
    // Returns true if piece is captured
    makeMove(move) {
        const [pieceX, pieceY] = [
            move.getPiece().getX(),
            move.getPiece().getY(),
        ];
        // ensures we have proper reference to the piece
        const piece = this.pieceAt(pieceX, pieceY);

        const previousLength = this.pieces.length;
        const capturedPieces = this.pieces.filter(
            (p) => p.getX() === move.getX() && p.getY() === move.getY()
        );
        this.pieces = this.pieces.filter(
            (p) => p.getX() !== move.getX() || p.getY() !== move.getY()
        );

        for (const other of capturedPieces) {
            if (other.isChimera()) {
                // when a chimera is captured, capture other chimera as well
                this.pieces = this.pieces.filter(
                    (p) => p.owner !== other.owner || !p.isChimera()
                );
            }
        }

        // Builder places wall when moving diagonally
        if (
            piece.getType() === PieceType.Builder &&
            piece.getX() - move.getX() !== 0 &&
            piece.getY() - move.getY() !== 0
        ) {
            this.board.addObstacle(Obstacle.wall(piece.getX(), piece.getY()));
        }

        if (piece.isChimera()) {
            const otherChimera = this.findOtherChimera(piece);
            piece.removeTag(PieceTags.ChimeraMoveable);
            otherChimera.addTag(PieceTags.ChimeraMoveable);

            if (move.chimeraSpecial) {
                const points = this.bresenhamsBetween(
                    piece.getX(),
                    piece.getY(),
                    move.getX(),
                    move.getY()
                );

                console.log(points);

                // capture all pieces with bresenhams.
                this.pieces = this.pieces.filter(
                    (p) =>
                        p.owner === piece.owner ||
                        !points.some(
                            (point) =>
                                point[0] === p.getX() && point[1] === p.getY()
                        )
                );
            }
        }

        piece.moveTo(move.getX(), move.getY());

        if (move.castle) {
            // assumes that the move is valid, and can castle
            if (move.castle === CastleType.KingSide) {
                this.pieceAt(pieceX + 3, pieceY).moveTo(pieceX + 1, pieceY);
            } else if (move.castle === CastleType.QueenSide) {
                this.pieceAt(pieceX - 4, pieceY).moveTo(pieceX - 1, pieceY);
            }
        }

        const isCapture = this.pieces.length < previousLength;

        // Gorgon stuns local pieces upon capture
        if (piece.getType() === PieceType.Gorgon && isCapture) {
            this.pieces
                .filter(
                    (p) =>
                        Math.abs(p.getX() - piece.getX()) <= 1 &&
                        Math.abs(p.getY() - piece.getY()) <= 1
                )
                .forEach((p) => p.stunPiece(3));
        }

        if (
            piece.getType() === PieceType.Juggernaut &&
            this.board.obstaclesAt(move.getX(), move.getY())
        ) {
            this.board.removeObstaclesAt(move.getX(), move.getY());
        }

        this.update();
        return isCapture;
    }

    toString(x = 0, y = 0, w = 8, h = 8) {
        let str = "";
        for (let i = y; i < y + h; i += 1) {
            for (let j = x; j < x + w; j += 1) {
                const at = this.pieceAt(j, i);
                if (at) {
                    str += at.toString() || "p";
                } else {
                    str += ".";
                }
            }
            str += "\n";
        }
        return str;
    }
}

import State, { WHITE_OWNER } from "../common/chess.js";

// Construct a random state, make random white move.
const state = State.default();

const allMoves = state.allMovesFor(WHITE_OWNER);
console.log(allMoves.map(m => m.toString()));
const randomMoveIndex = Math.floor(Math.random() * allMoves.length);

console.log(allMoves[randomMoveIndex].toString());
console.log(state.toString());
state.makeMove(allMoves[randomMoveIndex]);

console.log(state.toString());
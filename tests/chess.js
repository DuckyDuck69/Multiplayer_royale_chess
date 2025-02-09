import State, { BLACK_OWNER, WHITE_OWNER } from "../common/chess.js";

const state = State.default();

console.log(state.allMovesFor(WHITE_OWNER).map(m => m.toString()));
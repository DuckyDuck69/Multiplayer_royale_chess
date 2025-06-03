import Move from "./move";
import State, { NPC_OWNER } from "./chess";
import Piece, { PieceType } from "./piece";

export default class NPC extends Piece {
    static moveDirection = [
        [0, 1], //down
        [1, 0], //right
        [0, -1],//up
        [-1, 0] //left
    ];
    constructor(x, y, state = State, moveDirection = NPC.moveDirection){
        super(PieceType.Pawn,x,y,NPC_OWNER)
        this.name = "The Wanderer"

        this.state = state
        this.moveDirection = moveDirection  //pass the direction array 
    }

    /*addNPC(piece){
        this.npcs.push(piece);
        console.log(piece.type)
    }
    getNpcType(){
        return this.type
    }*/

    updateNPC(){
        let dx, dy, newX, newY
        let move = null;

        let valid = false
        while(!valid){
            //randomly pick 1 out of 4 direction
            [dx, dy] = this.moveDirection[Math.floor(Math.random() * this.moveDirection.length)]  //random from 0->3
            newX = this.getX() + dx 
            newY = this.getY() + dy

            // Try to make a move and see if it is valid
            const possibleMoves = this.state.pieceMoves(this.type);
            move = possibleMoves.find(m => m.getX() === newX && m.getY() === newY);
            
            if(move){
                valid = true
            }
        }
        console.log("NPC moved")
        if(move){
            this.state.makeMove(move);  //move the piece
        }
    }
}
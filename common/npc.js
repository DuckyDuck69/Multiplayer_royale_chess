import Move from "./move";


export default class NPC{
    static moveDirection = [
        [0, 1], //down
        [1, 0], //right
        [0, -1],//up
        [-1, 0] //left
    ];
    constructor(state, moveDirection = NPC.moveDirection){
        this.state = state
        this.npcs = []  //we can make multiple npcs if we want
        this.moveDirection = moveDirection  //pass the direction array 
    }

    addNPC(piece){
        this.npcs.push(piece);
        console.log(piece.type)
    }

    updateNPC(){
        for(const npc of this.npcs){
            let dx, dy, newX, newY
            let move = null;

            let valid = false
            while(!valid){
                //randomly pick 1 out of 4 direction
                [dx, dy] = this.moveDirection[Math.floor(Math.random() * this.moveDirection.length)]  //random from 0->3
                newX = npc.getX() + dx
                newY = npc.getY() + dy

                // Try to make a move and see if it is valid
                const possibleMoves = this.state.pieceMoves(npc);
                move = possibleMoves.find(m => m.getX() === newX && m.getY() === newY);

                if(move){
                    valid = true
                }
            }
            console.log("hahahaha")
            if(move){
                this.state.makeMove(move);  //move the piece
            }
        }
    }
}
// Import the express package to create our web server.
import express from "express";
import http from "http";
import JSum from "jsum";

// We also import the increment value from the common code.
import State, { INCREMENT } from "../common/chess.js";

// This is how to import a specific item from a javascript module. Similar to
// `from x import y` in python.
import { Server } from "socket.io";
import Move from "../common/move.js";

// The port that the web server runs on.
const PORT = process.env.PORT || 8080;

// This creates our web server. `const` declares a variable that cannot be reassigned.
const app = express();
const server = http.createServer(app);

// This creates our socket.io instance for websocket communication.
const io = new Server(server);

// `let` defines a locally-scoped variable that can be modified (not const). It is
// good to get into the habit of using `let` instead of `var` as `var` has some
// strange semantics:
// https://stackoverflow.com/questions/762011/what-is-the-difference-between-let-and-var

/**
 * Ok, this requires a bit more explanation. In JavaScript (and other languages with
 * "higher-order functions"), functions themselves can be stored in regular variables,
 * or passed as arguments to other functions!
 *
 * As an example:
 * function test() {
 *     return 4;
 * }
 *
 * function runner(func) {
 *      return func();
 * }
 *
 * runner(test) // This will return 4
 *
 * As this is quite a common operation, there is shorthand for creating an "anonymous"
 * function (a function without a name, but that can still be passed around and called).
 * Like this:
 * (arg1, arg2, arg3) => {
 *     *insert javascript here*
 * }
 *
 * In this particular case, whenever a client connects to the socket, it will call a function,
 * passing information along about the socket (including id, ip address, etc), so that we can
 * handle any server operations (load their pieces, send a chat message, etc). That is why
 * the second argument looks the way it does. You could write it the same way like:
 *
 * function handleConnection(socket) {
 *     console.log(`${socket.id} connected!`);
 * }
 *
 * io.on("connection", handleConnection);
 *
 * And it would still work the same.
 */

let nextOwner = 0;
let state = State.default();
let stateSum = JSum.digest(state, "SHA256", "hex");

io.on("connection", (socket) => {
    console.log(`${socket.id} connected!`);
    const owner = nextOwner;
    nextOwner = 1 - nextOwner;

    socket.emit("state", {
        owner,
        state: state.serialize(),
        sum: stateSum,
    });

    socket.on("move", (data) => {
        // Client has gotten out of sync;
        if (stateSum !== data.sum) {
            socket.emit("state", {
                owner,
                state: state.serialize(),
                sum: stateSum,
            });
            return;
        }
        const move = Move.deserialize(data.move);
        console.log(owner, "-", move.toString());
        // TODO: validate
        state.makeMove(move);
        stateSum = JSum.digest(state, "SHA256", "hex");

        io.emit("move", { move: move.serialize(), sum: stateSum });
    });

    socket.on("state_request", () => {
        socket.emit("state", {
            owner,
            state: state.serialize(),
            sum: stateSum,
        });
    });
});

// This tells express to send any files in the "dist" directory, which is where parcel
// outputs its page build files. Basically, if you ask for any file in the "client" directory
// this will make sure that the file is sent to the user.
app.use(express.static("dist"));

// This is a little complicated, but this allows us to send data to the server in
// JSON (JavaScript Object Notaton) to the server.
app.use(express.json());

// This will have the server listen on the port provided at the top of the file.
server.listen(PORT, () => {
    // This is a special javascript format string! Use the characters `` and insert
    // a ${} to have any variable concatenated into the string. It is similar to an
    // f-string in python.
    console.log(`Server started at: http://localhost:${PORT}`);
});


// Import the express package to create our web server.
import express from "express";
import http from "http";

// We also import the increment value from the common code.
import { INCREMENT, State } from "../common/chess.js";

// This is how to import a specific item from a javascript module. Similar to
// `from x import y` in python.
import { Server } from "socket.io";

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
let number = 5;

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
io.on("connection", (socket) => {
    console.log(`${socket.id} connected!`);

    socket.emit("value", number);

    // Listen for a `message` packet, and display it.
    socket.on("message", (message) => {
        console.log(`Message from: ${socket.id}: ${message}`)
    })

    // Listen for an `increment` packet. If the increment is valid (matches the
    // increment value), then increment the number and send that to everyone, else display an error.
    socket.on("increment", ({ by }) => {
        if (by === INCREMENT) {
            number += by;
            console.log(`${socket.id} incremented the number to ${number}`);

            // Calling io.emit will emit to EVERY connected client.
            io.emit("value", number);
        } else {
            console.error(`${socket.id} attempted to send an invalid increment!`);
        }
    })
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
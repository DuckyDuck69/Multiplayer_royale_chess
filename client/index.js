// This imports the socket.io client code
import { io } from "socket.io-client";

// This imports the INCREMENT value from the /common/chess.js file. Files in the
// /common directory should be accessible from both the client and server.
import { INCREMENT } from "../common/chess";

console.log("Hello from the browser!");
console.log(`The increment is: ${INCREMENT}`);

// Create a socket.io client instance (this will automatically connect to
// the socket.io server).
const socket = io();

// This will be called when the socket gets connected.
socket.on("connect", () => {
    console.log(`${socket.id} connected!`);
});


// This will be called when a new value is recieved.
socket.on("value", (value) => {
    console.log(`Recieved value: ${value}`);
    document.getElementById('number').innerText = `The number is currently: ${value}`;
});

// When the send message button is clicket, call this function
document.getElementById("sendMessage").addEventListener("click", () => {
    // Get the message from the text box
    const message = document.getElementById("message").value || "";
    
    // Emit a "message" packet. The socket.emit function takes two arguments,
    // firstly, the argument name, and then the message data which can be anything,
    // and can be read by the server.
    socket.emit("message", message);
});

// When the increment number button is clicked, call this function
document.getElementById("incrementNumber").addEventListener("click", () => {
    socket.emit("increment", { by: INCREMENT });
});
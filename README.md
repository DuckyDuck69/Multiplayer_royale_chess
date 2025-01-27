# Daily Chess Royale

### Setup

This project will use [Node](https://nodejs.org/en) to run the server. Follow the instructions to download Node and `npm` (node package manager) here: [https://nodejs.org/en/download](https://nodejs.org/en/download).

Node is a "javascript runtime" meaning it takes javascript code on your computer and runs whatever is in the file. After you install nodejs and npm, ensure it works by running `node test.js` in the root folder of this project. If everything is installed correctly, `Hello from test.js!` should appear in your terminal. Look inside the test.js file. There is only a `console.log()` call with the message `"Hello from test.js!"`. Try editing the message, saving the file, and running `node test.js` once more. You will see it has updated.

We will be using a few "packages" to create this project. Notably:

- [`express`](https://www.npmjs.com/package/express) - which will help us run the web server.
- [`socket.io`](https://www.npmjs.com/package/socket.io)  - which will allow fast communication using WebSockets between the client and server.
- [`parcel`](https://parceljs.org/) - which allows us to use "hot reloading" and share javascript code between the client and the server (this will be important later).

These packages are just collections of javascript code written by other developers or teams of other developers. They can be installed by typing `npm install <name of package>`. `npm` here stands for Node Package Manager. When new packages are installed, they are added to a special file called `package.json` in the root directory of the project. This lets us make sure we all have packages that are the same version between all of our local computers. **Before you can run the project, please type `npm install` (without any other arguments) to install all the packages in the `package.json` file. The project will not run without them.**

Packages can be imported to files by typing `import ... from "<package>";`. For example, we import the `express` package by typing `import express from "express";`.

You may now run the project. Type `npm run dev` in the terminal to run the development server. The development server is setup in such a way that any changes to either the server or development files will automatically restart them for you. If you make a change to the server, it will automatically restart allowing you to make incremental changes quicker.

You should see `Server started at http://localhost:8080` in your terminal. In VSCode, you can ctrl-click the link to open it in your browser. You should see a blank page that reads "Chess Royale". Look back in the terminal. You should see something that looks like `3MckifF_rjQ2C3j3AAAF connected!`. This means that a websocket connection has been made from the web page to the server! Type something in the text box, and press "Send". Look in the terminal to see your message has been delivered to the server!

Next, try clicking the "increment" button. This will update the number on the page, but this number is actually synced between all clients. Try opening a second tab at [http://localhost:8080](http://localhost:8080). Notice how when one client clicks the increment button, the number increments for all pages. Try changing the `INCREMENT` variable in `common/chess.js` and **reloading the pages** (otherwise the `INCREMENT` number will be outdated on the client and the server will not accept it - this is written in the server code). The number should now increment by that new number.

Press ctrl-C to stop the server process in your terminal.

***I would highly recommend reading the code in `server/index.js`! I put a lot of work into commenting it so hopefully everyone can understand.***

## Project Structure

- `client/` - where all the client files and webpages are stored
- `common/` - javascript files (most likely game logic) that need to be shared between client and server
- `server/` - server code

// 
// Server for SixPieces.
//
// (85)
//
// $Id: index.ts 3751 2021-01-02 01:21:16Z zwo $

// for headless mode:
// var engine = new BABYLON.NullEngine();
// var scene = new BABYLON.Scene(engine);

const Server = require("boardgame.io/server").Server;
const GameDefinition = require("./game").GameDefinition;
const server = Server({ games: [GameDefinition] });
server.run(8085);

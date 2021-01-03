// 
// Main entry point.
//
// (85)
//
// $Id: index.ts 3758 2021-01-03 10:49:37Z zwo $

// import 'pepjs' -- needed for pointer interactions says the babylon doc?

import { Client } from 'boardgame.io/client';
// import { Local } from 'boardgame.io/multiplayer'
import { SocketIO } from 'boardgame.io/multiplayer'

import { createEngine, createScene } from './functions'
import { makeMaterials } from './make_materials'
import { createWorld } from './world'
import { GameDefinition } from './game';
import { _ClientImpl } from 'boardgame.io/dist/types/src/client/client';
import { Player } from './types/GameState';

// Import stylesheets
// import './index.css';

export const debug = false; // NOTE: press ctrl+shift+X for debugging webGL objects
export var playerID: string; // this player's ID
export const hideopp = true; // hide other players' pieces on hand (not for debugging)
export const ngeneration = 3; // how often each piece exists, normally 3

// setup objects
const canvas: HTMLCanvasElement = document.getElementById('game_canvas') as HTMLCanvasElement
const engine = createEngine(canvas)
const scene = createScene()
makeMaterials(scene)
const world = createWorld(scene)
export var gameClient: GameClient;

function SetupScreen(div: HTMLDivElement) {
  return new Promise(resolve => {
    const createButton = (playerID: string) => {
      const button = document.createElement('button');
      button.textContent = 'Player ' + playerID;
      button.onclick = () => resolve(playerID);
      div.append(button);
    };
    const playerIDs = ["0", "1", "2", "3"];
    playerIDs.forEach(createButton);
  });
}

// main function that is async so we can call the scene manager with await
const main = async () => {

  // Start the scene
  engine.runRenderLoop(() => {
    scene.render()
  })

}

class GameClient {

  private client: _ClientImpl;
  public moves: any;

  constructor(
    public playerID: string = "0",
    public matchID: string = "default",
    public server_url: string,
    public numPlayers: number = 2,
  ) {
    this.client = Client({
      game: GameDefinition,
      // multiplayer: Local(),
      multiplayer: SocketIO({ server: server_url, socketOpts: {path: '/SixPiecesServer/socket.io'} }), // TODO: better way to set path
      // multiplayer: SocketIO({ server: server_url }), // TODO: better way to set path
      numPlayers,
      playerID,
      matchID,
      debug
    });

    this.client.subscribe((state) => {
      if (state) {
        if (state.G && state.G.players) {
          let s = [];
          for (let player of state.G.players as Player[]) {
            s.push(player.score);
          }
          document.title = `Scores: ${JSON.stringify(s)}`;
        }
        if (state.ctx.gameover) {
          divElement.hidden = false;
          let e: string = "<h1>Game ended</h1>";
          for (let p of state.G.players) {
            e = e + `<p>Player ${p.id} has ${p.score} points.</p>`;
          }
          divElement.innerHTML = e;
        }
        world.setCurrPlayer(state.ctx.currentPlayer);
        world.unpack(state.G);
      }
    });

    this.moves = this.client.moves;
    this.client.start();

    console.log(`GameCient for ${numPlayers} created and started.`);
  }
}

const divElement = document.getElementById('setup') as HTMLDivElement;
SetupScreen(divElement).then((playerID: any) => {

  divElement.hidden = true;
  let matchID = (document.getElementById('matchID') as HTMLInputElement).value;
  let numberOfPlayers = parseInt((document.getElementById('numberOfPlayers') as HTMLInputElement).value);
  console.log(`Playing as ${playerID} in ${matchID}.`);

  // construct and start game client and overlay debug panel if debug is set
  let server_url = document.getElementById("server_url")!.getAttribute("content") as string;
  gameClient = new GameClient(playerID, matchID, server_url, numberOfPlayers);

  // start the GUI
  world.viewHomeCenter(parseInt(playerID));
  main();
})

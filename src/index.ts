// 
// Main entry point.
//
// (85)
//
// $Id: index.ts 3794 2021-01-27 21:48:20Z zwo $

// import 'pepjs' -- needed for pointer interactions says the babylon doc?

import { Client, LobbyClient } from 'boardgame.io/client';
// import { Local } from 'boardgame.io/multiplayer'
import { SocketIO } from 'boardgame.io/multiplayer'
import { _ClientImpl } from 'boardgame.io/dist/types/src/client/client';

import { createEngine, createScene } from './functions'
import { makeMaterials } from './make_materials'
import { createWorld } from './world'
import { GameDefinition } from './game';
import { Player } from './types/GameState';
import { Shapes1, Shapes2 } from "./types/Materials";
import packageJson from '../package.json';

// Import stylesheets
// import './index.css';

// configuration
export const debug = false; // NOTE: press ctrl+shift+X for debugging webGL objects
export var playerID: string; // this player's ID
export const hideopp = true; // hide other players' pieces on hand (not for debugging)
export const ngeneration = 3; // how often each piece exists, normally 3
export var flatfield = true; // lie all pieces flat (including the ones in home)
export var shapeSet = Shapes1; // which shapes to use

// setup objects
const canvas: HTMLCanvasElement = document.getElementById('game_canvas') as HTMLCanvasElement;
const hud: HTMLDivElement = document.getElementById('hud') as HTMLDivElement;
const engine = createEngine(canvas);
const scene = createScene();
makeMaterials(scene);
const world = createWorld(scene, hud);
export var gameClient: GameClient;
var lobbyClient: LobbyClient;

function SetupScreen(div: HTMLDivElement) {
  return new Promise(resolve => {
    const createButton = (playerID: string) => {
      const button = document.createElement('button');
      button.textContent = 'Player ' + (parseInt(playerID) + 1);
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
  private doRename: boolean = true;

  constructor(
    public playerID: string = "0",
    public matchID: string = "default",
    public server_url: string,
    public numPlayers: number = 2,
    public myName: string,
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
          let s = "";
          for (let player of state.G.players as Player[]) {
            if (s != "")
              s += " -- ";
            s += `${player.name}: ${player.score}`;
          }
          document.title = `Scores: ${s} -- Bag: ${state.G.bag.length} pieces`;
        }
        if (state.ctx.gameover) {
          divElement.hidden = false;
          let e: string = "<h1>Game ended</h1>";
          for (let p of state.G.players) {
            e = e + `<p>Player ${p.name} has ${p.score} points.</p>`;
          }
          divElement.innerHTML = e;
        }
        world.setCurrPlayer(state.ctx.currentPlayer);
        world.unpack(state.G);

        if ((state.ctx.currentPlayer == this.playerID) && (this.doRename)) {
          this.doRename = false;
          console.log("Trying to rename to " + this.myName);
          this.moves.rename(this.playerID, this.myName);
        }

      }
    });

    this.moves = this.client.moves;
    this.client.start();

    console.log(`GameCient for ${numPlayers} created and started.`);
  }
}

document.title = `${packageJson.name} --- v${packageJson.version}`;
const divElement = document.getElementById('setup') as HTMLDivElement;
SetupScreen(divElement).then((playerID: any) => {

  divElement.hidden = true;
  let matchID = (document.getElementById('matchID') as HTMLInputElement).value;
  let numberOfPlayers = parseInt((document.getElementById('numberOfPlayers') as HTMLInputElement).value);
  if (numberOfPlayers < 1)
    numberOfPlayers = 1;
  if (numberOfPlayers > 4)
    // we could support more players in principle but would need to rearrange the location of where the pieces on the players' hands is drawn
    numberOfPlayers = 4;
  let myName = (document.getElementById('playerName') as HTMLInputElement).value;
  if ((myName == "Player") || (myName == ""))
    myName = "Player #" + (parseInt(playerID) + 1);
  else
    myName = myName.substr(0, 30);
  flatfield = (document.getElementById("optionFlatField") as HTMLInputElement).checked;
  if ((document.getElementById("optionShapes2") as HTMLInputElement).checked)
    shapeSet = Shapes2;
  console.log(`Playing as #${playerID} in ${matchID}.`);

  // construct and start game client and overlay debug panel if debug is set
  let server_url = document.getElementById("server_url")!.getAttribute("content") as string;
  gameClient = new GameClient(playerID, matchID, server_url, numberOfPlayers, myName);
  // lobbyClient = new LobbyClient({ server: server_url }); -- once we start using the lobby we need to store and use our credentials for all actions (moves etc.), cf. doesMatchRequireAuthentication in master.ts
  // lobbyClient.joinMatch(...);
  // lobbyClient.updatePlayer(...myName...);

  // start the GUI
  world.viewHomeCenter(parseInt(playerID));
  main();
})

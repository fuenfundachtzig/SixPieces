// 
// Main entry point.
//
// (85)
//
// $Id: index.ts 4040 2022-04-09 09:40:48Z zwo $

// import 'pepjs' -- needed for pointer interactions says the babylon doc?

import { Client } from 'boardgame.io/client';
// import { Local } from 'boardgame.io/multiplayer'
import { SocketIO } from 'boardgame.io/multiplayer'
import { _ClientImpl } from 'boardgame.io/dist/types/src/client/client';

import { createEngine, createScene, endAndPlace, endAndSwap } from './functions'
import { makeMaterials } from './make_materials'
import { createWorld } from './world'
import { GameDefinition } from './game';
import { PieceInGame, Player } from './types/GameState';
import { Shapes1, Shapes2 } from "./types/Materials";
import packageJson from '../package.json';
import { emptyGrid, Grid, GridWithBounds } from './types/Field';

// of course, emptyGrid() is not a function, as it is obviously a function, so I'll just paste the code here
export var thegrid = emptyGrid();

// Import stylesheets
// import './index.css';

// configuration
export const debug = false; // NOTE: press ctrl+shift+X for debugging webGL objects
export var playerID: string; // this player's ID
export const hideopp = true; // hide other players' pieces on hand (not for debugging)
export const ngeneration = 3; // how often each piece exists, normally 3
export var flatfield = true; // lie all pieces flat (including the ones in home)
export var chosenShapeSet = Shapes1; // which shapes to use

// initialize objects
const canvas: HTMLCanvasElement = document.getElementById('game_canvas') as HTMLCanvasElement;
const hud: HTMLDivElement = document.getElementById('hud') as HTMLDivElement;
const menu: HTMLDivElement = document.getElementById('ingamemenu') as HTMLDivElement;
const engine = createEngine(canvas);
const scene = createScene();
makeMaterials(scene);
const world = createWorld(scene, hud);
export var gameClient: GameClient;
// var lobbyClient: LobbyClient;


function SetupScreen(span: HTMLSpanElement) {
  // creates 4 buttons labelled "Player n"
  return new Promise(resolve => {
    const createButton = (playerID: string) => {
      const button = document.createElement('button');
      button.textContent = 'Player ' + (parseInt(playerID) + 1);
      button.onclick = () => resolve(playerID);
      span.append(button);
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
      multiplayer: SocketIO({ server: server_url, socketOpts: { path: '/SixPiecesServer/socket.io' } }), // TODO: better way to set path
      numPlayers,
      playerID,
      matchID,
      debug
    });

    this.client.subscribe((state) => {
      // receives update from server
      if (state) {
        if (state.G && state.G.players) {
          // display scores in title bar
          let s = "";
          for (let player of state.G.players as Player[]) {
            if (s !== "")
              s += " -- ";
            s += `${player.name}: ${player.score}`;
          }
          document.title = `Scores: ${s} -- Bag: ${state.G.bag.length} pieces`;
        }
        if (state.ctx.gameover) {
          // display "Game Over" message
          let e: string = "<h1>Game ended</h1>";
          for (let p of state.G.players) {
            e = e + `<p>Player ${p.name} has ${p.score} points.</p>`;
          }
          htmlGameOptions.innerHTML = e;
          htmlGameOptions.hidden = false;
        }
        world.setCurrPlayer(state.ctx.currentPlayer);
        world.unpack(state.G);

        if ((state.ctx.currentPlayer === this.playerID) && (this.doRename)) {
          this.doRename = false;
          console.log("Trying to rename to " + this.myName);
          this.moves.rename(this.playerID, this.myName);
        }

        // hide / show buttons depending on whether it's my turn or not
        menu.style.visibility = state.ctx.currentPlayer === this.playerID ? "visible" : "hidden";
      }
    });

    this.moves = this.client.moves;
    this.client.start();

    console.log(`GameClient for ${numPlayers} created and started.`);
  }
}

function getChecked(id: string, _default: boolean): boolean {
  // read value of HTML checkbox with default
  let element = document.getElementById(id) as HTMLInputElement;
  if (element)
    return (element as HTMLInputElement).checked;
  return _default;
}

document.title = `${packageJson.name} --- v${packageJson.version}`;
const htmlPlayerButtons = document.getElementById('playerbuttons') as HTMLSpanElement;
const htmlGameOptions   = document.getElementById('gameOptions') as HTMLDivElement;

// fill match ID from URL parameter (otherwise use current date)
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
if (urlParams.has('matchID'))
  (document.getElementById('matchID') as HTMLInputElement).value = urlParams.get('matchID') as string;
else if ((document.getElementById('matchID') as HTMLInputElement).value === "default")
  (document.getElementById('matchID') as HTMLInputElement).value = new Date().toISOString().slice(0,-14);

// call SetupScreen function and then initialize game based on return value
SetupScreen(htmlPlayerButtons).then((playerID: any) => {
  // hide setup screen
  htmlGameOptions.hidden = true;
  // implement setup options
  let matchID = (document.getElementById('matchID') as HTMLInputElement).value;
  let numberOfPlayers = parseInt((document.getElementById('numberOfPlayers') as HTMLInputElement).value);
  if (numberOfPlayers < 1)
    numberOfPlayers = 1;
  if (numberOfPlayers > 4)
    // we could support more players in principle but would need to rearrange the location of where the pieces on the players' hands is drawn
    numberOfPlayers = 4;
  let myName = (document.getElementById('playerName') as HTMLInputElement).value;
  if ((myName === "Player") || (myName === ""))
    myName = "Player #" + (parseInt(playerID) + 1);
  else
    myName = myName.substring(0, 30);
  flatfield = getChecked("optionFlatField", false);
  if (getChecked("optionShapes2", false))
    chosenShapeSet = Shapes2;
  console.log(`Playing as #${playerID} in ${matchID}.`);

  // create HUD if option selected
  if (getChecked("optionActiveHUD", false)) {
    // create 6 canvasses with IDs "canvashand0..5" to display the 6 pieces in a player's hand 
    for (let i = 0; i < 6; ++i) {
      const canvas = document.createElement('canvas');
      canvas.id = `canvashand${i}`;
      canvas.width = canvas.height = 256; // canvas width and height elements are important so that canvas has correct size for the drawing when scaling it with style.width and style.height
      hud.append(canvas);
    }
  }

  // set click handlers
  let img = document.getElementById("img_swap") as HTMLImageElement;
  img.onclick = function() { endAndSwap(); };
  img = document.getElementById("img_done") as HTMLImageElement;
  img.onclick = function() { endAndPlace() };

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

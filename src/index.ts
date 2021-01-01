// 
// Main entry point.
//
// (85)
//
// $Id: index.ts 3746 2021-01-01 20:01:29Z zwo $

// import 'pepjs'

import { Client } from 'boardgame.io/client';
// import { Local } from 'boardgame.io/multiplayer'
import { SocketIO } from 'boardgame.io/multiplayer'

// for headless mode:
// var engine = new BABYLON.NullEngine();
// var scene = new BABYLON.Scene(engine);

import { createEngine, createScene } from './functions'
import { makeMaterials } from './make_materials'
import { createWorld } from './world'
import { GameDefinition } from './game';
import { PieceInGame } from './types/GameState';
import { _ClientImpl } from 'boardgame.io/dist/types/src/client/client';
import { Game } from 'boardgame.io';

// Import stylesheets
// import './index.css';

// configuration
const numberOfPlayers = 2;
export const debug = false; // NOTE: press ctrl+shift+X for debugging webGL objects
export var playerID: string; // this player's ID
export const hideopp = true; // hide other players' pieces on hand (not for debugging)
export const limitBag = 18; // less pieces in bag (for debugging)
export const ngeneration = 3; // how often each piece exists, normally 3

// setup objects
const canvas: HTMLCanvasElement = document.getElementById('game_canvas') as HTMLCanvasElement
const engine = createEngine(canvas)
const scene = createScene()
makeMaterials(scene)
const world = createWorld(scene)

function SetupScreen(div: HTMLDivElement) {
  return new Promise(resolve => {
    const createButton = (playerID: string) => {
      const button = document.createElement('button');
      button.textContent = 'Player ' + playerID;
      button.onclick = () => resolve(playerID);
      div.append(button);
    };
    div.innerHTML = `<p>Play as</p>`;
    const playerIDs = ['0', '1'];
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

  constructor(public playerID: string
  ) {
    this.client = Client({
      game: GameDefinition,
      numPlayers: numberOfPlayers,
      // multiplayer: Local(),
      multiplayer: SocketIO({ server: 'localhost:8000' }),
      playerID,
      debug
    });

    this.client.subscribe((state) => {
      if (state) {
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
  }
}

export var gameClient: GameClient;

const divElement = document.getElementById('setup') as HTMLDivElement;
SetupScreen(divElement).then((playerID: any) => {

  divElement.hidden = true;
  playerID = playerID;
  console.log("Playing as " + playerID);

  // construct and start game client and overlay debug panel
  gameClient = new GameClient(playerID);

  // start the GUI
  main();
})
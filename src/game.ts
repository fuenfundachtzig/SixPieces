//
// Class to describe the game moves etc.
//
// (85)
//
// $Id: game.ts 3738 2020-12-29 22:09:00Z zwo $
//

import { Ctx } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { shuffleArray } from './functions';
import { fillHand } from './logic';
import { PieceMesh } from './PieceMesh';
import { createBag } from './types/Bag';
import { GameState, PieceOnGrid, Player } from './types/GameState';
import { world } from './world';


export const GameDefinition = {

  setup: (ctx: Ctx) => {
    // create contents of gamestate G
    let bag = createBag();
    let pog: PieceOnGrid[] = [];
    const players: Player[] = [];
    for (let p = 0; p < ctx.numPlayers; p++) {
      let player = {
        id: p.toString(),
        name: "Player " + (p + 1),
        score: 0,
        hand: []
      }
      fillHand(player, bag);
      players.push(player);
    }
    return {
      players,
      bag,
      pog
    };
  },

  moves: {
    swap: (G: GameState, ctx: Ctx) => {
      // first best idea I came up with to select pieces to swap: place everything not to swap on field
      console.log("Swap...")
      let res = world.swap();
      if (res === false) {
        console.log("...invalid")
        return INVALID_MOVE;
      }
      let toreturn = res as PieceMesh[];
      let player = G.players[parseInt(ctx.currentPlayer)];
      for (let p1 of toreturn) {
        G.bag.push(p1);
        let idx = player.hand.findIndex((p2) => p1.id === p2.id);
        for (let px of player.hand)
          console.log("vorher " + px.id)
        player.hand.splice(idx, 1);
        for (let px of player.hand)
          console.log("nacjhher " + px.id)
      }
      shuffleArray(G.bag);
      fillHand(player, G.bag);
      ctx.events!.endTurn!();
    },

    endTurn: (G: GameState, ctx: Ctx) => {
      // check if valid
      console.log("End turn...")
      let res = world.endTurn();
      if (res === false) {
        console.log("...invalid")
        return INVALID_MOVE;
      }
      let played = res as PieceMesh[];

      // world.endTurn returns the pieces that have been played -> need to update hand
      let player = G.players[parseInt(ctx.currentPlayer)];
      player.hand = player.hand.filter((p1) => played.find((p2) => p1.id === p2.id) === undefined);
      fillHand(player, G.bag);

      // scoring
      player.score += world.getScore();
      if (player.hand.length === 0) {
        console.log(`6 points for player ${player.id} for ending the game`);
        player.score += 6;
      }

      // update field
      for (let p of played)
        G.pog.push(p);
      console.log("...ended")
      ctx.events!.endTurn!();

      while (G.bag.length > 1)
        G.bag.pop();
    }
  },

  endIf: (G: GameState, ctx: Ctx) => {
    // check if game is over
    let ended = false;
    if (G.bag.length === 0) {
      for (let p of G.players) {
        if (p.hand.length === 0) {
          ended = true;
          // cannot add score here :/
          break;
        }
      }
    }
    if (ended) {
      // find max. points
      const maxscore = G.players.reduce((max, player) => (player.score > max ? player.score : max), 0);
      const winners = G.players.filter((p) => p.score === maxscore);
      return { winners };
    }
  },

  events: {
    endTurn: false
  }
  
};


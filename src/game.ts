//
// Class to describe the game moves etc.
//
// (85)
//
// $Id: game.ts 3742 2020-12-30 11:56:18Z zwo $
//

import { Ctx } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { limitBag } from '.';
import { shuffleArray } from './functions';
import { emptyGrid, fillHand, isValidMove } from './logic';
import { PieceMesh } from './PieceMesh';
import { createBag } from './types/Bag';
import { set } from './types/Field';
import { GameState, PieceInGame, Player } from './types/GameState';
import { world } from './world';


export const GameDefinition = {

  setup: (ctx: Ctx) => {
    // create contents of gamestate G
    let bag = createBag();
    let pog: PieceInGame[] = [];
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
    while (bag.length > limitBag)
      bag.pop();
    return {
      players,
      bag,
      pog
    };
  },

  moves: {
    swap: (G: GameState, ctx: Ctx, toreturn: PieceMesh[]) => {
      // to select pieces to swap: place everything to swap on field

      console.log("moves.swap...")
      if (!toreturn) {
        console.log("...illegal: got an empty toreturn array :/")
        return INVALID_MOVE;
      }

      if (toreturn.length == 0) {
        // cannot skip move
        console.log("...illegal: have to swap at least one piece (by placing it anywhere in the field).")
        return INVALID_MOVE;
      }
      
      let player = G.players[parseInt(ctx.currentPlayer)];
      for (let p1 of toreturn) {
        G.bag.push(p1);
        let idx = player.hand.findIndex((p2) => p1.id === p2.id);
        // for (let px of player.hand)
        //   console.log("before remove " + px.id)
        player.hand.splice(idx, 1);
        // for (let px of player.hand)
        //   console.log("after remove " + px.id)
      }
      shuffleArray(G.bag);
      fillHand(player, G.bag);
      ctx.events!.endTurn!();
    },

    place: (G: GameState, ctx: Ctx, played: PieceInGame[]) => {

      console.log("moves.place...")
      if (!played) {
        console.log("...illegal: got an empty played array :/")
        return INVALID_MOVE;
      }

      // reproduce grid for checking -- TODO: could also keep grid as part of G (in addition to pog)
      let grid = emptyGrid();
      for (let p of G.pog) {
        set(grid, p.gridxy, p);
      }
      for (let p of played) {
        set(grid, p.gridxy, p);
      }

      // check if valid
      let score = isValidMove(grid, played);
      if (score === false) {
        console.log("...invalid")
        return INVALID_MOVE;
      }

      // world.endTurn returns the pieces that have been played -> need to update hand
      let player = G.players[parseInt(ctx.currentPlayer)];
      player.hand = player.hand.filter((p1) => played.find((p2) => p1.id === p2.id) === undefined);
      fillHand(player, G.bag);
      console.log(`filled hand: ${JSON.stringify(G.players[parseInt(ctx.currentPlayer)].hand)})`);

      // scoring
      player.score += score as number;
      if (player.hand.length === 0) {
        console.log(`6 points for player ${player.id} for ending the game`);
        player.score += 6;
      }

      // update field
      for (let p of played) {
        p.fix = true;
        G.pog.push(p);
      }
      console.log("...ended")
      ctx.events!.endTurn!();

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


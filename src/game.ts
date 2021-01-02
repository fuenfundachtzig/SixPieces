//
// Class to describe the game moves etc.
//
// (85)
//
// $Id: game.ts 3754 2021-01-02 12:16:38Z zwo $
//

import { Ctx } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { shuffleArray } from './functions';
import { emptyGrid, fillHand, isValidMove } from './logic';
import { createBag } from './types/Bag';
import { set } from './types/Field';
import { GameState, Piece, PieceInGame, Player } from './types/GameState';


export const GameDefinition = {

  name: "SixPieces",
  minPlayers: 1,
  maxPlayers: 4,
  disableUndo: true,
  events: {
    endTurn: false
  },

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
    let removed: Piece[] = [];
    return {
      players,
      bag,
      pog,
      removed
    };
  },

  moves: {
    swap: (G: GameState, ctx: Ctx, toreturn: PieceInGame[]) => {
      // to select pieces to swap: place everything to swap on field

      console.log("moves.swap...")
      if (!toreturn) {
        console.log("...illegal: got no toreturn array :/")
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
        console.log("...illegal: got no  played array :/")
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
      // console.log(`...ended, hand of current player: ${JSON.stringify(G.players[parseInt(ctx.currentPlayer)])}`)
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
          console.log("Game ended!");
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

};


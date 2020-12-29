import { Ctx } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { shuffleArray } from './functions';
import { fillHand } from './logic';
import { PieceMesh } from './PieceMesh';
import { createBag } from './types/Bag';
import { GameState, PieceOnGrid, Player } from './types/GameState';
import { world } from './world';



const numberOfPlayers = 2;

export const GameLogic = {

  setup: (ctx: Ctx) => {
    // create contents of gamestate G
    let bag = createBag();
    let pog: PieceOnGrid[] = [];
    const players: Player[] = [];
    for (let p = 0; p < numberOfPlayers; p++) {
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
        let idx = player.hand.findIndex((p2) => p1.id == p2.id);
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
      console.log("End turn...")
      let res = world.endTurn();
      if (res === false) {
        console.log("...invalid")
        return INVALID_MOVE;
      }
      let played = res as PieceMesh[];
      // world.endTurn returns the pieces that have been played -> need to update hand
      let player = G.players[parseInt(ctx.currentPlayer)];
      player.hand = player.hand.filter((p1) => played.find((p2) => p1.id === p2.id ) === undefined);
      fillHand(player, G.bag);
      // update field
      for (let p of played)
        G.pog.push(p);
      console.log("...ended")
      ctx.events!.endTurn!();

      while (G.bag.length > 15)
        G.bag.pop();
    }
  },

  events: {
    endTurn: false
  }
};


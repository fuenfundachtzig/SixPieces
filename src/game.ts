import { fillHand } from './logic';
import { createBag } from './types/Bag';
import { PieceOnGrid, Player } from './types/GameState';

interface GameContext {

}

const numberOfPlayers = 2;

export const GameLogic = {

  setup: () => {
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
    swap: () => {

    },
    endTurn: () => {

    }
  }
};


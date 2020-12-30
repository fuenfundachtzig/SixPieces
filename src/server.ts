import { GameDefinition } from "./game";
import { Server } from 'boardgame.io/server';

/// well -- need to get rid of this dependency I guess
import { Client } from 'boardgame.io/client';
export const gameClient = Client({ 
    game: GameDefinition,
});
///

const server = Server({ games: [GameDefinition] });

server.run(8000);
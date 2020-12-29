

import { Client } from 'boardgame.io/client';
import { GameLogic } from './game';

// construct game client and overlay debug panel
export let gameClient = Client({ game: GameLogic });

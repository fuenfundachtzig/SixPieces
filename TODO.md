## TODO
* setup screen, add more options:
  * configure server address (server_url)
  * rename players (Player.name -- keep playerID numeric strings from 0..3)
  * (choose size of bag, limitBag)
  * add authentication for players
* keyboard shortcuts:
  * select pieces from hand by pressing 1..6
* GUI:
  * improve display of scores and number of pieces left in bag
  * display player names
  * add simpler shapes that are better visible (e.g. circle with hole or triangle to replace star)
  * improve camera positions (viewHomeCenter, viewCameraCenter)
  * add "?" on pieces on hand of opponents (instead of leaving blank) (drawShape for Shape.Hidden)
  * add levitating arrow pointing at current player (could replace current sphere)?
  * add effect for 6-in-a-row bonus
  * add sound
  * improve animations (cf. Animation in several places)
* features
  * remove / replace react
  * add license information
  * increase max. number of players
  * cleanup structure of code
  * make linter happy
  * add favicon
  * use [lobby API](https://github.com/boardgameio/boardgame.io/blob/master/docs/documentation/api/Lobby.md) for match making

### Technical remarks
* 2-D grid needed for isValidMove and isEmpty
* 1-D list of pieces needed for updating meshes
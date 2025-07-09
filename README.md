# BattleSquared
Simple but fun strategic number game. Move, merge, and capture number tiles to increase your score and try to beat your opponent in the 5 minute limit. Increase your skill level and place on the leaderboard as you play (and possibly win) more games!

![example](https://i.ibb.co/tPQhFZMX/image.png)
## Installation & Usage
Run `npm install` to install necessary dependencies

Run `npm run start` to start the server 

The game site can be found at `localhost:3000`
> Have fun!

## Technical Information
This was created using Socket.io, a easy-to-use library that allowed for instantaneous communication between the client and server, as well as Express, a Node.js web application framework. Everything else was plain HTML, CSS, or JS.

## How to Play
To bring a tile from your tile bank, click on a tile in your bank and click on an empty space within your starting area (the slightly tinted areas on both sides) to move that tile there. 

To move a tile, click on the tile you want to move and then click on another empty space right next to that tile.

To merge a tile, click on a tile and then click on another tile of the same value next to that tile.

To capture a tile, move your tiles so that your opponent's tile is directly between two of yours. 

Selected tiles will appear with a black border, and clicking on them again will deselect that tile.

Note: You can't capture tiles in the starting area. You can can only move tiles out of the starting area



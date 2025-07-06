const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
require('dotenv').config();

const server = http.createServer(app);
const io = new Server(server);
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./main.sqlite');
let games = {}
let waiting = null;
const genid = (length = 10) => {
  return Math.random().toString(36).substring(2, length + 2);
};

function ndat(dat) {
  return {
    red: dat.red.info,
    blue: dat.blue.info,
    board: dat.board,
    timestart: dat.timestart,
    id: dat.id,
    rbank: dat.rbank,
    bbank: dat.bbank
  }
}
io.on("connection", (socket) => {
  console.log("User Connected: " + socket.id);
  socket.emit("apikey", process.env.API_KEY)
  socket.on("message", (msg) => {
    console.log(msg);
  });
  // socket.on("apikey",() => {
  //   socket.emit("apikey", process.env.API_KEY)
  // })

  socket.on("login", (uid) => {
    db.get("SELECT * FROM users WHERE uid = ?", [uid], (err, row) => {
      if (err) {
        console.error(err);
      }
      if (row) {
        console.log(row.username + " has logged in (id: " + row.uid + ")")
        socket.emit("user_info", row)
      } else {
        socket.emit("set_user")
      }
    });
  });
  socket.on("disconnect", (socket) => {
    console.log("User Disconnected: " + socket.id);
    if (waiting.socket == socket) {
      waiting = null
    }
    // later implement actively playing users leaving

  });

  socket.on("set_user", (user, id) => {
    db.run("INSERT INTO users (uid, username, elo) VALUES (?, ?, ?)", [id, user, 1000], (err) => {
      if (err) {
        console.error(err);
      }
      console.log(user + " has logged in (id: " + id + ")")
      socket.emit("user_info", { uid: id, username: user })
    });
  })
  socket.on("play", (info) => {
    if (waiting == null) {
      waiting = { info: info, socket: socket }
      socket.emit("waiting")
      console.log("Someone is waiting...")
    } else if (waiting != null && waiting.socket != socket) {
      const id = genid();
      console.log(info)
      console.log(waiting.info);
      console.log("Game started between " + waiting.info.username + " and " + info.username + " (id: " + id + ")");
      games[id] = {
        red: waiting,
        blue: { info: info, socket: socket },
        board: [[0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0], [2, 0, 0, 0, 0, 0, 0, -2], [0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0]],
        timestart: Date.now(),
        id: id,
        rbank: [],
        bbank: [],
      }

      waiting.socket.emit("game", ndat(games[id]))
      socket.emit("game", ndat(games[id]))
      waiting = null
      console.log(games)

    }
  })
  socket.on("end_game", (id) => {
    try {
      let rscore = 0;
      let bscore = 0;
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 8; j++) {
          if (games[id].board[i][j] < 0) {
            rscore += Math.abs(games[id].board[i][j])
          } else if (games[id].board[i][j] > 0) {
            bscore += games[id].board[i][j]
          }
        }
      }
      if (rscore > bscore) {
        // add 8 elo to red
        db.run("UPDATE users SET elo = ? WHERE uid = ?", [games[id].red.info.elo + 8, games[id].red.info.uid])
        db.run("UPDATE users SET elo = ? WHERE uid = ?", [games[id].blue.info.elo - 8, games[id].blue.info.uid])
      } else if (rscore < bscore) {
        // add 8 elo to blue
        db.run("UPDATE users SET elo = ? WHERE uid = ?", [games[id].red.info.elo - 8, games[id].red.info.uid])
        db.run("UPDATE users SET elo = ? WHERE uid = ?", [games[id].blue.info.elo + 8, games[id].blue.info.uid])
      } 
      games[id].red.socket.emit("end_game_results", ndat(games[id]))
      games[id].blue.socket.emit("end_game_results", ndat(games[id]))
      games[id] = null;
    } catch (e) {
      console.log(e)
    }

  })
  socket.on("move", (id, selected, coord) => {
    if (selected[0] == "r") {
      games[id].board[coord[0]][coord[1]] = -1 * games[id].rbank[Number(selected[1])]
      games[id].rbank.splice(Number(selected[1]), 1)
    } else if (selected[0] == "b") {
      games[id].board[coord[0]][coord[1]] = games[id].bbank[Number(selected[1])]
      games[id].bbank.splice(Number(selected[1]), 1)
    } else {
      games[id].board[coord[0]][coord[1]] = games[id].board[selected[0]][selected[1]]
      games[id].board[selected[0]][selected[1]] = 0
    }
    //checking capturing - piece sandwiched between other pieces
    console.log(games[id].board)
    for (let i = 0; i < 5; i++) {
      for (let j = 1; j < 6; j++) {
        if (i > 0 && i < 5) {

          if ((games[id].board[i - 1][j] > 0 && games[id].board[i][j] < 0 && games[id].board[i + 1][j] > 0) || (games[id].board[i - 1][j] < 0 && games[id].board[i][j] > 0 && games[id].board[i + 1][j] < 0)) {
            console.log(games[id].board[i][j])
            games[id].board[i][j] *= -1
            console.log('gehaiu')
            console.log(games[id].board[i][j])
          }
        }
        if ((games[id].board[i][j - 1] > 0 && games[id].board[i][j] < 0 && games[id].board[i][j + 1] > 0) || (games[id].board[i][j - 1] < 0 && games[id].board[i][j] > 0 && games[id].board[i][j + 1] < 0)) {
          console.log('ea')
          games[id].board[i][j] *= -1
        }
      }
    }
    console.log(games[id].board)
    try {
      games[id].red.socket.emit("update_game", ndat(games[id]))
      games[id].blue.socket.emit("update_game", ndat(games[id]))
    } catch (e) {
      console.log(e)
    }



  })
  socket.on("leaderboard",() => {
    //sort by highest elo
    db.all("SELECT * FROM users ORDER BY elo DESC LIMIT 10", [], (err, rows) => {
      if (err) {
        console.error(err);
        return;
      }
      socket.emit("leaderboard", rows);
    });
  })


  socket.on("combine", (id, selected, coord) => {
    if (games[id].board[selected[0]][selected[1]] == games[id].board[coord[0]][coord[1]]) {
      games[id].board[coord[0]][coord[1]] *= 2
      games[id].board[selected[0]][selected[1]] = 0
    }
    try {
      games[id].red.socket.emit("update_game", ndat(games[id]))
      games[id].blue.socket.emit("update_game", ndat(games[id]))
    } catch (e) {
      console.log(e)
    }

  })
  socket.on("add_bank", (gid, uid, val) => {
    console.log(games)
    if (games[gid].red.info.uid == uid) {
      games[gid].rbank.push(val)
    } else {
      games[gid].bbank.push(val)
    }
    try {
      games[gid].red.socket.emit("update_game", ndat(games[gid]))
      games[gid].blue.socket.emit("update_game", ndat(games[gid]))
    } catch (e) {
      console.log(e)
    }
  })

});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/static/index.html');
});
app.use(express.static(path.join(__dirname, 'static')));
server.listen(3000, () => {
  console.log('listening on *:3000');
});

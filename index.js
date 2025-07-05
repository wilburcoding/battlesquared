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
    red:dat.red.info,
    blue:dat.blue.info,
    board:dat.board,
    timestart:dat.timestart
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
    if (waiting == socket) {
      waiting = null
    }
    // later implement actively playing users leaving

  });

  socket.on("set_user", (user, id) => {
    db.run("INSERT INTO users (uid, username) VALUES (?, ?)", [id, user], (err) => {
      if (err) {
        console.error(err);
      }
      console.log(user + " has logged in (id: " + id + ")")
      socket.emit("user_info", { uid: id, username: user })
    });
  })
  socket.on("play", (info) => {
    if (waiting == null) {
      waiting = {info: info, socket: socket}
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
        timestart: Date.now()
      }
  
      waiting.socket.emit("game", ndat(games[id]))
      socket.emit("game", ndat(games[id]))
      waiting = null
      console.log(games)
      
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
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
io.on("connection", (socket) => {
  console.log("User Connected: "+ socket.id);
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
  });

  socket.on("set_user", (user, id) => {
    db.run("INSERT INTO users (uid, username) VALUES (?, ?)", [id, user], (err) => {
      if (err) {
        console.error(err);
      }
      console.log(row.username + " has logged in (id: " + row.uid + ")")
      socket.emit("user_info", {uid: id, username: user})
    });
  })
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/static/index.html');
});

app.use(express.static(path.join(__dirname, 'static')));

server.listen(3000, () => {
  console.log('listening on *:3000');
});
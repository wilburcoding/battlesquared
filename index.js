const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {
  console.log("User Connected: "+ socket.id);
  socket.on("message", (msg) => {
    console.log(msg);
  });
  socket.on("disconnect", (socket) => {
    console.log("User Disconnected: " + socket.id);
  });
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/static/index.html');
});

app.use(express.static(path.join(__dirname, 'static')));


server.listen(3000, () => {
  console.log('listening on *:3000');
});
const Connection = require('./Connection');
const _ = require('underscore');

module.exports = class Server {
  constructor(app, port) {
    this.app = app;
    this.port = port;
    _.bindAll(this, 'handleConnection');
    this.connections = {};
    this.roomReferees = {};
  }

  start() {
    this.setupListeners();
    this.listen();
  }

  setupListeners() {
    this.app.get('/game', (req, res) => res.end());
    this.app.ws('/game', this.handleConnection);
  }

  listen() {
    this.app.listen(this.port, () => {
      console.log('Started on port %s.', this.port)
    });
  }

  handleConnection(ws, req) {
    const conn = new Connection(this, ws, req);
    this.connections[conn.id] = conn;
    conn.start();
  }

  left(conn) {
    delete this.connections[conn.id];
  }

  findGameRoom(conn, msg) {
    let referee = this.roomReferees[msg.room];
    if (!referee) {
      console.log('no such room "%s"', msg.room);
      const Referee = require(`./${msg.gameType}Referee`);
      referee = new Referee(msg.room);
      this.roomReferees[msg.room] = referee;
    }
    referee.joinGame(conn, msg);
    return referee;
  }
};

var chess = new Chess()

var config = {
  position: 'start',
  draggable: true,
  legalMoveOnly: true
}


var board1 = ChessBoard('board1', config);
while (!chess.isGameOver()) {
  const moves = chess.moves()
  const move = moves[Math.floor(Math.random() * moves.length)]
  chess.move(move)
  board1.makeMove(move) 
}
document.getElementById("Chess").innerHTML = chess.pgn()


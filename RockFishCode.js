

var config = {
  position: 'start',
  draggable: true,
  legalMoveOnly: true
}


var board1 = ChessBoard('board1', config);
while (!Chess.isGameOver()) {
  const moves = Chess.moves()
  const move = moves[Math.floor(Math.random() * moves.length)]
  Chess.move(move)
  board1.makeMove(move) 
}
document.getElementById("Chess").innerHTML = chess.pgn()


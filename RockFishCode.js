var chess = new Chess()
var board = null
var $board = $('#Board1')
var config = {
  position: 'start',
  draggable: true,
  legalMoveOnly: true
}
board = ChessBoard('Board1', config);
while (!chess.game_over()) {
  const moves = chess.moves()
  const move = moves[Math.floor(Math.random() * moves.length)]
  chess.move(move)
  board1.makeMove(move) 
}
document.getElementById("Chess").innerHTML = chess.pgn()
//saa.sdas() 

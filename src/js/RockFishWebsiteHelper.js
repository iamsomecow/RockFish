var chess = new Chess()
var board = null
var $board = $('#Board1')
var config = {
  position: 'start',
  draggable: true,
  dropOffBoard: 'snapback',
  onDrop: onDrop
}
board = ChessBoard('Board1', config);
function onDrop(source, target, piece, newPos, oldPos, orientation) {
  var move = {
    from: source,
    to: target,
    promotion: 'q' // promote to a queen for example
  };

  // Attempt to make the move in chess.js
  var result = chess.move(move);

  // If the move is illegal, snap the piece back to its original square
  if (result === null) return 'snapback';

  // Update the board position in chessboard.js
  document.getElementById("Chess").innerHTML = chess.pgn()
  if (chess.game_over()) {
    alert('Game Over');
  } else {
    var [rockFishMove, rockFishMoveSum] = minimax(chess.ugly_moves({verbose: true}), chess, 3, 0)
    var move = chess.ugly_move(rockFishMove);
    console.log(chess.fen());
    board.position(chess.fen());
    document.getElementById("Chess").innerHTML = chess.pgn();
  }
}
function ResetButtonClick()
{
  chess.reset()
  board.start()
  document.getElementById("Chess").innerHTML = chess.pgn()
}
function UndoButtonClick()
{
  chess.undo()
  board.position(chess.fen());
  document.getElementById("Chess").innerHTML = chess.pgn()
}
function PgnButtonClick()
{
  chess.load_pgn(prompt('Load Pgn'));
  board.position(chess.fen());
}
function FenButtonClick()
{
  chess.load(prompt('Load Pgn'));
  board.position(chess.fen());
}


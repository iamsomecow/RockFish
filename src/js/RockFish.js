// heuristics for move ordering (makes alpha-beta pruning faster)
let historyTable = {}; 
let killerMoves = Array(100).fill(null).map(() => []); 
// piece weights - for evaluating capures   
const weights = { p: 100, n: 280, b: 320, r: 479, q: 929, k: 60000, k_e: 60000 };
// pisce square tables - makes it make ok openings and things
const pst_w = {
  p: [
    [100, 100, 100, 100, 105, 100, 100, 100],
    [78, 83, 86, 73, 102, 82, 85, 90],
    [7, 29, 21, 44, 40, 31, 44, 7],
    [-17, 16, -2, 15, 14, 0, 15, -13],
    [-26, 3, 10, 9, 6, 1, 0, -23],
    [-22, 9, 5, -11, -10, -2, 3, -19],
    [-31, 8, -7, -37, -36, -14, 3, -31],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  n: [
    [-66, -53, -75, -75, -10, -55, -58, -70],
    [-3, -6, 100, -36, 4, 62, -4, -14],
    [10, 67, 1, 74, 73, 27, 62, -2],
    [24, 24, 45, 37, 33, 41, 25, 17],
    [-1, 5, 31, 21, 22, 35, 2, 0],
    [-18, 10, 13, 22, 18, 15, 11, -14],
    [-23, -15, 2, 0, 2, 0, -23, -20],
    [-74, -23, -26, -24, -19, -35, -22, -69],
  ],
  b: [
    [-59, -78, -82, -76, -23, -107, -37, -50],
    [-11, 20, 35, -42, -39, 31, 2, -22],
    [-9, 39, -32, 41, 52, -10, 28, -14],
    [25, 17, 20, 34, 26, 25, 15, 10],
    [13, 10, 17, 23, 17, 16, 0, 7],
    [14, 25, 24, 15, 8, 25, 20, 15],
    [19, 20, 11, 6, 7, 6, 20, 16],
    [-7, 2, -15, -12, -14, -15, -10, -10],
  ],
  r: [
    [35, 29, 33, 4, 37, 33, 56, 50],
    [55, 29, 56, 67, 55, 62, 34, 60],
    [19, 35, 28, 33, 45, 27, 25, 15],
    [0, 5, 16, 13, 18, -4, -9, -6],
    [-28, -35, -16, -21, -13, -29, -46, -30],
    [-42, -28, -42, -25, -25, -35, -26, -46],
    [-53, -38, -31, -26, -29, -43, -44, -53],
    [-30, -24, -18, 5, -2, -18, -31, -32],
  ],
  q: [
    [6, 1, -8, -104, 69, 24, 88, 26],
    [14, 32, 60, -10, 20, 76, 57, 24],
    [-2, 43, 32, 60, 72, 63, 43, 2],
    [1, -16, 22, 17, 25, 20, -13, -6],
    [-14, -15, -2, -5, -1, -10, -20, -22],
    [-30, -6, -13, -11, -16, -11, -16, -27],
    [-36, -18, 0, -19, -15, -15, -21, -38],
    [-39, -30, -31, -13, -31, -36, -34, -42],
  ],
  k: [
    [4, 54, 47, -99, -99, 60, 83, -62],
    [-32, 10, 55, 56, 56, 55, 10, 3],
    [-62, 12, -57, 44, -67, 28, 37, -31],
    [-55, 50, 11, -4, -19, 13, 0, -49],
    [-55, -43, -52, -28, -51, -47, -8, -50],
    [-47, -42, -43, -79, -64, -32, -29, -32],
    [-4, 3, -14, -50, -57, -18, 13, 4],
    [17, 30, -3, -14, 6, -1, 40, 18],
  ],

  // Endgame King Table - not used
  k_e: [
    [-50, -40, -30, -20, -20, -30, -40, -50],
    [-30, -20, -10,  0,   0,  -10, -20, -30],
    [-30, -10,  20,  30, 30, 20, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -30, 0, 0, 0, 0, -30, -30],
    [-50, -30, -30, -30, -30, -30, -30, -50],
  ],
};
// black piece square tables are reflections of wight this gets the reflections 
const pst_b = {
  p: pst_w['p'].slice().reverse(),
  n: pst_w['n'].slice().reverse(),
  b: pst_w['b'].slice().reverse(),
  r: pst_w['r'].slice().reverse(),
  q: pst_w['q'].slice().reverse(),
  k: pst_w['k'].slice().reverse(),
  k_e: pst_w['k_e'].slice().reverse(),
};
// container for piece square tables
const pstSelf = { w: pst_w, b: pst_b };
// minimax 
// minimax works by returning the best move from the previous layer then if it is the opponents turn choses the worst best move the bot can make if it's the bots move it will the best worst move the opponent can make.
// alpha beta improves the speed of minimax by pruning nodes.
// an optimized alpha-beta can decrease the number of nodes searched by 90 percent.
// moves = current moves,
// game = chess.js game,
// sum = previus move sum, 
// alpha = alpha for alpha beta pruning,
// beta = beta for alpha beta pruning,
// isMaxer = bool to check if it is the maximizers turn - in this situtation the maximiser is the bot.
function minimax(moves, game, depth, sum, alpha = -Infinity, beta = Infinity, isMaxer = true) {
  if (depth === 0 || moves.length === 0) {
    // gets called when node is terminal - out of serch depth or no children
    return [null, sum]
  } else {
    // the best move from this iliteration
    let bestMove;
    // sets bestChildMoveSum to Infinity or - Infinity depending on isMaxer
    if (isMaxer) {
      var bestChildMoveSum = -Infinity; 
    } else {
      var bestChildMoveSum = Infinity; 
    }
    // move sorting to make alpha beta more effecent 
    let orderedMoves = moves.sort((a, b) => {
      // gets aMove and bMove - 2 differnt moves from the moves array of moves
      // the game.undo() need to be there because game.ugly_move() 
      // makes a move and a move will make b move impossible as it changes the turn witch causes an error
      var aMove = game.ugly_move(a);
      game.undo();
      var bMove = game.ugly_move(b);
      game.undo();
      // heuristics 
      if (aMove.flags.includes('c') && bMove.flags.includes('c')) {
        // both capture heuristic
        return (weights[aMove.captured] - weights[aMove.piece]) - (weights[bMove.captured] - weights[bMove.piece]);
      } else if (aMove.flags.includes('c')) {
        // capure move go higher then non capures
        return -1;
      } else if (bMove.flags.includes('c')) {
        return 1;
      } else {
        // killer move heuristic - puts moves that caused alpha beta most before first
        if (killerMoves[depth].includes(aMove.san)) return -1;
        if (killerMoves[depth].includes(bMove.san)) return 1;        
        // history heuristic - puts other moves that caused alpha beta cuttoff higher
        let historyA = historyTable[aMove.san] || 0;
        let historyB = historyTable[bMove.san] || 0;
        return historyB - historyA;
      }
    })
    // loop though ordered moves and set bestMove to the best move
    for (let i = 0; i < orderedMoves.length; i++){
      // changes move format and makes move
      let prittyMove = game.ugly_move(orderedMoves[i]);
      // evaluates move
      var moveSum = Efunk(prittyMove, game, sum, isMaxer);
      // gets all of the moves possible after making the move - also called child moves.
      const newMoves = game.ugly_moves({verbose: true});
      // calls minimax to get the values of child moves
      var [childBestMove, childBestMoveSum] = minimax(
        newMoves,
        game,
        // incroments depth
        depth - 1,
        moveSum,
        alpha,
        beta,
        // changes isMaxer to be the opesert of it self
        !isMaxer, 
      );
      game.undo();
      // if it is maxermisers turn set alpha to the higher of alpha and bestchildmovesum and
      // the value of the best child moves & if the childs best move sum is greater then the 
      // siblings of the current moves best child move sum set best childmove sum to the current 
      // moves best childs sum and set bestmove to the current move 
      //
      // if it is not maxermisers turn set beta to the lower of alpha and bestchildmovesum
      // the value of the best child moves & if the childs best move sum is lower then the 
      // siblings of the current moves best child move sum set best childmove sum to the current 
      // moves best childs sum and set bestmove to the current move
      if  (isMaxer) {
        if (childBestMoveSum > bestChildMoveSum) {
          bestMove = orderedMoves[i];
          bestChildMoveSum = childBestMoveSum;
        }   
        alpha = Math.max(alpha, childBestMoveSum);
      } else {
        if (childBestMoveSum < bestChildMoveSum) {
          bestMove = orderedMoves[i];
          bestChildMoveSum = childBestMoveSum;
        }   
        beta = Math.min(beta, bestChildMoveSum);
      }
      // alpha beta cuttof point if alpha is greater 
      // or equal to beta stop evaluating moves and it dose this becasue of the break
      if (alpha >= beta) {
        updateHistory(prittyMove, depth);
        updateKillerMoves(prittyMove, depth);
        break; 
      }
    }
    // return best move and bestchildmovesum
    return [bestMove,  bestChildMoveSum]
  }
}
// evaluation funuction
// move = move to evaluate
// game = the game without the move made - for checkmate detection
// prevSum = the sum of the previus move
// isMaxer = makes it return negative if it is oponents move positive if it is bots move
function Efunk(move, game, prevSum, isMaxer) {
  // make move
  game.move(move);  
  // checkmate eval
  if (game.in_checkmate()) {
    if (isMaxer) {
      return Infinity;
    } else {
      return -Infinity;
    }
  } else {
  // gets move start point to different format so it can query the piece square tables
  const from = [
    8 - parseInt(move.from[1]),
    move.from.charCodeAt(0) - 'a'.charCodeAt(0),
  ];
  // gets move destination to different format so it can query the piece square tables
  const to = [
    8 - parseInt(move.to[1]),
    move.to.charCodeAt(0) - 'a'.charCodeAt(0),
  ];

  if (isMaxer) {
    // if move is a capure add capured piece value to move sum
    if ('captured' in move) {
      prevSum += weights[move.captured]; 
    }
    // subtract the start point becasue the piece has moved and add the destination
    prevSum -= pstSelf[move.color][move.piece][from[0]][from[1]];
    prevSum += pstSelf[move.color][move.piece][to[0]][to[1]]; 
  } else {
    // dose the same thing but for oponents moves
    if ('captured' in move) {
      prevSum -= weights[move.captured]; 
    }
    prevSum += pstSelf[move.color][move.piece][from[0]][from[1]];
    prevSum -= pstSelf[move.color][move.piece][to[0]][to[1]]; 
  }
  // returns the previus move sum plus the current move sum
  return prevSum;
  }
}
function updateHistory(move, depth) {
  if (!historyTable[move.san]) historyTable[move.san] = 0;
  historyTable[move.san] += 2 ** depth; // Increment history value based on depth
}

function updateKillerMoves(move, depth) {
  if (!killerMoves[depth].includes(move.san)) {
      killerMoves[depth].push(move.san);
      if (killerMoves[depth].length > 2) killerMoves[depth].shift(); // Keep only top 2 killer moves
  }
}
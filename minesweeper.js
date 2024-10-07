console.log("Game is starting...");

let layer;       // main layer for the game grid
let uiLayer;     // layer for displaying message

// initialize the PixelJS Engine
const game = new PixelJS.Engine();

// initialize the game in a container with specific width and height
game.init({
    container: 'gameContainer',   // the container from index.html
    width: 400,               
    height: 400,          
    maxDeltaTime: 33,             // limit the delta time for smoother performance
});

// initialize layers in the game engine
layer = game.createLayer('main');
uiLayer = game.createLayer('ui'); // UI layer for messages
uiLayer.zIndex = 1000;            // ensure the UI layer is on top

// define matrix and tiles
const cols = 10; 
const rows = 10;  
const tileSize = 40;  // size of each tile (width and height in pixels)

let grid = [];
let mineCount = 20;    // number of mines
let gameOver = false;  // track if the game is over

// initialize the grid with empty cells
for (let y = 0; y < rows; y++) {
    let row = [];
    for (let x = 0; x < cols; x++) {
        row.push({
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            neighboringMines: 0
        });
    }
    grid.push(row);
}
console.log("Grid initialized...");
console.log("number of mines", mineCount);
console.log("total grid", cols*rows);

let placedMines = 0;
while (placedMines < mineCount) {
    let x = Math.floor(Math.random() * cols);
    let y = Math.floor(Math.random() * rows);

    // only place a mine if the cell is not already a mine
    if (!grid[y][x].isMine) {
        grid[y][x].isMine = true;
        placedMines++;
    }
}

console.log("Mines placed...");

// count neighboring mines around a tile
function countMinesAround(x, y) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            let newX = x + i;
            let newY = y + j;
            if (newX >= 0 && newX < cols && newY >= 0 && newY < rows) {
                if (grid[newY][newX].isMine) {
                    count++;
                }
            }
        }
    }
    return count;
}

// calculate neighboring mines for each tile
function calculateNeighboringMines() {
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (!grid[y][x].isMine) {
                grid[y][x].neighboringMines = countMinesAround(x, y);
            }
        }
    }
}
calculateNeighboringMines(); 

// decide when to display success
let success = false
game.run(function () {
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            let tile = grid[y][x];
            let color = tile.isRevealed ? '#dddddd' : '#999999';
            
            // draw the tile rectangle with grid lines
            layer.drawRectangle(x * tileSize, y * tileSize, tileSize, tileSize, { 
                fill: color, 
                stroke: '#000000'
            });

            
            // if flagged
            if (tile.isFlagged) {
                layer.drawText('F', x * tileSize + tileSize / 3, y * tileSize + tileSize / 1.5, '20px Arial', '#FF0000', 'center');
            }

            // if revealed and not a mine, count the number of neighboring mines
            if (tile.isRevealed && !tile.isMine) {
                if (tile.neighboringMines > 0) {
                    layer.drawText(
                        tile.neighboringMines.toString(),
                        x * tileSize + tileSize / 3, 
                        y * tileSize + tileSize / 1.5,
                        '16px Arial', '#000000', 'center'
                    );
                }
            } else if (tile.isRevealed && tile.isMine) {
                // fail
                layer.drawRectangle(x * tileSize + 10, y * tileSize + 10, 20, 20, { fill: '#ff0000' });
                displayGameOverMessage()
            }
            if (success) {
                displaySuccessMessage()
            }
        }
    }
});

// left-click to reveal
// right-click to flag
game.on('mousedown', function (point, button) {
    if (gameOver) {
        return;
    }
    let x = Math.floor(point.x / tileSize);
    let y = Math.floor(point.y / tileSize);
    
    if (button === PixelJS.Buttons.Left) {
        revealTile(x, y);  // left-click reveals the tile
    } else if (button === PixelJS.Buttons.Right) {
        toggleFlag(x, y);  // right-click to flag/unflag
    }

    if (!gameOver) {
        checkWin();  // check if done after each move
    }
});

// change flag status
function toggleFlag(x, y) {
    if (grid[y][x].isRevealed) return;  // can't flag a revealed tile

    grid[y][x].isFlagged = !grid[y][x].isFlagged;  // toggle flag state
}

// reveal the tile
function revealTile(x, y) {
    if (gameOver) {
        return;  // prevent actions if the game is over
    }

    if (x >= 0 && x < cols && y >= 0 && y < rows && !grid[y][x].isRevealed && !grid[y][x].isFlagged) {
        grid[y][x].isRevealed = true;

        if (grid[y][x].isMine) {
            console.log('Game over! You hit a mine.');
            gameOver = true;  
            displayGameOverMessage();  // display fail
        } else if (grid[y][x].neighboringMines === 0) {
            // reveal neighboring tiles if there are no adjacent mines
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    revealTile(x + i, y + j);
                }
            }
        }
    }
}

// show fail message
function displayGameOverMessage() {
    gameOver = true;  
    uiLayer.redraw = true;  // ensure the UI layer is redrawn
    uiLayer.drawText('Game Over!', 150, 200, '40px Arial', '#FF0000', 'center');
    return;
}


// check if win
function checkWin() {
    let revealedCount = 0;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (grid[y][x].isRevealed && !grid[y][x].isMine) {
                revealedCount++;
            }
        }
    }
    if (revealedCount === (cols * rows - mineCount)) {
        console.log("mineCount is", mineCount)
        console.log("revealedCount is", revealedCount);
        console.log('You Win!');
        success = true;
        displaySuccessMessage(); 
    }
}

// show success message
function displaySuccessMessage() {
    gameOver = true;
    uiLayer.redraw = true;  // ensure the UI layer is redrawn
    uiLayer.drawText('You Win!', 150, 200, '40px Arial', '#00FF00', 'center');
    return;
}

export let MineSweeperController = function (model) {
    
    let checkForFinish = function () {
        if (!model.gameInProgress()) {
            return;
        };
    
        let game_finished = true;
        model.field.forAllCells(c => {
            if (c.has_bomb && !c.isMarked()) {
                game_finished = false;
            } else if (!c.has_bomb && !c.isRevealed()) {
                game_finished = false;
            }
        });
        
        if (game_finished) {
            model.endGame();
            alert('You win');
        }
    }
    
    this.reveal = (x,y) => {
        // Do nothing if the game is over.
        if (model.gameFinished()) {
            return;
        }

        // Start the game in case it wasn't already
        model.startGame();

        let cell = model.getCell(x,y);

        if (cell.isRevealed()) {
            // Already revealed. Do nothing and return.
            return;
        }

        cell.reveal();

        // If this is a bomb, game is over. 
        if (cell.has_bomb) {
            model.field.forAllCells(c => {
                if (c.has_bomb) {
                    c.reveal();
                }
            });
            model.endGame();
            alert('You lose!');
            return;
        }

        // If revealing a cell with no bombs in neighborhood, reveal the neighborhood.
        if (cell.neighbor_bomb_count == 0) {
            cell.neighbors.forEach(n => this.reveal(n.x, n.y));
        };

        checkForFinish();
    }

    this.toggleMark = (x,y) => {
        // Do nothing if the game is over.
        if (model.gameFinished()) {
            return;
        }

        // Start the game in case it wasn't already
        model.startGame();

        let cell = model.getCell(x,y);

        cell.toggleMark();

        checkForFinish();
    }

    this.clearNeighborhood = (x,y) => {
        // Do nothing if the game is over.
        if (model.gameFinished()) {
            return;
        }

        // Start the game in case it wasn't already
        model.startGame();

        let cell = model.getCell(x,y);

        if (!cell.isRevealed() || cell.has_bomb) {
            // Can only clear neighborhood of revealed cells without bombs
            return;
        }

        let mark_count = cell.neighbors.reduce((mc, n) => mc += (n.isMarked() ? 1 : 0), 0);
        if (mark_count == cell.neighbor_bomb_count) {
            cell.neighbors.forEach(n => {
                if (n.isUnmarked()) {
                    // Want to use the controller's reveal rather than cell model reveal
                    // because want to make sure controller's reveal logic is applied.
                    this.reveal(n.x, n.y);
                }
            });
        }

        checkForFinish();
    }

    this.reset = () => {
        model.reset();
    }
}
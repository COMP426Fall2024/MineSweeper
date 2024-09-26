export let MineSweeperModel = function (width, height, bomb_count) {
    // Should check that bomb_count <= width * height but will assume that.

    this.width = width;
    this.height = height;
    this.bomb_count = bomb_count;
    this.field = new MineSweeperField(this.width, this.height, this);
    this.event_target = new EventTarget();
    this.reset();
}

MineSweeperModel.prototype.reset = function () {
    this.start_time = null;
    this.end_time = null;
    this.field.forAllCells(c => {
        c.has_bomb = false;
        c.state = MineSweeperCell.states.UNMARKED;
    });
    this.num_marked = 0;

    let all_cells = [];
    this.field.forAllCells(c => {
            all_cells.push([c, Math.random()]);
    });

    all_cells.sort((a,b) => a[1]-b[1])
         .slice(0,this.bomb_count)
         .forEach(c => c[0].has_bomb = true);

    // Force a change event on all cells to update any observers of them
    this.field.forAllCells(c => c.event_target.dispatchEvent(new Event('change')));
    this.event_target.dispatchEvent(new Event('reset'));
}

MineSweeperModel.prototype.addEventListener = function () {return this.event_target.addEventListener(...arguments)};
MineSweeperModel.prototype.removeEventListener = function () {return this.event_target.removeEventListener(...arguments)};

MineSweeperModel.prototype.gameStarted = function () {
    return this.start_time != null;
}

MineSweeperModel.prototype.gameFinished = function () {
    return this.end_time != null;
}

MineSweeperModel.prototype.gameInProgress = function () {
    return this.start_time != null && this.end_time == null;
}

MineSweeperModel.prototype.startGame = function () {
    if (!this.gameStarted()) {
        this.start_time = new Date();
        this.event_target.dispatchEvent(new Event("start"));
    }
}

MineSweeperModel.prototype.endGame = function () {
    if (!this.gameFinished()) {
        this.end_time = new Date();
        this.event_target.dispatchEvent(new Event("end"));
    }
}

MineSweeperModel.prototype.getElapsedTime = function () {
    if (this.gameInProgress()) {
        let now = new Date();
        return Math.floor((now.getTime() - this.start_time.getTime()) / 1000);
    } else if (this.gameFinished()) {
        return Math.floor((this.end_time.getTime() - this.start_time.getTime())/1000);
    }
    return 0;
}

MineSweeperModel.prototype.getCell = function (x, y) {
    return this.field.cells[x][y];
}

let MineSweeperField = function(width, height, ms_model) {
    this.width = width;
    this.height = height;
    this.ms_model = ms_model;
    this.cells = [];
    for (let x = 0; x < width; x++) {
        this.cells[x] = [];
        for (let y = 0; y < height; y++) {
            this.cells[x][y] = new MineSweeperCell(x,y, this);
        }
    }
}

MineSweeperField.prototype.forAllCells = function(fn) {
    this.cells.forEach(column => {
        column.forEach(cell => {
            fn(cell);
        });
    });
}

let MineSweeperCell = function(x, y, field) {
    this.state = MineSweeperCell.states.UNMARKED;
    this.has_bomb = false;
    this.x = x;
    this.y = y;
    this.field = field;
    this.event_target = new EventTarget();
}

MineSweeperCell.prototype.addEventListener = function () {return this.event_target.addEventListener(...arguments);}
MineSweeperCell.prototype.removeEventListener = function () {return this.event_target.removeEventListener(...arguments);}

MineSweeperCell.prototype.isRevealed = function () {
    return (this.state == MineSweeperCell.states.REVEALED);
}

MineSweeperCell.prototype.isMarked = function () {
    return (this.state == MineSweeperCell.states.MARKED);
}

MineSweeperCell.prototype.isUnmarked = function () {
    return (this.state == MineSweeperCell.states.UNMARKED);
}

MineSweeperCell.prototype.toggleMark = function () {
    // Can't mark/unmark if already revealed.
    if (this.isRevealed()) {
        return;
    }
    if (this.isMarked()) {
        this.state = MineSweeperCell.states.UNMARKED;
        this.field.ms_model.num_marked--;
    } else {
        this.state = MineSweeperCell.states.MARKED;
        this.field.ms_model.num_marked++;
    }

    this.event_target.dispatchEvent(new Event('change'));
}

MineSweeperCell.prototype.reveal = function () {
    if (this.isMarked() || this.isRevealed()) {
        return;
    }

    this.state = MineSweeperCell.states.REVEALED;
    this.event_target.dispatchEvent(new Event('change'));
}

MineSweeperCell.prototype.hasBomb = function () {
    return this.has_bomb;
}

MineSweeperCell.prototype.getNeighbors = function () {
    let neighbors = [];
    for (let dx=-1; dx<=1; dx++) {
        for (let dy=-1; dy<=1; dy++) {
            if (dx != 0 || dy != 0) {
                let nx = this.x + dx;
                let ny = this.y + dy;
                if ((nx >=0) && (nx < this.field.width) && (ny >= 0) && ny < (this.field.height)) {
                    neighbors.push(this.field.cells[nx][ny]);
                }
            }
        }
    }
    return neighbors;
}

MineSweeperCell.prototype.getNeighborBombCount = function () {
    return this.getNeighbors().reduce((bc, n) => bc += (n.hasBomb() ? 1 : 0), 0);
}

MineSweeperCell.states = {
    UNMARKED: 0,
    MARKED: 1,
    REVEALED: 2
}


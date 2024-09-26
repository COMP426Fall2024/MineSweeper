export let MineSweeperModel = class extends EventTarget {

    #field;
    #bomb_count;
    #start_time;
    #end_time;
    #num_marked;

    constructor(width, height, bomb_count) {
        super();
        this.#bomb_count = bomb_count;
        this.#field = new MineSweeperField(width, height, this);
        this.reset();
    }

    // Getters and setters

    get width() { return this.#field.width;}
    get height() { return this.#field.height;}
    get bomb_count() { return this.#bomb_count;}
    get num_marked() { return this.#num_marked;}
    set num_marked(value) { this.#num_marked = value;}
    get field() {return this.#field;}

    reset() {
        this.#start_time = null;
        this.#end_time = null;
        this.#field.forAllCells(c => {
            c.has_bomb = false;
            c.state = MineSweeperCell.states.UNMARKED;
        });
        this.num_marked = 0;

        let all_cells = [];
        this.#field.forAllCells(c => {
            all_cells.push([c, Math.random()]);
        });

        all_cells.sort((a, b) => a[1] - b[1])
            .slice(0, this.bomb_count)
            .forEach(c => c[0].has_bomb = true);

        // Force a change event on all cells to update any observers of them
        this.#field.forAllCells(c => c.dispatchEvent(new Event('change')));
        this.dispatchEvent(new Event('reset'));
    }

    gameStarted() {
        return this.#start_time != null;
    }

    gameFinished() {
        return this.#end_time != null;
    }

    gameInProgress = function () {
        return this.#start_time != null && this.#end_time == null;
    }

    startGame() {
        if (!this.gameStarted()) {
            this.#start_time = new Date();
            this.dispatchEvent(new Event("start"));
        }
    }

    endGame() {
        if (!this.gameFinished()) {
            this.#end_time = new Date();
            this.dispatchEvent(new Event("end"));
        }
    }

    getElapsedTime () {
        if (this.gameInProgress()) {
            let now = new Date();
            return Math.floor((now.getTime() - this.#start_time.getTime()) / 1000);
        } else if (this.gameFinished()) {
            return Math.floor((this.#end_time.getTime() - this.#start_time.getTime()) / 1000);
        }
        return 0;
    }

    getCell = function (x, y) {
        return this.#field.getCell(x, y);
    }
}

let MineSweeperField = class {

    #width;
    #height;
    #ms_model;
    #cells;

    constructor(width, height, ms_model) {
        this.#width = width;
        this.#height = height;
        this.#ms_model = ms_model;
        this.#cells = [];
        for (let x = 0; x < width; x++) {
            this.#cells[x] = [];
            for (let y = 0; y < height; y++) {
                this.#cells[x][y] = new MineSweeperCell(x, y, this);
            }
        }
    }

    get width() {return this.#width};
    get height() {return this.#height};
    get ms_model() {return this.#ms_model};

    forAllCells(fn) {
        this.#cells.forEach(column => {
            column.forEach(cell => {
                fn(cell);
            });
        });
    }

    getCell(x, y) {
        return this.#cells[x][y];
    }
}

let MineSweeperCell = class extends EventTarget {

    #x;
    #y;
    #state;
    #has_bomb;
    #field;

    constructor(x, y, field) {
        super();
        this.state = MineSweeperCell.states.UNMARKED;
        this.has_bomb = false;
        this.#x = x;
        this.#y = y;
        this.#field = field;
    }

    get x() { return this.#x };
    get y() { return this.#y };
    get state() { return this.#state; }
    set state(value) { this.#state = value; }
    get has_bomb() { return this.#has_bomb; }
    set has_bomb(value) { this.#has_bomb = value; }
    get neighbors() {
        let neighbors = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx != 0 || dy != 0) {
                    let nx = this.x + dx;
                    let ny = this.y + dy;
                    if ((nx >= 0) && (nx < this.#field.width) && (ny >= 0) && ny < (this.#field.height)) {
                        neighbors.push(this.#field.getCell(nx,ny));
                    }
                }
            }
        }
        return neighbors;
    }
    get neighbor_bomb_count() {
        return this.neighbors.reduce((bc, n) => bc += (n.has_bomb ? 1 : 0), 0);
    }

    isRevealed() {
        return (this.state == MineSweeperCell.states.REVEALED);
    }

    isMarked() {
        return (this.state == MineSweeperCell.states.MARKED);
    }

    isUnmarked() {
        return (this.state == MineSweeperCell.states.UNMARKED);
    }

    toggleMark() {
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

        this.dispatchEvent(new Event('change'));
    }

    reveal() {
        if (this.isMarked() || this.isRevealed()) {
            return;
        }

        this.state = MineSweeperCell.states.REVEALED;
        this.dispatchEvent(new Event('change'));
    }

    static states = {
        UNMARKED: 0,
        MARKED: 1,
        REVEALED: 2
    }
}


export let MineSweeperView = function (model, controller, render_div) {

    // Make a div to render into if we weren't given one.

    if (render_div == undefined) {
        render_div = document.createElement('div');
    }

    // Render the interface
    render_div.innerHTML = `
    <div>
      <div>Unmarked Bombs Left: <span id="bomb_count">Unmarked bomb count goes here.</span></div>
      <div>Time Elapsed: <span id="elapsed_time">0</span></div>
      <div><button id="reset">Reset</button></div>
    </div>
    <div id="field">Minefield Goes Here</div>
    `;

    let field_view = new MSFieldView(model, controller, render_div.querySelector('#field'));

    // Connect reset button to controller
    render_div.querySelector('#reset').addEventListener('click', () => {
        controller.reset();
    });

    // Set up timer
    let timer_interval_id;

    model.addEventListener('start', () => {
        timer_interval_id = setInterval(() => {
            render_div.querySelector('#elapsed_time').innerText = model.getElapsedTime();
        }, 1000);
    });

    model.addEventListener('end', () => {
        clearInterval(timer_interval_id);
        render_div.querySelector('#elapsed_time').innerText = model.getElapsedTime();
    });

    model.addEventListener('reset', () => {
        if (timer_interval_id) {
            clearInterval(timer_interval_id);
        }
        render_div.querySelector('#elapsed_time').innerText = "0";
    })

    let update_bomb_count = () => {
        render_div.querySelector('#bomb_count').innerText = model.bomb_count - model.num_marked;
    };
    update_bomb_count();
    // Update bomb count if any cells change
    model.field.forAllCells(c => c.addEventListener('change', update_bomb_count));

    // Set up a getter for the div
    this.getRenderedDiv = () => render_div;
}

let MSFieldView = function(model, controller, render_div) {
    if (render_div == undefined) {
        render_div = document.createElement('div');
    }

    render_div.innerHTML = `
    <table>
      <tbody>
      </tbody>
    </table>
    `;

    let field_table_body = render_div.querySelector('tbody');
    for (let row=0; row < model.height; row++) {
        let row_tr = document.createElement('tr');
        for (let col=0; col<model.width; col++) {
            let cell_td = document.createElement('td');
            cell_td.classList.add('cell');

            let cell_view = new MSCellView(col, row, model, controller);
            cell_td.append(cell_view.getRenderedDiv());

            row_tr.append(cell_td);
        }
        field_table_body.append(row_tr);
    }

    // Set up a getter for the div
    this.getRenderedDiv = () => render_div;

}

let MSCellView = function(x, y, model, controller, render_div) {
    if (render_div == undefined) {
        render_div = document.createElement('div');
    }

    let cell = model.getCell(x,y);

    let render = () => {
        render_div.innerHTML = '';
        if (cell.isRevealed()) {
            if (cell.hasBomb()) {
                render_div.innerHTML = 'X';
            } else {
                let bomb_count = cell.getNeighborBombCount();
                if (bomb_count != 0) {
                    let bomb_count_label = document.createElement('div');
                    bomb_count_label.innerHTML = cell.getNeighborBombCount();
                    bomb_count_label.addEventListener('click', (e) => {
                        controller.clearNeighborhood(x,y);
                    });
                    render_div.append(bomb_count_label);
                }                
            }
        } else {
            let cell_button = document.createElement('button');
            cell_button.addEventListener('click', (e) => {
                if (e.shiftKey) {
                    controller.toggleMark(x,y);
                } else {
                    controller.reveal(x,y);
                }
            });

            cell_button.classList.add('cell');

            if (cell.isMarked()) {
                cell_button.innerHTML = "M";
            }
            render_div.append(cell_button);
        }
    }
    render();

    this.getRenderedDiv = () => render_div;

    cell.addEventListener('change', render);
}
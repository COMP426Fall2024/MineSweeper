import {MineSweeperModel} from "./minesweeper_model.js";
import {MineSweeperController} from "./minesweeper_controller.js";
import {MineSweeperView} from "./minesweeper_view.js";

let model = new MineSweeperModel(30, 16, 99);
let controller = new MineSweeperController(model);
let view = new MineSweeperView(model, controller, document.querySelector('#ms'));
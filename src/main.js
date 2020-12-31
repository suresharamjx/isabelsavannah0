import {seed} from './design-tree.js'
import {MatterJsPhysics} from './physics.js'
import {ShipControl} from './ship-control.js'

let phys = new MatterJsPhysics();
let parts = seed().build(0, 0, true);
console.dir(parts);
let ship = new ShipControl(parts, {}, phys);

ship.spawn();
phys.stage();
phys.render();

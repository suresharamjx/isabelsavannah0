import {seed} from './design-tree.js'
import {MatterJsPhysics} from './physics.js'
import {defaults} from './settings.js'
import {Simulation} from './simulation.js'
import {Pool} from './pool.js'

//import {reproduceDesign} from './design-tree.js'
//console.dir(seed, reproduceDesign(seed, seed, defaults));

let phys = new MatterJsPhysics(defaults);
phys.render();

let pool = new Pool(phys, defaults, [seed, seed, seed]);

await pool.runRealtime(Infinity);

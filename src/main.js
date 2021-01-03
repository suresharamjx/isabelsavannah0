import {seed} from './design-tree.js'
import {MatterJsPhysics} from './physics.js'
import {ShipControl} from './ship-control.js'
import {defaults} from './settings.js'
import {Simulation} from './simulation.js'

let phys = new MatterJsPhysics(defaults);
phys.render();

let sim = new Simulation(phys, defaults);
sim.stage();

sim.spawnDesign(seed);
await sim.runRealtime(Infinity);

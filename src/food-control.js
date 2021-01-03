import {EntityControl} from './entity-control.js'
import {PhysBlock, PhysPayload} from './phys-tree.js'

class FoodControl extends EntityControl{
    constructor(sim){
        super(sim);
    }

    spawn(x, y){
        let set = this.sim.settings.food;
        let block = new PhysBlock(set.sides, set.radius, 1, new PhysPayload('food'));
        let blockRef = this.sim.physics.drawPart(x, y, 0, block);
        this.sim.physics.setOmega(blockRef, set.omega);
        this.sim.physics.add(blockRef);
    }
}

export {FoodControl}

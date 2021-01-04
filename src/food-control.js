import {EntityControl} from './entity-control.js'
import {PhysBlock, PhysPayload} from './phys-tree.js'

class FoodControl extends EntityControl{
    constructor(sim){
        super(sim, 'food');
    }

    spawn(x, y){
        let set = this.sim.settings.food;
        let block = new PhysBlock(set.sides, set.radius, 1, new PhysPayload('food'));
        this.blockRef = this.sim.physics.drawPart(x, y, 0, block, this, {sensor: true});
        this.sim.physics.setOmega(this.blockRef, set.omega);
        this.sim.physics.add(this.blockRef);
    }

    remove(){
        this.sim.physics.remove(this.blockRef);
    }

    handleCollisionWith(other, pair){
        this.remove();
        other.remove();
    }
}

export {FoodControl}

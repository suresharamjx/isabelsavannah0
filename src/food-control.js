import {EntityControl} from './entity-control.js'
import {PhysBlock, PhysPayload} from './phys-tree.js'

class FoodControl extends EntityControl{
    constructor(sim){
        super(sim, 'food');
        this.physics = sim.physics;
    }

    spawn(x, y){
        let set = this.sim.settings.food;
        let block = new PhysBlock(set.sides, set.radius, 1, new PhysPayload('food'));
        this.blockRef = this.physics.drawPart(x, y, 0, block, this, {sensor: true, fillStyle: "#53b327", frictionless: true});
        this.physics.setOmega(this.blockRef, set.omega);
        this.physics.add(this.blockRef);
        this.sim.liveFoods.push(this);
    }

    destroy(){
        this.physics.remove(this.blockRef);
        this.sim.liveFoods.splice(this.sim.liveFoods.indexOf(this), 1);
        super.destroy();
    }

    handleCollisionWith(other, pair){
        this.destroy();
        other.destroy();
    }

    getLocation(){
        return this.physics.getLocation(this.blockRef);
    }
}

export {FoodControl}

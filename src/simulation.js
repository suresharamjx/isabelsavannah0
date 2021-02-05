import {ShipControl} from './ship-control.js'
import {FoodControl} from './food-control.js'
import {randIntRange} from './rand.js'

class Simulation{
    constructor(physics, settings){
        this.physics = physics;
        this.settings = settings;
        this.field = settings.field;
        this.controls = [];
        this.liveFoods = [];
    }

    stage(){
        this.physics.stage();
    }

    tick(){
        if(this.liveFoods.length < this.settings.food.concurrent){
            this.spawnFood();
        }
        this.controls.map(x => x.tick());
        this.physics.tick(this.settings.physicsTickTime);
    }

    spawnDesign(design){
        let x = randIntRange(this.field.xSize*-0.40, this.field.xSize*0.40);
        let y = randIntRange(this.field.ySize*-0.40, this.field.ySize*0.40);
        let phys = design.tree.build();
        let ship = new ShipControl(phys, design.meta, this, this.settings);
        this.controls.push(ship);
        ship.spawn(x, y);
        return ship;
    }

    spawnFood(){
        let x = randIntRange(this.field.xSize*-0.40, this.field.xSize*0.40);
        let y = randIntRange(this.field.ySize*-0.40, this.field.ySize*0.40);
        let food = new FoodControl(this);
        food.spawn(x, y);
        this.controls.push(food);
    }
}

export {Simulation}

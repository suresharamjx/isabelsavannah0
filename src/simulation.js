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
        this.liveShips = [];
        this.age = 0;

        this.scheduledCallbacks = {};
    }

    stage(){
        this.physics.stage();
    }

    tick(){
        if(this.liveFoods.length < this.settings.food.concurrent){
            this.spawnRandomFood();
        }
        this.controls.map(x => x.tick());
        this.physics.tick(this.settings.physicsTickTime);

        this.age++;
        if(this.age in this.scheduledCallbacks){
            for(let callback of this.scheduledCallbacks[this.age]){
                callback();
            }
            delete this.scheduledCallbacks[this.age];
        }
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

    spawnFood(x, y, value){
        let food = new FoodControl(this, value);
        food.spawn(x, y);
        this.controls.push(food);
    }

    spawnRandomFood(){
        let x = randIntRange(this.field.xSize*-0.40, this.field.xSize*0.40);
        let y = randIntRange(this.field.ySize*-0.40, this.field.ySize*0.40);
        let value = this.settings.food.value;
        this.spawnFood(x, y, value)
    }

    scheduleCallback(delay, callback){
        let callTime = this.age + Math.max(Math.round(delay/this.settings.physicsTickTime), 1);
        if(!(callTime in this.scheduledCallbacks)){
            this.scheduledCallbacks[callTime] = [];
        }

        this.scheduledCallbacks[callTime].push(callback);
    }
}

export {Simulation}

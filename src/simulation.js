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
        for(let i=0; i<this.settings.food.initial; i++){
            this.spawnFood();
        }
    }

    tick(){
        if(Math.random() <= this.settings.food.rate){
            this.spawnFood();
        }
        this.controls.map(x => x.tick());
        this.physics.tick(this.settings.physicsTickTime);
    }

    spawnDesign(design){
        let phys = design.build();
        let ship = new ShipControl(phys, {}, this);
        ship.spawn();
        this.controls.push(ship);
    }

    spawnFood(){
        let x = randIntRange(this.field.xSize*-0.40, this.field.xSize*0.40);
        let y = randIntRange(this.field.ySize*-0.40, this.field.ySize*0.40);
        let food = new FoodControl(this);
        food.spawn(x, y);
        this.controls.push(food);
    }

    async runRealtime(ticks){
        for(let i=0; i<ticks; i++){
            let last = Date.now();
            this.tick();
            let extraTime = this.settings.displayTickTime*1000 - (Date.now() - last)
            if(extraTime > 0){
                await this.sleep(extraTime);
            }
        }
    }

    sleep(ms){
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export {Simulation}

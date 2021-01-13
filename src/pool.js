import {Simulation} from './simulation.js'
import {randChoice} from './rand.js'

class Pool{
    constructor(physics, settings, seeds){
        this.settings = settings;
        this.sim = new Simulation(physics, settings);
        this.tickCount = 0;
        this.sim.stage();

        this.nextId = 0;

        this.population = {};
        for(var i=0; i<settings.pool.population; i++){
            this.population[this.getId()] = {
                design: randChoice(seeds),
                runs: 0,
                totalScore: 0,
            };
        }

        this.liveShips = [];
    }

    tick(){
        if(this.tickCount % 300 == 0 && this.liveShips.length < this.settings.pool.concurrent){
            this.spawn();
        }

        this.handleDeath();

        this.tickCount++;
        this.sim.tick();
    }

    spawn(){
        let choice = randChoice(Object.keys(this.population));
        let ship = this.sim.spawnDesign(this.population[choice].design);
        this.liveShips.push({id: choice, ship: ship});
    }

    handleDeath(){
        let deadShips = [];
        let newLiveShips = [];
        for(let ship of this.liveShips){
            if(ship.ship.storedFood > 0){
                newLiveShips.push(ship);
            }else{
                deadShips.push(ship);
            }
        }

        this.liveShips = newLiveShips;
        deadShips.map(x => this.score(x));
        deadShips.map(x => x.ship.destroy());
    }

    score(ship){
        this.population[ship.id].runs++;
        this.population[ship.id].totalScore += ship.ship.score;
        console.log("Ship", ship.id, "died with score", ship.ship.score);
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

    getId(){
        this.nextId++;
        return this.nextId;
    }
}

export {Pool}

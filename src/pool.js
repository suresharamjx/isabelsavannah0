import {Simulation} from './simulation.js'
import {randChoice} from './rand.js'
import {reproduceDesign} from './design-tree.js'

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
                design: reproduceDesign(randChoice(seeds), randChoice(seeds), settings),
                runs: 0,
                totalScore: 0,
            };
        }

        this.liveShips = [];
    }

    tick(){
        if(this.tickCount % this.settings.pool.spawnInterval == 0 && this.liveShips.length < this.settings.pool.concurrent){
            this.spawn();
        }

        if(this.tickCount % this.settings.pool.reproduceInterval == 0){
            this.reproduce();
        }

        this.handleDeath();

        this.tickCount++;
        this.sim.tick();
    }

    pickKeyForReproduce(){
        let guess = randChoice(Object.keys(this.population));
        for(let ship of this.liveShips){
            if(ship.id == guess){
                return this.pickKeyForReproduce();
            }
        }

        return guess;
    }

    reproduce(){
        let set = new Set();
        while(set.size < 3){
            set.add(this.pickKeyForReproduce());
        }

        let orderedKeys = Array.from(set);
        orderedKeys.sort((a, b) => {
            let av = this.population[a].runs == 0 ? 0 : this.population[a].totalScore / this.population[a].runs;
            let bv = this.population[b].runs == 0 ? 0 : this.population[b].totalScore / this.population[b].runs;
            return av - bv;
        });

        let describe = (id) => {
            let shipDesc = this.population[id];
            return ("ship " + id + " with average score " + (shipDesc.runs > 0 ? shipDesc.totalScore / shipDesc.runs : 0));
        }

        console.log("reproduction:", 
            describe(orderedKeys[1]), 
            "reproduces with", 
            describe(orderedKeys[2]), 
            ". child will replace", 
            describe(orderedKeys[0]));

        console.dir("best ship", this.population[orderedKeys[0]]);

        this.population[orderedKeys[0]] = {
            design: reproduceDesign(this.population[orderedKeys[1]].design, this.population[orderedKeys[2]].design, this.settings),
            runs: 0,
            totalScore: 0,
        };
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

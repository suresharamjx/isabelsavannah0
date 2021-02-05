import {Simulation} from './simulation.js'
import {randChoice, randInt} from './rand.js'
import {reproduceDesign} from './design-tree.js'

let allocateId = (() => {
    var lastId = 0;
    return () => {
        lastId++;
        return lastId;
    };
})();

class DesignRecord{
    constructor(design, settings){
        this.design = design;
        this.settings = settings;
        this.runs = 0;
        this.totalScore = 0;
        this.id = allocateId();
    }

    getScore(){
        if(this.runs == 0){
            return 0;
        }else{
            return this.totalScore / this.runs;
        }
    }

    recordScore(score){
        this.totalScore += score;
        this.runs++;
        //console.log(`Design ${this.id} got score ${score} (${this.getScore()} average over ${this.runs} runs)`);
    }

    stable(){
        return this.settings.pool.stableRuns <= this.runs;
    }
}

class DesignRun{
    constructor(record, control){
        this.record = record;
        this.control = control;
    }
}

function announce(text){
    document.getElementById('sidebar').innerHTML = text;
}

class Pool{
    constructor(physics, settings, seeds){
        this.settings = settings;
        this.sim = new Simulation(physics, settings);
        this.tickCount = 0;
        this.sim.stage();
        this.nextId = 0;
        this.seeds = seeds;

        this.stablePopulation = [];
        this.unstablePopulation = [];
        this.livePopulation = [];

        this.tickCount = 0;
    }

    updatePopulations(){
        let newlyStable = [];
        let remainingUnstable = [];

        for(let record of this.unstablePopulation){
            (record.stable() ? newlyStable : remainingUnstable).push(record);
        }

        if(newlyStable.length > 0){
            for(let record of newlyStable){
                this.stablePopulation.push(record);
                //console.log(`Design ${record.id} is now stable with score ${Math.round(record.getScore())}`);
            }
            this.unstablePopulation = remainingUnstable;
            this.stablePopulation.sort((a, b) => b.getScore() - a.getScore());
            this.stablePopulation = this.stablePopulation.splice(0, this.settings.pool.recordsStable);
            //console.log("Stable design scores:", describe(this.stablePopulation.map((record) => record.getScore())));
        }

        while(this.unstablePopulation.length < this.settings.pool.recordsUnstable){
            this.reproduce();
        }
    }

    pickForReproduction(){
        if(this.stablePopulation.length < this.settings.pool.minStableForReproduction){
            console.log("Reproducing from seeds because not enough stable population");
            return randChoice(this.seeds);
        }else{
            let index = Math.min(randInt(this.stablePopulation.length), randInt(this.stablePopulation.length));
            console.log(`Reproducing from design ${this.stablePopulation[index].id} from stable index ${index}/${this.stablePopulation.length}, score ${this.stablePopulation[index].getScore()}`);
            return this.stablePopulation[index].design;
        }
    }

    reproduce(){
        let newDesign = reproduceDesign(this.pickForReproduction(), this.pickForReproduction(), this.settings);
        this.unstablePopulation.push(new DesignRecord(newDesign, this.settings));
    }

    tick(){
        if(this.livePopulation.length < this.settings.pool.concurrentPopulation){
            this.updatePopulations();
            this.spawn();
        }

        if(this.tickCount % 100 == 0){
            let descr = describe(this.stablePopulation.map((record) => record.getScore()));
            let unstableScores = this.unstablePopulation.map((record) => record.getScore())
            unstableScores.sort();
            unstableScores.reverse();
            let lines = [
                `Ticks elapsed: ${this.tickCount}`,
                `Unstable population score summary: ${describe(unstableScores)}`,
                `  Stable population score summary: ${descr}`
            ]
            if(this.stablePopulation.length > 0){
                let exemplar = this.stablePopulation[0];
                lines.push('');
                lines.push(`best design is #${exemplar.id}, with ${Math.round(exemplar.getScore())} avg score over ${exemplar.runs} runs.`);
                lines.push('');
                lines.push('its genome is:');
                for(let line of this.stablePopulation[0].design.pretty(0)){
                    lines.push(line);
                }
            }
            announce(lines.join("<br>"));
        }

        this.handleDeath();
        this.sim.tick();
        this.tickCount++;
    }

    spawn(){
        let currentLiveStable = this.livePopulation.filter(x => x.record.stable()).length;
        var choice = null;
        if(currentLiveStable < this.settings.pool.concurrentStablePopulation
            && this.stablePopulation.length > 0){
            let index = Math.min(randInt(this.stablePopulation.length), randInt(this.stablePopulation.length));
            console.log(`Spawning design ${this.stablePopulation[index].id} from stable index ${index}/${this.stablePopulation.length}`);
            choice = this.stablePopulation[index];
        }else{
            choice = randChoice(this.unstablePopulation);
            console.log(`Spawning an unstable design ${choice.id}`);
        }

        let ship = this.sim.spawnDesign(choice.design);
        this.livePopulation.push(new DesignRun(choice, ship));
    }

    handleDeath(){
        let deadShips = [];
        let newLiveShips = [];
        for(let run of this.livePopulation){
            if(run.control.storedFood > 0){
                newLiveShips.push(run);
            }else{
                deadShips.push(run);
            }
        }

        this.livePopulation = newLiveShips;
        deadShips.map(x => x.record.recordScore(x.control.score));
        deadShips.map(x => x.control.destroy());
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

function describe(arry){
    if(arry.length > 10){
        let mean = Math.round(arry.reduce((x, y) => x+y)/arry.length);
        let median = Math.round(arry[Math.round(arry.length/2)]);
        let p90 = Math.round(arry[Math.round(arry.length/10)]);
        let p10 = Math.round(arry[Math.round(9*arry.length/10)]);
        let p25 = Math.round(arry[Math.round(3*arry.length/4)]);
        let p75 = Math.round(arry[Math.round(arry.length/4)]);
        let min = Math.round(arry[arry.length-1]);
        let max = Math.round(arry[0]);
        return `mean ${mean}, count ${arry.length}, [max: ${max}, p90: ${p90}, p75: ${p75}, p50: ${median}, p25: ${p25}, p10: ${p10}, min: ${min}]`;
    }else{
        return '[' + arry.map(Math.round).join(', ') + ']';
    }
}

export {Pool}

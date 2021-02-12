import {EntityControl} from './entity-control.js'
import {randChoice} from './rand.js'
import {navigate, modCircle, modCircleDelta} from './geometry.js'

class PartControl{
    constructor(parentControl, id, partRef, children){
        this.id = id;
        this.children = children;
        this.parentControl = parentControl;
        this.health = parentControl.physics.getMass(partRef);
    }

    damage(amount){
        this.health -= amount;
        if(this.health <= 0){
            this.destroy();
            this.parentControl.trim();
        }
    }

    destroy(){
        this.children.map(child => child.destroy());
        this.parentControl.removePart(this.id);
    }
}

class ShipControl extends EntityControl{
    constructor(physTree, designMeta, sim, settings){
        super(sim, 'ship');
        this.physTree = physTree;
        this.designMeta = designMeta;
        this.physics = sim.physics;
        this.settings = settings;
        this.collisionControllerPriority = 2;
        this.targetLocation = null;

        this.physMap = {};
        this.partRefMap = {};
        this.angleOffsets = {};
        this.partControlMap = {};

        this.storedFood = 0;
        this.age = 0;
        this.score = 0;

        this.angleIntegralHistory = [];

        this.dead = false;
    }

    spawn(x, y){
        let controlCollector = []
        this.partRefs = this.spawnBlocksAt(x, y, 0, this.physTree, controlCollector).flat(Infinity);
        this.rootPartControl = controlCollector[0];
        this.shipRef = this.physics.join(this.partRefs, this);
        this.mapThrusters();
        this.physics.add(this.shipRef);

        let tsets = [this.reverseThrusters, this.forwardThrusters, this.rightThrusters, this.leftThrusters];
        this.storedFood = this.settings.ship.initialFood * this.physics.getMass(this.shipRef);
        tsets.map(y=>y.map(x => this.physics.deemph(this.partRefMap[x])));
    }

	spawnBlocksAt(turtleX, turtleY, turtleTheta, physTree, parentsChildCollector){
		let newTheta = turtleTheta + physTree.rotation;
		let newX = turtleX + Math.sin(newTheta)*physTree.translation;
		let newY = turtleY + Math.cos(newTheta)*physTree.translation;

        let block = physTree.block;
        let opts = block.payload.type == "thruster" ? {fillStyle: "#e68a49"} : {};
		let partRef = this.physics.drawPart(newX, newY, newTheta, block, this, opts);
        let id = this.physics.getId(partRef);
        this.physMap[id] = block;
        this.partRefMap[id] = partRef;
        this.angleOffsets[id] = newTheta;

        let childCollector = [];
		let childPartRefs = physTree.children.map(branch => this.spawnBlocksAt(newX, newY, newTheta, branch, childCollector));

        let partControl = new PartControl(this, id, partRef, childCollector);
        parentsChildCollector.push(partControl);

        this.partControlMap[id] = partControl;

        return [partRef, childPartRefs];
	}

    handleCollisionBeforeWith(other, pair){
        if(other.type === 'food'){
            other.destroy();
            this.storedFood += this.settings.food.value;
        }
    }

    handleCollisionActiveWith(other, pair){
        if(other.type === 'ship'){
            this.doCollision(other, pair);
        }
    }

    handleCollisionAfterWith(other, pair){
        if(other.type === 'ship'){
            this.doCollision(other, pair);
        }
    }

    removePart(id){
        let partRef = this.partRefMap[id];
        if(!partRef){
            return;
        }
        this.physics.remove(partRef);
        delete this.physMap[id];
        delete this.partRefMap[id];
        delete this.angleOffsets[id];
        delete this.partControlMap[id];
        for(let thrusterList of [this.forwardThrusters, this.reverseThrusters, this.rightThrusters, this.leftThrusters]){
            let index = thrusterList.indexOf(id);
            if(index >= 0){
                thrusterList.splice(index, 1);
            }
        }
        if(id == this.rootPartControl.id){
            this.dead = true;
        }
    }

    trim(){
        this.physics.rejoin(this.shipRef, Object.values(this.partRefMap), false);
    }

    doCollision(other, pair){
        let myPart = this.physics.getId(pair.bodyA); // if we are both same entity type, we are guarenteed to be body a
        let theirPart = this.physics.getId(pair.bodyB);

        let myPartRef = this.partRefMap[myPart];
        let theirPartRef = other.partRefMap[theirPart];

        let myPhys = this.physMap[myPart];
        let theirPhys = other.physMap[theirPart]

        var myStrength = this.collisionStrength(myPartRef, theirPartRef) / myPhys.sides;
        var theirStrength = other.collisionStrength(theirPartRef, myPartRef) / theirPhys.sides;

        if(myStrength == 0 && theirStrength == 0){
            myStrength = 1;
            theirStrength = 1;
        }

        let scale = myStrength + theirStrength;
        myStrength /= scale;
        theirStrength /= scale;

        if(myStrength < 0.2){
            myStrength = 0.2;
            theirStrength = 0.8;
        }else if(myStrength > 0.8){
            myStrength = 0.8;
            theirStrength = 0.2;
        }

        let myPartControl = this.partControlMap[myPart];
        let theirPartControl = other.partControlMap[theirPart];

        let totalDamage = Math.min(myPartControl.health/theirStrength, theirPartControl.health/myStrength);

        myPartControl.damage(totalDamage*theirStrength*this.settings.ship.collisionDamagePerTick);
        theirPartControl.damage(totalDamage*myStrength*this.settings.ship.collisionDamagePerTick);
    }


    collisionStrength(from, to){
        let directionAngle = navigate(this.physics.getLocation(from), this.physics.getLocation(to));
        let shipVelocity = this.physics.getVelocity(this.shipRef);
        let momentumAngle = navigate({x:0, y:0}, shipVelocity);
        let angleDelta = modCircleDelta(directionAngle - momentumAngle);

        if(Math.abs(angleDelta) > (Math.PI/2)){
            return 0;
        }

        let velocityMagnitude = (shipVelocity.x ** 2 + shipVelocity.y ** 2) ** 0.5;
        return velocityMagnitude * this.physics.getMass(from) * Math.cos(angleDelta);
    }

    pickMovementTarget(){
        if(this.sim.liveFoods.length > 0){
            let targetFood = randChoice(this.sim.liveFoods);
            this.targetLocation = targetFood.getLocation();
            targetFood.onDestroy(() => this.targetLocation = null);
            this.angleIntegralHistory = [];
        }
    }

    mapThrusters(){
        this.forwardThrusters = [];
        this.reverseThrusters = [];
        this.rightThrusters = [];
        this.leftThrusters = [];

        for(var id in this.physMap){
            id = +id;
            if(this.physMap[id].payload.type != "thruster"){
                continue;
            }

            let partRef = this.partRefMap[id];
            let partPositionAngle = navigate(this.physics.getLocation(this.shipRef), this.physics.getLocation(partRef));
            let partAngle = this.angleOffsets[id];
            let thrustAngle = modCircle(partAngle + Math.PI);

            let angleDelta = modCircleDelta(thrustAngle - partPositionAngle + Math.PI);
            let angleDeltaAbs = Math.abs(angleDelta);
            let thrustAngleAbs = Math.abs(modCircleDelta(thrustAngle));

            if(angleDeltaAbs < Math.PI/4 || angleDeltaAbs > (3*Math.PI/4)){
                if(thrustAngleAbs <= Math.PI/2){
                    this.forwardThrusters.push(id);
                }else{
                    this.reverseThrusters.push(id);
                }
            }else{
                if(angleDelta >= 0){
                    this.leftThrusters.push(id);
                }else{
                    this.rightThrusters.push(id);
                }
            }
        }
    }

    tick(){
        if(!this.targetLocation){
            this.pickMovementTarget();
        }

        if(this.targetLocation){
            let targetTheta = navigate(this.physics.getLocation(this.shipRef), this.targetLocation);
            let currentTheta = this.physics.getTheta(this.shipRef);
            let turn = modCircleDelta(targetTheta - currentTheta);
            let maxDeviation = Math.PI/32;
            if(Math.abs(turn) < maxDeviation){
                let powerScale = (maxDeviation-Math.abs(turn))/maxDeviation;
                this.powerThrusters(this.forwardThrusters, powerScale);
                this.reverseThrusters.map(x => this.physics.deemph(this.partRefMap[x]));
            }else if(Math.abs(turn) > (Math.PI - maxDeviation)){
                let powerScale = (maxDeviation-(Math.PI-Math.abs(turn)))/maxDeviation;
                this.powerThrusters(this.reverseThrusters, 1);
                this.forwardThrusters.map(x => this.physics.deemph(this.partRefMap[x]));
            }else{
                this.reverseThrusters.map(x => this.physics.deemph(this.partRefMap[x]));
                this.forwardThrusters.map(x => this.physics.deemph(this.partRefMap[x]));
            }

            this.angularControl();
        }

        this.runFood()

        this.age++;
    }

    runFood(){
        let cost = this.settings.ship.metabolisim * (1 + this.age/this.settings.ship.agingBasis) * Math.max(this.settings.ship.massMetabolisimMin, this.physics.getMass(this.shipRef));
        this.storedFood -= cost;

        if(this.storedFood > this.settings.ship.scoreThreshold){
            let scoreAmount = (this.storedFood - this.settings.ship.scoreThreshold)*this.settings.ship.scoringRatio;
            this.storedFood -= scoreAmount;
            this.score += scoreAmount;
        }
    }

    angularControl(){
        let targetTheta = navigate(this.physics.getLocation(this.shipRef), this.targetLocation);
        let currentTheta = this.physics.getTheta(this.shipRef);
        let currentOmega = this.physics.getOmega(this.shipRef) / Math.PI;
        let error = modCircleDelta(targetTheta - currentTheta) / Math.PI; //put to a [-1, 1] scale

        this.angleIntegralHistory.push(error);
        if(this.angleIntegralHistory.length > this.designMeta.angularControl.ti){
            this.angleIntegralHistory.pop();
        }

        let integralValue = this.angleIntegralHistory.reduce((x, y) => x+y, 0);

        var control = 
            this.designMeta.angularControl.p.value * error
            + this.designMeta.angularControl.d.value * currentOmega * -1
            + this.designMeta.angularControl.i.value * integralValue;

        control = Math.min(control, 1);
        control = Math.max(control, -1);

        if(control > 0){
            this.powerThrusters(this.rightThrusters, control);
            this.leftThrusters.map(x => this.physics.deemph(this.partRefMap[x]));
        }else{
            this.powerThrusters(this.leftThrusters, -1*control);
            this.rightThrusters.map(x => this.physics.deemph(this.partRefMap[x]));
        }
    }

    powerThrusters(thrusterIds, power){
        for(let id of thrusterIds){
            let partRef = this.partRefMap[id];
            let thrusterLoc = this.physics.getLocation(partRef);
            let shipAngle = this.physics.getTheta(this.shipRef);
            let thrusterPower = this.settings.ship.thrusterPowerMassRatio * partRef.mass * power;
            if(power > 0.01){
                this.physics.emph(partRef);
            }
            this.physics.generateForce(this.shipRef, thrusterLoc, thrusterPower, modCircle(shipAngle + this.angleOffsets[id] + Math.PI));
        }
    }

    destroy(){
        this.physics.remove(this.shipRef, true);
        this.sim.controls.splice(this.sim.controls.indexOf(this), 1);
        super.destroy();
    }
}

export {ShipControl}

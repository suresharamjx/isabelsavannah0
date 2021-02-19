import {EntityControl} from './entity-control.js'
import {BulletControl} from './bullet-control.js'
import {randChoice, randInt} from './rand.js'
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

class TurretControl{
    constructor(parentPartRef, shipControl, restingTheta){
        this.parentPartRef = parentPartRef;
        this.shipControl = shipControl;
        this.physics = shipControl.physics;
        this.restingTheta = restingTheta;
        this.settings = shipControl.settings;
        this.cooldown = 0;
    }

    spawn(x, y, radius){
        this.displayBlock = this.physics.drawTurret(x, y, radius);
        this.physics.setLocationPair(this.displayBlock, this.physics.getLocation(this.parentPartRef));
        this.physics.setTheta(this.displayBlock, modCircle(this.restingTheta + this.physics.getTheta(this.shipControl.shipRef)));
        this.currentTheta = this.restingTheta;
        this.physics.add(this.displayBlock);
    }

    tick(){
        var targetRelativeTheta = null;
        var hasTarget = false;
        if(this.shipControl.shootingTarget){
            let targetAbsoluteTheta = navigate(this.physics.getLocation(this.parentPartRef), this.shipControl.shootingTarget.getLocation())
            targetRelativeTheta = modCircleDelta(targetAbsoluteTheta - this.physics.getTheta(this.shipControl.shipRef));
            hasTarget = true;
        }else{
            targetRelativeTheta = this.restingTheta;
        }

        let omegaMaxTick = this.settings.turret.omegaMax * this.settings.physicsTickTime;
        let delta = Math.min(omegaMaxTick, Math.max(-omegaMaxTick, (targetRelativeTheta - this.currentTheta)));
        this.currentTheta += delta;

        this.physics.setLocationPair(this.displayBlock, this.physics.getLocation(this.parentPartRef));
        this.physics.setTheta(this.displayBlock, modCircle(this.physics.getTheta(this.shipControl.shipRef) + this.currentTheta));

        if(this.cooldown > 0){
            this.cooldown--;
        }else if(hasTarget && Math.abs(this.currentTheta - targetRelativeTheta) < this.settings.turret.spread/2){
            this.cooldown = randInt(this.settings.turret.maxCooldown);
            this.fire();
        }
    }

    fire(){
        let theta = modCircle(this.currentTheta + this.physics.getTheta(this.shipControl.shipRef));
        let spread = (Math.random() - 0.5)*this.settings.turret.spread;
        let loc = this.physics.getLocation(this.parentPartRef);

        let bullet = new BulletControl(this.shipControl.sim, this.settings.bullet.massDamageRatio * this.physics.getMass(this.parentPartRef));
        bullet.spawn(loc.x, loc.y, modCircle(theta+spread));
    }

    destroy(){
        this.physics.remove(this.displayBlock);
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
        this.turretControlMap = {};

        this.storedFood = 0;
        this.age = 0;
        this.score = 0;

        this.angleIntegralHistory = [];

        this.dead = false;
    }

    getLocation(){
        return this.physics.getLocation(this.shipRef);
    }

    spawn(x, y){
        let controlCollector = []
        this.partRefs = this.spawnBlocksAt(x, y, 0, this.physTree, controlCollector).flat(Infinity);
        this.rootPartControl = controlCollector[0];
        this.shipRef = this.physics.join(this.partRefs, this);
        this.id = this.physics.getId(this.shipRef);
        this.mapThrusters();
        this.mapTurrets();
        this.physics.add(this.shipRef);

        let tsets = [this.reverseThrusters, this.forwardThrusters, this.rightThrusters, this.leftThrusters];
        this.storedFood = this.settings.ship.initialFood * this.physics.getMass(this.shipRef);
        tsets.map(y=>y.map(x => this.physics.deemph(this.partRefMap[x])));

        this.sim.liveShips.push(this);
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
            this.storedFood += other.value;
        }else if(other.type === 'bullet'){
            let myPart = this.physics.getId(pair.bodyA);
            let myPartControl = this.partControlMap[myPart];
            if(myPartControl){
                myPartControl.damage(other.damage);
            }
            other.destroy();
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

        if(id in this.turretControlMap){
            this.turretControlMap[id].destroy();
            delete this.turretControlMap[id];
        }

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

        if(myStrength < 0.1){
            myStrength = 0.1;
            theirStrength = 0.9;
        }else if(myStrength > 0.9){
            myStrength = 0.9;
            theirStrength = 0.1;
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
            var dist = Infinity;
            let myLoc = this.physics.getLocation(this.shipRef);
            var bestFood = null;
            for(let food of this.sim.liveFoods){
                let thisLoc = food.getLocation();
                let thisDist = ((myLoc.x - thisLoc.x)**2 + (myLoc.y - thisLoc.y)**2)/food.value;
                if(thisDist < dist){
                    bestFood = food;
                    dist = thisDist;
                }
            }

            this.targetLocation = bestFood.getLocation();
            bestFood.onDestroy(() => this.targetLocation = null);
            this.angleIntegralHistory = [];
        }
    }

    pickShootingTarget(){
        if(this.sim.liveShips.length > 0){
            var dist = this.settings.turret.range**2;
            let myLoc = this.physics.getLocation(this.shipRef);
            var bestTarget = null;
            for(let target of this.sim.liveShips){
                if(target.id == this.id){
                    continue;
                }
                let thisLoc = target.getLocation();
                let thisDist = (myLoc.x - thisLoc.x)**2 + (myLoc.y - thisLoc.y)**2;
                if(thisDist < dist){
                    bestTarget = target;
                    dist = thisDist;
                }
            }

            this.shootingTarget = bestTarget;
        }
    }


    mapTurrets(){
        for(var id in this.physMap){
            id = +id;
            if(this.physMap[id].payload.type != "turret"){
                continue;
            }

            let control = new TurretControl(this.partRefMap[id], this, this.angleOffsets[id]);
            let loc = this.physics.getLocation(this.partRefMap[id]);
            control.spawn(loc.x, loc.y, this.physMap[id].radius*1.2);
            this.turretControlMap[id] = control;
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

            if(angleDeltaAbs < Math.PI/8 || angleDeltaAbs > (7*Math.PI/8)){
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

        if(this.age % this.settings.ship.shootingTargetInterval){
            this.pickShootingTarget();
        }

        if(this.targetLocation){
            let targetTheta = navigate(this.physics.getLocation(this.shipRef), this.targetLocation);
            let currentTheta = this.physics.getTheta(this.shipRef);
            let turn = modCircleDelta(targetTheta - currentTheta);
            let maxDeviation = Math.PI/32;

            let perfectAngle = Math.PI/32;
            let forwardAngle = Math.PI/8;

            var forwardPower = 0;
            if(Math.abs(turn) < perfectAngle){
                this.powerThrusters(this.forwardThrusters, 1);
            }else if(Math.abs(turn) < forwardAngle){
                let powerScale = (Math.abs(turn) - perfectAngle) / (forwardAngle - perfectAngle);
                this.powerThrusters(this.forwardThrusters, powerScale);
            }else{
                this.forwardThrusters.map(x => this.physics.deemph(this.partRefMap[x]));
            }

            this.angularControl();
        }

        for(let turret of Object.values(this.turretControlMap)){
            turret.tick();
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
        let pos = this.physics.getLocation(this.shipRef);
        this.physics.remove(this.shipRef, true);
        this.sim.controls.splice(this.sim.controls.indexOf(this), 1);
        this.sim.liveShips.splice(this.sim.liveShips.indexOf(this), 1);
        if(this.storedFood > 0){
            this.sim.spawnFood(pos.x, pos.y, this.storedFood);
        }
        for(let turretControl of Object.values(this.turretControlMap)){
            turretControl.destroy();
        }
        super.destroy();
    }
}

export {ShipControl}

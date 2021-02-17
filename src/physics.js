import {modCircle} from './geometry.js'

class MatterJsPhysics {
    constructor(settings){
        this.engine = Matter.Engine.create();
        this.settings = settings;
        this.controllers = {};
    }

    stage(){
        this.engine.gravity.x = 0;
        this.engine.gravity.y = 0;
        Matter.Events.on(this.engine, "collisionStart", x=>this.handleCollisionStart(x));
        Matter.Events.on(this.engine, "collisionEnd", x=>this.handleCollisionEnd(x));
        Matter.Events.on(this.engine, "collisionActive", x=>this.handleCollisionActive(x));
	}

    handleCollisionPart(event, call){
        for(let pair of event.pairs){
            let bodyA = pair.bodyA;
            let bodyB = pair.bodyB;

            let controllerA = this.controllers[bodyA.id];
            let controllerB = this.controllers[bodyB.id];
            if(!controllerA){
                continue
            }
            if(!controllerB){
                continue
            }

            if(controllerA.collisionControllerPriority < controllerB.collisionControllerPriority){
                call(controllerB, controllerA, pair);
            }else{
                call(controllerA, controllerB, pair);
            }
        }
    }

    handleCollisionStart(event){
        this.handleCollisionPart(event, (a, b, pair) => a.handleCollisionBeforeWith(b, pair));
    }

    handleCollisionActive(event){
        this.handleCollisionPart(event, (a, b, pair) => a.handleCollisionActiveWith(b, pair));
    }

    handleCollisionEnd(event){
        this.handleCollisionPart(event, (a, b, pair) => a.handleCollisionAfterWith(b, pair));
    }

    render(){
        let xSize = this.settings.field.xSize;
        let ySize = this.settings.field.ySize;
        let renderScale = this.settings.field.renderScale;
        let corners = [-1, 1].map((xdir) => [-1, 1].map((ydir) => ({x: 0.5*xSize*xdir, y: 0.5*ySize*ydir}))).flat(2);
        this.render = Matter.Render.create({
            element: document.getElementById('canvas'), 
            engine: this.engine, 
            bounds: Matter.Bounds.create(Matter.Vertices.create(corners)),
            options: {
                height: ySize/renderScale, 
                width: xSize/renderScale,
                hasBounds: true,
                //showAngleIndicator: true,
                //showPositions: true,
                //showIds: true,
                wireframes: false,
            }});
		Matter.Render.run(this.render);
    }

	drawPart(x, y, theta, physBlock, controller, extraOptions = {}){
        y = -y;

        let sideAngle = Math.PI * 2 / physBlock.sides;
        let vertices = []
        let pointOffset = (physBlock.sides % 2 == 0 ? 0.5*sideAngle : 0)
        for(let side = 0; side<physBlock.sides; side++){
            let vertexTheta = theta + side*sideAngle + pointOffset;

            vertices.push({x: physBlock.radius*Math.sin(vertexTheta), y: -physBlock.radius*Math.cos(vertexTheta)});
        }

        let body = Matter.Body.create({
            position: {x: x, y: y},
            mass: physBlock.mass,
            vertices: vertices,
            sensor: !!extraOptions.sensor,
            frictionAir: extraOptions.frictionless ? 0 : 0.01,
            render: {
                fillStyle: extraOptions.fillStyle || "#3461eb",
            }
        });

        this.controllers[body.id] = controller;
		return body;
	}

    drawTurret(x, y, radius){
        y = -y;

        let angles = [0, Math.PI * (7/8), Math.PI, Math.PI * (9/8)];
        let distances = [radius, radius, radius*1.2, radius];
        let vertices = [];
        for(let i = 0; i<angles.length; i++){
            vertices.push({x: distances[i]*Math.sin(angles[i]), y: -1*distances[i]*Math.cos(angles[i])});
        }

        let body = Matter.Body.create({
            position: {x: x, y: y},
            mass: 0,
            vertices: vertices,
            frictionAir: 0,
            render: {fillStyle: "#7796f2"},
        });

        body.collisionFilter.category = 0;

        return body;
    }

    generateForce(part, from, magnitude, direction){
        from = this.transformPosition(from);
        let directedForce = {x: magnitude*Math.sin(direction), y: -magnitude*Math.cos(direction)};
        Matter.Body.applyForce(part, from, directedForce);
    }

    join(parts, controller){
		let rootPart = Matter.Body.create();
        this.rejoin(rootPart, parts);
        this.controllers[rootPart.id] = controller;
        return rootPart;
    }

    rejoin(rootPart, parts, autoHull){
		Matter.Body.setParts(rootPart, parts, autoHull);
        // fix inertia because matterjs is broken
        let realAreaMoment = parts.map(x => {
            let dx = x.position.x - rootPart.position.x;
            let dy = x.position.y - rootPart.position.y;
            return x.area * Math.sqrt(dx*dx + dy*dy);
        }).reduce((x, y) => x+y, 0);
        Matter.Body.setInertia(rootPart, realAreaMoment);
    }

    add(part){
		Matter.Composite.add(this.engine.world, part);
    }

    tick(seconds){
        Matter.Engine.update(this.engine, seconds*1000);
    }

    remove(partRef){
        delete this.controllers[partRef.id];
        Matter.Composite.remove(this.engine.world, partRef);
    }

    setOmega(partRef, omega){
        Matter.Body.setAngularVelocity(partRef, omega);
    }

    getTheta(partRef){
        return partRef.angle;
    }

    setTheta(partRef, theta){
        Matter.Body.setAngle(partRef, theta);
    }

    getOmega(partRef){
        return partRef.angularVelocity;
    }

    getLocation(partRef){
        return this.transformPosition(partRef.position);
    }

    getVelocity(partRef){
        return this.transformPosition(partRef.velocity);
    }

    getId(partRef){
        return partRef.id;
    }

    getMass(partRef){
        return partRef.mass;
    }

    transformPosition(position){
        return {x: position.x, y: -position.y};
    }

    emph(partRef){
        partRef.render.visible = true;
    }

    deemph(partRef){
        partRef.render.visible = false;
    }

    setLocation(partRef, x, y){
        Matter.Body.setPosition(partRef, {x: x, y: -y});
    }

    setLocationPair(partRef, pair){
        Matter.Body.setPosition(partRef, {x: pair.x, y: -pair.y});
    }

    disableCollision(partRef){
        partRef.collisionFilter.category = 0;
    }

    enableCollision(partRef){
        partRef.collisionFilter.category = 1;
    }

    setVelocity(partRef, velPair){
        Matter.Body.setVelocity(partRef, {x: velPair.x, y: -velPair.y});
    }
}

export {MatterJsPhysics}

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
	}

    handleCollisionStart(event){
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
                controllerB.handleCollisionWith(controllerA, pair);
            }else{
                controllerA.handleCollisionWith(controllerB, pair);
            }
        }
    }

    handleCollisionEnd(event){
    }

    render(){
        let xSize = this.settings.field.xSize;
        let ySize = this.settings.field.ySize;
        let renderScale = this.settings.field.renderScale;
        let corners = [-1, 1].map((xdir) => [-1, 1].map((ydir) => ({x: 0.5*xSize*xdir, y: 0.5*ySize*ydir}))).flat(2);
        this.render = Matter.Render.create({
            element: document.body, 
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

    generateForce(part, from, magnitude, direction){
        from = this.transformPosition(from);
        let directedForce = {x: magnitude*Math.sin(direction), y: -magnitude*Math.cos(direction)};
        Matter.Body.applyForce(part, from, directedForce);
    }

    join(parts, controller){
		let rootPart = Matter.Body.create();
		Matter.Body.setParts(rootPart, parts);
        // fix inertia because matterjs is broken
        let realAreaMoment = parts.map(x => {
            let dx = x.position.x - rootPart.position.x;
            let dy = x.position.y - rootPart.position.y;
            return x.area * Math.sqrt(dx*dx + dy*dy);
        }).reduce((x, y) => x+y, 0);
        Matter.Body.setInertia(rootPart, realAreaMoment);
        this.controllers[rootPart.id] = controller;
        return rootPart;
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

    getOmega(partRef){
        return partRef.angularVelocity;
    }

    getLocation(partRef){
        return this.transformPosition(partRef.position);
    }

    getId(partRef){
        return partRef.id;
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
        partRef.position = {x: x, y: -y};
    }
}

export {MatterJsPhysics}

class MatterJsPhysics {
    constructor(settings){
        this.engine = Matter.Engine.create();
        this.settings = settings;
    }

    stage(){
        this.engine.gravity.x = 0;
        this.engine.gravity.y = 0;
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
            }});
		Matter.Render.run(this.render);
    }

	drawPart(x, y, theta, physBlock){
        let sideAngle = Math.PI * 2 / physBlock.sides;
        let vertices = []
        for(let side = 0; side<physBlock.sides; side++){
            let vertexTheta = theta + (physBlock.sides % 2 == 0 ? (side+0.5)*sideAngle : side*sideAngle);
            vertices.push({x: physBlock.radius*Math.sin(vertexTheta), y: physBlock.radius*Math.cos(vertexTheta)});
        }

        let body = Matter.Body.create({
            position: {x: x, y: y},
            mass: physBlock.mass,
            vertices: vertices,
            frictionAir: 0,
        });
		return body;
	}

    join(parts){
		let rootPart = Matter.Body.create();
		Matter.Body.setParts(rootPart, parts);
        return rootPart;
    }

    add(part){
		Matter.Composite.add(this.engine.world, part);
    }

    tick(seconds){
        Matter.Engine.update(this.engine, seconds*1000);
    }

    setOmega(partRef, omega){
        Matter.Body.setAngularVelocity(partRef, omega);
    }
}

export {MatterJsPhysics}

class MatterJsPhysics {
    constructor(){
        this.engine = Matter.Engine.create();
        this.engine.gravity.x = 0;
        this.engine.gravity.y = 0;

    }

    stage(){
		var ground = Matter.Bodies.rectangle(400, 610, 2810, 60, { isStatic: true });
	}

    render(){
        let corners = [-1, 1].map((xdir) => [-1, 1].map((ydir) => ({x: 800*xdir, y: 800*ydir}))).flat(2);
        this.render = Matter.Render.create({element: document.body, engine: this.engine, bounds: Matter.Bounds.create(corners)});
		Matter.Render.run(this.render);
        this.runner = Matter.Runner.create();
        Matter.Runner.run(this.runner, this.engine);
    }

    add(physTree){
		let parts = this.addAt(0, 0, 0, physTree).flat(1000);
		let rootPart = Matter.Body.create();
		Matter.Body.setParts(rootPart, parts);
		Matter.Composite.add(this.engine.world, rootPart);
    }

	addAt(turtleX, turtleY, turtleTheta, physTree){
		let newTheta = turtleTheta + physTree.rotation;
		let newX = turtleX + Math.sin(newTheta)*physTree.translation;
		let newY = turtleY + Math.cos(newTheta)*physTree.translation;

		let body = this.drawPart(newX, newY, newTheta, physTree.block);
		let childBodies = physTree.children.map(branch => this.addAt(newX, newY, newTheta, branch));

		return [childBodies, body];
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
        });
		return body;
	}

}

export {MatterJsPhysics}

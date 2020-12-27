class ShipPhys {
    constructor(){
        this.parts = PhysBranch();
    }
}

class PhysBranch {
    static fromDesign(design) {

    }

    constructor({
        parent,
        translation_offset,
        rotation_offset,
        part, 
    } = {}){

        this.parent = parent;
        this.translation_offset=translation_offset;
        this.rotation_offset=rotation_offset;
        this.part = part;
    }
}

class PhysPart {
    constructor({
        radius_m, 
        density_kgPerM3,
        sides} = {}){

        this.radius = radius_m;
        this.density = density_kgPerM3;
        this.sides = sides;

        this.mass = 
            this.radius
            *this.radius
            *this.density
            *Math.pow(1.1, sides)
    }
}

class Physics {

    boundsTrim(physTree){
        // Use a temporary area 
        return 0;
    }

    stage(){
        // Set up the simulated area
        return 0;
    }

    add(physTree){
        return 0;
    }
}

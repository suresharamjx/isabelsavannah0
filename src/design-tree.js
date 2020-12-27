import {randInt, randFloat, randIntDecaying} from './rand.js'
import {Range, RangedValue, RangedInteger} from './experiment-util.js'
import {PhysBranch, PhysPayload, PhysBlock} from './phys-tree.js'

class DesignBranch{
    constructor(values, payload, children){
        this.values = values;
        this.payload = payload;
        this.children = children;
    } 
    
    static defaults(params = {}){ 
        return rangesMerge({
            radius: new RangedValue(4, new Range(1, 256, null)),
            density: new RangedValue(0.3, new Range(0.01, 1, null)),
            sides: new RangedInteger(6, new Range(3, 12, null))
        }, params);
    }

    build(rotation, translation, root){
        let mass = this.values.radius.value * this.values.radius.value;
        let block = new PhysBlock(this.values.sides.value, this.values.radius.value, mass, new PhysPayload(this.payload.type));

        let sideAngle = 2*Math.PI/this.values.sides.value;
        let availSides = this.values.sides.value - (root ? 0 : 1);
        let hasPoint = availSides % 2 == (root ? 1 : 0);

        let offerings = this.children.map((ch) => ch.offering()); 

        let children = [];

        for(let i=0; i<availSides; i++){
            var childAngle;
            var symmetry;
            if(i==0 && !hasPoint){
                childAngle = 0;
                symmetry = 0;
            }else if(i == availSides-1 && root){
                childAngle = Math.PI;
                symmetry = 0;
            }else{
                let pointBasisAngle = (hasPoint ? sideAngle/2 : sideAngle);

                let pointSideOffset = (hasPoint ? 0 : 1);
                let sideRotateCount = Math.floor((i-pointSideOffset)/2);

                symmetry = ((i-pointSideOffset)%2 == 0 ? -1 : 1);
                childAngle = (pointBasisAngle + (sideRotateCount * sideAngle)) * symmetry;
            }
            let progression = Math.abs(childAngle/Math.PI);

            let weighted = offerings.map((of) => [of.offer(progression, symmetry), of]);
            let sum = weighted.map(x => x[0]).reduce((a, b) => a+b, 0);

            let rand = randFloat(Math.max(sum, 1));
            for(let pair of weighted){
                rand -= pair[0];
                if(rand<=0){
                    let child = pair[1].select();
                    let ours = sideRadius(this.values.sides.value, this.values.radius.value);
                    let theirs = sideRadius(child.values.sides.value, child.values.radius.value);
                    let childDistance = ours + theirs + Math.min(ours, theirs)/10;
                    children.push(child.build(childAngle, childDistance, false));
                    break;
                }
            }
        }
        return new PhysBranch(rotation, translation, block, children);
    }
}

class DesignPayload{
    constructor(type){
        this.type = type;
    }
}

class ChildOffering{
    constructor(rel, child){
        this.rel = rel.values;
        this.remaining = rel.values.maxCount.value;
        this.child = child;
    }

    offer(progression, side){
        let weight = this.rel.weight.value;
        let sym = this.rel.symmetry.value;
        let after = this.rel.after.value;
        if(this.remaining <= 0){
            return 0;
        }
        if(after > 0 && after > progression){
            return 0;
        }
        if(after < 0 && (-after < progression)){
            return 0;
        }
        if(sym < 0 && side > 0){
            return sym * -1 * weight;
        }
        if(sym > 0 && side < 0){
            return sym * weight;
        }
        return weight;
    }

    select(){
        this.remaining--;
        return this.child;
    }
}

class ChildRelationship{
    constructor(values, child){
        this.values = values;
        this.child = child;
    }

    static defaults(params = {}){
        return rangesMerge({
            maxCount: new RangedInteger(1, new Range(1, 64, null)),
            symmetry: new RangedValue(0, new Range(-1, 1, null)),
            after: new RangedValue(0, new Range(-1, 1, null)),
            weight: new RangedValue(1, new Range(0, 1, null)),
            sortKey: new RangedInteger(50, new Range(1, 100, null))
        }, params);
    }

    offering(){
        return new ChildOffering(this, this.child);
    }
}

function rangesMerge(rangesDict, overwritesDict){
    for(let key in overwritesDict){
        rangesDict[key].value = overwritesDict[key];
    }

    return rangesDict;
}

function sideRadius(sides, radius){
    let sideAngle = Math.PI * 2 / sides / 2;
    let adjacent = Math.cos(sideAngle)*radius;
    return adjacent;
}

function seed(){
    return new DesignBranch(DesignBranch.defaults({sides: 6}), 
        new DesignPayload("none"), [
            new ChildRelationship(ChildRelationship.defaults({after: -0.2, maxCount: 1, sortKey: 25,}), 
                new DesignBranch(DesignBranch.defaults({radius:16}), new DesignPayload("none"), [])),
            new ChildRelationship(ChildRelationship.defaults({after: 0.5, maxCount: 3, sortKey: 75}),
                new DesignBranch(DesignBranch.defaults({radius:3, sides: 3}), new DesignPayload("none"), [
                    new ChildRelationship(ChildRelationship.defaults({maxCount: 2}),
                        new DesignBranch(DesignBranch.defaults({radius:2, sides: 3}), new DesignPayload("thruster"), []))]
                ))
        ]);
}

export {seed}
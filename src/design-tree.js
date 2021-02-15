import {randInt, randFloat, randIntDecaying, randChoice} from './rand.js'
import {Range, RangedValue, RangedInteger} from './experiment-util.js'
import {PhysBranch, PhysPayload, PhysBlock} from './phys-tree.js'

let straight = '│';
let branch = '├';
let lastBranch = '└';
let horiz = '─'
let blank = ' ';

class Design{
    constructor(tree, meta){
        this.tree = tree;
        this.meta = meta;
    }

    pretty(){
        let lines = this.tree.pretty('│');
        let p = roundTo(this.meta.angularControl.p.value, 5);
        let d = roundTo(this.meta.angularControl.d.value, 4);
        let i = roundTo(this.meta.angularControl.i.value, 6);
        let ti= roundTo(this.meta.angularControl.ti.value, 4);
        lines.push(`angular control parameters: [p: ${p}, d: ${d}, i: ${i}, ti: ${ti}]`)
        return lines;
    }
}

function extendPrefix(prefix, next){
    return prefix.replaceAll(branch, straight).replaceAll(lastBranch, blank) + next;
}

function reproduceDesign(a, b, settings){
    let result = new Design(reproduceTree(a.tree, b.tree, settings), reproduceValues(a.meta, b.meta, settings));
    return result;
}

function reproducePayload(a, b, settings){
    if(Math.random() < settings.mutationChance){
        return new DesignPayload(randChoice(['none', 'thruster']));
    }else{
        return Math.random() < 0.5 ? a : b;
    }
}

function reproduceTree(a, b, settings){
    let keyedBranches = {};
    for(let parent of [a, b]){
        for(let child of parent.children){
            let key = child.values.sortKey.value;
            if(!(key in keyedBranches)){
                keyedBranches[key] = [];
            }
            keyedBranches[key].push(child);
        }
    }

    var targetKeys = Object.keys(keyedBranches);
    if(Math.random() < settings.mutationChance){
        let removed = randChoice(targetKeys);
        delete keyedBranches[removed];
        targetKeys = Object.keys(keyedBranches);
    }

    if(Math.random() < settings.mutationChance){
        let addlKey = randInt(0, 100);
        if(!targetKeys.includes(addlKey)){
            targetKeys.push(addlKey);
        }
    }

    let newChildren = [];
    let spontaneousKeys = [];

    for(let key of targetKeys){
        let parents = keyedBranches[key];
        if(!parents){
            let newRelationshipValues = reproduceValues(ChildRelationship.defaults(), ChildRelationship.defaults(), settings);
            let newBranchValues = reproduceValues(DesignBranch.defaults(), DesignBranch.defaults(), settings);
            newRelationshipValues.sortKey.value = key;

            let newChild = new ChildRelationship({}, new DesignBranch({}, new DesignPayload(randChoice(["none", "thruster"])), []));
            newChild.values = newRelationshipValues;
            newChild.child.values = newBranchValues;

            newChildren.push(newChild);
        }else if(parents.length == 1){
            if(Math.random() < 0.5){
                newChildren.push(parents[0]);
            }
        }else{
            let newChild = reproduceChild(parents[0], parents[1], settings);
            let newChildKey = newChild.values.sortKey.value;
            if(key != newChildKey && (targetKeys.includes(newChildKey) || spontaneousKeys.includes(newChildKey))){
                continue;
            }
            spontaneousKeys.push(newChildKey);
            newChildren.push(newChild);
        }
    }

    let r = new DesignBranch(
        {},
        reproducePayload(a.payload, b.payload, settings),
        newChildren);
    r.values = reproduceValues(a.values, b.values, settings);
    return r;
}

function reproduceValues(a, b, settings){
    let result = {};
    for(let key in a){
        let aRVal = a[key];
        let bRVal = b[key];
        if(!aRVal.range){
            result[key] = reproduceValues(aRVal, bRVal, settings);
            continue;
        }

        let base = Math.random() < 0.5 ? aRVal.value : bRVal.value;
        if(Math.random() < settings.mutationChance){
            var mod = 2*Math.random() - 1;
            if(Math.random() < 0.5){
                mod *= (aRVal.range.max - aRVal.range.min);
            }else{
                mod *= base;
            }
            mod *= settings.mutationAmountMax;
            if(aRVal.integer){
                if(mod > 0){
                    mod = Math.max(mod, 1);
                }else if(mod < 0){
                    mod = Math.min(mod, -1);
                }
            }

            base += mod;
        }
        if(aRVal.integer){
            let resultVal = Math.min(aRVal.range.max, Math.max(bRVal.range.min, Math.round(base)));
            result[key] = new RangedInteger(resultVal, aRVal.range);
        }else{
            let resultVal = Math.min(aRVal.range.max, Math.max(aRVal.range.min, base));
            result[key] = new RangedValue(resultVal, aRVal.range);
        }
    }

    return result;
}

function reproduceChild(a, b, settings){
    let r = new ChildRelationship(
        {},
        reproduceTree(a.child, b.child, settings)
    );
    r.values = reproduceValues(a.values, b.values, settings);
    return r;
}

function polygonName(n){
    switch(n) {
        case 3: return 'triangle'
        case 4: return 'square'
        case 5: return 'pentagon'
        case 6: return 'hexagon'
        case 7: return 'heptagon'
        case 8: return 'octagon'
        case 9: return 'nonagon'
        case 10: return 'decagon'
        default: return (n+"-gon")
    }
}

function roundTo(n, places){
    let factor = 10**places;
    return Math.round(n*factor)/factor;
}

class DesignBranch{
    constructor(values, payload, children){
        this.values = values;
        this.payload = payload;
        this.children = children;
        children[0];
    } 
    
    static defaults(params = {}){ 
        return rangesMerge({
            radius: new RangedValue(64, new Range(16, 1024, null)),
            density: new RangedValue(3, new Range(0.1, 10, null)),
            sides: new RangedInteger(6, new Range(3, 12, null))
        }, params);
    }

    pretty(prefix){
        var me = `a radius ${Math.round(this.values.radius.value)} ${polygonName(this.values.sides.value)}, density ${roundTo(this.values.density.value, 1)}`
        if(this.payload.type != 'none'){
            me += ' carrying a ' + this.payload.type;
        }

        let lines = [prefix+me];
        for(let i in this.children){
            let child = this.children[i];
            for(let line of child.pretty(extendPrefix(prefix, (i == this.children.length - 1 ? lastBranch : branch)))){
                lines.push(line);
            }
        }

        return lines;
    }


    build(){
        return this.buildR(0, 0, true);
    }

    buildR(rotation, translation, root){
        let mass = this.values.radius.value * this.values.radius.value * this.values.density.value;
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
                    let childDistance = ours + theirs + Math.max(ours, theirs)/5;
                    children.push(child.buildR(childAngle, childDistance, false));
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
            return (1+sym) * weight;
        }
        if(sym > 0 && side < 0){
            return (1-sym) * weight;
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
            maxCount: new RangedInteger(4, new Range(1, 64, null)),
            symmetry: new RangedValue(0, new Range(-1, 1, null)),
            after: new RangedValue(0, new Range(-1, 1, null)),
            weight: new RangedValue(1, new Range(0, 1, null)),
            sortKey: new RangedInteger(50, new Range(1, 100, null))
        }, params);
    }

    offering(){
        return new ChildOffering(this, this.child);
    }

    pretty(prefix){
        let count = `up to ${this.values.maxCount.value} copies`;

        let symmetryVal = this.values.symmetry.value;
        var symmetry = null;
        if(symmetryVal == 0){
            symmetry = 'symmetrically distributed';
        }else if(symmetryVal > 0){
            symmetry = `biased ${roundTo(symmetryVal, 2)} rightwards`;
        }else{
            symmetry = `biased ${roundTo(-symmetryVal, 2)} leftwards`;
        }

        let angleVal = this.values.after.value;
        let angleDeg = Math.round(angleVal/Math.PI*180);
        var angle = null;
        if(angleDeg >= 0){
            angle = `after ${angleDeg} degrees`;
        }else{
            angle = `before ${-angleDeg} degrees`;
        }

        let weight = roundTo(this.values.weight.value, 2);
        let sortKey = this.values.sortKey.value;

        let me = `${count} of a child, ${symmetry}, ${angle}, with chance ${weight}, dedupe key ${sortKey}`;
        let mine = prefix + me;

        let lines = [mine];
        for(let line of this.child.pretty(extendPrefix(prefix, lastBranch))){
            lines.push(line);
        }

        return lines;
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

let seedTree = 
    new DesignBranch(DesignBranch.defaults({radius:90, sides: 8}), 
        new DesignPayload("none"), [
            new ChildRelationship(ChildRelationship.defaults({after: -0.2, maxCount: 1, sortKey: 25,}), 
                new DesignBranch(DesignBranch.defaults({radius:170, sides:3}), new DesignPayload("none"), [
                    new ChildRelationship(ChildRelationship.defaults({after: -0.5, maxCount: 4, sortKey: 75}),
                        new DesignBranch(DesignBranch.defaults({radius:70, sides: 5}), new DesignPayload("none"), [
                            new ChildRelationship(ChildRelationship.defaults({maxCount: 4}),
                                new DesignBranch(DesignBranch.defaults({radius:30, sides: 3}), new DesignPayload("thruster"), []))]
                        ))])),
            new ChildRelationship(ChildRelationship.defaults({after: 0.5, maxCount: 5, sortKey: 75}),
                new DesignBranch(DesignBranch.defaults({radius:40, sides: 5}), new DesignPayload("none"), [
                    new ChildRelationship(ChildRelationship.defaults({maxCount: 4}),
                        new DesignBranch(DesignBranch.defaults({radius:40, sides: 3}), new DesignPayload("thruster"), []))]
                ))
    ]);

let seedMeta = {
    angularControl: {
        p: new RangedValue(0.08, new Range(0.001, 0.1, null)),
        d: new RangedValue(1, new Range(0, 4, null)),
        ti: new RangedInteger(150, new Range(10, 500, null)),
        i: new RangedValue(0.003, new Range(0, 0.01, null)),
    },
}

let seed = new Design(seedTree, seedMeta);

export {seed, reproduceDesign}

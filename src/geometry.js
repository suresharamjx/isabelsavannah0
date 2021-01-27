function navigate(currentLoc, targetLoc){
    let dx = targetLoc.x - currentLoc.x;
    let dy = targetLoc.y - currentLoc.y;

    if(dy == 0){
        return dx > 0 ? Math.PI/2 : 3*Math.PI/2;
    }

    if(dy > 0){
        return modCircle(Math.atan(dx/dy));
    }else{
        return modCircle(Math.PI + Math.atan(dx/dy));
    }
}

function modCircle(theta, min=0, max=Math.PI*2){
    if(theta >= max){
        let circles = Math.ceil((theta-max)/Math.PI/2);
        return theta - (Math.PI*2*circles);
    }else if(theta < min){
        let circles = Math.ceil((min-theta)/Math.PI/2);
        return theta + (Math.PI*2*circles);
    }else{
        return theta;
    }
}

function modCircleDelta(theta){
    return modCircle(theta, -Math.PI, Math.PI);
}

export {modCircle, modCircleDelta, navigate}

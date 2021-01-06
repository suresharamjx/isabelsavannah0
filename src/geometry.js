function navigate(currentLoc, targetLoc){
    let dx = targetLoc.x - currentLoc.x;
    let dy = targetLoc.y - currentLoc.y;
    dy *= -1;

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
    while(theta >= max){
        theta -= Math.PI*2;
    }
    while(theta < min){
        theta += Math.PI*2;
    }
    return theta;
}

function modCircleDelta(theta){
    return modCircle(theta, -Math.PI, Math.PI);
}

export {modCircle, modCircleDelta, navigate}

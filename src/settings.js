let defaults = {
    food: {
        sides: 3,
        radius: 30,
        omega: .1,
        concurrent: 20,
        initial: 3,
        value: 2000,
    },

    field: {
        xSize: 16000,
        ySize: 16000,
        renderScale: 16,
    },

    pool: {
        recordsStable: 1000,
        recordsUnstable: 20,
        concurrentPopulation: 4,
        concurrentStablePopulation: 2,
        stableRuns: 5,
        minStableForReproduction: 40,
    },

    ship: {
        initialFood: 0.03,
        metabolisim: .00001,
        agingBasis: 5000,
        scoringRatio: 0.001,
        scoreThreshold: 5,
        thrusterPowerMassRatio: 0.02,
        massMetabolisimMin: 1000,
        collisionDamagePerTick: 1,
        shootingTargetInterval: 100,
    },

    turret: {
        omegaMax: 1,
        spread: Math.PI/32,
        maxCooldown: 100,
        range: 5000,
    },

    bullet: {
        massDamageRatio: 0.1,
        radius: 20,
        sides: 4,
        omega: 0.2,
        spread: Math.PI/16,
        velocity: 50,
        fuseDuration: 0.05,
        timeout: 2,
    },

    physicsTickTime: 0.01,
    displayTickTime: (1/120),

    mutationChance: 0.015,
    mutationAmountMax: 0.4,
}

export {defaults}

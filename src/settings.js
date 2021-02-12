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
        xSize: 10000,
        ySize: 10000,
        renderScale: 10,
    },

    pool: {
        recordsStable: 1000,
        recordsUnstable: 20,
        concurrentPopulation: 8,
        concurrentStablePopulation: 2,
        stableRuns: 5,
        minStableForReproduction: 40,
    },

    ship: {
        initialFood: 0.03,
        metabolisim: .00002,
        agingBasis: 5000,
        scoringRatio: 0.001,
        scoreThreshold: 5,
        thrusterPowerMassRatio: 0.04,
        massMetabolisimMin: 10000,
        collisionDamagePerTick: 1,
    },

    physicsTickTime: 0.01,
    displayTickTime: (1/120),

    mutationChance: 0,
    mutationAmountMax: 0.2,
}

export {defaults}

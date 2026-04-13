/**
 * AoE4 Production Calculator - Core Calculation Engine
 * Ported from https://github.com/SichYuriy/aoe4-production-calculator
 */

// ---- ResourcesAmount ----
class ResourcesAmount {
    constructor(food = 0, wood = 0, gold = 0, stone = 0) {
        this.food = food;
        this.wood = wood;
        this.gold = gold;
        this.stone = stone;
    }

    static of(food, wood, gold, stone) {
        return new ResourcesAmount(food, wood, gold, stone);
    }

    static ofZero() { return new ResourcesAmount(); }
    static ofFood(f) { return new ResourcesAmount(f, 0, 0, 0); }
    static ofWood(w) { return new ResourcesAmount(0, w, 0, 0); }
    static ofGold(g) { return new ResourcesAmount(0, 0, g, 0); }
    static ofStone(s) { return new ResourcesAmount(0, 0, 0, s); }

    static ofObj(obj) {
        return new ResourcesAmount(obj.food || 0, obj.wood || 0, obj.gold || 0, obj.stone || 0);
    }

    add(other) {
        return ResourcesAmount.of(
            this.food + other.food, this.wood + other.wood,
            this.gold + other.gold, this.stone + other.stone
        );
    }

    multiply(other) {
        return ResourcesAmount.of(
            this.food * other.food, this.wood * other.wood,
            this.gold * other.gold, this.stone * other.stone
        );
    }

    addNumber(val) {
        return ResourcesAmount.of(
            this.food + val, this.wood + val,
            this.gold + val, this.stone + val
        );
    }

    multiplyByNumber(val) {
        return ResourcesAmount.of(
            this.food * val, this.wood * val,
            this.gold * val, this.stone * val
        );
    }

    divideByNumber(val) {
        return ResourcesAmount.of(
            this.food / val, this.wood / val,
            this.gold / val, this.stone / val
        );
    }

    subtractToZero(other) {
        return ResourcesAmount.of(
            Math.max(this.food - other.food, 0),
            Math.max(this.wood - other.wood, 0),
            Math.max(this.gold - other.gold, 0),
            Math.max(this.stone - other.stone, 0)
        );
    }

    divideByGatheringRate(rates) {
        return {
            foodVillagers: rates.food > 0 ? this.food / rates.food : 0,
            woodVillagers: rates.wood > 0 ? this.wood / rates.wood : 0,
            goldVillagers: rates.gold > 0 ? this.gold / rates.gold : 0,
            stoneVillagers: rates.stone > 0 ? this.stone / rates.stone : 0,
        };
    }
}

// ---- CalculationUtil ----
const CalculationUtil = {
    roundVillagerCost(amount) {
        if (amount - Math.floor(amount) < 0.3) {
            return Math.floor(amount);
        }
        return Math.ceil(amount);
    }
};

// ---- GatheringRatesService ----
class GatheringRatesService {
    getGatheringRates(foodSource, modifiers, resourceDropOffModifiers) {
        return this.getCalculatedGatheringRates(foodSource, modifiers, resourceDropOffModifiers);
    }

    getCalculatedGatheringRates(foodSource, modifiers, resourceDropOffModifiers) {
        let base = {
            food: this._getFoodRate(foodSource),
            gold: BASE_GATHERING_RATES.gold,
            wood: BASE_GATHERING_RATES.wood,
            stone: BASE_GATHERING_RATES.stone
        };

        let modifierIds = modifiers.map(m => m.id);
        let modified = modifiers.reduce(
            (prev, mod) => mod.apply(prev, foodSource, modifierIds),
            base
        );

        let dropOffBonus = (resourceDropOffModifiers || [])
            .map(m => m.getDropOffPercentage((resourceDropOffModifiers || []).map(x => x.id)))
            .map(ResourcesAmount.ofObj)
            .reduce((prev, cur) => prev.add(cur), new ResourcesAmount());

        let dropOffMultiplier = dropOffBonus.divideByNumber(100).addNumber(1);
        return ResourcesAmount.ofObj(modified).multiply(dropOffMultiplier);
    }

    _getFoodRate(foodSource) {
        const rates = {
            SHEEP: BASE_GATHERING_RATES.sheep,
            CATTLE: BASE_GATHERING_RATES.cattle,
            BERRY: BASE_GATHERING_RATES.berry,
            DEER: BASE_GATHERING_RATES.deer,
            TWIN_MINARET_BERRY: BASE_GATHERING_RATES.twinMinaretBerry || 39.91,
            STOCKYARD: BASE_GATHERING_RATES.stockyard,
            FARM: BASE_GATHERING_RATES.farm
        };
        return rates[foodSource] || rates.FARM;
    }
}

// ---- LimitedFoodGatheringSourceService ----
class LimitedFoodGatheringSourceService {
    constructor(gatheringRatesService) {
        this.gatheringRatesService = gatheringRatesService;
    }

    getAvailableGatheringSources(sourcesState, gatheringRateModifiers, resourceDropOffModifiers) {
        return sourcesState.map(state => {
            let modifier = ALL_LIMITED_FOOD_GATHERING_SOURCE_MODIFIERS[state.id];
            if (!modifier) return null;
            let rate = this.gatheringRatesService.getCalculatedGatheringRates(
                modifier.foodSource, gatheringRateModifiers, resourceDropOffModifiers
            ).food;
            return {
                effectiveGatheringRate: rate,
                maxVillagers: Math.floor(modifier.gatheringRateLimit / rate)
            };
        }).filter(Boolean);
    }

    sendVillagersToUniqueSources(sources, neededPerMinute) {
        let sorted = [...sources].sort((a, b) => b.effectiveGatheringRate - a.effectiveGatheringRate);
        let neededFood = neededPerMinute;
        let result = { villagersCount: 0, gatheringRate: new ResourcesAmount() };

        for (let source of sorted) {
            if (neededFood.food <= 0) break;
            let villagersNeeded = Math.ceil(neededFood.food / source.effectiveGatheringRate);
            let taken = Math.min(villagersNeeded, source.maxVillagers);
            let gathered = source.effectiveGatheringRate * taken;
            result.villagersCount += taken;
            result.gatheringRate = result.gatheringRate.add(ResourcesAmount.ofFood(gathered));
            neededFood = neededFood.subtractToZero(ResourcesAmount.ofFood(gathered));
        }
        return result;
    }
}

// ---- PassiveIncomeService ----
class PassiveIncomeService {
    getPassiveIncome(incomeModifiers, sources) {
        return Object.values(incomeModifiers)
            .filter(state => state.selected)
            .filter(state => {
                let mod = ALL_PASSIVE_INCOME_MODIFIERS[state.id];
                return mod && sources[mod.source] && sources[mod.source].count > 0;
            })
            .map(state => {
                let mod = ALL_PASSIVE_INCOME_MODIFIERS[state.id];
                return ResourcesAmount.ofObj(mod).multiplyByNumber(sources[mod.source].count);
            })
            .reduce((total, cur) => total.add(cur), new ResourcesAmount());
    }

    getDynamicPassiveIncome(incomeModifiers, sources) {
        return Object.values(incomeModifiers)
            .filter(state => state.selected)
            .filter(state => {
                let mod = ALL_DYNAMIC_PASSIVE_INCOME_MODIFIERS[state.id];
                return mod && sources[mod.source] && sources[mod.source].count > 0;
            })
            .map(state => {
                let mod = ALL_DYNAMIC_PASSIVE_INCOME_MODIFIERS[state.id];
                return ResourcesAmount.ofObj(state.value).multiplyByNumber(sources[mod.source].count);
            })
            .reduce((total, cur) => total.add(cur), new ResourcesAmount());
    }

    getPassiveIncomeFromGatheringVillagers(villagersCost, modifiers, foodSource) {
        return modifiers.map(mod => {
            let count = 0;
            if (mod.gatheringResource === 'FOOD' && mod.foodSources.includes(foodSource)) {
                count = CalculationUtil.roundVillagerCost(villagersCost.foodVillagers);
            } else if (mod.gatheringResource === 'WOOD') {
                count = CalculationUtil.roundVillagerCost(villagersCost.woodVillagers);
            } else if (mod.gatheringResource === 'GOLD') {
                count = CalculationUtil.roundVillagerCost(villagersCost.goldVillagers);
            } else if (mod.gatheringResource === 'STONE') {
                count = CalculationUtil.roundVillagerCost(villagersCost.stoneVillagers);
            }
            return ResourcesAmount.ofObj(mod.incomeAmount).multiplyByNumber(count);
        }).reduce((a, b) => a.add(b), ResourcesAmount.ofZero());
    }
}

// ---- ProductionCalculatorService ----
class ProductionCalculatorService {
    constructor(limitedFoodService, passiveIncomeService) {
        this.limitedFoodService = limitedFoodService;
        this.passiveIncomeService = passiveIncomeService;
    }

    calculateProductionVillagerCost(
        gatheringRates, unitsSelected, productionSpeedModifiers,
        costModifiers, passiveIncome, dynamicPassiveIncome,
        limitedFoodSources, passiveIncomeFromGatheringVillagerModifiers,
        foodSource, minFoodVillagers, costModifiersPerUnit
    ) {
        let resourcesNeeded = this._calcResourcesNeeded(
            unitsSelected, productionSpeedModifiers, costModifiers, costModifiersPerUnit
        );

        resourcesNeeded = resourcesNeeded.subtractToZero(passiveIncome);
        resourcesNeeded = resourcesNeeded.subtractToZero(dynamicPassiveIncome);

        let uniqueFoodVillagers = this.limitedFoodService.sendVillagersToUniqueSources(
            limitedFoodSources, resourcesNeeded
        );
        resourcesNeeded = resourcesNeeded.subtractToZero(uniqueFoodVillagers.gatheringRate);

        let villagersCost = resourcesNeeded.divideByGatheringRate(gatheringRates);
        villagersCost.foodVillagers = Math.max(villagersCost.foodVillagers, minFoodVillagers);

        let passiveFromGathering = this.passiveIncomeService
            .getPassiveIncomeFromGatheringVillagers(
                villagersCost, passiveIncomeFromGatheringVillagerModifiers, foodSource
            );
        resourcesNeeded = resourcesNeeded.subtractToZero(passiveFromGathering);
        villagersCost = resourcesNeeded.divideByGatheringRate(gatheringRates);
        villagersCost.foodVillagers = Math.max(villagersCost.foodVillagers, minFoodVillagers);
        villagersCost.foodVillagers += uniqueFoodVillagers.villagersCount;

        return villagersCost;
    }

    _calcResourcesNeeded(unitsSelected, speedModifiers, costModifiers, costModifiersPerUnit) {
        return Object.keys(unitsSelected)
            .map(unitId => {
                let unit = UNITS[unitId];
                if (!unit) return new ResourcesAmount();
                return this._calcUnitCostPerMinute(
                    unit, unitsSelected[unitId], speedModifiers, costModifiers, costModifiersPerUnit || {}
                );
            })
            .reduce((total, cost) => total.add(ResourcesAmount.ofObj(cost)), new ResourcesAmount());
    }

    _calcUnitCostPerMinute(unit, count, speedModifiers, costModifiers, costModifiersPerUnit) {
        let effectiveCost = costModifiers
            .filter(mod => mod.canBeApplied(unit) && !unit.notAffectedByModifiers)
            .reduce((prev, mod) => mod.apply(prev), { ...unit.cost });

        let totalSpeedBonus = speedModifiers
            .filter(mod => mod.canBeApplied(unit) && !unit.notAffectedByModifiers)
            .reduce((total, mod) => total * (1 + mod.productionSpeedBonus), 1);

        let effectiveTime = unit.productionTime / totalSpeedBonus;

        let totalCost = new ResourcesAmount();
        for (let i = 0; i < count; i++) {
            let perUnitCost = Object.keys(costModifiersPerUnit)
                .filter(modId => costModifiersPerUnit[modId] &&
                    costModifiersPerUnit[modId][unit.id] > i &&
                    ALL_COST_MODIFIERS_PER_UNIT[modId])
                .reduce((prev, modId) => ALL_COST_MODIFIERS_PER_UNIT[modId].apply(prev), { ...effectiveCost });
            totalCost = totalCost.add(ResourcesAmount.ofObj(perUnitCost));
        }

        return {
            food: totalCost.food * 60 / effectiveTime,
            wood: totalCost.wood * 60 / effectiveTime,
            gold: totalCost.gold * 60 / effectiveTime,
            stone: totalCost.stone * 60 / effectiveTime
        };
    }
}

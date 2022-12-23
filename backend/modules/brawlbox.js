/**
 * Takes in a probability mass function encoded in an array and
 * randomly selects an index. The probability of an index in the array
 * being selected is the value at that index / the sum of all values.
 * @param {Array} options array of numbers
 * @returns index that was randomly selected
 */
function RNG(options){
    var totalWeight = 0;
    for (let x of options){
        totalWeight += x;
    }

    if (totalWeight == 0){
        return -1;
    }

    var weightRemaining = (Math.random() * totalWeight);

    var index = 0;
    var found = false;
    
    
    for (let x = 0; x < options.length; x++){
        if (found == false){
            weightRemaining -= options[x];
            if (weightRemaining < 0.0){
                index = x;
                found = true;
            }
        }
    }
    
    return index;
}

/**
 * Opens a Brawl Box and directly adds the contents of it to the user.
 * All Brawl Boxes are guaranteed to contain at least one item. If a
 * box is opened and there is no item, an error occurred somewhere.
 * A valid dropChances object must be passed to this function. To make
 * it run faster, the dropChances object is validated only once when
 * being loaded from the file and assumed to be valid from then on.
 * @param {Object} dropChances valid object with drop chances data stored inside
 * @param {String} boxType the type of Brawl Box to open
 * @param {Array} allSkins array of all brawlers and skins in the game
 * @param {Object} resources object containing all of the user's resource amounts that may change
 * @returns array of the items the user received
 */
function brawlBox(dropChances, boxType, allSkins, resources){
    // Validating parameters

    // dropChances has already been validated before being passed
    // to this function

    if (resources === undefined){
        // User is missing all resource information
        return [];
    }
    const resourceProperties = [
        "brawlers",
        "avatars",
        "wild_card_pins",
        "tokens",
        "token_doubler",
        "coins",
        "trade_credits"
    ];
    
    var missingProperties = false;
    for (let x of resourceProperties){
        if (!(resources.hasOwnProperty(x))){
            missingProperties = true;
        }
    }
    if (missingProperties){
        // User is missing some resource information
        return [];
    }

    if (boxType == "bonus" || dropChances.boxes.hasOwnProperty(boxType) == false){
        // Brawl Box type does not exist
        return [];
    }

    // All types of brawl boxes are guaranteed to give at least one drop, even coins
    // If a brawl box gives nothing then an error can be sent back

    // Deduct tokens to pay for the brawl box
    resources.tokens -= dropChances.boxes[boxType].cost;


    var rewards = [];
    var coinsReward = 0;
    
    const draws = dropChances.boxes[boxType].draws;
    const rewardTypeValues = dropChances.boxes[boxType].rewardTypeValues;

    var selections = [];
    for (let x of draws){
        var thisReward = rewardTypeValues[RNG(x)];
        if (thisReward !== undefined){
            selections.push(thisReward);
        }
    }
    //console.log(selections);

    //var selections = ["coins", "pin", "wildcard", "brawler", "bonus"];// for testing, use RNG later
    //selections = ["pin"];
    //selections = ["pinHighRarity", "pinHighRarity", "pinHighRarity", "pinHighRarity", "pinHighRarity", "pinHighRarity"];

    for (let x of selections){
        if (x != "nothing"){
        var drop = {
            "displayName": "",
            "rewardType": "empty",
            "amount": 1,
            "inventory": 0,
            "image": "",
            "backgroundColor": "#000000",
            "description": ""
        };

        
        if (x == "coins"){
            drop = selectCoins(dropChances.rewardTypes.coins, resources);
        } else if (x == "pin" || x == "pinLowRarity" || x == "pinHighRarity" || x == "pinNoDupes"){
            drop = selectPin(dropChances.rewardTypes[x], resources, allSkins);
        } else if (x == "wildcard"){
            drop = selectWildCardPin(dropChances.rewardTypes.wildcard, resources, allSkins);
        } else if (x == "brawler" || x == "brawlerLowRarity" || x == "brawlerHighRarity"){
            drop = selectBrawler(dropChances.rewardTypes[x], resources, allSkins);
        } else if (x == "bonus"){
            drop = selectBonus(dropChances.boxes.bonus, dropChances.rewardTypes, resources);
        }

        if (drop.rewardType == "coins"){
            coinsReward += drop.amount;
        } else if (drop.rewardType != "empty"){
            rewards.push(drop);
        }
        }
    }

    // Add all coin rewards together at the same time
    if (coinsReward > 0){
        rewards.splice(0, 0, {
            "displayName": "Coins",
            "rewardType": "coins",
            "amount": coinsReward,
            "inventory": resources.coins,
            "image": "resource_coins_200x.webp",
            "backgroundColor": "#8CA0E0",
            "description": "Spend these on special avatars and other items in the shop."
        });
    }
    
    return rewards;
}

// All select... functions do the same operation but give a
// different reward type. They take in objects representing
// drop chances and the player's resources. Optionally, they
// may require the allSkins array to select a brawler or pin.
// They then randomly select a drop and add it to the player's
// resources and return an object describing the drop.

function selectCoins(coinsDropChances, resources){
    const amounts = coinsDropChances;
    var rewardAmount = 0;
    if (amounts.minAmount == amounts.maxAmount){
        rewardAmount = amounts.minAmount;
    } else{
        rewardAmount = Math.floor(amounts.minAmount + Math.random() * (amounts.maxAmount - amounts.minAmount + 1));
    }

    resources.coins += rewardAmount;

    var result = {
        "displayName": "",
        "rewardType": "coins",
        "amount": rewardAmount,
        "inventory": 0,
        "image": "",
        "backgroundColor": "",
        "description": ""
    };

    return result;
}

function selectPin(pinDropChances, resources, allSkins){
    var result = {
        "displayName": "",
        "rewardType": "empty",
        "amount": 1,
        "inventory": 0,
        "image": "",
        "backgroundColor": "#000000",
        "description": ""
    };

    var userCollection = resources.brawlers;
    //var raritypmf = [36, 15, 6, 3, 0];
    //var raritypmf = [0, 0, 0, 0, 0];
    //var raritypmf = pinDropChances.raritypmf;
    var modifiedRaritypmf = [0, 0, 0, 0, 0];
    const raritypmf = pinDropChances.raritypmf;
    const minraritypmf = pinDropChances.minraritypmf;
    const newPinWeight = pinDropChances.newPinWeight;
    var pinsByRarity = [[], [], [], [], []];
    var duplicatePins = [[], [], [], [], []];

    if (raritypmf.length != minraritypmf.length){
        return result;
    }
    
    var availablePins = [];
    
    for (var brawlerIndex = 0; brawlerIndex < allSkins.length; brawlerIndex++){
        let brawler = allSkins[brawlerIndex];

        //var missingProperties = (!(brawler.hasOwnProperty("name") && brawler.hasOwnProperty("pins")));
        if (brawler.hasOwnProperty("name") && brawler.hasOwnProperty("pins")){
            //var hasBrawler = userCollection.hasOwnProperty(brawler.name);

            if (userCollection.hasOwnProperty(brawler.name)){
                for (let pinIndex = 0; pinIndex < brawler.pins.length; pinIndex++){
                    const pinRarity = brawler.pins[pinIndex].rarity.value;
                    const pinAmount = userCollection[brawler.name][brawler.pins[pinIndex].name];
                    //if (pinRarity < pinsByRarity.length && userCollection[brawler.name].includes(brawler.pins[pinIndex].name) == false){
                    if (pinRarity < pinsByRarity.length){
                        // Add the brawler's index and the pin's index so when the random pin has to be
                        // chosen, the link to the pin object can be easily found without storing the
                        // entire pin data in an array.

                        //availablePins.push([brawlerIndex, pinIndex]);
                        if (pinAmount !== undefined && pinAmount > 0){
                            duplicatePins[pinRarity].push([brawlerIndex, pinIndex]);
                        } else{
                            pinsByRarity[pinRarity].push([brawlerIndex, pinIndex]);
                        }
                    }
                }
            }
        }
    }

    // Rarities that have all pins collected will have a lower chance of
    // being selected. This chance is stored in minraritypmf.
    // Since this affects the drop chances even when all pins are collected,
    // resulting in more copies of high-rarity pins, the relative rarities
    // are the same in minraritypmf as they are in raritypmf.

    for (let r = 0; r < modifiedRaritypmf.length; r++){
        // newPinWeight modifies the chances of getting duplicates
        if (pinsByRarity[r].length == 0){
            modifiedRaritypmf[r] = minraritypmf[r];
        } else{
            modifiedRaritypmf[r] = raritypmf[r];
        }
    }
    //console.log(modifiedRaritypmf);
    selectedRarity = RNG(modifiedRaritypmf);

    
    var duplicate = false;// used to determine whether the pin received was a duplicate then send the correct message to the user
    if (selectedRarity >= 0){
        const newPinCount = pinsByRarity[selectedRarity].length;
        const duplicatePinCount = duplicatePins[selectedRarity].length;

        var duplicateProbability = 0;
        // Every pin that can be collected has a weight which represents how likely it is to
        // be chosen.
        
        // The probability of a specific pin being chosen is its weight divided by the sum of all pins' weight in that rarity.
        
        // To make it easier to collect new pins when a user does not yet have them all,
        // new pins' weight are multiplied by newPinWeight[selectedRarity], making them
        // more likely to drop than duplicate pins.

        // If there are no more new pins available (pinsByRarity[selectedRarity].length == 0)
        // then every pin will be a duplicate, as long as there are also duplicate pins available.
        // In this case, the value of duplicateProbability does not do anything.
        // If the selected rarity has no pins available, coins will be given instead.

        if (duplicatePinCount > 0 && newPinWeight[selectedRarity] > 0){
            //duplicateProbability = (1 / newPinWeight[selectedRarity]) * (duplicatePinCount / (newPinCount + duplicatePinCount));
            duplicateProbability = (duplicatePinCount / (newPinCount * newPinWeight[selectedRarity] + duplicatePinCount));
        }
        
        //if (newPinWeight[selectedRarity] > 0) console.log("Selected Rarity:", selectedRarity, " New Pins:", newPinCount, " Duplicate Pins:", duplicatePinCount,
        //    " Probability of a new pin: ", newPinCount * newPinWeight[selectedRarity], "/", (newPinCount * newPinWeight[selectedRarity] + duplicatePinCount),
        //    " Probability of a duplicate pin:", duplicatePinCount, "/", (newPinCount * newPinWeight[selectedRarity] + duplicatePinCount)
        //);

        // Math.random() > duplicateProbability is the same as Math.random() < (1 - duplicateProbability)
        if (Math.random() >= duplicateProbability && newPinCount > 0){
            availablePins = pinsByRarity[selectedRarity];
        } else if (duplicatePinCount > 0){
            duplicate = true;
            availablePins = duplicatePins[selectedRarity];
        }
    }

    // If there are pins available to collect, randomly select one and add it.
    // Otherwise, give coins as an alternative reward.
    if (availablePins.length > 0){
        const selectedPin = availablePins[Math.floor(Math.random() * availablePins.length)];
        const brawlerObject = allSkins[selectedPin[0]];
        const pinObject = brawlerObject.pins[selectedPin[1]];
        //userCollection[allSkins[selectedPin[0]].name].push(pinObject.name);
        //userCollection[brawlerObject.name] = userCollection[brawlerObject.name].concat([pinObject.name]);

        // Usually, all the pins must be stored in the database with an amount, even if they are not unlocked yet.
        // In case a certain pin was selected to be given and it does not already exist, create a new property in
        // the object and set its value to 1. This may happen when new pins are released and the existing players'
        // data has not been updated to include the new pins. Because new pins are added automatically here, an
        // update to every user in the database when a new pin gets released is not necessary.
        var brawlerInCollection = userCollection[brawlerObject.name];
        if (brawlerInCollection[pinObject.name] === undefined){
            brawlerInCollection[pinObject.name] = 1;
        } else{
            brawlerInCollection[pinObject.name]++;
        }

        //result.displayName = "New Pin";
        result.rewardType = "pin";
        result.image = brawlerObject.name + "/" + pinObject.image;// add the brawler's name directory
        result.backgroundColor = pinObject.rarity.color;
        result.description = "A Pin for " + brawlerObject.displayName + ".";
        result.inventory = brawlerInCollection[pinObject.name];

        if (duplicate){
            result.displayName = "Duplicate Pin";
            result.backgroundColor = "#808080";
        } else{
            result.displayName = "New Pin";
        }

    } else if (pinDropChances.coinConversion > 0){
        resources.coins += pinDropChances.coinConversion;

        result.rewardType = "coins";
        result.amount = pinDropChances.coinConversion;
    }

    return result;
}

function selectWildCardPin(wildCardDropChances, resources, allSkins){
    var result = {
        "displayName": "",
        "rewardType": "empty",
        "amount": 1,
        "inventory": 0,
        "image": "",
        "backgroundColor": "#000000",
        "description": ""
    };

    //var raritypmf = [36, 15, 6, 3, 0];
    const raritypmf = wildCardDropChances.raritypmf;

    // If the wild card pins array is incorrectly formatted
    // fix it before adding a wild card pin
    if (resources.wild_card_pins.length < raritypmf.length){
        resources.wild_card_pins = [];
        for (let x = 0; x < raritypmf.length; x++){
            resources.wild_card_pins.push(0);
        }
    }

    var selectedRarity = RNG(raritypmf);
    if (selectedRarity >= 0){
        var rarityName = "";
        var rarityColor = "#000000";

        // Look through the allSkins array to get the rarity
        // colors for the pin since there is no other place
        // where they are stored...
        var x = 0;
        var found = false;
        while (x < allSkins.length && found == false){
            if (allSkins[x].hasOwnProperty("pins")){
                for (let y of allSkins[x].pins){
                    if (y.rarity.value == selectedRarity){
                        rarityName = y.rarity.name;
                        rarityColor = y.rarity.color;
                        found = true;
                    }
                }
            }
            x++;
        }
        resources.wild_card_pins[selectedRarity]++;

        result.displayName = rarityName + " Wild Card Pin";
        result.rewardType = "wildcard";
        result.image = "wildcard_pin.webp";
        result.backgroundColor = rarityColor;
        result.description = "This can be used in place of a Pin of " + rarityName + " rarity when accepting a trade.";
        result.inventory = resources.wild_card_pins[selectedRarity];
    }
    // Wild card pins can always be collected so there is no coins
    // alternative reward available here.

    return result;
}

function selectBrawler(brawlerDropChances, resources, allSkins){
    // Refer to selectPins for comments, most of the logic is the
    // same except brawlers are being added instead of pins
    var result = {
        "displayName": "",
        "rewardType": "empty",
        "amount": 1,
        "inventory": 0,
        "image": "",
        "backgroundColor": "#000000",
        "description": ""
    };

    var userCollection = resources.brawlers;
    //var raritypmf = [32, 16, 8, 4, 2, 1, 1];
    var raritypmf = [0, 0, 0, 0, 0, 0, 0];
    var brawlersByRarity = [[], [], [], [], [], [], []];

    if (brawlerDropChances.raritypmf.length != raritypmf.length ||
        brawlerDropChances.minraritypmf.length != raritypmf.length){
        return result;
    }

    var availableBrawlers = [];
    
    for (var brawlerIndex = 0; brawlerIndex < allSkins.length; brawlerIndex++){
        let brawler = allSkins[brawlerIndex];

        if (brawler.hasOwnProperty("name") && brawler.hasOwnProperty("rarity")){
            const brawlerRarity = brawler.rarity.value;
            if (brawlerRarity < brawlersByRarity.length && userCollection.hasOwnProperty(brawler.name) == false){
                //availableBrawlers.push(brawlerIndex);
                brawlersByRarity[brawlerRarity].push(brawlerIndex);
            }
        }
    }

    for (let r = 0; r < raritypmf.length; r++){
        if (brawlersByRarity[r].length == 0){
            raritypmf[r] = brawlerDropChances.minraritypmf[r];
        } else{
            raritypmf[r] = brawlerDropChances.raritypmf[r];
        }
    }

    var selectedRarity = RNG(raritypmf);
    if (selectedRarity >= 0){
        availableBrawlers = brawlersByRarity[selectedRarity];
    }
    
    if (availableBrawlers.length > 0){
        const selectedIndex = availableBrawlers[Math.floor(Math.random() * availableBrawlers.length)];
        const brawlerObject = allSkins[selectedIndex];
        if (!(userCollection.hasOwnProperty(brawlerObject.name))){
            userCollection[brawlerObject.name] = {};
        }

        result.displayName = brawlerObject.displayName;
        result.rewardType = "brawler";
        result.image = brawlerObject.portrait;
        result.backgroundColor = brawlerObject.rarity.color;
        result.description = brawlerObject.description;
        result.inventory = 1;
    } else if (brawlerDropChances.coinConversion > 0){
        resources.coins += brawlerDropChances.coinConversion;

        result.rewardType = "coins";
        result.amount = brawlerDropChances.coinConversion;
    }
    
    return result;
}

function selectBonus(allBonusDrops, rewardTypes, resources){
    var result = {
        "displayName": "",
        "rewardType": "empty",
        "amount": 1,
        "inventory": 0,
        "image": "",
        "backgroundColor": "#000000",
        "description": ""
    };

    var userAvatars = resources.avatars;
    var bonuspmf = [0, 0, 0];

    const specialAvatars = rewardTypes["avatar"].pmfobject;// list of all avatars
    if (specialAvatars === undefined){
        return result;
    }

    // Before choosing a bonus reward type, determine whether the user
    // has avatars to collect. Do this here so the array does not have
    // to be traversed more than once.
    var availableAvatars = [];
    for (let avatarIndex = 0; avatarIndex < specialAvatars.length; avatarIndex++){
        if (!(userAvatars.includes(specialAvatars[avatarIndex].value))){
            availableAvatars.push(specialAvatars[avatarIndex]);
        }
    }

    const bonusDraws = allBonusDrops.draws[0];
    if (bonusDraws.length != bonuspmf.length){
        return result;
    }

    for (let x = 0; x < bonusDraws.length; x++){
        if (allBonusDrops.rewardTypeValues[x] == "avatar"){
            if (availableAvatars.length == 0){
                // If there are no avatars available, remove the option to drop one
                bonuspmf[x] = 0;
            } else{
                bonuspmf[x] = bonusDraws[x];
            }
        } else{
            bonuspmf[x] = bonusDraws[x];
        }
    }

    var selection = "";
    var selectedBonus = RNG(bonuspmf);

    if (selectedBonus >= 0){
        selection = allBonusDrops.rewardTypeValues[selectedBonus];
    }

    // Trade credits
    if (selection == "tradeCredits"){
        //const tradeCreditpmf = [347, 972, 480, 160, 40, 1];
        //const tradeCreditValues = [1, 2, 3, 5, 10, 69];

        const tradeCreditDrops = rewardTypes[allBonusDrops.rewardTypeValues[0]].pmfobject;
        var tradeCreditpmf = [];
        for (let x of tradeCreditDrops){
            tradeCreditpmf.push(x.weight);
        }

        var selectedIndex = RNG(tradeCreditpmf);
        if (selectedIndex >= 0){
            resources.trade_credits += tradeCreditDrops[selectedIndex].value;

            result.displayName = "Trade Credits";
            result.rewardType = "tradeCredits";
            result.image = "resource_trade_credits_200x.webp";
            result.amount = tradeCreditDrops[selectedIndex].value;
            result.inventory = resources.trade_credits;
            result.backgroundColor = "#389CFC";
            result.description = "Use these to trade pins with other users. Higher-rarity pins require more credits to trade.";
        }
    }
    // Token doubler
    else if (selection == "tokenDoubler"){
        const amounts = rewardTypes[allBonusDrops.rewardTypeValues[1]];
        var rewardAmount = 0;
        if (amounts.minAmount == amounts.maxAmount){
            rewardAmount = amounts.minAmount;
        } else{
            rewardAmount = Math.floor(amounts.minAmount + Math.random() * (amounts.maxAmount - amounts.minAmount + 1));
        }

        resources.token_doubler += rewardAmount;

        result.displayName = "Token Doubler";
        result.rewardType = "tokenDoubler";
        result.image = "resource_token_doubler_200x.webp";
        result.amount = rewardAmount;
        result.inventory = resources.token_doubler;
        result.backgroundColor = "#A248FF";
        result.description = "Doubles the next " + rewardAmount.toString() + " tokens collected.";
    }
    // Avatar
    else if (selection == "avatar"){
        var avatarpmf = [];
        for (let x of availableAvatars){
            avatarpmf.push(x.weight);
        }
        
        var selectedIndex = RNG(avatarpmf);
        if (selectedIndex >= 0){
            userAvatars.push(availableAvatars[selectedIndex].value);
            
            result.displayName = "New Avatar";
            result.rewardType = "avatar";
            result.image = availableAvatars[selectedIndex].value;
            result.backgroundColor = "#F7831C";
            result.description = "Select this avatar in the account settings.";
            result.inventory = 1;
        }
    }

    return result;
}

exports.brawlBox = brawlBox;

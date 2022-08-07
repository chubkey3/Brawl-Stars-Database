// This route contains operations relating to user pin and avatar collections

const express = require("express");
const router = express.Router();
const jsonwebtoken = require("jsonwebtoken");

// Methods to query the database are contained in this module
const database = require("../modules/database");
const TABLE_NAME = process.env.DATABASE_TABLE_NAME || "brawl_stars_database";

// functions to view and modify a pin collections
const pins = require("../modules/pins");
const fileLoader = require("../modules/fileloader");
const brawlbox = require("../modules/brawlbox");

// base directories of image files
const filePaths = require("../modules/filepaths");
const PORTRAIT_IMAGE_DIR = filePaths.PORTRAIT_IMAGE_DIR;
const PIN_IMAGE_DIR = filePaths.PIN_IMAGE_DIR;


// Load the skins json object
var allSkins = [];
const allSkinsPromise = fileLoader.allSkinsPromise;
allSkinsPromise.then((data) => {
    if (data !== undefined){
        allSkins = data;
    }
});
var dropChances = {};
var brawlBoxTypes = {};
const dropChancesPromise = fileLoader.dropChancesPromise;
dropChancesPromise.then((data) => {
    if (data !== undefined){
        if (validateDropChances(data)){
            dropChances = data;

            // Copy over the brawl box data in case the user requests a list of box types
            // Remove all secret information like drop chances
            for (let x in dropChances.boxes){
                if (x != "bonus"){
                    var thisBrawlBox = {};
                    for (let y in dropChances.boxes[x]){
                        if (y != "draws" && y != "rewardTypeValues"){
                            thisBrawlBox[y] = dropChances.boxes[x][y];
                        }
                    }
                    brawlBoxTypes[x] = thisBrawlBox;
                }
            }
        }
    }
});


/**
 * Checks whether a json object is empty.
 * @param {Object} x the object
 * @returns true if empty, false otherwise
 */
 function isEmpty(x){
    var isEmpty = true;
    for (var y in x){
        isEmpty = false;
    }
    return isEmpty;
}


/**
 * Checks whether a token is valid and returns the username that the
 * token belongs to. If the token is not valid, returns an empty string.
 * Errors will be processed using the result of this function.
 * @param {Object} token the token to check
 * @returns username the token belongs to
 */
function validateToken(token){
    try{
        const data = jsonwebtoken.verify(token, "THE KING WINS AGAIN");
            
        if (data.username === undefined){
            return "";
        }
        return data.username;
    } catch(error){
        return "";
    }
}


/**
 * Processes a query to the database by checking if there was an error
 * and whether there were results. If the query was unsuccessful, return
 * true. Otherwise, return false.
 * @param {Error} error 
 * @param {Array} results 
 * @param {Object} fields 
 * @param {Object} res 
 * @returns boolean
 */
function databaseErrorCheck(error, results, fields, res){
    if (error){
        res.status(500).send("Could not connect to database.");
        return true;
    }
    if (results.length == 0){
        res.status(404).send("Could not find the user in the database.");
        return true;
    }
    return false;
}


function validateDropChances(dropChances){
    // The object doesn't even exist...
    if (!(dropChances)){
        return false;
    }
    // If no key exists, immediately throw the game and shoot your teammates
    if (!(dropChances.hasOwnProperty("key"))){
        return false;
    }

    valid = true;
    for (let checkType in dropChances.key){
        // checkType = the reward type category (boxes or rewardTypes)
        if (dropChances.hasOwnProperty(checkType)){
            for (let x of dropChances.key[checkType]){
                // x = the object representing what to check ({"types": [...], "properties": [...]})
                if (x.hasOwnProperty("types") && x.hasOwnProperty("properties")){
                    for (let y of x.types){
                        // y = the key of the type to check ("coins", "tokenDoubler", ...)
                        // checkObject = the actual object to check (found using the key)
                        var checkObject = dropChances[checkType][y];
                        for (let key of x.properties){
                            // Go through the object's properties and check if they exist
                            if (!(checkObject.hasOwnProperty(key))){
                                valid = false;
                            }
                        }
                    }
                } else{
                    valid = false;
                }
            }
        } else{
            valid = false;
        }   
    }

    return valid;
}
//----------------------------------------------------------------------------------------------------------------------

// Get a user's username and amounts of various resources
router.post("/resources", function(req, res) {
    if (!(req.body.token)){
        res.status(400).send("Token is missing.");
        return;
    }
    let username = validateToken(req.body.token);

    if (username){
        database.queryDatabase(
        "SELECT username, active_avatar, tokens, token_doubler, coins, trade_credits FROM " + TABLE_NAME + " WHERE username = ?;",
        [username], (error, results, fields) => {
            if (databaseErrorCheck(error, results, fields, res)){
                return;
            }

            const resourcesData = {
                "username": results[0].username,
                "avatar": results[0].active_avatar,
                "tokens": results[0].tokens,
                "tokenDoubler": results[0].token_doubler,
                "coins": results[0].coins,
                "tradeCredits": results[0].trade_credits
            }

            res.json(resourcesData);
        });
    } else{
        res.status(401).send("Invalid token.");
    }
});

// Get a user's collection of brawlers and pins
router.post("/collection", function(req, res) {
    if (!(req.body.token)){
        res.status(400).send("Token is missing.");
        return;
    }
    let username = validateToken(req.body.token);

    if (username){
        database.queryDatabase(
        "SELECT brawlers FROM " + TABLE_NAME + " WHERE username = ?;",
        [username], (error, results, fields) => {
            if (databaseErrorCheck(error, results, fields, res)){
                return;
            }
            
            var collectionData = {};
            try{
                collectionData = JSON.parse(results[0].brawlers);
            } catch (error){
                res.status(500).send("Collection data could not be loaded.");
                return;
            }

            let collectionInfo = pins.formatCollectionData(allSkins, collectionData, PORTRAIT_IMAGE_DIR, PIN_IMAGE_DIR);

            res.json(collectionInfo);
        });
    } else{
        res.status(401).send("Invalid token.");
    }
});

// 
router.post("/brawlbox", function(req, res) {
    if (!(req.body.token)){
        res.status(400).send("Token is missing.");
        return;
    }
    if (isEmpty(dropChances)){
        res.status(500).send("Brawl Box is not set up properly.");
        return;
    }


    // If the user does not specify a box type, send all the available boxes
    // If they do specify a box type, check to make sure that box actually exists.
    if (!(req.body.boxType)){
        res.json(brawlBoxTypes);
        return;
    }
    if (!(brawlBoxTypes.hasOwnProperty(req.body.boxType))){
        res.status(400).send("Box type does not exist.");
        return;
    }


    let username = validateToken(req.body.token);
    let boxType = req.body.boxType;
    if (username){
        const BUL = performance.now();
        database.queryDatabase(
        "SELECT brawlers, avatars, wild_card_pins, tokens, token_doubler, coins, trade_credits FROM " + TABLE_NAME + " WHERE username = ?;",
        [username], (error, results, fields) => {
            if (databaseErrorCheck(error, results, fields, res)){
                return;
            }

            var userResources = results[0];

            if (userResources.tokens < brawlBoxTypes[boxType].cost){
                //console.log("You cannot afford this Box!");
                //send status 403 later
            }

            // Is storing the data as text instead of json is faster if there is no searching???
            try{
                userResources.brawlers = JSON.parse(userResources.brawlers);
                userResources.avatars = JSON.parse(userResources.avatars);
                userResources.wild_card_pins = JSON.parse(userResources.wild_card_pins);
            } catch (error){
                res.status(500).send("Collection data could not be loaded.");
                return;
            }

            //for (let D=0;D<500;D++){
            //    brawlbox.brawlBox(dropChances, boxType, allSkins, userResources);
            //}


            let brawlBoxContents = brawlbox.brawlBox(dropChances, boxType, allSkins, userResources);

            if (brawlBoxContents.length == 0){
                res.status(500).send("This Brawl Box contained a manufacturing defect.");
                return;
            }

            // Sort all the brawlers so they don't end up in random order as the user opens more boxes
            userResources.brawlers = Object.keys(userResources.brawlers).sort().reduce((object, key) => {
                object[key] = userResources.brawlers[key]; 
                return object;
            }, {});


            database.queryDatabase(
            "UPDATE " + TABLE_NAME +
            " SET brawlers = ?, avatars = ?, wild_card_pins = ?, tokens = ?, token_doubler = ?, coins = ?, trade_credits = ? WHERE username = ?;",
            [JSON.stringify(userResources.brawlers), JSON.stringify(userResources.avatars), JSON.stringify(userResources.wild_card_pins), userResources.tokens, userResources.token_doubler, userResources.coins, userResources.trade_credits, username], (error, results, fields) => {
                if (error){
                    res.status(500).send("Could not connect to database.");
                    return;
                }
                if (results.affectedRows == 0){
                    res.status(500).send("The database refused to update.");
                }

                // Add image file paths to all images returned as rewards
                for (let x of brawlBoxContents){
                    if (x.hasOwnProperty("image") && x.hasOwnProperty("rewardType")){
                        if (x.rewardType == "pin"){
                            x.image = PIN_IMAGE_DIR + x.image;
                        } else if (x.rewardType == "brawler"){
                            x.image = PORTRAIT_IMAGE_DIR + x.image;
                        }
                    }
                }

                const EDGRISBAD = (performance.now() - BUL);
                console.log("YOUR PROGRAM IS",EDGRISBAD.toString(),"TIMES WORSE THAN E D G R");

                res.json(brawlBoxContents);
            });
        });
    } else{
        res.status(401).send("Invalid token.");
    }
});

module.exports = router;

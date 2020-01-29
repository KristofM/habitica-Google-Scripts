/*********************************************************************************\
* @Title:       Habitica Automation Scripts
*
* @Description: Google Apps Scripts to automate some of the Habitica tasks
*               This file contains 4 scripts in total:
*                 - scheduleJoinQuest: automatically accept party invitation for quests
*                 - buffParty: automatically casts a skill for the party
*                 - buyAllArmoire: buys armoire with excess gold
*                 - heal: buys a health potion if necessary
*
*               Each function works independently from another. If you run one function,
*               the other functions will not run. As a result, your should schedule
*               each of the functions that you want to run separately as a trigger in 
*               Google Apps Script. (functions can remain in one file but still trigger
*               individually)
*
* @Author:      KristofM - kristof@habitgrowth.com
*
* @Website:     https://habitgrowth.com
*
* @HowToUse:    https://habitica.fandom.com/wiki/Google_Apps_Script
*
* @Changelog:
*               2020-01-29: 
*                    ADDED:   header DOC
*                    ADDED:   changelog
*                    CHANGED: Cleanup code
*                    CHANGED: Add more logging
*                    CHANGED: Rename function PitiGearAndBuffs to buffParty
*                    CHANGED: Consistent use of sleepTime
*
*               202-01-28: Initial version
*
\*********************************************************************************/


// Habitica API tokens
// Do not share them publicly under any circumstances!
var habId = "habitica-id";
var habToken = "habitica-token";

// how long to wait between multiple API calls (in milliseconds)
// (this is to avoid the servers being overloaded)
var sleepTime = 10000


/********************************************************\
 Automatically join party quests
 
 Source: https://habitica.fandom.com/wiki/Google_Apps_Script
\********************************************************/
function scheduleJoinQuest() {
   var paramsTemplate = {
     "method" : "get",
     "headers" : {
       "x-api-user" : habId, 
       "x-api-key"  : habToken    
     }
   }  
   var response = UrlFetchApp.fetch("https://habitica.com/api/v3/groups/party", paramsTemplate);
   var party = JSON.parse(response);
 
   if ((party.data.quest.key != undefined) && (party.data.quest.active != true) && (party.data.quest.members[habId] == undefined)){
   paramsTemplate = {
       "method" : "post",
       "headers" : {
         "x-api-user" : habId, 
         "x-api-key" : habToken       
       }     
     }
     var params = paramsTemplate;
     
     console.log("quest invitation found, joining...");
  
     UrlFetchApp.fetch("https://habitica.com/api/v3/groups/party/quests/accept", params)
   } else {
     console.log("no open quest invitation found");
   }
 }


/********************************************************\
 Buff the party
 
 Optional: leaves a mana buffer in the account 
           that is never spent
           
 Room for improvement: 
         * only buff party if quest is running           
\********************************************************/
function buffParty() {
  var manaBuffer = 45; // How much mana to keep on your profile
   /*
   Below is a list  of options of the party buff skills. Replace the value in skillId for the skill you desire. Ensure you copy the quotes.
     Warrior Valourous Presence (STR): "valorousPresence" 
     Warrior Intimidating Gaze (CON): "intimidate" 
     Rogue Tools of Trade (PER): "toolsOfTrade"
     Healer Protective Aura (CON): "protectAura"
     Healer Blessing (HP): "healAll"
     Mage Ethereal Surge (mana): "mpheal"
     Mage EarthQuake (INT): "earth"
   */
  var skillId = "toolsOfTrade"
  var paramsTemplate = {
    "method" : "get",
    "headers" : {
      "x-api-user" : habId, 
      "x-api-key" : habToken    
    }
  }  
  // set the gear you want to equip here
  // use the "Data Display Tool" to find the best gear to equip
  // https://oldgods.net/habitrpg/habitrpg_user_data_display.html
  var armorForBuff = "armor_rogue_5";
  var headForBuff = "";
  var weaponForBuff = "";
  var shieldForBuff = "";
    
  // save initial gear
  var head = user.data.items.gear.equipped.head; 
  var armor = user.data.items.gear.equipped.armor;
  var weapon = user.data.items.gear.equipped.weapon;
  var shield = user.data.items.gear.equipped.shield;
  
  // check user mana and calculate maximum number of buffs we can do
  var response = UrlFetchApp.fetch("https://habitica.com/api/v3/user", paramsTemplate);
  var user = JSON.parse(response);
  var maxNumberOfBuffs = parseInt((user.data.stats.mp - manaBuffer)/25); //20-Wizard(Valorous Presence) 25-Rogue(ToolsOfTheTrade)
   

  if (maxNumberOfBuffs > 0) {
    console.log("User has "+ parseInt(user.data.stats.mp) + " mana, script will cast " + skillId + " " + maxNumberOfBuffs + " times.");
    paramsTemplate = {
        "method" : "post",
        "headers" : {
          "x-api-user" : habId, 
          "x-api-key" : habToken       
        }     
      }
    var params = paramsTemplate;
   
/*
// EQUIP TEMP GEAR
   if (user.data.items.gear.equipped.head !== "head_special_2") {
      UrlFetchApp.fetch("https://habitica.com/api/v3/user/equip/equipped/head_special_2", params);
      head = "head_special_2"; 
      Utilities.sleep(200);
   }
   
    if (user.data.items.gear.equipped.armor !== "armor_rogue_5"){
      UrlFetchApp.fetch("https://habitica.com/api/v3/user/equip/equipped/armor_rogue_5", params);
      armor = "armor_special_finnedOceanicArmor";
      Utilities.sleep(200);
    }

  if (user.data.items.gear.equipped.weapon !== "weapon_warrior_6"){
      UrlFetchApp.fetch("https://habitica.com/api/v3/user/equip/equipped/weapon_warrior_6", params);
      weapon = "weapon_warrior_6";
      Utilities.sleep(200);
    }

  if (user.data.items.gear.equipped.shield !== "shield_special_lootBag"){
      UrlFetchApp.fetch("https://habitica.com/api/v3/user/equip/equipped/shield_special_lootBag", params);
      shield = "shield_special_lootBag";
      Utilities.sleep(200);
    }
*/ 

  // cast buff multiple times
  for (var i = 0; i < maxNumberOfBuffs; i++) {
    console.log("casting " + skillId + "...");
    UrlFetchApp.fetch("https://habitica.com/api/v3/user/class/cast/" + skillId, params); 
    Utilities.sleep(sleepTime);
  }
  

  
/*
  // change battle gear a second time   
   if (head !== "head_special_2") {
   //   UrlFetchApp.fetch("https://habitica.com/api/v3/user/equip/equipped/head_special_2", params);
      Utilities.sleep(200);
   }
   
    if (armor !== "armor_special_2"){
      UrlFetchApp.fetch("https://habitica.com/api/v3/user/equip/equipped/armor_special_2", params);
      Utilities.sleep(200);
    }
  
  if (weapon !== "weapon_special_nomadsScimitar"){
      UrlFetchApp.fetch("https://habitica.com/api/v3/user/equip/equipped/weapon_special_nomadsScimitar", params);
      Utilities.sleep(200);
    }
   
  if (shield !== "shield_special_wintryMirror"){
      UrlFetchApp.fetch("https://habitica.com/api/v3/user/equip/equipped/shield_special_wintryMirror", params);
      Utilities.sleep(200);
    }
*/     
   } // end maxNumberOfBuffs
  }

/********************************************************\
 Buy as much armoire as possible with excess gold
 
 Optional: leaves a gold buffer in the account 
           that is never spent
\********************************************************/
function buyAllArmoire() {
   var goldbuffer = 300 // how much gold you want to keep in your account
 
   var url = "https://habitica.com/api/v3/user/buy-armoire" 
   var response
   
   //set paramaters
   var paramsTemplate = {
     "method" : "get",
     "headers" : {
       "x-api-user" : habId, 
       "x-api-key" : habToken
     }
   }
   var params = paramsTemplate;
  
  // check how many armoires we can buy
  var response = UrlFetchApp.fetch("https://habitica.com/api/v3/user", params);
  var user = JSON.parse(response);
  var maxNumberOfarmoires = parseInt((user.data.stats.gp - goldbuffer)/100);
  
  

  if (maxNumberOfarmoires > 0) {
    console.log("User has "+ parseInt(user.data.stats.gp) + " gold, script will by armoire " + maxNumberOfarmoires + " times.");
    params = {
     "method" : "post",
     "headers" : {
       "x-api-user" : habId, 
       "x-api-key" : habToken
     }
    }
    
    for (var i = 0; i < maxNumberOfarmoires; i++) { 
      response = UrlFetchApp.fetch(url, params)
      var result = JSON.parse(response);
      console.log(result.message)
      if (result.data.armoire.type == 'food') {
        console.log("You gained " + result.data.armoire.dropText + ".")
      } else {
        console.log("You gained " + result.data.armoire.value + " " + result.data.armoire.type + ".")    
      }
      Utilities.sleep(sleepTime);
    }
  } // end maxNumberOfarmoires  > 0
 }

/********************************************************\
 Automatically heal by buying a potion if health dips
 below a set threshold
\********************************************************/
function heal() { 
  var minHealth = 35 // buy a potion if health is below this point
   var response
   
   //set paramaters
   var paramsTemplate = {
     "method" : "get",
     "headers" : {
       "x-api-user" : habId, 
       "x-api-key" : habToken
     }
   }
   var params = paramsTemplate;
  
  // check how much health we have
  var response = UrlFetchApp.fetch("https://habitica.com/api/v3/user", params);
  var user = JSON.parse(response);
  var curHealth = user.data.stats.hp;
  
  if(curHealth < minHealth){
    console.info("Low on health, attempting to buy a potion...");
   // buy a potion
    params = {
     "method" : "post",
     "headers" : {
       "x-api-user" : habId, 
       "x-api-key" : habToken
     }
    }
    response = UrlFetchApp.fetch("https://habitica.com/api/v3/user/buy-health-potion", params)
    var result = JSON.parse(response); 
    console.log(result.message)   
  } else {
   console.log("enough health, not buying a potion"); 
  }
 }

/*********************************************************************************\
* @Title:       Habitica Automation Scripts
*
* @Description: Google Apps Script to automate some of the Habitica tasks
*               This file contains 4 functions in total:
*                 - scheduleJoinQuest: accept party invitation for quests
*                 - buffParty: automatically casts a skill for the party
*                 - buyAllArmoire: buys armoire with excess gold
*                 - heal: buys a health potion if necessary
*
*               Each function works independently from another. If you run one 
*               function, the other functions will not run. As a result, you should 
*               schedule each of the functions that you want to run separately as 
*               a trigger in Google Apps Script. (functions can remain in one file 
*               but still be triggered individually)
*
* @Author:      KristofM - kristof@habitgrowth.com
*
* @Website:     https://habitgrowth.com
*
* @HowToUse:    https://habitica.fandom.com/wiki/Google_Apps_Script
*
* @Changelog:
*               2020-01-30:
*                    ADDED:   proper error handling
*                    ADDED:   proper logging for all functions
*               2020-01-29: 
*                    ADDED:   header DOC
*                    ADDED:   changelog
*                    ADDED:   Use the Project Properties keysets to store 
*                             your habitica ID and Token (optional)
*                    CHANGED: Cleanup code
*                    CHANGED: Add more logging
*                    CHANGED: Rename function PitiGearAndBuffs to buffParty
*                    CHANGED: Consistent use of sleepTime
*
*               202-01-28: Initial version
*
\*********************************************************************************/


// ENTER YOUR HABITICA API TOKENS HERE
// Do not share them publicly under any circumstances!
var habId = "habitica-id";
var habToken = "habitica-token";

// how long to wait between multiple API calls (in milliseconds)
// (this is to avoid the servers being overloaded)
var sleepTime = 10000

if(PropertiesService.getScriptProperties().getProperty('habid') != null && PropertiesService.getScriptProperties().getProperty('habtoken')!=null){
  habId = PropertiesService.getScriptProperties().getProperty('habid');
  habToken = PropertiesService.getScriptProperties().getProperty('habtoken');
}
var paramsGet = {
  "method" : "get",
  "headers" : {
    "x-api-user" : habId, 
    "x-api-key"  : habToken    
  }
} 
var paramsPost = {
  "method" : "post",
  "headers" : {
    "x-api-user" : habId, 
    "x-api-key"  : habToken    
  }
}








/********************************************************\
Automatically join party quests

Source: https://habitica.fandom.com/wiki/Google_Apps_Script
\********************************************************/
function scheduleJoinQuest() {
  var party = JSON.parse(UrlFetchApp.fetch("https://habitica.com/api/v3/groups/party", paramsGet));
  if(!party.success){throw("[ERROR] Unable to retrieve party info");}
  
  if ((party.data.quest.key != undefined) && (party.data.quest.active != true) && (party.data.quest.members[habId] == undefined)){
    
    console.info("There's an outstanding quest invitation, joining...");
    
    UrlFetchApp.fetch("https://habitica.com/api/v3/groups/party/quests/accept", paramsPost)
    
  } else {
    console.info("no open quest invitation found");
  }
} // END function scheduleJoinQuest










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
  var skillCost = 25; //20 for Wizard(Valorous Presence), 25 for Rogue(ToolsOfTheTrade)
  
  // set the gear you want to equip here
  // use the "Data Display Tool" to find the best gear to equip
  // https://oldgods.net/habitrpg/habitrpg_user_data_display.html
  var armorForBuff = "armor_rogue_5";
  var headForBuff = "";
  var weaponForBuff = "";
  var shieldForBuff = "";
  
  // check user mana and calculate maximum number of buffs we can do
  var user = JSON.parse(UrlFetchApp.fetch("https://habitica.com/api/v3/user", paramsGet));
  if(!user.success){throw("[ERROR] Unable to retrieve user profile");}
  var maxNumberOfBuffs = parseInt((user.data.stats.mp - manaBuffer)/skillCost); 
  var curMana = parseInt(user.data.stats.mp)
  
  // save initial gear
  var head = user.data.items.gear.equipped.head; 
  var armor = user.data.items.gear.equipped.armor;
  var weapon = user.data.items.gear.equipped.weapon;
  var shield = user.data.items.gear.equipped.shield;
  
  if (maxNumberOfBuffs < 1) {
    console.info("User does not have enough mana to cast "+skillId+". Minimum mana needed is " + (curMana + skillCost) + ", user has "+ curMana);
  }else{
    console.info("User has "+ parseInt(user.data.stats.mp) + " mana, script will cast " + skillId + " " + maxNumberOfBuffs + " times.");
    
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
      console.info("casting " + skillId + "...");
      var user = JSON.parse(UrlFetchApp.fetch("https://habitica.com/api/v3/user/class/cast/" + skillId, paramsPost)); 
      if(!user.success){
        throw("[ERROR] Unable to cast " + skillId);
      } else {
        console.info(skillId + " successfully cast");
      }
      Utilities.sleep(sleepTime);
    }
    
    // check user mana again
    var user = JSON.parse(UrlFetchApp.fetch("https://habitica.com/api/v3/user", paramsGet));
    if(!user.success){
      throw("[ERROR] Unable to retrieve user profile");
    }else{
      console.info("User has now " + user.data.stats.mp + " mana");
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
  }// end maxNumberOfBuffs > 0
} // END buffParty










/********************************************************\
Buy as much armoire as possible with excess gold

Optional: leaves a gold buffer in the account 
that is never spent
\********************************************************/
function buyAllArmoire() {
  var goldbuffer = 300 // how much gold you want to keep in your account
  
  // check how many armoires we can buy
  var user = JSON.parse(UrlFetchApp.fetch("https://habitica.com/api/v3/user", paramsGet));
  if(!user.success){throw("[ERROR] Unable to retrieve user profile");}  
  var curGold = parseInt(user.data.stats.gp);
  var maxNumberOfarmoires = parseInt((curGold - goldbuffer)/100);
  
  if (maxNumberOfarmoires > 0) {
    console.info("User has "+ curGold + " gold, script will by armoire " + maxNumberOfarmoires + " times.");
    
    for (var i = 0; i < maxNumberOfarmoires; i++) { 
      var result = JSON.parse(UrlFetchApp.fetch("https://habitica.com/api/v3/user/buy-armoire", paramsPost));
      if(!result.success){("[ERROR] Unable to buy armoire" + result);}  
      
      if (result.data.armoire.type == 'food') {
        console.info("You gained " + result.data.armoire.dropText + ".")
      } else {
        console.info("You gained " + result.data.armoire.value + " " + result.data.armoire.type + ".")    
      }
      Utilities.sleep(sleepTime);
    } // end loop
    
    // check user gold again
    var user = JSON.parse(UrlFetchApp.fetch("https://habitica.com/api/v3/user", paramsGet));
    if(!user.success){
      throw("[ERROR] Unable to retrieve user profile");
    }else{
      console.info("User has now " + user.data.stats.gp + " gold");
    }    
  }else{
    console.info("User does not have enough excess gold to buy any armoires. Minimum gold needed is " + (goldbuffer + 100) + ", user has " + curGold);
  }// end maxNumberOfarmoires  > 0
} // END buyAllArmoire










/********************************************************\
Automatically heal by buying a potion if health dips
below a set threshold
\********************************************************/
function heal() { 
  var minHealth = 48 // buy a potion if health is below this point
  
  // check how much health we have
  var user = JSON.parse(UrlFetchApp.fetch("https://habitica.com/api/v3/user", paramsGet));
  if(!user.success){throw("[ERROR] Unable to retrieve user profile. " + user);}  
  var curHealth = parseInt(user.data.stats.hp);
  
  if(curHealth < minHealth){
    console.info("Health ("+curHealth+") is below treshold ("+minHealth+"), attempting to buy a potion...");
    // buy a potion
    var result = JSON.parse(UrlFetchApp.fetch("https://habitica.com/api/v3/user/buy-health-potion", paramsPost));
    if(!result){
      ("[ERROR] Unable to buy potion profile");
    }else{  
      var user = JSON.parse(UrlFetchApp.fetch("https://habitica.com/api/v3/user", paramsGet));
      if(!user.success){throw("[ERROR] Unable to retrieve user profile. " + user);}    
      console.info("Bought potion, new health: " + user.data.stats.hp);
      console.info(result.message)   
    }
  } else {
    console.info("User health (" + curHealth + " hp) is above treshold ("+minHealth+" hp), not buying a potion"); 
  } // end if(curHealth < minHealth){
} // END heal

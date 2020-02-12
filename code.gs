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
*               2020-02-12:
*                    ADDED:   new function: startQuest()
*
*               2020-02-11:
*                    ADDED:   new function: exportQuestParticipants()
*
*               2020-01-30:
*                    ADDED:   proper error handling
*                    ADDED:   proper logging for all functions
*                    ADDED:   optionally equip gear before buffing the party
*
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

Optional: leaves a mana buffer in the account that is 
never spent

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
  
  var equipGearForBuff = false; // set to true if you want to equip special gear for buffing the party.
  
  // set the gear you want to equip here
  // use the "Data Display Tool" to find the best gear to equip
  // https://oldgods.net/habitrpg/habitrpg_user_data_display.html
  var arrGearForBuff = {};
  arrGearForBuff["head"] = "head_rogue_5";
  arrGearForBuff["armor"] = "armor_rogue_5";
  arrGearForBuff["weapon"] = "weapon_special_2";
  arrGearForBuff["shield"] = "shield_special_goldenknight";
  arrGearForBuff["back"] = "back_special_aetherCloak";
  arrGearForBuff["eyewear"] = "eyewear_armoire_goofyGlasses";
  arrGearForBuff["headAccessory"] = "headAccessory_armoire_gogglesOfBookbinding";
  
  // check user mana and calculate maximum number of buffs we can do
  var user = JSON.parse(UrlFetchApp.fetch("https://habitica.com/api/v3/user", paramsGet));
  if(!user.success){throw("[ERROR] Unable to retrieve user profile");}
  var maxNumberOfBuffs = parseInt((user.data.stats.mp - manaBuffer)/skillCost); 
  var curMana = parseInt(user.data.stats.mp)
  
  var sleepLoop = 200; // time in milliseconds
  
  // save initial gear
  var arrCurGear = {};
  arrCurGear["head"] = user.data.items.gear.equipped.head; 
  arrCurGear["armor"] = user.data.items.gear.equipped.armor;
  arrCurGear["weapon"] = user.data.items.gear.equipped.weapon;
  arrCurGear["shield"] = user.data.items.gear.equipped.shield;
  arrCurGear["back"] = user.data.items.gear.equipped.back;
  arrCurGear["eyewear"] = user.data.items.gear.equipped.eyewear;
  arrCurGear["headAccessory"] = user.data.items.gear.equipped.headAccessory;
  
  if (maxNumberOfBuffs < 1) {
    console.info("User does not have enough mana to cast "+skillId+". Minimum mana needed is " + (curMana + skillCost) + ", user has "+ curMana);
  }else{
    console.info("User has "+ parseInt(user.data.stats.mp) + " mana, script will cast " + skillId + " " + maxNumberOfBuffs + " times.");
    
    if(equipGearForBuff){
      // Equip temp gear
      for (var key in arrGearForBuff) {
        var result = JSON.parse(UrlFetchApp.fetch("https://habitica.com/api/v3/user/equip/equipped/" + arrGearForBuff[key], paramsPost)); 
        
        if(!result.success){
          throw("[ERROR] Unable to equip " + arrGearForBuff[key] + " as " + key + " gear");
          throw("[ERROR] " + result.message);
        } else {
          console.info("Equipped "+ arrGearForBuff[key] + " as " + key + " gear");
        }
        Utilities.sleep(sleepLoop);
      }  
    }
    
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
      console.info("User has now " + parseInt(user.data.stats.mp) + " mana");
    }
    
    if(equipGearForBuff){
      // Equip original gear again
      for (var key in arrCurGear) {
        var result = JSON.parse(UrlFetchApp.fetch("https://habitica.com/api/v3/user/equip/equipped/" + arrCurGear[key], paramsPost)); 
        
        if(!result.success){
          throw("[ERROR] Unable to equip " + arrCurGear[key] + " as " + key + " gear");
          throw("[ERROR] " + result.message);
        } else {
          console.info("Equipped "+ arrCurGear[key] + " as " + key + " gear");
        }
        Utilities.sleep(sleepLoop);
      }   
    }
    
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










/********************************************************\
Checks if a quest if running and exports the participants
\********************************************************/
function exportQuestParticipants(){
  var logToConsole = true;
  
  var user; // holds the user info
  var party; //holds the party info
  var partyMembers; // holds the party members
  var quest; // holds the quest info
  var memberList = []; // holds the party member info and quest participation
  
  var objUser = JSON.parse(UrlFetchApp.fetch("https://habitica.com/api/v3/user", paramsGet));
  if(!objUser.success){throw("[ERROR] Unable to retrieve user profile. " + objUser);}  
  user = objUser.data;
  
  var objParty = JSON.parse(UrlFetchApp.fetch("https://habitica.com/api/v3/groups/party", paramsGet));
  if(!objParty.success){throw("[ERROR] Unable to retrieve party info. " + objParty);}  
  party = objParty.data;
  
  var objMembers = JSON.parse(UrlFetchApp.fetch("https://habitica.com/api/v3/groups/party/members", paramsGet));
  if(!objMembers.success){throw("[ERROR] Unable to retrieve members info. " + objMembers);}  
  partyMembers = objMembers.data;
  
  quest = party.quest;
  
  if(!quest.active){
    console.info("There is currently no quest running"); 
    return;
  }
  
  // quest is running
  console.info("Quest running: "+quest.key);
  
  // enrich party member list with quest participance
  for (var i = 0; i < partyMembers.length; i++) {
    var member = partyMembers[i];
    if(quest.members.hasOwnProperty(member.id)){
      member.participating = true;
    } else {
      member.participating = false;
    }
    
    memberList.push({name: member.profile.name, username: member.auth.local.username, participating: member.participating});
  } // end loop
  
  Array.prototype.sortOn = function(key){
    this.sort(function(a, b){
      if(a[key].toLowerCase() < b[key].toLowerCase()){
        return -1;
      }else if(a[key].toLowerCase() > b[key].toLowerCase()){
        return 1;
      }
      return 0;
    });
  }
  
  memberList.sortOn('name');
  
  if(logToConsole){
    for (var i = 0; i < memberList.length; i++) {
      console.info(memberList[i].name + " (@" + memberList[i].username + ")" + (memberList[i].participating? " is participating":" is NOT participating") );  
    }
    var numParticipators = Object.keys(quest.members).length;
    var numNonParticipators = Object.keys(partyMembers).length - numParticipators;
    console.info("Summary: " + numParticipators + " members participating in quest, " + numNonParticipators + " members not participating.");
  }
}
















/********************************************************\
Checks if a quest is open and starts it
\********************************************************/
function startQuest(){
  
  var party; //holds the party info
  var quest; // holds the quest info
  
  var objParty = JSON.parse(UrlFetchApp.fetch("https://habitica.com/api/v3/groups/party", paramsGet));
  if(!objParty.success){throw("[ERROR] Unable to retrieve party info. " + objParty);}  
  party = objParty.data;
  
  quest = party.quest;
  
  // A quest has 3 possible states:
  // - active: a quest is currently running
  // - pending: quest has been started and is open for members to join
  // - none: there's no quest running, nor has one opened up for 
  
  if(quest.active){ 
    // quest is active (=running)
    console.info("No action: quest "+quest.key+" is already running");
    return;
  }
  
  if(quest.key == undefined){
    // there is no quest
    console.info("No action: no quest active, nor pending");
    return;
  }
  
  // quest is pending, start it
  console.info("Quest "+quest.key+" is pending, it will now be started");
  
  var objQuest = JSON.parse(UrlFetchApp.fetch("https://habitica.com/api/v3/groups/party/quests/force-start", paramsPost));
  if(!objQuest.success){throw("[ERROR] Unable to start quest. " + objQuest);}  
  quest = objQuest.data;
  
  // Check if quest has sucessfully started
  if(quest.active){
    console.info("Succesfully started quest "+quest.key);
  }else{
    throw("[ERROR] Unknown error has occurred. " + quest);
  }
}

/*
* Habitica API tokens. Do not share them under any circumstances
*/
var habId = "#HabiticaUserID#";
var habToken = "#HabiticaAPIToken#";


/********************************************************\
 Automatically join party quests
 
 Source: https://habitica.fandom.com/wiki/Google_Apps_Script
\********************************************************/
function scheduleJoinQuest() {
   var paramsTemplate = {
     "method" : "get",
     "headers" : {
       "x-api-user" : habId, 
       "x-api-key" : habToken    
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
 Automatically buff party
 
 Optional: leaves a mana buffer in the account 
           that is never spent
           
 Room for improvement: 
         * only buff party if quest is running           
\********************************************************/
function PitiGearAndBuffs() {
  var manaBuffer = 45; // How much mana to keep on your profile
   /*
   Below is a list  of options of the party buff skills. Replace the value in skillId above for the skill you desire. Ensure you copy the quotes.
   See http://habitica.fandom.com/wiki/Skills for more information on skills.
   Options for skills:
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
   var response = UrlFetchApp.fetch("https://habitica.com/api/v3/user", paramsTemplate);
   var user = JSON.parse(response);
   var maxNumberOfBuffs = parseInt((user.data.stats.mp - manaBuffer)/25); //20-Wizard(Valorous Presence) 25-Rogue(ToolsOfTheTrade)
    
  // save initial gear
  var head = user.data.items.gear.equipped.head; 
  var armor = user.data.items.gear.equipped.armor;
  var weapon = user.data.items.gear.equipped.weapon;
  var shield = user.data.items.gear.equipped.shield;
   

   if (maxNumberOfBuffs >=1) {
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
   
    if (user.data.items.gear.equipped.armor !== "armor_special_finnedOceanicArmor"){
      UrlFetchApp.fetch("https://habitica.com/api/v3/user/equip/equipped/armor_special_finnedOceanicArmor", params);
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

  // cast Valorous Presence 4 times (or less, if you don't have enough mana)   
  for (var i = 1; i < 4; i++) { 
      if (maxNumberOfBuffs >= i) {
     UrlFetchApp.fetch("https://habitica.com/api/v3/user/class/cast/" + skillId, params); 
       Utilities.sleep(30000);
       }   
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
   var sleepTime = 10000
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

  if (maxNumberOfarmoires >=1) {
    
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
      Utilities.sleep(sleepTime);// pause in the loop; this is to avoid the servers being overloaded
    }
  } // end maxNumberOfarmoires  >=1
 }

/********************************************************\
 Automatically heal by buying a potion if health dips
 below a set threshold
\********************************************************/
function heal() { 
  var minHealth = 35 // buy a potion if health is below this point
   var sleepTime = 10000
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

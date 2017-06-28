/*
  author : Sacha Charbit
  Github : @sacharbit
  linkedin : https://www.linkedin.com/in/sacha-charbit-004502b9/
*/
var csv_handler = require('csv-handler');
var db = require('../src/RocketDB')({importCSV : csv_handler.importCSV, exportCSV : csv_handler.exportCSV, splitSize : 100000});
var colors = require('colors');
var fs = require('fs');

var check = function(returned, nameTest, checkResponse){
  if(checkResponse !== undefined && returned.response == checkResponse)
    console.log((nameTest +" : " + returned.response).green);
  else if(returned.status == "success")
    console.log((nameTest +" : " + returned.response).green);
  else console.log((nameTest +" : " + returned.response).red);
}

var checkValue = function(returned, nameTest, checkValue){
  if(returned == checkValue) console.log((nameTest +" : " + returned).green);
  else console.log((nameTest +" : " + returned).red);
}

check(db.insertTable("nametable", "userId", {"userId" : "String", "username" : "String", "name" : "String", "lastname" : "String", age : 'Number'}),
      "Creating a table");

check(db.insertLine("nametable", {userId : 'oko', username : 'igjhgg', name : 'hu', lastname : 'iuh', age:21}),
      "Inserting a line in a table");

check(db.insertLine("nametable", {userId : 'oko', username : 'actualbeautifulusername', name : 'actualbeautifulname', lastname : 'actualbeautifullastname', age:21}),
      "Inserting a line in a table with already existing key",
      "Error: oko is already in the database. Add 'with allow_updates' to the query to update it anyway.");

check(db.insertLine("nametable",
      {userId : 'oko', username : 'actualbeautifulusername', name : 'actualbeautifulname', lastname : 'actualbeautifullastname', age:21}, true),
      "Inserting a line in a table with allow_updates");

check(db.backupData(), "Saving data in a JSON file.");

check(db.search("nametable", ["oko"]), "Searching data in the database without condition");
check(db.search("nametable", null, ["username == 'actualbeautifulusername'"]), "Searching data with 1 condition");
checkValue(db.sum("nametable", null, ["username == 'actualbeautifulusername'"], 'age'), "sum of age", 21);
checkValue(db.count("nametable", null, ["username == 'actualbeautifulusername'"], 'age'), "count of users", 1);

check(db.deleteLine("nametable", "oko"), "Deleting a line");
// check(db.deleteTable("nametable"), "Deleting a table.");
checkValue(db.getSplitSize(), "Get split size", 100000);
db.backupData();
db.loadData();
db.insertLine("")
check(db.insertTable("player", "id", {id: 'Number', Player : 'String', height :'Number', weight : 'Number', collage : 'String', born : 'Number', birth_city : 'String', birth_state : 'String'}), "Insert the table player");
db.importCSV("player", "test/Players.csv", function(){
  db.backupData();
  db.loadData();
  checkValue(db.mean("player", null, ["height == 180"], "weight"), "Mean of weight for players with height == 180", 78.22);
  check(db.createIndex("player", "height"), "Create an index of a key");
  checkValue(db.count("player", null, [true], "id"), "Number of players in the database", 3922);
  db.backupData();
  db.exportCSV('player');
  db.indexedSearch("player", "height", null, ["height == 180"]);
});

db.insertTable("testforlist", "id", {id:"String", List : "List"});
check(db.createIndex("testforlist", "List"), "Create an index with a list", "The key can't be a Boolean, a list, an object or a foreign key.")

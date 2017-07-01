/*
  author : Sacha Charbit
  Github : @sacharbit
  linkedin : https://www.linkedin.com/in/sacha-charbit-004502b9/
*/
var DATA_TYPES = ['String', 'Number', 'Date', 'Boolean', 'List', 'Object', 'f_key'];

var Database = function(){
  this.data = {};
  this.objects = {};
  this.splitSize = Database.prototype.splitSize;
}
var fs = require('fs');
Database.prototype.size = function() {return fs.statSync("backupdata.json").size;}

// TODO: Being able to import/export SQL, etc...
// TODO: Add a way to store object and possibility to call them in the database with objs.nameofobject instead of storing the whole thing multiple times.
// TODO: Foreign Keys : New argument in the insert table query and add a foreign key arg in the database table. Each time someone wants to add a value in there, check if it's possible.
// TODO: Store the database in multiple files so it performs better with millions of lines of data.
// If a table is too memory-heavy for the RAM, split it in the files and in the RAM so that if 2 requests happen at the same time, you load it once for 2 queries.
// TODO: Sync the shared data with the client.
// TODO: Also, sortBy in search function
// TODO: update keys when the table is updated

Database.prototype.updateIndexes = function(tablename){
  var index_keys = Object.keys(this.data[tablename].indexes);
  for(i in index_keys){
    this.createIndex(tablename, index_keys[i]);
  }

}

Database.prototype.createIndex = function(tablename, key){
  try{
    // Check if the table and the key exists
    if(this.data[tablename] === undefined) throw tablename + "is not a table in this database.";
    if(this.data[tablename].properties[key] === undefined) throw key + " is not a property of "+tablename;
    // Get the list of properties from the table and the index of the key in parameters
    var props = Object.keys(this.data[tablename].properties), index_key = props.indexOf(key);
    // Forbid some data types to be indexes
    if(['Boolean', 'List', 'Object', 'f_key'].indexOf(this.data[tablename].properties[key]) != -1) throw "The key can't be a Boolean, a list, an object or a foreign key.";
    this.data[tablename].indexes[key] = {};
    var data = this.data[tablename].data;
    // for each element in data, check the key value and add the index in the list of indexes for this key value
    for(i in data){
      if(this.data[tablename].indexes[key][data[i][index_key]] === undefined) this.data[tablename].indexes[key][data[i][index_key]] = new Array(i);
      else this.data[tablename].indexes[key][data[i][index_key]].push(i);
    }
    return {status:'success', response : 'Index added'};
  }
  catch(err){return {status: 'failed', response : err}};
}
Database.prototype.insertLine = function(nameTable, line, allow_updates, dump){
  try{
    var line_to_send = [];
    // If allow_updates wasn't specified, set allow_updates to false
    if(allow_updates === undefined) var allow_updates = false;
    // Check if the table exists
    if(this.data[nameTable] === undefined) throw nameTable + "is not a table in this database.";
    // get the primary key
    var primarykey = line[this.data[nameTable].primarykey];
    // if the user doesn't want to update his data, forbid the update if the primary key already exists in the database
    if(this.data[nameTable].data[primarykey] !== undefined && !allow_updates) throw primarykey + " is already in the database. Change allow_updates to true in the parameters to change it anyway.";

    for(col in this.data[nameTable].properties){
      // check if the column name exists
      if(line[col] === undefined) throw col + " has not been found in the database.";
      // format the data depending of his type
      switch(this.data[nameTable].properties[col]){
        case 'Number' : line_to_send.push(parseFloat(line[col])); break;
        case 'Object' : line_to_send.push({obj : JSON.parse(line[col])}); break;
        case 'Date' : line_to_send.push(new Date(line[col])); break;
        case 'f_key' : line_to_send.push({ref : line[col]}); break;
        default : line_to_send.push(line[col]); break;
      }
    }
    // if no exception has been thrown, add the line in the database
    this.data[nameTable].data[primarykey] = line_to_send;
    if(dump === undefined){ this.backupData(nameTable); this.updateIndexes(nameTable); }
    return {status : "success", response : "Line added", nameTable : nameTable, line : line};
  }
  catch(err){var error = new Error(err); return {status :"failed", response : err}; }
}

Database.prototype.insertTable = function(nameTable, primarykey, properties){
  try{
    // Check if the table already exists
    if(this.data[nameTable] !== undefined) throw nameTable + " already exists in the database.";
    for(i in properties){
      // Check if the properties are undefined or the object is an array.
      if(properties[i] === 'undefined') throw "You didn't give a type to " + i;
      // Check if the property has special characters
      if(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(i)) throw "You can't put special characters in the property name. "+i;
      // Check if the property type is listed in DATA_TYPES
      if(DATA_TYPES.indexOf(properties[i]) == -1) throw (properties[i] + " for " + i, " is not an acceptable data type. Choose between : " + DATA_TYPES);
    }
    // If no exception has been thrown :
    this.data[nameTable] = {nameTable : nameTable, primarykey : primarykey, properties : properties, data : {}, indexes : {}};
    return({response : "Table added", nameTable : nameTable, status:"success"});
  }
  catch(err){var error = new Error(err); console.log(error.stack); return {status:"failed", response : error}; }
}

// Backup Data in multiple files :
// 1 file for all the infos about the database.
// 1 file for each table in the database with data, objects, indexes...
Database.prototype.backupData = function(nameTable){
  try{
    if(nameTable !== undefined && this.data[nameTable] === undefined) throw nameTable + "is not a table in this database.";
    var nameFile = "backupdata";
    var tables = [];
    if(nameTable !== undefined){ // if table specified, backup only the table
      fs.writeFileSync(nameFile+"_"+nameTable+".json", JSON.stringify(this.data[nameTable]));
    }
    else{ // nackup everything
      for(i in this.data){ // each table in a separated file for shorter loading time
        fs.writeFileSync(nameFile+"_"+i+".json", JSON.stringify(this.data[i]));
        tables.push(i);
      } // add a list of the table names in the principal file
      fs.writeFileSync(nameFile+".json", JSON.stringify({tables : tables, objects : this.objects}));
    }
    return {response : "Data backup at "+ new Date(), status : "success"};
  }
  catch(err){return {status:'failed', response : err}; }
}

Database.prototype.loadData = function(nameTable){
  try{
      if(nameTable !== undefined && this.data[nameTable] === undefined) throw nameTable + "is not a table in this database.";
    fs.readFileSync("backupdata.json", "utf8", function(err, result){
      if(err == null){ // Add the objects
        this.objects = result.objects;
        if(nameTable === undefined){ // if no tables specified in the parameters
          for(i in result.tables){ // for each table names in the database, store it in the RAM
            var table = result.tables[i];
            fs.readFileSync("backupdata_"+table+".json", "utf8", function(err, result){if(err == null) this.data[table] = result;})}
        }
        else{ // if a table has been specified, store this table in the RAM
          fs.readFileSync("backupdata_"+nameTable+".json", "utf8", function(err, result){if(err == null) this.data[nameTable] = result;})
        }
      }
      else throw err;
    });
  }
  catch(err){var error = new Error(err);}
}

Database.prototype.dump = function(nametable, lines, allow_updates){
  var all_success = true, returned = {count_failed : 0, status : 'success', response : []};
  // for each line, call insertLine and if status is 'failed', add 1 to the count_failed and add the resposne to the response array
  for(i in lines){
    var response = this.insertLine(nametable, lines[i], allow_updates, 1);
    all_success = all_success && (response.status == 'success');
    if(response.status == 'failed'){
      returned.status = 'failed'; returned.count_failed++; response.push(returned.response);
      return returned;
    }
  }
  // then, backup the data for the table
  this.backupData(nametable);
  return returned;
}
Database.prototype.getSplitSize = function(){return Database.prototype.splitSize;}


// DEPRECATED FUNCTION : DO NOT USE !
Database.prototype.query = function(action, args){
  console.log("This action is deprecated. Please read the documentation to know what function you should use instead.");
  switch(action){
    case 'insert_table' : return this.insertTable(args[0], args[1], args[2]); break;
    case 'insert_line' : return this.insertLine(args[0], args[1], args[2]); break;
    case 'dump_data' : return this.dump(args[0], args[1]); break;
    case 'backup' : return this.backupData(args); break;
    case 'load' : this.loadData(args); break;
    case 'search' : return this.search(args[0], args[1], args[2]); break;
    case 'sum' : return this.operationsInDatabase(args[0], args[1], args[2], args[3], 'sum'); break;
    case 'count' : return this.operationsInDatabase(args[0], args[1], args[2], args[3], 'count'); break;
    case 'mean' : return this.operationsInDatabase(args[0], args[1], args[2], args[3], 'mean'); break;
    default : return {status: "failed", response : "Wrong action"}; break;
  }
}

Database.prototype.sum = function(a, b, c, d){ // Alias for operationsInDatabase with 'sum' in parameters
  return this.operationsInDatabase(a, b, c, d, 'sum');
}
Database.prototype.mean = function(a, b, c, d){ // Alias for operationsInDatabase with 'mean' in parameters
  return this.operationsInDatabase(a, b, c, d, 'mean');
}
Database.prototype.count = function(a, b, c, d){ // Alias for operationsInDatabase with 'count' in parameters
  return this.operationsInDatabase(a, b, c, d, 'count');
}

Database.prototype.get = function(table, key){ // get one line if you give the tablename and the key value
  try{
    if(this.data[nameTable] === undefined) throw nameTable + "is not a table in this database.";
    if(typeof key !== 'string') throw 'Key must be a string.';
    return this.data[table].data[key];
  }
  catch(err){var error = new Error(err); return {status:'failed', response : err};}
}
// Function to remove a line
Database.prototype.removeLine = function(table, key){delete this.data[table].data[key]; return {status:'success', response : 'Deleted line'};}
// Function to remove a table
Database.prototype.removeTable = function(table){delete this.data[table]; return {status : 'success', response : 'Deleted table'};}
// Alias for removeLine
Database.prototype.deleteLine = function(table, key){return this.removeLine(table, key);}
// Alias for removeTable
Database.prototype.deleteTable = function(table){return this.removeTable(table);}

// Search in the database with the search function and do operations in a certain key
Database.prototype.operationsInDatabase = function(table, keys, conditions, operation_key, operation){
  // Get the result of the search
  var lines = this.search(table, keys, conditions).response, result = 0;
  // Get all the keys in the database properties and get the index of the operation_key in the parameters to get to this specific value
  var keys = Object.keys(this.data[table].properties),
  ind = keys.indexOf(operation_key);
  switch(operation){
    // Dépending on the operation, do a specifig task to the operation_key values
    case 'sum' : for(i in lines) result +=lines[i][ind]; break;
    case 'count' : result = lines.length; break;
    case 'mean' : for(i in lines) result +=lines[i][ind]; result /= lines.length; break;
  }
  return result;
}
Database.prototype.search = function(table, keys, conditions){
  try{
    // check if the table exists
    if(this.data[table] === undefined) throw table+" doesn't exist in the database.";
    var result = [], cond_str = "";
    // if no condition provided, but provided keys instead, add in the result those keys
    if(conditions === undefined && typeof(keys) == 'object') for(i in keys) result.push(this.data[table].data[keys[i]]);
    else if(typeof(keys) == 'string') result.push(this.data[table].data[keys]);
    else if(conditions !== undefined) { // if conditions were provided, generate a function to check the confitions and use it
      var funct_str = "", i=0; // initialize the string for the function
      // For each property, add a declaration in the function
      for(prop in this.data[table].properties){ funct_str += "var "+prop+" = data["+i+"]; "; i++;}
      // for each condition, add it to the conditions string
      if(typeof(conditions) === 'string') cond_str = conditions;
      else{
        cond_str = conditions[0];
        var i=1;
        while(i<conditions.length){cond_str += " && "+conditions[i]; i++;}
      }
      // wrap the function string and create the function with the new Function()
      funct_str += "if("+cond_str+") return data;";
      var funct_get = new Function("data", funct_str);
      if(keys != null){ // If keys were provided, go through all those keys
        for(i in keys){
          var res_tmp = funct_get(this.data[table].data[keys[i]]);
          if(res_tmp !== undefined) result.push(res_tmp);
        }
      }
      else{ // If no key were provided, go through all the table data
        for(key in this.data[table].data){
          var res_tmp = funct_get(this.data[table].data[key]);
          if(res_tmp !== undefined) result.push(res_tmp);
        }
      }
    }
    else throw "No keys or conditions were provided or were not well formated.";
    return {status : "success", response : result};
  }
  catch(err){var error = new Error(err); return {response : err, status : "failed"};}
}
Database.prototype.indexedSearch = function(tablename, index, keys, conditions){
  try{ // Very similar to search function
    if(this.data[tablename] === undefined) throw tablename + " does not exist in the database.";
    if(this.data[tablename].indexes[index] === undefined) throw index + " is not an index in the table "+tablename;
    var result = [], indexes = Object.keys(this.data[tablename].indexes[index]), result_tmp = [];
    var funct_str = "var "+index+"=value;", cond_str = "";
    if(keys != null){
      for(i in keys){
        var list_keys = this.data[tablename].indexes[index][keys[i]];
        for(k in list_keys) result.push(this.data[tablename].data[list_keys[k]]);
      }
      return {status : 'success', response : result};
    }
    else if(typeof(conditions) === 'string') cond_str = conditions;
    else if(typeof(conditions) === 'object'){
      cond_str = conditions[0];
      var i=1;
      while(i<conditions.length) cond_str +=" && "+conditions[i];
    }
    else throw "You didn't put conditions nor values to check.";

    funct_str +="return ("+cond_str+");";
    var funct = new Function("value", funct_str);
    for(i in indexes){
      if(funct(indexes[i])) result_tmp.push(this.data[tablename].indexes[index][indexes[i]]);
    }
    for(i in result_tmp){
      for(j in result_tmp[i]) result.push(this.data[tablename].data[result_tmp[i][j]]);
    }
    return result;
  }
  catch(err){return {response : err, status : 'failed'};}
}

// Adds an object in the database. There is no use for it yet but will have one in the near future
Database.prototype.addObject = function(keyObject, obj, allow_updates){
  try{
    if(this.objects[keyObject] === undefined && (allow_updates === undefined || !allow_updates))
    throw "This object already exists. Add set allow_updates to true to update it.";
    else this.objects[keyObject] = obj;
  }
  catch(err){var error = new Error();return {status: 'failed', response : err};}
}

module.exports = function(obj){
  if(obj.importCSV !== undefined) Database.prototype.importCSV = obj.importCSV;
  if(obj.exportCSV !== undefined) Database.prototype.exportCSV = obj.exportCSV;
  if(obj.splitSize !== undefined) Database.prototype.splitSize = obj.splitSize;
  var user_handler = require('../src/user_handler');
  return new Database();
}

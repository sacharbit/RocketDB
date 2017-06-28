/*
  author : Sacha Charbit
  Github : @sacharbit
  linkedin : https://www.linkedin.com/in/sacha-charbit-004502b9/
*/
var Database = function(){
  this.data = {};
  this.objects = {};
  this.splitSize = Database.prototype.splitSize;
}
var fs = require('fs');
Database.prototype.splitSize = 1000000;
Database.prototype.size = function() {return fs.statSync("backupdata.json").size;}

// TODO: Being able to import/export SQL, etc...
// TODO: Add a way to store object and possibility to call them in the database with objs.nameofobject instead of storing the whole thing multiple times.
// TODO: Foreign Keys : New argument in the insert table query and add a foreign key arg in the database table. Each time someone wants to add a value in there, check if it's possible.
// TODO: Store the database in multiple files so it performs better with millions of lines of data.
// If a table is too memory-heavy for the RAM, split it in the files and in the RAM so that if 2 requests happen at the same time, you load it once for 2 queries.
// TODO: Sync the shared data with the client.
// TODO: Also, sortBy in search function

const DATA_TYPES = ['String', 'Number', 'Date', 'Boolean', 'List', 'Object', 'f_key'];

String.prototype.replaceAll = function(search, replacement) {
  var target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};
String.prototype.splice = function(idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};

Database.prototype.createIndex = function(tablename, key){
  try{
    if(this.data[tablename] === undefined) throw tablename + "is not a table in this database.";
    if(this.data[tablename].properties[key] === undefined) throw key + " is not a property of "+tablename;
    var props = Object.keys(this.data[tablename].properties), index_key = props.indexOf(key);
    if(['Boolean', 'List', 'Object', 'f_key'].indexOf(this.data[tablename].properties[key]) != -1) throw "The key can't be a Boolean, a list, an object or a foreign key.";
    this.data[tablename].indexes[key] = {};
    var data = this.data[tablename].data;
    for(i in data){
      if(this.data[tablename].indexes[key][data[i][index_key]] === undefined) this.data[tablename].indexes[key][data[i][index_key]] = new Array(i);
      else this.data[tablename].indexes[key][data[i][index_key]].push(i);
    }
    return {status:'success', response : 'Index added'};
  }
  catch(err){return {status: 'failed', response : err}};
}
Database.prototype.insertLine = function(nameTable, line, allow_updates){
  try{
    var line_to_send = [];
    if(allow_updates === undefined) var allow_updates = false;
    if(this.data[nameTable] === undefined) throw nameTable + "is not a table in this database.";
    for(col in this.data[nameTable].properties){
      if(line[col] === undefined) throw col + " has not been found in the database.";
      switch(this.data[nameTable].properties[col]){
        case 'Number' : line_to_send.push(parseFloat(line[col])); break;
        case 'Object' : line_to_send.push({obj : JSON.parse(line[col])}); break;
        case 'Date' : line_to_send.push(new Date(line[col])); break;
        case 'f_key' : line_to_send.push({ref : line[col]}); break;
        default : line_to_send.push(line[col]); break;
      }
    }
    var primarykey = line[this.data[nameTable].primarykey];
    if(this.data[nameTable].data[primarykey] !== undefined && !allow_updates) throw primarykey + " is already in the database. Add 'with allow_updates' to the query to update it anyway.";
    this.data[nameTable].data[primarykey] = line_to_send;
    return {status : "success", response : "Line added", nameTable : nameTable, line : line};
  }
  catch(err){var error = new Error(err); return {status :"failed", response : error}; }
}

Database.prototype.insertTable = function(nameTable, primarykey, properties){
  try{
    if(this.data[nameTable] !== undefined) throw nameTable + " already exists in the database.";
    for(i in properties){
      if(properties[i] === 'undefined') throw "You didn't give a type to " + i;
      if(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(i)) throw "You can't put special characters in the property name. "+i;
      if(DATA_TYPES.indexOf(properties[i]) == -1) throw (properties[i] + " for " + i, " is not an acceptable data type. Choose between : " + DATA_TYPES);
    }
    this.data[nameTable] = {nameTable : nameTable, primarykey : primarykey, properties : properties, data : {}, indexes : {}};
    return({response : "Table added", nameTable : nameTable, status:"success"});
  }
  catch(err){var error = new Error(err); console.log(error.stack); return {status:"failed", response : error}; }
}

// Put all the data on file
Database.prototype.backupData = function(nameFile){
  if(nameFile === undefined) var nameFile = "backupdata";
  var tables = [];
  for(i in this.data){
    fs.writeFileSync(nameFile+"_"+i+".json", JSON.stringify(this.data[i]));
    tables.push(i);
  }
  fs.writeFileSync(nameFile+".json", JSON.stringify({tables : tables, objects : this.objects}));
  return {response : "Data backup at "+ new Date(), status : "success"};
}

Database.prototype.splitDatabase = function(){
  if(this.size() > this.splitSize){

  }
}

Database.prototype.rawBackup = function(filepath){
  if(filepath === undefined) var filepath = "backup";
  fs.writeFileSync(filepath+".json", JSON.stringify(this));
}

Database.prototype.loadData = function(nameTable){
  try{
    fs.readFileSync("backupdata.json", "utf8", function(err, result){
      if(err == null){
        this.objects = result.objects;
        if(nameTable === undefined){
          for(i in result.tables){
            var table = result.tables[i];
            fs.readFileSync("backupdata_"+table+".json", "utf8", function(err, result){if(err == null) this.data[table] = result;})}
        }
        else{
          fs.readFileSync("backupdata_"+nameTable+".json", "utf8", function(err, result){if(err == null) this.data[nameTable] = result;})
        }
      }
      else throw err;
    });
  }
  catch(err){var error = new Error(err);}
}

Database.prototype.dump = function(nametable, lines){
  var all_success = true, returned = {count_failed : 0, status : 'success', response : []};
  for(i in lines){
    var response = this.insertLine(nametable, lines[i]);
    all_success = all_success && (response.status == 'success');
    if(response.status == 'failed'){
      returned.status = 'failed'; returned.count_failed++;
      return returned;
    }
  }
  this.backupData();
  return returned;
}
Database.prototype.getSplitSize = function(){return Database.prototype.splitSize;}

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

Database.prototype.sum = function(a, b, c, d){
  return this.operationsInDatabase(a, b, c, d, 'sum');
}
Database.prototype.mean = function(a, b, c, d){
  return this.operationsInDatabase(a, b, c, d, 'mean');
}
Database.prototype.count = function(a, b, c, d){
  return this.operationsInDatabase(a, b, c, d, 'count');
}

Database.prototype.get = function(table, key){
  try{
    if(typeof key !== 'string') throw 'Key must be a string.';
    return this.data[table].data[key];
  }
  catch(err){var error = new Error(err); return {status:'failed', response : error.stack};}
}

Database.prototype.removeLine = function(table, key){delete this.data[table].data[key]; return {status:'success', response : 'Deleted line'};}
Database.prototype.removeTable = function(table){delete this.data[table]; return {status : 'success', response : 'Deleted table'};}
Database.prototype.deleteLine = function(table, key){return this.removeLine(table, key);}
Database.prototype.deleteTable = function(table){return this.removeTable(table);}

Database.prototype.operationsInDatabase = function(table, keys, conditions, operation_key, operation){
  var lines = this.search(table, keys, conditions).response, result = 0;
  var keys = Object.keys(this.data[table].properties),
  ind = keys.indexOf(operation_key);
  switch(operation){
    case 'sum' : for(i in lines) result +=lines[i][ind]; break;
    case 'count' : result = lines.length; break;
    case 'mean' : for(i in lines) result +=lines[i][ind]; result /= lines.length; break;
  }
  return result;
}
Database.prototype.search = function(table, keys, conditions){
  try{
    if(this.data[table] === undefined) throw table+" doesn't exist in the database.";
    var result = [], cond_str = "";
    if(conditions === undefined && typeof(keys) == 'object') for(i in keys) result.push(this.data[table].data[keys[i]]);
    else if(typeof(keys) == 'string') result.push(this.data[table].data[keys]);
    else{
      var funct_str = "";
      var i=0;
      for(prop in this.data[table].properties){ funct_str += "var "+prop+" = data["+i+"]; "; i++;}
      if(typeof(conditions) !== 'object') cond_str = conditions;
      else{
        cond_str = conditions[0];
        var i=1;
        while(i<conditions.length){cond_str += " && "+conditions[i]; i++;}
      }
      funct_str += "if("+cond_str+") return data;";
      var funct_get = new Function("data", funct_str);
      if(keys != null){
        for(i in keys){
          var res_tmp = funct_get(this.data[table].data[keys[i]]);
          if(res_tmp !== undefined) result.push(res_tmp);
        }
      }
      else{
        for(key in this.data[table].data){
          var res_tmp = funct_get(this.data[table].data[key]);
          if(res_tmp !== undefined) result.push(res_tmp);
        }
      }
    }
    return {status : "success", response : result};
  }
  catch(err){var error = new Error(err); return {response : err, status : "failed"};}
}
Database.prototype.indexedSearch = function(tablename, index, keys, conditions){
  try{
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

Database.prototype.addObject = function(keyObject, obj, allow_updates){
  try{
    if(this.objects[keyObject] === undefined && (allow_updates === undefined || !allow_updates))
    throw "This object already exists. Add set allow_updates to true to update it.";
    else this.objects[keyObject] = obj;
  }
  catch(err){var error = new Error();return {status: 'failed', response : error.stack};}
}

module.exports = function(obj){
  if(obj.importCSV !== undefined) Database.prototype.importCSV = obj.importCSV;
  if(obj.exportCSV !== undefined) Database.prototype.exportCSV = obj.exportCSV;
  if(obj.splitSize !== undefined) Database.prototype.splitSize = obj.splitSize;
  return new Database();
}

var fs = require('fs');
var csv = require('fast-csv');

exports.importCSV = function(tablename, pathFile, callback){
  if(this.data[tablename] === undefined) throw tablename+" does not exist in the database.";
 var stream = fs.createReadStream(pathFile);
 var db = this;
 var data_to_dump = [];
 var csvStream = csv
   .parse({headers : true})
   .on("data", function(data){
     data_to_dump.push(data);
   })
   .on("end", function(){
     if(callback !== undefined) callback(db.dump(tablename, data_to_dump));
   })
   .on("error", function(){
     console.log("err");
   })

stream.pipe(csvStream);
}


exports.exportCSV = function(tablename, callback){
  var db = this;
  var props = Object.keys(this.data[tablename].properties);
  var csvStream = csv.createWriteStream({headers: true}),
    writableStream = fs.createWriteStream(tablename+".csv");

  writableStream.on("finish", function(){
    console.log("DONE!");
  });

  csvStream.pipe(writableStream);
  for(i in this.data[tablename].data){
    var obj = {};
    for(j in db.data[tablename].data[i]) obj[props[j]] = db.data[tablename].data[i][j];
    csvStream.write(obj);
   }
  csvStream.end();

}

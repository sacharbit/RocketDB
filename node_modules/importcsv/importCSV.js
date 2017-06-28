var fs = require('fs');
var csv = require('fast-csv');

module.exports = function(tablename, pathFile, callback){
 var stream = fs.createReadStream(pathFile);
 var db = this;
 var data_to_dump = [];
 var csvStream = csv
   .parse({headers : true})
   .on("data", function(data){
     data_to_dump.push(data);
   })
   .on("end", function(){
     callback(db.dump(tablename, data_to_dump));
   });

stream.pipe(csvStream);
}

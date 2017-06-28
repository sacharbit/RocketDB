First, you need to import the module :
```javascript
var db = require('rocketdb')(<options>);
```

- **Insert a table :** insertTable(\<table name\>, \<primary key\>, \<list attributes\>)

**Example :**
```javascript
db.insertTable("users", "userId", {"userId" : "String", "username" : "String", "name" : "String", "lastname" : "String"})
```

Types of variable are : String, Number, Date, Boolean, List, Object

- **Insert a line :** db.insertLine(\<table name\>, \<values\>, \<allow updates [*optional*]\>)

**Example :**
```javascript
db.insertLine("nametable", {userId : '02938', username : 'sacharbit', name : 'Sacha', lastname : 'Charbit'})
```

**Example where we allow updates :**
```javascript
db.insertLine("nametable", {userId : '02938', username : 'sacharbit', name : 'Sacha', lastname : 'Charbit'}, true)
```

- **Insert multiple lines :** db.dumpData(\<table name\>, \<array of values\>])

- **Backup data :**  db.backupData()

- **Load data :**  db.loadData()

- **Import data from csv file :** db.importCSV(\<name table\>, \<filename\>)

- **Export data in csv file :** db.exportCSV(\<name table\>)

To unable import/export from csv :
do ```npm install csv-handler --save```

When you start :
```javascript
var csv_handler = require('csv-handler');
var db = require('rocketdb')({importCSV : csv_handler.importCSV, exportCSV : csv_handler.exportCSV});
```

- **Search in the database :**  db.search(\<nametable\>, \<keys\>, \<conditions\>, \<usingIndexValues\>); *returns* {status:\<'success'/'failed'\>, response : \<array of rows\>}
**Example with no condition but with a key :**
```javascript
db.search("tablename", ["02938"]);
```

**Example with condition and using an index value 'username':**
```javascript
db.search("users", null, ["username == 'sacharbit'"], true);
```

- **Sum :** db.sum(\<table name\>, \<keys\>, \<conditions\>, \<key to check for sum\>) *returns* {status:\<'success'/'failed'\>, response : \<sum of elements\>}

**Example :**
```javascript
db.sum("users", null, ["username == 'sacharbit'"], 'age')
db.count("users", null, ["username == 'sacharbit'"])
```

- **Mean :** db.mean(\<table name\>, \<keys\>, \<conditions\>, \<key to check for mean\>) *returns* {status:\<'success'/'failed'\>, response : \<mean of elements\>}
```javascript
db.mean("users", null, ["username == 'sacharbit'"], 'age')
```

- **Count :** db.count(\<table name\>, \<keys\>, \<conditions\>) *returns* {status:\<'success'/'failed'\>, response : \<count of elements\>}
```javascript
db.count("users", null, ["username == 'sacharbit'"])
```

- **Delete a line :** db.deleteLine(\<tablename\>, \<key of item\>);

- **Delete a table :** db.deleteTable(\<tablename\>);

- **Create an index :** db.createIndex(\<tablename\>, \<key for index\>);

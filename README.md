# RocketDB
RocketDB is a simple and dependency-free NPM module for easy storage and querying of your data.

## Why using RocketDB ?
It's much faster than the competition.
We used the data from [here](https://www.kaggle.com/drgilermo/nba-players-stats) in the players csv file and added the data in all the Databases.

| **Database**   | **Query**  | *Time (in ms)*  |
--- | --- | ---
| Cassandra | ```insert into player(...) values(?, ?, ?, ?, ?, ?, ?, ?)``` x3922  | 823  |
| RocketDB  | ```db.insertLine("player", "id", {...});``` x3922  | 376   |
| Cassandra |   ```select * from player where height = 180 ALLOW filtering```   | 93  |
| RocketDB  |   ```db.search("player", null, ["height == 180"], "weight")```  | 2 |

## Installation
`npm install rocketdb --save`

## What can it do?

- **Insert a table**
- **Insert a line**
- **Insert multiple lines**
- **Backup data**
- **Load data**
- **Import data from csv file**
- **Export data in csv file**
- **Search in the database**
- **Sum**
- **Mean**
- **Count**
- **Delete a line**
- **Delete a table**
- **Create an index**

## Documentation
You can find the documentation of this npm module [here](https://github.com/sacharbit/RocketDB/blob/master/DOCUMENTATION.md).

## Features to add
- Being able to import SQL, etc...
- Being able to split the database in multiple 10MB files for quicker search.
- groupBy query
- Sync the server's data with the client's data (only sdata).
- Graphical interface to handle and show the data to the admin.

## How to contribute ?
- You have an issue? Report it in the issue section.
- You want to update the code. Go ahead and do a pull request. I welcome any changes to the code.
- Want another functionnality? Put it in the issue section with the tag [IDEA].

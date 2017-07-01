const user_attributes = {name:'String', username:'String', lastname:'String', password:'String', age:'Number', email:'String',
firstname:'String', birthday:'Date', gender:'Boolean', city:'String', country:'String', address:'String', postalcode:'String',
phone:'String', mobilephone:'String'}

exports.addUser = function(attributes){
  var userID = this.data.user_database.data.length;
  attributes[userID] = userID;
  this.insertLine("user_database", attributes);
  return {status:'success', response : 'This user has been added.'};
}

exports.configUser = function(list_attributes){
  var nameTable = "user_database";
  var attributesTable = {};
  for(i in list_attributes) attributesTable[list_attributes[i]] = user_attributes[list_attributes[i]];
  attributesTable[userID] = 'Number';
  this.insertTable(nameTable, "userID", attributesTable);
  return {status:'success', response : 'The user is now configured.'};
}

exports.configRequest = function(list_attributes_name, app, path_to_send){
  this.objects._user_request_attributes = list_attributes_name;
  this.objects._app_request = app;
  this.objects._path_to_send = path_to_send;
  return {status:'success', response:'The request is now configured.'};
}

exports.app_post = function(){
  if(this.objects._app_request !== undefined && this.objects._user_request_attributes != undefined && this.objects._path_to_send != 'undefined'){
    var app = this.objects._app_request, list_attributes = this.objects._user_request_attributes, path_to_send = this.objects._path_to_send;
    app.post(path_to_send, function(req,res,err){
      var values = req.body, line = {};
      for(i in list_attributes) line[list_attributes[i]] = values[i];
      this.insertLine("user_database", line);
    });
  }
}

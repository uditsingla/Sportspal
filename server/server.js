    chats_obj=new Mongo.Collection('chats');
    chat_messages_obj=new Mongo.Collection('chat_messages',{idGeneration: 'MONGO'});
    app_notifications_obj=new Mongo.Collection('app_notifications',{idGeneration: 'MONGO'});
    users_obj=new Mongo.Collection('users',{idGeneration: 'MONGO'});
 
 Meteor.startup(function () {
      // code to run on server at startup
      WebApp.connectHandlers.use(function (req, res, next) {
           res.setHeader('access-control-allow-origin', '*');
           return next(); });
    });
    
    Meteor.publish('chats_generated',function(){
        return chats_obj.find({});    
    });
    
    Meteor.publish('chat_messages',function(data){

       // chat_messages_obj.find({created:{$lt:new Date("Tues Dec 01 2015 16:59:01 GMT+0530 (IST)")}});
       if(! Meteor.call('autheticate_user',{'username':data.from.username,'usertoken':data.from.user_token})) {
             throw new Meteor.Error("not-authorized","not-authorized","not-authorized");
         }

        condition_obj = {
            //"user_id":data.user_id,
        };

        if (data.timestamp) {
            condition_obj['created']={'$gt':new Date(data.timestamp*1000)};
        }
        
        if (data.chat_id) {
            condition_obj['chat_id']=data.chat_id;
        }
        
       return chat_messages_obj.find(condition_obj);    
    });
    Meteor.publish('in_app_notifications',function(logged_user_detail){ // publish the app notification collection
       
        var user_id=logged_user_detail.logged_user;
        condition_obj = {
            "user_id":user_id,
            //"type":'event',
        };

        if (logged_user_detail.timestamp) {
            condition_obj['timestamp']={'$gt':logged_user_detail.timestamp};
        }
        
        return app_notifications_obj.find(condition_obj, {sort: {timestamp: 1}});
       
    });
   
    
    chat_messages_obj.allow({
        'insert':function(user_id,doc)
        {
      
         if(! Meteor.call('autheticate_user',{'username':doc.from.username,'usertoken':doc.from.user_token})) {
             throw new Meteor.Error("not-authorized","not-authorized","not-authorized");
         }

         var authusername = doc.from.username;
         var authusertoken = doc.from.user_token;
         var api_url = doc.api_url;
         
         delete doc.from.username;
         delete doc.from.user_token;
         delete doc.api_url;
         doc._id=new Mongo.ObjectID;
         doc.chat_id=doc.chat_id;
         doc.message=doc.message;
         doc.from._id=new Mongo.ObjectID;
         doc.from.user_id=doc.from.user_id;
         doc.from.first_name=doc.from.first_name;
         doc.from.last_name=doc.from.last_name;
         doc.sentOn=moment().utc().format('MMMM Do, YYYY h:mm a');
         doc.modified=new Date();
         doc.created=new Date();
        
            /** var new_doc= {
                "_id" : new Mongo.ObjectID,
                "chat_id" : doc.chat_id,
                "message" : doc.message,
                "from" : {
                    "_id" : new Mongo.ObjectID,
                    "user_id" : doc.from.user_id,
                    "first_name" : doc.from.first_name,
                    "last_name" : doc.from.last_name
                },
                "sentOn" : moment().format('MMMM Do, YYYY h:mm a'),
                "modified" : new Date(),
                "created" : new Date()
            }
            chat_messages_obj.insert(new_doc); **/
            Meteor.http.call('POST',
                              api_url+'chats/'+doc.chat_id+'/setChatNotifications',
                              {
                                 data: doc,
                                 headers: {
                                    "content-type":"application/json",
                                    "username":authusername,
                                    "user-token":authusertoken
                                  },
                              }, function( error, response ) {
                                 
                              });
            
            return true;
        }
    });
    
    
    Meteor.methods({  // methods that are called for eventuosity
        'print_string':function()
        {
            
            console.log( 'Hello Sir');
        },
        'get_chats_mobile':function(data)
        {
      
            if(! Meteor.call('autheticate_user',{'username':data.from.username,'usertoken':data.from.user_token})) {
                throw new Meteor.Error("not-authorized","not-authorized","not-authorized");
            }
            
            
               condition_obj = {
                   "chat_id":data.chat_id
               };
           
               if (data.record_limit=='') {
                  record_limit = 50;
               } else {
                   record_limit = data.record_limit;
               }
            if(data.timestamp) {   
               if (data.timestamp_order=='lt') {
                  condition_obj['created']={'$lt':new Date(data.timestamp)};
               } else {
                  condition_obj['created']={'$gt':new Date(data.timestamp)};
               }
            }
              var user_chat_msgs = chat_messages_obj.find(condition_obj, {sort: {created: -1}, limit:record_limit}).fetch().reverse();
            
            if (user_chat_msgs.length>0) {
                return user_chat_msgs
            }
            else
            {
                var array_to_return=[];
                return array_to_return;
            }
            
        },
        'get_chats':function(user_chat_id,user_id)
        {
         
var user_chat_msgs= chat_messages_obj.find({chat_id:user_chat_id},{sort: {created: 1}}).fetch();
            if (user_chat_msgs.length>0) {
                return user_chat_msgs
            }
            else
            {
                var array_to_return=[];
                return array_to_return;
            }
            
        },
        'get_chats_with_pagination':function(data)
        { 
               condition_obj = {
                   "chat_id":data.chat_id
               };
           
               if (data.record_limit=='') {
                  record_limit = 50;
               } else {
                   record_limit = data.record_limit;
               }
            if(data.timestamp) {   
               condition_obj['created']={'$lt':new Date(parseInt(data.timestamp))};
            }
           
              var user_chat_msgs = chat_messages_obj.find(condition_obj, {sort: {created: -1}, limit:record_limit}).fetch().reverse();
           
            var user_chat_msgs_count = chat_messages_obj.find({'chat_id':data.chat_id}, {sort: {created: 1}, limit:record_limit}).fetch().length;

            if (user_chat_msgs.length>0) {
               var array_to_return = {
                     'count':user_chat_msgs_count,
                     'messages':user_chat_msgs,
                     'messages_count':user_chat_msgs.length
                  };
            } else {
                var array_to_return = {
                     'count':0,
                     'messages':'',
                     'messages_count':0
                  };
            }
           return array_to_return; 
        },
        'getpreviousnotifications':function(data)
        {
     
             if(! Meteor.call('autheticate_user',{'username':data.from.username,'usertoken':data.from.user_token})) {
                throw new Meteor.Error("not-authorized","not-authorized","not-authorized");
            }
               condition_obj = {
                   "user_id":data.user_id,
                   "type":data.notification_type,
               };
           
               if (data.record_limit=='') {
                  record_limit = 50;
               } else {
                   record_limit = data.record_limit;
               }
            if(data.timestamp) {   
               if (data.timestamp_order=='lt') {
                  condition_obj['timestamp']={'$lt':data.timestamp};
               } else {
                  condition_obj['timestamp']={'$gt':data.timestamp};
               }
            }
              user_notification_msgs = app_notifications_obj.find(condition_obj, {sort: {timestamp: -1}, limit:record_limit}).fetch().reverse();
              
            if (user_notification_msgs.length>0) {
                return user_notification_msgs;
            }
            else
            {
                var array_to_return=[];
                return array_to_return;
            }
            
        },
        'getallnotifications':function(data)
        {
             if(! Meteor.call('autheticate_user',{'username':data.from.username,'usertoken':data.from.user_token})) {
                throw new Meteor.Error("not-authorized","not-authorized","not-authorized");
            }
               condition_obj = {
                   "user_id":data.user_id,
                   "type":'event',
               };
           
               if (data.record_limit=='') {
                  record_limit = 50;
               } else {
                   record_limit = data.record_limit;
               }
            if(data.timestamp) {   
               if (data.timestamp_order=='lt') {
                  condition_obj['timestamp']={'$lt':data.timestamp};
               } else {
                  condition_obj['timestamp']={'$gt':data.timestamp};
               }
            }
            
            
              event_notifications = app_notifications_obj.find(condition_obj, {sort: {timestamp: -1}, limit:record_limit}).fetch().reverse();
              
              delete condition_obj.type;
              condition_obj['type']='message';
              
              message_notifications = app_notifications_obj.find(condition_obj, {sort: {timestamp: -1}, limit:record_limit}).fetch().reverse();
              
              delete condition_obj.type;
              condition_obj['type']='chat';
              
              chat_notifications = app_notifications_obj.find(condition_obj, {sort: {timestamp: -1}, limit:record_limit}).fetch().reverse();
            
            var event_notifications = event_notifications.concat(message_notifications);
            
            event_notifications = event_notifications.concat(chat_notifications);
            
            if (event_notifications.length>0) {
                return event_notifications;
            }
            else
            {
                var array_to_return=[];
                return array_to_return;
            }
            
        },
        'get_last_record':function(user_chat_id,user_id)
        {
            
            var user_chat_msgs= chat_messages_obj.find({chat_id:user_chat_id},{sort:{$natural:-1}, limit: 1}).fetch().pop();
            return user_chat_msgs;
         },
        'autheticate_user':function(user_data)
        {
              var selector = {};
                selector['username'] = user_data.username;
                selector['Token.usertoken'] = user_data.usertoken;
              var user_db_data =  users_obj.findOne(selector);
          
              if (user_db_data) {
                  var current_timestamp="";
                  if (!current_timestamp) {
                        current_timestamp =  Math.floor(Date.now() / 1000); 
                  }
                  for (i = 0; i < user_db_data.Token.length; i++) {
                         if (user_db_data.Token[i].usertoken==user_data.usertoken && current_timestamp<=user_db_data.Token[i].expiry) {
                            return true;
                         }
                     }
                    return false;
              } return false; 
             
        }
    });
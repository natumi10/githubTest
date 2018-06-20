var express = require('express');
var app = require('express')(),
server  = require("http").createServer(app),
io = require("socket.io")(server),
session = require("express-session")({
    secret: "my-secret",
    resave: true,
    saveUninitialized: true
  }),
  sharedsession = require("express-socket.io-session");

var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('board_data.sqlite3')


// Attach session
app.use(session);
 
// Share session with io sockets


//const ioo = require('socket.io-client');

//var io = require('socket.io').listen(server);

server.listen(8888);//




io.sockets.on('connection', function (socket) {


 var room = '';
    var name = '';
 
    // roomへの入室は、「socket.join(room名)」
    socket.on('client_to_server_join', function(data) {
        room = data.value;
        socket.join(room);
		console.log("入");
    });
    // S05. client_to_serverイベント・データを受信する
    socket.on('client_to_server', function(data) {
        // S06. server_to_clientイベント・データを送信する
				console.log("????==============入１",data.value,data.name);

        io.to(room).emit('server_to_client', {value : data.value,name : data.name});
    });
    // S07. client_to_server_broadcastイベント・データを受信し、送信元以外に送信する
    socket.on('client_to_server_broadcast', function(data) {
					console.log("入2");

        socket.broadcast.to(room).emit('server_to_client', {value : data.value});
    });
    // S08. client_to_server_personalイベント・データを受信し、送信元のみに送信する
    socket.on('client_to_server_personal', function(data) {
						console.log("入3");

        var id = socket.id;
        name = data.value;
        var personalMessage = "あなたは、" + name + "さんとして入室しました。"
        io.to(id).emit('server_to_client', {value : personalMessage});
    });
    // S09. dicconnectイベントを受信し、退出メッセージを送信する
    socket.on('disconnect', function() {
        if (name == '') {
            console.log("未入室のまま、どこかへ去っていきました。");
        } else {
            var endMessage = name + "さんが退出しました。"
            io.to(room).emit('server_to_client', {value : endMessage});
        }
    });













    // この中でデータのやり取りを行う
    console.log('connected=============');
	var data1="ggggggggggggggggggg";
	socket.emit("myevent", data1);

socket.on('room', function(room) {
        socket.join(room);
		console.log('socket.join(room)');
    });
	
	socket.on("av",function(data2){
	   console.log('data2~~~~~~~~~~~~~~~~~~~!?',data2);
	
	});

room = "abc123";



 // メッセージ送信処理
var s_message_arr=[];//サーバー側のメッセージアレー
	socket.on("my",function(input_chat_data){
	   user_id = input_chat_data.login_id;
	   room_number = input_chat_data.room;
	   message = input_chat_data.value;
	   created_at =input_chat_data.time; 
	   updated_at=input_chat_data.time;
	   db.run('insert into messages(user_id,room,message,created_at,updated_at)values(?,?,?,?,?)',user_id,room_number,message,created_at,updated_at);
	   
	   s_message_arr.push(input_chat_data.value)
console.log('========================',s_message_arr)
io.sockets.in(room).emit('message', s_message_arr);

	   console.log('VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV~~~~~~~~~~~~~~~~~~~');
	console.log('バババッバババババば');
	});


	
	
	
  });







//var io_soket = require('socket.io-client');

//soket.on("connect",function() {
　//document.write('サーバーと接続しました。');

//});

 io.use(sharedsession(session));

//socket.on('myevent',function(data){
//    console.log("data===",data);
//});














io.on('connection',function(socket){
console.log("connection");




    // Accept a login event with user's data
    socket.on("login", function(userdata) {
	console.log("login");

        socket.handshake.session.userdata = userdata;
        socket.handshake.session.save();
    });
    socket.on("logout", function(userdata) {
		console.log("logout");

        if (socket.handshake.session.userdata) {
            delete socket.handshake.session.userdata;
            socket.handshake.session.save();
        }
    });        
});


var router = express.Router();

var knex = require('knex')({
   dialect: 'sqlite3',
   connection: {
      filename: 'board_data.sqlite3'
   },
   useNullAsDefault:true
});

var Bookshelf = require('bookshelf')(knex);

Bookshelf.plugin('pagination');

var User = Bookshelf.Model.extend({
   tableName: 'users'
});

var Message = Bookshelf.Model.extend({
   tableName: 'messages',
   hasTimestamps: true,
   user: function() {
      return this.belongsTo(User);
   }
});

router.get('/', (req, res, next) => {
   if (req.session.login == null){
      res.redirect('/users');
   } else {
      res.redirect('/1');
   }
});

router.get('/:page', (req, res, next) => {
   if (req.session.login == null){
      res.redirect('/users');
      return;
   }
   var pg = req.params.page;
   pg *= 1;
   if (pg < 1){ pg = 1; }
   new Message().orderBy('created_at', 'DESC')
         .fetchPage({page:pg, pageSize:10, withRelated: ['user']})
         .then((collection) => {
      var data = {
         title: 'miniBoard',
         login:req.session.login,
         collection:collection.toArray(),
         pagination:collection.pagination
      };
      res.render('index', data);
   }).catch((err) => {
      res.status(500).json({error: true, data: {message: err.message}});
   });

});

router.post('/',(req, res, next) => {
var rec = {
   message: req.body.msg,
   user_id: req.session.login.id
 }
 new Message(rec).save().then((model) => {
   res.redirect('/');
 });
})

module.exports = router;

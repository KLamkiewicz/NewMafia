$(function(){
var socket = io.connect();

//Login
	//Hide the game, show only login
	$("#game").hide();
	//Hide the login button, work only on 'Enter'
	$("#loginButton").hide(); 
	$("#sendMessage").hide();
	
	//
	$("#loginButton").click(function(e){
		e.preventDefault();
		console.log($("#username").val());
		login();
	});

	var login = function(){
		//Hide login form, show game
		socket.emit("add user", $("#username").val());
		$("#loginForm").hide();
		$("#game").show();
	};

// //Game
var listOfPlayers = [];

	socket.on("connect", function(){
		console.log("You have been connected");
	});

	socket.on("list of players", function(list){
		$.each(list, function(name){
			$("#alive").append("<span>" + list[name] + "</span>");
		});
	});

	$("#sendMessage").click(function(e){
		e.preventDefault();
		socket.emit("send message", $("#chatMessage").val());
		$("#chatMessage").val("");
	});

	socket.on("received message", function(username, message){
		$("#chat").append("<div>" + username + ": " + message + "</div>");
	});

	socket.on('start game', function(role){
		// var x = role;
		// console.log(x);
	});

	socket.on('in room', function(player){
		$("#alive").append("<span>" + player + "</span>");
	});
});
$(function(){
var socket = io.connect();

//Login
	//Hide the game, show only login
	$("#game").hide();
	//Hide the login button, work only on 'Enter'
	$("#loginButton").hide(); 
	$("#sendMessage").hide();
	
	//Login to the game
	$("#loginButton").click(function(e){
		e.preventDefault();
		console.log($("#username").val());
		login();
	});

	//Client joins the game and is added as a new user 
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

	//Message sending
		$("#sendMessage").click(function(e){
			e.preventDefault();
			socket.emit("send message", $("#chatMessage").val());
			$("#chatMessage").val("");
		});

		socket.on("received message", function(username, message){
			$("#chat").append("<div>" + username + ": " + message + "</div>");
		});

	/*
		Client fetches the necessary view particle from the server,
		the startTheGame function is called with view and the role side passed
	*/
	socket.on('start game', function(role){
		$.ajax({
			url: '/' + role.side,
			method: "GET",
			success: function(data){
				 startTheGame(data, role.side);
			},
			fail: function(){

			}
		});
	});

	/*
		Start game modifies the view of the client based on allegiance,
		if he is placed on the village side, he is "sleeping" and may be killed,
		if he is placed on the mafia side, he may chat in room with the other
		mafia players, and vote who to kill - majority vote wins
	*/
	var startTheGame = function(html, role){
		if(role === 'village'){
			$("body").append(html);
			$("#chatWrap").hide();
			$("#village").hide();
		}
		else if(role ==='mafia'){
			$("body").append(html);
			$.each(listOfPlayers, function(id, player){
				 $("#kill").append('<option value=' + player  + '>' + player +'</option>');
			});
			choiceChange();
		}
	};

	var nextRound = function(){

	};

	/*
		Adding change listener to the list of players mafia may kill,
		vote counting is started after all players cast their vote
		//or alloted time is up
	*/
	var choiceChange = function(){
		$("#kill").change(function(){
			$("#kill option:selected").each(function(){
				console.log($(this).val());
			});
		});
	};

	/*
		On joining the game client receives the list of all players,
		which is displayed on the left
	*/
	socket.on("on join list players", function(list){
		$.each(list, function(name){
			listOfPlayers.push(list[name]);
			$("#alive").append("<span id=\"" + list[name] + "\">" + list[name] + "</span>");
		});
	});

	/*
		Client is notified that a new player joined, list of players is updated
	*/
	socket.on('new player joined', function(player){
		listOfPlayers.push(player);
		$("#alive").append("<span id=\"" + player + "\">" + player + "</span>");
	});

	/*
		If the player leaves the game, he is killed, there is no mercy for quitters
	*/
	socket.on("player disconnected", function(player){
		var id = listOfPlayers.indexOf(player);
		listOfPlayers.splice(id, 1);
		$("#" + player).remove();
		$("#dead").append(player);
	});

});
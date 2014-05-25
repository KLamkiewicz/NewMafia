$(function(){
var socket = io.connect();

//Login

	// $.ajax({
	// 	url: '/login',
	// 	method: "GET",
	// 	success: function(html){
	// 		prepareLoginView(html);
	// 	},
	// 	fail: function(){

	// 	}
	// });
	

	var prepareLoginView = function(html){
		$("body").html(html);
		//Login to the game
		$("#loginButton").click(function(e){
			e.preventDefault();
			console.log($("#username").val());
			login();
		});
		$("#loginButton").hide(); 
	};



	//Client joins the game and is added as a new user 
	var login = function(){
		//Hide login form, show game
		// socket.emit("add user", $("#username").val());
		socket.emit("add user", "admin");
		// $("#loginForm").hide();
		// $("#game").show();

		// $.ajax({
		// 	url: '/game',
		// 	method: "GET",
		// 	success: function(html){
		// 		prepareGameView(html);
		// 	},
		// 	fail: function(){

		// 	}
		// });
	};
	
	login();


	var prepareGameView = function(html){
		$("body").html(html);
		$("#sendMessage").hide();
		$("#sendMessage").click(function(e){
			e.preventDefault();
			socket.emit("send message", $("#chatMessage").val());
			$("#chatMessage").val("");
		});
		socket.emit("ready for list");
	};


// //Game
var listOfPlayers = [];

	socket.on("connect", function(){
		console.log("You have been connected");
	});


	//Message received
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
		Game start modifies the view of the client based on allegiance,
		if he is placed on the village side, he is "sleeping" and may be killed,
		if he is placed on the mafia side, he may chat in room with the other
		mafia players, and vote who to kill - majority vote wins
	*/
	var startTheGame = function(html, role){
		console.log(role);
		if(role === 'village'){
			$("#chatWrap").html("");
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
				//console.log($(this).val());
				socket.emit("kill vote", $(this).val());
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
			console.log("Player from list " + list[name]);
			$("#alive").append("<span id=\"" + list[name] + "\">" + list[name] + "</span>");
		});
	});

	/*
		Client is notified that a new player joined, list of players is updated
	*/
	socket.on('new player joined', function(player){
		console.log("JOINED " + player);
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

	socket.on("player killed", function(player){
		var id = listOfPlayers.indexOf(player);
		listOfPlayers.splice(id, 1);
		$("#" + player).remove();
		$("#dead").append(player);
		$("#chat").append("Player " + player + " has been tragically killed");
	});

});
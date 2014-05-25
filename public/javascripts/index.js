$(function(){
var socket = io.connect();


	//Can remove add user' and add him from auth on connect
	socket.on("connect", function(){
		console.log("You have been connected");

		socket.emit("add user", "admin");
	});


	//Message sent
	$("#sendMessage").click(function(e){
		e.preventDefault();
		socket.emit("send message", $("#chatMessage").val());
		$("#chatMessage").val("");
	});

	//Message received
	socket.on("received message", function(username, message){
		$("#chat").append("<div>" + username + ": " + message + "</div>");
	});


// //Game
var listOfPlayers = [];

	/*
		Client fetches the necessary view particle from the server,
		the startTheGame function is called with view and the role side passed
	*/
	socket.on('start game', function(role){
		$.ajax({
			url: '/' + role.side,
			method: "GET",
			success: function(data){
				console.log("SUCCESSS");
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
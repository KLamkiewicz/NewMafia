$(function(){
var socket = io.connect();


	//Can remove add user' and add him from auth on connect
	socket.on("connect", function(){
		console.log("You have been connected");

		socket.emit("add user", "admin");
	});


	//Message sent
	var sendMessageClick = function(){
		$("#sendMessage").click(function(e){
			e.preventDefault();
			socket.emit("send message", $("#chatMessage").val());
			$("#chatMessage").val("");
		});
	};
	sendMessageClick();
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
			//$("#chatWrap").remove();
			$("#play").remove();
		}
		else if(role ==='mafia'){
			//get list of players
			$("#play").append(html);
			choiceChange(false);
		}
	};

	var nextRound = function(data, isDay, side){

		if(isDay){
			if($("#play").length<1){
				$("#game").append(data);
			}else{
				$("#play").remove();
				$("#game").append(data);
			}
			$("#chat").html('');
			sendMessageClick();
			choiceChange(true);

		}else{
			if(side === 'village'){
				$("#play").remove();
			}else if(side === 'mafia'){
				$("#village").remove();
				$("#play").append(data);
				$("#chat").html('');
				choiceChange(false);
			}
		}
	};

	/*
		Adding change listener to the list of players mafia may kill,
		vote counting is started after all players cast their vote
		//or alloted time is up
	*/
	var choiceChange = function(isDay){
		if(!isDay){
			console.log(listOfPlayers);
			$.each(listOfPlayers, function(id, player){
				 $("#kill").append('<option value=' + player  + '>' + player +'</option>');
			});
			$("#kill").change(function(){
				$("#kill option:selected").each(function(){
					console.log($(this).val());
					socket.emit("kill vote", $(this).val());
				});
			});
		}else{
			console.log("ITS DAY TIME");
			console.log(listOfPlayers);
			$.each(listOfPlayers, function(id, player){
				console.log("APPEND");
				 $("#killAll").append('<option value=' + player  + '>' + player +'</option>');
			});
			$("#killAll").change(function(){
				$("#killAll option:selected").each(function(){
					socket.emit("kill vote", $(this).val());
				});
			});
		}
	};

	socket.on('next round', function(nextRoundData){
		var isDay = nextRoundData.day;
		var side = nextRoundData.side;
		console.log("H E      ZXXXXXXXXX HE FDSDSAD{PA {");
		console.log(nextRoundData);

		if(isDay){
			console.log("Next round will be sunny");

			$.ajax({
				url: '/village',
				method: "GET",
				success: function(data){
					console.log("SUCCESSS");
					 nextRound(data, isDay);
				},
				fail: function(){

				}
			});

		}else{
			console.log("Next round will be bloody");
			$.ajax({
				url: '/mafia',
				method: "GET",
				success: function(data){
					console.log("SUCCESSS");
					nextRound(data, isDay, side);
				},
				fail: function(){

				}
			});
		}
		console.log(isDay);
	});

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

	// socket.on("player killed", function(player){
	// 	var id = listOfPlayers.indexOf(player);
	// 	listOfPlayers.splice(id, 1);
	// 	$("#" + player).remove();
	// 	$("#dead").append(player);
	// 	$("#chat").append("Player " + player + " has been tragically killed");
	// });

});
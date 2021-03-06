$(function(){
var socket = io.connect('http://' + location.host);
var theplayername = "";
var dead = false;
var gameover = false;
var report = "";
var chat = $("#chat");
var gameWinner = "";
var $input;
var howMuch = 0;

	//Can remove add user' and add him from auth on connect
	socket.on("connect", function(){
		console.log("You have been connected");

		socket.emit("add user", "");
	});

	socket.on('get name', function(myName){
		theplayername = myName;
	});


	var scrollBot = function(){
		chat = $("#chat");
		howMuch = document.getElementById("chat").scrollHeight;
		chat.scrollTop(howMuch);
	};

	//Message sent
	var sendMessageClick = function(){


		$("#sendMessage").click(function(e){
			e.preventDefault();
			$input = $("#chatMessage").val();

			if($input === ''){
				$("#msgmsg").html("Message cannot be empty");
			}else if($input.length > 50){
				$("#msgmsg").html("Message is too long");
			}
			else{
				socket.emit("send message", $("#chatMessage").val());
				$("#chatMessage").val("");
				$("#msgmsg").html("");
			}
		});
		scrollBot();
	};
	sendMessageClick();
	//Message received
	socket.on("received message", function(username, message){
		$("#chat").append("<div class='alert alert-info alive'>" + username + ": " + message + "</div>");
		//$chat.scrollTop = $chat.scrollHeight;
		scrollBot();
	});


	var enableDeadSocket = function(){

		$("#sendMessage").click(function(e){
			e.preventDefault();
			$input = $("#chatMessage").val();

			if($input === ''){
				$("#msgmsg").html("Message cannot be empty");
			}else if($input.length > 50){
				$("#msgmsg").html("Message is too long");
			}
			else{
				socket.emit("dead message", $("#chatMessage").val());
				$("#chatMessage").val("");
				$("#msgmsg").html("");
			}
		});

		socket.on("received dead message", function(username, message){
			console.log("WORKING DEAD MESSAGE");
			$("#chat").append("<div class='alert alert-info dead'>" + username + ": " + message +"</div>");
			scrollBot();
			//var howMuch = $("#chat").prop('scrollHeight');
		});
	};


// //Game
var listOfPlayers = [];

	/*
		Client fetches the necessary view particle from the server,
		the startTheGame function is called with view and the role side passed
	*/
	socket.on('start game', function(startData){
		var side = startData.side;
		var killList = startData.list;
		var voteList = startData.voteList;
		var name = startData.role;

		$.ajax({
			url: '/' + side,
			method: "GET",
			success: function(data){
				console.log("SUCCESSS");
				startTheGame(data, side, killList, voteList);
			},
			fail: function(){

			}
		});
		$("#" + theplayername + "icon").html('<img src="images/characters/' + name +'.png" height="32" width="32" class="mafia">');
	});

	socket.on('report', function(report){
		$("#chat").append(report);
	});

	/*
		Game start modifies the view of the client based on allegiance,
		if he is placed on the village side, he is "sleeping" and may be killed,
		if he is placed on the mafia side, he may chat in room with the other
		mafia players, and vote who to kill - majority vote wins
	*/
	var startTheGame = function(html, role, killList, list){
		console.log(role);
		if(role === 'village'){
			//$("#chatWrap").remove();
			$("#play").remove();
		}
		else if(role ==='mafia'){
			//get list of players
			$("#chat").html('');
			$("#play").append(html);

			$.each(list, function(index, name){
				$("#mafiaVotes").append("<div class='vote'> <span class='voteuser' data-username=" + name + ">" + name + ' voted : ' +"</span><span class='voteResult'></span></div>");
			});
			choiceChange(false, killList);
		}
	};

	var nextRound = function(data, isDay, side, killList, list, report){
		console.log("GOT REPORT " + report);

		if(isDay){
			if($("#play").length<1){
				$("#game").append(data);
			}else{
				$("#play").remove();
				$("#game").append(data);
			}
			$("#chat").html('');
			if(report)
				$("#chat").append(report);
			
			$.each(list, function(index, name){
				$("#villageVotes").append("<div class='vote'> <span class='voteuser' data-username=" + name + ">" + name + ' voted : ' +"</span><span class='voteResult'></span></div>");
			});

			sendMessageClick();
			choiceChange(true, killList);
		}else{
			if(side === 'village'){
				$("#play").remove();
			}else if(side === 'mafia'){
				$("#village").remove();
				$("#villageDiv").remove();
				$("#play").append(data);
				$("#chat").html('');

				$.each(list, function(index, name){
					$("#mafiaVotes").append("<div class='vote'> <span class='voteuser' data-username=" + name + ">" + name + ' voted : ' +"</span><span class='voteResult'></span></div>");
				});
				choiceChange(false, killList);
			}
		}
	};

	/*
		Adding change listener to the list of players mafia may kill,
		vote counting is started after all players cast their vote
		//or alloted time is up
	*/
	var choiceChange = function(isDay, killList){
		if(!isDay){
			console.log(listOfPlayers);
			$.each(killList, function(id, player){
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
			$.each(killList, function(id, player){
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
		var killList = nextRoundData.list;
		var list = nextRoundData.voteList;
		var report = nextRoundData.report;
		console.log("H E      ZXXXXXXXXX HE FDSDSAD{PA {");
		console.log(nextRoundData);

		if(isDay){
			console.log("Next round will be sunny");

			$.ajax({
				url: '/village',
				method: "GET",
				success: function(data){
					console.log("SUCCESSS");
					 nextRound(data, isDay, side, killList, list, report);
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
					nextRound(data, isDay, side, killList, list);
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
			$("#alive").append("<div class='player' id=\"" + list[name] + "\">"  + '<span class="playerSpan">'+ list[name] + '</span>' +"</div>");
			$("#"+list[name]).prepend('<span id="' + list[name] + 'icon"> <img src="images/unknown/unk.png" height="32" width="32" class="unknown"> </span>');
		});
	});

	/*
		Client is notified that a new player joined, list of players is updated
	*/
	socket.on('new player joined', function(player){
		console.log("JOINED " + player);
		listOfPlayers.push(player);
		$("#alive").append("<div class='player' id=\"" + player + "\">" + '<span class="playerSpan">'+ player + '</span>' +"</div>");
		$("#"+player).prepend('<span id="' + player + 'icon"> <img src="images/unknown/unk.png" height="32" width="32" class="unknown"> </span>');
		$("#chat").append("<div class='alert alert-info'> Player " + player + " has joined the game </div>");
		scrollBot();
	});

	/*
		If the player leaves the game, he is killed, there is no mercy for quitters
	*/
	socket.on("player disconnected", function(player){
		var name = player.name;
		var alive = player.alive;
		var rolename = player.role;
		var id = listOfPlayers.indexOf(name);
		if(alive){
			listOfPlayers.splice(id, 1);
			$("#" + name).remove();
			//$("#dead").append(name);
			$("#dead").append('<span id="' + name + 'icon"> <img src="images/characters/' + rolename + '.png"" height="32" width="32" class="unknown"> ' + name +'</span>');
		}
	});

	socket.on("player left", function(player){
		var name = player.name;
		var id = listOfPlayers.indexOf(name);
		listOfPlayers.splice(id, 1);
		$("#" + name).remove();
		$("#chat").append("<div class='alert alert-warning'>Player " + name + " has left the room</div>");
		scrollBot();
	});

	socket.on("player killed", function(data){
		var player = data.name;
		var rolename = data.rolename;

		var id = listOfPlayers.indexOf(player);
		listOfPlayers.splice(id, 1);
		$("#" + player).remove();
		$("#dead").append('<div class="player"> <span id="' + player + 'icon"> <img src="images/characters/' + rolename + '.png"" height="32" width="32" class="unknown"> ' + player +'</span></div>');
	});


	socket.on("kill list vote", function(data){
		var username = data.username;
		var vote = data.vote;
		//$("div [data-username="+username+"]").next().html('<span class="voteResult">' + vote + '</span>');
		if(vote === ' '){
			$("div [data-username="+username+"]").next().html("No one");
		}else{
			$("div [data-username="+username+"]").next().html(vote);
		}
	});

	socket.on('you are dead', function(data){
		dead = true;
		console.log("YOU HAVE BEEN KILLED");
		$.ajax({
			method: "get",
			url: '/spectator',
			success: function(html){
				$("#play").remove();
				$("#game").append(html);
				enableDeadSocket();
				if(gameover){
					$("#chat").append(gameWinner + " has won the game");
				}
			},
			fail: function(){

			}
		});
	
	});

	socket.on('vote time', function(time){
		$("#time").html("Time left: " + time);
		console.log(time);
		console.log(dead);
	});

	socket.on('winner', function(winner){
		gameover = true;
		console.log(winner + " HAS WON THE GAME");
		if(dead){
			gameWinner = winner;
			$("#chat").html("");
			$("#chat").append('<div class="msg">' + winner + " has won the game" + '</div>' );
		}
		else{
			$("#play").remove();
			$.ajax({
				method: "get",
				url: '/spectator',
				success: function(html){
					$("#game").append(html);
					$("#chat").append('<div class="msg">' + winner + " has won the game" + '</div>' );
					enableDeadSocket();
				},
				fail: function(){

				}
			});
		}
	});

	socket.on("welcome", function(message){
		$("#chat").append('<div class="alert alert-success">' + message + '</div>' );
		scrollBot();
	});

	socket.on("game stopped", function(message){
		$("#chat").append('<div class="alert alert-danger">' + message + '</div>' );
		scrollBot();
	});

	socket.on("game will start", function(message){
		$("#chat").append('<div class="alert alert-info">' + message + '</div>' );
		scrollBot();
	});

});
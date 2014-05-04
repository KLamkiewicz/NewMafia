$(function(){
    var socket = io.connect();
	var canAdd = true;
	var nickname = "";


	socket.on("connected", function(data){
		console.log(data);
	});

	//Player name
	//Should check through server if there is already a player with the same nickname
	//or if the room is full
	$("#nicknameButton").click(function(){
		nickname = $("#nicknameInput").val();
		$.ajax({
			type: "POST",
			data: JSON.stringify({nickname: nickname}),
			url: "/login",
			success: function(data){
				if(data)
					addPlayer(nickname);
				else
					$("#pError").html("User already exists").css('color', 'red');
			},
			fail: function(data){
				console.log("Error");
			},
			 contentType: "application/json",
		});
	});

	var addPlayer = function(username){
		socket.emit("add player", username);
		$("#pError").html("");
	};

});
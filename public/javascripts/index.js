$(function(){

	//Player name
	//Should check through server if there is already a player with the same nickname
	//or if the room is full
	$("#nicknameButton").click(function(){
		$input = $("#nicknameInput").val();
		if($input === ''){
			$("#pError").html("Your nickname cannot be empty!");
		}else if($input.length<3){
			$("#pError").html("Too short! Can't be shorter than 3 letters.");
		}else if($input.length>15){
			$("#pError").html("Too long! Can't be longer than 15 letters.");
		}else{
			$("#pError").html("");
			$.ajax({
				url: "/game",
				success : window.location = "/game"
			});
		}
	});

});
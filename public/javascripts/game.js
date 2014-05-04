$(function(){
var socket = io.connect();

	$.ajax({
		url: "./test",
		method: "GET",
		success: function(data){
			socket.emit("add player", data);
			socket.emit("join room");
		},
		fail: function(){

		}
	});

	socket.on('user', function(name){
		console.log(name + " JOINED");
	});
	

});
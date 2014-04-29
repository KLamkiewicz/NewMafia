var express = require('express');
var router = express.Router();

/* GET home page. */
// router.get('/', function(req, res) {
//   //res.render('game', { title: 'Express' });
//   //res.send("uppp");
//   res.render('game');
// });
router.get('/', function(req, res) {
	//res.redirect('/game');
	console.log("ssx");
	res.render('game');
});

module.exports = router;
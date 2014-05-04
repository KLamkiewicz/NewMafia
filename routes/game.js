var express = require('express');
var router = express.Router();
var app = require('../app');

/* GET home page. */
// router.get('/', function(req, res) {
//   //res.render('game', { title: 'Express' });
//   //res.send("uppp");
//   res.render('game');
// });
router.get('/', function(req, res) {
	res.render('game');
});



module.exports = router;
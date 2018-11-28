var express = require('express');
var path = require('path');
var MongoClient = require('mongodb')
var dbutils = require('./dbutils');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("req:", req);
  res.sendFile(path.join(__dirname+'/../html/index.html'));
});

/* Path to get JSON data from MongoDB
 * usage: http://localhost:3000/getdata?ticker=eth
 */
router.get('/getdata', async (req, res) => {
  console.log("/getdata");
  console.log("req.query", req.query);
  var ticker = (req.query.ticker!=undefined ? req.query.ticker : "ALL");
  console.log("Got ticker: ", ticker);
  res.setHeader('Content-Type', 'application/json');
  var ethData = await dbutils.getTransactionsAndPrices();
  res.send(JSON.stringify(ethData));
});

module.exports = router;

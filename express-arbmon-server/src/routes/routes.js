import { getArbitrageData } from "../utils/dbUtils"
const express = require('express');
const path = require('path');

var appRouter = function (app) {
  
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
  
  var dirname = "/usr/local/dist/arbmon/";
  app.use(express.static(path.join(dirname, 'build-ui')));
  app.get('/', function(req, res) {
    res.sendFile(path.join(dirname, 'build-ui', 'index.html'));
  });
  
  // Route to query mongoDB for arbitrage data.
  app.get("/arbdata", async function (req, res) {

    console.log("Calling getArbitrageData");
    var data = await getArbitrageData();
    res.status(200).send(data);
  });
}
module.exports = appRouter;

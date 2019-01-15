import { getArbitrageData } from "../utils/dbUtils"

var appRouter = function (app) {
  
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
  
  app.get("/", function(req, res) {
    res.status(200).send("Welcome to our restful API");
  });

  // Route to query mongoDB for arbitrage data.
  app.get("/arbdata", async function (req, res) {

    console.log("Calling getArbitrageData");
    var data = await getArbitrageData();
    res.status(200).send(data);
  });
}
module.exports = appRouter;

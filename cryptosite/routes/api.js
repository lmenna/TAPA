// Full Documentation - https://www.turbo360.co/docs
const turbo = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const vertex = require('vertex360')({site_id: process.env.TURBO_APP_ID})
const router = vertex.router()
// npm install mongodb --save-dev
var MongoClient = require("mongodb");

/*  This is a sample API route. */
router.get("/crypto", async (req, res) => {

	// const result = await dbutils.testIt();
	console.log("req.query.ticker:", req.query.ticker);
	const resultTP = await getTransactionsAndPrices(req.query.ticker);
	const resultCOR = await getCorrelations(req.query.ticker);
	console.log("resultCOR:", resultCOR);
	res.json( { PriceTrans: resultTP, Correlations: resultCOR } );
});

/* getTransactionsAndPrices()
 * desc: Reads transaction ans price data from MongoDB
 * return: json block of data for all cryptocurrencies
 */
 async function getTransactionsAndPrices(ticker) {
   console.log("START: getTransactionsAndPrices");
   if (process.env.PROD_MONGODB_URI==undefined || process.env.PROD_MONGODB_URI==="") {
     console.log("Mongo environment is not defined.");
     console.log("Try running source SetMongoEnv.sh when starting the server.")
   }
   else {
     var url = process.env.PROD_MONGODB_URI;
     var client;
     var db;
     try {
       client = await MongoClient.connect(url, { useNewUrlParser: true });
       db = client.db("crypto");
			 var item = { "header.ticker": ticker };
			 console.log("Looking for item:", item);
       return await db.collection("marketdata.transaction_prices").find(item).toArray();
     } finally {
       client.close();
     }
   }
}


/* getCorrelations()
 * desc: Reads transaction ans price data from MongoDB
 * return: json block of data for all cryptocurrencies
 */
 async function getCorrelations(ticker) {
   console.log("START: getCorrelations");
   if (process.env.PROD_MONGODB_URI==undefined || process.env.PROD_MONGODB_URI==="") {
     console.log("Mongo environment is not defined.");
     console.log("Try running source SetMongoEnv.sh when starting the server.")
   }
   else {
     var url = process.env.PROD_MONGODB_URI;
     var client;
     var db;
     try {
       client = await MongoClient.connect(url, { useNewUrlParser: true });
       db = client.db("crypto");
			 var item = { "ticker": ticker };
			 console.log("Looking for item:", item);
       return await db.collection("marketdata.correlations").find(item).toArray();
     } finally {
       client.close();
     }
   }
}

module.exports = router

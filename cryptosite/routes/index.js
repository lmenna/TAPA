// Full Documentation - https://www.turbo360.co/docs
const turbo = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const vertex = require('vertex360')({site_id: process.env.TURBO_APP_ID})
const router = vertex.router()
//var dbutils = require("dbutils");

/*  This is the home route. It renders the index.mustache page from the views directory.
	Data is rendered using the Mustache templating engine. For more
	information, view here: https://mustache.github.io/#demo */
router.get('/', (req, res) => {

	const data = {
		greeting: "Welcome to my restaurant",
		description: "This is a great place for business lunch"
	}
	res.render('index', data)
})

/*  This route render json data */
router.get('/json', (req, res) => {
	res.json({
		confirmation: 'success',
		app: process.env.TURBO_APP_ID,
		data: 'this is a sample json route.'
	})
})

router.get('/graph', (req, res) => {

	const data = {
		greeting: "Welcome to my restaurant",
		description: "This is a great place for business lunch"
	}
	res.render('graphCrypto', data)
})

/* Path to get JSON data from MongoDB
 * usage: http://localhost:3000/getdata?ticker=eth
 */
router.get('/getdata', async (req, res) => {
  console.log("/getdata");
  console.log("req.query", req.query);
  var ticker = (req.query.ticker!=undefined ? req.query.ticker : "ALL");
  console.log("Got ticker: ", ticker);
  res.setHeader('Content-Type', 'application/json');
	res.send( {name: "value"} );
  //var ethData = await dbutils.getTransactionsAndPrices();
  //res.send(JSON.stringify(ethData));
});



/*  This route sends text back as plain text. */
router.get('/send', (req, res) => {
	res.send('This is the Send Route')
})

/*  This route redirects requests to Turbo360. */
router.get('/redirect', (req, res) => {
	res.redirect('https://www.turbo360.co/landing')
})

router.get('/graph', (req, res) => {

	const data = {
		greeting: "Welcome to my restaurant",
		description: "This is a great place for business lunch"
	}
	res.render('graphCrypto', data)
})

module.exports = router

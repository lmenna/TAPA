// Full Documentation - https://www.turbo360.co/docs
const turbo = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const vertex = require('vertex360')({site_id: process.env.TURBO_APP_ID})
const router = vertex.router()
var path    = require("path");

/*  This is the home route. It renders the index.mustache page from the views directory.
	Data is rendered using the Mustache templating engine. For more
	information, view here: https://mustache.github.io/#demo */
router.get('/', (req, res) => {

	const data = {
		greeting: "Welcome to Type3",
		description: "This is a great place to research crypto assets."
	}
	res.render('index', data)
})

router.get('/about',function(req,res){
  res.sendFile(path.join(__dirname+'/html/about-us.html'));
});


/*  This route render json data */
router.get('/json', (req, res) => {
	res.json({
		confirmation: 'success',
		app: process.env.TURBO_APP_ID,
		data: 'this is a sample json route.'
	})
})

router.get('/graph', (req, res) => {

	console.log("Accessing /graph");
	console.log("Accessing req.query:", req.query);

	// Select currency to graph
	var ccy = "eth";
	if (req.query.ccy!==undefined && req.query.ccy!=="")
		ccy = req.query.ccy;
	console.log("Graphing ccy:", ccy);
	var data = {
	    options: [
	        { value: 0, text: 'xem' },
	        { value: 1, selected: true, text: 'eth' },
					{ value: 2, text: 'btc' },
					{ value: 3, text: 'bat' },
					{ value: 4, text: 'maid' },
					{ value: 5, text: 'eos' }
	    ],
			selectedCCY: ccy
	};
	res.render('graphCrypto', data)
})

router.get('/correlate', (req, res) => {

	var data = "";
	console.log("Accessing /cor");
	console.log("Accessing req.query:", req.query);
	res.render("corCrypto", data)
});


router.get('/underconstruction', (req, res) => {

	var data = "";
	console.log("Accessing /underconstruction");
	console.log("Accessing req.query:", req.query);
	res.render("placeHolder01", data)
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

/* charts.js
 * desc: Functions used to create the Ethereum Daily Price and Transactions chart using D3.js
 *       published on medium https://medium.com/@louismenna/when-will-the-price-of-ethereum-explode-6f2d06bdd6e
 */

 /* renderETHTimeseriesChart(data)
  * desc: Plots the ETH prices and transaction count versus the date on the x axis
  * param: array of objects containing the data to plot
  *
  * This is the version used in the medium article.
  */
function renderETHTimeseriesChart(data) {

  // Use the margin convention practice
  var margin = {top: 50, right: 70, bottom: 60, left: 60}
    , width = window.innerWidth - margin.left - margin.right // Use the window's width
    , height = window.innerHeight - margin.top - margin.bottom; // Use the window's height

  if (width>1000)
    width = 1000;
  var numDataPoints = width/2;
  var zeroYLevel = margin.bottom;
  var zeroXLevel = margin.right;

  // Limit the dataset
  var trimmedData = data.slice(data.length-numDataPoints, data.length);
  console.log("trimmedData.length:", trimmedData.length);
  console.log("width:", width);
  console.log("numDataPoints:", numDataPoints);
  console.log("height:", height);

  // CSV data from D3 loads as string.  Convert to numbers.
  makeFieldNumerical(trimmedData, "Price");
  makeFieldNumerical(trimmedData, "Transaction Count");
  const maxPrice = getMaxValue(trimmedData, "Num Price");
  const maxTrans = getMaxValue(trimmedData, "Num Transaction Count");
  makeFieldDate(trimmedData, "Date(UTC)");

  // Add the SVG to the page
  var svg = d3.select("body").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // parse the date / time
  var parseTime = d3.timeParse("%d/%b/%y");
  var x = d3.scaleTime().range([0, width]);
  x.domain(d3.extent(trimmedData, function(d) { return d["Date(UTC)"]; }));

  // X scale will use the index of our data
  var xScale = d3.scaleLinear()
      .domain([0, numDataPoints-1]) // input
      .range([0, width]); // output

  // Y scale for pricing data
  var yPriceScale = d3.scaleLinear()
      .domain([0, maxPrice]) // input
      .range([height, 0]); // output

  // Y scale for transaction data
  var yTransScale = d3.scaleLinear()
      .domain([0, maxTrans]) // input
      .range([height, 0]); // output

  // d3's line generator for prices
  var lineForPrices = d3.line()
      .x(function(d, i) { return x(d["Date(UTC)"]); }) // set the x values for the line generator
      .y(function(d) { return yPriceScale(d["Num Price"]); }) // set the y values for the line generator
      .curve(d3.curveMonotoneX) // apply smoothing to the line

  // d3's line generator for transactions
  var lineForTransactions = d3.line()
      .x(function(d, i) { return x(d["Date(UTC)"]); }) // set the x values for the line generator
      .y(function(d) { return yTransScale(d["Num Transaction Count"]); }) // set the y values for the line generator
      .curve(d3.curveMonotoneX) // apply smoothing to the line

  // Call the x axis in a group tag
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b%y"))) // Create an axis component with d3.axisBottom
      .style("font-size", "12px")

  // Call the y axis for pricing in a group tag
  svg.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(yPriceScale)) // Create an axis component with d3.axisLeft
      .style("font-size", "12px");

  // Call the y axis for transactions in a group tag
  svg.append("g")
      .attr("class", "y axis")
      .call(d3.axisRight(yTransScale)) // Create an axis component with d3.axisLeft
      .attr("transform", "translate(" + width + ",0)")
      .style("font-size", "12px");

  // Title for left y-axis is the Price
  svg.append("text")
      .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
      // .attr("transform", "translate("+ (margin.left/2) +","+(height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
      .attr("transform", "translate("+ (-margin.left/1.8) +","+(height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
      .text("Price");

  // Title for right y-axis is the Daily Transactions
  svg.append("text")
      .attr("class", "y-axis-label")
      .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
      // .attr("transform", "translate("+ (margin.left/2) +","+(height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
      .attr("transform", "translate("+ (width + margin.right/1.1) +","+(height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
      .text("Daily Transactions");

  // Title for the x-axis is Date
  svg.append("text")
      .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
      .attr("transform", "translate("+ (width/2) +","+(height+(margin.bottom/1.6))+")")  // centre below axis
      .text("Date");

  // Append the path for the pricing line
  svg.append("path")
      .datum(trimmedData) // Binds data to the line
      .attr("class", "lineForPrices") // Assign a class for styling
      .attr("d", lineForPrices) // Calls the line generator
      .style("stroke-width", 2);

  // Append the path for the transaction line
  svg.append("path")
      .datum(trimmedData) // Binds data to the line
      .attr("class", "lineForTransactions") // Assign a class for styling
      .attr("d", lineForTransactions) // Calls the line generator
      .style("stroke-width", 2);

  // Add a legend
  //set colors
  var z0 = d3.scaleOrdinal()
    .range(["#000000", "#4682b4"]);

  //set up the keys for graph legend
  var keys = (["Price", "Transactions"]);
  z0.domain(keys);
  var legend = svg.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 15)
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(keys.slice().reverse())
    .enter().append("g")
    .attr("transform", function(d, i) {
      return "translate(-100," + i * 25 + ")";
    });

  //append legend colour blocks
  legend.append("rect")
    .attr("x", width + 55)
    .attr("width", 24)
    .attr("height", 24)
    .attr("fill", z0);

  //append legend texts
  legend.append("text")
    .attr("x", width+50)
    .attr("y", 9.5)
    .attr("dy", "0.32em")
    .text(function(d) {
      return d;
    });

    svg.append("text")
        .attr("class", "title")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2) + 10)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("text-decoration", "underline")
        .text("Ethereum - Daily Prices and Transactions");
}

/* renderETHLineChart(data)
 * desc: Plots the ETH prices and transaction count versus an integer number of days on the x axis
 * param: array of objects containing the data to plot
 */
function renderETHLineChart(data) {

  // Use the margin convention practice
  var margin = {top: 50, right: 70, bottom: 60, left: 60}
    , width = window.innerWidth - margin.left - margin.right // Use the window's width
    , height = window.innerHeight - margin.top - margin.bottom; // Use the window's height

  if (width>1000)
    width = 1000;
  var numDataPoints = width/2;
  var zeroYLevel = margin.bottom;
  var zeroXLevel = margin.right;

  // Limit the dataset
  var trimmedData = data.slice(data.length-numDataPoints, data.length);
  console.log("trimmedData.length:", trimmedData.length);
  console.log("width:", width);
  console.log("numDataPoints:", numDataPoints);
  console.log("height:", height);

  // CSV data from D3 loads as string.  Convert to numbers.
  makeFieldNumerical(trimmedData, "Price");
  makeFieldNumerical(trimmedData, "Transaction Count");
  const maxPrice = getMaxValue(trimmedData, "Num Price");
  const maxTrans = getMaxValue(trimmedData, "Num Transaction Count");

  // Add the SVG to the page
  var svg = d3.select("body").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // X scale will use the index of our data
  var xScale = d3.scaleLinear()
      .domain([0, numDataPoints-1]) // input
      .range([0, width]); // output

  // Y scale for pricing data
  var yPriceScale = d3.scaleLinear()
      .domain([0, maxPrice]) // input
      .range([height, 0]); // output

  // Y scale for transaction data
  var yTransScale = d3.scaleLinear()
      .domain([0, maxTrans]) // input
      .range([height, 0]); // output

  // d3's line generator for prices
  var lineForPrices = d3.line()
      .x(function(d, i) { return xScale(i); }) // set the x values for the line generator
      .y(function(d) { return yPriceScale(d["Num Price"]); }) // set the y values for the line generator
      .curve(d3.curveMonotoneX) // apply smoothing to the line

  // d3's line generator for transactions
  var lineForTransactions = d3.line()
      .x(function(d, i) { return xScale(i); }) // set the x values for the line generator
      .y(function(d) { return yTransScale(d["Num Transaction Count"]); }) // set the y values for the line generator
      .curve(d3.curveMonotoneX) // apply smoothing to the line

  // Call the x axis in a group tag
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(xScale)) // Create an axis component with d3.axisBottom
      .style("font-size", "12px")

  // Call the y axis for pricing in a group tag
  svg.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(yPriceScale)) // Create an axis component with d3.axisLeft
      .style("font-size", "12px");

  // Call the y axis for transactions in a group tag
  svg.append("g")
      .attr("class", "y axis")
      .call(d3.axisRight(yTransScale)) // Create an axis component with d3.axisLeft
      .attr("transform", "translate(" + width + ",0)")
      .style("font-size", "12px");

  // Title for left y-axis is the Price
  svg.append("text")
      .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
      // .attr("transform", "translate("+ (margin.left/2) +","+(height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
      .attr("transform", "translate("+ (-margin.left/1.8) +","+(height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
      .text("Price");

  // Title for right y-axis is the Daily Transactions
  svg.append("text")
      .attr("class", "y-axis-label")
      .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
      // .attr("transform", "translate("+ (margin.left/2) +","+(height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
      .attr("transform", "translate("+ (width + margin.right/1.1) +","+(height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
      .text("Daily Transactions");

  // Title for the x-axis is Date
  svg.append("text")
      .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
      .attr("transform", "translate("+ (width/2) +","+(height+(margin.bottom/1.8))+")")  // centre below axis
      .text("Date");

  // Append the path for the pricing line
  svg.append("path")
      .datum(trimmedData) // Binds data to the line
      .attr("class", "lineForPrices") // Assign a class for styling
      .attr("d", lineForPrices); // Calls the line generator
  // Append the path for the transaction line
  svg.append("path")
      .datum(trimmedData) // Binds data to the line
      .attr("class", "lineForTransactions") // Assign a class for styling
      .attr("d", lineForTransactions); // Calls the line generator

  // Add a legend
  //set colors
  var z0 = d3.scaleOrdinal()
    .range(["#000000", "#4682b4"]);

  //set up the keys for graph legend
  var keys = (["Price", "Transactions"]);
  z0.domain(keys);
  var legend = svg.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 15)
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(keys.slice().reverse())
    .enter().append("g")
    .attr("transform", function(d, i) {
      return "translate(-100," + i * 25 + ")";
    });

  //append legend colour blocks
  legend.append("rect")
    .attr("x", width + 55)
    .attr("width", 24)
    .attr("height", 24)
    .attr("fill", z0);

  //append legend texts
  legend.append("text")
    .attr("x", width+50)
    .attr("y", 9.5)
    .attr("dy", "0.32em")
    .text(function(d) {
      return d;
    });

    svg.append("text")
        .attr("class", "title")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2) + 10)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("text-decoration", "underline")
        .text("Ethereum Daily Prices and Transactions");

}

/* showBarChart(data)
 * desc: Show the price and transaction data as a bar chart.  This was interesing to try
 *       but was not as useful as the line charts.
 */
function showBarChart(data) {

  // Use the margin convention practice
  var margin = {top: 50, right: 50, bottom: 50, left: 50}
    , width = window.innerWidth - margin.left - margin.right // Use the window's width
    , height = window.innerHeight - margin.top - margin.bottom; // Use the window's height

  if (width>1000)
    width = 1000;
  var numDataPoints = width/2;
  var zeroYLevel = margin.bottom;
  var zeroXLevel = margin.right;
  var maxYVariation = height-10;
  // Limit the dataset
  var trimmedData = data.slice(data.length-numDataPoints, data.length);
  console.log("trimmedData.length:", trimmedData.length);
  console.log("width:", width);
  console.log("numDataPoints:", numDataPoints);
  console.log("height:", height);
  console.log("maxYVariation:", maxYVariation);
  // CSV data from D3 loads as string.  Convert to numbers.
  makeFieldNumerical(trimmedData, "Price");
  makeFieldNumerical(trimmedData, "Transaction Count");
  const maxPrice = getMaxValue(trimmedData, "Num Price");
  const priceScaleFactor = maxYVariation / maxPrice;
  const maxTrans = getMaxValue(trimmedData, "Num Transaction Count");
  const transScaleFactor = maxYVariation / maxTrans;
  // Create the D3 rendering for the data
  var chart = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
  var bar = chart.selectAll("g")
            .data(trimmedData)
            .enter()
            .append("g")
            .attr("transform", function(d, i) {
              //console.log("translate(" + i + ", 0 )");
              // Each rectangle for the data is created touching the y-axis.
              // This translation shifts them by variable amounts spreading across the page.
              return "translate(" + 2*i + ", 0 )";
            });
  // Append tall thin rectangles for the transaction volume data
  bar.append("rect")
      .attr("width", 1)
      .attr("height", function(d){
        return(d["Num Transaction Count"] * transScaleFactor )
      })
      .attr("x", zeroXLevel ) // Ensures the first rectangle is touching to y-axis
      .attr("y", function(d){
//        return(height - zeroYLevel - d["Scaled Transaction Count"] - d["Scaled Price"])
        return(height - zeroYLevel - d["Num Transaction Count"] * transScaleFactor)
      })
      .attr("fill", "steelblue");
  // Append small squares for the pricing data
  bar.append("rect")
      .attr("width", 2)
      .attr("height", 2)
      .attr("x", zeroXLevel )
      .attr("y", function(d){
        console.log( d["Date(UTC)"], d["Num Price"] );
        return( height - zeroYLevel - d["Num Price"] * priceScaleFactor )
      })
      .attr("fill", "black");

  // Create the xAxis on the bottom of the chart
  var xScale = d3.scaleLinear()
    .domain([0,numDataPoints-1])  // Domain of possible values on the X Axis
    .range([0,width]);  // Range of possible values this domain will map to
  var xAxis = d3.axisBottom().scale(xScale);
  var axisGroup = chart.append("g")
    .attr("transform", "translate(" + zeroXLevel + "," + (height - zeroYLevel) + ")")
    .call(xAxis);

  // Create a yAxis on the left for the transaction data scale
  var yScale = d3.scaleLinear()
      .domain([0, maxPrice]) // input
      .range([height-zeroXLevel, 0]); // output
  chart.append("g")
      .attr("transform", "translate(50,0)")
      .attr("class", "y axis")
      .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft

  // Add a line chart for the pricing data
  // X scale will use the index of our data
  var xScaleLine = d3.scaleLinear()
      .domain([0, numDataPoints-1]) // input
      .range([0, width]); // output

  // Y scale for line chart
  var yScaleLine = d3.scaleLinear()
      .domain([0, maxPrice]) // input
      .range([height, 0]); // output

  // d3's line generator
  var line = d3.line()
      .x(function(d, i) { return(xScaleLine(i) + zeroXLevel); }) // set the x values for the line generator
      .y(function(d) {
        console.log( d["Date(UTC)"], d["Num Price"] );
        return yScaleLine(d["Num Price"] + zeroYLevel);
      }) // set the y values for the line generator
      .curve(d3.curveMonotoneX) // apply smoothing to the line
  // Append the path, bind the data, and call the line generator
  chart.append("path")
      .datum(trimmedData) // Binds data to the line
      .attr("class", "lineForPrices") // Assign a class for styling
      .attr("d", line); // 11. Calls the line generator

  // Appends a circle for each datapoint
  chart.selectAll(".dot")
      .data(trimmedData)
      .enter().append("circle") // Uses the enter().append() method
      .attr("class", "dot") // Assign a class for styling
      .attr("cx", function(d, i) { return(xScaleLine(i) + zeroXLevel); })
      .attr("cy", function(d) {
        return yScaleLine(d["Num Price"] + zeroYLevel);
      })
      .attr("r", 5)
        .on("mouseover", function(a, b, c) {
    			console.log(a)
          // this.attr('class', 'focus')
  		})
      .on("mouseout", function() {  })

}

function scaleData(data, field, scaleTo) {

  var allValues = data.map(item => {
      return(1*item[field]);
  });
  var maxValue = Math.max(...allValues);
  console.log("Scaling to maxValue:", maxValue);
  // var scaledAry = transCounts.map(item => {
  //   console.log(item);
  //     return( (scaleTo * item) / maxValue);
  // });
  return( data.map(item => {
    item["Scaled " + field] = (scaleTo * item[field]) / maxValue;
    return(item);
  }))
}

function getMaxValue(data, field) {

  var allValues = data.map(item => {
      return(1*item[field]);
  });
  return(Math.max(...allValues));
}

function makeFieldNumerical(data, field) {

  return( data.map(item => {
    item["Num " + field] = (1.0*item[field]);
    return(item);
  }));
}

function makeFieldDate(data, field) {

  return( data.map(item => {
    item[field] = new Date(item[field]);
    return(item);
  }));
}

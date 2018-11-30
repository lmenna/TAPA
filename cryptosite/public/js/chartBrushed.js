/* chartBrushed.js
 * desc: Function used to create brushed line charts with zoom capability using D3 version 5.
 */

/* renderBrushedLineChart(dataFile)
 * desc: Creates the entire Brushed line chart using data from and .csv file.
 * param: dataFile.  File to load data from.  Should be a URL ex. http://localhost:3000/data/sp500.csv
 */
function renderBrushedLineChart(data) {

  // brushed() Inner function
  function brushed() {
     if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
     var s = d3.event.selection || x2.range();
     x.domain(s.map(x2.invert, x2));
     //focus.select(".area").attr("d", area);
     focus.select(".lineForPrices").attr("d", line);
     focus.select(".lineForTransactions").attr("d", lineForTransactions);
     focus.select(".axis--x").call(xAxis);
     svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
         .scale(width / (s[1] - s[0]))
         .translate(-s[0], 0));
  }

  // zoomed() Inner function
  function zoomed() {
     if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush")
      return; // ignore zoom-by-brush
     var t = d3.event.transform;
     x.domain(t.rescaleX(x2).domain());
     //focus.select(".area").attr("d", area);
     focus.select(".lineForPrices").attr("d", line);
     focus.select(".lineForTransactions").attr("d", lineForTransactions);
     focus.select(".axis--x").call(xAxis);
     context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
  }

  // Create svg and begin rendering process.
  var svg = d3.select("svg"),
     margin = {top: 20, right: 75, bottom: 110, left: 75},
     margin2 = {top: 610, right: 75, bottom: 30, left: 75},
     width = +svg.attr("width") - margin.left - margin.right,
     height = +svg.attr("height") - margin.top - margin.bottom,
     height2 = +svg.attr("height") - margin2.top - margin2.bottom;

  var x = d3.scaleTime().range([0, width]),
     x2 = d3.scaleTime().range([0, width]),
     y = d3.scaleLinear().range([height, 0]),
     yTransactions = d3.scaleLinear().range([height, 0]),
     y2 = d3.scaleLinear().range([height2, 0]);

  var xAxis = d3.axisBottom(x),
     xAxis2 = d3.axisBottom(x2),
     yAxis = d3.axisLeft(y);

  var brush = d3.brushX()
     .extent([[0, 0], [width, height2]])
     .on("brush end", brushed);

  var zoom = d3.zoom()
     .scaleExtent([1, Infinity])
     .translateExtent([[0, 0], [width, height]])
     .extent([[0, 0], [width, height]])
     .on("zoom", zoomed);

/*
  var area = d3.area()
     .curve(d3.curveMonotoneX)
     .x(function(d) { return x(d.date); })
     .y0(height)
     .y1(function(d) { return y(d.price); });
*/

  var area2 = d3.area()
     .curve(d3.curveMonotoneX)
     .x(function(d) { return x2(d.date); })
     .y0(height2)
     .y1(function(d) { return y2(d.price); });

  var line = d3.line()
    .x(function(d, i) { return x(d.date); }) // set the x values for the line generator
    .y(function(d) { return y(d.price); }) // set the y values for the line generator
    .curve(d3.curveMonotoneX) // apply smoothing to the line

  var lineForTransactions = d3.line()
        .x(function(d, i) { return x(d.date); }) // set the x values for the line generator
        .y(function(d) { return yTransactions(d["Transaction Count"]); }) // set the y values for the line generator
        .curve(d3.curveMonotoneX) // apply smoothing to the line

  svg.append("defs").append("clipPath")
     .attr("id", "clip")
     .append("rect")
     .attr("width", width)
     .attr("height", height);

  var focus = svg.append("g")
     .attr("class", "focus")
     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var context = svg.append("g")
     .attr("class", "context")
     .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

  // Load .csv file from a URL.  Assumes file contains a date and price field.
    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return d.price; })]);
    yTransactions.domain([0, d3.max(data, function(d) { return d["Transaction Count"]; })]);
    x2.domain(x.domain());
    y2.domain(y.domain());

    focus.append("path")
      .datum(data)
      .attr("class", "lineForPrices")
      .attr("d", line);

    focus.append("path")
      .datum(data)
      .attr("class", "lineForTransactions")
      .attr("d", lineForTransactions);
/*
    focus.append("path")
       .datum(data)
       .attr("class", "area")
       .attr("d", area);
*/
    focus.append("g")
       .attr("class", "axis axis--x")
       .attr("transform", "translate(0," + height + ")")
       .call(xAxis);

    focus.append("g")
       .attr("class", "axis axis--y")
       .call(yAxis);

   // Call the y axis for transactions in a group tag
   focus.append("g")
       .attr("class", "axis axis--y")
       .call(d3.axisRight(yTransactions)) // Create an axis component with d3.axisLeft
       .attr("transform", "translate(" + width + ",0)")

    context.append("path")
       .datum(data)
       .attr("class", "area")
       .attr("d", area2);

    context.append("g")
       .attr("class", "axis axis--x")
       .attr("transform", "translate(0," + height2 + ")")
       .call(xAxis2);

    context.append("g")
       .attr("class", "brush")
       .call(brush)
       .call(brush.move, x.range());

   // Title for left y-axis is the Price
   svg.append("text")
       .attr("class", "x-axis-label")
       .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
       .attr("transform", "translate("+ (margin.left/2.0) +","+(height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
       .text("Price");

   // Title for right y-axis is the Daily Transactions
   svg.append("text")
       .attr("class", "y-axis-label")
       .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
       .attr("transform", "translate("+ (width + margin.right+70) +","+(height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
       .text("Daily Transactions");

   // Add a legend
   //set colors
   var z0 = d3.scaleOrdinal()
     .range(["#000000", "#4682b4"]);

   //set up the keys for graph legend
   var keys = (["Price", "Transactions"]);
   z0.domain(keys);
   var legend = svg.append("g")
     .attr("class", "legend")
     .attr("text-anchor", "end")
     .selectAll("g")
     .data(keys.slice().reverse())
     .enter().append("g")
     .attr("transform", function(d, i) {
       return "translate(-10," + i * 25 + ")";
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

    svg.append("rect")
       .attr("class", "zoom")
       .attr("width", width)
       .attr("height", height)
       .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
       .call(zoom);

}

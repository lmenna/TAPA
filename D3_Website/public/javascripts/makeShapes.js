function makeShapes() {

  var canvas = d3.select("body").append("svg")
    .attr("width", 500)
    .attr("height", 500)
    // Draw rectangle
  canvas.append("rect")
      .attr("width", 100 )
      .attr("height", 10 )
      .attr("x", 10 )
      .attr("y", 50 )
      .attr("fill", "blue");

  // Draw multiple circles from data structure
  var jsonCircles = [
    { "x_axis": 200, "y_axis": 100, "radius": 20, "color" : "green" },
    { "x_axis": 70, "y_axis": 150, "radius": 20, "color" : "purple"},
    { "x_axis": 110, "y_axis": 180, "radius": 20, "color" : "red"}];

  var circles = canvas.selectAll("circle")
                  .data(jsonCircles)
                  .enter()
                  .append("circle");

  var circleAttributes = circles
               .attr("cx", function (d) { return d.x_axis; })
               .attr("cy", function (d) { return d.y_axis; })
               .attr("r", function (d) { return d.radius; })
               .style("fill", function(d) { return d.color; });

   // Draw single circle
   canvas.append("circle")
       .attr("r", 35 )
       .attr("cx", 150)
       .attr("cy", 150 )
       .attr("fill", "orange");

   // Draw single ellipse
   canvas.append("ellipse")
       .attr("rx", 35 )
       .attr("ry", 20 )
       .attr("cx", 50)
       .attr("cy", 120 )
       .attr("fill", "black");

  // Draw a line
  canvas.append("line")
          .attr("x1", 5)
          .attr("y1", 10)
          .attr("x2", 50)
          .attr("y2", 250)
          .attr("stroke-width", 2)
          .attr("stroke", "yellow");

  // Now lets try a chart
  var data2 = [
    {name: "Maria", age: "10"},
    {name: "Maria", age: "20"},
    {name: "Maria", age: "30"}
  ];
};

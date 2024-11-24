// Set up SVG dimensions and margins
var dimensions = {
    width: 900,
    height: 300,
    margins: { top: 40, right: 40, bottom: 50, left: 40 }
};

var width = dimensions.width - dimensions.margins.left - dimensions.margins.right;
var height = dimensions.height - dimensions.margins.top - dimensions.margins.bottom;

var svg = d3.select("#histogram")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height)
    .append("g")
    .attr("transform", "translate(" + dimensions.margins.left + "," + dimensions.margins.top + ")");

d3.csv("gun_data_with_rating.csv").then(function(data) {
    // Parse numeric columns and handle missing values
    data.forEach(d => {
        d.total_casualties = +d.total_casualties || 0;
        d.state = d.state || "Unknown";
    });

    // Aggregate data by state
    const stateData = Array.from(d3.rollup(
        data,
        v => d3.sum(v, d => d.total_casualties),
        d => d.state
    ), ([state, casualties]) => ({ state, casualties }))
    .sort((a, b) => d3.descending(a.casualties, b.casualties));

    // Set up scales
    var x = d3.scaleBand()
        .domain(stateData.map(d => d.state))
        .range([0, width])
        .padding(0.1);

    var y = d3.scaleLinear()
        .domain([0, d3.max(stateData, d => d.casualties)/1000])
        .range([height, 0]);

    // X-axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        //.attr("transform", "rotate(-0)")
        .style("text-anchor", "end");

    // X-axis label
    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("transform", `translate(${width / 2}, ${height + 50})`)
        .style("text-anchor", "middle")
        .text("State");

    // Y-axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Y-axis label
    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -40)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Total Casualties");


    // Draw bars
    svg.selectAll("rect")
        .data(stateData)
        .enter().append("rect")
        .attr("x", d => x(d.state))
        .attr("y", d => y(d.casualties / 1000))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.casualties / 1000))
        .attr("fill", "#69b3a2");
});

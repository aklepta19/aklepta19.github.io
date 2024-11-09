// Set up SVG dimensions and margins
var dimensions = {
    width: 850,
    height: 450,
    margins: { top: 20, right: 30, bottom: 100, left: 60 }
};

var width = dimensions.width - dimensions.margins.left - dimensions.margins.right;
var height = dimensions.height - dimensions.margins.top - dimensions.margins.bottom;

var svg = d3.select("#histogram")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height)
    .style("position", "absolute")
    .style("bottom", "0")
    .style("left", "0")
    .append("g")
    .attr("transform", "translate(" + dimensions.margins.left + "," + dimensions.margins.top + ")");
// Load the data
d3.csv("Gun_violence_clean3.csv").then(function(data) {
    // Parse numeric columns and handle missing values
    data.forEach(d => {
        d.total_casualties = +d.total_casualties || 0;  // Default to 0 if undefined
        d.state = d.state || "Unknown";  // Default to "Unknown" if undefined
    });

    // Group data by state and calculate total casualties per state, then sort in descending order
    const casualtiesByState = Array.from(d3.rollup(data, 
        v => d3.sum(v, d => d.total_casualties), 
        d => d.state), 
        ([state, casualties]) => ({ state, casualties })
    ).sort((a, b) => d3.descending(a.casualties, b.casualties));

    // Set x-axis scale for states (categorical), ordered by descending casualties
    var x = d3.scaleBand()
        .domain(casualtiesByState.map(d => d.state))
        .range([0, width])
        .padding(0.1);

    // Set y-axis scale for "incident count"
    var y = d3.scaleLinear()
        .domain([0, d3.max(casualtiesByState, d => d.casualties)])
        .range([height, 0]);

    // Append x-axis to the SVG
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Append y-axis to the SVG, with label "Total Casualties"
    svg.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("text-anchor", "end")
        .attr("y", -20)
        .attr("x", -30)
        .attr("fill", "black")
        .text("Total Casualties");

    // Draw the bars for each state, ordered by total casualties
    svg.selectAll("rect")
        .data(casualtiesByState)
        .enter().append("rect")
        .attr("x", d => x(d.state))
        .attr("y", d => y(d.casualties))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.casualties))
        .style("fill", "#69b3a2");
});

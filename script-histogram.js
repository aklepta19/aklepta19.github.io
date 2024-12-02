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
        d.incident_id = d.incident_id || null;
        date = parseDate(d.date) || null; // Parse date
    });

    //let selectedState = null;

    const stateData = Array.from(d3.rollup(
        data,
        v => ({
            casualties: d3.sum(v, d => d.total_casualties), // Total casualties
            incidents: v.map(d => d.incident_id) // Collect all incident IDs
        }),
        d => d.state // Grouping by state
        ), ([state, { casualties, incidents }]) => ({ state, casualties, incidents }))
        .sort((a, b) => d3.descending(a.casualties, b.casualties)); // Sort by casualties in descending order
    
    

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
        .style("text-anchor", "middle");

    // X-axis label
    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("transform", `translate(${width / 2}, ${height + 50})`)
        .style("text-anchor", "middle")
        .style("font-size", "14px") // Adjust font size here
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
        .style("font-size", "14px") // Adjust font size here
        .text("Total Casualties (Thousands)");

    
    // Draw bars
    svg.selectAll("rect")
        .data(stateData)
        .enter().append("rect")
        .attr("x", d => x(d.state))
        .attr("y", d => y(d.casualties / 1000))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.casualties / 1000))
        .attr("fill", d => color(d.state))
        .on("mouseover", showTooltip) // Show tooltip on hover
        .on("mousemove", moveTooltip) // Move tooltip with the pointer
        .on("mouseout", hideTooltip) // Hide tooltip on mouseout
        .on("click", function(event, d) {
            const clickedState = dashboardState.selectedState === d.state ? null : d.state; // Toggle stat
            updateCharts({ state: clickedState});
        });

    // Register this histogram's update logic with the centralized updater
    // Register this histogram's update logic
    function updateHistogram({ selectedState}) {
        
        svg.selectAll("rect")
            .transition()
            .duration(300)
            .attr("fill", d =>
                    (selectedState && d.state !== selectedState)
                        ? "grey"
                        : color(d.state)
                )
                .attr("opacity", d =>
                    (selectedState && d.state !== selectedState) ? 0.3: 1
                );}

    
    
    registerChart("histogram", updateHistogram);
    // Create a tooltip div (hidden by default)
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("box-shadow", "0 2px 4px rgba(0,0,0,0.2)")
        .style("pointer-events", "none") // Prevent interference with mouse events
        .style("opacity", 0); // Initially hidden
    
    // Function to handle tooltips
    function showTooltip(event, d) {
        tooltip
            .html(`
                <strong>Casualties:</string> ${d.casualties}
            `)
            .style("left", `${event.pageX + 10}px`) // Offset from mouse pointer
            .style("top", `${event.pageY + 10}px`)
            .style("opacity", 1); // Make the tooltip visible
    }
    
    function moveTooltip(event) {
        tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
    }
    
    function hideTooltip() {
        tooltip.style("opacity", 0); // Hide the tooltip
    }
});

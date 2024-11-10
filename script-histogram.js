// Set up SVG dimensions and margins
var dimensions = {
    width: 850,
    height: 450,
    margins: { top: 20, right: 30, bottom: 100, left: 80 }
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

var currentLevel = "state"; // Track the current level
var selectedState = null;   // Store selected state for drill-down
var selectedYear = null;    // Store selected year for drill-down

// Load the modified CSV file
d3.csv("gun_data_with_rating.csv").then(function(data) {
    // Parse numeric columns and handle missing values
    data.forEach(d => {
        d.total_casualties = +d.total_casualties || 0;
        d.state = d.state || "Unknown";
        d.year = +d.year; // Ensure year is a number
    });

    // Initial histogram by state
    updateHistogram("state");

    // Function to update the histogram based on the level
    function updateHistogram(level) {
        let histogramData;

        // Prepare data based on the level
        if (level === "state") {
            histogramData = Array.from(d3.rollup(data, 
                v => d3.sum(v, d => d.total_casualties), 
                d => d.state),
                ([state, casualties]) => ({ key: state, value: casualties })
            ).sort((a, b) => d3.descending(a.value, b.value));
        } else if (level === "year" && selectedState) {
            histogramData = Array.from(d3.rollup(data.filter(d => d.state === selectedState),
                v => d3.sum(v, d => d.total_casualties), 
                d => d.year),
                ([year, casualties]) => ({ key: year, value: casualties })
            ).sort((a, b) => d3.ascending(a.key, b.key));
        } else if (level === "month" && selectedYear) {
            histogramData = Array.from(d3.rollup(data.filter(d => d.state === selectedState && d.year === selectedYear),
                v => d3.sum(v, d => d.total_casualties),
                d => d.month_name), // Directly use month_name column
                ([month, casualties]) => ({ key: month, value: casualties })
            );
        }

        // Log data for debugging purposes
        console.log("Current Level:", level);
        console.log("Histogram Data:", histogramData);

        // If no data, display a message instead of rendering
        if (!histogramData || histogramData.length === 0) {
            svg.selectAll("*").remove();
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .style("fill", "red")
                .text("No data available for this level");
            return;
        }

        // Update scales
        var x = d3.scaleBand()
            .domain(histogramData.map(d => d.key))
            .range([0, width])
            .padding(0.1);

        var y = d3.scaleLinear()
            .domain([0, d3.max(histogramData, d => d.value)])
            .range([height, 0]);

        // Clear previous bars and axes
        svg.selectAll("rect").remove();
        svg.selectAll("g.axis").remove();
        svg.selectAll(".back-button").remove();

        // X-axis
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Y-axis with label
        svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("text-anchor", "end")
            .attr("y", -20)
            .attr("x", -30)
            .attr("fill", "black")
            .text(level === "state" ? "Total Casualties by State" : `Total Casualties in ${selectedState}`);
        // Append y-axis to the SVG
        svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y));

        // Add y-axis label with rotation
        svg.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)") // Rotate the text 90 degrees
        .attr("y", -dimensions.margins.left + 20) // Position it to the left of the y-axis
        .attr("x", -height / 2) // Center it along the y-axis
        .attr("dy", "1em") // Add a little padding
        .style("text-anchor", "middle")
        .style("fill", "black")
        .text("Total Casualties"); // Change this to your desired label text
        // Draw bars
        svg.selectAll("rect")
            .data(histogramData)
            .enter().append("rect")
            .attr("x", d => x(d.key))
            .attr("y", d => y(d.value))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.value))
            .style("fill", "#1f77b4")
            .on("click", function(event, d) {
                if (currentLevel === "state") {
                    currentLevel = "year";
                    selectedState = d.key;
                    updateHistogram(currentLevel);
                } else if (currentLevel === "year") {
                    currentLevel = "month";
                    selectedYear = d.key;
                    updateHistogram(currentLevel);
                }
            });

        // Add a back button for drill-down levels
        if (level !== "state") {
            svg.append("text")
                .attr("class", "back-button")
                .attr("x", 10)
                .attr("y", -10)
                .attr("text-anchor", "start")
                .style("cursor", "pointer")
                .style("fill", "blue")
                .text("← Back")
                .on("click", function() {
                    if (currentLevel === "month") {
                        currentLevel = "year";
                        selectedYear = null;
                    } else if (currentLevel === "year") {
                        currentLevel = "state";
                        selectedState = null;
                    }
                    updateHistogram(currentLevel);
                });
        }
    }
});

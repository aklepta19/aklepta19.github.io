// Function to sample data
function sampleData(data, sampleSize) {
  const sampledData = [];
  const step = Math.floor(data.length / sampleSize);
  for (let i = 0; i < data.length; i += step) {
    sampledData.push(data[i]);
  }
  return sampledData;
}

// Set up SVG dimensions and margins for scatter plot
var scatterDimensions = {
  width: 900,
  height: 650,
  margins: { top: 80, right: 30, bottom: 100, left: 90 }
};

var scatterWidth = scatterDimensions.width - scatterDimensions.margins.left - scatterDimensions.margins.right;
var scatterHeight = scatterDimensions.height - scatterDimensions.margins.top - scatterDimensions.margins.bottom;

// Create SVG container for scatter plot
const scatterSvg1 = d3.select("#scatter-plot1")
                      .attr("width", scatterDimensions.width)
                      .attr("height", scatterDimensions.height)
                      .style("position", "absolute")
                      .style("top", "0")
                      .style("left", "0")
                      .append("g")
                      .attr("transform", `translate(${scatterDimensions.margins.left},${scatterDimensions.margins.top})`);

// Parse the date format in your data
const gradeOrder = ["F", "D-", "D", "B-", "B", "B+", "A-", "A"];
const parseDate = d3.timeParse("%m/%d/%y");

// Load and process data
d3.csv("gun_data_with_rating.csv").then(data => {
    // Format and filter the data
    const filteredData = data
        .map(d => ({
            date: parseDate(d.date), // Parse date
            rating: d.rating, // Include rating
            state: d.state
        }))
        .filter(d => d.date !== null && gradeOrder.includes(d.rating) && d.state);

    // Sample the data to reduce its size
    const sampleSize = 1000; // Adjust the sample size as needed
    const sampledData = sampleData(filteredData, sampleSize);

    // Define xScale for date (extending to include 2018)
    const xScale = d3.scaleTime()
        .domain([
            d3.min(sampledData, d => d.date), // Minimum date in the data
            new Date(2018, 0, 1) // Extend domain to include the end of 2018
        ])
        .range([0, scatterWidth]);

    // Define yScale for rating
    const yScale = d3.scalePoint()
        .domain(gradeOrder)
        .range([0, scatterHeight]);

    // Define axes with yearly ticks
    const xAxis = d3.axisBottom(xScale)
        .ticks(d3.timeYear.every(1))
        .tickFormat(d3.timeFormat("%Y"));

    const yAxis = d3.axisLeft(yScale);

    // Add x-axis with rotated labels
    const xAxisGroup = scatterSvg1.append("g")
        .attr("transform", `translate(0, ${scatterHeight})`)
        .attr("class", "x-axis")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "middle")
        .attr("dy", "1em");

    // Add y-axis with grade labels
    scatterSvg1.append("g")
        .call(yAxis);

    // Add y-axis label
    const yAxisLabel = scatterSvg1.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -scatterHeight / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Gun Safety Rating");

    // Add x-axis label
    const xAxisLabel = scatterSvg1.append("text")
        .attr("x", scatterWidth / 2)
        .attr("y", scatterHeight + 50)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .attr("class", "x-axis-label")
        .text("Incident Date");

    // Vertical jitter function to add randomness to y positions for visibility
    const verticalJitter = () => (Math.random() - 0.5) * 10;

    // Initial scatter plot with sampled data
    scatterSvg1.selectAll("circle")
        .data(sampledData)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.date))
        .attr("cy", d => yScale(d.rating) + verticalJitter())
        .attr("r", 3) // Increase the radius for visibility
        .attr("fill", d => color(d.state))
        .attr("opacity", 0.7)
        .attr("stroke", "black")
        .attr("stroke-width", 0.3)
        .on("click", function(event, d) {
            // Update selected state
            selectedState = selectedState === d.state ? null : d.state;

            // Call centralized update function
            updateCharts(selectedState); // Trigger updates for all charts
        });

    // Flag to track the current view
    let isYearlyView = true;
    let selectedYear = null;

    // Function to update the scatter plot with new data
    function updateScatterPlot(data, xScale, xAxis) {
        // Remove existing circles
        scatterSvg1.selectAll("circle").remove();

        // Add new circles for the updated data
        scatterSvg1.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.date))
            .attr("cy", d => yScale(d.rating) + verticalJitter())
            .attr("r", 3)
            .attr("fill", d => color(d.state))
            .attr("opacity", 0.7)
            .attr("stroke", "black")
            .attr("stroke-width", 0.3);

        // Update the x-axis
        scatterSvg1.select(".x-axis").call(xAxis);

        // Reattach click event listeners to the x-axis labels
        scatterSvg1.selectAll(".x-axis text").on("click.toggleView", function(event, d) {
            if (isYearlyView) {
                // Switch to monthly view
                selectedYear = d.getFullYear();
                const yearData = filteredData.filter(item => item.date.getFullYear() === selectedYear);
                const xScaleMonth = d3.scaleTime()
                    .domain([new Date(selectedYear, 0, 1), new Date(selectedYear, 11, 31)])
                    .range([0, scatterWidth]);
                const xAxisMonth = d3.axisBottom(xScaleMonth)
                    .ticks(d3.timeMonth.every(1))
                    .tickFormat(d3.timeFormat("%b"));

                updateScatterPlot(yearData, xScaleMonth, xAxisMonth);
                xAxisLabel.text(`Incident Date ${selectedYear}`);
            } else {
                // Switch back to yearly view
                updateScatterPlot(sampledData, xScale, xAxis);
                xAxisLabel.text("Incident Date");
            }
            isYearlyView = !isYearlyView;
        });
    }

    // Add click event to toggle between yearly and monthly views
    scatterSvg1.selectAll(".x-axis text").on("click.toggleView", function(event, d) {
        if (isYearlyView) {
            // Switch to monthly view
            selectedYear = d.getFullYear();
            const yearData = filteredData.filter(item => item.date.getFullYear() === selectedYear);
            const xScaleMonth = d3.scaleTime()
                .domain([new Date(selectedYear, 0, 1), new Date(selectedYear, 11, 31)])
                .range([0, scatterWidth]);
            const xAxisMonth = d3.axisBottom(xScaleMonth)
                .ticks(d3.timeMonth.every(1))
                .tickFormat(d3.timeFormat("%b"));

            updateScatterPlot(yearData, xScaleMonth, xAxisMonth);
            xAxisLabel.text(`Incident Date ${selectedYear}`);
        } else {
            // Switch back to yearly view
            updateScatterPlot(sampledData, xScale, xAxis);
            xAxisLabel.text("Incident Date");
        }
        isYearlyView = !isYearlyView;
    });

    // Add click event to x-axis label to revert back to yearly view
    xAxisLabel.on("click.toggleView", function() {
        if (!isYearlyView) {
            updateScatterPlot(sampledData, xScale, xAxis);
            xAxisLabel.text("Incident Date");
            isYearlyView = true;
        }
    });

    // Register the scatter plot's update logic
    function updateScatterPlotState(state) {
        scatterSvg1.selectAll("circle")
            .transition()
            .duration(300)
            .attr("fill", d => state && d.state !== state ? "grey" : color(d.state))
            .attr("opacity", d => state && d.state !== state ? 0.3 : 1);
    }

    registerChart("scatterPlot", updateScatterPlotState);
})
.catch(error => {
    console.error("Error loading or parsing CSV file:", error);
});
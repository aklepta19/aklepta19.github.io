// Set up SVG dimensions and margins for scatter plot
var scatterDimensions2 = {
  width: 800,
  height: 550,
  margins: { top: 80, right: 30, bottom: 200, left: 70 }
};

var scatterWidth2 = scatterDimensions2.width - scatterDimensions2.margins.left - scatterDimensions2.margins.right;
var scatterHeight2 = scatterDimensions2.height - scatterDimensions2.margins.top - scatterDimensions2.margins.bottom;

// Create SVG container for scatter plot
const scatterSvg2 = d3.select("#scatter-plot2")
                      .attr("width", scatterDimensions2.width)
                      .attr("height", scatterDimensions2.height)
                      .style("position", "absolute")
                      .style("top", "0px")
                      .style("right", "0px")
                      .append("g")
                      .attr("transform", `translate(${scatterDimensions2.margins.left},${scatterDimensions2.margins.top})`);

// Define the grade order for y-axis
const gradeOrder2 = ["F", "D-", "D", "B-", "B", "B+", "A-", "A", "A+"];

// Load and process data
d3.csv("gun_data_with_rating.csv").then(data => {
    // Filter valid grades and format data
    const filteredData = data.filter(d => gradeOrder2.includes(d.rating));

    // Custom scale to map x values, including a gap between 30 and 90
    const xScale = d3.scaleLinear()
        .domain([0, 24, 100, 104]) // Include the gap in the domain
        .range([0, scatterWidth2 * 0.8, scatterWidth2 * 0.86, scatterWidth2]); // Ensure even spacing, including the gap

    // Define yScale for grade order
    const yScale = d3.scalePoint()
        .domain(gradeOrder2)
        .range([0, scatterHeight2]);

    // Define xAxis with custom ticks in steps of 5
    const xAxis = d3.axisBottom(xScale)
        .tickValues([...d3.range(0, 26, 2), ...d3.range(100, 106, 2)])// Include 0–30 and 90–115 in steps of 5
        .tickFormat(d => d);

    // Define yAxis for grades
    const yAxis = d3.axisLeft(yScale);

    // Add x-axis with rotated labels
    scatterSvg2.append("g")
        .attr("transform", `translate(0, ${scatterHeight2})`)
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "0.15em")
        .attr("transform", "rotate(-45)");

    // Add y-axis with grade labels
    scatterSvg2.append("g").call(yAxis);

    // Vertical jitter for visibility
    const verticalJitter = () => (Math.random() - 0.5) * 10;

    // Create scatter plot
    scatterSvg2.selectAll("circle")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("cx", d => {
            const casualties = +d.total_casualties;
            return xScale(casualties >= 35 && casualties < 100 ? 100 : casualties); // Map values in the gap to 90
        })
        .attr("cy", d => yScale(d.rating) + verticalJitter())
        .attr("r", 5)
        .attr("fill", "steelblue")
        .attr("opacity", 0.7)
        .attr("stroke", "black")
        .attr("stroke-width", 0.3);

    // Add x-axis label
    scatterSvg2.append("text")
        .attr("x", scatterWidth2 / 2)
        .attr("y", scatterHeight2 + 50)
        .attr("text-anchor", "middle")
        .text("Total Casualties");

    // Add y-axis label
    scatterSvg2.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -scatterHeight2 / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .text("Rating (Grade)");
})
.catch(error => {
    console.error("Error loading or parsing CSV file:", error);
});

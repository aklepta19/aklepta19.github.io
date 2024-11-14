// Set up SVG dimensions and margins for scatter plot
var scatterDimensions = {
  width: 1600,
  height: 450,
  margins: { top: 20, right: 30, bottom: 100, left: 80 }
};

var scatterWidth = scatterDimensions.width - scatterDimensions.margins.left - scatterDimensions.margins.right;
var scatterHeight = scatterDimensions.height - scatterDimensions.margins.top - scatterDimensions.margins.bottom;

// Create SVG container for scatter plot
const scatterSvg = d3.select("#scatter-plot")
.attr("width", scatterDimensions.width)
.attr("height", scatterDimensions.height)
.append("g")
.attr("transform", `translate(${scatterDimensions.margins.left},${scatterDimensions.margins.top})`);

// Parse the date format in your data
const parseDate = d3.timeParse("%Y-%m-%d");
const gradeOrder = ["F", "D-", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"];

// Load and process data
d3.csv("gun_data_with_rating.csv").then(data => {
// Format and filter the data
const filteredData = data.filter(d => {
  d.date = parseDate(d.date); // Parse the date
  const isValidGrade = gradeOrder.includes(d.rating);
  return d.date !== null && isValidGrade; // Filter by valid date and grade only
});

console.log("Filtered Data:", filteredData);

// Define xScale for date (showing daily ticks)
const xScale = d3.scaleTime()
  .domain(d3.extent(filteredData, d => d.date))
  .range([0, scatterWidth]);

// Define yScale for rating
const yScale = d3.scalePoint()
  .domain(gradeOrder)
  .range([0, scatterHeight]);

// Define axes with daily ticks
const xAxis = d3.axisBottom(xScale)
  .ticks(d3.timeYear.every(1))
  .tickFormat(d3.timeFormat("%m"));

const yAxis = d3.axisLeft(yScale);

// Add x-axis with rotated labels
scatterSvg.append("g")
  .attr("transform", `translate(0, ${scatterHeight})`)
  .call(xAxis)
  .selectAll("text")
  .style("text-anchor", "end")
  .attr("dx", "-0.8em")
  .attr("dy", "0.15em")
  .attr("transform", "rotate(-45)");

// Add y-axis with grade labels
scatterSvg.append("g")
  .call(yAxis);

// Vertical jitter function to add randomness to y positions for visibility
const verticalJitter = () => (Math.random() - 0.5) * 10;

// Create the scatter plot with vertical jitter and transparency
scatterSvg.selectAll("circle")
  .data(filteredData)
  .enter()
  .append("circle")
  .attr("cx", d => xScale(d.date))
  .attr("cy", d => yScale(d.rating) + verticalJitter())
  .attr("r", 1)
  .attr("fill", "steelblue")
  .attr("opacity", 0.7)
  .attr("stroke", "black")
  .attr("stroke-width", 0.3);

// Add labels for axes
scatterSvg.append("text")
  .attr("x", scatterWidth / 2)
  .attr("y", scatterHeight + 50)
  .attr("text-anchor", "middle")
  .text("Date (to the Day)");

scatterSvg.append("text")
  .attr("transform", "rotate(-90)")
  .attr("x", -scatterHeight / 2)
  .attr("y", -40)
  .attr("text-anchor", "middle")
  .text("Rating (Grade)");
})
.catch(error => {
console.error("Error loading or parsing CSV file:", error);
});

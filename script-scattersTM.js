/*
var dimensions = {
    width: 850,
    height: 450,
    margins: { top: 20, right: 30, bottom: 100, left: 80 }
};
// Create SVG container
const svg = d3.select("#scatter-plot")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);
*/
// Parse the date format in your data
const parseDate = d3.timeParse("%Y-%m-%d");

d3.csv("Gun_violence_SE_clean_CSV.csv").then(data => {
      // Filter and format the data
  const incidentsByDate = d3.group(
    data.filter(d => {
      // Parse date and keep only year-month-day
      const dateString = d.date.split(" ")[0];
      d.date = parseDate(dateString);
      return d.date !== null;
    }),
    d => d.date // Group by date
  );

  // Convert grouped data back to a flat array with vertical positioning
  const processedData = [];
  incidentsByDate.forEach((incidents, date) => {
    incidents.forEach((d, i) => {
      processedData.push({
        date: date,
        verticalIndex: i // Use the index within the group for vertical separation
      });
    });
  });

  console.log("Processed data points:", processedData.length);

  // Define scales
  const xScale = d3.scaleTime()
    .domain(d3.extent(processedData, d => d.date))
    .range([0, width]);

  // Determine the maximum vertical separation
  const maxVerticalIndex = d3.max(processedData, d => d.verticalIndex);
  const yScale = d3.scaleLinear()
    .domain([0, maxVerticalIndex + 1]) // Add a bit of padding
    .range([height, 0]);

  // Define axes
  const xAxis = d3.axisBottom(xScale).ticks(d3.timeMonth.every(1));
  const yAxis = d3.axisLeft(yScale).ticks(maxVerticalIndex + 1);

  // Add x-axis
  svg.append("g")
  .attr("transform", `translate(0, ${height})`)
  .call(xAxis)
  .selectAll("text") // Select all x-axis labels
  .style("text-anchor", "end") // Anchor the text to the end for better alignment
  .attr("dx", "-0.8em") // Horizontal offset to add some spacing
  .attr("dy", "0.15em") // Vertical offset for alignment
  .attr("transform", "rotate(-45)"); // Rotate the text by -45 degrees

  // Add y-axis (optional, shows vertical indices)
  svg.append("g")
    .call(yAxis)
    .append("text")
    .attr("fill", "#000")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -40)
    .attr("text-anchor", "middle")
    .text("Incident Index");

  // Create the scatter plot (each row is an individual point)
  svg.selectAll("circle")
    .data(processedData)
    .enter()
    .append("circle")
    .attr("cx", d => xScale(d.date))
    .attr("cy", d => yScale(d.verticalIndex))
    .attr("r", 0.5)
    .attr("fill", "steelblue")
    .attr("opacity", 2)
    .attr("stroke", "black")
    .attr("stroke-width", 0.5);
})
.catch(error => {
  console.error("Error loading or parsing CSV file:", error);
});
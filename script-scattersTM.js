// Function to sample data
//rating and time
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
const gradeOrder = ["F", "D-", "D", "B-", "B", "B+", "A-", "A"]; // reverse this shit
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

    // Define xScale for date (showing yearly ticks)
    //const xScale = d3.scaleTime()
          //.domain(d3.extent(sampledData, d => d.date))
       //   .range([0, scatterWidth]);
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
    scatterSvg1.append("g")
      .attr("transform", `translate(0, ${scatterHeight})`)
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "middle")
      //.attr("dx", "-0.8em")
      .attr("dy", "1em")
      //.attr("transform", "rotate(-4)");

    // Add y-axis with grade labels
    scatterSvg1.append("g")
      .call(yAxis);

    // Vertical jitter function to add randomness to y positions for visibility
    const verticalJitter = () => (Math.random() - 0.5) * 10;

    // Create the scatter plot with vertical jitter and transparency
    const color = d3.scaleOrdinal()
        .domain([...new Set(sampledData.map(d => d.state))]) // Get unique states
        .range(d3.schemeObservable10); 

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
      .attr("stroke-width", 0.3);

    // Add labels for axes
    scatterSvg1.append("text")
      .attr("x", scatterWidth / 2)
      .attr("y", scatterHeight + 50)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Incident Date");

    scatterSvg1.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -scatterHeight / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Gun Safety Rating");
    })
    .catch(error => {
      console.error("Error loading or parsing CSV file:", error);
    });

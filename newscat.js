// Set up SVG dimensions and margins for scatter plot
var scatterDimensions2 = {
    width: 850,
    height: 450,
    margins: { top: 100, right: 30, bottom: 150, left: 70 }
};

var scatterWidth2 = scatterDimensions2.width - scatterDimensions2.margins.left - scatterDimensions2.margins.right;
var scatterHeight2 = scatterDimensions2.height - scatterDimensions2.margins.top - scatterDimensions2.margins.bottom;

  // Create SVG container for scatter plot
const scatterSvg2 = d3.select("#scatter-plot2")
                        .attr("width", scatterDimensions2.width)
                        .attr("height", scatterDimensions2.height)
                        .style("position", "absolute")  // Set position to absolute
                        .style("top", "0px")         // Position it at the bottom
                        .style("right", "0px")          // Position it at the right
                        .append("g")
                        .attr("transform", `translate(${scatterDimensions2.margins.left},${scatterDimensions2.margins.top})`);
                        
                        
  // Define the grade order for y-axis
const gradeOrder2 = ["F", "D-", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"];

  // Load and process data
  d3.csv("gun_data_with_rating.csv").then(data => {
      // Format and filter the data
      const filteredData = data.filter(d => {
          const isValidGrade = gradeOrder2.includes(d.rating);
          return isValidGrade; // Filter by valid grade only
      });
  
      //console.log("Filtered Data:", filteredData);
  
      // Define xScale for total casualties
      const xScale = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => +d.total_casualties)])  // Set the range to 50
            .range([0, scatterWidth]);
  
      // Define yScale for rating
      const yScale = d3.scalePoint()
            .domain(gradeOrder2)
            .range([0, scatterHeight]);
  
      // Define xAxis with numeric ticks
      const xAxis = d3.axisBottom(xScale)
            .ticks(10); // Adjust the number of ticks as needed
  
      const yAxis = d3.axisLeft(yScale);
  
      // Add x-axis with rotated labels
      scatterSvg2.append("g")
        .attr("transform", `translate(0, ${scatterHeight})`)
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "0.15em")
        .attr("transform", "rotate(-45)");
  
      // Add y-axis with grade labels
      scatterSvg2.append("g")
        .call(yAxis);
  
      // Vertical jitter function to add randomness to y positions for visibility
      const verticalJitter = () => (Math.random() - 0.5) * 10;
  
      // Create the scatter plot with vertical jitter and transparency
      scatterSvg2.selectAll("circle")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(+d.total_casualties)) // Convert to numeric
        .attr("cy", d => yScale(d.rating) + verticalJitter())
        .attr("r", 5)
        .attr("fill", "steelblue")
        .attr("opacity", 0.7)
        .attr("stroke", "black")
        .attr("stroke-width", 0.3);
  
      // Add labels for axes
      scatterSvg2.append("text")
        .attr("x", scatterWidth / 2)
        .attr("y", scatterHeight + 50)
        .attr("text-anchor", "middle")
        .text("Total Casualties");
  
      scatterSvg2.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -scatterHeight / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .text("Rating (Grade)");
      })
      .catch(error => {
        console.error("Error loading or parsing CSV file:", error);
      }
    );
  
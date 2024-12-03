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
  var scatterDimensions2 = {
    width: 750,
    height: 650,
    margins: { top: 80, right: 100, bottom: 200, left: 70 }
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
  const gradeOrder2 = ["F", "D-", "D", "B-", "B", "B+", "A-", "A"];
  
  // Load and process data
  d3.csv("gun_data_with_rating.csv").then(data => {
      // Filter valid grades and format data
      //const filteredData = data.filter(d => gradeOrder2.includes(d.rating) && d.state && d.incident_id);
        // Parse year from date or ensure it exists
        data.forEach(d => {
            // Parse the year from the date column if it exists
            if (d.date) {
                const parsedDate = new Date(d.date);
                d.year = isNaN(parsedDate) ? null : parsedDate.getFullYear();
            } else {
                // Otherwise, ensure year is treated as a number
                d.year = +d.year || null;
            }
        });
        const filteredData = data.filter(d => gradeOrder2.includes(d.rating) && d.state && d.incident_id && d.year);
  
      // Sample the data to reduce its size
      const sampleSize = 10000; // Adjust the sample size as needed
      const sampledData = sampleData(filteredData, sampleSize);
  
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
          .tickValues([...d3.range(0, 26, 2), ...d3.range(100, 106, 2)]) // Include 0–30 and 90–115 in steps of 5
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
      const verticalJitter = () => (Math.random() - 0.5) * 32;
  
      // Create scatter plot
      scatterSvg2.selectAll("circle")
          .data(sampledData)
          .enter()
          .append("circle")
          .attr("class", "chart-element")
          .attr("cx", d => {
              const casualties = +d.total_casualties;
              return xScale(casualties >= 35 && casualties < 100 ? 100 : casualties); // Map values in the gap to 90
          })
          .attr("cy", d => yScale(d.rating) + verticalJitter())
          .attr("r", 3)
          .attr("fill", d => color(d.state))
          .attr("opacity", 0.3)
          .attr("stroke", "black")
          .attr("stroke-width", 0.3)
          .on("mouseover", showTooltip) // Show tooltip on hover
          .on("mousemove", moveTooltip) // Move tooltip with the pointer
          .on("mouseout", hideTooltip) // Hide tooltip on mouseout;
          .on("click", function (event, d) {
            const clickedState = dashboardState.selectedState === d.state ? null : d.state; // Toggle state
            console.log(clickedState);
            updateCharts({ state: clickedState });
        });
  
    function updateNewScatter({ selectedState, selectedYear, selectedIncidentId }) {
        console.log("Updating scatter plot with selected state:", selectedIncidentId, selectedState, selectedYear);
     

    scatterSvg2.selectAll("circle")
        .transition()
        .duration(300)
        .attr("opacity", d => {
            const isMatchingState = !selectedState || d.state === selectedState;
            const isMatchingYear = !selectedYear || d.year === selectedYear;
            const isMatchingID = !selectedIncidentId || d.incident_id === selectedIncidentId;

            // Highlight only matching data points
            return (isMatchingState && isMatchingYear) ? .3 : 0;
        })
        .attr("r", d => {
           const isMatchingID = d.incident_id === selectedIncidentId;
            console.log(selectedIncidentId);

            // Increase radius for selected incident
            return isMatchingID ? 6 : 3;
        })
        .attr("stroke", d => (d.incident_id === selectedIncidentId ? "red" : "none"))
        .attr("stroke-width", d => (d.incident_id === selectedIncidentId ? 2 : 0));
        
}

    

  
      // Register this scatter plot's update logic
      registerChart("scat", updateNewScatter); // Register scatter plot
  
      // Add x-axis label
      scatterSvg2.append("text")
          .attr("x", scatterWidth2 / 2)
          .attr("y", scatterHeight2 + 50)
          .attr("text-anchor", "middle")
          .attr("font-size", "14px")
          .text("Total Casualties per Incident");
  
      // Add y-axis label
      scatterSvg2.append("text")
          .attr("transform", "rotate(-90)")
          .attr("x", -scatterHeight2 / 2)
          .attr("y", -40)
          .attr("text-anchor", "middle")
          .attr("font-size", "14px")
          .text("Gun Safety Rating");
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
                      <strong>Incident ID:</strong> ${d.incident_id}<br>
                      <strong>Rating:</strong> ${d.rating}<br>
                      <strong>Casualities:</strong> ${d.total_casualties}<br>
                      <strong>State:</strong> ${d.state}
                  `)
                  .style("left", `${event.pageX + 10}px`) // Offset from mouse pointer
                  .style("top", `${event.pageY + 10}px`)
                  .style("opacity", 1) // Make the tooltip visible
                  .style("z-index", 9999); // Bring tooltip to the front
          }
      
          function moveTooltip(event) {
              tooltip
                  .style("left", `${event.pageX + 10}px`)
                  .style("top", `${event.pageY + 10}px`);
          }
      
          function hideTooltip() {
              tooltip.style("opacity", 0); // Hide the tooltip
          }
      
      })
  .catch(error => {
      console.error("Error loading or parsing CSV file:", error);
  });
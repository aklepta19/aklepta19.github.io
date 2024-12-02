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
    const filteredData = data.map(d => {
    const genderField = d.participant_gender 
        ? d.participant_gender.split("||").find(g => g.startsWith("0::")) 
        : null;
    const suspectGender = genderField ? genderField.split("::")[1] : null; // Extract gender of participant zero

    return {
        date: parseDate(d.date),
        rating: d.rating,
        state: d.state,
        incidentId: d.incident_id,
        gender: suspectGender // Assign only the suspect's gender
    };
    
}).filter(d => d.date && gradeOrder.includes(d.rating) && d.state && d.gender); // Ensure valid data
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
          .attr("class", "chart-element")
          .attr("cx", d => xScale(d.date))
          .attr("cy", d => yScale(d.rating) + verticalJitter())
          .attr("r", 3) // Increase the radius for visibility
          .attr("fill", d => color(d.state))
          .attr("opacity", 0.7)
          .attr("stroke", "black")
          .attr("stroke-width", 0.3)
          .on("mouseover", showTooltip) // Show tooltip on hover
          .on("mousemove", moveTooltip) // Move tooltip with the pointer
          .on("mouseout", hideTooltip) // Hide tooltip on mouseout
          .on("click", function (event, d) {
               event.stopPropagation(); // Prevent global click handler from firing
            
              // Toggle selection
              const clickedState = dashboardState.selectedState === d.state ? null : d.state;
              const clickedIncidentId = dashboardState.selectedIncidentId === d.incidentId ? null : d.incidentId;

               // Set the selected year in dashboardState based on the clicked year in the scatter plot
                const clickedYear = d.year; // Assuming each point in the scatter plot has a `year` property
                dashboardState.selectedYear = clickedYear;
              // Update global state with both `state` and `incidentId`
              updateCharts({ state: clickedState, incidentId: clickedIncidentId });
  
              // Update circle styles based on the selected state and incidentId
              scatterSvg1.selectAll("circle")
                  .transition()
                  .duration(300)
                  .attr("fill", c =>
                      (clickedState && c.state !== clickedState) || (clickedIncidentId && c.incidentId !== clickedIncidentId)
                          ? "grey"
                          : color(c.state)
                  )
                  .attr("opacity", c =>
                      (clickedState && c.state !== clickedState) || (clickedIncidentId && c.incidentId !== clickedIncidentId)
                          ? 0.3
                          : 1
                  )
                  .attr("stroke", c => (clickedIncidentId && c.incidentId === clickedIncidentId ? "black" : "none"))
                  .attr("stroke-width", c => (clickedIncidentId && c.incidentId === clickedIncidentId ? 2 : 0))
                  .attr("r", c => (clickedIncidentId && c.incidentId === clickedIncidentId ? 5 : 3)); // Highlight selected
          });
  
  
      // Flag to track the current view
      let isYearlyView = true;
      let selectedYear = null;
  
      // Function to update the scatter plot with new data
      // Add click event to x-axis text to set selectedYear in dashboardState
scatterSvg1.selectAll(".x-axis text").on("click", function(event, d) {
    // Get the year from the clicked label
    const clickedYear = d.getFullYear();

    // If the clicked year is the same as the selected year, deselect it
    if (dashboardState.selectedYear === clickedYear) {
        // Deselect the year and show all years
        dashboardState.selectedYear = null;
        updateCharts({ year: null });
        xAxisLabel.text("Incident Date"); // Reset the x-axis label
    } else {
        // Otherwise, set the selected year and update the scatter plot
        dashboardState.selectedYear = clickedYear;

        // Filter data by the selected year
        const yearData = filteredData.filter(item => item.date.getFullYear() === clickedYear);
        
        // Update xScale and xAxis for the selected year
        const xScaleYear = d3.scaleTime()
            .domain([new Date(clickedYear, 0, 1), new Date(clickedYear, 11, 31)])
            .range([0, scatterWidth]);

        const xAxisYear = d3.axisBottom(xScaleYear)
            .ticks(d3.timeMonth.every(1)) // Show months for the selected year
            .tickFormat(d3.timeFormat("%b"));

        // Call the update function for the scatter plot
        updateScatterPlot(yearData, xScaleYear, xAxisYear);

        // Update xAxisLabel with the selected year
        xAxisLabel.text(`Incident Date ${clickedYear}`);

        // Optionally update other charts or UI based on selected year
        updateCharts({ year: clickedYear });
    }
});

// Optionally, you can add a separate handler for the x-axis label if needed to revert back
xAxisLabel.on("click", function() {
    // Reset to show all years if needed
    updateScatterPlot(sampledData, xScale, xAxis);
    xAxisLabel.text("Incident Date");
    dashboardState.selectedYear = null; // Reset the selected year
    updateCharts({ year: null }); // Revert to aggregated data
});

// Function to update the scatter plot with new data
function updateScatterPlot(data, xScale, xAxis) {
    // Remove existing circles
    scatterSvg1.selectAll("circle").remove();

    // Add new circles for the updated data
    scatterSvg1.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "chart-element")
        .attr("cx", d => xScale(d.date))
        .attr("cy", d => yScale(d.rating) + verticalJitter())
        .attr("r", 3)
        .attr("fill", d => color(d.state))
        .attr("opacity", 0.7)
        .attr("stroke", "black")
        .attr("stroke-width", 0.3)
        .on("click", function(event, d) {
            event.stopPropagation(); // Prevent global click handler from firing

            // Toggle selection
            const clickedState = dashboardState.selectedState === d.state ? null : d.state;
            const clickedIncidentId = dashboardState.selectedIncidentId === d.incidentId ? null : d.incidentId;

            // Update global state with both `state` and `incidentId`
            updateCharts({ state: clickedState, incidentId: clickedIncidentId });

            // Update circle styles based on the selected state and incidentId
            scatterSvg1.selectAll("circle")
                .transition()
                .duration(300)
                .attr("fill", c =>
                    (clickedState && c.state !== clickedState) || (clickedIncidentId && c.incidentId !== clickedIncidentId)
                        ? "grey"
                        : color(c.state)
                )
                .attr("opacity", c =>
                    (clickedState && c.state !== clickedState) || (clickedIncidentId && c.incidentId !== clickedIncidentId)
                        ? 0.3
                        : 1
                )
                .attr("stroke", c => (clickedIncidentId && c.incidentId === clickedIncidentId ? "black" : "none"))
                .attr("stroke-width", c => (clickedIncidentId && c.incidentId === clickedIncidentId ? 2 : 0))
                .attr("r", c => (clickedIncidentId && c.incidentId === clickedIncidentId ? 5 : 3)); // Highlight selected
        });

    // Update the x-axis

    scatterSvg1.select(".x-axis").call(xAxis);

      
}

      function updateScatterPlot2({ selectedState, selectedIncidentId, selectedGender }) {
    scatterSvg1.selectAll("circle")
        .transition()
        .duration(300)
        .attr("fill", d =>
            (selectedState && d.state !== selectedState) || 
            (selectedIncidentId && d.incidentId !== selectedIncidentId) || 
            (selectedGender && d.gender !== selectedGender) ? 
                "grey" : color(d.state)
        )
        .attr("opacity", d =>
            (selectedState && d.state !== selectedState) || 
            (selectedIncidentId && d.incidentId !== selectedIncidentId) || 
            (selectedGender && d.gender !== selectedGender) ? 
                0.3 : 1
        )
        .attr("stroke", d => 
            (selectedIncidentId && d.incidentId === selectedIncidentId) || 
            (selectedGender && d.gender === selectedGender) ? "black" : "none"
        )
        .attr("stroke-width", d => 
            (selectedIncidentId && d.incidentId === selectedIncidentId) || 
            (selectedGender && d.gender === selectedGender) ? 2 : 0
        )
        .attr("r", d => 
            (selectedIncidentId && d.incidentId === selectedIncidentId) || 
            (selectedGender && d.gender === selectedGender) ? 5 : 3
        );
}
      
  
      registerChart("scatterPlot", updateScatterPlot2);
  })
  .catch(error => {
      console.error("Error loading or parsing CSV file:", error);
  });
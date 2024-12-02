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
              state: d.state,
              incident_id: d.incident_id
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
              const clickedIncidentId = dashboardState.selectedIncidentId === d.incident_id ? null : d.incident_id;
  
              // Update global state with both `state` and `incidentId`
              updateCharts({ state: clickedState, incidentId: clickedIncidentId });
  
              // Update circle styles based on the selected state and incidentId
              scatterSvg1.selectAll("circle")
                  .transition()
                  .duration(300)
                  .attr("fill", c =>
                      (clickedState && c.state !== clickedState) || (clickedIncidentId && c.incident_id !== clickedIncidentId)
                          ? "grey"
                          : color(c.state)
                  )
                  .attr("opacity", c =>
                      (clickedState && c.state !== clickedState) || (clickedIncidentId && c.incident_id !== clickedIncidentId)
                          ? 0.3
                          : 1
                  )
                  .attr("stroke", c => (clickedIncidentId && c.incident_id === clickedIncidentId ? "black" : "none"))
                  .attr("stroke-width", c => (clickedIncidentId && c.incident_id === clickedIncidentId ? 2 : 0))
                  .attr("r", c => (clickedIncidentId && c.incident_id === clickedIncidentId ? 5 : 3)); // Highlight selected
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
              .attr("class", "chart-element")
              .attr("cx", d => xScale(d.date))
              .attr("cy", d => yScale(d.rating) + verticalJitter())
              .attr("r", 3)
              .attr("fill", d => color(d.state))
              .attr("opacity", 0.7)
              .attr("stroke", "black")
              .attr("stroke-width", 0.3)
              .on("mouseover", showTooltip) // Show tooltip on hover
              .on("mousemove", moveTooltip) // Move tooltip with the pointer
              .on("mouseout", hideTooltip) // Hide tooltip on mouseout;
              .on("click", function (event, d) {
                event.stopPropagation(); // Prevent global click handler from firing
   
               // Toggle selection
               const clickedState = dashboardState.selectedState === d.state ? null : d.state;
               const clickedIncidentId = dashboardState.selectedIncidentId === d.incident_id ? null : d.incident_id;
   
               // Update global state with both `state` and `incidentId`
               updateCharts({ state: clickedState, incidentId: clickedIncidentId });
               // Update circle styles based on the selected state and incidentId
              scatterSvg1.selectAll("circle")
              .transition()
              .duration(300)
              .attr("fill", c =>
                  (clickedState && c.state !== clickedState) || (clickedIncidentId && c.incident_id !== clickedIncidentId)
                      ? "grey"
                      : color(c.state)
              )
              .attr("opacity", c =>
                  (clickedState && c.state !== clickedState) || (clickedIncidentId && c.incident_id !== clickedIncidentId)
                      ? 0.3
                      : 1
              )
              .attr("stroke", c => (clickedIncidentId && c.incident_id === clickedIncidentId ? "black" : "none"))
              .attr("stroke-width", c => (clickedIncidentId && c.incident_id === clickedIncidentId ? 2 : 0))
              .attr("r", c => (clickedIncidentId && c.incident_id === clickedIncidentId ? 5 : 3)); // Highlight selected
      }
      
    );

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
                  registerChart("scatterPlot", updateScatterPlot(sampledData, xScale, xAxis));
                  updateCharts({ selectedYear: clickedState, incidentId: clickedIncidentId });


              } else {
                  // Switch back to yearly view
                  ;
                  registerChart("scatterPlot", updateScatterPlot(sampledData, xScale, xAxis));

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
    
            // Update the global dashboard state
            updateCharts({ year: selectedYear });
    
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
            updateCharts({ year: null });
    
            updateScatterPlot(sampledData, xScale, xAxis);
            xAxisLabel.text("Incident Date");
        }
        isYearlyView = !isYearlyView;
    });
=======
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
              state: d.state,
              incidentId: d.incident_id
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
          .attr("class", "chart-element")
          .attr("cx", d => xScale(d.date))
          .attr("cy", d => yScale(d.rating) + verticalJitter())
          .attr("r", 3) // Increase the radius for visibility
          .attr("fill", d => color(d.state))
          .attr("opacity", 0.7)
          .attr("stroke", "black")
          .attr("stroke-width", 0.3)
          .on("click", function (event, d) {
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
            .attr("class", "chart-element")
            .attr("cx", d => xScale(d.date))
            .attr("cy", d => yScale(d.rating) + verticalJitter())
            .attr("r", 3)
            .attr("fill", d => color(d.state))
            .attr("opacity", 0.7)
            .attr("stroke", "black")
            .attr("stroke-width", 0.3)
            .on("click", function (event, d) {
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
>>>>>>> 031c7d6c2c40cb4d8ed4b6c55c2450308867bb55
  
      // Add click event to x-axis label to revert back to yearly view
      xAxisLabel.on("click.toggleView", function() {
          if (!isYearlyView) {
              updateScatterPlot(sampledData, xScale, xAxis);
              xAxisLabel.text("Incident Date");
              isYearlyView = true;
          }
      });
  
      
      function updateScatterPlot2({ selectedState, selectedIncidentId }) {
          scatterSvg1.selectAll("circle")
              .transition()
              .duration(300)
              .attr("fill", d =>
<<<<<<< HEAD
                  (selectedState && d.state !== selectedState) || (selectedIncidentId && d.incident_id !== selectedIncidentId)
=======
                  (selectedState && d.state !== selectedState) || (selectedIncidentId && d.incidentId !== selectedIncidentId)
>>>>>>> 031c7d6c2c40cb4d8ed4b6c55c2450308867bb55
                      ? "grey"
                      : color(d.state)
              )
              .attr("opacity", d =>
<<<<<<< HEAD
                  (selectedState && d.state !== selectedState) || (selectedIncidentId && d.incident_id !== selectedIncidentId)
                      ? 0.3
                      : 1
              );
        //showTooltip(event,d);
=======
                  (selectedState && d.state !== selectedState) || (selectedIncidentId && d.incidentId !== selectedIncidentId)
                      ? 0.3
                      : 1
              );
>>>>>>> 031c7d6c2c40cb4d8ed4b6c55c2450308867bb55
      }
      
  
      registerChart("scatterPlot", updateScatterPlot2);
<<<<<<< HEAD
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
                <strong>Incident ID:</strong> ${d.incident_id}<br>
                <strong>Date:</strong> ${d3.timeFormat("%b %d, %Y")(d.date)}<br>
                <strong>Rating:</strong> ${d.rating}<br>
                <strong>State:</strong> ${d.state}
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

})
=======
  })
>>>>>>> 031c7d6c2c40cb4d8ed4b6c55c2450308867bb55
  .catch(error => {
      console.error("Error loading or parsing CSV file:", error);
  });
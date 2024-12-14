
  // Set up SVG dimensions and margins for scatter plot
  var scatterDimensions = {
    width: 900,
    height: 650,
    margins: { top: 100, right: 30, bottom: 100, left: 90 } // adjusted to account for increased jitter
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

    const filteredData = data.map(d => {
        const genderField = d.participant_gender 
            ? d.participant_gender.split("||").find(g => g.startsWith("0::")) 
            : null;
        const suspectGender = genderField ? genderField.split("::")[1] : null;
        
        const processed = {
            date: parseDate(d.date),
            rating: d.rating,
            state: d.state,
            incident_id: d.incident_id,
            gender: suspectGender
        };
        
        return processed;
        
    }).filter(d => {
        const isValid = d.date && gradeOrder.includes(d.rating) && d.state && d.gender;
        return isValid;
    });
  
      // Define xScale for date (extending to include 2018)
      const xScale = d3.scaleTime()
          .domain([
              d3.min(filteredData, d => d.date), // Minimum date in the data
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
      const verticalJitter = () => (Math.random() - 0.5) * 32;
  
      // Initial scatter plot with sampled data
      scatterSvg1.selectAll("circle")
          .data(filteredData)
          .enter()
          .append("circle")
          .attr("class", "chart-element")
          .attr("cx", d => xScale(d.date))
          .attr("cy", d => yScale(d.rating) + verticalJitter())
          .attr("r", 3) // Increase the radius for visibility
          .attr("fill", d => color(d.state))
          .attr("opacity", 0.3)
          .attr("stroke", "black")
          .attr("stroke-width", 0.3)
          .on("mouseover", showTooltip) // Show tooltip on hover
          .on("mousemove", moveTooltip) // Move tooltip with the pointer
          .on("mouseout", hideTooltip) // Hide tooltip on mouseout
          .on("click", function(event, d) {
            event.stopPropagation();
        
            // Toggle only the incident ID
            const clickedIncidentId = dashboardState.selectedIncidentId === d.incident_id ? null : d.incident_id;

            const clickedState = dashboardState.selectedIncidentId ? null : 
                     (dashboardState.selectedState === d.state ? null : d.state);


            //const clickedState = dashboardState.selectedState === d.state ? null : d.state;
            // Update global state while preserving current selections
            updateCharts({ 
                state: clickedState,  // Preserve current state
                incidentId: clickedIncidentId,
                year: dashboardState.clickedYear,  // Preserve year filter
                gender: dashboardState.selectedGender // Preserve gender filter
            });
        
            // Update circles in both scatter plots
            const circles1 = scatterSvg1.selectAll("circle");
            const circles2 = scatterSvg2.selectAll("circle");
            
            // Function to update circles - reusable for both plots
            const updateCircles = (selection) => {
                selection
                    .transition()
                    .duration(300)
                    .attr("fill", c => {
                        // If there's a selected incident (either from click or filter)
                        if (dashboardState.selectedIncidentId) {
                            return c.incident_id === dashboardState.selectedIncidentId ? color(c.state) : "grey";
                        }
                        // If no incident is selected, return to original colors
                        return color(c.state);
                    })
                    .attr("opacity", c => {
                        const isMatchingYear = !dashboardState.selectedYear || c.year === dashboardState.selectedYear;
                        
                        if (!dashboardState.selectedIncidentId) {
                            // Base opacity when no point is selected
                            if (!isMatchingYear) return 0.05;
                            return 0.3;
                        }
                        // Selected incident handling
                        if (c.incident_id === dashboardState.selectedIncidentId) return 1;
                        if (!isMatchingYear) return 0.05;
                        return 0.1;
                    })
                    .attr("stroke", c => (dashboardState.selectedIncidentId && 
                                         c.incident_id === dashboardState.selectedIncidentId ? "black" : "none"))
                    .attr("stroke-width", c => (dashboardState.selectedIncidentId && 
                                              c.incident_id === dashboardState.selectedIncidentId ? 2 : 0))
                    .attr("r", c => {
                        if (dashboardState.selectedIncidentId && 
                            c.incident_id === dashboardState.selectedIncidentId) return 5;
                        if (dashboardState.selectedYear && c.year === dashboardState.selectedYear) return 4;
                        return 3;
                    });
            };
        
            // Apply updates to both plots
            updateCircles(circles1);
            updateCircles(circles2);
        
            // Reset z-index for all circles and bring selected ones to front
            circles1.lower();
            circles2.lower();
            if (dashboardState.selectedIncidentId) {
                circles1.filter(c => c.incident_id === dashboardState.selectedIncidentId).raise();
                circles2.filter(c => c.incident_id === dashboardState.selectedIncidentId).raise();
            }
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
            .attr("opacity", 0.3)  // Set initial opacity to 0.6
            .attr("stroke", "black")
            .attr("stroke-width", 0.3)
            .on("mouseover", showTooltip)
            .on("mousemove", moveTooltip)
            .on("mouseout", hideTooltip)
            .on("click", function(event, d) {
    event.stopPropagation();

    // Toggle only the incident ID
    const clickedIncidentId = dashboardState.selectedIncidentId === d.incident_id ? null : d.incident_id;

    // Update global state while preserving current selections
    updateCharts({ 
        state: dashboardState.selectedState,  // Preserve current state
        incidentId: clickedIncidentId,
        year: dashboardState.selectedYear,  // Preserve year filter
        gender: dashboardState.selectedGender // Preserve gender filter
    });

    // Update circles in both scatter plots
    const circles1 = scatterSvg1.selectAll("circle");
    const circles2 = scatterSvg2.selectAll("circle");
    
    // Function to update circles - reusable for both plots
    const updateCircles = (selection) => {
        selection
            .transition()
            .duration(300)
            .attr("fill", c => {
                // If a point is selected, only that point keeps its color
                if (clickedIncidentId) {
                    return c.incident_id === clickedIncidentId ? color(c.state) : "grey";
                }
                // If no point is selected, return to original colors
                return color(c.state);
            })
            .attr("opacity", c => {
                const isMatchingYear = !dashboardState.selectedYear || c.year === dashboardState.selectedYear;
                
                if (!clickedIncidentId) {
                    // Base opacity when no point is selected
                    if (!isMatchingYear) return 0.05;
                    return 0.3;
                }
                // Selected incident handling
                if (c.incident_id === clickedIncidentId) return 1;
                if (!isMatchingYear) return 0.05;
                return 0.1;
            })
            .attr("stroke", c => (clickedIncidentId && c.incident_id === clickedIncidentId ? "black" : "none"))
            .attr("stroke-width", c => (clickedIncidentId && c.incident_id === clickedIncidentId ? 2 : 0))
            .attr("r", c => {
                if (clickedIncidentId && c.incident_id === clickedIncidentId) return 5;
                if (dashboardState.selectedYear && c.year === dashboardState.selectedYear) return 4;
                return 3;
            });
    };

    // Apply updates to both plots
    updateCircles(circles1);
    updateCircles(circles2);

    // Reset z-index for all circles and bring selected ones to front
    circles1.lower();
    circles2.lower();
    if (clickedIncidentId) {
        circles1.filter(c => c.incident_id === clickedIncidentId).raise();
        circles2.filter(c => c.incident_id === clickedIncidentId).raise();
    }
});
    
        // Update the x-axis
        scatterSvg1.select(".x-axis").call(xAxis);
  
          // Add click event to toggle between yearly and monthly views
     // Add click event to toggle between yearly and monthly views
scatterSvg1.selectAll(".x-axis text").on("click.toggleView", function(event, d) {
    if (isYearlyView) {
        // Switch to monthly view
        selectedYear = d.getFullYear();
        console.log("selectedYear", selectedYear);
        console.log("Current Dashboard Statescats: d", dashboardState);
        // Update the global dashboard state
        updateCharts({ 
            year: selectedYear,
            state: dashboardState.selectedState,        // Preserve current state
            incidentId: dashboardState.selectedIncidentId,
            gender: dashboardState.selectedGender  // Preserve selected incident
        });
        console.log("Current Dashboard Statescats: 2", dashboardState);

        const yearData = filteredData.filter(item => item.date.getFullYear() === selectedYear);
        const xScaleMonth = d3.scaleTime()
            .domain([new Date(selectedYear, 0, 1), new Date(selectedYear, 11, 31)])
            .range([0, scatterWidth]);
        const xAxisMonth = d3.axisBottom(xScaleMonth)
            .ticks(d3.timeMonth.every(1))
            .tickFormat(d3.timeFormat("%b"));

        updateScatterPlot(yearData, xScaleMonth, xAxisMonth);
        xAxisLabel.text(`Incident Date ${selectedYear}`);
        isYearlyView = false;
    } else {
        // Switch back to yearly view
        updateCharts({ 
            year: null,
            state: dashboardState.selectedState,        // Preserve current state
            incidentId: dashboardState.selectedIncidentId  // Preserve selected incident
        });
        console.log("Locationhere");
        isYearlyView = true;
        updateScatterPlot(filteredData, xScale, xAxis);
        xAxisLabel.text("Incident Date");

        // Re-apply opacity to selected points after reverting to yearly view
        scatterSvg1.selectAll("circle")
            .transition()
            .duration(300)
            .attr("opacity", c => {
                if (dashboardState.selectedIncidentId && c.incident_id === dashboardState.selectedIncidentId) {
                    return 1; // Selected incident is fully opaque
                } else if (!dashboardState.selectedState || c.state === dashboardState.selectedState) {
                    return 0.6; // Matching state points are more visible
                } else {
                    return 0.1; // Non-matching points are faded
                }
            })
            .attr("fill", c =>
                (dashboardState.selectedState && c.state !== dashboardState.selectedState) || 
                (dashboardState.selectedIncidentId && c.incident_id !== dashboardState.selectedIncidentId)
                    ? "grey"
                    : color(c.state)
            )
            .attr("stroke", c => (dashboardState.selectedIncidentId && c.incident_id === dashboardState.selectedIncidentId ? "black" : "none"))
            .attr("stroke-width", c => (dashboardState.selectedIncidentId && c.incident_id === dashboardState.selectedIncidentId ? 2 : 0))
            .attr("r", c => (dashboardState.selectedIncidentId && c.incident_id === dashboardState.selectedIncidentId ? 5 : 3));

        // Bring selected circles to front
        scatterSvg1.selectAll("circle")
            .filter(c => c.incident_id === dashboardState.selectedIncidentId)
            .raise();
        }
    });
}
  
      // Add click event to toggle between yearly and monthly views
      scatterSvg1.selectAll(".x-axis text").on("click.toggleView", function(event, d) {
        if (isYearlyView) {
            // Switch to monthly view
            selectedYear = d.getFullYear();
            console.log("selectedYear", selectedYear);
            console.log("Current Dashboard Statescats: d", dashboardState);
            // Update the global dashboard state
            updateCharts({ 
                year: null,
                state: dashboardState.selectedState,        // Preserve current state
                incidentId: dashboardState.selectedIncidentId,
                gender: dashboardState.selectedGender  // Preserve selected incident
            });
            console.log("Current Dashboard Statescats: 2", dashboardState);

    
            const yearData = filteredData.filter(item => item.date.getFullYear() === selectedYear);
            const xScaleMonth = d3.scaleTime()
                .domain([new Date(selectedYear, 0, 1), new Date(selectedYear, 11, 31)])
                .range([0, scatterWidth]);
            const xAxisMonth = d3.axisBottom(xScaleMonth)
                .ticks(d3.timeMonth.every(1))
                .tickFormat(d3.timeFormat("%b"));
    
            updateScatterPlot(yearData, xScaleMonth, xAxisMonth);
            xAxisLabel.text(`Incident Date ${selectedYear}`);
            isYearlyView = false;
        } else {
            // Switch back to yearly view
            updateCharts({ year: null });
            console.log("Locationhere");
            isYearlyView = true;
            updateScatterPlot(filteredData, xScale, xAxis);
            xAxisLabel.text("Incident Date");
        }
       // isYearlyView = true;
    });
  
      // Add click event to x-axis label to revert back to yearly view
      xAxisLabel.on("click.toggleView", function() {
          if (!isYearlyView) {
            console.log("Location");

              updateScatterPlot(filteredData, xScale, xAxis);
              console.log("year in xaxislabel", selectedYear);
              updateCharts({ year: null });
              selectedYear = null;
              console.log("year in xaxislabel", selectedYear);
              xAxisLabel.text("Incident Date");
              console.log("updated", dashboardState);
              console.log("selcted", selectedYear);

              isYearlyView = true;
              console.log("isYearlyView", isYearlyView);
          }
      });
  
      
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
                    0.1 : 0.3
            )
            .attr("r", d => 
                (selectedIncidentId && d.incidentId === selectedIncidentId) || 
                (selectedGender && d.gender === selectedGender) ? 5 : 3
            )
    }
      
  
      registerChart("scatterPlot", updateScatterPlot2);
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
  .catch(error => {
      console.error("Error loading or parsing CSV file:", error);
  });
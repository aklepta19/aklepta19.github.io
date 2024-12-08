// Function to sample data
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
    const filteredData = data.map(d => {
        const genderField = d.participant_gender 
            ? d.participant_gender.split("||").find(g => g.startsWith("0::")) 
            : null;
        const suspectGender = genderField ? genderField.split("::")[1] : null;
        
        // Ensure total_casualties is a number
        const casualties = d.total_casualties ? +d.total_casualties : 0;
        
        return {
            date: parseDate(d.date),
            rating: d.rating,
            state: d.state,
            incident_id: d.incident_id,
            gender: suspectGender,
            total_casualties: casualties,  // Add this field
            year: +d.year
        };
            
            return processed;
            
        }).filter(d => {
            const isValid = d.date && gradeOrder.includes(d.rating) && d.state && d.gender;
            return isValid;
        });

  
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
      const horizontalJitter = () => (Math.random() - 0.5) * 10; // Adjust jitter magnitude as needed

      // Create scatter plot
      scatterSvg2.selectAll("circle")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("class", "chart-element")
        .attr("cx", d => {
            const casualties = d.total_casualties;
            // Add safety check for NaN
            if (isNaN(casualties)) {
                console.log("NaN casualties for:", d);
                return 0;
            }
            return xScale(casualties >= 35 && casualties < 100 ? 100 : casualties) + horizontalJitter();
        })
        .attr("cy", d => yScale(d.rating) + verticalJitter())
        .attr("r", 3)
        .attr("fill", d => color(d.state))
        .attr("opacity", 0.1)
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
  
function updateNewScatter({ selectedState, selectedIncidentId, selectedYear, selectedGender }) {
    scatterSvg2.selectAll("circle")
        .transition()
        .duration(300)
        .attr("opacity", d => {
            const isMatchingState = !selectedState || d.state === selectedState;
            const isMatchingYear = !selectedYear || d.year === selectedYear;
            const isMatchingGender = !selectedGender || d.gender === selectedGender;

            // When no filters are active, show all points with base opacity
            if (!selectedState && !selectedYear && !selectedGender && !selectedIncidentId) {
                return 0.1;
            }

            // Selected incident gets full opacity
            if (selectedIncidentId && d.incident_id === selectedIncidentId) {
                return 1;
            }

            // If point doesn't match active filters, make it very faint but not invisible
            if (!isMatchingYear || !isMatchingGender || !isMatchingState) {
                return 0;
            }

            // Matching points get medium opacity
            return 0.3;
        })
        .attr("r", d => {
            // If there's a selected incident, it gets the largest radius
            if (selectedIncidentId && d.incident_id === selectedIncidentId) {
                return 6;
            }
            // If there's a gender filter and this point matches, make it larger
            if (selectedGender && d.gender === selectedGender) {
                return 4;
            }
            // Default size for other points
            return 3;
        })
        .attr("fill", d => {
            if (selectedState) {
                return d.state === selectedState ? color(d.state) : "grey";
            }
            return color(d.state);
        });
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
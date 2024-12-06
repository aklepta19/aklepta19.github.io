// Function to sample data
/*function sampleData(data, sampleSize) {
    const sampledData = [];
    const step = Math.floor(data.length / sampleSize);
    for (let i = 0; i < data.length; i += step) {
      sampledData.push(data[i]);
    }
    return sampledData;
  }*/

  
  // Set up SVG dimensions and margins for scatter plot
/**
 * Object representing the dimensions and margins for a scatter plot.
 * @typedef {Object} ScatterDimensions
 * @property {number} width - The width of the scatter plot.
 * @property {number} height - The height of the scatter plot.
 * @property {Object} margins - The margins around the scatter plot.
 * @property {number} margins.top - The top margin.
 * @property {number} margins.right - The right margin.
 * @property {number} margins.bottom - The bottom margin.
 * @property {number} margins.left - The left margin.
 */
  var scatterDimensions = {
    width: 900,
    height: 650,
    margins: { top: 100, right: 30, bottom: 100, left: 90 } // adjusted to account for increased jitter
  };
  
  var scatterWidth = scatterDimensions.width - scatterDimensions.margins.left - scatterDimensions.margins.right;
  var scatterHeight = scatterDimensions.height - scatterDimensions.margins.top - scatterDimensions.margins.bottom;
  




  // Create SVG container for scatter plot
/**
 * Creates an SVG element for the scatter plot with specified dimensions and margins.
 * The SVG is appended to the DOM element with the ID "scatter-plot1".
 * The SVG is positioned absolutely at the top-left corner of its container.
 * A group element (`<g>`) is appended to the SVG and translated according to the specified margins.
 *
 * @constant {Object} scatterSvg1 - The D3 selection of the SVG element for the scatter plot.
 * @param {Object} scatterDimensions - The dimensions and margins for the scatter plot.
 * @param {number} scatterDimensions.width - The width of the SVG element.
 * @param {number} scatterDimensions.height - The height of the SVG element.
 * @param {Object} scatterDimensions.margins - The margins for the scatter plot.
 * @param {number} scatterDimensions.margins.left - The left margin.
 * @param {number} scatterDimensions.margins.top - The top margin.
 */
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



  console.time("Data Loading");
   /**
     * Loads, filters, and transforms the input data to extract relevant fields.
     * CONTAINS SAMPLE DATA
     * @param {Array} data - The input data array where each element is an object containing various fields.
     * @returns {Array} - The filtered and transformed data array where each element is an object containing:
     *   - {Date} date - The parsed date of the incident.
     *   - {string} rating - The rating of the incident.
     *   - {string} state - The state where the incident occurred.
     *   - {string} incident_id - The unique identifier of the incident.
     *   - {string|null} gender - The gender of the participant zero (suspect), or null if not available.
     */
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
            incident_id: d.incident_id,
            gender: suspectGender // Assign only the suspect's gender
        };
        
    }).filter(d => d.date && gradeOrder.includes(d.rating) && d.state && d.gender); // Ensure valid data
      // Sample the data to reduce its size
      //const sampleSize = 10000; // Adjust the sample size as needed
      //const sampledData = sampleData(filteredData, sampleSize);
      console.timeEnd("Data Loading")



      // Define xScale for date (extending to include 2018)
    /**
     * Creates a time scale for the x-axis using D3.js.
     * CONTAINS SAMPLE DATA
     * @constant
     * @type {d3.ScaleTime}
     * @param {Array} domain - The input domain for the scale, defined by the minimum date in the data and a fixed date (January 1, 2018).
     * @param {Array} range - The output range for the scale, defined by the width of the scatter plot.
     */
    console.time("Scale Setup");
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
      console.timeEnd("Scale Setup");
  



      /**
     * Appends a text element to the scatterSvg1 SVG element to serve as the x-axis label.
     * 
     * The label is positioned at the center of the x-axis, slightly below the axis line.
     * It has a font size of 14px and is given the class "x-axis-label".
     * The text content of the label is "Incident Date".
     * 
     * @constant {d3.Selection} xAxisLabel - The D3 selection of the appended text element.
     * @property {number} x - The x-coordinate of the text element, set to half the width of the scatter plot.
     * @property {number} y - The y-coordinate of the text element, set to the height of the scatter plot plus 50 pixels.
     * @property {string} text-anchor - The anchor position of the text, set to "middle".
     * @property {string} font-size - The font size of the text, set to "14px".
     * @property {string} class - The class attribute of the text element, set to "x-axis-label".
     * @property {string} text - The text content of the label, set to "Incident Date".
     */
      console.time("Scale Setup");
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
      console.timeEnd("Scale Setup");


  
     /**
     * This code snippet creates and manages circles in a scatter plot using D3.js. 
     * It binds data to circle elements within scatterSvg1, 
     * setting attributes like position, radius, color, and opacity. 
     * Event handlers are added for tooltips and click interactions. 
     * Clicking a circle updates the global dashboardState
     * and re-renders the circles, highlighting 
     * the selected state and incident ID.
     * 
     * CONTAINS SAMPLE DATA
     * @constant
     * @constant {scatterSvg1} - The D3 selection of the SVG element for the scatter plot.
     * @constant {xScale} - The D3 time scale for the x-axis.
     * @constant {yScale} - The D3 point scale for the y-axis.
     * @constant {color} - The D3 ordinal scale for coloring circles by state.
     * @constant {dashboardState} - The global state object containing selected filters.
     * @constant {verticalJitter} - A function to add vertical jitter to circle positions.
     * @constant {showTooltip} - A function to display a tooltip on circle hover.
     * @constant {moveTooltip} - A function to move the tooltip with the mouse pointer.
     * @constant {hideTooltip} - A function to hide the tooltip on mouseout.
     * @constant {updateCharts} - A function to update all charts based on the global state.
     * @type {d3.Selection} - The D3 selection of the appended circle elements.
     * @param {Array} domain - The input domain for the scale, defined by the minimum date in the data and a fixed date (January 1, 2018).
     * @param {Array} Function - The output range for the scale, defined by the width of the scatter plot.
     * @param {Array} sampleData - The output range for the scale, defined by the height of the scatter plot.
     * @param {Array} filteredData - The output range for the scale, defined by the height of the scatter plot.
     */
     console.time("Circle Rendering");
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
                          ? 0.1
                          : 0.3
                  )
                  .attr("stroke", c => (clickedIncidentId && c.incident_id === clickedIncidentId ? "black" : "none"))
                  .attr("stroke-width", c => (clickedIncidentId && c.incident_id === clickedIncidentId ? 2 : 0))
                  .attr("r", c => (clickedIncidentId && c.incident_id === clickedIncidentId ? 5 : 3)); // Highlight selected
          });
          console.timeEnd("Circle Rendering");
  



    /**
     * Flag to track the current view
     * @variable {boolean} isYearlyView - Indicates whether the data visualization is in yearly view mode.
     *  @variable {number|null} selectedYear - Stores the currently selected year. Null if no year is selected.
     */
      let isYearlyView = true;
      let selectedYear = null;
  


    
      /** 
      * The updateScatterPlot function updates a scatter plot with new data 
      * by removing existing circles and adding new ones. 
      * It sets various attributes for the circles and handles events for tooltips and clicks. 
      * Clicking a circle updates the global state and re-renders the circles with updated styles.
      * 
      * @type {d3.Selection} - The D3 selection of the appended circle elements.
      * @type {Function} - The D3 time scale for the x-axis.
      * @param {Array} data - The new data array to bind to the circles.
      * @param {Array} xScale - The D3 time scale for the x-axis.
      * @param {Array} xAxis - The D3 axis function for the x-axis.
      * @constant {scatterSvg1} - The D3 selection of the SVG element for the scatter plot.
      * @constant {yScale} - The D3 point scale for the y-axis.
      * @constant {verticalJitter} - A function to add vertical jitter to circle positions.
      * @constant {dashboardState} - The global state object containing selected filters.
      * @constant {showTooltip} - A function to display a tooltip on circle hover.
      * @constant {moveTooltip} - A function to move the tooltip with the mouse pointer.
      * @constant {hideTooltip} - A function to hide the tooltip on mouseout.
      * @constant {updateCharts} - A function to update all charts based on the global state.
      * 
      */
      console.time("Circle Rendering");
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
              .attr("opacity", 0.3)
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
                      ? 0.1
                      : 0.3
              )
              .attr("stroke", c => (clickedIncidentId && c.incident_id === clickedIncidentId ? "black" : "none"))
              .attr("stroke-width", c => (clickedIncidentId && c.incident_id === clickedIncidentId ? 2 : 0))
              .attr("r", c => (clickedIncidentId && c.incident_id === clickedIncidentId ? 5 : 3)); // Highlight selected
      }
      
    );

          // Update the x-axis
          scatterSvg1.select(".x-axis").call(xAxis);
          console.timeEnd("Circle Rendering");
          // Reattach click event listeners to the x-axis labels
          /*scatterSvg1.selectAll(".x-axis text").on("click.toggleView", function(event, d) {
              if (isYearlyView) {
                  // Switch to monthly view
                  selectedYear = d.getFullYear();
                  console.log("selectedYear", selectedYear);
                  console.log("Current Dashboard Statescat: in first", dashboardState);
                  const yearData = filteredData.filter(item => item.date.getFullYear() === selectedYear);
                  const xScaleMonth = d3.scaleTime()
                      .domain([new Date(selectedYear, 0, 1), new Date(selectedYear, 11, 31)])
                      .range([0, scatterWidth]);
                  const xAxisMonth = d3.axisBottom(xScaleMonth)
                      .ticks(d3.timeMonth.every(1))
                      .tickFormat(d3.timeFormat("%b"));
  
                  updateScatterPlot(yearData, xScaleMonth, xAxisMonth);
                  updateCharts({ year: selectedYear });
                  console.log("Current Dashboard Statescat: in first", dashboardState);

                  xAxisLabel.text(`Incident Date ${selectedYear}`);
                  registerChart("scatterPlot", updateScatterPlot(sampledData, xScale, xAxis));
                  isYearlyView = false;
                  //console.log("isYearlyView", isYearlyView);
                  //updateCharts({ year: selectedYear });
                  //updateCharts({ selectedYear: clickedState, incidentId: clickedIncidentId });


              } else {
                  // Switch back to yearly view
                  console.log("isYearlyView", isYearlyView);
                  registerChart("scatterPlot", updateScatterPlot(sampledData, xScale, xAxis));

                  xAxisLabel.text("Incident Date");
              }
              isYearlyView = true;
          });*/
          console.time("Circle Rendering");
          // Add click event to toggle between yearly and monthly views
      scatterSvg1.selectAll(".x-axis text").on("click.toggleView", function(event, d) {
        if (isYearlyView) {
            // Switch to monthly view
            selectedYear = d.getFullYear();
            //console.log("selectedYear", selectedYear);
            //console.log("Current Dashboard Statescats: d", dashboardState);
            // Update the global dashboard state
            updateCharts({ year: selectedYear });
            //console.log("Current Dashboard Statescats: 2", dashboardState);

    
            const yearData = filteredData.filter(item => item.date.getFullYear() === selectedYear); //filtered
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
            //console.log("Locationhere");
            isYearlyView = true;
            updateScatterPlot(filteredData, xScale, xAxis); //filtered data
            xAxisLabel.text("Incident Date");
        }
       // isYearlyView = true;
    });
      }
      console.timeEnd("Circle Rendering");
      // Add click event to toggle between yearly and monthly views
      console.time("Circle Rendering");
      scatterSvg1.selectAll(".x-axis text").on("click.toggleView", function(event, d) {
        if (isYearlyView) {
            // Switch to monthly view
            selectedYear = d.getFullYear();
            //console.log("selectedYear", selectedYear);
            //console.log("Current Dashboard Statescats: d", dashboardState);
            // Update the global dashboard state
            updateCharts({ year: selectedYear });
            //console.log("Current Dashboard Statescats: 2", dashboardState);

    
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
            //console.log("Locationhere");
            isYearlyView = true;
            updateScatterPlot(filteredData, xScale, xAxis);
            xAxisLabel.text("Incident Date");
        }
       // isYearlyView = true;
    });
    console.timeEnd("Circle Rendering");
      // Add click event to x-axis label to revert back to yearly view
      xAxisLabel.on("click.toggleView", function() {
          if (!isYearlyView) {
            //console.log("Location");

              updateScatterPlot(filteredData, xScale, xAxis);
              //console.log("year in xaxislabel", selectedYear);
              updateCharts({ year: null });
              selectedYear = null;
              //console.log("year in xaxislabel", selectedYear);
              xAxisLabel.text("Incident Date");
              //console.log("updated", dashboardState);
              //console.log("selcted", selectedYear);

              isYearlyView = true;
              //console.log("isYearlyView", isYearlyView);
          }
      });
  
      console.time("Circle Rendering");
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
            );
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
    console.timeEnd("Circle Rendering");
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
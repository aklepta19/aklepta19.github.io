// Set up SVG dimensions and margins
var dimensions = {
    width: 900,
    height: 300,
    margins: { top: 40, right: 40, bottom: 50, left: 60 }
};

var width = dimensions.width - dimensions.margins.left - dimensions.margins.right;
var height = dimensions.height - dimensions.margins.top - dimensions.margins.bottom;

var svg = d3.select("#histogram")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height)
    .append("g")
    .attr("transform", "translate(" + dimensions.margins.left + "," + dimensions.margins.top + ")");

d3.csv("gun_data_with_rating.csv").then(function(data) {
    // Parse numeric columns and handle missing values
    data.forEach(d => {
        d.total_casualties = +d.total_casualties || 0;
        d.state = d.state || "Unknown";
        d.incident_id = d.incident_id || null;
        //d.date = parseDate(d.date)
        //d.year = +d.year || null;
         // If there's a date column, parse it and extract the year
        if (d.date) {
            const parsedDate = new Date(d.date);
            d.year = isNaN(parsedDate) ? null : parsedDate.getFullYear();
        } else {
            // Otherwise, ensure year is parsed as a number
            d.year = +d.year || null;
        }
    });

    //let selectedState = null;

        // Aggregate data by state and year
    const stateData = Array.from(
        d3.rollup(
            data,
            v => ({
                casualties: d3.sum(v, d => d.total_casualties), // Sum casualties for the state and year
                incidents: v.map(d => d.incident_id) // Collect all incident IDs
            }),
            d => `${d.state}-${d.year}` // Combine state and year for unique grouping
        ),
        ([key, { casualties, incidents }]) => {
            const [state, year] = key.split("-"); // Split the combined key back into state and year
            return {
                state,
                year: +year, // Parse year back to a number
                casualties,
                incidents
            };
        }
    ).sort((a, b) => d3.descending(a.casualties, b.casualties));
    // Aggregate data by state if no year is selected
    const aggregatedData = Array.from(
              d3.rollup(
                  stateData, // Aggregate all years if no year is selected
                  v => d3.sum(v, d => d.casualties),
                  d => d.state
              ),
              ([state, casualties]) => ({
                  state,
                  year: "All Years", // Represent aggregated data
                  casualties
              })
          );

    //console.log("State Data by State and Year:", stateData);
    //console.log("State Data by State and Year2:", aggregatedData);

    
    // Set up scales domains
    

    // Set up scales
    var x = d3.scaleBand()
        .domain(aggregatedData.map(d => d.state))
        .range([0, width])
        .padding(0.1);

    var y = d3.scaleLinear()
        .domain([0, d3.max(aggregatedData, d => d.casualties)/1000])
        .range([height, 0]);
        

    // X-axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        //.attr("transform", "rotate(-0)")
        .style("text-anchor", "middle");

    // X-axis label
    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("transform", `translate(${width / 2}, ${height + 50})`)
        .style("text-anchor", "middle")
        .style("font-size", "14px") // Adjust font size here
        .text("State");

    // Y-axisd
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));

    // Y-axis label
    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -60)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px") // Adjust font size here
        .text("Total Casualties (Thousands)");

    
    // Draw bars
    svg.selectAll("rect")
        .data(aggregatedData)
        .enter().append("rect")
        .attr("x", d => x(d.state))
        .attr("y", d => y(d.casualties / 1000))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.casualties / 1000))
        .attr("fill", d => color(d.state))
        .on("mouseover", showTooltip) // Show tooltip on hover
        .on("mousemove", moveTooltip) // Move tooltip with the pointer
        .on("mouseout", hideTooltip) // Hide tooltip on mouseout
        .on("click", function(event, d) {
            const clickedState = dashboardState.selectedState === d.state ? null : d.state; // Toggle stat
            updateCharts({ state: clickedState});
            //console.log("Current Dashboard State:", dashboardState);
        });
        function updateHistogram({ selectedState, selectedYear, selectedIncidentId }) {
            console.log("Selected State:", selectedState, "Selected Year:", selectedYear);
            console.log("Current Dashboard State:", dashboardState);
            console.log("State Data:", selectedIncidentId);
            
            // Filter or aggregate data based on the selected year
            const aggregatedData = selectedYear
                ? stateData.filter(d => d.year === selectedYear) // Filter by selected year
                : Array.from(
                      d3.rollup(
                          stateData, // Sum casualties across all years if no year is selected
                          v => d3.sum(v, d => d.casualties),
                          d => d.state
                      ),
                      ([state, casualties]) => ({
                          state,
                          year: "All Years", // Represent aggregated data
                          casualties
                      })
                  );
            
            // Adjust bar appearance based on the selected state
            const filteredData = aggregatedData.map(d => ({
                ...d,
                isHighlighted: selectedState === null || d.state === selectedState, // Highlight selected state
            }));
            
        
            console.log("Filtered Data (with Highlighting):", filteredData);
        
            // Recalculate the y-scale domain using all data
            const maxCasualties = d3.max(filteredData, d => d.casualties) || 0;
            y.domain([0, maxCasualties / 1000]);
        
            //console.log("Updated Y-Domain:", y.domain());
        
            // Bind the data to the bars
            const bars = svg.selectAll("rect").data(filteredData, d => d.state);
        
            // Enter and update bars
            bars.enter()
                .append("rect")
                .merge(bars)
                .transition()
                .duration(300)
                .attr("x", d => x(d.state))
                .attr("y", d => y(d.casualties / 1000))
                .attr("width", x.bandwidth())
                .attr("height", d => height - y(d.casualties / 1000))
                .attr("fill", d =>
                    d.isHighlighted ? color(d.state) : "grey" // Highlight or grey out states
                )
                .attr("opacity", d => (d.isHighlighted ? 1 : 0.3)); // Lower opacity for non-highlighted states
        
            // Remove bars that are no longer in the data
            bars.exit()
                .transition()
                .duration(300)
                .attr("height", 0)
                .remove();
        
            // Update y-axis
            svg.select(".y-axis")
                .transition()
                .duration(300)
                .call(d3.axisLeft(y));
        }
        
        
        
        
    
    registerChart("histogram", updateHistogram);
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
                <strong>Casualties:</string> ${d.casualties}
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
});
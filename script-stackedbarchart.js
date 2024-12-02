d3.csv("suspect_file.csv").then(function(dataset) {
    var dimensions = {
        width: 900,
        height: 350,
        margins: {
            top: 20,
            right: 50,
            bottom: 50,
            left: 300 // Adjust left margin to fit labels
        }
    };

    var svg = d3.select("#stackedbarchart")
                .attr("width", dimensions.width)
                .attr("height", dimensions.height)
                .append("g")
                .attr("transform", "translate(" + dimensions.margins.left + "," + dimensions.margins.top + ")");

    // Fixed categories for gender (or any other variable)
    const categories = ["Male", "Female", "Other", "Unknown"];

    // Aggregate the data based on the fixed categories
    const aggregatedData = categories.map(category => {
        const totalCasualties = dataset
            .filter(d => d.participant_gender && d.participant_gender.toLowerCase() === category.toLowerCase())
            .reduce((sum, d) => sum + (+d.total_casualties || 0), 0);
        return {
            gender: category,
            total_casualties: totalCasualties
        };
    });

    // Set up scales
    var xScale = d3.scaleBand()
                    .domain(categories) // Fixed categories
                    .range([0, dimensions.width - dimensions.margins.left - dimensions.margins.right]) // Spread out the available width
                    .padding(0.1);  // Adjust padding for better spacing

    // Set the correct width for each bar
    const barWidth = xScale.bandwidth();

    var yScale = d3.scaleLinear()
                    .domain([0, d3.max(aggregatedData, d => d.total_casualties)]) // Use total_casualties here
                    .range([dimensions.height - dimensions.margins.top - dimensions.margins.bottom, 0]);

    // Draw initial bars
    svg.selectAll("rect")
        .data(aggregatedData)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.gender)) // Position bars according to the fixed categories
        .attr("y", d => yScale(d.total_casualties)) // Height of bars based on casualties
        .attr("height", d => (dimensions.height - dimensions.margins.top - dimensions.margins.bottom) - yScale(d.total_casualties)) // Bar height
        .attr("width", barWidth) // Set the width using bandwidth (adjusted for better spacing)
        .attr("fill", "green")
        .on("click", function (event, d) {
            const clickedGender = dashboardState.selectedGender === d.gender ? null : d.gender; // Toggle gender
            updateCharts({ 
                state: null, 
                incidentId: null, 
                gender: clickedGender 
            });
        });

    // Add x-axis
    svg.append("g")
        .attr("transform", `translate(0,${dimensions.height - dimensions.margins.top - dimensions.margins.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "middle");

    // Add x-axis label
    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("transform", `translate(${(dimensions.width - dimensions.margins.left - dimensions.margins.right) / 2}, ${dimensions.height - dimensions.margins.bottom + 20})`)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Gender of Suspect(s)");

    // Add y-axis
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale));

    // Add y-axis label
    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -dimensions.margins.left + 200)
        .attr("x", -(dimensions.height - dimensions.margins.top - dimensions.margins.bottom) / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Total Casualties");

    // Update function to dynamically adjust bars
    function updateStacked({ selectedGender, selectedState, selectedIncidentId }) {
        // Recompute totals by gender
        const filteredData = dataset.filter(d => {
            return (
                (!selectedState || d.state === selectedState) &&
                (!selectedIncidentId || d.incident_id === selectedIncidentId)
            );
        });

        const aggregatedData = categories.map(category => {
            const totalCasualties = filteredData
                .filter(d => d.participant_gender && d.participant_gender.toLowerCase() === category.toLowerCase())
                .reduce((sum, d) => sum + (+d.total_casualties || 0), 0);
            return {
                gender: category,
                total_casualties: totalCasualties
            };
        });

        // Update yScale domain to reflect the new data
        yScale.domain([0, d3.max(aggregatedData, d => d.total_casualties)]);

        // Update bars
        svg.selectAll("rect")
            .data(aggregatedData)
            .join(
                enter => enter.append("rect"), // Handle new bars
                update => update, // Handle updated bars
                exit => exit.remove() // Remove bars that no longer exist
            )
            .transition()
            .duration(300)
            .attr("x", d => xScale(d.gender)) // Correctly position each bar according to gender
            .attr("y", d => yScale(d.total_casualties))
            .attr("height", d => (dimensions.height - dimensions.margins.top - dimensions.margins.bottom) - yScale(d.total_casualties))
            .attr("width", barWidth) // Use the bandwidth for width
            .attr("fill", d =>
                (selectedGender && d.gender !== selectedGender) ? "grey" : "blue"
            )
            .attr("opacity", d =>
                (selectedGender && d.gender !== selectedGender) ? 0.3 : 1
            );

        // Update the y-axis
        svg.select(".y-axis").transition().duration(300).call(d3.axisLeft(yScale));
    }

    // Register the chart for updates
    registerChart("stackedBarChart", updateStacked);
});

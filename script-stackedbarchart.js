d3.csv("suspect_file.csv").then(function(dataset) {
    var dimensions = {
        width: 900,
        height: 350,
        margins: {
            top: 20,
            right: 50,
            bottom: 50,
            left: 290
        }
    };
    
    var svg = d3.select("#stackedbarchart")
                .attr("width", dimensions.width)
                .attr("height", dimensions.height)
                .append("g")
                .attr("transform", "translate(" + dimensions.margins.left + "," + dimensions.margins.top + ")");
    
    // Replace empty or missing `participant_gender` values with "Unknown"
    dataset.forEach(d => {
        if (!d.participant_gender || d.participant_gender.trim() === "") {
            d.participant_gender = "Unknown";
        }
    });

    // Aggregate total incidents by gender
    const genderTotals = d3.rollups(
        dataset,
        v => d3.sum(v, d => +d["total_casualties"] || 0),
        d => d.participant_gender
    );

    // Convert to an array of objects for D3
    const formattedData = genderTotals.map(([gender, total]) => ({ gender, total }));

    // Set up scales
    var xScale = d3.scaleBand()
                    .domain(formattedData.map(d => d.gender))
                    .range([0, dimensions.width - dimensions.margins.left - dimensions.margins.right])
                    .padding(0.2);
    
    var yScale = d3.scaleLinear()
                    .domain([0, d3.max(formattedData, d => d.total)])
                    .range([dimensions.height - dimensions.margins.top - dimensions.margins.bottom, 0]);

    // Draw bars
    svg.selectAll("rect")
        .data(formattedData)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.gender))
        .attr("y", d => yScale(d.total))
        .attr("height", d => (dimensions.height - dimensions.margins.top - dimensions.margins.bottom) - yScale(d.total))
        .attr("width", xScale.bandwidth())
        .attr("fill", "#69b3a2");

    // Add x-axis
    svg.append("g")
        .attr("transform", `translate(0,${dimensions.height - dimensions.margins.top - dimensions.margins.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        //.attr("transform", "rotate(-0)")
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
        .text("Total Casualties (Thousands)");
});

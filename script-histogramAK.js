d3.csv("Gun_violence_SE_clean1.csv")
    .then(function(dataset) {
        console.log(dataset);

        // Define dimensions for the SVG container
        var dimensions = {
            width: 1700,
            height: 800,
            margins: {
                top: 10,
                bottom: 120,
                right: 20,
                left: 100
            }
        };

        // Select the #histogram container and append the SVG element
        var svg = d3.select("#histogram")
                    .append("svg")
                    .attr("width", dimensions.width)
                    .attr("height", dimensions.height);

        // Define columns for state, year, quarter, and incident count
        const stateColumn = "state"; // Adjust based on the actual column name
        const yearColumn = "year";
        const quarterColumn = "quarter";
        const incidentColumn = "incident_count"; // Change based on actual data

        // Aggregate data by state, year, and quarter
        const aggregatedData = d3.rollups(
            dataset,
            v => d3.sum(v, d => +d[incidentColumn]),
            d => d[stateColumn],
            d => d[yearColumn],
            d => d[quarterColumn]
        );

        // Flatten the aggregated data for easy access
        const flattenedData = [];
        aggregatedData.forEach(([state, yearData]) => {
            yearData.forEach(([year, quarterData]) => {
                quarterData.forEach(([quarter, incidents]) => {
                    flattenedData.push({
                        state: state,
                        year: year,
                        quarter: quarter,
                        incidents: incidents
                    });
                });
            });
        });

        // Set up scales
        var x0 = d3.scaleBand()
            .domain(flattenedData.map(d => d.state))
            .range([dimensions.margins.left, dimensions.width - dimensions.margins.right])
            .padding(0.2);

        var x1 = d3.scaleBand()
            .domain(flattenedData.map(d => `${d.year} Q${d.quarter}`))
            .range([0, x0.bandwidth()])
            .padding(0.1);

        var yScale = d3.scaleLinear()
            .domain([0, d3.max(flattenedData, d => d.incidents)])
            .range([dimensions.height - dimensions.margins.bottom, dimensions.margins.top]);

        // Create bars
        var bars = svg.selectAll(".bar")
            .data(flattenedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x0(d.state) + x1(`${d.year} Q${d.quarter}`))
            .attr("y", d => yScale(d.incidents))
            .attr("width", x1.bandwidth())
            .attr("height", d => dimensions.height - dimensions.margins.bottom - yScale(d.incidents))
            .style("fill", "steelblue");

        // Create x-axis for states
        var xAxisGen = d3.axisBottom().scale(x0);
        svg.append("g")
            .call(xAxisGen)
            .attr("transform", `translate(0, ${dimensions.height - dimensions.margins.bottom})`)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-0.8em")
            .attr("transform", "rotate(-65)");

        // Create y-axis for incident counts
        var yAxisGen = d3.axisLeft().scale(yScale);
        svg.append("g")
            .call(yAxisGen)
            .attr("transform", `translate(${dimensions.margins.left}, 0)`);

        // X-axis label
        svg.append('text')
            .attr('class', 'x-label')
            .attr('x', dimensions.width / 2)
            .attr('y', dimensions.height - dimensions.margins.bottom + 70)
            .attr('text-anchor', 'middle')
            .text('States');

        // Y-axis label
        svg.append('text')
            .attr('class', 'y-label')
            .attr('transform', 'rotate(-90)')
            .attr('y', dimensions.margins.left - 70)
            .attr('x', -(dimensions.height / 2))
            .attr('text-anchor', 'middle')
            .text('Number of Incidents');

    }
);
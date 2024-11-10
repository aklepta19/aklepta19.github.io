d3.csv("suspect_file.csv")
    .then(function(dataset) {
        console.log(dataset);

        var dimensions = {
            width: 850,
            height: 450,
            margins: { 
                top: 20, 
                right: 70,  // Increased right margin to make space for the legend
                bottom: 100, 
                left: 100
            }
        };
        
        var svg = d3.select("#stackedbarchart")
                    .attr("width", dimensions.width + dimensions.margins.right)  // Extend width for the legend space
                    .attr("height", dimensions.height)
                    .style("position", "absolute")  // Set position to absolute
                    .style("bottom", "0px")         // Position it at the bottom
                    .style("right", "0px")          // Position it at the right
                    .append("g")
                    .attr("transform", "translate(" + dimensions.margins.left + "," + dimensions.margins.top + ")");

        // Replace empty or missing `participant_gender` values with "Unknown"
        dataset.forEach(d => {
            if (!d.participant_gender || d.participant_gender.trim() === "") {
                d.participant_gender = "Unknown";
            }
            if (!d.participant_age_group || d.participant_age_group.trim() === "") {
                d.participant_age_group = "Unknown";
            }
        });

        // Aggregate total casualties by both gender and age group
        const genderAgeTotals = d3.rollups(dataset, 
                                           v => d3.sum(v, d => +d["total_casualties"] || 0), 
                                           d => d.participant_gender, 
                                           d => d.participant_age_group);

        // Format the aggregated data for D3 stacking
        const formattedData = genderAgeTotals.map(([participant_gender, ageGroups]) => {
            const result = { participant_gender };
            ageGroups.forEach(([participant_age_group, total_casualties]) => {
                result[participant_age_group] = total_casualties;
            });
            return result;
        });

        // Get the unique age groups as stacking keys
        const keys = Array.from(new Set(dataset.map(d => d.participant_age_group)));

        // Set up scales
        var xScale = d3.scaleBand()
                        .domain(formattedData.map(d => d.participant_gender))
                        .range([0, dimensions.width - dimensions.margins.left - dimensions.margins.right])
                        .padding([0.2]);
        
        var maxCount = d3.max(formattedData, d => 
            d3.sum(keys, key => d[key] || 0)
        );

        var yScale = d3.scaleLinear()
                       .domain([0, maxCount])
                       .range([dimensions.height - dimensions.margins.top - dimensions.margins.bottom, 0]);

        var colorScale = d3.scaleOrdinal()
                           .domain(keys)
                           .range(d3.schemeCategory10);

        // Stack the data by age group
        var stackedData = d3.stack()
                            .keys(keys)
                            (formattedData);

        // Draw the stacked bars
        svg.append("g")
           .selectAll("g")
           .data(stackedData)
           .enter()
           .append("g")
           .attr("fill", d => colorScale(d.key))
           .selectAll("rect")
           .data(d => d)
           .enter()
           .append("rect")
           .attr("x", d => xScale(d.data.participant_gender))
           .attr("y", d => yScale(d[1]))
           .attr("height", d => yScale(d[0]) - yScale(d[1]))
           .attr("width", xScale.bandwidth());

        // Add x-axis
        svg.append("g")
           .attr("transform", `translate(0,${dimensions.height - dimensions.margins.bottom})`)
           .call(d3.axisBottom(xScale))
           .selectAll("text")
           .attr("transform", "rotate(-45)")
           .style("text-anchor", "end");

        // Add y-axis
        svg.append("g")
           .call(d3.axisLeft(yScale));

        // Add a legend
        var legend = svg.append("g")
                        .attr("transform", `translate(${dimensions.width - 400}, 0)`);  // Position legend to the right of the chart

        legend.selectAll("rect")
              .data(keys)
              .enter()
              .append("rect")
              .attr("x", 0)
              .attr("y", (d, i) => i * 20)
              .attr("width", 18)
              .attr("height", 18)
              .attr("fill", d => colorScale(d));

        legend.selectAll("text")
              .data(keys)
              .enter()
              .append("text")
              .attr("x", 24)
              .attr("y", (d, i) => i * 20 + 9)
              .attr("dy", "0.35em")
              .text(d => d);
    });

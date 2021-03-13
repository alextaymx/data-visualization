!(function (d3) {
    $("#chart-area5").empty();

    Promise.all(spotify_raw).then(line_chart)


    d3.select('#line-graph-title')
        .text('Music Characteristic Timeline');


    function line_chart([data]) {

        // Initalize 
        let parentDiv = document.getElementById("chart-area5");
        let width = parentDiv.clientWidth;
        let height = parentDiv.clientHeight;
        var padding = 30;
        // let margin = { top: 15, right: 35, bottom: 15, left: 35 };

        console.log("Line chart size", width, height);
        setTimeout(() => {
            console.log("in timeout");
            if (width === 0 || height === 0) {
                console.log("clicked");
                document.getElementById("nav-tab-3").click();
            }
        }, 100);


        function pre_process_data(data) {

            let yearly_data = []
            let current_year = data[0].year;
            let song_data = {
                'acousticness': [],
                'danceability': [],
                'energy': [],
                'valence': [],
                'liveness': [],

            };

            function getAvg(column) {
                const total = column.reduce((a, b) => a + b, 0);
                return total / column.length;
            }

            data.forEach(function (d, i) {
                if (current_year < d.year) {       // new year, then add data and re-init 

                    yearly_data.push({                 // save data
                        'year': current_year,
                        'acousticness': getAvg(song_data.acousticness),
                        'danceability': getAvg(song_data.danceability),
                        'energy': getAvg(song_data.energy),
                        'valence': getAvg(song_data.valence),
                        'liveness': getAvg(song_data.liveness)
                    })

                    current_year = d.year               //process new data 
                    song_data = {                       //re-init
                        'acousticness': [],
                        'danceability': [],
                        'energy': [],
                        'valence': [],
                        'liveness': [],
                    };
                }
                //add all song data on 1 year
                song_data.acousticness.push(+d.acousticness)
                song_data.danceability.push(+d.danceability)
                song_data.energy.push(+d.energy)
                song_data.valence.push(+d.valence)
                song_data.liveness.push(+d.liveness)
            })

            yearly_data.push({                 // save last year data
                'year': current_year,
                'acousticness': getAvg(song_data.acousticness),
                'danceability': getAvg(song_data.danceability),
                'energy': getAvg(song_data.energy),
                'valence': getAvg(song_data.valence),
                'liveness': getAvg(song_data.liveness)
            })

            // console.log(yearly_data)
            return yearly_data
        }
        data = pre_process_data(data)

        // Clear any graph before
        d3.selectAll("#chart-area5 > *").remove();

        //Initiate the radar chart SVG
        let svg = d3.select('#chart-area5')
            .append("svg")
            .attr("class", "line_graph")
            .attr("viewBox", "0 0 " + width + " " + height);

        // SET X-AXIS
        var x_axis = d3.scaleLinear()
            .rangeRound([padding, width - padding * 2])
            .domain(d3.extent(data, d => d.year));

        // SET Y-AXIS
        var y_axis = d3.scaleLinear()
            .rangeRound([height - padding, padding])
            .domain([0, 1]).nice();

        // color
        var color = d3.scaleOrdinal(d3.schemeCategory10);

        // Line draw
        var line = d3.line()
            // .curve(d3.curveCardinal)
            .x(d => x_axis(d.year))
            .y(d => y_axis(d.value));

        // Axis draw
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + (height - padding) + ")")
            .call(d3.axisBottom(x_axis).tickFormat(d3.format("d")));

        // Axis draw
        svg.append("g")
            .attr("class", "y-axis")
            .attr("transform", "translate(" + padding + ",0)")
            .call(d3.axisLeft(y_axis).tickSize(-width + padding * 2));

        // for interaction 
        var focus = svg.append("g")
            .attr("class", "focus")
            .style("display", "none");

        focus.append("line").attr("class", "lineHover")
            .style("stroke", "#999")
            // .attr("stroke-width", 1)
            .style("shape-rendering", "crispEdges")
            .style("opacity", 0.5)
            .attr("y1", -height)
            .attr("y2", 0);

        focus.append("text").attr("class", "lineHoverDate")
            .attr("text-anchor", "middle")
            .attr("font-size", 12);

        // Location for interaction
        var overlay = svg.append("rect")
            .attr("class", "myoverlay")
            .attr("x", padding)
            .attr("width", width)
            .attr("height", height)
            .style('fill', 'none')
            .attr('pointer-events', 'all');

        d3.selectAll('.line')
            .style('fill', 'none')
            // .attr('stroke-width', 3)
            .style('opacity', .75);

        //X-axis label
        svg
            .append("text")
            .attr("transform", `translate(${width / 2},${height})`)
            .style("text-anchor", "middle")
            .text("Year");

        //X-axis label
        svg
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 11)
            .attr("x", -height / 2)
            // .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Score");

        // y-axis styles 
        d3.selectAll('.y-axis line')
            .style('opacity', 0.2);

        d3.selectAll('.y-axis path')
            .style('display', 'none');


        var all_aspects_names = ['acousticness', 'danceability', 'energy', 'valence', 'liveness']

        var all_aspects = [
            {
                'song_aspect': 'acousticness',
                'detail': data.map(function (d) {
                    return {
                        'year': d.year,
                        'value': d.acousticness
                    }
                })
            },
            {
                'song_aspect': 'danceability',
                'detail': data.map(function (d) {
                    return {
                        'year': d.year,
                        'value': d.danceability
                    }
                })
            },
            {
                'song_aspect': 'energy',
                'detail': data.map(function (d) {
                    return {
                        'year': d.year,
                        'value': d.energy
                    }
                })
            },
            {
                'song_aspect': 'valence',
                'detail': data.map(function (d) {
                    return {
                        'year': d.year,
                        'value': d.valence
                    }
                })
            },
            {
                'song_aspect': 'liveness',
                'detail': data.map(function (d) {
                    return {
                        'year': d.year,
                        'value': d.liveness
                    }
                })
            }
        ]


        d3.select('#play-line-animation')
            .on('click', function () {
                console.log('hi')
                update(0)
            })


        let default_speed = 5000;

        d3.selectAll(("input[name='line-radio']")).on("change", function () {
            console.log('this => ', this.value, typeof (this.value))
            if (this.value === 'slow') {
                default_speed = 25000;
            }
            else if (this.value === 'medium') {
                default_speed = 10000;
            }
            else if (this.value === 'fast') {
                default_speed = 5000;
            }
            console.log('On change:', default_speed)
        });

        // update(d3.select('#selectbox').property('value'), 0);
        update(0);



        function update(speed) {

            var aspects = svg.selectAll(".line_aspects")
                .data(all_aspects);

            aspects.exit().remove();

            let path = aspects.enter()
                .insert("g", ".focus")
                .append("path")
                .attr("class", "line_aspects")
                .style("stroke", (d, i) => color(i))
                .style('fill', 'none')
                .attr('stroke-width', 2)
                .attr("d", d => { return line(d.detail) })
                .merge(aspects);

            path._groups[0].forEach(function (d, i) {
                // console.log(d, d.getTotalLensgth())
                d3.select(d)
                    .attr("stroke-dasharray", d.getTotalLength() + " " + d.getTotalLength())
                    .attr("stroke-dashoffset", d.getTotalLength())
                    .transition() // Call Transition Method
                    .duration(default_speed) // Set Duration timing (ms)
                    .delay(500)
                    .ease(d3.easeLinear) // Set Easing option
                    .attr("stroke-dashoffset", 0); // Set final value of dash-offset for transition
            })

            tooltip(all_aspects_names);


            function tooltip(aspects_names) {

                var labels = focus.selectAll(".lineHoverText")
                    .data(aspects_names);

                labels.enter().append("text")
                    .attr("class", "lineHoverText")
                    .style("fill", (d, i) => color(i))
                    .attr("text-anchor", "start")
                    .attr("font-size", 12)
                    .attr("dy", (_, i) => 1 + i * 2 + "em")
                    .merge(labels);

                var circles = focus.selectAll(".hoverCircle")
                    .data(aspects_names)

                circles.enter().append("circle")
                    .attr("class", "hoverCircle")
                    .style("fill", (d, i) => color(i))
                    .attr("r", 2.5)
                    .style('opacity', 0.75)
                    .merge(circles);

                svg.selectAll(".myoverlay")
                    .on("mouseover", function () { focus.style("display", null); })
                    .on("mouseout", function () { focus.style("display", "none"); })
                    .on("mousemove", mousemove);

                function mousemove() {
                    let formatValue = d3.format(".2f")
                    var x0 = Math.floor(x_axis.invert(d3.mouse(this)[0]));

                    let target;
                    data.forEach(function (d) {
                        if (d.year == x0) {
                            target = d
                        }
                    })

                    focus.select(".lineHover")
                        .attr("transform", "translate(" + x_axis(target.year) + "," + height + ")");

                    focus.select(".lineHoverDate")
                        .attr("transform",
                            "translate(" + x_axis(target.year) + "," + (height + padding) + ")")
                        .text(target.year);

                    focus.selectAll(".hoverCircle")
                        .attr("cy", e => y_axis(target[e]))
                        .attr("cx", x_axis(target.year));

                    focus.selectAll(".lineHoverText")
                        .attr("transform",
                            "translate(" + (x_axis(target.year)) + "," + height / 8 + ")")
                        .text(e => e + " = " + formatValue(target[e]))

                }
                var selectbox = d3.select("#selectbox")
                    .on("change", function () {
                        update(this.value, 750);
                    })
            }
        }

    }

})(d3)
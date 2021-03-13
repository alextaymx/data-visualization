!(function (d3) {
    $("#chart-area3").empty();

    Promise.all(spotify_raw).then(radar_chart)

    // Initalize 
    let parentDiv = document.getElementById("chart-area3");
    let width = parentDiv.clientWidth;
    let height = parentDiv.clientHeight;
    var padding = 30;
    let year_upper = 2020;
    let year_lower = 2015;

    console.log("Radar chart size", width, height);
    setTimeout(() => {
        // console.log("in timeout");
        if (width === 0 || height === 0) {
            // console.log("clicked");
            document.getElementById("nav-tab-2").click();
        }
    }, 100);

    // SLIDER
    // Clear any graph before
    d3.selectAll("#slider-range > *").remove();

    var sliderRange = d3
        .sliderBottom()
        .min(1921)
        .max(2020)
        .width(width - 40)
        .tickFormat(d3.format('d'))
        .ticks(10)
        .default([2015, 2020])
        .fill('#2196f3')
        .on('onchange', val => {
            year_upper = round(val[1]);
            year_lower = max(round(val[0]),year_upper-10);
            d3.select('p#radar-chart-title').text('Popular Songs Aspects in ' + year_lower + ' to ' + year_upper );
        })
        .on('end', function(){
            Promise.all(spotify_raw).then(radar_chart);
        });

    var gRange = d3
        .select('div#slider-range')
        .append('svg')
        .attr('width', width)
        .attr('height', 70)
        .append('g')
        .attr('transform', 'translate(10,10)');

    gRange.call(sliderRange);

    d3.select('p#radar-chart-title').text(
        'Popular Songs Aspects in ' + year_lower + ' to ' + year_upper 
    );

    d3.select('div.col-sm2').attr('width', width);

    function radar_chart([data]) {

        // Prepare data
        function prepare(data) {
            // console.log(data)
            let output = []
            // year_lower = 1921;
            // year_upper = 2020;

            popularity_lower = 0;
            popularity_upper = 100;

            data.forEach(function (d, idx) {
                if (d.popularity >= popularity_lower && d.popularity <= popularity_upper &&
                    d.year >= year_lower && d.year <= year_upper) {
                    output.push({
                        song_name: d.name,
                        song_artist: d.artists,
                        song_year: d.year,
                        song_popularity: d.popularity,
                        axes: [
                            { axis: 'danceability', value: d.danceability, id: idx },
                            { axis: 'energy', value: d.energy, id: idx },
                            { axis: 'words', value: d.speechiness, id: idx },
                            { axis: 'instrumental', value: d.instrumentalness, id: idx },
                            { axis: 'loudness', value: d.loudness, id: idx },
                            { axis: 'liveness', value: d.liveness, id: idx },
                            { axis: 'tempo', value: d.tempo, id: idx },
                            { axis: 'valence', value: d.valence, id: idx },
                        ]
                    });
                }
            })
            return output
        }
        data = prepare(data);

        // Sort by year and popularity 
        data.sort(function (a, b) {
            return d3.ascending(a.song_year, b.song_year) || d3.descending(a.song_popularity, b.song_popularity)
        })

        // Get 10 data with different years
        info_per_year = max(1, Math.floor(10 / (year_upper - year_lower + 1)))
        let current_year = data[0].song_year, count = 0;
        data = data.filter(function (d, i) {
            if (current_year != d.song_year) {      // different year
                count = 0;
                current_year = d.song_year;
            }
            else {                                   //same year
                if (count < info_per_year) {
                    count += 1;
                    return d;
                }
            }
        })

        // handle multiple line of text
        const wrap = (text, width) => {
            text.each(function () {
                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.4, // ems
                    y = text.attr("y"),
                    x = text.attr("x"),
                    dy = parseFloat(text.attr("dy")),
                    tspan = text.text(null)
                        .append("tspan")
                        .attr("x", x).
                        attr("y", y)
                        .attr("dy", dy + "em");

                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                            .text(word);
                    }
                }
            });
        }

        // circle default configuration
        const cfg = {
            w: width,				//Width of the circle
            h: height,				//Height of the circle
            margin: { top: 20, right: 20, bottom: 20, left: 20 }, //The margins of the SVG
            levels: 3,				//How many levels or inner circles should there be drawn
            maxValue: 0, 			//What is the value that the biggest circle will represent
            labelFactor: 1.25, 	//How much farther than the radius of the outer circle should the labels be placed
            wrapWidth: 60, 		//The number of pixels after which a label needs to be given a new line
            opacityArea: 0.35, 	//The opacity of the area of the blob
            dotRadius: 4, 			//The size of the colored circles of each blog
            opacityCircles: 0.1, 	//The opacity of the circles of each blob
            strokeWidth: 2, 		//The width of the stroke around each blob
            roundStrokes: false,	//If true the area and stroke will follow a round path (cardinal-closed)
            color: d3.scaleOrdinal(d3.schemeCategory10),	//Color function,
            dot_color: d3.scaleOrdinal(d3.schemeCategory10),
            format: '.2f',
            unit: '',
            legend: { title: '', translateX: 0, translateY: 0 }
        };

        // Get the max value for the circle (normalized + for calcu)
        let maxValue = 1;

        //prepare Min Max dictionary for min-max norm
        function get_max(column_idx) {
            feature_max = 0;
            feature_max = max(feature_max, d3.max(data, function (d) { return abs(d.axes[column_idx].value) }))
            if (feature_max >= 1) {
                data.value = 1;
            }
            return abs(feature_max);
        }
        function get_min(column_idx) {
            feature_min = 0;
            feature_min = min(feature_min, d3.min(data, function (d) { return abs(d.axes[column_idx].value) }))
            if (feature_min <= 0.001) {
                data.value = 0;
            }
            return abs(feature_min);
        }
        min_max_dict = {
            danceability: { min: get_min(0), max: get_max(0) },
            energy: { min: get_min(1), max: get_max(1) },
            words: { min: get_min(2), max: get_max(2) },
            instrumental: { min: get_min(3), max: get_max(3) },
            loudness: { min: get_min(4), max: get_max(4) },
            liveness: { min: get_min(5), max: get_max(5) },
            tempo: { min: get_min(6), max: get_max(6) },
            valence: { min: get_min(7), max: get_max(7) }
        };

        // circle properties 
        const allAxis = data[0].axes.map((i, j) => i.axis),	//Names of each axis
            total = allAxis.length,					//The number of different axes
            radius = Math.min(width / 3, height / 3), 	//Radius of the outermost circle
            Format = d3.format(cfg.format),			 	//Formatting
            angleSlice = Math.PI * 2 / total		//The width in radians of each "slice"
        total_songs = data.length;

        //Scale for the radius
        const rScale = d3.scaleLinear()
            .range([0, radius])
            .domain([0, maxValue]);

        // Clear any graph before
        d3.selectAll("#chart-area3 > *").remove();

        //Initiate the radar chart SVG
        let svg = d3.select('#chart-area3')
            .append("svg")
            .attr("viewBox", "0 0 " + width + " " + height)
            // .attr("width", width + cfg.margin.left + cfg.margin.right)
            // .attr("height", height + cfg.margin.top + cfg.margin.bottom)
            .attr("class", "radar");

        //Append a g element
        let g = svg.append("g")
            .attr("transform", "translate(" + (width / 2) + "," + (height / 4) * 2.2 + ")")
            .attr('id', 'parent');

        //Circle glow effects
        let filter = g.append('defs').append('filter').attr('id', 'glow'),
            feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur'),
            feMerge = filter.append('feMerge'),
            feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
            feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        //Wrapper for the grid & axes
        let axisGrid = g.append("g").attr("class", "axisWrapper");

        //Draw the background circles
        axisGrid.selectAll(".levels")
            .data(d3.range(1, (cfg.levels + 1)).reverse())
            .enter()
            .append("circle")
            .attr("class", "gridCircle")
            .attr("r", d => radius / cfg.levels * d)
            // .style("fill", "#CDCDCD")
            // .style("stroke", "#CDCDCD")
            .style("fill", "#a3c79d")
            .style("stroke", "#a3c79d")
            .style("fill-opacity", cfg.opacityCircles)
            .style("filter", "url(#glow)");

        //Create the straight lines radiating outward from the center
        var axis = axisGrid.selectAll(".axis")
            .data(allAxis)
            .enter()
            .append("g")
            .attr("class", "axis");

        //Append the lines
        axis.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", (d, i) => rScale(maxValue * 1.1) * cos(angleSlice * i - HALF_PI))
            .attr("y2", (d, i) => rScale(maxValue * 1.1) * sin(angleSlice * i - HALF_PI))
            .attr("class", "line")
            .style("stroke", "white")
            .style("stroke-width", "1.5px");

        //Text indicating at what % each level is
        axisGrid.selectAll(".axisLabel")
            .data(d3.range(1, (cfg.levels + 1)).reverse())
            .enter().append("text")
            .attr("class", "axisLabel")
            .attr("x", 4)
            .attr("y", d => -d * radius / cfg.levels)
            .attr("dy", "0.4em")
            .style("font-size", "14px")
            .attr("fill", "#737373")
            .text(d => Format(maxValue * d / cfg.levels) * 100 + '%');

        //Append the labels at each axis (8 criteria)
        axis.append("text")
            .attr("class", "legend")
            .style("font-size", "14px")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("x", (d, i) => rScale(maxValue * cfg.labelFactor) * cos(angleSlice * i - HALF_PI))
            .attr("y", (d, i) => rScale(maxValue * cfg.labelFactor) * sin(angleSlice * i - HALF_PI))
            .text(d => d)
            .call(wrap, cfg.wrapWidth);

        //The radial line function
        const radarLine = d3.radialLine()
            .curve(d3.curveLinearClosed)
            .radius(d => rScale(min_max_norm(d)))
            .angle((d, i) => i * angleSlice);

        if (cfg.roundStrokes) {
            radarLine.curve(d3.curveCardinalClosed)
        }

        function min_max_norm(data) {
            if (abs(data.value) <= 0.001) {
                data.value = 0
            }
            return (abs(data.value) - min_max_dict[data.axis].min) / (min_max_dict[data.axis].max - min_max_dict[data.axis].min)
        }

        //Create a wrapper for the blobs
        const blobWrapper = g.selectAll(".radarWrapper")
            .data(data)
            .enter().append("g")
            .attr("class", "radarWrapper")
            .attr('id', function (d, i) { return 'a' + i });

        //Append the backgrounds
        blobWrapper
            .append("path")
            .attr("class", "radarArea")
            .attr("d", d => radarLine(d.axes))
            .style("fill", (d, i) => cfg.color(i))
            .style("fill-opacity", cfg.opacityArea)
            .on('mouseover', function (d, i) {
                //Dim all blobs
                svg.selectAll(".radarArea")
                    .transition().duration(200)
                    .style("fill-opacity", 0.1);
                //Bring back the hovered over blob
                d3.select(this)
                    .transition().duration(200)
                    .style("fill-opacity", 0.7);
                // console.log(this)
                // d3.select(this.parentNode).raise()

            })
            .on('mouseout', () => {
                //Bring back all blobs
                svg.selectAll(".radarArea")
                    .transition().duration(200)
                    .style("fill-opacity", cfg.opacityArea)
                    .style("stroke-width", cfg.strokeWidth + "px");
            });

        //Create the outlines
        blobWrapper.append("path")
            .attr("class", "radarStroke")
            .attr("d", function (d, i) { return radarLine(d.axes); })
            .style("stroke-width", cfg.strokeWidth + "px")
            .style("stroke", (d, i) => cfg.color(i))
            .style("fill", "none")
            .style("filter", "url(#glow)");

        //Append the circles
        blobWrapper.selectAll(".radarCircle")
            .data(d => d.axes)
            .enter()
            .append("circle")
            .attr("class", "radarCircle")
            .attr("r", cfg.dotRadius)
            .attr("cx", (d, i) => rScale(min_max_norm(d)) * cos(angleSlice * i - HALF_PI))
            .attr("cy", (d, i) => rScale(min_max_norm(d)) * sin(angleSlice * i - HALF_PI))
            .style("fill", (d, i) => cfg.dot_color(d.id))
            .style("fill-opacity", 0.8);

        // console.log(previousElement.style('fill'))

        /////////////////////////////////////////////////////////
        //////// Append invisible circles for tooltip ///////////
        /////////////////////////////////////////////////////////

        //Wrapper for the invisible circles on top
        // const blobCircleWrapper = g.selectAll(".radarCircleWrapper")
        //     .data(data)
        //     .enter().append("g")
        //     .attr("class", "radarCircleWrapper");

        //Append a set of invisible circles on top for the mouseover pop-up
        blobWrapper.selectAll(".radarInvisibleCircle")
            .data(d => d.axes)
            .enter().append("circle")
            .attr("class", "radarInvisibleCircle")
            .attr("r", cfg.dotRadius * 2)
            .attr("cx", (d, i) => rScale(min_max_norm(d)) * cos(angleSlice * i - HALF_PI))
            .attr("cy", (d, i) => rScale(min_max_norm(d)) * sin(angleSlice * i - HALF_PI))
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", function (d, i) {
                tooltip
                    .attr('x', this.cx.baseVal.value - 10)
                    .attr('y', this.cy.baseVal.value - 10)
                    .transition()
                    .style('display', 'block')
                    .text(d.value);
                d3.selectAll('text').raise()
            })
            .on("mouseout", function () {
                tooltip.transition()
                    .style('display', 'none').text('');
            });

        const tooltip = g.append("text")
            .attr("class", "mytooltip")
            .attr('x', 0)
            .attr('y', 0)
            .style("font-size", "14px")
            .style('display', 'none')
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em");



        if (cfg.legend !== false && typeof cfg.legend === "object") {
            let legendZone = svg.append('g');
            if (cfg.legend.title) {
                let title = legendZone.append("text")
                    .attr("class", "title")
                    .attr('transform', `translate(${cfg.legend.translateX + 20},${cfg.legend.translateY})`)
                    .attr("x", width / 2)
                    .attr("y", 10)
                    .attr("font-size", "14px")
                    .attr("fill", "#404040")
                    .text(cfg.legend.title);
            }
            let legend = legendZone.append("g")
                .attr("class", "legend")
                .attr("height", height / 20)
                .attr("width", width / 2)
                .attr('transform', `translate(${cfg.legend.translateX},${cfg.legend.translateY})`);

            // Create rectangles markers
            legend.selectAll('rect')
                .data(d => data)
                .enter()
                .append("rect")
                .attr("x", (d, i) => width / total_songs * i)
                .attr("y", (d, i) => 2)
                .attr("width", 10)
                .attr("height", 10)
                .style("fill", (d, i) => cfg.color(i))
                .attr('id', (d, i) => 'a' + i)
                .on("mouseover", function (d, i) {
                    d3.select(this)
                        .attr("width", 20)
                        .attr("height", 20);

                    singer = d.song_artist.split(/\"|\'+/).filter(function (element, index) {
                        return (index % 2 === 1);
                    })
                    // console.log(singer)

                    song_tooltip
                        .attr('x', width / 2)
                        .attr('y', height / 10)
                        .transition()
                        .style('display', 'block')
                        .attr("dy", "0em")
                        .text(singer[0] + ' - ' + d.song_name + ' [' + d.song_year + ']');

                    d3.select('g#a' + i)._groups[0][0].parentNode.append(d3.select('g#a' + i)._groups[0][0])
                    d3.selectAll('text').raise()
                    // console.log(d3.select('g#a2')._groups[0][0].firstChild.parentNode)
                    // console.log(d3.select('g#a2'))
                })
                .on("mouseout", function () {
                    d3.select(this)
                        .attr("width", 10)
                        .attr("height", 10);
                });

            const song_tooltip = svg.append("text")
                // .attr('position','absolute')
                .attr("class", "mytooltip")
                .attr('x', 0)
                .attr('y', -250)
                .style("font-size", "14px")
                .style('display', 'block')
                .attr("text-anchor", "middle")
                .attr("dy", "0.35em");

            // d3.selectAll('#a8').on('mouseover',function(){
            //     console.log(this)
            //     // this.raise()
            // })

            // console.log(['#' + i])
            // d3.selectAll(['#' + i]).raise()
            // console.log(['#' + i])

            // Create labels
            // legend.selectAll('text')
            //     .data(names)
            //     .enter()
            //     .append("text")
            //     .attr("x", (d, i) => cfg.w/total_songs * i +35)
            //     .attr("y", (d, i) => 40)
            //     .attr("font-size", "11px")
            //     .attr("fill", "#737373")
            //     .text(d => d)
            //     .call(wrap, cfg.wrapWidth);
        }

        setTimeout(() => {
            $("div.spanner").removeClass("show");
            $("div.overlay").removeClass("show");
        }, 2000);
    }
})(d3);

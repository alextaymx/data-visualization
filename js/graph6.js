!(function (d3) {
  $("#chart-area6").empty();

  // const dataCleaning = (row, i) => {
  //   return {
  //     danceability: parseFloat(row.danceability),
  //     energy: parseFloat(row.energy),
  //     popularity: parseInt(row.popularity),
  //     liveness: parseFloat(row.liveness),
  //     year: parseInt(row.year),
  //     key: i,
  //   };
  // };
  // const fetchData = [d3.csv("../data/spotify.csv", dataCleaning)];
  // const fetchData = [d3.csv("../data/spotify.csv")];

  Promise.all(spotify_raw).then(scatter_plot);

  d3.select("#Scatter-plot-title").text("Pop Music Trends");

  function scatter_plot([data]) {
    // setting width and height
    let parentDiv = document.getElementById("chart-area6");
    // let width = parentDiv.clientWidth;
    // let height = parentDiv.clientHeight;
    // const margin = {
    //   top: 30,
    //   right: 10,
    //   bottom: 30,
    //   left: 10,
    // };
    let width = parentDiv.clientWidth;
    let height = parentDiv.clientHeight;
    var padding = 30;

    // let width = parentDiv.clientWidth - margin.left - margin.right;
    // let height = parentDiv.clientHeight - margin.top - margin.bottom;
    console.log("Scatter Plot size", width, height);
    setTimeout(() => {
      console.log("in timeout");
      if (width === 0 || height === 0) {
        console.log("clicked");
        document.getElementById("nav-tab-3").click();
      }
    }, 100);

    let sortedData = data.sort((a, b) => a.year - b.year);

    let dataByYear = [];
    let currentYear = sortedData[0].year;
    let energyCount = +sortedData[0].energy;
    let danceabilityCount = +sortedData[0].danceability;
    let popularityCount = +sortedData[0].popularity;
    let livenessCount = +sortedData[0].liveness;
    sortedData.forEach((d, idx) => {
      if (d.year === currentYear) {
        energyCount += +d.energy;
        danceabilityCount += +d.danceability;
        popularityCount += +d.popularity;
        livenessCount += +d.liveness;
      } else {
        dataByYear.push([
          currentYear.toString(),
          {
            energy: energyCount,
            danceability: danceabilityCount,
            popularity: popularityCount,
            liveness: livenessCount,
          },
        ]);
        currentYear = d.year;
        energyCount = +d.energy;
        danceabilityCount = +d.danceability;
        popularityCount = +d.popularity;
        livenessCount = +d.liveness;
      }
    });
    dataByYear.push([
      currentYear.toString(),
      {
        energy: energyCount,
        danceability: danceabilityCount,
        popularity: popularityCount,
        liveness: livenessCount,
      },
    ]);
    console.log(dataByYear, "qqwww");
    // 100 element in []
    //[ [1921,{}], [ 1922 ,  {}   ]  ]
    // const dataByYear = d3.rollups(
    //   data,
    //   (v) => {
    //     return {
    //       energy: d3.sum(v, (d) => d.energy),
    //       danceability: d3.sum(v, (d) => d.danceability),
    //       popularity: d3.sum(v, (d) => d.popularity),
    //       liveness: d3.sum(v, (d) => d.liveness),
    //     };
    //   },
    //   (d) => d.year
    // );

    let svg = d3
      .select("#chart-area6")
      .append("svg")
      .attr("viewBox", "0 0 " + width + " " + height);
    // .attr("width", width)
    // .attr("height", height);

    //Create scale functions.

    let xScale = d3
      .scaleLinear()
      .domain([
        d3.min(dataByYear, (d) => d[1].danceability),
        d3.max(dataByYear, (d) => d[1].danceability),
      ])
      .range([padding, width - padding * 2]);

    let yScale = d3
      .scaleLinear()
      .domain([0, d3.max(dataByYear, (d) => d[1].energy) + 100])
      .range([height - padding, padding]);

    let rScale = d3
      .scaleSqrt()
      .domain([
        d3.min(dataByYear, (d) => d[1].liveness),
        d3.max(dataByYear, (d) => d[1].liveness),
      ])
      .range([1, 10]);

    let colorPalette = d3
      .scaleSequential()
      .domain([
        d3.min(dataByYear, (d) => d[1].popularity),
        d3.max(dataByYear, (d) => d[1].popularity),
      ])
      .interpolator(d3.interpolateViridis);

    // Add in x-, y- axis and r (radius)

    // let Format = d3.format('.2f')

    const tooltip = d3
      .select("#chart-area6")
      .append("div")
      .attr("class", "tooltip")
      // .attr('position', 'absolute')
      .attr("text-align", "center")
      .attr("width", "60px")
      .attr("height", "28px")
      .attr("padding", "2px")
      .attr("font", "8px sans-serif")
      .attr("background", "lightsteelblue")
      .attr("boarder", "0px")
      .attr("boarder-radius", "8px")
      .attr("pointer-events", "none")
      .style("opacity", 0);

    let default_speed = 500;

    d3.selectAll("input[name='scatter-radio']").on("change", function () {
      console.log("this => ", this.value, typeof this.value);
      if (this.value === "slow") {
        default_speed = 8000;
      } else if (this.value === "medium") {
        default_speed = 5000;
      } else if (this.value === "fast") {
        default_speed = 500;
      }
      console.log("On change:", default_speed);
    });

    update();

    d3.select("#play-scatter-animation").on("click", function () {
      let last_circle_opacity = d3
        .select(svg.selectAll(".circle_scatter")._groups[0][99])
        .style("opacity");
      if (last_circle_opacity === "1") {
        // console.log('update')
        update();
        // console.log('update end ')
      }
    });

    function update() {
      var scatter = svg.selectAll(".circle_scatter").data(dataByYear);

      scatter.exit().remove();

      svg
        .selectAll(".circle_scatter") //clear screen
        .attr("opacity", 0);

      scatter
        .enter()
        .append("circle")
        .attr("class", "circle_scatter")
        .attr("cx", (d) => xScale(d[1].danceability))
        .attr("cy", (d) => yScale(d[1].energy))
        .attr("r", (d) => rScale(d[1].liveness))
        .attr("fill", (d) => {
          return colorPalette(d[1].popularity);
        })
        .attr("opacity", 0);

      console.log("On update:", default_speed);

      svg.selectAll("circle").each(function (d, i) {
        // console.log(d)
        d3.select(this)
          .transition()
          .delay(i * 250)
          .duration(default_speed)
          .attr("opacity", 1);
      });

      // svg.selectAll('circle')
      //   .each(function (d, i) {
      //     // console.log(d)
      //     d3.select(this)
      //       .transition()
      //       .delay(i * 250)
      //       .duration(5000)
      //       .attr('opacity', 1)
      //   });

      svg
        .selectAll("circle")
        .on("mouseover", (d) => {
          tooltip.transition().duration(200).style("opacity", 1);
          tooltip
            .html("Year:" + d[0])
            .style("left", d3.event.pageX - 20 + "px")
            .style("top", d3.event.pageY - 40 + "px");
        })
        .on("mouseout", (d) => {
          tooltip.transition().duration(200).style("opacity", 0);
          tooltip.html("");
        });
    }

    // Clear any graph before
    // d3.selectAll("#chart-area6 > *").remove();

    // Create group element

    // Draw the axis

    //Define X axis
    var xAxis = d3
      .axisBottom()
      .scale(xScale)
      .tickFormat((d) => {
        return xScale.tickFormat(4, d3.format(",d"))(d);
      })
      .ticks(5);

    //Define Y axis
    var yAxis = d3.axisLeft().scale(yScale).ticks(9);

    svg
      .append("text")
      .attr("transform", `translate(${width / 2},${height})`)
      .style("text-anchor", "middle")
      .text("Danceability");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 11)
      .attr("x", -height / 2)
      // .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Energy");

    //Create X axis
    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + (height - padding) + ")")
      .call(xAxis);

    //Create Y axis
    svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", "translate(" + padding + ",0)");
    // .call(yAxis);

    svg
      .selectAll(".y-axis")
      // .transition()
      // .duration(speed)
      .call(yAxis.tickSize(-width + padding * 2));

    d3.selectAll(".y-axis line").style("opacity", 0.2);

    d3.selectAll(".y-axis path").style("display", "none");
  }

  setTimeout(() => {
    $("div.spanner").removeClass("show");
    $("div.overlay").removeClass("show");
  }, 2000);
})(d3);

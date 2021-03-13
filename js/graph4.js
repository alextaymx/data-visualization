!(function (d3) {
  $("#chart-area4").empty();

  let selected_year = 2020, selected_layer = 2;

  Promise.all(network_promise(selected_year, selected_layer)).then(networkGraph);

  d3.select('#year_selector')
    .selectAll('option')
    .data(d3.range(2020, 1920, -1))
    .enter()
    .append('option')
    .text(function (d) { return d })
    .attr('value', function (d) { return d })

  d3.select('#layer_selector')
    .selectAll('option')
    .data(d3.range(2, 5))
    .enter()
    .append('option')
    .text(function (d) { return d })
    .attr('value', function (d) { return d })


  d3.select("#year_selector")
    .on("change", function (d) {
      selected_year = this.value;
      Promise.all(network_promise(selected_year, selected_layer)).then(networkGraph);
      d3.select('#network-graph-title')
        .text('Artist Collaboration in ' + selected_year + ' with ' + selected_layer + ' collaborators');
    });

  d3.select("#layer_selector")
    .on("change", function (d) {
      selected_layer = this.value;
      Promise.all(network_promise(selected_year, selected_layer)).then(networkGraph);
      d3.select('#network-graph-title')
        .text('Artist Collaboration in ' + selected_year + ' with ' + selected_layer + ' collaborators');
    });

  d3.select('#network-graph-title')
    .text('Artist Collaboration in ' + selected_year + ' with ' + selected_layer + ' collaborators');



  function networkGraph([data]) {

    let parentDiv = document.getElementById("chart-area4");
    let width = parentDiv.clientWidth;
    let height = parentDiv.clientHeight;
    console.log("graph4", width, height);

    setTimeout(() => {
      console.log("in timeout");
      if (width === 0 || height === 0) {
        console.log("clicked");
        document.getElementById("nav-tab-2").click();
      }
    }, 100);

    var label = {
      nodes: [],
      links: [],
    };
    // console.log(data)


    var color = d3.scaleOrdinal(d3.schemeCategory10);
    var line_width = d3.scaleLinear()
      .domain(
        [
          d3.min(data.links, (d) => d.colab_count),
          d3.max(data.links, (d) => d.colab_count)
        ]
      )
      .range([1, 10])





    data.nodes.forEach(function (d, i) {
      label.nodes.push({ node: d });
      label.nodes.push({ node: d });
      label.links.push({
        source: i * 2,
        target: i * 2 + 1,
      });
    });

    var labelLayout = d3
      .forceSimulation(label.nodes)
      .force("charge", d3.forceManyBody().strength(-50))
      .force("link", d3.forceLink(label.links).distance(0).strength(2));

    var graphLayout = d3
      .forceSimulation(data.nodes)
      .force("charge", d3.forceManyBody().strength(-3000))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(1))
      .force("y", d3.forceY(height / 2).strength(1))
      .force(
        "link",
        d3
          .forceLink(data.links)
          .id(function (d) {
            return d.id;
          })
          .distance(50)
          .strength(1)
      )
      .on("tick", ticked);

    var adjlist = [];

    data.links.forEach(function (d) {
      adjlist[d.source.index + "-" + d.target.index] = true;
      adjlist[d.target.index + "-" + d.source.index] = true;
    });

    function neigh(a, b) {
      return a == b || adjlist[a + "-" + b];
    }

    // Clear any graph before
    d3.selectAll("#chart-area4 > *").remove();

    let svg = d3
      .select('#chart-area4')
      .append("svg")
      .attr("id", "graph4")
      .attr("viewBox", "0 0 " + width + " " + height);
    // .attr("width", width)
    // .attr("height", height)

    var container = svg.append("g");

    svg.call(
      d3
        .zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", function () {
          container.attr("transform", d3.event.transform);
        })
    );

    var link = container
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(data.links)
      .enter()
      .append("line")
      .attr("stroke", "#aaa")
      .attr("stroke-width", (d) => line_width(d.colab_count));

    var node = container
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(data.nodes)
      .enter()
      .append("circle")
      .attr("r", 5)
      .attr("fill", function (d) {
        return color(d.group);
      });

    node.on("mouseover", focus).on("mouseout", unfocus);

    node.call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );

    var labelNode = container
      .append("g")
      .attr("class", "labelNodes")
      .selectAll("text")
      .data(label.nodes)
      .enter()
      .append("text")
      .text(function (d, i) {
        return i % 2 == 0 ? "" : d.node.id;
      })
      .style("fill", "#555")
      .style("font-family", "Arial")
      .style("font-size", 12)
      .style("pointer-events", "none"); // to prevent mouseover/drag capture

    node.on("mouseover", focus).on("mouseout", unfocus);

    const tooltip = d3.select("#chart-area4").append("div")
      .attr("class", "tooltip")
      // .attr('position', 'absolute')
      .attr('text-align', 'center')
      .attr('width', '60px')
      .attr('height', '28px')
      .attr('padding', '2px')
      .attr('font', '8px sans-serif')
      .attr('background', 'lightsteelblue')
      .attr('boarder', '0px')
      .attr('boarder-radius', '8px')
      .attr('pointer-events', 'none')
      .style("opacity", 0);

    function ticked() {
      node.call(updateNode);
      link.call(updateLink);

      labelLayout.alphaTarget(0.3).restart();
      labelNode.each(function (d, i) {
        if (i % 2 == 0) {
          d.x = d.node.x;
          d.y = d.node.y;
        } else {
          var b = this.getBBox();

          var diffX = d.x - d.node.x;
          var diffY = d.y - d.node.y;

          var dist = Math.sqrt(diffX * diffX + diffY * diffY);

          var shiftX = (b.width * (diffX - dist)) / (dist * 2);
          shiftX = Math.max(-b.width, Math.min(0, shiftX));
          var shiftY = 16;
          this.setAttribute(
            "transform",
            "translate(" + shiftX + "," + shiftY + ")"
          );
        }
      });
      labelNode.call(updateNode);
    }

    function fixna(x) {
      if (isFinite(x)) return x;
      return 0;
    }

    function focus(d) {
      var index = d3.select(d3.event.target).datum().index;

      node.style("opacity", function (o) {
        return neigh(index, o.index) ? 1 : 0.1;
      });
      labelNode.attr("display", function (o) {
        return neigh(index, o.node.index) ? "block" : "none";
      });
      link.style("opacity", function (o) {
        return o.source.index == index || o.target.index == index ? 1 : 0.1;
      });

      tooltip.transition()
        .duration(200)
        .style("opacity", 1);
      tooltip.html("Songs:" + d.song_count + '<br>')
        .style("left", d3.event.pageX - 20 + 'px')
        .style("top", d3.event.pageY - 40 + 'px');

    }

    function unfocus() {
      labelNode.attr("display", "block");
      node.style("opacity", 1);
      link.style("opacity", 1);

      tooltip.transition()
        .duration(200)
        .style("opacity", 0);
      tooltip.html('')
    }

    function updateLink(link) {
      link
        .attr("x1", function (d) {
          return fixna(d.source.x);
        })
        .attr("y1", function (d) {
          return fixna(d.source.y);
        })
        .attr("x2", function (d) {
          return fixna(d.target.x);
        })
        .attr("y2", function (d) {
          return fixna(d.target.y);
        });
    }

    function updateNode(node) {
      node.attr("transform", function (d) {
        return "translate(" + fixna(d.x) + "," + fixna(d.y) + ")";
      });
    }

    function dragstarted(d) {
      d3.event.sourceEvent.stopPropagation();
      if (!d3.event.active) graphLayout.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) graphLayout.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  }
  setTimeout(() => {
    $("div.spanner").removeClass("show");
    $("div.overlay").removeClass("show");
  }, 2000);
})(d3);

// const cleanData = (data) => {
//   console.log(data);
//   const filtered = data.filter((d) => {
//     // return +d.year > 2010;
//     return true;
//   });
//   const allArtists = filtered.map((f) => {
//     // const b = f.artists.replace(/'/g, '"').replace(/[^\x00-\x7F]/g, "");
//     const artists = f.artists
//       // .replace(/['"\[\]']+/g, "")
//       .replace(/[^0-9A-Za-z\,]/g, "")
//       // .replace(/[^\x00-\x7F]/g, "?")
//       .split(",");
//     // console.log(b);

//     return artists;
//   });

//   var counts = {};
//   var links = [];
//   for (var i = 0; i < allArtists.length; i++) {
//     var artists = allArtists[i];
//     let pairsFunc = (arr) =>
//       arr
//         .map((v, i) => arr.slice(i + 1).map((w) => ({ source: v, target: w })))
//         .flat();
//     const pairs = pairsFunc(artists);
//     pairs.forEach((p) => {
//       if (
//         links.findIndex(
//           (l) => l.source === p.source && l.target === p.target
//         ) === -1
//       ) {
//         links.push(pairs);
//       }
//     });

//     for (var j = 0; j < artists.length; j++) {
//       var artist = artists[j];
//       counts[artist] = counts[artist] ? counts[artist] + 1 : 1;
//     }
//   }
//   // 1 2 4 8 16 32 64 128 246 512
//   console.log(links, counts);
//   console.log(
//     Object.keys(counts).map((key) => {
//       let bin = 0;
//       if (counts[key] >= 512) {
//         bin = 10;
//       } else if (counts[key] >= 256) {
//         bin = 9;
//       } else if (counts[key] >= 128) {
//         bin = 8;
//       } else if (counts[key] >= 64) {
//         bin = 7;
//       } else if (counts[key] >= 32) {
//         bin = 6;
//       } else if (counts[key] >= 16) {
//         bin = 5;
//       } else if (counts[key] >= 8) {
//         bin = 4;
//       } else if (counts[key] >= 4) {
//         bin = 3;
//       } else if (counts[key] >= 2) {
//         bin = 2;
//       } else if (counts[key] >= 1) {
//         bin = 1;
//       }
//       return {
//         id: key,
//         group: bin,
//       };
//     })
//   );

//   // console.log(a);
//   // console.log(
//   //   JSON.parse(data[0].artists.replace(/["]+/g, "").replace(/[']+/g, '"'))
//   // );

//   return filtered;
// };

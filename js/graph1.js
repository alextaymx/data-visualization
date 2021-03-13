!(function (d3) {
  $("#chart-area1").empty();

  const fetchData1 = [d3.csv("../data/spotify.csv")];

  Promise.all(fetchData1).then(ready);

  function ready([spotify]) {
    // const myData = d3.rollup(spotify, v => d3.sum(v, d => d.popularity), d => d.name)
    const dataGroupByName = d3
      .nest()
      .key(function (d) {
        return d.name;
      })
      .rollup(function (names) {
        // names.forEach((n)=>)
        return names.map((n) => ({ Popularity: n.popularity }));
        //  return popularity.map(function(c) {
        //   return {"City": c.City, "Population": +c.Population };
        //  });
      })
      .entries(spotify);

    // acousticness: "0.579"
    // artists: "['KHP Kridhamardawa Karaton Ngayogyakarta Hadiningrat']"
    // danceability: "0.697"
    // duration_ms: "395076"
    // energy: "0.346"
    // explicit: "0"
    // id: "4pyw9DVHGStUre4J6hPngr"
    // instrumentalness: "0.168"
    // key: "2"
    // liveness: "0.13"
    // loudness: "-12.506"
    // mode: "1"
    // name: "Gati Mardika"
    // popularity: "6"
    // release_date: "1921"
    // speechiness: "0.07"
    // tempo: "119.824"
    // valence: "0.196"
    // year: "1921"

    const topN = (arr, n) => {
      if (n > arr.length) {
        return false;
      }
      return arr
        .slice()
        .sort((a, b) => {
          return b.popularity - a.popularity;
        })
        .slice(0, n);
    };

    const popularityByName = dataGroupByName.map((element) => {
      let name = element.key;
      if (name.length > 20) {
        name = name.slice(0, 20) + "...";
      }
      return { name, popularity: d3.sum(element.value, (d) => d.Popularity) };
    });
    const topSongs = topN(popularityByName, 150);
    // console.log(topSongs,"alex");
    // setting width and height
    let parentDiv = document.getElementById("chart-area1");
    // let width = parentDiv.clientWidth;
    // let height = parentDiv.clientHeight;
    const margin1 = {
      top: 30,
      right: 10,
      bottom: 30,
      left: 10,
    };
    let width = parentDiv.clientWidth;
    let height = parentDiv.clientHeight;
    // let width = parentDiv.clientWidth - margin.left - margin.right;
    // let height = parentDiv.clientHeight - margin.top - margin.bottom;

    console.log("WordCloud size", width, height);
    setTimeout(() => {
      console.log("Loading WordCloud Done");
      if (width === 0 || height === 0) {
        console.log("clicked");
        document.getElementById("nav-tab-1").click();
      }
    }, 100);

    function wordCloud(selector) {
      const fill = d3.scaleOrdinal(d3.schemeCategory10);
      //Construct the word cloud's SVG element
      // Clear any graph before
      d3.selectAll("#chart-area1 > *").remove();
      const svg = d3
        .select(selector)
        .append("svg")
        .attr("id", "graph1")
        .attr("viewBox", "0 0 " + width + " " + height);
      const g = d3.select("#graph1").append("g");
      // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      // const categories = d3.keys(
      //   d3
      //     .nest()
      //     .key((d) => {
      //       console.log(d,"q")
      //       return d.State})
      //     .map(data)
      // );

      const fontSize = d3
        .scalePow()
        .exponent(5)
        .domain([
          d3.min(topSongs, (d) => d.popularity),
          d3.max(topSongs, (d) => d.popularity),
        ])
        .range([20, 100]);

      //Draw the word cloud
      function draw(words) {
        // var cloud = svg.selectAll("g text").data(words, function (d) {
        //   return d.text;
        // });

        let cloud = wordcloud.selectAll("text").data(words);

        //Entering words
        cloud
          .enter()
          .append("text")
          .style("fill", function (d, i) {
            return fill(i);
          })
          .attr("text-anchor", "middle")
          .attr("font-size", 1)
          .attr("font-family", "Impact")
          .text(function (d) {
            return d.text;
          });

        cloud
          .transition()
          .duration(600)
          .attr("class", "word")
          .style("fill", (d, i) => fill(i))
          .style("font-size", (d) => d.size + "px")
          // .style("font-family", (d) => {
          //   // console.log(d);
          //   return d.font;
          // })
          .attr("font-family", "Impact")
          .attr("text-anchor", "middle")
          .attr(
            "transform",
            (d) => "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"
          )
          .style("fill-opacity", 1);
        // .text((d) => d.text);

        //Exiting words
        cloud
          .exit()
          .transition()
          .duration(200)
          .style("fill-opacity", 1e-6)
          .attr("font-size", 1)
          .remove();
      }
      const wordcloud = g
        .append("g")
        .attr("class", "wordcloud")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

      g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .selectAll("text")
        .style("font-size", "20px")
        .style("fill", (d) => color(d));
      // .style("font-family", "sans-serif");
      //Use the module pattern to encapsulate the visualisation code. We'll
      // expose only the parts that need to be public.
      return {
        //Recompute the word cloud for a new set of words. This method will
        // asycnhronously call draw when the layout has been computed.
        //The outside world will need to call this function, so make it part
        // of the wordCloud return value.
        update: function (words) {
          d3.layout
            .cloud()
            .size([width, height])
            .timeInterval(20)
            .words(topSongs)
            .rotate(function () {
              //rotate 90*
              // return ~~(Math.random() * 2) * 90;
              return 0;
            })
            .font("Impact")
            .fontSize((d, i) => {
              return fontSize(d.popularity);
            })
            .fontWeight(["bold"])
            .text((d) => {
              return d.name;
            })
            .spiral("archimedean") // "archimedean" or "rectangular"
            .on("end", draw)
            .start();
        },
      };
    }

    //Prepare one of the sample sentences by removing punctuation,
    // creating an array of words and computing a random size attribute.
    function getWords(i) {
      return words[i]
        .replace(/[!\.,:;\?]/g, "")
        .split(" ")
        .map(function (d) {
          return { text: d, size: 10 + Math.random() * 60 };
        });
    }

    //This method tells the word cloud to redraw with a new set of words.
    //In reality the new words would probably come from a server request,
    // user input or some other source.
    function showNewWords(vis, i) {
      i = i || 0;

      vis.update();
      setTimeout(function () {
        showNewWords(vis, i + 1);
      }, 4000);
    }

    //Create a new instance of the word cloud visualisation.
    var myWordCloud = wordCloud(parentDiv);

    //Start cycling through the demo data
    showNewWords(myWordCloud);
  }

  setTimeout(() => {
    $("div.spanner").removeClass("show");
    $("div.overlay").removeClass("show");
  }, 2000);
})(d3);

// BACKUP

// let svg = d3
//   .select(parentDiv)
//   .append("svg")
//   .attr("id", "graph1")
//   .attr("viewBox", "0 0 " + width + " " + height);
//   // .attr("width", width)
//   // .attr("height", height)

// const g = d3.select("#graph1").append("g");
// // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// const color = d3.scaleOrdinal(d3.schemeCategory10);
// const categories = d3.keys(
//   d3
//     .nest()
//     .key((d) => d.State)
//     .map(data)
// );
// const fontSize = d3.scalePow().exponent(5).domain([0, 1]).range([20, 100]);

// const draw = (words) => {
//   wordcloud
//     .selectAll("text")
//     .data(words)
//     .enter()
//     .append("text")
//     .attr("class", "word")
//     .style("fill", (d, i) => color(i))
//     .style("font-size", (d) => d.size + "px")
//     .style("font-family", (d) => {
//       // console.log(d);
//       return d.font;
//     })
//     .attr("text-anchor", "middle")
//     .attr(
//       "transform",
//       (d) => "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"
//     )
//     .text((d) => d.text);
// };

// const layout = d3.layout
//   .cloud()
//   .size([width, height])
//   .timeInterval(20)
//   .words(data)
//   .rotate(function () {
//     //rotate 90*
//     return ~~(Math.random() * 2) * 90;
//   })
//   .fontSize((d, i) => fontSize(Math.random()))
//   .fontWeight(["bold"])
//   .text((d) => d.Team_CN)
//   .spiral("archimedean") // "archimedean" or "rectangular"
//   .on("end", draw)
//   .start();

// const wordcloud = g
//   .append("g")
//   .attr("class", "wordcloud")
//   .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

// g.append("g")
//   .attr("class", "axis")
//   .attr("transform", "translate(0," + height + ")")
//   .selectAll("text")
//   .style("font-size", "20px")
//   .style("fill", (d) => color(d))
//   .style("font-family", "sans-serif");

// function myWordCloud(selector) {
//   let svg = d3
//     .select(selector)
//     .append("svg")
//     .attr("id", "graph1")
//     .attr("viewBox", "0 0 " + width + " " + height);
//   const g = d3.select("#graph1").append("g");
//   const color = d3.scaleOrdinal(d3.schemeCategory10);
//   const categories = d3.keys(
//     d3
//       .nest()
//       .key((d) => d.State)
//       .map(data)
//   );
//   const fontSize = d3.scalePow().exponent(5).domain([0, 1]).range([20, 100]);
//   draw(words);
// }

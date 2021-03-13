console.log('Loading all promises')

const spotify_raw = [d3.csv("../data/spotify.csv")];

const max = Math.max;
const min = Math.min;
const sin = Math.sin;
const cos = Math.cos;
const abs = Math.abs;
const HALF_PI = Math.PI / 2;
const round = Math.round;

function network_promise(year, layer) {
    console.log('here=>', year, layer);
    return [d3.json("../data/networks/network_data_" + year + '_' + layer + ".json")];
}



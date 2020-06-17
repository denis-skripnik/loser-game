const golos = require("./plugins/golos/index");
const steem = require("./plugins/steem/index");
const viz = require("./plugins/viz/index");

golos.isActivePlugin();
steem.isActivePlugin();
viz.isActivePlugin();

let express = require('express');
let app = express();

app.get('/loser-game/', async function (req, res) {
let chain = req.query.chain; // получили параметр chain из url
let type = req.query.type; // получили параметр type из url
if (chain === 'golos' && type) {
    let data = await golos.forPage(type);
    res.send(data);
} else if (chain === 'steem' && type) {
    let data = await steem.forPage(type);
    res.send(data);
} else if (chain === 'viz' && type) {
    let data = await viz.forPage(type);
    res.send(data);
}
});
app.listen(3000, function () {
});
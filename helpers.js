async function sleep(ms) {
    await new Promise(r => setTimeout(r, ms));
    }

    async function unixTime(){
        return parseInt(new Date().getTime()/1000)
        }
    
function compareDate(a, b)
{
	if(a.unixtime > b.unixtime)
	{
		return -1;
	}
else{
		return 1;
	}
}

async function getRandomInRange(min, max) {
	  return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	async function jsonFileGenerate(mbdb, pdb, methods, fs) {
        var fs = require('fs');
const conf = require('../config.json');
        let posts_list = [];
let posts = await pdb.findAllPosts();
    if (posts.length > 0) {
        posts.sort(compareDate);
        for (let post of posts) {
            let max_bid = (await methods.upvoteAmount() / 100)*conf.max_bid_percent;
            if (max_bid === 0) {
                max_bid = await mbdb.getValue();
            } else {
            await mbdb.setValue(max_bid);
            max_bid *= 1000;
            max_bid = parseInt(max_bid);
            max_bid /= 1000;
            max_bid = max_bid.toFixed(3);
            }
            let posts_amount_count = 0;
            let approve_posts = [];
            let return_posts = [];
            for (let post of posts) {
                        posts_amount_count += post.amount;
                    if (posts_amount_count <= max_bid) {
            approve_posts.push({url: `https://golos.id/@${post.author}/${post.permlink}`, amount: post.amount, memo: post.memo, transfers: post.transfers});
                    } else {
                        return_posts.push({url: `https://golos.id/@${post.author}/${post.permlink}`, amount: post.amount, memo: post.memo, transfers: post.transfers});
                    }
                    }
                    let bid_count = approve_posts.reduce(function(p,c){return p+c.amount;},0);
                    let posts_array = [];
                    for (let approve_post of approve_posts) {
            let percent = approve_post.amount/bid_count*100;
                        posts_array.push({author: approve_post.author, permlink: approve_post.permlink, percent, transfers: approve_post.transfers})
            }
            posts_list = {normal: posts_array, return: return_posts}
            let posts_string = JSON.stringify(posts_list);
    try {
         const data = fs.writeFileSync('turn.json', posts_string)
         //файл записан успешно
       } catch (err) {
         console.error(err)
       }
        }
        }
}

module.exports.unixTime = unixTime;
module.exports.sleep = sleep;
module.exports.compareDate = compareDate;
module.exports.getRandomInRange = getRandomInRange;
module.exports.jsonFileGenerate = jsonFileGenerate;
const conf = require('./config.json');
const helpers = require("../../helpers");
const methods = require("./methods");
const bdb = require("./blocksdb");
const amounts = require("./amountsdb");
const finished = require("./finisheddb");
let keccak = require("keccak");
const BigInt = require("big-integer");
const CronJob = require('cron').CronJob;
const LONG_DELAY = 12000;
const SHORT_DELAY = 3000;
const SUPER_LONG_DELAY = 1000 * 60 * 15;

async function processBlock(bn) {
    let hasher = new keccak("keccak256");
    let sig = await methods.getBlockSignature(bn);
    const block = await methods.getOpsInBlock(bn);
let ok_ops_count = 0;
    for(let tr of block) {
        const [op, opbody] = tr.op;
        switch(op) {
                case "transfer":
                if (opbody.to === conf.login) {
                     let amount = parseFloat(opbody.amount.split(' ')[0]);
let token = opbody.amount.split(' ')[1];
let approve_amounts = await amounts.getAmounts(amount, token);
if (approve_amounts) {
    let prevSig = await methods.getBlockSignature(approve_amounts.start_round_block);
    hasher.update(prevSig + sig);
    let sha3 = hasher.digest().toString("hex");
    let loser = BigI(sha3, 16).mod(conf.maximum_number);
    loser = parseInt(loser);
    let transfers = approve_amounts.transfers;
transfers.push(opbody.from);
if (transfers.length === 3) {
let all_amount = approve_amounts.amount*conf.maximum_number;
let fee_amount = all_amount * (conf.fee/100)
let transfer_amount = (all_amount - fee_amount)/(conf.maximum_number-1);
transfer_amount = transfer_amount.toFixed(3) + ' ' + approve_amounts.token;
let transfers_array = [];
let winning_array = [];
let losing_array = [];
for (let id in transfers) {
    if (parseFloat(id) !== loser) {
        winning_array.push({login: transfers[id], amount: transfer_amount});
        transfers_array.push({to: transfers[id], amount: transfer_amount, memo: `You win. Lost a participant #${loser+1}. Starting block of the round: ${approve_amounts.start_round_block}, The block of the last participant of the round: ${bn}. Hash of the signature blocks: ${sha3}. The proof of the honesty of the random number generator: https://dpos.space/randomblockchain/?chain=steem&participants=3&block1=${approve_amounts.start_round_block}&block2=${bn}.`});
} else {
    losing_array.push(transfers[id]);
    transfers_array.push({to: transfers[id], amount: '0.002 ' + approve_amounts.token, memo: `You lost, because you are the participant #${loser+1}. Bid ${approve_amounts.amount} ${approve_amounts.token}. Starting block of the round: ${approve_amounts.start_round_block}, The block of the last participant of the round: ${bn}. Hash of the signature blocks: ${sha3}. The proof of the honesty of the random number generator: https://dpos.space/randomblockchain/?chain=steem&participants=3&block1=${approve_amounts.start_round_block}&block2=${bn}.`});
}
}
fee_amount -= 0.002;
fee_amount /= 2;
fee_amount = fee_amount.toFixed(3) + ' ' + approve_amounts.token;
transfers_array.push({to: 'mrarturs', amount: fee_amount, memo: 'Комиссия.'});
transfers_array.push({to: 'denis-skripnik', amount: fee_amount, memo: 'Комиссия.'});
console.log(JSON.stringify(transfers_array));
await methods.transfers(transfers_array);
await amounts.removeAmounts(approve_amounts._id)
await finished.updateAmounts(approve_amounts.amount, approve_amounts.token, losing_array, winning_array, approve_amounts.start_round_block, bn, loser+1, sha3);
await methods.sendJson('completion', {amount: approve_amounts.amount, token: approve_amounts.token, loser: losing_array, winning: winning_array, start_round_block: approve_amounts.start_round_block, end_round_block: bn, signature_hash: sha3, loser_number: loser+1});
} else if (transfers.length === 2) {
    await amounts.updateAmounts(amount, token, transfers, approve_amounts.start_round_block);
await methods.sendJson('join', {amount, token, participants: transfers, start_round_block: approve_amounts.start_round_block});
} else if (transfers.length === 1) {
    if (Number.isInteger(amount) === true) {
        await amounts.updateAmounts(amount, token, transfers, bn);
        await methods.sendJson('join', {amount, token, participants: transfers, start_round_block: approve_amounts.start_round_block});
    } else {
    let transfers_array = [];
            transfers_array.push({to: opbody.from, amount: opbody.amount, memo: 'Bet return: it is not an integer.'});
            await methods.transfers(transfers_array);
        }
}
} else {
    if (Number.isInteger(amount) === true) {
        await amounts.updateAmounts(amount, token, [opbody.from], bn);
        await methods.sendJson('join', {amount, token, participants: [opbody.from], start_round_block: bn});
    } else {
    let transfers_array = [];
            transfers_array.push({to: opbody.from, amount: opbody.amount, memo: 'Bet return: it is not an integer.'});
            await methods.transfers(transfers_array);
        }
}
ok_ops_count = 1;
} else {
ok_ops_count = 0;
}
               break;
    default:
                    //неизвестная команда
            }
        }
        return ok_ops_count;
    }

let PROPS = null;
let bn = 0;
let last_bn = 0;
let delay = SHORT_DELAY;
async function getNullTransfers() {
    PROPS = await methods.getProps();
            const block_n = await bdb.getBlock(PROPS.last_irreversible_block_num);
bn = block_n.last_block;

delay = SHORT_DELAY;
while (true) {
    try {
        if (bn > PROPS.last_irreversible_block_num) {
            // console.log("wait for next blocks" + delay / 1000);
            await helpers.sleep(delay);
            PROPS = await methods.getProps();
        } else {
            if(0 < await processBlock(bn)) {
                delay = SHORT_DELAY;
            } else {
                delay = LONG_DELAY;
            }
            bn++;
            await bdb.updateBlock(bn);
        }
    } catch (e) {
        console.log("error in work loop" + e);
        await helpers.sleep(1000);
        }
    }
}

setInterval(() => {
    if(last_bn == bn) {

        try {
                process.exit(1);
        } catch(e) {
            process.exit(1);
        }
    }
    last_bn = bn;
}, SUPER_LONG_DELAY);

async function forPage(rounds_type) {
    let a_arr = [];
            if (rounds_type === 'active') {
    let all_amounts = await amounts.findAllAmounts();
    for (let amount of all_amounts) {
        a_arr.push({amount: amount.amount, token: amount.token, transfers: amount.transfers, start_round_block: amount.start_round_block});
    }
    } else if (rounds_type === 'finished') {
        let all_amounts = await finished.findAllAmounts();
        for (let amount of all_amounts) {
            a_arr.push({amount: amount.amount, token: amount.token, winning: amount.winning_participants, losing: losing_participants, start_round_block: amount.start_round_block, end_round_block: amount.end_round_block, signature_hash: amount.signature_hash, loser_number: amount.loser_number});
        }
    }
    if (conf.active === true) {
    return JSON.stringify(a_arr);
} else {
return 'Is not active plugin Golos';
}
}

async function servicePost() {
    let now = await helpers.unixTime();
    let now_date = new Date(now * 1000);
    let year = now_date.getUTCFullYear();
let month = now_date.getUTCMonth()+1;
    let date = now_date.getUTCDate();
let hours = now_date.getUTCHours();
    let minutes = now_date.getUTCMinutes();
let seconds = now_date.getUTCSeconds();
    let update_date = date + '.' + month + '.' + year + ' ' + hours + ':' + minutes + ':' + seconds;
    let all_amounts = await amounts.findAllAmounts();
    let a_str = `Hello. We publish active rounds at the time of the update
(Last updated ${update_date} GMT):
The current active rounds (no interval of 5 minutes) can be viewed [here] (https://dpos.space/loser-game/steem). Also on the page there is an opportunity to quickly join the round.
`;
if (all_amounts.length > 0) {
for (let amount of all_amounts) {
a_str += `- ${amount.amount} ${amount.token}. participants: ${amount.transfers.join(',')}
`;
    }
} else {
    a_str += 'There are no active rounds.';
}
a_str += `
Join us! Just send any amount being an integer to @${conf.login} with any memo. If there is no such amount, a new round will be created. If there is, you will join the existing one. Upon reaching three participants, a random number from 0 to 2 is generated, and all, except the participant matching the generated one, receive 47.5% of the total bet amount of this round.`;
let permlink = 'rounds-list';
let title = 'Active Loser-game rounds';
await methods.publickPost(permlink, title, a_str);
}

async function finishedRounds() {
        let rounds = await finished.findAllAmounts();
    if (rounds.length > 0) {
        let text = `Hello. Below are the rounds that have been completed in the last 6 hours.
        `;
        for (let round of rounds) {
    text += `## in the amount of ${round.amount} ${round.token}
Starting block of round ${round.start_round_block}, the block of the last participant of the round ${rounds.end_round_block}.
    
Lost a participant #${round.loser_number} @${round.losing_participants[0]}. Hash of witnesssignature in blocks: ${round.signature_hash}.
    The proof of the honesty of the random number generator: https://dpos.space/randomblockchain/?chain=steem&participants=3&block1=${round.start_round_block}&block2=${round.end_round_block}.
    ### Won:
    `;
    for (let winning_participant of round.winning_participants) {
    text += `- @${winning_participant.login} got ${winning_participant.amount}
    `;
    } // end for of round.winning_participants
    } // end for of rounds.
    
    text += `
    Read about the random number generator in Russian [here](https://golos.id/ru/@denis-skripnik/ru-generator-sluchaijnykh-chisel-na-baze-dannykh-iz-bch).
    Post with actual rounds [here](https://golos.id/stats/@loser/rounds-list).`;
    let now = await helpers.unixTime();
    let permlink = 'finished-' + now;
    let title = 'Completed Loser-game rounds at the last 6 hours';
    await methods.publickPost(permlink, title, text);
await finished.removeAmounts();
} // end if rounds > 0.
    }
    
    async function isActivePlugin() {
        if (conf.active === true) {
            getNullTransfers()
        methods.updateAccount(conf.posting_key, conf.login);
        new CronJob('0 0 0 * * *', finishedRounds, null, true);
        new CronJob('0 0 6 * * *', finishedRounds, null, true);
        new CronJob('0 0 12 * * *', finishedRounds, null, true);
        new CronJob('0 0 18 * * *', finishedRounds, null, true);
        
        setInterval(() => servicePost(), 300000);
        } else {
        console.log('Is not active plugin Steem.');
        }
        }

        module.exports.isActivePlugin = isActivePlugin;
module.exports.forPage = forPage;
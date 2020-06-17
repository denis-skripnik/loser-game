const conf = require('./config.json');
var steem = require('steem');
steem.api.setOptions({ url: conf.node});

async function getOpsInBlock(bn) {
    return await steem.api.getOpsInBlockAsync(bn, false);
  }

  async function getBlockHeader(block_num) {
  return await steem.api.getBlockHeaderAsync(block_num);
  }
  
  async function getTransaction(trxId) {
  return await steem.api.getTransactionAsync(trxId);
  }

  async function getProps() {
  return await steem.api.getDynamicGlobalPropertiesAsync();
  }
  
async function updateAccount(pk,test_user) {
    let 					metadata={};
    metadata.profile={};
    metadata.profile.name = 'Loser service';
    metadata.profile.profile_image = "https://images.steem.io/DQmaACdPBziT6tgpJ1QWSFpms4pXQWzFUYvKY7KVQUNLA2H/2343887_0.jpg";
    metadata.profile.cover_image = "https://images.steem.io/DQmPxUB81uPPhehdf7eye7BucRNCBoLH6w1Lvf3iuMkVj6b/%D0%91%D0%B5%D0%B7%20%D0%BD%D0%B0%D0%B7%D0%B2%D0%B0%D0%BD%D0%B8%D1%8F.jpg";
    metadata.profile.about= `Раунды вы создаёте сами, отправляя суммы. Если суммы такой нет, происходит создание нового. Если есть, присоединяетесь к существующему.`;
    metadata.profile.pinnedPosts = ["stats/rounds"];
    let json_metadata=JSON.stringify(metadata);
    return await steem.broadcast.accountMetadataAsync(pk,test_user,json_metadata);
}

async function getAccount(login) {
    return await steem.api.getAccountsAsync([login]);
    }

async function transfers(array) {
    let now = new Date().getTime() + 18e5,
    expire = new Date(now).toISOString().split('.')[0];
    let newTx = [];
for (let transfer of array) {
    newTx.push(['transfer', {from: conf.login, to: transfer.to, amount: transfer.amount, memo: transfer.memo}]);
}

const current = await getProps();
var blockid = current.head_block_id;
n = [];
for (var i = 0; i < blockid.length; i += 2)
{
    n.push(blockid.substr(i, 2));
}
let hex = n[7] + n[6] + n[5] + n[4];
let refBlockNum = current.head_block_number & 0xffff;
let refBlockPrefix = parseInt(hex, 16)
let trx = {
    'expiration': expire,
    'extensions': [],
    'operations': newTx,
    'ref_block_num': refBlockNum,
    'ref_block_prefix': refBlockPrefix
};
let trxs = "";
try {
    trxs = await steem.auth.signTransaction(trx, {"active": conf.active_key});
} catch (error) {
    console.log("Не удалось подписать транзакцию: " + error.message);
}
try {
const broadcast_trx_sync = await steem.api.broadcastTransactionSynchronousAsync(trxs);
console.log(JSON.stringify(broadcast_trx_sync));
return broadcast_trx_sync.id;
} catch(e) {
console.log('Error: ' + e);
    return 0;
}
}

async function publickPost(body) {
    let now = new Date().getTime() + 18e5,
    expire = new Date(now).toISOString().split('.')[0];
    let newTx = [];
        let wif = conf.posting_key;
    let parentAuthor = '';
    let parentPermlink = 'stats';
    let author = conf.login;
let permlink = 'rounds-list';
let title = 'Активные раунды Loser-game';
let jsonMetadata = {};
jsonMetadata.app = 'Loser-game/1.0';
jsonMetadata.tags = ["ru--megagalxyan","ru--igra","game","ru--statistika"];
            newTx.push(['comment', {parent_author: parentAuthor, parent_permlink: parentPermlink,author:conf.login,permlink, title, body, json_metadata: JSON.stringify(jsonMetadata)}]);
    const current = await getProps();
var blockid = current.head_block_id;
n = [];
for (var i = 0; i < blockid.length; i += 2)
{
n.push(blockid.substr(i, 2));
}
let hex = n[7] + n[6] + n[5] + n[4];
let refBlockNum = current.head_block_number & 0xffff;
let refBlockPrefix = parseInt(hex, 16)
let trx = {
'expiration': expire,
'extensions': [],
'operations': newTx,
'ref_block_num': refBlockNum,
'ref_block_prefix': refBlockPrefix
};
let trxs = "";
try {
trxs = await steem.auth.signTransaction(trx, {"posting": conf.posting_key});
} catch (error) {
console.log("Не удалось подписать транзакцию: " + error.message);
}
try {
const broadcast_trx_sync = await steem.api.broadcastTransactionSynchronousAsync(trxs);
console.log(JSON.stringify(broadcast_trx_sync));
return broadcast_trx_sync.id;
} catch(e) {
console.log('Error: ' + e);
return 0;
}
}

async function sendJson(action, data) {
    let json = {};
    json.contractName = 'loser-game';
    json.contractAction = action;
    json.contractPayload = data;
        return await steem.broadcast.customJsonAsync(conf.posting_key, [], [conf.login], 'loser-game', JSON.stringify(json));
    }
    
/** time in milliseconds */
module.exports.getCurrentServerTimeAndBlock = async function() {
    let props = await getProps();
    if(props.time) { 
        return {
            time : Date.parse(props.time),
            block : props.last_irreversible_block_num
        };
    }
    throw "Current time could not be retrieved";
}

module.exports.getBlockSignature = async function (block) {
    var b = await steem.api.getBlockAsync(block);
    if(b && b.witness_signature) {
        return b.witness_signature;
    } 
    throw "unable to retrieve signature for block " + block;
}

      module.exports.getOpsInBlock = getOpsInBlock;
module.exports.getBlockHeader = getBlockHeader;
module.exports.getTransaction = getTransaction;
	  module.exports.getProps = getProps;
      module.exports.updateAccount = updateAccount;
module.exports.getAccount = getAccount;
module.exports.transfers = transfers;
module.exports.publickPost = publickPost;
module.exports.sendJson = sendJson;
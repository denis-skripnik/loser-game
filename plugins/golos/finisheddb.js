var Datastore = require('nedb')
, db = new Datastore({ filename: 'plugins/golos/databases/finished.db', autoload: true });
  db.persistence.setAutocompactionInterval(1000 * 60);

function updateAmounts(amount, token, losing_participants, winning_participants, start_round_block, end_round_block, loser_number, signature_hash) {
  return new Promise((resolve, reject) => {
  db.update({amount, token}, {amount, token, losing_participants, winning_participants, start_round_block, end_round_block, loser_number, signature_hash}, {upsert:true}, (err, result) => {
if (err) {
  reject(err);
} else {
  resolve(result);
}
  });
  });
}

function removeAmounts() {
  return new Promise((resolve, reject) => {
    db.remove({}, {multi: true}, function (err, numRemoved) {
if (err) {
  reject(err);
} else {
       resolve(numRemoved);
}
    });
  });
}

function findAllAmounts() {
  return new Promise((resolve, reject) => {
  db.find({}, (err, result) => {
if (err) {
  reject(err);
} else {
       resolve(result);
}
      });
});
}

module.exports.updateAmounts = updateAmounts;
module.exports.removeAmounts = removeAmounts;
module.exports.findAllAmounts = findAllAmounts;
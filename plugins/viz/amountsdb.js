var Datastore = require('nedb')
, db = new Datastore({ filename: 'plugins/viz/databases/amounts.db', autoload: true });
  db.persistence.setAutocompactionInterval(1000 * 60);

  function getAmounts(amount, token) {
    return new Promise((resolve, reject) => {
        db.findOne({amount, token}, (err,data) => {
               if(err) {
                      reject(err);
               } else {
                      resolve(data);
               }
        });
    });
}

function updateAmounts(amount, token, transfers, start_round_block) {
  return new Promise((resolve, reject) => {
  db.update({amount, token}, {amount, token, transfers, start_round_block}, {upsert:true}, (err, result) => {
if (err) {
  reject(err);
} else {
  resolve(result);
}
  });
  });
}

function removeAmounts(db_id) {
  return new Promise((resolve, reject) => {
    db.remove({_id: db_id}, {}, function (err, numRemoved) {
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

module.exports.getAmounts = getAmounts;
module.exports.updateAmounts = updateAmounts;
module.exports.removeAmounts = removeAmounts;
module.exports.findAllAmounts = findAllAmounts;
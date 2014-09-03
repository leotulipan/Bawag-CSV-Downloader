var transactions = []
/*cash: [
  {
    date: '3/7/2014',
    amount: -213.39,
    payee: 'Kroger',
    category: 'Groceries',
    memo: 'this is a memo'
  },
  {
    date: '3/6/2014',
    amount: -8.16,
    payee: 'Starbucks',
    category: 'Dining Out:Coffee'
  }
]
}; */

var qif = require('qif');

var fs = require('fs')
var sys = require('sys')

var csv = require('csv-parser')

/*
Maybe more synchronous with this snippet in the future?

function parseCsvFile(fileName, callback){
  var stream = fs.createReadStream(fileName)
*/

fs.createReadStream('my-secret-sample.csv')
  .pipe(csv({
    raw: false,    // do not decode to utf-8 strings
    headers: ["KtoNr", "memo", "Valuta", "date", "amount", "Balance", "Currency"],
    separator: ';' // specify optional cell separator
    }))
  .on('data', function(data) {

    // replace , with . in amount
    // Umlaut/ UTF8 Bug / Windows Encoding
    console.log(data["amount"].replace(".","").replace(",","."))
    transactions.push({ "amount": data["amount"].replace(".","").replace(",","."), "memo": data["memo"], "date": data["date"] })
}).on('end', function() {
  console.log("Read", transactions.length, "Transactions from CSV")
  qif.writeToFile({cash: transactions}, './out.qif', function (err, qifData) {
    if(err)
      {
        console.log("Err: ", err, "qif ", qifData)
      }

  });

});

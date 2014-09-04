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

var payees = {
  Hofer: ["HOFER DANKT", "Alltag: Lebensmittel"],
  Merkur: ["MERKUR DANKT", "Alltag: Lebensmittel"],
  Fressnapf: ["FRESSNAPF", "Tiere: Futter"],
  A1: ["A1 RECHNUNG", "Monatliche Fixkosten: Telefon & Internet"],
  Bankgebühren: ["KARTENGEBUEHR", "Projekte: Steuern & Gebühren"],
  Bauhaus: ["BAUHAUS", "Projekte: Wohnen, Möbel, Garten"],
  "Bob Rechnung": ["BOB RECHNUNG", "Monatliche Fixkosten: Telefon & Internet"],
  DM: [ "DM-FIL.", "Alltag: Medizin & Gesundheit"],
  Bankgebühren: ["Einbehaltene KESt", "Projekte: Steuern & Gebühren"]

}

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
    var payee = "", category = ""
    // replace , with . in amount (US format)
    data["amount"] = data["amount"].replace(".","").replace(",",".")
    var info = data["memo"].split(/(AT|BG|FE|IG|MC|OG|VB|VD)\/(\d\d\d\d\d\d\d\d\d)\s/)
    //remove leading 0 in transaction/checknumber
    info[2] = info[2].replace(/^0*/,'')

    for(key in payees){
     if( (info[0] + info[3]).match(payees[key][0]) )
       {
         //console.log(key, payees[key][1])
         payee = key
         category = payees[key][1]
       }
    }
   if(info[0].match(/Bezahlung Maestro/))
     {

              console.log("replaced:", info[0])
      info[0] = info[0].replace(/Bezahlung Maestro\s*(\d*\.\d\d\s*|\s*)/,"" )

     }

    transaction = {"amount": data["amount"],
                   "payee": payee,
                   "memo": info[0] + ' '+ info[3],
                   "checknumber": info[2],
                   "category": category,
                   "date": data["date"] }

    //console.log("Transaction:", transaction)
    transactions.push( transaction )
}).on('end', function() {
  console.log("Read", transactions.length, "Transactions from CSV")
  qif.writeToFile({cash: transactions}, './out.qif', function (err, qifData) {
    if(err)
      {
        console.log("Err: ", err, "qif ", qifData)
      }

  });

});

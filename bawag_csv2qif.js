var qif = require('qif');

var fs = require('fs')
// var sys = require('sys')

var csv = require('csv-parser')

var cmdline = require('commander');

var Papa = require('papaparse')


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
  DM: ["DM-FIL.", "Alltag: Medizin & Gesundheit"],
  Bankgebühren: ["Einbehaltene KESt", "Projekte: Steuern & Gebühren"]
}

var mc_csv_config = {
  delimiter: ";",
  newline: "",
  quoteChar: '"',
  header: true,
  dynamicTyping: true,
  preview: 0,
  encoding: "latin1",
  worker: false,
  comments: false,
  step: undefined,
  complete: undefined,
  error: undefined,
  download: false,
  skipEmptyLines: true,
  chunk: undefined,
  fastMode: undefined,
  beforeFirstChunk: undefined,
  withCredentials: undefined
}

//   ,
//   error: function (err, file, inputElem, reason) {
//     // executed if an error occurs while loading the file,
//     // or if before callback aborted for some reason
//     console.log("ERROR: " + err + "\n" + reason)
//   }
// }

function prepare_bawag(data) {
  console.log("we got data")
  var payee = "",
    category = ""
  // replace , with . in amount (US format)
  data["amount"] = data["amount"].replace(".", "").replace(",", ".")

  // VA: Scheckeinreichung
  var info = data["memo"].split(/(AT|BG|FE|IG|MC|OG|VB|VD|VA|BX)\/(\d\d\d\d\d\d\d\d\d)/)

  //remove leading 0 in transaction/checknumber, last line in ANSI File returns undefined, so only do if info[2] exists
  if (info[2]) {
    info[2] = info[2].replace(/^0*/, '')
  }

  for (key in payees) {
    if ((info[0] + info[3]).match(payees[key][0])) {
      //console.log(key, payees[key][1])
      payee = key
      category = payees[key][1]
    }
  }
  if (info[0].match(/Bezahlung Maestro/)) {
    info[0] = info[0].replace(/Bezahlung Maestro\s*(\d*\.\d\d\s*|\s*)/, "")
  }
  if (info[0].match(/Gutschrift .berweisung/)) {
    info[0] = info[0].replace(/Gutschrift .berweisung\s*/, "")
  }
  if (info[0].match(/Abbuchung Einzugserm.chtigung/)) {
    info[0] = info[0].replace(/Abbuchung Einzugserm.chtigung\s*(\d*|\s*).*BKAUATWWXXX AT\d*/, "")
  }
  if (info[0].match(/Auszahlung Maestro/))
  // this one doesnt work:
  {
    info[0] = info[0].replace(/Auszahlung Maestro(\s|\.|\d)*AUTOMAT/, "Bankomat")
  }
  if (info[0].match(/Abbuchung Einzugserm.chtigung/)) {
    info[0] = info[0].replace(/Abbuchung Einzugserm.chtigung\s*/, "")
  }
  if (info[0].match(/Gutschrift EU-Standardzahlung/)) {
    info[0] = info[0].replace(/Gutschrift EU-Standardzahlung\s*(\d*|\s*)/, "")
  }
  if (info[0].match(/Abbuchung Onlinebanking/)) {
    info[0] = info[0].replace(/Abbuchung Onlinebanking\s*(\d*|\s*)/, "")
  }
  if (info[0].match(/Abbuchung Dauerauftrag/)) {
    info[0] = info[0].replace(/Abbuchung Dauerauftrag\s*(\d*|\s*)/, "")
  }

  /* https://stackoverflow.com/questions/1133770/how-do-i-convert-a-string-into-an-integer-in-javascript */

  check_input = +info[2]
  check_cmd = +cmdline.check
  if ((check_cmd != 0 && check_input >= check_cmd) ||
    check_cmd === 0) {
    /* console.log("no: -"+ info[2] + "- ("+ cmdline.check +")"); */

    transaction = {
      "amount": data["amount"],
      "payee": payee,
      "memo": info[0] + ' ' + info[3],
      "checknumber": info[2],
      "category": category,
      "date": data["date"]
    }
    /*console.log("Transaction:", transaction)*/
    transactions.push(transaction)
  }
}


cmdline
  .version('0.0.2')
  .option('-i, --input [filename]', 'Input file w/out .csv ending. Default "input"', "input")
  .option('-o, --output [filename]', 'Output file name w/out .qif ending. Default "output"', "output")
  .option('-c, --check [999]', 'Starting from (and including) Checknumber 999', 0)
  /* .option('-d, --date [YYYY-MM-DD]', 'Starting from Date', "1978-04-27") */
  .parse(process.argv);

/*
Maybe more synchronous with this snippet in the future?

function parseCsvFile(fileName, callback){
  var stream = fs.createReadStream(fileName)
*/
// console.log("input: ", cmdline.input)
// console.log("output: ", cmdline.output)
// process.exit(0);

// Encoding: https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings
console.log("File: " + cmdline.input + ".csv");
// fs.createReadStream(cmdline.input + ".csv", {
//   encoding: 'latin1'
// })

var csv_file = fs.readFileSync(cmdline.input + ".csv", {
  encoding: 'latin1'
});
var json_data = Papa.parse(csv_file, mc_csv_config)

console.dir(json_data)
//   csv({
//   raw: false, // do not decode to utf-8 strings
//   headers: ["KtoNr", "memo", "Valuta", "date", "amount", "Balance", "Currency"],
//   separator: ';' // specify optional cell separator
// })
// .on('data', prepare_bawag).on('end', function () {
//   console.log("Read", transactions.length, "Transactions from CSV")
//   console.log("Last Transaction: ", transactions[0].date, " ", transactions[0].checknumber)
//   qif.writeToFile({
//     cash: transactions
//   }, cmdline.output + ".qif", function (err, qifData) {
//     if (err) {
//       console.log("Err: ", err, "qif ", qifData)
//     }

//   });

// });
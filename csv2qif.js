/**
 * 
 * next steps:
 *  replace payee (create regex-es)
 *  determine categories (create json config)
 *  safe to qif
 *  refactor to ts
 *  refactor mc to a class
 */


var fs = require('fs')

var cmdline = require('commander');

// Inspiration via https://dev.to/jorinvo/csv-challenge-1al/comments
var Papa = require('papaparse')

var qif = require('qif');

// Iso Regex http://regexlib.com/REDetails.aspx?regexp_id=3344&AspxAutoDetectCookieSupport=1
var iso8601_regex = /^(?:(?=[02468][048]00|[13579][26]00|[0-9][0-9]0[48]|[0-9][0-9][2468][048]|[0-9][0-9][13579][26])\d{4}(?:(-|)(?:(?:00[1-9]|0[1-9][0-9]|[1-2][0-9][0-9]|3[0-5][0-9]|36[0-6])|(?:01|03|05|07|08|10|12)(?:\1(?:0[1-9]|[12][0-9]|3[01]))?|(?:04|06|09|11)(?:\1(?:0[1-9]|[12][0-9]|30))?|02(?:\1(?:0[1-9]|[12][0-9]))?|W(?:0[1-9]|[1-4][0-9]|5[0-3])(?:\1[1-7])?))?)$|^(?:(?![02468][048]00|[13579][26]00|[0-9][0-9]0[48]|[0-9][0-9][2468][048]|[0-9][0-9][13579][26])\d{4}(?:(-|)(?:(?:00[1-9]|0[1-9][0-9]|[1-2][0-9][0-9]|3[0-5][0-9]|36[0-5])|(?:01|03|05|07|08|10|12)(?:\2(?:0[1-9]|[12][0-9]|3[01]))?|(?:04|06|09|11)(?:\2(?:0[1-9]|[12][0-9]|30))?|(?:02)(?:\2(?:0[1-9]|1[0-9]|2[0-8]))?|W(?:0[1-9]|[1-4][0-9]|5[0-3])(?:\2[1-7])?))?)$/

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

var payee_transform = {
  "HEDGEYE RISK MGMT": "Hedgeye",
  "HOFER DANKT": "Hofer",
  "AMAZON.CO.UK": "Amazon",
  "Amazon UK Marketplace": "Amazon",
  "EASYJET000    ET44K39": "Easyjet"
  // Easyjet: /^EASYJET/i
  // PAYPAL *TANGXIAOLAN => "Paypal"
}

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
  // Encoding: https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings
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

var mc_fields = ["Buchungsdatum",
  "Transaktionsdatum",
  "Abrechnungsdatum",
  "Rechnungstext",
  "Kartennummer",
  "Währung",
  "Betrag in Fremdwährung",
  "Währung",
  "Manipulationsentgelt in EUR",
  "Währung",
  "Betrag",
  "Verwendeter Umrechnungskurs"
]

var mc_date_field = "Buchungsdatum";

function parse_bawag(data) {
  console.log("we got data")
  var payee = "",
    category = ""
  // replace , with . in amount (US format)
  data["amount"] = to_us(data["amount"])

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
// convert amount to US format "replace , with ."
function to_us(amount) {
  return amount.replace(".", "").replace(",", ".");
}

//     "Rechnungstext": "Amazon UK Marketplace  800-279-6620  LUX",
function get_payee(desc) {
  return desc.substr(0, 22).trim()
}

//     "Betrag in Fremdwährung": "-15,99",
//     "Manipulationsentgelt in EUR": "-0,30",
//     "Verwendeter Umrechnungskurs": "0,86955"
function create_memo(line) {
  if (line["Betrag in Fremdwährung"] === line["Betrag"]) return ""

  if (line["Verwendeter Umrechnungskurs"] === "0,00") {
    kurs = ""
  } else {
    kurs = " / " + line["Verwendeter Umrechnungskurs"] + " (Kurs) "
  }

  return "Betrag: " + line["Betrag in Fremdwährung"].replace(/-/, "¤") +
    kurs +
    line["Manipulationsentgelt in EUR"].replace(/-/, "+ € ") + " (Gebühr)"
}

// convert json to transaction array
function convert_mc(lines) {
  lines.map(function (line) {
    transaction = {
      "date": line["Buchungsdatum"],
      "amount": to_us(line["Betrag"]),
      "payee": get_payee(line["Rechnungstext"]),
      "memo": create_memo(line),
      // "checknumber": info[2],
    }
    // transaction.category = get_category(transactions.payee)
    console.log("Transaction: ", transaction)
    transactions.push(transaction)
  })
}

cmdline
  .version('0.0.3')
  .option('-i, --input [filename]', 'Input file (.csv is added if needed). Default "input.csv"', "input")
  .option('-o, --output [filename]', 'Output file name w/out .qif ending. Default "output"', "output")
  .option('-d, --date [YYYY-MM-DD]', 'Starting from Date', iso8601_regex, "1970-01-01")
  .parse(process.argv);

if (cmdline.date === true) {
  console.error('Not a valid date!');
  process.exit(1);
}

var input_filename = cmdline.input
if (input_filename.match(/(?:\.([^.]+))?$/)[1] == undefined) {
  input_filename += ".csv"
}

try {
  fs.accessSync(input_filename)
} catch (err) {
  console.error(input_filename + ' file not found');
  process.exit(1);
}

var csv_file = fs.readFileSync(input_filename, {
  encoding: 'latin1'
});
var json_data = Papa.parse(csv_file, mc_csv_config)

// Reformat Date "02.11.2017" => iso8601 & filter
json_data.data = json_data.data.map(function (line) {
  line[mc_date_field] = line[mc_date_field].replace(/(\d{1,2})\.(\d{1,2})\.(\d{4})/, "$3-$2-$1")
  // line.Transaktionsdatum = line.Transaktionsdatum.replace(/(\d{1,2})\.(\d{1,2})\.(\d{4})/, "$3-$2-$1")
  // line.Abrechnungsdatum = line.Abrechnungsdatum.replace(/(\d{1,2})\.(\d{1,2})\.(\d{4})/, "$3-$2-$1")
  return line
}).filter(function (line) {
  if (new Date(line[mc_date_field]) >= new Date(cmdline.date)) {
    return line
  }
})

convert_mc(json_data.data)

console.log(json_data.data.length)
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
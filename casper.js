console.log("Starting Casper!");

// Tested with the following version of eBanking
var version = "14.03.19.08"


var casper = require('casper').create();

function $ (selector, el) {
     if (!el) {el = document;}
     return el.querySelector(selector);
}
function $$ (selector, el) {
     if (!el) {el = document;}
     return el.querySelectorAll(selector);
     // Note: the returned object is a NodeList.
     // If you'd like to convert it to a Array for convenience, use this instead:
     // return Array.prototype.slice.call(el.querySelectorAll(selector));
}

casper.start('https://ebanking.bawagpsk.com/InternetBanking/InternetBanking?d=login&svc=BAWAG&ui=html&lang=de', function() {
  var el = this.evaluate(function() {
    return document.querySelector('h3').innerText
  }) ;

  this.echo ("-" + el + "-")
  //  this.fill('form[id="form"]', { dn: '123456789', pin: '123456' }, true);
  //this.echo( document.querySelectorAll('h3').length );

//  this.echo(  document.$('h3').text );

});

//
// casper.thenEvaluate(function() {
//   // this.evaluateOrDie(function() {
//   //         return /logged in/.match(document.title);
//   //     }, 'not authenticated');
//   //this.echo(this.fetchText('h3')[0]);
//   this.echo( document.querySelectorAll('h3').length );
// });

casper.run(function() {
//    this.echo('This is the end my friend. ');
  //  this.debugPage();
    this.exit();
});

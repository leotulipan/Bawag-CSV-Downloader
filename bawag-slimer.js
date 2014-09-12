console.log("Starting Slimer/Phantom!");

// Tested with the following version of eBanking
var version = "14.03.19.08"
// 14.03.19.05.06

var page = require("webpage").create();
var system = require('system');

var dn = system.env["BAWAG_DN"];
var pin = system.env["BAWAG_PIN"];

if(isNaN(parseFloat(dn)))
  {
    console.log("No Login variable BAWAG_DN defined. Check your .env")
    phantom.exit()
  }


page.onConsoleMessage = function (msg) {
    console.log(msg);
};


page.open('https://ebanking.bawagpsk.com/InternetBanking/InternetBanking?d=login&svc=BAWAG&ui=html&lang=de', function() {

  err = page.includeJs("http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js", function() {

    page.evaluate(function(version, dn, pin) {

    /* Get eBanking Version string out of comments */
    var vnr
    $("body").contents().filter(function(){
        return this.nodeType == 8;
    }).each(function(i, e){
        vnr = e.nodeValue.split(" ")[4].split("-")[1];
    });
    if(vnr != version)
    {
      console.log("eBanking Version not supported: " + vnr)
      console.log("Supported Version: " + version)
      // might not work. how to properly exit here?
      return(false)
    }
    else
    {
       console.log( $("h3").first().text() );

       $("input[name='dn']").val(dn)
       $("input[name='pin']").val(pin)
       $("#form").submit()
    }
  }, version, dn, pin );

  console.log("error", err)
  console.log("After first eval")

  // We are now after the submit event. But How do I get at the page?
  // THis code doesnt work. even when wrapped in an additional page.includeJs
  page.evaluate(function() {
     console.log( $("#error_part_text").text() );

   });


  alert("Stop to view screen");

  phantom.exit();
  });
});

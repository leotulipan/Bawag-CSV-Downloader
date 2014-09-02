console.log("Starting Slimer/Phantom!");

// Tested with the following version of eBanking
var version = "14.03.19.08"

var page = require("webpage").create();
var system = require('system');

var dn = system.env["BAWAG_DN"];
var pin = system.env["BAWAG_PIN"];

if(isNaN(parseFloat(dn)))
  {
    console.log("No Login BAWAG_DN defined. Check your .env")
    phantom.exit()
  }


page.onConsoleMessage = function (msg) {
    console.log(msg);
};


page.open('https://ebanking.bawagpsk.com/InternetBanking/InternetBanking?d=login&svc=BAWAG&ui=html&lang=de', function() {

  page.includeJs("http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js", function() {

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
      console.log("eBanking Version no supported: " + vnr)
      console.log("Supported Version: " + version)
      exit();
    }
    else
    {
       console.log( $("h3").first().text() );

       $("input[name='dn']").val(dn)
       $("input[name='pin']").val(pin)
       $("#form").submit()
      // submitLogin(document.loginForm)
     console.log( $("#error_part_text").text() );
     console.log( $(".login-error").text() );

    }
  }, version, dn, pin );
    phantom.exit();
  });
});


/* page.open("https://ebanking.bawagpsk.com/InternetBanking/InternetBanking?d=login&svc=BAWAG&ui=html&lang=de", function() {
  page.includeJs("https://code.jquery.com/jquery-2.1.1.js", function() {
    page.evaluate(function() {
       page.viewportSize = { width:1024, height:768 };
       // in case of:  page.render('screenshot.png')
         if (status == "success") {
             var mainTitle = page.evaluate(function () {
                console.log('message from the web page');
              //  return document.querySelector("h3").textContent;
              return $("h3").first().text();
            });
             console.log("The title of the page is: "+ mainTitle);
         }
         else {
             console.log("Sorry, could not access page. Are your Intertubes connected?");
         }
         page.close();
         phantom.exit();
       });
     }); // includeJS
   }); // page.open */

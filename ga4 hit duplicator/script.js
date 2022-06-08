
(function() {

  /*
    Enter your measurement IDS into the variable below

  */
  var measurementIds = ["G-12345-1"];
  
    // We should not run this twice, if the sendBeacon has been already modified, abort
    if(navigator.sendBeacon && navigator.sendBeacon.toString().indexOf('native code') !== -1){               
        // Helper Convert QueryString to an Object 
        var queryString2Object = function queryString2Object(str) {
            return (str || document.location.search).replace(/(^\?)/, "").split("&").map(function(n) {
                return n = n.split("="),
                this[n[0]] = decodeURIComponent(n[1]),
                this;
            }
            .bind({}))[0];
        };
        // Helper Convert an Object to a QueryString
        var Object2QueryString = function Object2QueryString(obj) {
            return Object.keys(obj).map(function(key) {
                return key + '=' + encodeURIComponent(obj[key]);
            }).join('&');
        };        
        try {
            // Monkey Patch, sendBeacon 
            var proxied = window.navigator.sendBeacon;            
            window.navigator.sendBeacon = function() {
                // Make an arguments copy and modify the Measurement ID
                var args = Array.prototype.slice.call(arguments);
                var _this = this;
                if (args && args[0].match(/analytics\.google\.com|google-analytics\.com.*v\=2\&/)) {
                    var payload = queryString2Object(args[0]);
                    measurementIds.forEach(function(id){
                        payload.tid = id;
                        args[0] = Object2QueryString(payload);
                        proxied.apply(_this, args);                          
                    });                                  
                }
                return proxied.apply(this, arguments);
            }
            ;
        } catch (e) {
            // In case something goes wrong, let's apply back the arguments to the original function
            return proxied.apply(this, arguments);
        }        
    }
}
)(); 

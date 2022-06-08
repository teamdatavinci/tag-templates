# How to Send GA4 Events to Multiple Ids without duplicating tags

Steps:
1. Create Custom HTML tag. Insert above given script in the custom HTML Tag
2. Add in the array of measurement IDS you want to send the hits to in addition to your base property
3. Set the Custom HTML tag **in sequencing to fire before the GA4 Config tag that you already have**
---
## How the code works
This snippet code is pretty straightforward, there's only one thing we need to configure, and it's the first variable with the Measurement IDs to where we want to send the data.


Note: You should only add the secondary account, the main Measurement ID on the GA4 Config that doesn't need to be added here.

`var measurementIds = ["G-MEASUREMENTID-1", "G-MEASUREMENTID-2"]; `

One problem with Monkey Patching functions is that they may have been already modified by some other scripts... So in order to be safe on our side, we're aborting the patching if the current navigator.sendBeacon has been already modified.

`if(navigator.sendBeacon && navigator.sendBeacon.toString().indexOf('native code') !== -1){ `


Next in line are 2 helper functions, queryString2Object and Object2QueryString , these are not needed since we could use a replace or a regex to do the work, but this way everything is cleaner. First5 one takes a query string:

`v=2&tid=G-122345-1 `

And converts it to an Object

`{
   v: "1",
   tid: "G-122345-1"
} `

Now we can easily update any payload values with no risk of writing a wrong regex or doing a bad text replace. The second function does the inverse task, converts the object back to a QueryString

Now, we'll be wrapping everything between a try && catch statement, if for ANY reason anything fails, we'll send the hit back to the original function. We really want to have the original request to be sent despite the duplicate ones that may fail at some point.

Let's now check how the Monkey Patching is done, first of all, since we're going to modify the original function, we need to save a reference to the original function:

`var proxied = window.navigator.sendBeacon;  `

In the first place, we want to keep the current call arguments intact, that's why we're doing a copy of them, and then we'll use this copy rather than the original ones.

`window.navigator.sendBeacon = function() {
    var args = Array.prototype.slice.call(arguments);
    var _this = this; `

Our next check is verifying that the current beacon is for GA4, we don't really want or need to mess around with other hits (again, let's stay in the safe place :) )

`if (args && args[0].match(/analytics\.google\.com|google-analytics\.com.*v\=2\&/)) { `

Once, we know that the current hit is a GA4 Hit, we'll convert the payload to an object

`var payload = queryString2Object(args[0]); `
And the last thing we're doing is looping across our secondary measurement IDs while updating the &tid parameter, then finally we send the hit to Google Analytics 4 Endpoint using for that the "original" reference we saved at the start.

`measurementIds.forEach(function(id){
    payload.tid = id;
    args[0] = Object2QueryString(payload);
    proxied.apply(_this, args);                          
});    `

The last line will take care of sending the original hit ( this is why we don't need to add the main Measurement ID into the configuration )

`return proxied.apply(this, arguments); `
Well, there's still a final one, the one within the catch statement, as we mentioned before if ANYTHING goes wrong we'll still send back the original hit, this assures that despite the code fails, we'll have our main configured id recording the data.
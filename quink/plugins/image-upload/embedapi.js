function embedded_image_upload(frame) {
    //initialize communication
    this.frame = frame;
    //this.stack = [] //callback stack
    this.callbacks = {}; //successor to stack
    this.encode = embedded_image_upload.encode;
    //List of functions extracted with this:
    //Run in firebug on http://svg-edit.googlecode.com/svn/trunk/docs/files/svgcanvas-js.html
    var functions = ["getImageElementAsString"];

    //TODO: rewrite the following, it's pretty scary.
    for (var i = 0; i < functions.length; i++) {
        this[functions[i]] = (function (d) {
            return function () {
                var t = this; //new callback
                for (var g = 0, args = []; g < arguments.length; g++) {
                    args.push(arguments[g]);
                }
                var cbid = t.send(d, args, function () {
                });  //the callback (currently it's nothing, but will be set later

                return function (newcallback) {
                    t.callbacks[cbid] = newcallback; //set callback
                };
            };
        })(functions[i]);
    }
    //TODO: use AddEvent for Trident browsers, currently they dont support SVG, but they do support onmessage
    var t = this;
    window.addEventListener("message", function (e) {
        if (e.data.substr(0, 4) === "ImgU") { //match the 4 character style used by method draw
            var data = e.data.substr(4);
            var cbid = data.substr(0, data.indexOf(";"));
            if (t.callbacks[cbid]) {
                if (data.substr(0, 6) !== "error:" && data.substr(cbid.length + 1) !== "error:") {
                    var nextParm = eval("(" + data.substr(cbid.length + 1) + ")");
                    t.callbacks[cbid](nextParm);
                } else {
                    t.callbacks[cbid](data, "error");
                }
            }
        }
        //this.stack.shift()[0](e.data,e.data.substr(0,5) == "ERROR"?'error':null) //replace with shift
    }, false);
}

embedded_image_upload.prototype.setImage = function (newImageHTML) {
    var $imageUploadFrameContents,
        returnValue = false,
        $newImageHTML,
        existingWidth,
        existingHeight;



    $newImageHTML = $(newImageHTML);
    existingWidth = $newImageHTML.css('width');
    existingHeight = $newImageHTML.css('height');

    $imageUploadFrameContents = $('.qk_image_upload_frame').contents();
    if ($imageUploadFrameContents.find('.fileinput').length > 0) {
        //add the existing image, and mark the container with the "exists" css class so the correct buttons are displayed
        //see jasny-bootstrap.css - if the container class (new/exists) doesn't match the button's class (new/exists) then display:none
        $imageUploadFrameContents.find('.fileinput').addClass('fileinput-exists').removeClass('fileinput-new');
        $imageUploadFrameContents.find('.fileinput-preview').append($newImageHTML);
        $imageUploadFrameContents.find('#width-input').val(existingWidth.match(/\d+/g)[0]);
        $imageUploadFrameContents.find('#width-unit-select').val(existingWidth.match(/[^\d]+/g)[0]);
        $imageUploadFrameContents.find('#height-input').val(existingHeight.match(/\d+/g)[0]);
        $imageUploadFrameContents.find('#height-unit-select').val(existingHeight.match(/[^\d]+/g)[0]);

        $newImageHTML.css({ width: "", height: "" });
        returnValue = true;
    }
    return returnValue;
};
embedded_image_upload.prototype.send = function (name, args, callback) {
    var cbid = Math.floor(Math.random() * 31776352877 + 993577).toString();
    //this.stack.push(callback);
    this.callbacks[cbid] = callback;
    for (var argstr = [], i = 0; i < args.length; i++) {
        argstr.push(this.encode(args[i]));
    }
    var t = this;
    setTimeout(function () {//delay for the callback to be set in case its synchronous
        t.frame.contentWindow.postMessage(cbid + ";imageUploader['" + name + "'](" + argstr.join(",") + ")", "*");
    }, 0);
    return cbid;
};




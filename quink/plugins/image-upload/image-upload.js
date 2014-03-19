/*global imageUploader*/
(function ($) {
    'use strict';
    if (!window.imageUploader) {
        window.imageUploader = function ($) {
            var retFunc,
                curConfig;
            curConfig = {example_config_key: "example config value"};
            retFunc = (function () {
                var curConfig = curConfig,
                    self = {};
                //I'm not currently setting any config for image upload, so this isn't being called
                self.setConfig = function (newConfig) {
                    //a.extend(true, curConfig, newConfig);
                    //if (newConfig.extensions)curConfig.extensions = newConfig.extensions
                };
                function isValueKeyed(jQueryItem) {
                    return jQueryItem.val().trim().length > 0;
                }

                self.getImageElementAsString = function () {
                    var $imageElement, $widthInput, $widthUnitSelect, $heightInput, $heightInputSelect, returnValue;

                    $imageElement = $('#image-uploader .fileinput .fileinput-preview');
                    $widthInput = $('#height-input');
                    $widthUnitSelect = $('#height-unit-select');
                    $heightInput = $('#width-input');
                    $heightInputSelect = $('#width-unit-select');

                    if (isValueKeyed($heightInput)) {
                        $imageElement.find("img").css('height', function () {
                            return $heightInput.val() + $heightInputSelect.val();
                        });
                    }
                    if (isValueKeyed($widthInput)) {
                        $imageElement.find("img").css('width', function () {
                            return $widthInput.val() + $widthUnitSelect.val();
                        });
                    }
                    returnValue = $imageElement.html();
                    return returnValue;
                };
                self.init = function () {
                    try {
                        var I = function (d) {
                            if (window.JSON && JSON.stringify) {
                                return JSON.stringify(d);
                            }
                            //for older browsers, hand-code a JSON stringify based on well-documented approach
                            var n = arguments.callee,
                                v;
                            if (typeof d === "boolean" || typeof d === "number") {
                                return d + "";
                            } else if (typeof d === "string") {
                                return'"' + d.replace(/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, function (G) {
                                    return"\\u" + ("0000" + G.charCodeAt(0).toString(16)).slice(-4)
                                }) + '"';
                            } else if (d.length) {
                                for (v = 0; v < d.length; v++) {
                                    d[v] = n(d[v]);
                                }
                                return"[" + d.join(",") + "]";
                            } else {
                                v = [];
                                for (var D in d) {
                                    v.push(n(D) + ":" + n(d[D]));
                                }
                                return"{" + v.join(",") + "}";
                            }
                        };

                        //Handler that receives the message from the
                        window.addEventListener("message", function (d) {
                            var messageNumber = parseInt(d.data.substr(0, d.data.indexOf(";")));
                            try {
                                d.source.postMessage("ImgU" +
                                    messageNumber + ";" + I(eval(d.data)), "*");
                            } catch (ex) {
                                d.source.postMessage("ImgU" + messageNumber + ";error:" + ex.message, "*");
                            }
                        }, false);
                    } catch (ex) {
                        window.embed_error = ex;
                    }
                };
                return self;
            }());
            return retFunc;
        }($);
    }
    $(imageUploader.init);
})(jQuery);

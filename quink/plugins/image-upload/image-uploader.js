/*global imageUploader, EXIF*/
(function ($) {
    'use strict';
    var REGEXP_TRAILING_TEXT = /[^\d]+$/,
        REGEXP_CSS_UNITS = /^(mm|cm|in|pt|pt|pc|px|em|ex|%)$/;

    if (!window.imageUploader) {
        window.imageUploader = function ($) {
            var retFunc,
                curConfig;
            curConfig = {example_config_key: "example config value"};
            //*** return function ***

            retFunc = (function () {
                var curConfig = curConfig,
                    self = {},
                    isScreenValid = true;

                //I'm not currently setting any config for image upload, so this isn't being called
                self.setConfig = function (newConfig) {
                    throw new Error("error: ImageUploader.setConfig not implemented yet;newConfig=" + newConfig);
                    //a.extend(true, curConfig, newConfig);
                    //if (newConfig.extensions)curConfig.extensions = newConfig.extensions
                };
                function isValidTrailingTextOrNone(trailingText) {
                    return !trailingText ||
                        trailingText.trim().match(REGEXP_CSS_UNITS);
                }

                function isValidNonBlankSizeField($element) {
                    var trailingText, returnValue;
                    trailingText = extractTrailingText($element);
                    returnValue = isValidTrailingTextOrNone(trailingText) &&
                        isNumber(extractNumericText($element));
                    return returnValue;
                }

                function isValueKeyed(Selement) {
                    return Selement.val().trim().length > 0;
                }

                function isValidSizeField($element) {
                    return !isValueKeyed($element) || isValidNonBlankSizeField($element);
                }

                /***
                 * Approach for validation: the overall intention is to give the end-user the minimum amount of keying/rekeying. So
                 * a) if the user was probably doing something that should be ignored then ignore it (otherwise the user will have to do more work to spell out that it should be ignored)
                 * b) if it's obvious what the user was trying to do then do it, even if it didn't follow the rules (otherwise the user will have more work to do the same thing)
                 * c) if the user was probably trying to achieve something but it's not clear what that was then flag it
                 *
                 * With this in mind
                 *
                 * For a) if the user clicks "save" without selecting an image, then return an empty string from the plugin, and no image is added to the html. This happens even if some text is typed in the boxes.
                 * For b) if the user enters "50%" in one of the input boxes, then treat this as 50 and % and allow the save.
                 * For c) if the user enters "50pc" then flag this as a red box and don't save.
                 *
                 * @param sizeInputsArray
                 */
                function validateSizeInputs(sizeInputsArray) {
                    $.each(sizeInputsArray, function (index, $element) {
                        if (isValidSizeField($element)) {
                            $element.closest('.form-group').removeClass('has-error').addClass('has-success');
                        } else {
                            isScreenValid = false;
                            $element.closest('.form-group').removeClass('has-success').addClass('has-error');
                        }
                    });
                }

                function isNumber(n) {
                    return !isNaN(parseFloat(n)) && isFinite(n);
                }

                function isImageSelected($image) {
                    return $image[0] && $image[0].outerHTML.trim().length > 0;
                }

                function extractNumericText($screenItem) {
                    var screenItemText, trailingText;
                    screenItemText = $screenItem.val().trim();
                    trailingText = extractTrailingText($screenItem);
                    if (trailingText) {
                        return screenItemText.split(trailingText)[0].trim();
                    } else {
                        return screenItemText;
                    }
                }

                function extractTrailingText($screenItem) {
                    var valueText, matchedArray;
                    valueText = $screenItem.val().trim();
                    matchedArray = valueText.match(REGEXP_TRAILING_TEXT);
                    if (matchedArray && matchedArray.length > 0) {
                        return matchedArray[0].trim();
                    } else {
                        return null;
                    }
                }

                function hasTrailingText($screenItem) {
                    if (extractTrailingText($screenItem) === null) {
                        return false;
                    } else {
                        return true;
                    }
                }

                function handleKeyedCSSInputs($imageElement, inputsArray) {
                    var suffix;
                    $.each(inputsArray, function (index, nextItem) {
                        if (isValueKeyed(nextItem.inputElement)) {
                            if (hasTrailingText(nextItem.inputElement)) {
                                nextItem.unitElement.val(extractTrailingText(nextItem.inputElement));
                                nextItem.inputElement.val(extractNumericText(nextItem.inputElement));
                            }
                            $imageElement.css(nextItem.attribute, function () {
                                suffix = nextItem.suffix ? " " + nextItem.suffix : "";
                                return nextItem.inputElement.val() + nextItem.unitElement.val() + suffix;
                            });
                        }
                    });
                }
                function handleKeyedAttrInputs($imageElement, inputsArray) {
                    $.each(inputsArray, function (index, nextItem) {
                        if (isValueKeyed(nextItem.inputElement)) {
                            $imageElement.attr(nextItem.attribute, function () {
                                return nextItem.inputElement.val().trim();
                            });
                        }
                    });
                }

                self.setImage = function (newImageHTML) {
                    var returnValue = false,
                        $newImageHTML,
                        existingWidth,
                        existingWidthSize,
                        existingWidthUnit,
                        existingHeight,
                        existingHeightSize,
                        existingHeightUnit;

                    $newImageHTML = $(newImageHTML).removeAttr('width').removeAttr('height').css({ width: "", height: "" });

                    $newImageHTML = $(newImageHTML);
                    existingWidthSize = $newImageHTML.width();
                    existingHeightSize = $newImageHTML.height();
                    existingWidth = $newImageHTML.css('width');
                    existingHeight = $newImageHTML.css('height');

                    if ($('.fileinput').length > 0) {
                        //add the existing image, and mark the container with the "exists" css class so the correct buttons are displayed
                        //see jasny-bootstrap.css - if the container class (new/exists) doesn't match the button's class (new/exists) then display:none
                        $('.fileinput').addClass('fileinput-exists').removeClass('fileinput-new');
                        $('.fileinput-preview').append($newImageHTML);
                        if (existingHeightSize > 0) {

                            existingWidthUnit = existingWidth.split(existingWidthSize)[1];
                            $('#width-input').val(existingWidthSize);
                            $('#width-unit-select').val(existingWidthUnit);

                            existingHeightUnit = existingHeight.split(existingHeightSize)[1];
                            $('#height-input').val(existingHeightSize);
                            $('#height-unit-select').val(existingHeightUnit);
                        } else {
                            $('#width-input').val("");
                            $('#width-unit-select').val("%");
                            $('#height-input').val("");
                            $('#height-unit-select').val("%");
                        }
                        $newImageHTML.css({ width: "", height: "" });
                        returnValue = true;
                    }
                    return returnValue;
                };
                function selectRequiredRotationAngle(exifOrientation, requiredRotationRadians) {
                    switch (exifOrientation) {
                        case 3:
                            requiredRotationRadians = Math.PI;
                            break;
                        case 6:
                            requiredRotationRadians = Math.PI / 2;
                            break;
                        case 8:
                            requiredRotationRadians = -Math.PI / 2;
                            break;
                        default :
                        //shouldn't be a default as we've covered all cases of interest
                    }
                    return requiredRotationRadians;
                }

                /**
                 *
                 * rotate an image about its centre
                 * The image is translated appropriately so it rotates about the centre
                 *
                 * @param ctx - the canvas context
                 * @param $imageElement - jQuery wrapped image element
                 * @param requiredRotationRadians - angle by which the image should be rotated
                 */
                function rotateImage(ctx, $imageElement, requiredRotationRadians) {
                    //move diagonally down
                    ctx.translate($imageElement[0].naturalWidth * 0.5, $imageElement[0].naturalHeight * 0.5);
                    ctx.rotate(requiredRotationRadians);
                    //move diagonally back
                    ctx.translate(-$imageElement[0].naturalWidth * 0.5, -$imageElement[0].naturalHeight * 0.5);
                }

                function isRotatedByQuarterHalfOrThreeQuarterTurn(exifOrientation) {
                    return exifOrientation === 3 || exifOrientation === 6 || exifOrientation === 8;
                }

                /***
                 * Rotate the natural image correctly and remove Exif data from image by drawing on a canvas that has
                 * been rotated to the appropriate angle
                 *
                 * @param $imageElement
                 * @param exifOrientation
                 * @param requiredRotationRadians
                 */


                function orientImageCorrectlyAndRemoveExifData($imageElement, exifOrientation, requiredRotationRadians) {
                    var $canvas = $('<canvas></canvas>');
                    $canvas[0].height = $imageElement[0].naturalHeight;
                    $canvas[0].width = $imageElement[0].naturalWidth;
                    var ctx = $canvas[0].getContext("2d");
                    //check for the three orientation values that indicate camera not upright (we're ignoring the "flip" orientation values as these can't happen with the camera)
                    if (isRotatedByQuarterHalfOrThreeQuarterTurn(exifOrientation)) {
                        requiredRotationRadians = selectRequiredRotationAngle(exifOrientation, requiredRotationRadians);
                        rotateImage(ctx, $imageElement, requiredRotationRadians);
                    }
                    ctx.drawImage($imageElement[0], 0, 0);
                    $imageElement.attr("src", $canvas[0].toDataURL());
                }

                self.getImageElementAsString = function () {
                    var $imageElement,
                        $widthInput,
                        $widthUnitSelect,
                        $heightInput,
                        $heightUnitSelect,
                        $borderInput,
                        $borderUnitSelect,
                        $altTextInput,
                        returnValue,
                        exifOrientation,
                        requiredRotationRadians;

                    isScreenValid = true;

                    $imageElement = $('#image-uploader .fileinput .fileinput-preview img');

                    EXIF.getData($imageElement[0], function () {
                        console.log('[' + new Date().toISOString() + ']' + 'ImageUploader.getImageElementAsString() exifdata=' + JSON.stringify(this.exifdata));
                        exifOrientation = this.exifdata.Orientation;
                    });

                    orientImageCorrectlyAndRemoveExifData($imageElement, exifOrientation, requiredRotationRadians);

                    $heightInput = $('#height-input');
                    $heightUnitSelect = $('#height-unit-select');
                    $widthInput = $('#width-input');
                    $widthUnitSelect = $('#width-unit-select');
                    $borderInput = $('#border-input');
                    $borderUnitSelect = $('#border-unit-select');
                    $altTextInput = $('#alt-text-input');

                    if (isImageSelected($imageElement)) {
                        validateSizeInputs([$widthInput, $heightInput, $borderInput]);

                        if (!isScreenValid) {
                            return "error:inputs failed validation";
                        }

                        handleKeyedCSSInputs($imageElement, [
                            {inputElement: $heightInput, unitElement: $heightUnitSelect, attribute: 'height'},
                            {inputElement: $widthInput, unitElement: $widthUnitSelect, attribute: 'width'},
                            {inputElement: $borderInput, unitElement: $borderUnitSelect, suffix: 'solid', attribute: 'border'}
                        ]);
                        handleKeyedAttrInputs($imageElement, [
                            {inputElement: $altTextInput, attribute: 'alt'}
                        ]);
                    }
                    returnValue = $imageElement[0].outerHTML;
                    return returnValue;
                };
                self.onAspectRatioLockButtonClick = function() {
                    //switch the image
                    if ($(this).hasClass("fa-lock")) {
                        $(this).removeClass("fa-lock");
                        $(this).addClass("fa-unlock");
                        $.data($(this), "isLocked", false);
                    } else {
                        $(this).removeClass("fa-unlock");
                        $(this).addClass("fa-lock");
                        $.data($(this), "isLocked", true);
                    }

                };
                self.onHeightInputKeyup = function() {
                    var $imageElement, $widthInput, aspectRatio, newWidth;
                    $imageElement = $('#image-uploader .fileinput .fileinput-preview img');
                    $widthInput = $("#width-input");
                    aspectRatio = $imageElement.height()/$imageElement.width();
                    if (isNumber($(this).val()) && isNumber($widthInput.val())) {
                        newWidth = $(this).val()/aspectRatio;
                        if (Number(Math.round(newWidth)) !== Number(newWidth.toFixed(1))) {
                            newWidth = newWidth.toFixed(1);
                        } else {
                            newWidth = Math.round(newWidth);
                        }

                        $widthInput.val(newWidth);
                    }
                };
                self.onWidthInputKeyup = function() {
                    var $imageElement, $heightInput, aspectRatio, newHeight;
                    $imageElement = $('#image-uploader .fileinput .fileinput-preview img');
                    $heightInput = $("#height-input");
                    aspectRatio = $imageElement.height()*$imageElement.width();
                    if (isNumber($(this).val()) && isNumber($heightInput.val())) {
                        newHeight = $(this).val()/aspectRatio;
                        if (Number(Math.round(newHeight)) !== Number(newHeight.toFixed(1))) {
                            newHeight = newHeight.toFixed(1);
                        } else {
                            newHeight = Math.round(newHeight);
                        }

                        $heightInput.val(newHeight);
                    }
                };
                self.init = function () {
                    var $aspectRatioButton, $heightInput, $widthInput;
                    $aspectRatioButton = $("#aspect-ratio-lock-button");
                    $heightInput = $("#height-input");
                    $widthInput = $("#width-input");
                    $aspectRatioButton.click(self.onAspectRatioLockButtonClick);
                    $heightInput.keyup(self.onHeightInputKeyup);
                    $widthInput.keyup(self.onWidthInputKeyup);
                    $.data($aspectRatioButton, "isLocked", true);
                };
                return self;
            }());
            return retFunc;
        }($);
    }
    $(imageUploader.init);
})(jQuery);

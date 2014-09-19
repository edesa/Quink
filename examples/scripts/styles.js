/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

/*global QUINK */
QUINK = {
    params: {
        toolbar: 'on',
        styles: 'example-styles.css'
        // styles: '#user-styles' - a selector that should select a style node within the document.
    },

    ready: function () {
        'use strict';

        QUINK.configureToolbar({
            groups: [{
                id: 'style',
                active: true,
                hidden: false,
                items: [{
                    "id": "applyStyleFont",
                    "hidden": false,
                    "index": 8,
                    "elId": "qk_button_applystylefont",
                    "cssClass": "qk_button_bg_applystyle",
                    "command": "showStyleMenu",
                    "commandArgs": "getFontStyleDefs"
                }, {
                    "id": "applyStyleStroke",
                    "hidden": false,
                    "index": 9,
                    "elId": "qk_button_applystylestroke",
                    "cssClass": "qk_button_bg_applystyle",
                    "command": "showStyleMenu",
                    "commandArgs": "getStrokeStyleDefs"
                }, {
                    "id": "applyStyleBackground",
                    "hidden": false,
                    "index": 10,
                    "elId": "qk_button_applystylebackground",
                    "cssClass": "qk_button_bg_applystyle",
                    "command": "showStyleMenu",
                    "commandArgs": "getBackgroundStyleDefs"
                }]
            }],
            defaults: {
                hidden: true
            }
        });

        /**
         * Creates and returns a menu item definition given a css rule.
         */
        function createStyleDef(rule) {
            var style = rule.selectorText.replace(/^./, '');
            return {
                value: style,
                label: style.replace(/_/g, ' '),
                cssClass: style
            };
        }

        /**
         * From the user supplied style sheet return the selector text for all styles that have the words 'font-style'
         * or 'font-family' in their rule text and are at class level.
         */
        QUINK.getFontStyleDefs = function (stylesheet) {
            var fontStyles = [];
            Array.prototype.forEach.call(stylesheet.cssRules, function (rule) {
                if (/^\..*(font-style|font-family)/i.test(rule.cssText)) {
                    fontStyles.push(createStyleDef(rule));
                }
            });
            return fontStyles;
        };

        /**
         * Returns the selectors that start with the word 'stroke' from the user stylesheet.
         */
        QUINK.getStrokeStyleDefs = function (stylesheet) {
            var strokeStyles = [];
            Array.prototype.forEach.call(stylesheet.cssRules, function (rule) {
                if (/^\.stroke/i.test(rule.selectorText)) {
                    strokeStyles.push(createStyleDef(rule));
                }
            });
            return strokeStyles;
        };

        /**
         * From the user supplied style sheet return the selector text for all styles that have the word 'background'
         * in their rule text and are at class level.
         */
        QUINK.getBackgroundStyleDefs = function (stylesheet) {
            var backgroundStyles = [];
            Array.prototype.forEach.call(stylesheet.cssRules, function (rule) {
                if (/^\..*background/i.test(rule.cssText)) {
                    backgroundStyles.push(createStyleDef(rule));
                }
            });
            return backgroundStyles;
        };
    }
};

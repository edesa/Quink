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
                    "commandArgs": "fontStyleRuleFilter"
                }, {
                    "id": "applyStyleStroke",
                    "hidden": false,
                    "index": 9,
                    "elId": "qk_button_applystylestroke",
                    "cssClass": "qk_button_bg_applystyle",
                    "command": "showStyleMenu",
                    "commandArgs": "strokeStyleRuleFilter"
                }, {
                    "id": "applyStyleBackground",
                    "hidden": false,
                    "index": 10,
                    "elId": "qk_button_applystylebackground",
                    "cssClass": "qk_button_bg_applystyle",
                    "command": "showStyleMenu",
                    "commandArgs": "backgroundStyleRuleFilter"
                }, {
                    "id": "applyStyleMulti",
                    "hidden": false,
                    "index": 11,
                    "elId": "qk_button_applystylemulti",
                    "cssClass": "qk_button_bg_applystyle",
                    "command": "showStyleMenu",
                    "commandArgs": "multiStyleRuleFilter, true"
                }]
            }],
            defaults: {
                hidden: true
            }
        });

        /**
         * Select all rules that contain either 'font-style' or font-family' and are at class level.
         */
        QUINK.fontStyleRuleFilter = function (rule) {
            return /^\..*(font-style|font-family)/i.test(rule.cssText);
        };

        /**
         * Select rules whose selectors that start with the word 'stroke' and are at the class level.
         */
        QUINK.strokeStyleRuleFilter = function (rule) {
            return /^\.stroke/i.test(rule.selectorText);
        };

        /**
         * Select all rules that contain the word 'background' in their rule body.
         */
        QUINK.backgroundStyleRuleFilter = function (rule) {
            return /^\..*background/i.test(rule.cssText);
        };

        QUINK.multiStyleRuleFilter = function (rule) {
            return /^\..*text-transform/i.test(rule.cssText) || /\.(italic|bold)/i.test(rule.selectorText);
        };
    }
};

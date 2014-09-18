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
    },

    ready: function (PubSub) {
        'use strict';

        var fontStyles = [],
            strokeStyles = [],
            StyleMgr, StyleHandler;

        require(['util/StylesheetMgr', 'command/ApplyStyleHandler'], function (StylesheetMgr, ApplyStyleHandler) {
            StyleMgr = StylesheetMgr;
            StyleHandler = ApplyStyleHandler;
        });

        QUINK.configureToolbar({
            groups: [{
                id: 'style',
                active: true
            }],
        });

        /**
         * From the user supplied style sheet return the selector text for all styles that have the word 'font'
         * in their rule text and are at class level.
         */
        QUINK.getFontStyleValues = function () {
            var sheet = StyleMgr.getInstance().getStylesheet();
            Array.prototype.forEach.call(sheet.cssRules, function (rule) {
                if (/^\..*(font-style|font-family)/i.test(rule.cssText)) {
                    fontStyles.push(rule.selectorText.replace(/^./, ''));
                }
            });
            return fontStyles;
        };

        QUINK.getFontStyleState = function () {
            return StyleHandler.getInstance().isApplied(fontStyles);
        };

        /**
         * Returns the selectors that start with the word 'stroke' from the user stylesheet.
         */
        QUINK.getStrokeStyleValues = function () {
            var sheet = StyleMgr.getInstance().getStylesheet();
            Array.prototype.forEach.call(sheet.cssRules, function (rule) {
                if (/^\.stroke/i.test(rule.selectorText)) {
                    strokeStyles.push(rule.selectorText.replace(/^./, ''));
                }
            });
            return strokeStyles;
        };

        QUINK.getStrokeStyleState = function () {
            return StyleHandler.getInstance().isApplied(strokeStyles);
        };

        /**
         * Callback usedfor both style menus.
         */
        QUINK.onStyleSelect = function (selectedDef) {
            var selected = selectedDef.value;
            if (selected !== 'close') {
                PubSub.publish('command.exec', 'style.apply.' + selected);
            }
        };

        /**
         * Replace underscores with spaces and make the menu style the menu entries. Used in both style
         * menus.
         */
        QUINK.getStyleLabels = function (value) {
            return {
                label: value.replace(/_/g, ' '),
                cssClass: value
            };
        };

    }
};

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
                if (/^\..*font/i.test(rule.cssText)) {
                    fontStyles.push(rule.selectorText.replace(/^./, ''));
                }
            });
            return fontStyles;
        };

        /**
         * Replace underscores with spaces and make the menu style the menu entries.
         */
        QUINK.getFontStyleLabels = function (value) {
            return {
                label: value.replace(/_/g, ' '),
                cssClass: value
            };
        };

        QUINK.getFontStyleState = function () {
            return StyleHandler.getInstance().isApplied(fontStyles);
        };

        QUINK.onFontStyleSelect = function (selectedDef) {
            var selected = selectedDef.value;
            if (selected !== 'close') {
                PubSub.publish('command.exec', 'style.apply.' + selected);
            }
        };
    }
};

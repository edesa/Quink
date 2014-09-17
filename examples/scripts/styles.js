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

        var StyleMgr, StyleHandler;

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

        QUINK.getFontStyleValues = function () {
            var result = StyleMgr.getInstance().getSelectors().slice();
            result.push('close');
            return result;
        };

        QUINK.getFontStyleLabels = function (value) {
            return {
                label: value.replace(/_/g, ' '),
                cssClass: value
            };
        };

        QUINK.getFontStyleState = function () {
            return StyleHandler.getInstance().isApplied(StyleMgr.getInstance().getSelectors());
        };

        QUINK.onFontStyleSelect = function (selectedDef) {
            var selected = selectedDef.value;
            if (selected !== 'close') {
                PubSub.publish('command.exec', 'style.apply.' + selected);
            }
        };
    }
};

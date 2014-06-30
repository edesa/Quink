/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'command/InfoCommandHandler'
], function (InfoCommandHandler) {
    'use strict';

    var InfoCommandMsgAdapter = function () {
        this.handler = new InfoCommandHandler();
    };

    InfoCommandMsgAdapter.prototype.handle = function (msg) {
        var ar = msg.split('.'),
            handled;
        if (ar[0] === 'info') {
            this.handler.show(ar[1]);
            handled = true;
        }
        return handled;
    };

    var instance;

    function create() {
        if (!instance) {
            instance = new InfoCommandMsgAdapter();
        }
        return instance;
    }

    return {
        create: create
    };
});

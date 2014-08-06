/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'ext/InsertCommandHandler'
], function (InsertCommandHandler) {
    'use strict';

    var InsertCommandMsgAdapter = function () {
        this.handler = new InsertCommandHandler();
    };

    InsertCommandMsgAdapter.prototype.handle = function (msg) {
        var ar = msg.split('.'),
            handled;
        if (ar[0] === 'insert') {
            this.handler.insert(ar[1]);
            handled = true;
        }
        return handled;
    };

    var theInstance;

    function create() {
        if (!theInstance) {
            theInstance = new InsertCommandMsgAdapter();
        }
        return theInstance;
    }

    return {
        create: create
    };
});

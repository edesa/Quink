/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'command/EditCommandHandler'
], function (EditCommandHandler) {
    'use strict';

    var EditCommandMsgAdapter = function () {
        this.handler = new EditCommandHandler();
    };

    EditCommandMsgAdapter.prototype.ACCEPTED_IDS = [
        'edit',
        'font',
        'para',
        'style'
    ];

    EditCommandMsgAdapter.prototype.handle = function (msg) {
        var ar = msg.split('.'),
            id = ar[0],
            cmd = ar[1],
            args = ar[2] || null,
            handled;
        if (this.ACCEPTED_IDS.indexOf(id.toLowerCase()) >= 0) {
            this.handler.execCmd(cmd, args);
            handled = true;
        }
        return handled;
    };

    var instance;

    function create() {
        if (!instance) {
            instance = new EditCommandMsgAdapter();
        }
        return instance;
    }

    return {
        create: create
    };
});

/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'command/ApplyStyleHandler',
    'command/EditCommandHandler'
], function (ApplyStyleHandler, EditCommandHandler) {
    'use strict';

    var EditCommandMsgAdapter = function () {
        this.defaultHandler = new EditCommandHandler();
        this.applyStyleHandler = ApplyStyleHandler.getInstance();
    };

    EditCommandMsgAdapter.prototype.ACCEPTED_IDS = [
        'edit',
        'font',
        'para',
        'style'
    ];

    EditCommandMsgAdapter.prototype.getHandler = function (id, cmd) {
        return id === 'style' && cmd === 'apply' ? this.applyStyleHandler : this.defaultHandler;
    };

    EditCommandMsgAdapter.prototype.handle = function (msg) {
        var ar = msg.split('.'),
            id = ar[0],
            cmd = ar[1],
            args = ar[2] || null,
            handler, handled;
        if (this.ACCEPTED_IDS.indexOf(id.toLowerCase()) >= 0) {
            handler = this.getHandler(id, cmd);
            handler.execCmd(cmd, args);
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

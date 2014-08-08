/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'command/EditCommandHandler',
    'command/QuinkFormatBlockHandler',
    'command/RangyFormatBlockHandler',
    'util/Env'
], function (EditCommandHandler, QuinkFormatBlockHandler, RangyFormatBlockHandler, Env) {
    'use strict';

    var EditCommandMsgAdapter = function () {
        this.handler = new EditCommandHandler();
        this.formatBlockHandler = this.getFormatBlockHandler();
    };

    EditCommandMsgAdapter.prototype.EDIT_HANDLER_IDS = [
        'edit',
        'font',
        'para'
    ];

    EditCommandMsgAdapter.prototype.getFormatBlockHandler = function () {
        var handler = this.handler,
            name = Env.getParam('formatblock', 'browser').toLowerCase();
        if (name === 'quink') {
            console.log('QuinkFormatBlockHandler');
            handler = new QuinkFormatBlockHandler();
        } else if (name === 'rangy') {
            handler = new RangyFormatBlockHandler();
            console.log('RangyFormatBlockHandler');
        } else {
            handler = this.handler;
        }
        return handler;
    };

    EditCommandMsgAdapter.prototype.getHandler = function (ar) {
        var id = ar[0].toLowerCase(),
            cmd, handler;
        if (this.EDIT_HANDLER_IDS.indexOf(id) >= 0) {
            handler = this.handler;
        } else if (id === 'style') {
            cmd = ar[1].toLowerCase();
            if (cmd === 'formatblock' && /^h[1-6]$/.test(ar[2])) {
                handler = this.formatBlockHandler;
            } else {
                handler = this.handler;
            }
        }
        return handler;
    };

    EditCommandMsgAdapter.prototype.handle = function (msg) {
        var ar = msg.split('.'),
            handler = this.getHandler(ar);
        if (handler) {
            handler.execCmd(ar[1], ar[2] || null);
        }
        return !!handler;
    };

    // EditCommandMsgAdapter.prototype.handle = function (msg) {
    //     var ar = msg.split('.'),
    //         id = ar[0],
    //         cmd = ar[1],
    //         args = ar[2] || null,
    //         handled;
    //     if (this.ACCEPTED_IDS.indexOf(id.toLowerCase()) >= 0) {
    //         this.handler.execCmd(cmd, args);
    //         handled = true;
    //     }
    //     return handled;
    // };

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

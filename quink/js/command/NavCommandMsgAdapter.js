/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'Underscore',
    'nav/NavCommandHandler',
    'util/PubSub'
], function (_, NavCommandHandler, PubSub) {
    'use strict';

    var NavCommandMsgAdapter = function () {
        this.handler = new NavCommandHandler();
    };

    NavCommandMsgAdapter.prototype.handle = function (msg) {
        var ar = msg.split('.'),
            funcName = this.getFuncName(ar),
            handled, result;
        if (ar[0] === 'nav') {
            if (funcName && _.isFunction(this.handler[funcName])) {
                result = this.handler[funcName]();
                PubSub.publish('command.executed', {
                    cmd: msg,
                    result: result
                });
            } else {
                throw new Error('Can\'t handle msg: ' + msg);
            }
            handled = true;
        }
        return handled;
    };

    NavCommandMsgAdapter.prototype.getFuncName = function (ar) {
        var funcName = ar[1].toLowerCase();
        if (ar.length > 2) {
            funcName += ar[2].charAt(0).toUpperCase() + ar[2].substr(1);
        }
        return funcName;
    };

    var instance;

    function getInstance() {
        if (!instance) {
            instance = new NavCommandMsgAdapter();
        }
        return instance;
    }

    return {
        getInstance: getInstance
    };
});

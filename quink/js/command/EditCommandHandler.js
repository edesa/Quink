/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'util/PubSub'
], function (PubSub) {
    'use strict';

    var EditCommandHandler = function () {
    };

    EditCommandHandler.prototype.execCmd = function (cmd, args) {
        var result = document.execCommand(cmd, false, args);
        console.log('exec cmd: ' + cmd + ' [' + args + ']');
        PubSub.publish('command.executed', {
            cmd: cmd,
            args: args,
            result: result
        });
    };

    return EditCommandHandler;
});

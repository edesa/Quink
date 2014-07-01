/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'jquery',
    'rangy',
    'util/PubSub'
], function ($, rangy, PubSub) {
    'use strict';

    var EditCommandHandler = function () {
    };

    EditCommandHandler.prototype.getCssClass = function (blockType) {
        return 'qk_' + blockType;
    };

    EditCommandHandler.prototype.doFormatBlock = function (blockType) {
        var sel = rangy.getSelection(),
            result = false,
            range, node, cssClass;
        if (sel && sel.rangeCount) {
            range = sel.getRangeAt(0);
            if (range.canSurroundContents()) {
                cssClass = this.getCssClass(blockType);
                node = $('<div>').addClass(cssClass);
                range.surroundContents(node[0]);
                range = rangy.createRange();
                range.selectNode(node[0]);
                sel.setSingleRange(range);
                result = true;
            }
        }
        return result;
    };

    EditCommandHandler.prototype.execCmd = function (cmd, args) {
        var cmdResult;
        console.log('exec cmd: ' + cmd + ' [' + args + ']');
        if (cmd === 'formatblock') {
            cmdResult = this.doFormatBlock(args);
        } else {
            cmdResult = document.execCommand(cmd, false, args);
        }
        PubSub.publish('command.executed', {
            cmd: cmd,
            args: args,
            result: cmdResult
        });
    };

    return EditCommandHandler;
});

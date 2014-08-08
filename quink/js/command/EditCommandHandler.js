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

    /**
     * Tries to add a css class to the current text selection.
     */
    // EditCommandHandler.prototype.doFormatBlock = function (blockType) {
    //     var sel = rangy.getSelection(),
    //         result = false,
    //         range, node, cssClass, ancestor, dummy;
    //     if (sel && sel.rangeCount) {
    //         cssClass = this.getCssClass(blockType);
    //         range = sel.getRangeAt(0);
    //         ancestor = $(range.commonAncestorContainer);
    //         if (ancestor.hasClass('qk_formatblock')) {
    //             node = ancestor;
    //             $.each(node[0].classList, function () {
    //                 if (/^qk_h[1-6]$/.test(this)) {
    //                     node.removeClass(this);
    //                     return false;
    //                 }
    //             });
    //             node.addClass(cssClass);
    //         } else if (range.canSurroundContents()) {
    //             node = $('<span>').addClass(cssClass).addClass('qk_formatblock');
    //             // WebKit hack...
    //             if (range.collapsed) {
    //                 dummy = document.createTextNode(' ');
    //             }
    //             range.surroundContents(node[0]);
    //             if (dummy) {
    //                 node.append(dummy);
    //             }
    //         } else {
    //             node = $('<div>').addClass(cssClass).addClass('qk_formatblock');
    //             node.append(ancestor.contents());
    //             node.appendTo(ancestor);
    //         }
    //         node.find('.qk_formatblock').each(function () {
    //             var el = $(this);
    //             el.replaceWith(el.contents());
    //         });
    //         range = rangy.createRange();
    //         range.selectNodeContents(node[0]);
    //         sel.setSingleRange(range);
    //         result = true;
    //     }
    //     return result;
    // };

    // EditCommandHandler.prototype.execCmd = function (cmd, args) {
    //     var cmdResult;
    //     console.log('exec cmd: ' + cmd + ' [' + args + ']');
    //     if (cmd === 'formatblock' && /^h[1-6]$/.test(args)) {
    //         cmdResult = this.doFormatBlock(args);
    //     } else {
    //         cmdResult = document.execCommand(cmd, false, args);
    //     }
    //     PubSub.publish('command.executed', {
    //         cmd: cmd,
    //         args: args,
    //         result: cmdResult
    //     });
    // };

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

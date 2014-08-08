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

    var QuinkFormatBlockHandler = function () {
    };

    QuinkFormatBlockHandler.prototype.getCssClass = function (blockType) {
        return 'qk_' + blockType;
    };

    QuinkFormatBlockHandler.prototype.doFormatBlock = function (blockType) {
        var sel = rangy.getSelection(),
            result = false,
            range, node, cssClass, ancestor, dummy;
        if (sel && sel.rangeCount) {
            cssClass = this.getCssClass(blockType);
            range = sel.getRangeAt(0);
            ancestor = $(range.commonAncestorContainer);
            if (ancestor.hasClass('qk_formatblock')) {
                node = ancestor;
                $.each(node[0].classList, function () {
                    if (/^qk_h[1-6]$/.test(this)) {
                        node.removeClass(this);
                        return false;
                    }
                });
                node.addClass(cssClass);
            } else if (range.canSurroundContents()) {
                node = $('<span>').addClass(cssClass).addClass('qk_formatblock');
                // WebKit hack...
                if (range.collapsed) {
                    dummy = document.createTextNode(' ');
                }
                range.surroundContents(node[0]);
                if (dummy) {
                    node.append(dummy);
                }
            } else {
                node = $('<div>').addClass(cssClass).addClass('qk_formatblock');
                node.append(ancestor.contents());
                node.appendTo(ancestor);
            }
            node.find('.qk_formatblock').each(function () {
                var el = $(this);
                el.replaceWith(el.contents());
            });
            range = rangy.createRange();
            range.selectNodeContents(node[0]);
            sel.setSingleRange(range);
            result = true;
        }
        return result;
    };

    QuinkFormatBlockHandler.prototype.execCmd = function (cmd, args) {
        var result = this.doFormatBlock(args);
        PubSub.publish('command.executed', {
            cmd: cmd,
            args: args,
            result: result
        });
    };

    return QuinkFormatBlockHandler;
});

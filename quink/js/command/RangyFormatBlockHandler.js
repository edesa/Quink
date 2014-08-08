/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'Underscore',
    'rangy',
    'cssapplier',
    'util/PubSub'
], function (_, rangy, cssapplier, PubSub) {
    'use strict';

    var RangyFormatBlockHandler = function () {
        this.createApplierMap();
    };

    RangyFormatBlockHandler.prototype.createApplierMap = function () {
        this.APPLIER_MAP = {
            'h1': rangy.createCssClassApplier('qk_h1'),
            'h2': rangy.createCssClassApplier('qk_h2'),
            'h3': rangy.createCssClassApplier('qk_h3'),
            'h4': rangy.createCssClassApplier('qk_h4'),
            'h5': rangy.createCssClassApplier('qk_h5'),
            'h6': rangy.createCssClassApplier('qk_h6')
        };
    };

    RangyFormatBlockHandler.prototype.handleCollapsedRange = function (range, applier) {
        var el = document.createElement('span'),
            dummy = document.createTextNode(' '); // webkit hack
        el.appendChild(dummy);
        range.insertNode(el);
        range.setEndAfter(el);
        applier.toggleRange(range);
        rangy.getSelection().setSingleRange(range);
    };

    /**
     * Make sure that all the other possible css classes aren't applied to the selection before applying
     * the new one. This prevents one element having a number of css classes applied to it at the same time.
     */
    RangyFormatBlockHandler.prototype.applyCssClass = function(args) {
        var applier = this.APPLIER_MAP[args],
            range, others;
        if (applier) {
            range = rangy.getSelection().getRangeAt(0);
            if (range.collapsed) {
                this.handleCollapsedRange(range, applier);
            } else {
                others = _.values(this.APPLIER_MAP);
                others.splice(others.indexOf(applier), 1);
                others.forEach(function(applr) {
                    applr.undoToSelection();
                });
                applier.toggleSelection();
            }
        }
    };


    RangyFormatBlockHandler.prototype.execCmd = function (cmd, args) {
        var result = false;
        console.log('RangyFormatBlockHandler not implemented.');
        this.applyCssClass(args);
        PubSub.publish('command.executed', {
            cmd: cmd,
            args: args,
            result: result
        });
    };

    return RangyFormatBlockHandler;
});

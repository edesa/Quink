/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'rangy',
    'cssapplier',
    'util/PubSub'
], function (rangy, cssapplier, PubSub) {
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

    RangyFormatBlockHandler.prototype.applyCssClass = function (args) {
        var applier = this.APPLIER_MAP[args];
        if (applier) {
            applier.toggleSelection();
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

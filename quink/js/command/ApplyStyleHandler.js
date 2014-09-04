/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'Underscore',
    'jquery',
    'rangy',
    'cssapplier',
    'util/PubSub'
], function (_, $, rangy, cssapplier, PubSub) {
    'use strict';

    var ApplyStyleHandler = function () {
        this.createApplierMap();
    };

    ApplyStyleHandler.prototype.CSS_CLASSES = [
        'qk_h1',
        'qk_h2',
        'qk_h3',
        'qk_h4',
        'qk_h5',
        'qk_h6'
    ];

    ApplyStyleHandler.prototype.createApplierMap = function () {
        this.APPLIER_MAP = {
            'qk_h1': rangy.createCssClassApplier('qk_h1'),
            'qk_h2': rangy.createCssClassApplier('qk_h2'),
            'qk_h3': rangy.createCssClassApplier('qk_h3'),
            'qk_h4': rangy.createCssClassApplier('qk_h4'),
            'qk_h5': rangy.createCssClassApplier('qk_h5'),
            'qk_h6': rangy.createCssClassApplier('qk_h6')
        };
    };

    ApplyStyleHandler.prototype.foo = function (range, applier) {
        var el = document.createElement('span'),
            dummy = document.createTextNode(' '); // webkit hack
        el.appendChild(dummy);
        range.insertNode(el);
        range.setEndAfter(el);
        applier.toggleRange(range);
        rangy.getSelection().setSingleRange(range);
    };

    ApplyStyleHandler.prototype.handleCollapsedRange = function (range, applier, cssClass) {
        var el = range.startContainer;
        if (el.children && el.children.length === 1) {
            el = $(el);
            if (!el.hasClass(cssClass)) {
                this.removeCssClassesNot(el, cssClass);
                el.addClass(cssClass);
            }
        } else {
            this.foo(range, applier);
        }
    };

    ApplyStyleHandler.prototype.removeCssClassesNot = function (el, cssClass) {
        var others = _.without(this.CSS_CLASSES, cssClass);
        others.forEach(function (cls) {
            el.removeClass(cls);
        });
    };

    /**
     * Make sure that all the other possible css classes aren't applied to the selection before applying
     * the new one. This prevents one element having a number of css classes applied to it at the same time.
     */
    ApplyStyleHandler.prototype.applyCssClass = function (header) {
        var cssClass = 'qk_' + header,
            applier = this.APPLIER_MAP[cssClass],
            range, others;
        if (applier) {
            range = rangy.getSelection().getRangeAt(0);
            if (range.collapsed) {
                this.handleCollapsedRange(range, applier, cssClass);
            } else {
                others = _.values(this.APPLIER_MAP);
                others.splice(others.indexOf(applier), 1);
                others.forEach(function (applr) {
                    applr.undoToSelection();
                });
                applier.toggleSelection();
            }
        }
    };


    ApplyStyleHandler.prototype.execCmd = function (cmd, args) {
        var result = false;
        this.applyCssClass(args);
        PubSub.publish('command.executed', {
            cmd: cmd,
            args: args,
            result: result
        });
    };

    return ApplyStyleHandler;
});

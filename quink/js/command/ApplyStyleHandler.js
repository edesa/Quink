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
        this.applierMap = {};
    };

    ApplyStyleHandler.prototype.getApplier = function (style) {
        var applier = this.applierMap[style];
        if (!applier) {
            applier = rangy.createCssClassApplier(style);
            this.applierMap[style] = applier;
        }
        return applier;
    };

    ApplyStyleHandler.prototype.applyStyleToEmptyRange = function (range, applier) {
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
                el.addClass(cssClass);
            }
        } else {
            this.applyStyleToEmptyRange(range, applier);
        }
    };

    ApplyStyleHandler.prototype.applyCssClass = function (style) {
        var applier = this.getApplier(style),
            range = rangy.getSelection().getRangeAt(0);
        if (range.collapsed) {
            this.handleCollapsedRange(range, applier, style);
        } else {
            applier.toggleSelection();
        }
    };

    ApplyStyleHandler.prototype.execCmd = function (cmd, args) {
        this.applyCssClass(args);
        PubSub.publish('command.executed', {
            cmd: cmd,
            args: args,
            result: true
        });
    };

    ApplyStyleHandler.prototype.isApplied = function (styles) {
        var appliedStyles = _.filter(styles, function (style) {
            var applier = this.getApplier(style);
            return applier.isAppliedToSelection();
        }.bind(this));
        return appliedStyles;
    };

    var theInstance;

    function getInstance() {
        var instance = theInstance;
        if (!instance) {
            theInstance = new ApplyStyleHandler();
            instance = theInstance;
        }
        return instance;
    }

    return {
        getInstance: getInstance
    };
});

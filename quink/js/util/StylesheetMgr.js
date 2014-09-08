/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'jquery',
    'util/Env'
], function ($, Env) {
    'use strict';

    var StylesheetMgr = function () {
        this.selectors = [];
    };

    StylesheetMgr.prototype.QUINK_ADDED_ATTR = 'data-quink-inlined';

    StylesheetMgr.prototype.onGetUserStylesheet = function (data) {
        var styleEl = $('<style>').attr(this.QUINK_ADDED_ATTR, ''),
            text = document.createTextNode(data);
        styleEl.append(text);
        styleEl.appendTo('head');
        this.stylesheet = styleEl[0].sheet;
    };

    StylesheetMgr.prototype.getUserStylesheet = function (url) {
        var promise = $.get(url);
        promise.done(this.onGetUserStylesheet.bind(this)).fail(function () {
            console.log('no user stylesheet');
        });
        return promise;
    };

    StylesheetMgr.prototype.getInlinedStyle = function () {
        var styles = $('style[' + this.QUINK_ADDED_ATTR + ']'),
            stylesheet;
        if (styles.length > 0) {
            stylesheet = styles[0].sheet;
            this.stylesheet = stylesheet;
        }
        return stylesheet;
    };

    /**
     * Creates an array of the names of the css rules that apply to css classes.
     */
    StylesheetMgr.prototype.createUserStyleList = function () {
        var stylesheet = this.stylesheet,
            rules = stylesheet.cssRules || stylesheet.rules,
            length = rules.length,
            i, rule;
        for (i = 0; i < length; i++) {
            rule = rules[i];
            // Is this a rule for a css class (i.e. starts with a '.')
            if (rule.selectorText && rule.style && /^\.+/.test(rule.selectorText)) {
                this.selectors.push(rule.selectorText.substr(1));
            }
        }
    };

    /**
     * Returns a promise that will succeed regardless of whether there's a user defined stylesheet
     * or not.
     */
    StylesheetMgr.prototype.init = function () {
        var url = Env.resource('styles.css'),
            stylesheet = this.getInlinedStyle(url),
            promise = stylesheet ? $.Deferred().resolve().promise() : this.getUserStylesheet(url),
            proxy = $.Deferred();
        promise.done(this.createUserStyleList.bind(this)).always(function () {
            proxy.resolve();
        });
        return proxy;
    };

    StylesheetMgr.prototype.getSelectors = function () {
        return this.selectors;
    };

    var theInstance = new StylesheetMgr();

    return {
        init: theInstance.init.bind(theInstance),
        getSelectors: theInstance.getSelectors.bind(theInstance)
    };
});

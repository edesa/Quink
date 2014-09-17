/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'Underscore',
    'jquery',
    'util/Env'
], function (_, $, Env) {
    'use strict';

    var StylesheetMgr = function () {
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

    /**
     * Check if there's already a quink-inlined style element or a user supplied style node specified by the
     * 'styles' param. If there is return the stylesheet.
     */
    StylesheetMgr.prototype.getInlinedStyle = function (selectorOrUrl) {
        var styles = $('style[' + this.QUINK_ADDED_ATTR + ']'),
            selector, stylesheet;
        if (styles.length === 0) {
            selector = selectorOrUrl || Env.getParam('styles');
            styles = $(selector);
        }
        if (styles.length > 0) {
            stylesheet = styles[0].sheet;
            this.stylesheet = stylesheet;
        }
        return stylesheet;
    };

    /**
     * selectorOrUrl can be either a selector for a style element in the document or a url for a stylesheet. If there's
     * no selectorOrUrl the 'styles' url parameter will be checked and failing that the resource styles.css will be used.
     * Having no user defined style file is fine.
     * Returns a promise that will succeed regardless of whether there's a user defined stylesheet
     * or not.
     */
    StylesheetMgr.prototype.init = function (selectorOrUrl) {
        var stylesheet = this.getInlinedStyle(selectorOrUrl),
            url, promise, proxy;
        if (!stylesheet) {
            url = Env.getParam('styles') || Env.resource('styles.css');
            promise = this.getUserStylesheet(url);
        } else {
            promise = $.Deferred().resolve().promise();
        }
        proxy = $.Deferred();
        promise.always(function () {
            proxy.resolve();
        });
        return proxy;
    };

    StylesheetMgr.prototype.getStylesheet = function () {
        return this.stylesheet;
    };

    var theInstance;

    function getInstance() {
        if (!theInstance) {
            theInstance = new StylesheetMgr();
        }
        return theInstance;
    }

    return {
        getInstance: getInstance
    };
    // function create() {
    //     var mgr = new StylesheetMgr();
    //     return {
    //         init: mgr.init.bind(mgr),
    //         getSelectors: mgr.getSelectors.bind(mgr)
    //     };
    // }
    //
    // return {
    //     create: create
    // };
});

/* Copyright 2013, deviantART, Inc.
 * Licensed under 3-Clause BSD.
 * Refer to the LICENCES.txt file for details.
 * For latest version, see https://github.com/deviantART/jquery.deviantartmuro
 */
(function (window, $, undefined) {

"use strict";

var version = "1.0.2";

// $('.damuro-embeds').damuro({ setting: value }); // return original set for chaining
// $('...').damuro(settings, function () { done; }, function () { fail; });
// $('...').damuro(function () { done; }, function () { fail; });
// $.damuro({ setting: value }).appendTo(...);   // returns set containing damuro element
// $('.damuro-embeds').damuro().close();           // acts as getter to find damuro on the elements

// Options:
//   sandbox: sandbox page url
//   origin: origin for sandbox, defaults to '*'
//   width, height: dimensions of damuro embed
//   canvasWidth, canvasHeight: dimensions of canvas
//   background: colour/image to initialize canvas from
//   splashText, loadingText, savingText, errorText: splash screen messages
//   splashCss, loadingCss, savingCss, errorCss: styles to apply to splash screens

// Local Manipulation Methods:
//   $('...').damuro().open():   open damuro, starts the app loading
//   $('...').damuro().close():  close damuro, but leave everything attached to DOM
//   $('...').damuro().remove(): removes damuro from DOM

// dA muro API methods:
// $('...').damuro().command(command, arguments, cbdone, cbfail)
// $('...').damuro().query(query, arguments, cbdone, cbfail)

// API Events (forwarded to attached DOM element or .damuro()?):
// damuroReady, damuroSave, damuroError, damuroCancel, damuroDone
// damuroGotDeviationID, damuroCommandComplete, damuroCommandError, damuroQueryReply

// Promise methods:
//  .damuro() is a promise for the user saving and exiting.
//  .damuro().promise() returns promise for the last .command() or .query() operation.

var DAMuro = $.deviantartmuro = $.damuro = function (el, options, done, fail) {
    this.ready = false;
    this.queuedMessages = [];

    this.el = el;
    this.$el = $(el);
    this.$el.data('damuro', this);

    var o = this.options = $.extend({}, $.damuro.defaults, options),
        width  = o.width  || this.$el.innerWidth(),
        height = o.height || this.$el.innerHeight();

    // Autopopulate splash background-image with background if set to an image.
    var commonCss = {
        backgroundPosition: 'center center',
        backgroundSize:     'contain',
        backgroundRepeat:   'no-repeat'
        };
    // TODO: also check named presets
    if (o.background && !/^rgba/.test(o.background)) {
        // Ensure our background param is an absolute url.
        var img = window.document.createElement("img");
        img.src = o.background;
        o.background = img.src;
        commonCss.backgroundImage = 'url("' + o.background + '")';
    }

    // Build our container, splash-screens and muro iframe.
    this.$container = this.$el.append('<div class="damuro-container"></div>')
        .find('.damuro-container')
        .css({
            position: 'absolute',
            width: width,
            height: height
            });
    this.views = {};
    this.views.$splash = this._splash('splash',  o.splashText, $.extend({}, commonCss, o.splashCss || {})).appendTo(this.$container);
    this.views.$loading = this._splash('loading', o.loadingText, $.extend({ visibility: 'hidden' }, commonCss, o.loadingCss || {})).appendTo(this.$container);
    this.views.$saving = this._splash('saving',  o.savingText, $.extend({ visibility: 'hidden' }, commonCss, o.savingCss || {})).appendTo(this.$container);
    this.views.$app = $('<iframe class="damuro-app-view" src=""></iframe>')
        .css($.extend({
            position: 'absolute',
            visibility: 'hidden',
            width:  '100%',
            height: '100%',
            border: 0
            }, o.appCss || {})).appendTo(this.$container);
    this.contentWindow = this.views.$app.get(0).contentWindow;

    this.currentView = 'splash';

    this.deferreds = {
        damuro: $.Deferred()
        };
    // Turn the .damuro() into a promise so they can chain .done().fail() callbacks off it.
    this.deferreds.damuro.promise(this);
    this.lastPromise = null;

    if (done !== undefined && $.isFunction(done)) {
        this.done(done);
    }
    if (o.done !== undefined && $.isFunction(o.done)) {
        this.done(o.done);
    }
    if (fail !== undefined && $.isFunction(fail)) {
        this.fail(fail);
    }
    if (o.fail !== undefined && $.isFunction(o.fail)) {
        this.fail(o.fail);
    }

    this.uid = 0;  // uid for callbacks.

    if (o.autoload) {
        this.open();
    }
};

DAMuro.defaults = {
    splashText:  'Click to load in deviantART muro.',  // TODO: figure out a sane default
    loadingText: 'Loading deviantART muro...',
    savingText:  'Saving from deviantART muro...',

    sandbox: '../html/deviantart_muro_sandbox.html',
    origin:  '*',
    autoload: true
    };

DAMuro.version = version;

$.extend(DAMuro.prototype, {

    /**
     * Returns the promise object of the last promise-creating action.
     * Not a fan of stateful behaviours, but only real way to support
     * chaining of commands and also grant access to their promises in a
     * fluid way.
     */
    promise: function () {
        return this.lastPromise;
    },

    view: function (view) {
        if (view === undefined) {
            return this.currentView;
        }
        if (!this.views['$' + view]) {
            return this;
        }
        this.views['$' + view].css('visibility', 'visible');
        $.each(this.views, function ($view, $el) {
                // Ho ho.
                if ('$' + view !== $view) {
                    $el.css('visibility', 'hidden');
                }
            });
        this.currentView = view;
        return this;
    },

    /**
     * Remove this deviantART muro embed from the DOM and clean up.
     */
    remove: function () {
        if (this.$el === undefined) {
            return;
        }
        this.$container.remove();
        delete this.$container;
        this.$el.removeData('damuro');
        delete this.el;
        delete this.$el;
        delete this.views;
        delete this.contentWindow;
        delete this.lastPromise;
        delete this.queuedMessages;
        return this;
    },

    open: function () {
        this.view('loading');
        // Ensure any old event bindings are cleared.
        $(window).off('message.damuro');
        this.$el.off('.damuro');
        // Add new event bindings.
        $(window).on('message.damuro',     $.proxy(this._receiveMessage, this));
        this.$el.one('damuroReady.damuro', $.proxy(function () {
            this.ready = true;
            this._postQueuedMessages();
            // TODO: hold reveal until queue empty?
            this.view('app');
        }, this));
        this.$el.one('damuroDone.damuro',  $.proxy(function (e, data) {
            if (data.image && !/\'/.test(data.image)) {
                this.views.$saving.css('backgroundImage', "url('" + data.image + "')");
            }
            this.view('saving');
        }, this));
        this.views.$app.get(0).src = this.url();
        // TODO: be nice to try to autocalculate origin if not already specified
    },

    close: function () {
        this.view('splash');  // TODO: what do we really want to reset to?
        this.views.$app.get(0).src = '';
        // Remove our event bindings.
        $(window).off('message.damuro');
        this.$el.off('.damuro');
    },

    _receiveMessage: function (e) {
        var message = e.originalEvent;
        if (message.source !== this.contentWindow) {
            return;
        }

        var data = message.data;
        if (!data.type) {
            return;
        }

        var $el = this.$el; // promise callbacks may delete this, take a local copy
        // Complete promises before sending events.
        switch (data.type) {
        case 'complete':
            this.deferreds.damuro.resolveWith(this.el, [data]);
            break;
        case 'error':
        case 'cancel':
            this.deferreds.damuro.rejectWith(this.el, [data]);
            break;
        case 'commandComplete':
            if (data.ref !== undefined) {
                this._resolve('command' + data.ref, 'resolve', data);
            }
            break;
        case 'commandError':
            if (data.ref !== undefined) {
                this._resolve('command' + data.ref, 'reject', data);
            }
            break;
        case 'queryReply':
            if (data.ref !== undefined) {
                this._resolve('query' + data.ref, 'resolve', data);
            }
            break;
        }

        $el.trigger('damuro' + data.type.charAt(0).toUpperCase() + data.type.slice(1), data);
    },

    _resolve: function (id, resolution, data) {
        if (this.deferreds[id] === undefined) {
            return;
        }
        this.deferreds[id][resolution](data);
        delete this.deferreds[id];
    },

    _postQueuedMessages: function () {
        while (this.queuedMessages.length) {
            this._postMessage(this.queuedMessages.shift());
        }
    },

    _postMessage: function (message) {
        // Queue messages until ready
        if (!this.ready) {
            this.queuedMessages.push(message);
            return;
        }
        if (!this.contentWindow) {
            return;
        }
        this.contentWindow.postMessage(message, this.options.origin);
    },

    command: function (command, data, done, fail) {
        data = $.extend({
            type:    'command',
            command: command,
            ref:     ++this.uid
            }, data);
        var d = this.deferreds['command' + data.ref] = $.Deferred();
        this.lastPromise = d.promise();
        if (done !== undefined && $.isFunction(done)) {
            d.done(done);
        }
        if (fail !== undefined && $.isFunction(fail)) {
            d.fail(fail);
        }
        this._postMessage(data);
        return this;
    },

    query: function (query, data, done, fail) {
        data = $.extend({
            type:  'query',
            query: query,
            ref:   ++this.uid
            }, data);
        var d = this.deferreds['query' + data.ref] = $.Deferred();
        this.lastPromise = d.promise();
        if (done !== undefined && $.isFunction(done)) {
            d.done(done);
        }
        if (fail !== undefined && $.isFunction(fail)) {
            d.fail(fail);
        }
        this._postMessage(data);
        return this;
    },

    /**
     * Internal helper function for constructing splash screens.
     */
    _splash: function (name, text, css) {
        return $('<div class="damuro-' + name + '-view damuro-splash"></div>')
            .css($.extend({
                position: 'absolute',
                display:  'table',
                width:    '100%',
                height:   '100%'
                }, css || {}))
            .append('<div class="damuro-splash-inner"><span class="damuro-splash-text">' + text + '</span></div></div>')
            .find('.damuro-splash-inner')
            .css({
                display:          'table-cell',
                'vertical-align': 'middle',
                'text-align':     'center'
                })
            .end();
    },

    /**
     * Construct and return the url the embed iframe should point to.
     */
    url: function () {
        var mappedOptions = {
                width:        'canvasWidth',
                height:       'canvasHeight',
                stash_folder: 'stashFolder'
            },
            embedOptions = {};

        ['width', 'height', 'background', 'stash_folder', 'vm'].forEach(function (embedOption) {
                var option = mappedOptions[embedOption] || embedOption;
                if (this.options[option] !== undefined) {
                    embedOptions[embedOption] = this.options[option];
                }
            }, this);

        return this.options.sandbox + '?' + $.param(embedOptions);
    }
});

/**
 * $('...').damuro({ option: value })
 *   Constructs and attaches muro to the matched elements and returns the matched elements.
 * $('...').damuro()
 *   Returns the muro object for the first matched element.
 */
$.fn.deviantartmuro = $.fn.damuro = function (options, done, fail) {
    if (options === undefined) {
        return this.data('damuro');
    } else {
        return this.each(function () {
                var damuro = $(this).data('damuro');

                if (damuro === undefined) {
                    (new DAMuro(this, options, done, fail));
                } else {
                    // TODO: update options? replace muro?
                }
            });
    }
};

})(window, jQuery);

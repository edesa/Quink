define([
    'Underscore',
    'jquery',
    'util/Env',
    'util/PubSub'
], function (_, $, Env, PubSub) {
    'use strict';

    function getJqueryObject(selOrEl) {
        if (!selOrEl) {
            throw new TypeError('ViewportRelative needs a selector an element or a jQuery object.');
        }
        return typeof selOrEl.jquery === 'string' ? selOrEl : $(selOrEl);
    }

    /**
     * WebKit/Blink seems to use document.body, but FireFox uses document.documentElement.scrollTop.
     */
    function getScrollTop() {
        return document.documentElement.scrollTop || document.body.scrollTop || 0;
    }

    /**
     * Implements something like css position: fixed, which is a fixed postion relative to
     * the viewport. Css can't be used on its own as iOS ignores position: fixed when the
     * keyboard is active.
     * Currently this only works for a position argument like: {top: n} where 'n' is offset from
     * the top of the viewport.
     */
    var ViewportRelative = function (selOrEl, position) {
        var makeRelative = this.makeRelative.bind(this);
        this.el = getJqueryObject(selOrEl);
        this.el.addClass('qk_viewport_relative');
        this.position = position;
        PubSub.subscribe('event.orientationchange', this.onOrientationChange.bind(this));
        PubSub.subscribe('window.scroll', makeRelative);
        PubSub.subscribe('draggable.dragend', this.onDragEnd.bind(this));
        // The keyboard might slide out which changes eveything.
        PubSub.subscribe('editable.blur', makeRelative);
    };

    ViewportRelative.prototype.onOrientationChange = function () {
        var maxHeight;
        if (this.el.is(':visible')) {
            maxHeight = $(window).innerHeight() / 2;
            if (this.position && this.position.top > maxHeight) {
                this.position.top = maxHeight - 200;
                console.log('made top: ' + this.position.top);
            }
            setTimeout(function () {
                this.makeRelative();
            }.bind(this), 250);
        }
    };

    /**
     * Css position:fixed doesn't work on iOS if an element has focus. To get round this
     * manually alter the vertical position of the state bar after any events that may have
     * caused it to have scrolled away from the desired position.
     */
    ViewportRelative.prototype.makeRelative = function () {
        var bst, pos;
        if (this.el.is(':visible')) {
            bst = getScrollTop();
            if (!this.position) {
                this.position = pos = {
                    top: parseInt(this.el.css('top'), 10) - bst
                };
            } else {
                pos = _.clone(this.position);
                pos.top += bst;
            }
            this.el.css(pos);
        }
    };

    /**
     * Sets the desired viewport relative position based on the current document relative coordinates.
     */
    ViewportRelative.prototype.adjust = function () {
        this.position  = this.position || {};
        this.position.top = parseInt(this.el.css('top'), 10) - getScrollTop();
    };

    ViewportRelative.prototype.onDragEnd = function (draggable) {
        if (draggable === this.el[0]) {
            this.adjust();
        }
    };

    /**
     * The browser correctly supports position: fixed so there's less to do.
     */
    var FixedPosition = function (selOrEl) {
        this.el = getJqueryObject(selOrEl);
    };

    /**
     * Convert the document coordinates into viewport relative coordinates.
     */
    FixedPosition.prototype.adjust = function () {
        var top = parseInt(this.el.css('top'), 10);
        this.el.css('top', top - getScrollTop());
    };

    function create(selOrEl, pos) {
        return Env.isIos() ? new ViewportRelative(selOrEl, pos) : new FixedPosition(selOrEl);
    }

    return {
        create: create
    };
});

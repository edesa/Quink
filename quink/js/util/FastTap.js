/**
 * Quink, Copyright (c) 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * This file is part of Quink.
 * 
 * Quink is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Quink is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Quink.  If not, see <http://www.gnu.org/licenses/>.
 */

define([
    'Underscore',
    'jquery',
    'util/Event',
    'util/FocusTracker'
], function (_, $, Event, FocusTracker) {
    'use strict';

    /**
     * Creates a FastTap object.
     * el - the element being fast tapped.
     * handler - the code executed when the user fast taps the element.
     * willRestoreFocus - whether focus is given back to the previous focused component before
     * executing the handler.
     * willActivate - whether the element's UI is changed to indicate that it's being hit.
     * willRepeat - whether the user can keep their finger on the element in order and
     * have the handler executable repeatedly.
     */
    var FastTap = function (el, handler, willRestoreFocus, willActivate, willRepeat) {
        this.el = el;
        this.handler = handler;
        this.willRestoreFocus = willRestoreFocus;
        this.willRepeat = willRepeat;
        this.willActivate = willActivate;
        el.addEventListener(Event.eventName('start'), this, false);
    };

    FastTap.prototype.fastTaps = [];

    // Repeat count versus repeat interval
    FastTap.prototype.repeatIntervals = [];
    (function (ar) {
        ar[0] = 300;
        ar[1] = 200;
        ar[5] = 100;
        ar[10] = 75;
        ar[15] = 50;
        ar[20] = 25;
        ar[30] = 10;
        ar[40] = 5;
        ar[50] = 0;
    }(FastTap.prototype.repeatIntervals));

    FastTap.prototype.handleEvent = function (event) {
        switch (event.type) {
        case 'touchstart':
        case 'mousedown':
            this.onTouchStart(event);
            break;
        case 'touchmove':
        case 'mousemove':
            this.onTouchMove(event);
            break;
        case 'touchend':
        case 'mouseup':
            this.onTouchEnd(event);
            break;
        }
    };

    FastTap.prototype.onTouchStart = function (event) {
        var locEvent = Event.getLocEvent(event);
        this.startCoords = {
            x: locEvent.clientX,
            y: locEvent.clientY
        };
        this.initActive();
        this.setActive(true);
        this.el.addEventListener(Event.eventName('end'), this, false);
        document.body.addEventListener(Event.eventName('move'), this, false);
        if (this.willRepeat) {
            this.repeat(event);
        }
    };

    FastTap.prototype.onTouchMove = function (event) {
        if (!Event.inThreshold(event, this.startCoords)) {
            this.cancel();
        } else {
            event.preventDefault();
        }
    };

    /**
     * The preventDefault isn't ideal. It stops the browser from setting focus onto the thing
     * being fast tapped and making it conditional currently means that this only happens
     * when the editable is being fast tapped.
     * The normal bnehaviour doesn't cause a problem on the desktop, but on the device it does
     * as it doesn't seem possible to find a way to re-focus on the editable after having the
     * focus set to it while the command is executed.
     */
    FastTap.prototype.onTouchEnd = function (event) {
        if (this.willRestoreFocus) {
            event.preventDefault();
        }
        this.cancel();
        this.execHandler(event);
    };

    FastTap.prototype.cancel = function () {
        this.setActive(false);
        this.el.removeEventListener(Event.eventName('end'), this, false);
        document.body.removeEventListener(Event.eventName('move'), this, false);
        this.cancelRepeat();
    };

    FastTap.prototype.setActive = function (value) {
        var func;
        if (this.willActivate) {
            func = value ? this.addFunc : this.removeFunc;
            $(this.el)[func]('qk_button_active');
        }
    };

    /**
     * Changing active state depends on the initial state.
     */
    FastTap.prototype.initActive = function () {
        var isActive = $(this.el).hasClass('qk_button_active');
        if (isActive) {
            this.addFunc = 'removeClass';
            this.removeFunc = 'addClass';
        } else {
            this.addFunc = 'addClass';
            this.removeFunc = 'removeClass';
        }
    };

    /**
     * Stops the repeated execution of the handler.
     */
    FastTap.prototype.cancelRepeat = function () {
        if (this.repeatTimeout) {
            clearTimeout(this.repeatTimeout);
        }
    };

    /**
     * Repeats execution of the handler. The execution interval depends on the number of times
     * the handler has been executed with the interval shortening as the execution count rises.
     * Have to clone the event because something is changing the original event's currentTarget
     * which is null when the delayed function is called.
     */
    FastTap.prototype.repeat = function (event) {
        var count = 0,
            interval = this.repeatIntervals[0],
            ev = _.clone(event),
            func = function () {
                var newInterval = this.repeatIntervals[++count];
                interval = newInterval === undefined ? interval : newInterval;
                this.execHandler(ev);
                this.repeatTimeout = _.delay(func, interval);
            }.bind(this);
        this.repeatTimeout = _.delay(func, interval);
    };

    /**
     * Executes the handler conditionally restoring focus to the editable before execution.
     */
    FastTap.prototype.execHandler = function (event) {
        if (this.willRestoreFocus) {
            FocusTracker.restoreFocus();
        }
        this.handler(event);
    };

    function create(el, func, willRestoreFocus, willActivate, willRepeat) {
        var ft = new FastTap(el, func, willRestoreFocus, willActivate, willRepeat);
        FastTap.prototype.fastTaps.push(ft);
    }

    function fastTap(el, handler, context, willActivate, willRepeat) {
        var func = context ? handler.bind(context) : handler;
        create(el, func, true, willActivate, willRepeat);
    }

    /**
     * Fast tap without restoring the focus and selection when the handler function
     * is executed.
     */
    function fastTapNoFocus(el, handler, context) {
        var func = context ? handler.bind(context) : handler;
        create(el, func, false, false, false);
    }

    /**
     * Assumes this isn't called between a touchstart and touchend event, so only
     * removes the touchstart listener and not any touchmove or touchend listeners.
     */
    function noTap(el) {
        var taps = FastTap.prototype.fastTaps,
            i, tap;
        for (i = taps.length - 1; i > 0; i--) {
            tap = taps[i];
            if (tap.el === el) {
                tap.el.removeEventListener(Event.eventName('start'), tap, false);
                taps.splice(i, 1);
            }
        }
    }

    /**
     * Attach a double hit handler to the given element.
     */
    function doubleTap(el, handler) {
        var DOUBLE_TAP_THRESHOLD = 300,
            ts;
        el.addEventListener(Event.eventName('end'), function (event) {
            var now = new Date().getTime();
            if (ts && (now - ts < DOUBLE_TAP_THRESHOLD)) {
                handler(event);
                ts = null;
            } else {
                ts = now;
            }
        }, false);
    }

    return {
        create: create,
        fastTap: fastTap,
        fastTapNoFocus: fastTapNoFocus,
        noTap: noTap,
        doubleTap: doubleTap
    };
});

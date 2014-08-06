/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'jquery'
], function ($) {
    'use strict';

    var event = {

        touchEvents: {
            'start': 'touchstart',
            'move': 'touchmove',
            'end': 'touchend'
        },

        mouseEvents: {
            'start': 'mousedown',
            'move': 'mousemove',
            'end': 'mouseup'
        },

        events: null,

        isTouch: window.ontouchstart !== undefined,

        TOUCH_THRESHOLD: 10,

        eventName: function (eventType) {
            if (!this.events) {
                this.events = this.isTouch ? this.touchEvents : this.mouseEvents;
            }
            return this.events[eventType];
        },

        /**
         * Returns an object that can be used to locate the event. i.e. it has the page and client
         * coordinates.
         */
        getLocEvent: function (event) {
            return this.isTouch ? event.targetTouches[0] : event;
        },

        inThreshold: function (hit, coords) {
            var result;
            if (Math.abs(hit.clientX - coords.x) <= this.TOUCH_THRESHOLD &&
                Math.abs(hit.clientY - coords.y) <= this.TOUCH_THRESHOLD) {
                result = true;
            }
            return result;
        },

        /**
         * obj can be either a node or an event. Returns a jQuery object that contains the editable. This
         * can be empty.
         */
        getEditable: function (obj) {
            var el = $.Event.prototype.isPrototypeOf(obj) ? $(obj.target) : obj;
            return $(el).closest('[contenteditable=true]');
        }
    };

    return {
        eventName: event.eventName.bind(event),
        isTouch: event.isTouch,
        getLocEvent: event.getLocEvent.bind(event),
        inThreshold: event.inThreshold.bind(event),
        getEditable: event.getEditable
    };
});

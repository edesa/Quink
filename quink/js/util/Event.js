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
    'Underscore'
], function (_) {
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

        isTouch: window.hasOwnProperty('ontouchstart'),
        TOUCH_THRESHOLD: 5,

        eventName: function (eventType) {
            if (!this.events) {
                this.events = this.isTouch ? this.touchEvents : this.mouseEvents;
            }
            return this.events[eventType];
        },

        getClientCoords: function (event) {
            var coords = {};
            if (event.type === 'mousedown') {
                coords.x = event.clientX;
                coords.y = event.clientY;
            } else {
                coords.x = event.targetTouches[0].clientX;
                coords.y = event.targetTouches[0].clientY;
            }
            return coords;
        },

        inThreshold: function (event, coords) {
            var hit = this.isTouch ? event.touches[0] : event,
                result = false;
            if (Math.abs(hit.clientX - coords.x) <= this.TOUCH_THRESHOLD &&
                Math.abs(hit.clientY - coords.y) <= this.TOUCH_THRESHOLD) {
                result = true;
            }
            return result;
        }
    };

    return {
        eventName: _.bind(event.eventName, event),
        isTouch: event.isTouch,
        getClientCoords: event.getClientCoords,
        inThreshold: _.bind(event.inThreshold, event)
    };
});

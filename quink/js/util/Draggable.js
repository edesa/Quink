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

/**
 * Makes an element draggable.
 * Note that we have to use the native (non-jQuery) mechanism for event addition and removal
 * because jQuery doesn't handle the touch events.
 */
define([
    'Underscore',
    'jquery',
    'util/Event',
    'util/FocusTracker',
    'util/PubSub'
], function (_, $, Event, FocusTracker, PubSub) {
    'use strict';

    var Draggable = function (selector) {
        this.draggable = $(selector);
        this.offX = this.offY = 0;
        this.startCoords = null;
        this.draggable[0].addEventListener(Event.eventName('start'), $.proxy(this.onDragStart, this));
    };

    Draggable.prototype.onDragStart = function (event) {
        var draggableEl = this.draggable[0],
            pos = this.draggable.css(['left', 'top']);
        this.startCoords = Event.getClientCoords(event);
        this.offX = event.pageX - (parseInt(pos.left, 10) || draggableEl.offsetLeft);
        this.offY = event.pageY - (parseInt(pos.top, 10) || draggableEl.offsetHeight);
        this.onDragProxy = this.onDragProxy || $.proxy(this.onDrag, this);
        this.onDragEndProxy = this.onDragEndProxy || $.proxy(this.onDragEnd, this);
        document.addEventListener(Event.eventName('move'), this.onDragProxy, false);
        document.addEventListener(Event.eventName('end'), this.onDragEndProxy, false);
    };

    Draggable.prototype.TOUCH_THRESHOLD = 10;

    /**
     * Always preventDefault to stop the whole page from scrolling on the device.
     */
    Draggable.prototype.onDrag = function (event) {
        event.preventDefault();
        if (!Event.inThreshold(event, this.startCoords)) {
            this.dragging = true;
            this.draggable.css({
                'left': event.pageX - this.offX,
                'top': event.pageY - this.offY
            });
        }
    };

    Draggable.prototype.onDragEnd = function (event) {
        if (this.dragging) {
            event.preventDefault();
            this.dragging = false;
            _.delay(function () {
                FocusTracker.restoreFocus();
            }, 0);
        }
        this.offX = this.offY = 0;
        this.startCoords = null;
        document.removeEventListener(Event.eventName('move'), this.onDragProxy);
        document.removeEventListener(Event.eventName('end'), this.onDragEndProxy);
        PubSub.publish('draggable.dragend', this.draggable[0]);
    };

    function create(selector) {
        return new Draggable(selector);
    }

    return {
        create: create
    };
});

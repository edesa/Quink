/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

/**
 * Makes an element draggable.
 */
define([
    'jquery',
    'util/Event',
    'util/PubSub'
], function ($, Event, PubSub) {
    'use strict';

    var Draggable = function (selector) {
        this.draggable = $(selector);
        this.offX = this.offY = 0;
        this.startCoords = null;
        this.draggable[0].addEventListener(Event.eventName('start'), this.onDragStart.bind(this));
    };

    /**
     * preventDefault stops the drag from extending the selection in Safari.
     */
    Draggable.prototype.onDragStart = function (event) {
        var draggableEl = this.draggable[0],
            pos = this.draggable.css(['left', 'top']),
            locEvent = Event.getLocEvent(event);
        this.startCoords = {
            x: locEvent.clientX,
            y: locEvent.clientY
        };
        event.preventDefault();
        this.offX = locEvent.pageX - parseInt(pos.left, 10);
        this.offY = locEvent.pageY - parseInt(pos.top, 10);
        this.onDragProxy = this.onDragProxy || this.onDrag.bind(this);
        this.onDragEndProxy = this.onDragEndProxy || this.onDragEnd.bind(this);
        document.addEventListener(Event.eventName('move'), this.onDragProxy, false);
        document.addEventListener(Event.eventName('end'), this.onDragEndProxy, false);
    };

    /**
     * Always preventDefault to stop the whole page from scrolling on the device.
     */
    Draggable.prototype.onDrag = function (event) {
        var locEvent = Event.getLocEvent(event);
        event.preventDefault();
        if (this.dragging || !Event.inThreshold(locEvent, this.startCoords)) {
            this.dragging = true;
            this.draggable.css({
                'left': locEvent.pageX - this.offX,
                'top': locEvent.pageY - this.offY
            });
        }
    };

    Draggable.prototype.onDragEnd = function (event) {
        if (this.dragging) {
            event.preventDefault();
            this.dragging = false;
            PubSub.publish('draggable.dragend', this.draggable[0]);
        }
        this.offX = this.offY = 0;
        this.startCoords = null;
        document.removeEventListener(Event.eventName('move'), this.onDragProxy);
        document.removeEventListener(Event.eventName('end'), this.onDragEndProxy);
    };

    function create(selector) {
        return new Draggable(selector);
    }

    return {
        create: create
    };
});

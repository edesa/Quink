/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'jquery',
    'util/Event'
], function ($, Event) {
    'use strict';

    var Mask = function (onHide, opacity) {
        this.onHide = onHide;
        this.opacity = opacity;
    };

    Mask.prototype.createMask = function () {
        var mask = $('<div>').addClass('qk_mask')
            .on('touchmove', function (event) {
                event.preventDefault();
            })
            .on(Event.eventName('start'), this.onTap.bind(this));
        if (this.opacity !== undefined) {
            mask.css('opacity', this.opacity);
        }
        return mask;
    };

    Mask.prototype.onTap = function (event) {
        event.preventDefault();
        this.hide();
        if (typeof this.onHide === 'function') {
            this.onHide();
        }
    };

    Mask.prototype.hide = function () {
        this.mask.detach();
    };

    Mask.prototype.show = function () {
        var mask = this.mask;
        if (!mask) {
            this.mask = this.createMask();
            mask = this.mask;
        }
        // Pure css approach doesn't work on iOS
        mask.height($(document).height());
        mask.appendTo('body');
    };

    function create(onHide, opacity) {
        var instance = new Mask(onHide, opacity);
        return {
            show: instance.show.bind(instance),
            hide: instance.hide.bind(instance)
        };
    }

    return {
        create: create
    };
});

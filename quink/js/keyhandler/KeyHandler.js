/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'Underscore',
    'jquery'
], function (_, $) {
    'use strict';

    var KeyHandler = function (selector, mgr) {
        this.container = $(selector);
        this.mgr = mgr;
    };

    KeyHandler.prototype.getContainer = function () {
        return this.container;
    };

    KeyHandler.prototype.getMgr = function () {
        return this.mgr;
    };

    KeyHandler.prototype.init = function () {
        if (!this.keyListenerFunc) {
            if (!_.isFunction(this.keyListener)) {
                throw new Error('keyListener has to be defined');
            }
            this.keyListenerFunc = _.bind(this.keyListener, this);
        }
    };

    KeyHandler.prototype.start = function () {
        this.init();
        this.container.on('keydown', this.keyListenerFunc);
    };

    KeyHandler.prototype.stop = function () {
        this.container.off('keydown', this.keyListenerFunc);
    };

    KeyHandler.prototype.switchMode = function () {
        this.stop();
        this.getMgr().switchMode();
    };

    return KeyHandler;
});

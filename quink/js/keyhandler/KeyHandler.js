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

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
    'locrange/LocRange',
    'util/Type'
], function (LocRange, Type) {
    'use strict';

    /**
     * A locatable range that won't mutate the DOM. If DOM mutation is needed in order to locate the
     * range then the range will be unlocatable and an indicator set.
     */
    var SafeLocRange = function (range, isDown) {
        this.isLocatable = true;
        Type.callSuper(this, 'constructor', range, isDown);
    };

    Type.inheritFrom(SafeLocRange, LocRange);

    SafeLocRange.prototype.locateByWrapping = function () {
        this.isLocatable = false;
        return undefined;
    };

    SafeLocRange.prototype.locateUsingEl = function () {
        this.isLocatable = false;
        return undefined;
    };

    SafeLocRange.prototype.getX = function () {
        return this.isLocatable && Type.callSuper(this, 'getX');
    };

    SafeLocRange.prototype.getTop = function () {
        return this.isLocatable && Type.callSuper(this, 'getTop');
    };

    SafeLocRange.prototype.getBottom = function () {
        return this.isLocatable && Type.callSuper(this, 'getBottom');
    };

    return SafeLocRange;
});

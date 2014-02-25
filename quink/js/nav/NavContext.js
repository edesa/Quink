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
    'nav/LocRange',
    'nav/Position'
], function (LocRange, Position) {
    'use strict';

    var NavContext = function () {
        // A LocRange.
        this.best = null;

        // A LocRange. The end point for the navigation.
        this.result = null;
    };

    NavContext.prototype.setNavStart = function (origin) {
        this.start = new LocRange(origin.cloneRange(), this.isDown);
    };

    NavContext.prototype.setOrigin = function (xAnchor) {
        this.origin = new Position(xAnchor.getX(), this.start.getBottom());
    };

    NavContext.prototype.clear = function () {
        this.start.detach();
    };

    NavContext.prototype.compare = function (dirRange) {
        return this.comparator.compare(dirRange, this).process();
    };

    NavContext.prototype.getNavStart = function () {
        return this.start.getNavStart();
    };

    /**
     * Indicates whether navigation using this context should result in a change to
     * the x-anchor.
     */
    NavContext.prototype.shouldSetXAnchor = function () {
        return false;
    };

    return NavContext;
});

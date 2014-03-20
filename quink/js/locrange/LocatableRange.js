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
], function () {
    'use strict';

    /**
     * This is what's returned to clients as part of the selection change publication.
     * isCollapsed refers to the original unlocated range. The locatable range will not be
     * collapsed as collapsed ranges have no location on the page.
     */
    var LocatableRange = function (safeRange, isCollapsed) {
        this.safeRange = safeRange;
        this.collapsed = isCollapsed;
    };

    LocatableRange.prototype.getX = function () {
        return this.safeRange.getX();
    };

    LocatableRange.prototype.getTop = function () {
        return this.safeRange.getTop();
    };

    LocatableRange.prototype.getBottom = function () {
        return this.safeRange.getBottom();
    };

    LocatableRange.prototype.isLocatable = function () {
        return this.safeRange.isLocatable;
    };

    LocatableRange.prototype.isCollapsed = function () {
        return this.collapsed;
    };

    return LocatableRange;
});

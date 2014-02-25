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
    'nav/NavContext',
    'nav/LineEndComparator',
], function (NavContext, LineEndComparator) {
    'use strict';

    /**
     * The context within which the navigation takes place.
     */
    var LineEndContext = function (isDown) {
        this.isDown = isDown;

        // this.comparator = new NavComparator(isDown);
        this.comparator = new LineEndComparator(isDown);
    };

    LineEndContext.prototype = new NavContext();

    LineEndContext.prototype.setBest = function (newBest) {
        this.best = newBest;
    };

    LineEndContext.prototype.getBest = function () {
        return this.best;
    };

    LineEndContext.prototype.process = function () {
        if (this.result) {
            this.result.selectToBound(!this.isDown);
        }
        return this.result;
    };

    /**
     * Selects the navigation best fit if no better navigation end point was found.
     */
    LineEndContext.prototype.checkSelectBest = function () {
        if (!this.result && this.best) {
            this.result = this.best;
            this.best = null;
            this.result.selectToBound(!this.isDown);
        }
    };

    LineEndContext.prototype.shouldSetXAnchor = function () {
        return true;
    };

    return LineEndContext;
});

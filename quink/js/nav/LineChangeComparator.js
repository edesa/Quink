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
    'nav/NavComparator'
], function (NavComparator) {
    'use strict';

    /**
     * Detects changes from one line to another while navigating. Takes into account the
     * desired x position on the new line.
     */
    var LineChangeComparator = function (isDown) {
        this.setDown(isDown);
        this.isBefore = isDown ? this.isLeft : this.isRight;
    };

    LineChangeComparator.prototype = new NavComparator();

    LineChangeComparator.prototype.isLeft = function (first, second) {
        return first.getX() < second.getX();
    };

    LineChangeComparator.prototype.isRight = function (first, second) {
        return first.getX() > second.getX();
    };

    LineChangeComparator.prototype.isOn = function (first, second) {
        return first.getX() === second.getX();
    };

    /**
     * Compares two locatable objects to determine whether the desired vertical
     * navigation has taken place. best is the current best-fit range for the navigation.
     * Updates the context object with the results of the comparison and returns the updated context.
     */
    LineChangeComparator.prototype.compare = function (first, context) {
        if (this.isLineBefore(context.origin, first)) {
            if (context.best && this.isLineBefore(context.best, first)) {
                // gone to the next line - use the last range
                context.result = context.best;
                context.best = null;
                context.isNewLine = true;
            } else if (this.isOn(first, context.origin) || this.isBefore(context.origin, first)) {
                // right line, either on or past the desired x-coord.
                context.result = first;
                context.isNewLine = !context.best;
            } else {
                // the right line, keep the range as the current best fit.
                if (context.best) {
                    context.best.detach();
                }
                context.best = first;
            }
        }
        return context;
    };

    return LineChangeComparator;
});

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
    var LineEndComparator = function (isDown) {
        this.setDown(isDown);
    };

    LineEndComparator.prototype = new NavComparator();

    /**
     * Compares two locatable objects to determine whether the desired vertical
     * navigation has taken place. best is the current best-fit range for the navigation.
     * Updates the context object with the results of the comparison and returns the updated context.
     */
    LineEndComparator.prototype.compare = function (first, context) {
        if (this.isLineBefore(context.origin, first)) {
            context.result = context.getBest();
        } else {
            context.setBest(first);
        }
        return context;
    };

    return LineEndComparator;
});

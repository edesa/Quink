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
    'rangy',
    'locrange/LocatableRange',
    'locrange/SafeLocRange'
], function (rangy, LocatableRange, SafeLocRange) {
    'use strict';

    /**
     * If there's a current selection this returns an object that can be used to locate that
     * selection. Returns a falsey value if there's no current selection.
     */
    function getSelectionLoc() {
        var sel = rangy.getSelection(),
            range, locRange;
        if (sel.rangeCount) {
            range = sel.getRangeAt(0);
            locRange = new LocatableRange(new SafeLocRange(range.cloneRange()).locate(), range.collapsed);
        }
        return locRange;
    }

    return {
        getSelectionLoc: getSelectionLoc
    };
});

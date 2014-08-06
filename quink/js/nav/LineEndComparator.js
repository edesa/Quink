/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
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

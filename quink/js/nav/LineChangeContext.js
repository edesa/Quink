/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'nav/NavContext',
    'nav/LineChangeComparator'
], function (NavContext, LineChangeComparator) {
    'use strict';

    /**
     * The context within which the navigation takes place.
     */
    var LineChangeContext = function (isDown) {
        this.isDown = isDown;

        // this.comparator = new NavComparator(isDown);
        this.comparator = new LineChangeComparator(isDown);
    };

    LineChangeContext.prototype = new NavContext();

    LineChangeContext.prototype.process = function () {
        if (this.result) {
            this.result.select(this.origin, this.isNewLine);
        }
        return this.result;
    };

    /**
     * Selects the navigation best fit if no better navigation end point was found.
     */
    LineChangeContext.prototype.checkSelectBest = function () {
        if (!this.result && this.best) {
            this.result = this.best;
            this.best = null;
            this.result.select(this.origin);
        }
    };

    return LineChangeContext;
});

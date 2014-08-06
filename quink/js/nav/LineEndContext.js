/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
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

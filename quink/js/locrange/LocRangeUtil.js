/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'rangy-core',
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

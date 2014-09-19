/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'command/ApplyStyleHandler',
    'ui/PopupMenu',
    'util/Func',
    'util/PubSub',
    'util/StylesheetMgr'
], function (ApplyStyleHandler, PopupMenu, Func, PubSub, StylesheetMgr) {
    'use strict';

    function createDefs(defsFuncName) {
        return Func.exec({}, defsFuncName, StylesheetMgr.getInstance().getStylesheet());
    }

    function onSelect(newValue, oldValue) {
        if (newValue !== 'close') {
            if (newValue !== oldValue) {
                PubSub.publish('command.exec', 'style.apply.' + oldValue);
            }
            PubSub.publish('command.exec', 'style.apply.' + newValue);
        }
    }

    function getState(menuDefs) {
        return ApplyStyleHandler.getInstance().isApplied(menuDefs.map(function (def) {
            return def.value;
        }));
    }

    function create(defsFuncName, isMultiSelect) {
        var defs = createDefs(defsFuncName);
        return PopupMenu.create(defs, getState, onSelect, isMultiSelect);
    }

    return {
        create: create
    };
});

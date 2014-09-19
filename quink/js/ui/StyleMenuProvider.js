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

    /**
     * Creates and returns a menu item definition given a css rule.
     */
    function createStyleDef(rule) {
        var style = rule.selectorText.replace(/^./, '');
        return {
            value: style,
            label: style.replace(/_/g, ' '),
            cssClass: style
        };
    }

    /**
     * Runs through all of the rules in the stylesheet invoking filter on each one. Those that pass the
     * filter are handed to createStyleDef. An array of the objects returned from createStyleDef is returned
     * from this function.
     */
    function mapFilter(stylesheet, filter) {
        var result = [];
        Array.prototype.forEach.call(stylesheet.cssRules, function (rule) {
            if (filter(rule)) {
                result.push(createStyleDef(rule));
            }
        });
        return result;
    }

    function createDefs(ruleFilterName) {
        return mapFilter(StylesheetMgr.getInstance().getStylesheet(), Func.getBound({}, ruleFilterName));
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

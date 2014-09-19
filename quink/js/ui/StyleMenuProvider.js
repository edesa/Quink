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
     * By default style menu item labels are the style name with any underscores replaced by spaces.
     */
    function defaultLabelFunc(style) {
        return style.replace(/_/g, ' ');
    }

    /**
     * Creates and returns a menu item definition given a css rule.
     */
    function createStyleDef(rule, labelFunc) {
        var style = rule.selectorText.replace(/^./, '');
        return {
            value: style,
            label: labelFunc(style),
            cssClass: style
        };
    }

    /**
     * Runs through all of the rules in the stylesheet invoking filter on each one. Those that pass the
     * filter are handed to createStyleDef. An array of the objects returned from createStyleDef is returned
     * from this function.
     */
    function mapFilter(stylesheet, filter, labelFunc) {
        var result = [];
        Array.prototype.forEach.call(stylesheet.cssRules, function (rule) {
            if (filter(rule)) {
                result.push(createStyleDef(rule, labelFunc));
            }
        });
        return result;
    }

    function createDefs(ruleFilterName, labelFuncName) {
        var labelFunc = Func.getBound({}, labelFuncName) || defaultLabelFunc;
        return mapFilter(StylesheetMgr.getInstance().getStylesheet(), Func.getBound({}, ruleFilterName), labelFunc);
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

    /**
     * Only the first argument is required. If the label function is falsey a default is used and multiselect
     * defaults to false.
     */
    function create(defsFuncName, labelFuncName, isMultiSelect) {
        var defs = createDefs(defsFuncName, labelFuncName);
        return PopupMenu.create(defs, getState, onSelect, isMultiSelect);
    }

    return {
        create: create
    };
});

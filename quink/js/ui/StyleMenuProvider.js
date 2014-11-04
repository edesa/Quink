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

    function addCloseItem(items, isMultiSelect) {
        items.push({
            value: 'close',
            label: isMultiSelect ? 'close' : 'cancel'
        });
    }
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
        var style = rule.selectorText.replace(/^\./, '');
        return {
            value: style,
            label: labelFunc(style, rule),
            cssClass: style
        };
    }

    /**
     * Runs through all of the rules in the stylesheet invoking filter on each one. Those that pass the
     * filter are handed to createStyleDef. An array of the objects returned from createStyleDef is returned
     * from this function.
     */
    function mapFilter(stylesheet, filter, labelFunc, isMultiSelect) {
        var result = [];
        Array.prototype.forEach.call(stylesheet.cssRules, function (rule) {
            if (filter(rule)) {
                result.push(createStyleDef(rule, labelFunc));
            }
        });
        addCloseItem(result, isMultiSelect);
        return result;
    }

    function createDefs(ruleFilterName, labelFuncName, isMultiSelect, context) {
        var ctx = context || {},
            labelFunc = Func.getBound(ctx, labelFuncName) || defaultLabelFunc,
            filterFunc = Func.getBound(ctx, ruleFilterName);
        if (!filterFunc) {
            throw new Error('Can\'t resolve rule filter: ' + ruleFilterName);
        }
        return mapFilter(StylesheetMgr.getInstance().getStylesheet(), filterFunc, labelFunc, isMultiSelect);
    }

    function onSelect(selected, deselected) {
        if (selected) {
            PubSub.publish('command.exec', 'style.apply.' + selected);
        }
        if (deselected) {
            PubSub.publish('command.exec', 'style.apply.' + deselected);
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
    function create(ruleFilterName, labelFuncName, isMultiSelect, context) {
        var defs = createDefs(ruleFilterName, labelFuncName, isMultiSelect, context);
        return PopupMenu.create(defs, onSelect, getState, isMultiSelect);
    }

    return {
        create: create
    };
});

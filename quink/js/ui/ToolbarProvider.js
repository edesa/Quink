/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'Underscore',
    'jquery'
], function (_, $) {
    'use strict';

    var ToolbarProvider = function (tbTpl, tbDef) {
        this.toolbarTpl = tbTpl;
        this.toolbarDef = tbDef;
    };

    ToolbarProvider.prototype.orderToolbarItems = function (toolbarDef) {
        toolbarDef.groups = _.sortBy(toolbarDef.groups, 'index');
        _.each(toolbarDef.groups, function (grp) {
            grp.items = _.sortBy(grp.items, 'index');
        });
        return toolbarDef;
    };

    /**
     * Applies defaults to the objs array. If forceApply is true the defaults overwrite values in the
     * array, otherwise they are only applied if the object has no value for that property.
     * Recursively sets defaults in the the items array.
     */
    ToolbarProvider.prototype.applyDefaults = function (objs, defaults, forceApply, defaultCommand) {
        var dflt = defaults.group || defaults;
        objs.forEach(function (obj) {
            Object.keys(dflt).forEach(function (propName) {
                if (forceApply || obj[propName] === undefined) {
                    obj[propName] = dflt[propName];
                }
            });
            if (defaultCommand) {
                this.setCommand(obj);
            }
            if (obj.items) {
                this.applyDefaults(obj.items, defaults.item, forceApply, false);
            }
        }.bind(this));
    };

    /**
     * Changes the index of objects to get them into the desired order. Doesn't actually move the objects.
     */
    ToolbarProvider.prototype.orderObjects = function (objects, oldIndex, newIndex) {
        objects.forEach(function (obj) {
            if ((oldIndex < newIndex) && (obj.index > oldIndex && obj.index <= newIndex)) {
                obj.index--;
            } else if ((oldIndex > newIndex) && (obj.index >= newIndex && obj.index < oldIndex)) {
                obj.index++;
            }
        });
    };

    ToolbarProvider.prototype.findInList = function (list, id) {
        return _.find(list, function (obj) {
            return obj.id === id;
        });
    };

    ToolbarProvider.prototype.findItem = function (groups, items, itemId) {
        var item = this.findInList(items, itemId);
        if (!item) {
            _.find(groups, function (grp) {
                item = this.findInList(grp.items, itemId);
                return !!item;
            }, this);
            if (item) {
                item = $.extend(true, {}, item);
                items.push(item);
            }
        }
        return item;
    };

    /**
     * Names of the toolbar json defs that can be changed via configureToolbar.
     */
    ToolbarProvider.prototype.TOOLBAR_GROUP_PROPS = [
        'active',
        'command',
        'commandArgs',
        'cssClass',
        'hidden',
        'index',
        'label',
        'repeat',
        'selectId',
        'type',
        'value'
    ];

    /**
     * Sets properties in srcObj from those in editObj. forceUpdate indicates whether editObj values
     * will overwrite values in srcObj.
     */
    ToolbarProvider.prototype.updateObject = function (srcObj, editObj, forceUpdate) {
        var args = [editObj].concat(ToolbarProvider.prototype.TOOLBAR_GROUP_PROPS),
            editProps = _.pick.apply(null, args);
        Object.keys(editProps).forEach(function (propName) {
            if (srcObj[propName] === undefined || forceUpdate) {
                srcObj[propName] = editObj[propName];
            }
        });
    };

    /**
     * Updates srcItems to reflect the changes specified in editItems.
     */
    ToolbarProvider.prototype.mergeItems = function (srcGroups, srcGroup, editGroup) {
        var srcItems = srcGroup.items;
        editGroup.items.forEach(function (editItem) {
            var srcItem = this.findItem(srcGroups, srcItems, editItem.id);
            if (srcItem) {
                if (editItem.index !== undefined) {
                    this.orderObjects(srcItems, srcItem.index, editItem.index);
                }
                this.updateObject(srcItem, editItem, true);
            } else {
                srcGroup.items.push($.extend({}, editItem));
                this.orderObjects(srcItems, 0, editItem.index);
            }
        }, this);
    };

    /**
     * Applies the default setting for the command and commandArgs group properties if appropriate.
     */
    ToolbarProvider.prototype.setCommand = function (group) {
        if (group.command === undefined) {
            group.command = 'showTab';
        }
        if (group.commandArgs === undefined) {
            group.commandArgs = group.id;
        }
    };

    /**
     * Merges the edit definitions into the src definitions to produce a merged toolbar definition.
     * src and edits are arrays of objects. Updates the src array in place. Adjusts index properties
     * as needed.
     */
    ToolbarProvider.prototype.mergeGroups = function (src, edits) {
        edits.forEach(function (editGrp) {
            var srcGrp = this.findInList(src, editGrp.id);
            if (!srcGrp) {
                srcGrp = $.extend({}, editGrp);
                this.setCommand(srcGrp);
                srcGrp.items = [];
                src.push(srcGrp);
                if (editGrp.items) {
                    this.mergeItems(src, srcGrp, editGrp);
                }
            } else {
                if (editGrp.index !== undefined) {
                    this.orderObjects(src, srcGrp.index, editGrp.index);
                }
                this.updateObject(srcGrp, editGrp, true);
                if (editGrp.items) {
                    this.mergeItems(src, srcGrp, editGrp);
                }
            }
        }, this);
    };

    /**
     * These will be overriden by any defaults specified via the configureToolbar function argument.
     */
    ToolbarProvider.prototype.TOOLBAR_DEFAULTS = {
        hidden: false,
        active: false
    };

    /**
     * Property names in the defaults object that are ignored when copying top level properties to the
     * more specific group and item default objects.
     */
    ToolbarProvider.prototype.TOOLBAR_DEFAULTS_EXCLUDE = [
        'group',
        'item'
    ];

    /**
     * Create an object that contains the defaults for this configuration. Any top level defaults properties
     * specified in the definition are used for both groups and items unless overriden by more specific values
     * in the group or item default objects.
     * No defaults results in the fallback values being used for both groups and items.
     */
    ToolbarProvider.prototype.createDefaults = function (def) {
        var result = {},
            defaults = def.defaults;
        result.group = $.extend(true, {}, this.TOOLBAR_DEFAULTS);
        result.item = $.extend(true, {}, this.TOOLBAR_DEFAULTS);
        if (defaults) {
            // Copy global defaults into each of the local default objects
            Object.keys(defaults).forEach(function (propName) {
                if (ToolbarProvider.prototype.TOOLBAR_DEFAULTS_EXCLUDE.indexOf(propName) < 0) {
                    result.group[propName] = defaults[propName];
                    result.item[propName] = defaults[propName];
                }
            });
            // Copy the local default objects
            if (defaults.group) {
                Object.keys(defaults.group).forEach(function (propName) {
                    result.group[propName] = defaults.group[propName];
                });
            }
            if (defaults.item) {
                Object.keys(defaults.item).forEach(function (propName) {
                    result.item[propName] = defaults.item[propName];
                });
            }
        }
        return result;
    };

    /**
     * New definition will be appied on top of the current definition after the defaults have been
     * applied. Defaults overwrite properties in the current definition but not in the supplied
     * definition.
     * The returned value is the html for the toolbar.
     */
    ToolbarProvider.prototype.createToolbar = function (def) {
        var workingDef = $.extend(true, {}, this.toolbarDef),
            defaults = this.createDefaults(def),
            editGroups = def.groups || [];
        this.applyDefaults(workingDef.groups, defaults, true, true);
        this.applyDefaults(editGroups, defaults, false, true);
        this.mergeGroups(workingDef.groups, editGroups);
        this.orderToolbarItems(workingDef);
        this.toolbarDef = workingDef;
        return _.template(this.toolbarTpl)(workingDef);
    };

    /**
     * Returns the name of the group that contains the most non hidden items.
     */
    ToolbarProvider.prototype.getWidestGroupName = function () {
        var widestTabObj = this.toolbarDef.groups.filter(function (grp) {
                return !grp.hidden;
            }).map(function (grp) {
                var length = grp.items.reduce(function (count, item) {
                        return item.hidden ? count : count + 1;
                    }, 0);
                return {
                    id: grp.id,
                    length: length
                };
            }).reduce(function (prevObj, currentObj) {
                return currentObj.length > prevObj.length ? currentObj : prevObj;
            });
        return widestTabObj.id;
    };

    /**
     * Returns the name of the active group.
     */
    ToolbarProvider.prototype.getActiveGroupName = function () {
        var firstVisibleGroupId,
            activeGroup = _.find(this.toolbarDef.groups, function (grp) {
                if (!grp.hidden) {
                    firstVisibleGroupId = firstVisibleGroupId || grp.id;
                }
                return grp.active && !grp.hidden;
            });
        return (activeGroup && activeGroup.id) || firstVisibleGroupId;
    };

    /**
     * Returns the most recent toolbar definition.
     */
    ToolbarProvider.prototype.getToolbarDefinition = function () {
        return this.toolbarDef;
    };

    return ToolbarProvider;
});

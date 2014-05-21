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

/*global QUINK */
define([
    'Underscore',
    'jquery',
    'rangy',
    'util/Event',
    'util/FastTap',
    'util/Draggable',
    'util/PubSub',
    'util/Env',
    'util/ViewportRelative',
    'hithandler/HitHandler'
], function (_, $, rangy, Event, FastTap, Draggable, PubSub, Env, ViewportRelative, HitHandler) {
    'use strict';

    var Toolbar = function () {
        HitHandler.register(this, true);
        PubSub.subscribe('plugin.insert.names', this.onPluginNames.bind(this));
    };

    Toolbar.prototype.TAB_NAME_PREFIX = 'qk_tab_';
    Toolbar.prototype.DEFAULT_TAB_NAME = 'misc';

    /**
     * Each command that has persistent (currently checkbox) state in the toolbar has to have
     * that toolbar state kept in sync with the underlying state. This hash is the command
     * string versus checkbox selector for those commands.
     */
    Toolbar.prototype.KEY_COMMAND_MAP = {
        'navandselect': '#nav_and_select',
        'statusbar': '#toggle_status_bar',
    };

    /**
     * Names of the toolbar json defs that can be changed via configureToolbar.
     */
    Toolbar.prototype.TOOLBAR_GROUP_PROPS = [
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
     * Defaults that are applied to all toolbar group and item definitions unless otherwise specified.
     */
    // Toolbar.prototype.TOOLBAR_ITEM_DEFAULTS = {
    //     hidden: false,
    //     active: false,
    //     repeat: false
    // };

    /**
     * Stores the name of the widest tab which will then be used to size the toolbar when
     * it's shown on the page.
     */
    Toolbar.prototype.initToolbarTabs = function (toolbarDef) {
        var widestTabObj = toolbarDef.groups.filter(function (grp) {
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
        this.widestTabName = widestTabObj.id;
    };

    Toolbar.prototype.hideCurrentDialog = function () {
        var dialog;
        if (this.activeDialogEl) {
            dialog = $(this.activeDialogEl);
            dialog.addClass('qk_hidden');
            dialog.find('button').each(function () {
                FastTap.noTap(this);
            });
            this.activeDialogEl = null;
        }
    };

    Toolbar.prototype.LINK_URL_SCHEME_BLACKLIST = [
        'javascript'
    ];

    Toolbar.prototype.LINK_URL_PREFIX = 'http://';

    /**
     * A link url must have a scheme that isn't in the black list and can't just be the default prefix.
     */
    Toolbar.prototype.getValidLinkUrl = function (userUrl) {
        var url = userUrl.trim(),
            scheme, validUrl, index;
        if (url && url.indexOf(':') > 0) {
            index = url.indexOf(this.LINK_URL_PREFIX);
            if (index < 0 || url.length > this.LINK_URL_PREFIX.length) {
                scheme = url.split(':')[0];
                if (this.LINK_URL_SCHEME_BLACKLIST.indexOf(scheme.toLowerCase()) < 0) {
                    validUrl = url;
                }
            }
        }
        return validUrl;
    };

    /**
     * Creates the link from the data entered by the user. The range passed in is the one that was
     * current when the create link dialog was initially shown.
     */
    Toolbar.prototype.onCreateLink = function (range) {
        var urlEdit = document.querySelector('#qk_edit_createlink'),
            url = this.getValidLinkUrl(urlEdit.value),
            textNode;
        if (url) {
            urlEdit.value = url;
            if (range) {
                if (range.collapsed) {
                    // No selected text - insert the url text and use that.
                    // WebKit does that anyway, FireFox doesn't.
                    range = range.cloneRange();
                    textNode = document.createTextNode(url);
                    range.insertNode(textNode);
                    range.setEndAfter(textNode);
                }
                rangy.getSelection().setSingleRange(range);
            }
            document.execCommand('createlink', false, url);
            this.hideCurrentDialog();
        }
    };

    /**
     * Cancel the link creation. The range passed in was the one current when the create link 
     * dialog was shown and is the one that is restored.
     */
    Toolbar.prototype.onCancelLink = function (range) {
        this.hideCurrentDialog();
        if (range) {
            rangy.getSelection().setSingleRange(range);
            document.querySelector('#qk_edit_createlink').value = '';
        }
    };

    /**
     * Shows the create link dialog.
     * The selection at the time the create link dialog is shown is used throughout the
     * link creation process. It's captured in the closure and handed to the create and
     * cancel link functions. This means that any changes to the selection made after this point
     * are ignored by this process. This avoids problems on the iPad where the selection is lost
     * and couldn't be reliably saved as when the user put focus into the create link edit box.
     */
    Toolbar.prototype.showCreateLinkDialog = function () {
        var elName = 'qk_dialog_createlink',
            dialog = document.querySelector('#' + elName),
            btnCreate = dialog.querySelector('#qk_button_createlink'),
            btnCancel = dialog.querySelector('#qk_button_cancel'),
            sel = rangy.getSelection(),
            range = sel.rangeCount > 0 && sel.getRangeAt(0),
            urlEdit = document.querySelector('#qk_edit_createlink');
        if (!urlEdit.value) {
            urlEdit.value = this.LINK_URL_PREFIX;
        }
        FastTap.fastTap(btnCreate, function () {
            this.onCreateLink(range);
        }, this, true);
        FastTap.fastTap(btnCancel, function () {
            this.onCancelLink(range);
        }, this, true);
        $(dialog).removeClass('qk_hidden');
        urlEdit.focus();
        this.activeDialogEl = dialog;
    };

    Toolbar.prototype.navLineStart = function () {
        PubSub.publish('command.exec', 'nav.line.start');
    };

    Toolbar.prototype.navLineEnd = function () {
        PubSub.publish('command.exec', 'nav.line.end');
    };

    Toolbar.prototype.navLineUp = function () {
        PubSub.publish('command.exec', 'nav.line.up');
    };

    Toolbar.prototype.navLineDown = function () {
        PubSub.publish('command.exec', 'nav.line.down');
    };

    Toolbar.prototype.navCharLeft = function () {
        PubSub.publish('command.exec', 'nav.char.prev');
    };

    Toolbar.prototype.navWordLeft = function () {
        PubSub.publish('command.exec', 'nav.word.prev');
    };

    Toolbar.prototype.navCharRight = function () {
        PubSub.publish('command.exec', 'nav.char.next');
    };

    Toolbar.prototype.navWordRight = function () {
        PubSub.publish('command.exec', 'nav.word.next');
    };

    Toolbar.prototype.navAndSelect = function () {
        PubSub.publish('command.exec', 'nav.select.toggle');
    };

    Toolbar.prototype.infoHelp = function () {
        PubSub.publish('command.exec', 'info.help');
    };

    Toolbar.prototype.infoKeybindings = function () {
        PubSub.publish('command.exec', 'info.keybindings');
    };

    Toolbar.prototype.infoLicense = function () {
        PubSub.publish('command.exec', 'info.license');
    };

    Toolbar.prototype.infoReleaseNotes = function () {
        PubSub.publish('command.exec', 'info.releasenotes');
    };

    Toolbar.prototype.infoAbout = function () {
        PubSub.publish('command.exec', 'info.about');
    };

    Toolbar.prototype.showInsertMenu = function (event) {
        var hit = Event.isTouch ? event.changedTouches[0] : event;
        this.insertMenu.css({
            'top': hit.pageY,
            'left': hit.pageX
        }).appendTo('body').removeClass('qk_hidden');
    };

    Toolbar.prototype.toggleStatusBar = function () {
        PubSub.publish('command.exec', 'ui.status.toggle');
    };

    Toolbar.prototype.submitDocument = function () {
        PubSub.publish('command.exec', 'persist.submit');
    };

    Toolbar.prototype.save = function () {
        PubSub.publish('command.exec', 'persist.save');
    };

    Toolbar.prototype.openPluginFromToolbar = function (event, pluginId) {
        PubSub.publish('command.exec', 'insert.' + pluginId);
    };

    /**
     * For commands that are going to use the browser's execCommand.
     */
    Toolbar.prototype.execCommand = function () {
        var cmdArgs = Array.prototype.slice.call(arguments, 1),
            cmdStr = 'edit.' + cmdArgs.join('.');
        PubSub.publish('command.exec', cmdStr);
    };

    /**
     * Execute a function. Id is the function name and args is an array of arguments the
     * first of which is the event object.
     */
    Toolbar.prototype.execFunc = function (id, args) {
        var func = this[id];
        if (typeof func === 'function') {
            func.apply(this, args);
        } else {
            console.log('no function: ' + id);
        }
    };

    /**
     * Executes commands based on the event.
     * If the element has a data-cmd attribute it's value is assumed to be the name of a
     * function and that function is invoked with the event as the first argument and any arguments present
     * in the data-cmd-args attribute passed in as remaining arguments.
     */
    Toolbar.prototype.cmdHandler = function (event) {
        var el = $(event.currentTarget),
            cmd = el.attr('data-cmd'),
            cmdArgs = el.attr('data-cmd-args'),
            argsArray = [];
        if (cmd) {
            if (cmdArgs) {
                argsArray = cmdArgs.split(' ');
            }
            argsArray.splice(0, 0, event);
            this.execFunc(cmd.trim(), argsArray);
        } else {
            console.log('no data-cmd attribute');
        }
    };

    /**
     * Ensures that toolbar items that have persistent state (checkboxes) have that state kept
     * up to date.
     */
    Toolbar.prototype.processCheckboxState = function (state) {
        Object.keys(state).forEach(function (key) {
            var sel = this.KEY_COMMAND_MAP[key],
                checkbox;
            if (sel) {
                checkbox = this.toolbar.find(sel);
                checkbox.prop('checked', state[key]);
            }
        }.bind(this));
    };

    /**
     * Keep the active state of the toolbar buttons in sync with the state at the document's text
     * insertion point.
     * The state argument is a hash of command name versus current state (true|false|<string>).
     */
    Toolbar.prototype.onCommandState = function (state) {
        this.lastCommandState = state;
        this.toolbar.find('[data-cmd=execCommand]').each(function () {
            var btn = $(this),
                cmdAr = btn.attr('data-cmd-args').split(' '),
                cmd = cmdAr[0],
                st = state[cmd],
                func, args;
            if (st !== undefined) {
                if (typeof st === 'boolean') {
                    func = st ? btn.addClass : btn.removeClass;
                } else {
                    args = cmdAr[1];
                    func = args === st ? btn.addClass : btn.removeClass;
                }
                func.call(btn, 'qk_button_active');
            }
        });
        this.processCheckboxState(state);
    };

    /**
     * Adds listeners for the toolbar buttons. Prevent the UI from changing the state of check boxes. They'll be
     * changed as the editor state is updated and the toolbar informed via PubSub.
     */
    Toolbar.prototype.addToolbarButtonListeners = function () {
        var toolbar = this;
        $('.qk_toolbar_container .qk_button').each(function () {
            var willRepeat = this.hasAttribute('data-btn-repeat');
            FastTap.fastTap(this, toolbar.cmdHandler, toolbar, true, willRepeat);
        });
        $('.qk_toolbar_container .qk_button input[type=checkbox]').on('click ' + Event.eventName('start'), function (event) {
            event.preventDefault();
        });
    };

    Toolbar.prototype.hideToolbar = function () {
        this.hideCurrentDialog();
        this.toolbar.addClass('qk_hidden');
    };

    Toolbar.prototype.hideCurrentTabPanel = function () {
        this.hideCurrentDialog();
        this.toolbar.find('.qk_tab').not('.qk_hidden').addClass('qk_hidden');
    };

    Toolbar.prototype.showTabPanel = function (tabName) {
        this.hideCurrentTabPanel();
        this.toolbar.find('#' + this.TAB_NAME_PREFIX + tabName).removeClass('qk_hidden');
        this.toolbar.find('.qk_tab_active').removeClass('qk_tab_active');
        this.toolbar.find('[data-tab=' + tabName + ']').addClass('qk_tab_active');
    };

    Toolbar.prototype.showTab = function (event, tabName) {
        this.showTabPanel(tabName);
    };

    Toolbar.prototype.addToolbarTabListeners = function (document) {
        var closeTab = document.querySelector('#qk_button_close'),
            toolbar = this;
        FastTap.fastTap(closeTab, this.hideToolbar, this);
        $('.qk_toolbar_tab_button').each(function () {
            FastTap.fastTapNoFocus(this, toolbar.cmdHandler.bind(toolbar));
        });
    };

    Toolbar.prototype.handle = function (event) {
        var hit, handled;
        if (event.hitType === 'double') {
            hit = Event.isTouch ? event.event.originalEvent.changedTouches[0] : event.event;
            this.showToolbarAt(hit.pageX, hit.pageY);
            this.vpToolbar.adjust();
            handled = true;
        }
        return handled;
    };

    /**
     * Plugins is an array of objects each of which contains a plugin id and a plugin name. Sort
     * the objects so that the menu is shown in ascending alphabetical order. 
     */
    Toolbar.prototype.createInsertMenu = function (menu, plugins) {
        _.sortBy(plugins, function (def) {
            return def.name.toLowerCase();
        }).reverse().forEach(function (plugin) {
            $('<div>').addClass('qk_popup_menu_item')
                .attr('data-plugin-id', plugin.id)
                .html(plugin.name)
                .prependTo(menu);
        });
        menu.on(Event.eventName('start'), function (event) {
            // Prevents tapping on the menu from moving focus off the editable.
            event.preventDefault();
        });
        menu.on(Event.eventName('end'), function (event) {
            var id = $(event.target).attr('data-plugin-id');
            if (id) {
                PubSub.publish('command.exec', 'insert.' + id);
            }
            menu.addClass('qk_hidden').detach();
        });
    };

    Toolbar.prototype.addPluginsToToolbar = function (plugins) {
        var toolbar = this,
            pluginMenuBtn = this.toolbar.find('#qk_button_plugin_menu');
        if (pluginMenuBtn.length) {
            plugins.forEach(function (plugin) {
                var iconUrl = 'url(' + Env.pluginAdapter(plugin.icon) + ')',
                    span = $('<span>').addClass('qk_button_bg').css('background-image', iconUrl),
                    btn = $('<button>').addClass('qk_button')
                            .attr('data-cmd', 'openPluginFromToolbar')
                            .attr('data-cmd-args', plugin.id)
                            .append(span)
                            .insertBefore(pluginMenuBtn);
                FastTap.fastTap(btn[0], toolbar.cmdHandler, toolbar, true);
            });
        }
    };

    /**
     * Add plugins to the toolbar or the plugin (insert) menu as appropriate. If there are no
     * plugins added to the menu, don't display the plugin menu icon on the toolbar.
     */
    Toolbar.prototype.processPluginData = function (pluginData, menu) {
        var toolbarPlugins = _.filter(pluginData, function (item) {
                return !!item.onToolbar;
            }),
            menuPlugins = _.difference(pluginData, toolbarPlugins);
        this.addPluginsToToolbar(toolbarPlugins);
        if (menuPlugins.length > 0) {
            this.createInsertMenu(menu, menuPlugins);
            this.toolbar.find('#qk_button_plugin_menu').removeClass('qk_hidden');
        } else {
            this.toolbar.find('#qk_button_plugin_menu').addClass('qk_hidden');
        }
    };

    Toolbar.prototype.onPluginNames = function (pluginData) {
        this.pluginNames = pluginData;
        if (this.insertMenu) {
            this.processPluginData(pluginData, this.insertMenu);
        }
    };

    Toolbar.prototype.checkShowSubmit = function () {
        var submitBtn = this.toolbar.find('[data-cmd=submitDocument]'),
            func = !!Env.getSubmitUrl() ? submitBtn.removeClass : submitBtn.addClass;
        func.call(submitBtn, 'qk_hidden');
    };

    /**
     * Show the tab that's marked as active or the first tab if there isn't a visible one that's
     * marked as active.
     */
    Toolbar.prototype.showActivePanel = function (toolbarDef) {
        var firstVisibleGroupId,
            activeGroup = _.find(toolbarDef.groups, function (grp) {
                if (!grp.hidden) {
                    firstVisibleGroupId = firstVisibleGroupId || grp.id;
                }
                return grp.active && !grp.hidden;
            });
        this.showTabPanel((activeGroup && activeGroup.id) || firstVisibleGroupId);
    };

    Toolbar.prototype.showToolbarAt = function (x, y, toolbarDef) {
        if (!this.vpToolbar) {
            this.vpToolbar = ViewportRelative.create(this.toolbar, {
                top: y
            });
        }
        this.toolbar.removeClass('qk_hidden');
        if (this.widestTabName) {
            // Ensures that the toolbar is sized to the tab with the most buttons. Hacky +5 needed on FF.
            this.showTabPanel(this.widestTabName);
            this.toolbar.width(this.toolbar.width() + 5);
            this.widestTabName = null;
            this.showActivePanel(toolbarDef);
        }
        this.toolbar.css({
            'left': x,
            'top': y
        });
    };

    Toolbar.prototype.showToolbar = function (toolbarDef) {
        var y = $(window).innerHeight() / 5,
            x;
        this.toolbar.removeClass('qk_hidden');
        x = Math.floor(($(document).innerWidth() - this.toolbar.width()) / 2);
        this.showToolbarAt(x, y, toolbarDef);
    };

    Toolbar.prototype.initSubscriptions = function () {
        if (this.onCommandStateSub === undefined) {
            this.onCommandStateSub = PubSub.subscribe('command.state', this.onCommandState.bind(this));
        }
    };

    Toolbar.prototype.afterToolbarCreated = function (toolbarDef) {
        this.initToolbarTabs(toolbarDef);
        this.addToolbarTabListeners(document);
        this.addToolbarButtonListeners();
        this.checkShowSubmit();
        this.initSubscriptions();
        Draggable.create('.qk_toolbar_container');
        PubSub.publish('ui.toolbar.created');
        if (Env.getParam('toolbar', 'off') === 'on') {
            this.showToolbar(toolbarDef);
        }
    };

    Toolbar.prototype.onDownloadInsertMenu = function (data) {
        this.insertMenu = $(data);
        if (this.pluginNames) {
            this.processPluginData(this.pluginNames, this.insertMenu);
        }
    };

    Toolbar.prototype.onDownloadToolbar = function (html, def) {
        this.toolbar = $(html).appendTo('body');
        this.afterToolbarCreated(def);
    };

    Toolbar.prototype.orderToolbarItems = function (toolbarDef) {
        toolbarDef.groups = _.sortBy(toolbarDef.groups, 'index');
        _.each(toolbarDef.groups, function (grp) {
            grp.items = _.sortBy(grp.items, 'index');
        });
        return toolbarDef;
    };

    Toolbar.prototype.createToolbar = function (toolbarDef, toolbarTpl, insertMenuHtml) {
        var html;
        this.orderToolbarItems(toolbarDef);
        html = _.template(toolbarTpl, toolbarDef);
        this.onDownloadToolbar(html, toolbarDef);
        this.onDownloadInsertMenu(insertMenuHtml);
    };

    /**
     * The insert menu download can't be processed until the toolbar download has been handled.
     */
    Toolbar.prototype.onDownload = function (tbDef, tbTpl, imHtml) {
        var defaults;
        this.toolbarTpl = tbTpl[0];
        this.toolbarDef = tbDef[0];
        this.insertMenuHtml = imHtml[0];
        defaults = $.extend(true, {}, this.TOOLBAR_DEFAULTS, this.toolbarDef.defaults);
        this.applyDefaults(this.toolbarDef.groups, this.createDefaults(this.toolbarDef), true);
        this.createToolbar(this.toolbarDef, this.toolbarTpl, this.insertMenuHtml);
    };

    Toolbar.prototype.downloadResources = function () {
        var downloads = $.when($.get(Env.resource('toolbarDef.json')),
                            $.get(Env.resource('toolbarTpl.tpl')),
                            $.get(Env.resource('insertmenu.html')));
        downloads.done(this.onDownload.bind(this));
        downloads.fail(function () {
            console.log('toolbar download failed...');
        });
        return downloads;
    };

    /**
     * Applies defaults to the objs array. If forceApply is true the defaults overwrite values in the
     * array, otherwise they are only applied if the object has no value for that property.
     * Recursively sets defaults in the the items array.
     */
    Toolbar.prototype.applyDefaults = function (objs, defaults, forceApply) {
        var dflt = defaults.group || defaults;
        objs.forEach(function (obj) {
            Object.keys(dflt).forEach(function (propName) {
                if (forceApply || obj[propName] === undefined) {
                    obj[propName] = dflt[propName];
                }
            });
            if (obj.items) {
                this.applyDefaults(obj.items, defaults.item, forceApply);
            }
        }.bind(this));
    };

    /**
     * Merges the edit definitions into the src definitions to produce a merged toolbar definition.
     * src and edits are arrays of objects. Updates the src array in place. Adjusts index properties
     * as needed.
     */
    Toolbar.prototype.mergeConfig = function (src, edits) {
        var findGroup = function (groups, id) {
                return _.find(groups, function (grp) {
                    return grp.id === id;
                });
            },
            moveItems = function (items, oldIndex, newIndex) {
                items.forEach(function (item) {
                    if ((oldIndex < newIndex) && (item.index > oldIndex && item.index <= newIndex)) {
                        item.index--;
                    } else if ((oldIndex > newIndex) && (item.index >= newIndex && item.index < oldIndex)) {
                        item.index++;
                    }
                });
            },
            updateItem = function (srcObj, editObj) {
                var args = [editObj].concat(Toolbar.prototype.TOOLBAR_GROUP_PROPS),
                    editProps = _.pick.apply(null, args);
                Object.keys(editProps).forEach(function (propName) {
                    srcObj[propName] = editObj[propName];
                });
            };
        edits.forEach(function (editGroup) {
            var srcGroup = findGroup(src, editGroup.id);
            if (srcGroup) {
                if (editGroup.index !== undefined) {
                    moveItems(src, srcGroup.index, editGroup.index);
                }
                updateItem(srcGroup, editGroup);
                if (editGroup.items) {
                    this.mergeConfig(srcGroup.items, editGroup.items);
                }
            } else {
                console.log('can\'t find item with id: ' + editGroup.id);
            }
        }.bind(this));
        return src;
    };

    /**
     * These will be overriden by any defaults specified via the configureToolbar function argument.
     */
    Toolbar.prototype.TOOLBAR_DEFAULTS = {
        hidden: false,
        active: false
    };

    /**
     * Property names in the defaults object that are ignored when copying top level properties to the
     * more specific group and item default objects.
     */
    Toolbar.prototype.TOOLBAR_DEFAULTS_EXCLUDE = [
        'group',
        'item'
    ];

    /**
     * Create an object that contains the defaults for this configuration. Any top level defaults properties
     * specified in the definition are used for both groups and items unless overriden by more specific values
     * in the group or item default objects.
     * No defaults results in the fallback values being used for both groups and items.
     */
    Toolbar.prototype.createDefaults = function (def) {
        var result = {},
            defaults = def.defaults;
        result.group = $.extend(true, {}, this.TOOLBAR_DEFAULTS);
        result.item = $.extend(true, {}, this.TOOLBAR_DEFAULTS);
        if (defaults) {
            // Copy global defaults into each of the local default objects
            Object.keys(defaults).forEach(function (propName) {
                if (Toolbar.prototype.TOOLBAR_DEFAULTS_EXCLUDE.indexOf(propName) < 0) {
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
     * The current definition as at the function invocation is returned as the result.
     */
    Toolbar.prototype.configureToolbar = function (def) {
        var oldToolbarDef = $.extend(true, {}, this.toolbarDef),
            workingDef = this.toolbarDef,
            defaults = this.createDefaults(def);
        this.applyDefaults(workingDef.groups, defaults, true);
        this.applyDefaults(def.groups, defaults, false);
        this.mergeConfig(workingDef.groups, def.groups);
        if (this.toolbar.length) {
            this.toolbar.remove();
            this.toolbar = null;
        }
        this.createToolbar(workingDef, this.toolbarTpl, this.insertMenuHtml);
        this.toolbarDef = workingDef;
        this.onCommandState(this.lastCommandState);
        return oldToolbarDef;
    };

    var toolbar;

    function init() {
        toolbar = new Toolbar();
        QUINK.configureToolbar = toolbar.configureToolbar.bind(toolbar);
        return toolbar.downloadResources();
    }

    return {
        init: init
    };
});

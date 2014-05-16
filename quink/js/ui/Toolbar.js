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
        var onPubBeforeToolbar = this.onPubBeforeToolbar.bind(this);
        HitHandler.register(this, true);
        PubSub.subscribe('plugin.insert.names', this.onPluginNames.bind(this));
        this.cmdExecSub = PubSub.subscribe('command.executed', onPubBeforeToolbar);
        this.cmdStateSub = PubSub.subscribe('command.state', onPubBeforeToolbar);
        this.delayedPubs = [];
    };

    Toolbar.prototype.TAB_NAME_PREFIX = 'qk_tab_';
    Toolbar.prototype.DEFAULT_TAB_NAME = 'misc';

    /**
     * Each command that has persistent (currently checkbox) state in the toolbar has to have
     * that toolbar state kept in sync with the underlying state. This hash is the command
     * string versus checkbox selector for those commands.
     */
    Toolbar.prototype.KEY_COMMAND_MAP = {
        'nav.select.on': '#nav_and_select',
        'nav.select.off': '#nav_and_select',
        'nav.select.toggle': '#nav_and_select',
        'ui.status.on': '#toggle_status_bar',
        'ui.status.off': '#toggle_status_bar',
        'ui.status.toggle': '#toggle_status_bar'
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
    Toolbar.prototype.TOOLBAR_ITEM_DEFAULTS = {
        hidden: false,
        active: false,
        repeat: false
    };

    /**
     * Stores the name of the widest tab which will then be used to size the toolbar when
     * it's shown on the page.
     */
    Toolbar.prototype.initToolbarTabs = function () {
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
    Toolbar.prototype.onCommandExec = function (data) {
        var sel = this.KEY_COMMAND_MAP[data.cmd],
            checkbox, newState;
        if (data.result && sel) {
            checkbox = this.toolbar.find(sel);
            if (/\.toggle$/.test(data.cmd)) {
                newState = !checkbox.prop('checked');
            } else {
                newState = /\.on$/.test(data.cmd);
            }
            checkbox.prop('checked', newState);
        }
    };

    /**
     * Keep the active state of the toolbar buttons in sync with the state at the document's text
     * insertion point.
     * The state argument is a hash of command name versus current state (true|false|<string>).
     */
    Toolbar.prototype.onCommandState = function (state) {
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
        }
    };

    Toolbar.prototype.onPluginNames = function (pluginData) {
        this.pluginNames = pluginData;
        if (this.insertMenu) {
            this.processPluginData(pluginData, this.insertMenu);
        }
    };

    Toolbar.prototype.checkShowSubmit = function () {
        if (Env.getSubmitUrl()) {
            this.toolbar.find('[data-cmd-id=submitDocument]').removeClass('qk_hidden');
        }
    };

    Toolbar.prototype.showActivePanel = function () {
        var firstVisibleGroupId,
            activeGroup = _.find(this.toolbarDef.groups, function (grp) {
                if (!grp.hidden) {
                    firstVisibleGroupId = firstVisibleGroupId || grp.id;
                }
                return grp.active && !grp.hidden;
            });
        this.showTabPanel((activeGroup && activeGroup.id) || firstVisibleGroupId);
    };

    Toolbar.prototype.showToolbarAt = function (x, y) {
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
            this.showActivePanel();
        }
        this.toolbar.css({
            'left': x,
            'top': y
        });
    };

    Toolbar.prototype.showToolbar = function () {
        var y = $(window).innerHeight() / 5,
            x;
        this.toolbar.removeClass('qk_hidden');
        x = Math.floor(($(document).innerWidth() - this.toolbar.width()) / 2);
        this.showToolbarAt(x, y);
    };

    /**
     * Sets up the correct subscriptions and processes any that have been received prior to the
     * toolbar being created.
     */
    Toolbar.prototype.processHeldPubs = function () {
        PubSub.unsubscribe(this.cmdExecSub);
        PubSub.unsubscribe(this.cmdStateSub);
        this.cmdExecSub = PubSub.subscribe('command.executed', this.onCommandExec.bind(this));
        this.cmdStateSub = PubSub.subscribe('command.state', this.onCommandState.bind(this));
        if (this.delayedPubs && this.delayedPubs.length) {
            this.delayedPubs.forEach(function (args) {
                var func = args[1] === 'command.executed' ? this.onCommandExec : this.onCommandState;
                func.apply(this, args);
            }.bind(this));
        }
    };

    /**
     * Publications that will be handled using the toolbar are routed here until the toolbar has
     * been created.
     */
    Toolbar.prototype.onPubBeforeToolbar = function () {
        this.delayedPubs.push(arguments);
    };

    Toolbar.prototype.afterToolbarCreated = function () {
        this.initToolbarTabs();
        this.addToolbarTabListeners(document);
        this.addToolbarButtonListeners();
        this.checkShowSubmit();
        Draggable.create('.qk_toolbar_container');
        this.processHeldPubs();
        if (Env.getParam('toolbar', 'off') === 'on') {
            this.showToolbar();
        }
    };

    Toolbar.prototype.onDownloadInsertMenu = function (data) {
        this.insertMenu = $(data);
        if (this.pluginNames) {
            this.processPluginData(this.pluginNames, this.insertMenu);
        }
    };

    Toolbar.prototype.onDownloadToolbar = function (data) {
        this.toolbar = $(data).appendTo('body');
        this.afterToolbarCreated();
    };

    Toolbar.prototype.orderToolbarItems = function (toolbarDefs) {
        toolbarDefs.groups = _.sortBy(toolbarDefs.groups, 'index');
        _.each(toolbarDefs.groups, function (grp) {
            grp.items = _.sortBy(grp.items, 'index');
        });
        return toolbarDefs;
    };

    Toolbar.prototype.createToolbar = function (toolbarDef, toolbarTpl, insertMenuHtml) {
        var html;
        this.toolbarDef = this.orderToolbarItems(toolbarDef);
        html = _.template(toolbarTpl, this.toolbarDef);
        this.onDownloadToolbar(html);
        this.onDownloadInsertMenu(insertMenuHtml);
    };

    /**
     * The insert menu download can't be processed until the toolbar download has been handled.
     */
    Toolbar.prototype.onDownload = function (tbDef, tbTpl, imHtml) {
        this.toolbarTpl = tbTpl[0];
        this.toolbarDef = tbDef[0];
        this.insertMenuHtml = imHtml[0];
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
     * Merges the edit definitinos into the src definitions to produce a final toolbar definition.
     * src and edits are arrays of objects.
     */
    Toolbar.prototype.mergeConfig = function (src, edits) {
        var findGroup = function (id) {
                return _.find(src, function (grp) {
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
            setDefaults = function () {
                var objects = Array.prototype.slice.call(arguments, 0);
                Object.keys(Toolbar.prototype.TOOLBAR_ITEM_DEFAULTS).forEach(function (propName) {
                    objects.forEach(function (obj) {
                        if (obj[propName] === undefined) {
                            obj[propName] = Toolbar.prototype.TOOLBAR_ITEM_DEFAULTS[propName];
                        }
                    });
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
            var srcGroup = findGroup(editGroup.id);
            if (srcGroup) {
                if (editGroup.index !== undefined) {
                    moveItems(src, srcGroup.index, editGroup.index);
                }
                setDefaults(srcGroup, editGroup);
                updateItem(srcGroup, editGroup);
                if (editGroup.items) {
                    this.mergeConfig(srcGroup.items, editGroup.items);
                }
            } else {
                console.log('can\'t find item with id: ' + editGroup.id);
            }
        }.bind(this));
    };

    Toolbar.prototype.configureToolbar = function (def) {
        var oldToolbarDef = $.extend(true, {}, this.toolbarDef);
        this.mergeConfig(this.toolbarDef.groups, def.groups);
        if (this.toolbar.length) {
            this.toolbar.remove();
            this.toolbar = null;
        }
        this.createToolbar(this.toolbarDef, this.toolbarTpl, this.insertMenuHtml);
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

/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

/*global QUINK */
define([
    'Underscore',
    'jquery',
    'rangy',
    'ui/PopupMenu',
    'ui/StyleMenuProvider',
    'ui/ToolbarProvider',
    'util/Draggable',
    'util/Event',
    'util/FastTap',
    'util/Func',
    'util/PubSub',
    'util/Env',
    'util/ViewportRelative',
    'hithandler/HitHandler'
], function (_, $, rangy, PopupMenu, StyleMenuProvider, ToolbarProvider, Draggable, Event, FastTap, Func, PubSub, Env, ViewportRelative, HitHandler) {
    'use strict';

    var Toolbar = function (stylesheetMgr) {
        this.stylesheetMgr = stylesheetMgr;
        HitHandler.register(this, true);
        PubSub.subscribe('plugin.insert.names', this.onPluginNames.bind(this));
    };

    Toolbar.prototype.TAB_NAME_PREFIX = 'qk_tab_';

    /**
     * Each command that has persistent (currently checkbox) state in the toolbar has to have
     * that toolbar state kept in sync with the underlying state. This hash is the command
     * string versus checkbox selector for those commands.
     */
    Toolbar.prototype.KEY_COMMAND_MAP = {
        'navandselect': '[data-tag=nav_and_select]',
        'statusbar': '[data-tag=toggle_status_bar]',
    };

    /**
     * If there's a selection it will replace any existing H property. If there's not a selection but
     * there's something being deselected revert back to a paragraph style.
     */
    Toolbar.prototype.onHSelect = function (selected, deselected) {
        if (selected) {
            PubSub.publish('command.exec', 'style.formatblock.' + selected);
        } else if (deselected) {
            PubSub.publish('command.exec', 'style.formatblock.p');
        }
    };

    Toolbar.prototype.getHState = function () {
        return (rangy.getSelection().rangeCount && [document.queryCommandValue('formatblock')]) || [];
    };

    Toolbar.prototype.createHDefs = function () {
        return [{
            label: 'H1',
            value: 'h1',
        }, {
            label: 'H2',
            value: 'h2'
        }, {
            label: 'H3',
            value: 'h3'
        }, {
            label: 'H4',
            value: 'h4'
        }, {
            label: 'H5',
            value: 'h5'
        }, {
            label: 'H6',
            value: 'h6'
        }, {
            label: 'cancel',
            value: 'close'
        }];
    };

    /**
     * Style names will be of the form: qk_font_<foo>_and_more_stuff. It's the and_more_stuff that is wanted
     * with any underscores changed into spaces.
     */
    Toolbar.prototype.fontLabel = function (style) {
        return style.split('_').slice(3).join(' ');
    };

    /**
     * Select all class level rules that contain 'mixon' in ther name.
     */
    Toolbar.prototype.effectsStyleRuleFilter = function (rule) {
        return /^\..*(mixin)/i.test(rule.selectorText);
    };

    /**
     * Select all rules that contain 'color' and are at class level.
     */
    Toolbar.prototype.colourStyleRuleFilter = function (rule) {
        return /^\..*(color)/i.test(rule.cssText);
    };

    /**
     * Select all rules that contain 'font-size' and are at class level.
     */
    Toolbar.prototype.fontStyleRuleFilter = function (rule) {
        return /^\..*(font-family)/i.test(rule.cssText);
    };

    /**
     * Select all rules that contain 'font-size' and are at class level.
     */
    Toolbar.prototype.sizeStyleRuleFilter = function (rule) {
        return /^\..*(font-size)/i.test(rule.cssText);
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
        if (url) {
            if (url.indexOf(':') > 0) {
                index = url.indexOf(this.LINK_URL_PREFIX);
                if (index < 0 || url.length > this.LINK_URL_PREFIX.length) {
                    scheme = url.split(':')[0];
                    if (this.LINK_URL_SCHEME_BLACKLIST.indexOf(scheme.toLowerCase()) < 0) {
                        validUrl = url;
                    }
                }
            } else {
                // No scheme, assume it's a valid relative url
                validUrl = url;
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

    Toolbar.prototype.showInsertMenu = function (event) {
        var hit = Event.isTouch ? event.changedTouches[0] : event;
        this.insertMenu.show(hit.pageX, hit.pageY);
    };

    Toolbar.prototype.openPluginFromToolbar = function (event, pluginId) {
        PubSub.publish('command.exec', 'insert.' + pluginId);
    };

    /**
     * argsStr is a comma separated string. The number of substrings depends on the caller. The low level
     * showMenu needs up to 4 args whereas the higher level showStyleMenu only needs up to 2.
     * createMenuFunc creates and returns the popup menu if necessary.
     */
    Toolbar.prototype.doShowMenu = function (event, argsStr, createMenuFunc) {
        var button = $(event.target).closest('.qk_button'),
            hit = Event.isTouch ? event.changedTouches[0] : event,
            menu = button.data('menu'),
            args;
        if (!menu) {
            if (argsStr) {
                args = _.map(argsStr.split(','), function (name) {
                    return name.trim();
                });
                menu = createMenuFunc.apply(this, args);
                button.data('menu', menu);
            } else {
                throw new Error('Invalid menu definition');
            }
        }
        menu.show(hit.pageX, hit.pageY);
    };

    /*
     * argsStr contains a comma separated string with the substrings that split into the arguments to the
     * anonymous function. Only the first argument is required with a further 2 being optional.
     */
    Toolbar.prototype.showStyleMenu = function (event, argsStr) {
        this.doShowMenu(event, argsStr, function (defsFuncName, arg2, arg3) {
            var isMultiSelectStr, labelFuncName;
            if (/^(true|false)$/i.test(arg2)) {
                isMultiSelectStr = arg2;
            } else {
                labelFuncName = arg2;
                isMultiSelectStr = arg3;
            }
            return StyleMenuProvider.create(defsFuncName, labelFuncName, /^true$/i.test(isMultiSelectStr), this);
        });
    };

    /*
     * argsStr contains a comma separated string with the substrings that split into the arguments to the
     * anonymous function.
     */
    Toolbar.prototype.showMenu = function (event, argsStr) {
        this.doShowMenu(event, argsStr, function (defsFuncName, stateFuncName, onSelectFuncName, isMultiSelectStr) {
            var def = Func.exec(this, defsFuncName);
            return PopupMenu.create(def, Func.getBound(this, onSelectFuncName), Func.getBound(this, stateFuncName), /^true$/i.test(isMultiSelectStr));
        }.bind(this));
    };

    /**
     * For commands that are going to use the browser's execCommand.
     */
    Toolbar.prototype.execCommand = function (event, msg) {
        PubSub.publish('command.exec', msg);
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
            cmdArgs = el.attr('data-cmd-args');
        if (cmd) {
            Func.exec(this, cmd.trim(), event, cmdArgs);
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
                cmdAr = btn.attr('data-cmd-args').split('.'),
                cmd = cmdAr[1],
                st = state[cmd],
                func, args;
            if (st !== undefined) {
                if (typeof st === 'boolean') {
                    func = st ? btn.addClass : btn.removeClass;
                } else {
                    args = cmdAr[2];
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

    Toolbar.prototype.hideToolbar = function (event) {
        if (event) {
            // Don't focus the toolbar
            event.preventDefault();
        }
        this.hideCurrentDialog();
        this.toolbar.addClass('qk_hidden');
        this.isVisible = false;
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

    Toolbar.prototype.addToolbarTabListeners = function () {
        var toolbar = this;
        $('.qk_toolbar_tab_button').each(function () {
            FastTap.fastTap(this, toolbar.cmdHandler, toolbar);
        });
    };

    Toolbar.prototype.handle = function (event) {
        var hit, handled;
        if (event.hitType === 'double') {
            hit = Event.isTouch ? event.event.originalEvent.changedTouches[0] : event.event;
            this.showToolbarAt(0, $(document).scrollTop());
            this.vpToolbar.adjust();
            handled = true;
        }
        return handled;
    };

    /**
     * Plugins is an array of objects each of which contains a plugin id and a plugin name. Sort
     * the objects so that the menu is shown in ascending alphabetical order. 
     */
    Toolbar.prototype.createInsertMenu = function (plugins) {
        var menuDefs = [];
        _.sortBy(plugins, function (def) {
            return def.name.toLowerCase();
        }).reverse().forEach(function (plugin) {
            menuDefs.push({
                label: plugin.name,
                value: plugin.id
            });
        });
        if (menuDefs.length) {
            menuDefs.push({
                value: 'close',
                label: 'Cancel'
            });
        }
        this.insertMenu = PopupMenu.create(menuDefs, function (selected) {
            if (selected) {
                PubSub.publish('command.exec', 'insert.' + selected);
            }
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
    Toolbar.prototype.processPluginData = function (pluginData) {
        var toolbarPlugins = _.filter(pluginData, function (item) {
                return !!item.onToolbar;
            }),
            menuPlugins = _.difference(pluginData, toolbarPlugins);
        this.addPluginsToToolbar(toolbarPlugins);
        if (menuPlugins.length > 0) {
            this.createInsertMenu(menuPlugins);
        } else {
            this.toolbar.find('#qk_button_plugin_menu').addClass('qk_hidden');
        }
    };

    Toolbar.prototype.onPluginNames = function (pluginData) {
        this.pluginNames = pluginData;
        if (this.toolbar) {
            this.processPluginData(pluginData);
        }
    };

    Toolbar.prototype.checkShowSubmit = function () {
        var submitBtn = this.toolbar.find('[data-cmd-args="persist.submit"]'),
            func = !!Env.getSubmitUrl() ? submitBtn.removeClass : submitBtn.addClass;
        func.call(submitBtn, 'qk_hidden');
    };

    Toolbar.prototype.showToolbarAt = function (x, y) {
        if (!this.vpToolbar) {
            this.vpToolbar = ViewportRelative.create(this.toolbar, {
                top: y
            });
        }
        this.toolbar.removeClass('qk_hidden');
        if (this.willInitToolbar) {
            // Ensures that the toolbar is sized to the tab with the most buttons. Hacky +5 needed on FF.
            this.showTabPanel(this.toolbarProvider.getWidestGroupName());
            this.toolbar.width(this.toolbar.width() + 5);
            this.showTabPanel(this.toolbarProvider.getActiveGroupName());
            this.willInitToolbar = false;
        }
        this.toolbar.css({
            'left': x,
            'top': y
        });
        this.isVisible = true;
    };

    Toolbar.prototype.showToolbar = function () {
        this.toolbar.removeClass('qk_hidden');
        this.showToolbarAt(0, 0);
    };

    Toolbar.prototype.initSubscriptions = function () {
        if (this.onCommandStateSub === undefined) {
            this.onCommandStateSub = PubSub.subscribe('command.state', this.onCommandState.bind(this));
        }
    };

    Toolbar.prototype.afterToolbarCreated = function () {
        this.addToolbarTabListeners();
        this.addToolbarButtonListeners();
        this.checkShowSubmit();
        this.initSubscriptions();
        Draggable.create('.qk_toolbar_container');
        PubSub.publish('ui.toolbar.created');
        if ((this.isVisible === undefined && Env.getParam('toolbar', 'off') === 'on') || this.isVisible) {
            this.showToolbar();
        }
    };

    Toolbar.prototype.processToolbar = function (html) {
        this.toolbar = $(html).appendTo('body');
        this.afterToolbarCreated();
        if (this.pluginNames) {
            this.processPluginData(this.pluginNames);
        }
        this.onCommandState(this.lastCommandState);
    };

    /**
     * The insert menu download can't be processed until the toolbar download has been handled.
     */
    Toolbar.prototype.onDownload = function (tbDef, tbTpl, stylesTpl) {
        var html;
        this.stylesTpl = stylesTpl[0];
        this.toolbarProvider = new ToolbarProvider(tbTpl[0], tbDef[0]);
        html = this.toolbarProvider.createToolbar(QUINK.toolbar || {});
        this.willInitToolbar = true;
        this.processToolbar(html);
    };

    Toolbar.prototype.downloadResources = function () {
        var toolbarDefUrl = Env.getParam('toolbardef', Env.resource('toolbarDef.json')),
            downloads = $.when($.get(toolbarDefUrl),
                $.get(Env.resource('toolbarTpl.tpl')),
                $.get(Env.resource('styleTpl.tpl')));
        downloads.done(this.onDownload.bind(this));
        downloads.fail(function () {
            console.log('toolbar download failed...');
        });
        return downloads;
    };

    Toolbar.prototype.configureToolbar = function (def) {
        var provider = this.toolbarProvider,
            lastDef = provider.getToolbarDefinition(),
            html;
        if (this.toolbar && this.toolbar.length) {
            this.toolbar.remove();
            this.toolbar = null;
        }
        this.willInitToolbar = true;
        html = provider.createToolbar(def);
        this.processToolbar(html);
        return lastDef;
    };

    var toolbar;

    function init(stylesheetMgr) {
        toolbar = new Toolbar(stylesheetMgr);
        QUINK.configureToolbar = toolbar.configureToolbar.bind(toolbar);
        return toolbar.downloadResources();
    }

    return {
        init: init
    };
});

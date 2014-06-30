/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'Underscore',
    'jquery',
    'util/PubSub',
    'ext/PluginContext',
    'util/Event',
    'util/Env',
    'util/DomUtil'
], function (_, $, PubSub, Context, Event, Env, DomUtil) {
    'use strict';

    var PluginMgr = function () {
    };

    PluginMgr.prototype.getDefs = function () {
        return this.pluginDefs;
    };

    /**
     * Convert the identifiers into valid jQuery selectors.
     * The plugin definition will contain one of a 'node' or a 'container' object. The former indicates
     * that the content created by the plugin will be inserted directly into the document, the latter
     * that Quink will provide a containing element for the plugin content.
     */
    PluginMgr.prototype.editIdentifiers = function () {
        _.some(this.getDefs(), function (def) {
            var container = def.container || def.node;
            if (def.container && def.node) {
                throw new Error('Invalid container defintion. Must have one of element or node.');
            }
            if (container) {
                // Indicates that the plugin creates its own container.
                if (def.node) {
                    container.pluginCreated = true;
                    def.container = def.node;
                }
                if (container.element && container['class']) {
                    container.primary = container.element + '.' + container['class'];
                } else if (container.element && container.pluginCreated) {
                    container.primary = container.element;
                } else if (container['class'] && container.pluginCreated) {
                    container.primary = container['class'];
                }
                if (container['alt-classes']) {
                    container['alt-classes'] = container['alt-classes'].map(function (cls) {
                        return '.' + cls;
                    }).join(',');
                }
                if (container['alt-data-tags']) {
                    container['alt-data-tags'] = container['alt-data-tags'].map(function (dt) {
                        return '[' + dt + ']';
                    }).join(',');
                }
                if (container['alt-elements']) {
                    container['alt-elements'] = container['alt-elements'].join(',');
                }
            } else {
                throw new Error('Missing container definition in plugin defs file.');
            }
        });
    };

    PluginMgr.prototype.publishKeyBindings = function () {
        PubSub.publish('plugin.insert.keybindings', _.map(this.getDefs(), function (val, key) {
            return key;
        }));
    };

    PluginMgr.prototype.publishNames = function () {
        PubSub.publish('plugin.insert.names', _.map(this.getDefs(), function (val, key) {
            return {
                id: key,
                name: val.name,
                onToolbar: val['on-toolbar'],
                icon: val.icon
            };
        }));
    };

    PluginMgr.prototype.onPluginCloseMenuHit = function (event) {
        var id = event.target.id;
        event.stopPropagation();
        event.preventDefault();
        switch (id) {
        case 'qk_plugin_save':
            Context.getDefinition().callbacks.save();
            break;
        case 'qk_plugin_exit':
            Context.getDefinition().callbacks.exit();
            break;
        }
        $(this).addClass('qk_hidden');
    };

    /**
     * Maps possible lateral/vertical values into css classes.
     */
    PluginMgr.prototype.PLUGIN_MENU_CSS = {
        right: 'qk_position_right',
        left: 'qk_position_left',
        top: 'qk_position_top',
        bottom: 'qk_position_bottom'
    };

    PluginMgr.prototype.PLUGIN_MENU_CONFIG_DEFAULT = {
        lateral: 'right',
        vertical: 'top'
    };

    /**
     * The plugin bootstrap will publish messages with the prefix defined in plugin.json
     * and these suffixes. These messages are published when specific plugin events occur.
     */
    PluginMgr.prototype.PLUGIN_MSG_SUFFIXES = [
        'loaded',
        'opened',
        'saved',
        'exited'
    ];

    /**
      * If the plugin passed back a DOM, make sure that any Quink references are corrected
      * to reflect Quink's location.
      */
    PluginMgr.prototype.patchUpQuinkRefs = function (obj) {
        if (obj.dom) {
            DomUtil.makeQuinkRelative(obj.dom);
            delete obj.dom;
        }
    };

    /**
     * The plugin is closing via exit or save.
     */
    PluginMgr.prototype.onPluginClose = function (topic, msg) {
        $('.qk_plugin_close_button').addClass('qk_hidden');
        $(document.body).removeClass('qk_no_scroll');
        PubSub.publish(topic, msg);
    };

    PluginMgr.prototype.onPluginEvent = function (def, msg, topic) {
        var event = topic.split('.')[2];
        switch (event) {
        case 'loaded':
            this.patchUpQuinkRefs(msg);
            def.callbacks = msg;
            this.openPlugin(def);
            break;
        case 'opened':
            this.showPluginMenuButton(def);
            break;
        case 'exited':
            this.onPluginClose('plugin.exited');
            break;
        case 'saved':
            this.onPluginClose('plugin.saved', msg);
            break;
        }
    };

    /**
     * Subscribe to the plugin messages.
     */
    PluginMgr.prototype.subscribeToPlugin = function (def) {
        var prefix = def['topic-prefix'];
        if (prefix) {
            _.each(this.PLUGIN_MSG_SUFFIXES, function (sfx) {
                PubSub.subscribe(prefix + '.' + sfx, _.bind(this.onPluginEvent, this, def));
            }.bind(this));
        }
    };

    PluginMgr.prototype.fetchPluginBootstrap = function (def) {
        var url = Env.pluginAdapter(def.url);
        this.subscribeToPlugin(def);
        $.getScript(url).done(function () {
            console.log('loaded script for: ' + url);
        }).fail(function (jqxhr, textStatus, error) {
            console.log('Failed to load plugin: ' + url + '. ' + jqxhr.status + '. ' + error);
        });
    };

    PluginMgr.prototype.getMenuConfig = function (def) {
        return (def.ui && def.ui.menu) || (this.ui && this.ui.menu) || this.PLUGIN_MENU_CONFIG_DEFAULT;
    };

    /**
     * Returns the callback used when the close button is hit. All positional css properties
     * have to be explicitly set so that any settings applied in a previous invocation
     * that might have been for a close button in a different position aren't left in place.
     */
    PluginMgr.prototype.createCloseBtnCallback = function (cfg) {
        return function (event) {
            var hit = Event.isTouch ? event.originalEvent.changedTouches[0] : event,
                css = {};
            if (cfg.lateral.indexOf('right') >= 0) {
                css.left = 'auto';
                css.right = $(window).innerWidth() - hit.pageX;
            } else {
                css.left = hit.pageX;
                css.right = 'auto';
            }
            if (cfg.vertical.indexOf('top') >= 0) {
                css.top = hit.pageY;
                css.bottom = 'auto';
            } else {
                css.top = 'auto';
                css.bottom = $(window).innerHeight() - hit.pageY;
            }
            $('.qk_plugin_menu').removeClass('qk_hidden').css(css);
        };
    };

    /**
     * Removes any existing positional classes and adds ones for the passed in configuration.
     */
    PluginMgr.prototype.addCloseBtnClasses = function (btn, cfg) {
        var lateral = this.PLUGIN_MENU_CSS[cfg.lateral],
            vertical = this.PLUGIN_MENU_CSS[cfg.vertical];
        _.each(this.PLUGIN_MENU_CSS, function (cls) {
            if (cls !== lateral && cls !== vertical) {
                btn.removeClass(cls);
            }
        });
        btn.addClass(lateral + ' ' + vertical);
    };

    /**
     * Adds the css and callback for the plugin close button. Note that the plugin close button
     * can be positioned differently across plugins.
     */
    PluginMgr.prototype.configureCloseBtn = function (btn, def) {
        var cfg = this.getMenuConfig(def),
            evt = Event.eventName('end');
        this.addCloseBtnClasses(btn, cfg);
        btn.off(evt);
        btn.on(evt, this.createCloseBtnCallback(cfg));
    };

    /**
     * Creates the plugin menu close button, taking into account any configuration specified
     * in the plugins definition file. Possible configuration is the placement of the close
     * button which also implies placement of the close popup menu.
     */
    PluginMgr.prototype.createPluginMenuButton = function (def) {
        var btn = $('<div>').addClass('qk_plugin_close_button');
        this.configureCloseBtn(btn, def);
        btn.appendTo('body');
    };

    PluginMgr.prototype.showPluginMenuButton = function (def) {
        var btn = $('.qk_plugin_close_button');
        if (btn.length > 0) {
            this.configureCloseBtn(btn, def);
            btn.removeClass('qk_hidden');
        } else {
            this.createPluginMenuButton(def);
        }
    };

    PluginMgr.prototype.openPlugin = function (def) {
        if (def.callbacks && def.callbacks.open) {
            PubSub.publish('plugin.open');
            $(document.body).addClass('qk_no_scroll');
            def.callbacks.open(Context.getData());
        } else {
            this.fetchPluginBootstrap(def);
        }
    };

    PluginMgr.prototype.getDefByKey = function (id) {
        return this.getDefs()[id];
    };

    PluginMgr.prototype.onDownloadMenu = function (data) {
        var menu = $(data);
        menu.appendTo('body').on(Event.eventName('end'), this.onPluginCloseMenuHit);
    };

    PluginMgr.prototype.onDownloadDefs = function (data) {
        this.pluginDefs = data.plugins;
        this.ui = data.ui;
        this.editIdentifiers();
        this.publishKeyBindings();
        this.publishNames();
    };

    /**
     * Identifies which plugin will handle the hit event. Returns an object with the plugin's
     * definition plus a jQuery object for the container that contains the hit (which will be
     * updated with any saved edit state later in the process).
     */
    PluginMgr.prototype.identifyPlugin = function (event) {
        var result;
        _.some(this.getDefs(), function (def) {
            var container = def.container,
                target = $(event.target),
                hit = target.closest(container.primary);
            if (hit.length > 0) {
                result = {
                    def: def,
                    el: hit
                };
            } else {
                _.some(container, function (val, key) {
                    var hit;
                    if (key.indexOf('alt-') === 0) {
                        hit = target.closest(val);
                        if (hit.length > 0) {
                            result = {
                                def: def,
                                el: hit
                            };
                        }
                    }
                    return result;
                });
            }
            return result;
        });
        return result;
    };

    /**
     * obj is either a plugin identifier or the result from identifyPlugin.
     */
    PluginMgr.prototype.loadPlugin = function (obj) {
        var ctx, def;
        if (_.isString(obj)) {
            ctx = this.getDefByKey(obj);
            def = ctx;
        } else {
            ctx = obj;
            def = ctx.def;
        }
        Context.create(ctx);
        this.openPlugin(def);
    };

    PluginMgr.prototype.init = function () {
        return $.when(
            $.get(Env.resource('plugins.json')).done(this.onDownloadDefs.bind(this)),
            $.get(Env.resource('pluginmenu.html')).done(this.onDownloadMenu.bind(this))
        );
    };

    var theInstance = new PluginMgr();

    return {
        init: theInstance.init.bind(theInstance),
        loadPlugin: theInstance.loadPlugin.bind(theInstance),
        identifyPlugin: theInstance.identifyPlugin.bind(theInstance)
    };
});

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

define([
    'rangy',
    'ui/Toolbar',
    'ui/CommandStateBar',
    'util/FocusTracker',
    'command/Command',
    'keyhandler/KeyHandlerMgr',
    'hithandler/HitHandler',
    'util/Env',
    'ext/PluginMgr',
    'service/Persist',
    'ui/Caret'
], function (rangy, Toolbar, CommandStateBar, FocusTracker, Command, KeyHandlerMgr, HitHandler, Env, PluginMgr, Persist, Caret) {
    'use strict';

    function init() {
        var selector = '[contenteditable=true]';
        rangy.init();
        Env.init();
        KeyHandlerMgr.init(selector, Env.resource('keymap.json'));
        FocusTracker.init(selector);
        Command.init();
        CommandStateBar.create(Env.resource('commandstatebar.html'));
        HitHandler.init(selector);
        PluginMgr.init(Env.resource('plugins.json'), Env.resource('pluginmenu.html'));
        Persist.create();
        Toolbar.init(Env.resource('toolbar.html'), Env.resource('insertmenu.html'));
        Caret.init();
    }

    return {
        init: init
    };
});

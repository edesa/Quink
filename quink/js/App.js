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
    'rangy',
    'command/Command',
    'hithandler/HitHandler',
    'keyhandler/KeyHandlerMgr',
    'service/DownloadMgr',
    'service/Persist',
    'ui/Caret',
    'ui/CommandStateBar',
    'ui/Toolbar',
    'util/Env',
    'util/FocusTracker',
    'util/PubSub'
], function (rangy, Command, HitHandler, KeyHandlerMgr, DownloadMgr, Persist, Caret, CommandStateBar, Toolbar, Env, FocusTracker, PubSub) {
    'use strict';

    function init() {
        var selector = '[contenteditable=true]',
            downloadPromise;
        rangy.init();
        Env.init();
        KeyHandlerMgr.init(selector);
        FocusTracker.init(selector);
        Command.init();
        CommandStateBar.create();
        HitHandler.init(selector);
        Toolbar.init();
        downloadPromise = DownloadMgr.download('keymap.json', 'commandstatebar.html',
            'plugins.json', 'pluginmenu.html',
            'toolbar.html', 'insertmenu.html');
        Caret.init();
        Persist.init();
        downloadPromise.then(function () {
            if (typeof QUINK.ready === 'function') {
                QUINK.ready(PubSub);
            }
        });
    }

    return {
        init: init
    };
});

/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

/*global QUINK */
define([
    'jquery',
    'rangy',
    'command/Command',
    'ext/PluginMgr',
    'hithandler/HitHandler',
    'keyhandler/KeyHandlerMgr',
    'service/Persist',
    'ui/Caret',
    'ui/CommandStateBar',
    'ui/Toolbar',
    'util/Env',
    'util/FocusTracker',
    'util/PubSub',
    'util/StylesheetMgr'
], function ($, rangy, Command, PluginMgr, HitHandler, KeyHandlerMgr, Persist, Caret, CommandStateBar, Toolbar, Env, FocusTracker, PubSub, StylesheetMgr) {
    'use strict';

    function init() {
        var selector = '[contenteditable=true]',
            stylesheetMgr,
            tbDownloads, csbDownloads, pmDownloads, khmDownloads, smDownloads;
        Persist.initFromAutoSave();
        rangy.init();
        Env.init();
        khmDownloads = KeyHandlerMgr.init(selector);
        FocusTracker.init(selector);
        Command.init();
        csbDownloads = CommandStateBar.create();
        HitHandler.init(selector);
        stylesheetMgr = new StylesheetMgr();
        smDownloads = stylesheetMgr.init();
        tbDownloads = Toolbar.init(stylesheetMgr);
        pmDownloads = PluginMgr.init();
        Caret.init();
        Persist.init();
        $.when(tbDownloads, csbDownloads, pmDownloads, khmDownloads, smDownloads).done(function () {
            if (typeof QUINK.ready === 'function') {
                QUINK.ready(PubSub);
            }
        }).fail(function () {
            console.log('downloads failed...');
        });
    }

    return {
        init: init
    };
});

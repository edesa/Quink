/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'Underscore',
    'hithandler/HitHandler',
    'keyhandler/KeyHandlerMgr',
    'util/PubSub'
], function (_, HitHandler, KeyHandlerMgr, PubSub) {
    'use strict';

    var CommandStateAdapter = function () {
        var onStateChange = this.onStateChange.bind(this),
            onDelayStateChange = _.bind(this.onDelayStateChange, this, 10);
        HitHandler.register(this);
        PubSub.subscribe('command.executed', this.onCmdExec.bind(this));
        PubSub.subscribe('insert.char', onDelayStateChange);
        PubSub.subscribe('editable.blur', onStateChange);
        PubSub.subscribe('plugin.saved', onStateChange);
        PubSub.subscribe('plugin.exited', onStateChange);
        PubSub.subscribe('keyhandler.mode.command', this.onModeChange.bind(this));
        PubSub.subscribe('info.closed', onStateChange);
        PubSub.subscribe('error.persist', this.onPersistError.bind(this));
        PubSub.subscribe('document.state', this.onDocStateChange.bind(this));
        PubSub.subscribe('persist.autosave', this.onAutoSaveStateChange.bind(this));
        PubSub.subscribe('insert.text', onDelayStateChange);
        PubSub.subscribe('insert.html', onDelayStateChange);
        PubSub.subscribe('ui.toolbar.created', onStateChange);
    };

    CommandStateAdapter.prototype.STATE_CMDS = [
        'bold',
        'italic',
        'underline',
        'strikethrough',
        'superscript',
        'subscript',
        'insertunorderedlist',
        'insertorderedlist',
        'justifyleft',
        'justifycenter',
        'justifyfull',
        'justifyright'
    ];

    CommandStateAdapter.prototype.VALUE_CMDS = [
        'formatblock'
    ];

    /**
     * Switching auto save back on shouldn't override an existing persistence error condition.
     */
    CommandStateAdapter.prototype.onAutoSaveStateChange = function (state) {
        this.persistError = this.persistError || /^off$/i.test(state);
        this.onStateChange();
    };

    CommandStateAdapter.prototype.onDocStateChange = function (isDocDirty) {
        this.isDocDirty = isDocDirty;
        this.onStateChange();
    };

    CommandStateAdapter.prototype.CMD_TOGGLES = {
        'nav.select.on': 'navAndSelect',
        'nav.select.off': 'navAndSelect',
        'nav.select.toggle': 'navAndSelect',
        'ui.status.on': 'statusBar',
        'ui.status.off': 'statusBar',
        'ui.status.toggle': 'statusBar'
    };

    CommandStateAdapter.prototype.processSuccessfulCmd = function (cmd) {
        var propName = this.CMD_TOGGLES[cmd];
        if (propName) {
            this[propName] = /\.toggle$/.test(cmd) ? !(this[propName]) : /\.on$/.test(cmd);
        }
    };

    /**
     * Update internal state to reflect changes for persistence and nav and select.
     */
    CommandStateAdapter.prototype.onCmdExec = function (cmd) {
        if (typeof cmd === 'string' && cmd.split('.')[0] === 'persist') {
            this.isDocDirty = false;
            this.persistError = false;
        } else if (cmd.cmd && cmd.result) {
            this.processSuccessfulCmd(cmd.cmd);
        }
        this.onStateChange();
    };

    /**
     * Only show persistence error if the operation was a user initiated save. If it was an auto
     * save that failed then wait until auto save is switched off to show the indicator.
     */
    CommandStateAdapter.prototype.onPersistError = function (data) {
        if (data && data.operation === 'save') {
            this.persistError = true;
            this.onStateChange();
        }
    };

    CommandStateAdapter.prototype.updateMode = function () {
        this.isCommandMode = KeyHandlerMgr.isEditableInCommandMode();
    };

    CommandStateAdapter.prototype.onModeChange = function (isCommandMode) {
        this.isCommandMode = isCommandMode;
        this.onStateChange();
    };

    /**
     * Allow the document state to reflect the result of the event that caused the publication
     * before sending out the state publication.
     */
    CommandStateAdapter.prototype.onDelayStateChange = function (delay) {
        var timeout = delay || 0;
        setTimeout(function () {
            this.onStateChange();
        }.bind(this), timeout);
    };

    /**
     * Only show the doc dirty indicator if not showing the persistence error indicator (which
     * implies that the doc is dirty).
     * queryCommandState and queryCommandValue throw on FireFox in some situations.
     */
    CommandStateAdapter.prototype.onStateChange = function () {
        var state = {};
        state.persisterr = this.persistError;
        state.docdirty = !this.persistError && this.isDocDirty;
        state.commandmode = this.isCommandMode;
        state.navandselect = this.navAndSelect;
        state.statusbar = this.statusBar;
        this.STATE_CMDS.forEach(function (cmd) {
            try {
                state[cmd] = document.queryCommandState(cmd);
            } catch (e) {}
        });
        this.VALUE_CMDS.forEach(function (cmd) {
            try {
                state[cmd] = document.queryCommandValue(cmd);
            } catch (e) {}
        });
        PubSub.publish('command.state', state);
    };

    /**
     * Long delay is needed if the hit happens when no editable has focus. Shorter delays
     * result in no command state being found.
     */
    CommandStateAdapter.prototype.handle = function (hit) {
        var handled = false;
        if (hit.hitType === 'single') {
            this.updateMode();
            this.onDelayStateChange(200);
            handled = true;
        }
        return handled;
    };

    function create() {
        return new CommandStateAdapter();
    }

    return {
        create: create
    };
});

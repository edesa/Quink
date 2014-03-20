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
    'Underscore',
    'util/PubSub',
    'hithandler/HitHandler'
], function (_, PubSub, HitHandler) {
    'use strict';

    var CommandStateAdapter = function () {
        var onStateChange = this.onStateChange.bind(this),
            onDelayStateChange = _.bind(this.onDelayStateChange, this, 10);
        HitHandler.register(this);
        PubSub.subscribe('command.executed', this.onCmdExec.bind(this));
        PubSub.subscribe('nav.executed', this.onNavExec.bind(this));
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

    CommandStateAdapter.prototype.onCmdExec = function (cmd) {
        if (typeof cmd === 'string' && cmd.split('.')[0] === 'persist') {
            this.isDocDirty = false;
            this.persistError = false;
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

    CommandStateAdapter.prototype.onNavExec = function (data) {
        if (data && data.navandselect !== undefined) {
            this.navAndSelect = data.navandselect;
            this.onStateChange();
        }
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
     */
    CommandStateAdapter.prototype.onStateChange = function () {
        var state = {};
        state.persisterr = this.persistError;
        state.docdirty = !this.persistError && this.isDocDirty;
        state.commandmode = this.isCommandMode;
        state.navandselect = this.navAndSelect;
        this.STATE_CMDS.forEach(function (cmd) {
            state[cmd] = document.queryCommandState(cmd);
        });
        this.VALUE_CMDS.forEach(function (cmd) {
            state[cmd] = document.queryCommandValue(cmd);
        });
        PubSub.publish('command.state', state);
    };

    CommandStateAdapter.prototype.accept = function (event) {
        return event.hitType === 'single';
    };

    /**
     * Long delay is needed if the hit happens when no editable has focus. Shorter delays
     * result in no command state being found.
     */
    CommandStateAdapter.prototype.handle = function () {
        this.onDelayStateChange(200);
    };

    function create() {
        return new CommandStateAdapter();
    }

    return {
        create: create
    };
});

/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

/**
 * A facade for the command sub system.
 */
define([
    'command/CommandSubscriber',
    'command/EditCommandMsgAdapter',
    'command/NavCommandMsgAdapter',
    'command/InsertCommandMsgAdapter',
    'command/InfoCommandMsgAdapter',
    'command/CommandStateAdapter',
    'command/PersistenceMsgAdapter'
], function (CommandSubscriber, EditCommandMsgAdapter, NavCommandMsgAdapter, InsertCommandMsgAdapter, InfoCommandMsgAdapter, CommandStateAdapter, PersistenceMsgAdapter) {
    'use strict';

    function init() {
        CommandSubscriber.register(EditCommandMsgAdapter.create());
        CommandSubscriber.register(NavCommandMsgAdapter.getInstance());
        CommandSubscriber.register(InsertCommandMsgAdapter.create());
        CommandSubscriber.register(InfoCommandMsgAdapter.create());
        CommandSubscriber.register(PersistenceMsgAdapter.create());
        CommandStateAdapter.create();
    }

    return {
        init: init
    };
});

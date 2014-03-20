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
    'command/EditCommandHandler'
], function (EditCommandHandler) {
    'use strict';

    var EditCommandMsgAdapter = function () {
        this.handler = new EditCommandHandler();
    };

    EditCommandMsgAdapter.prototype.ACCEPTED_IDS = [
        'edit',
        'font',
        'para',
        'style'
    ];

    EditCommandMsgAdapter.prototype.handle = function (msg) {
        var ar = msg.split('.'),
            id = ar[0],
            cmd = ar[1],
            args = ar[2] || null,
            handled;
        if (this.ACCEPTED_IDS.indexOf(id.toLowerCase()) >= 0) {
            this.handler.execCmd(cmd, args);
            handled = true;
        }
        return handled;
    };

    var instance;

    function create() {
        if (!instance) {
            instance = new EditCommandMsgAdapter();
        }
        return instance;
    }

    return {
        create: create
    };
});

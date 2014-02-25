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
    'command/InfoCommandHandler'
], function (InfoCommandHandler) {
    'use strict';

    var InfoCommandMsgAdapter = function () {
        this.handler = new InfoCommandHandler();
    };

    InfoCommandMsgAdapter.prototype.accept = function (msg) {
        return msg.split('.')[0] === 'info';
    };

    InfoCommandMsgAdapter.prototype.handle = function (msg) {
        var content = msg.split('.')[1];
        this.handler.show(content);
    };

    var instance;

    function create() {
        if (!instance) {
            instance = new InfoCommandMsgAdapter();
        }
        return instance;
    }

    return {
        create: create
    };
});

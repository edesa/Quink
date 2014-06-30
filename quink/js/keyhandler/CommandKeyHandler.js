/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'util/Type',
    'keyhandler/KeyHandler',
    'util/PubSub'
], function (Type, KeyHandler, PubSub) {
    'use strict';

    var CommandKeyHandler = function (selector, mgr) {
        Type.callSuper(this, 'constructor', selector, mgr);
    };

    Type.inheritFrom(CommandKeyHandler, KeyHandler);

    CommandKeyHandler.prototype.keyListener = function (event) {
        var cmd = this.identifyCommand(event),
            map = this.getMap();
        event.preventDefault();
        try {
            this.processCommand(cmd, event.keyCode);
        } catch (e) {
            console.log('caught exception: ' + e.message);
            if (e.stack) {
                console.log(e.stack);
            }
        }
        this.resetMap(map);
    };

    CommandKeyHandler.prototype.start = function () {
        Type.callSuper(this, 'start');
        this.getContainer().addClass('qk_command_mode');
    };

    CommandKeyHandler.prototype.switchMode = function () {
        this.getContainer().removeClass('qk_command_mode');
        Type.callSuper(this, 'switchMode');
    };

    CommandKeyHandler.prototype.switchMap = function (name, prefixKeyCode) {
        var mapName = name.toUpperCase() + '_MAP',
            map = this[mapName];
        if (map) {
            this.map = map;
            // Rely on the default map switching to reset the map.
            if (prefixKeyCode) {
                this.map[prefixKeyCode.toString()] = '';
            }
            console.log('switched map to: ' + mapName);
        }
    };

    CommandKeyHandler.prototype.getMap = function () {
        return this.map;
    };

    CommandKeyHandler.prototype.identifyCommand = function (event) {
        return this.getMap()[event.keyCode];
    };

    CommandKeyHandler.prototype.processCommand = function (cmd, keyCode) {
        var ar;
        if (cmd) {
            ar = cmd.split('.');
            if (ar[0] === 'map') {
                this.switchMap(ar[1], keyCode);
            } else if (cmd === 'exit') {
                this.switchMode();
            } else {
                PubSub.publish('command.exec', cmd);
            }
        }
    };

    CommandKeyHandler.prototype.resetMap = function (map) {
        if (map !== this.COMMAND_MAP) {
            this.switchMap('command');
        }
    };

    return CommandKeyHandler;
});

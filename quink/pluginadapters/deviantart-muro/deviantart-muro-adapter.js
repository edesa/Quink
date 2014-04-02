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

/*global */
require([
    'Underscore',
    'jquery',
    'ext/PluginAdapterContext'
], function (_, $, Context) {
    'use strict';
    //the iframe and the imageUploader component
    var $frameElements,
        imageUploader,
        $mask;

    //two finger scroll on trackpad appears as the mousewheel event
    $mask = $('<div>').addClass('qk_mask')
        .on('touchstart touchmove touchend click mousewheel', function (event) {
            event.preventDefault();
        });

    /**
     * Plugin API method - see Quink-Plugin-Notes document
     * (i) add the plugin markup to the DOM (re-using any plugin artifacts that have been previously downloaded)
     * (ii) show the plugin, ready to be used
     *
     * @param data - used to supply the open function with any data that is to be used by the plugin.
     *
     */
    function open(data) {
        console.log('[' + new Date().toISOString() + ']' + 'DeviantArtPlugin.open(data) called');
        Context.publish('opened');
    }
    /**
     * Plugin API method - see Quink-Plugin-Notes document
     *
     * Publish on a saved topic and as part of the publication include the serialised data to be saved
     */
    function save() {
        console.log('[' + new Date().toISOString() + ']' + 'DeviantArtPlugin.save() called');
        //can add data to the save
        Context.publish('saved');
    }
     /**
     * Plugin API method - see Quink-Plugin-Notes document
     *
     * When ready to exit, publish on an exited topic
     */
    function exit() {
        console.log('[' + new Date().toISOString() + ']' + 'DeviantArtPlugin.exit() called');
        Context.publish('exited');
    }
    function fetchPluginArtifacts() {
        console.log('[' + new Date().toISOString() + ']' + 'DeviantArtPlugin.fetchPluginArtifacts() called');
        //load plugin scripts, markup and css ready to use
        //when plugin loaded...
        Context.publish('loaded', {
            open: open,
            save: save,
            exit: exit
        });
    }
    fetchPluginArtifacts();
});

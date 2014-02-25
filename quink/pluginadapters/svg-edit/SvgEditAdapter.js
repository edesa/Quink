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

/*global embedded_svg_edit */
require([
    'Underscore',
    'jquery',
    'ext/PluginAdapterContext'
], function (_, $, Context) {
    'use strict';

    var frame,
        svgCanvas;

    /**
     * Runs func every delay milliseconds until func returns true.
     */
    function until(func, delay) {
        if (!func()) {
            _.delay(until, delay, func, delay);
        }
    }

    /**
     * Embedded method draw shouldn't have the stand alone file menu because the host app will
     * provide that functionality.
     * If data is provided, load method draw with that svg so that it can be edited.
     */
    function configureForEmbed(data) {
        var frameContents = frame.contents(),
            fileMenu = frameContents.find('#main_button'),
            menuDone = false,
            canvasDone = true,
            canvas;
        if (fileMenu.length > 0) {
            fileMenu.hide();
            menuDone = true;
        }
        if (data) {
            canvasDone = false;
            canvas = frameContents.find('#svgcanvas');
            if (canvas) {
                svgCanvas.setSvgString(data);
                canvasDone = true;
            }
        }
        if (menuDone && canvasDone) {
            frame.removeClass('qk_invisible');
            Context.publish('opened');
        }
        return menuDone && canvasDone;
    }

    function hide(topic, data) {
        frame.detach();
        frame.addClass('qk_invisible');
        Context.publish(topic, data);
    }

    /**
     * If this isn't done then one some browsers (e.g. desktop Chrome) the previous drawing
     * shows up in SVG Editor when a new instance os opened, which isn't what's wanted.
     */
    function ensureCleanState() {
        if (window.localStorage && window.localStorage.getItem('svgedit-default')) {
            window.localStorage.removeItem('svgedit-default');
        }
    }

    /**
     * Callback.
     */
    function save() {
        svgCanvas.getSvgString()(function (data, error) {
            if (error) {
                console.log('save error: ' + error);
            } else {
                hide('saved', data);
            }
        });
    }

    /**
     * Callback.
     */
    function exit() {
        hide('exited');
    }

    /**
     * Callback.
     * Loads the method draw DOM nodes into the document and configures it to run embedded.
     */
    function open(data) {
        frame.appendTo('body');
        ensureCleanState();
        until(_.partial(configureForEmbed, data), 100);
    }

    function fetchMarkup() {
        var url = Context.adapterUrl('svg-edit/SvgEditEmbed.html');
        $.get(url).done(function (data) {
            frame = $(data);
            svgCanvas = new embedded_svg_edit(frame[0]);
            Context.publish('loaded', {
                open: open,
                save: save,
                exit: exit,
                dom: frame[0].parentNode
            });
            console.log('Downloaded svg edit markup');
        }).fail(function (jqxhr, textStatus, error) {
            console.log('Failed to load svg edit markup from: ' + url + '. ' + jqxhr.status + '. ' + error);
        });
    }

    function fetchCss() {
        var url = Context.adapterUrl('svg-edit/SvgEditEmbed.css');
        $.get(url).done(function (data) {
            $('<style>').html(data).appendTo('head');
            fetchMarkup();
            console.log('Downloaded svg edit css');
        }).fail(function (jqxhr, textStatus, error) {
            console.log('Failed to load svg edit css from: ' + url + '. ' + jqxhr.status + '. ' + error);
        });
    }

    function fetchScript() {
        var url = Context.pluginUrl('svg-edit-2.6/embedapi.js');
        $.getScript(url).done(function () {
            fetchCss();
        }).fail(function (jqxhr, textStatus, error) {
            console.log('Failed to load embedapi from: ' + url + '. ' + jqxhr.status + '. ' + error);
        });
    }

    fetchScript();
});

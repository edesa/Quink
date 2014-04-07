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
        svgCanvas,
        throttledSizeFrame;

    /**
     * Runs func every delay milliseconds until func returns true.
     */
    function until(func, delay) {
        if (!func()) {
            _.delay(until, delay, func, delay);
        }
    }

    /**
     * Size the body of the iframe to match the body of the containing document. Anything else
     * doesn't seem to work on iOS. Specifically trying to do it all in css using height 100%
     * results in an iframe that's too tall for the viewport.
     * The timeout is to allow the reflow to take place after resizing the iframe's body. The
     * additional resize is needed on desktop Chrome which won't have resized the iframe to
     * accommodate the changed body size. The additional iframe resize breaks the layout on iOS
     * which will have already resized the frame.
     */
    function sizeFrame() {
        var reqHeight = window.innerHeight,
            initialHeight = frame.height();
        frame.contents().find('body').height(reqHeight);
        setTimeout(function () {
            if (frame.height() === initialHeight) {
                frame.height(reqHeight);
            }
        }, 0);
    }

    /**
     * Embedded method draw shouldn't have the stand alone file menu because the host app will
     * provide that functionality.
     * If data is provided, load method draw with that svg so that it can be edited.
     */
    function configureForEmbed(data) {
        var frameContents = frame.contents(),
            fileMenu = frameContents.find('.menu').get(1),
            menuDone = false,
            canvasDone = true,
            canvas;
        if (fileMenu) {
            $(fileMenu).hide();
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
            sizeFrame();
            // Try to avoid flickering on resize.
            setTimeout(function () {
                frame.removeClass('qk_invisible');
                Context.publish('opened');
            }, 0);
        }
        return menuDone && canvasDone;
    }

    function hide(topic, data) {
        frame.detach();
        frame.addClass('qk_invisible');
        window.removeEventListener('orientationchange', sizeFrame, false);
        window.removeEventListener('resize', throttledSizeFrame, false);
        Context.publish(topic, data);
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
        window.addEventListener('orientationchange', sizeFrame, false);
        window.addEventListener('resize', throttledSizeFrame, false);
        until(_.partial(configureForEmbed, data), 100);
    }

    function fetchMarkup() {
        var url = Context.adapterUrl('method-draw/MethodDrawEmbed.html');
        $.get(url).done(function (data) {
            frame = $(data);
            svgCanvas = new embedded_svg_edit(frame[0]);
            Context.publish('loaded', {
                open: open,
                save: save,
                exit: exit,
                dom: frame[0].parentNode
            });
            console.log('Downloaded method draw markup');
        }).fail(function (jqxhr, textStatus, error) {
            console.log('Failed to load method draw markup from: ' + url + '. ' + jqxhr.status + '. ' + error);
        });
    }

    function fetchCss() {
        var url = Context.adapterUrl('method-draw/MethodDrawEmbed.css');
        $.get(url).done(function (data) {
            $('<style>').html(data).appendTo('head');
            fetchMarkup();
            console.log('Downloaded method draw css');
        }).fail(function (jqxhr, textStatus, error) {
            console.log('Failed to load method draw css from: ' + url + '. ' + jqxhr.status + '. ' + error);
        });
    }


    function fetchScript() {
        var url = Context.pluginUrl('method-draw/embedapi.js');
        $.getScript(url).done(function () {
            fetchCss();
        }).fail(function (jqxhr, textStatus, error) {
            console.log('Failed to load embedapi from: ' + url + '. ' + jqxhr.status + '. ' + error);
        });
    }

    throttledSizeFrame = _.throttle(sizeFrame, 100);
    fetchScript();
});

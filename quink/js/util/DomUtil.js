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

/*global Node */
define([
    'jquery',
    'util/Env',
    'util/Event'
], function ($, Env, Event) {
    'use strict';

    /**
     * Tag name versus array of elements of that type. Intended to reduce the amount of DOM
     * element creation.
     */
    var elements = {},

    /**
     * Names of css classes used to identify internal Quink artifacts (e.g. toolbar).
     */
        quinkCssClasses = [
            'qk_state_bar',
            'qk_popup',
            'qk_toolbar_container',
            'qk_plugin_close_button'
        ];

    function popEl(tag) {
        var ar = elements[tag.toLowerCase()];
        return ar && ar.length > 0 ? ar.pop() : document.createElement(tag);
    }

    function pushEl(el) {
        var tag = el.tagName.toLowerCase(),
            ar = elements[tag];
        if (ar) {
            ar.push(el);
        } else {
            elements[tag] = [el];
        }
    }

    /**
     * SVG nodes don't appear to follow many (any?) of the usual element conventions.
     */
    function nodeHasQuinkClass(node) {
        var className = node.tagName.toLowerCase() !== 'svg' && node.className,
            result = false,
            i, length;
        if (className) {
            for (i = 0, length = quinkCssClasses.length; i < length; i++) {
                if (className.indexOf(quinkCssClasses[i]) >= 0) {
                    result = true;
                    break;
                }
            }
        }
        return result;
    }

    /**
     * Does the node or any parent of that node have a Quink class.
     */
    function isWithinQuinkClass(node) {
        var result = false,
            n;
        for (n = node; n && n.nodeType !== Node.DOCUMENT_NODE; n = n.parentNode) {
            if (nodeHasQuinkClass(n)) {
                result = true;
                break;
            }
        }
        return result;
    }

    function isQuinkLibArtifact(node) {
        return node.tagName === 'SCRIPT' &&
            (node.hasAttribute('data-requirecontext') || node.hasAttribute('data-requiremodule'));
    }

    function isQuinkArtifact(node) {
        return node && node.nodeType === 1 && (isWithinQuinkClass(node) || isQuinkLibArtifact(node));
    }

    /**
     * Is the node inside a part of the DOM that isn't to do with Quink's implementation?
     */
    function isWithinDocument(node) {
        return !isQuinkArtifact(node);
    }

    /**
     * A version of Array.some that works cross browser for node lists.
     */
    function nlSome(nodeList, func) {
        var result = false,
            i, length;
        if (!nodeList || typeof func !== 'function') {
            throw new TypeError();
        }
        for (i = 0, length = nodeList.length; i < length; i++) {
            if (func(nodeList[i])) {
                result = true;
                break;
            }
        }
        return result;
    }

    /**
     * Find all elements in the page that have attributes of the form:
     *  data-qk-ref=<attrName>
     * and action them.
     * Example would be:
     *      <iframe data-qk-ref="src" src="foo/bar"></iframe>
     * which would be converted into
     *      <iframe src="quink/relative/src/to/foo/bar"></iframe>
     * data-qk-ref can have multiple attribute names that are space separated.
     */
    function makeQuinkRelative(rootEl) {
        var elements = rootEl.querySelectorAll('[data-qk-ref]'),
            names, i, length, el,
            setElementAttr = function (attrName) {
                var value = el.getAttribute(attrName);
                el.setAttribute(attrName, Env.makeQuinkRelative(value));
            };
        for (i = 0, length = elements.length; i < length; i++) {
            el = elements[i];
            names = el.getAttribute('data-qk-ref').split(' ');
            names.forEach(setElementAttr);
        }
    }

    /**
     * Assumes that a touch device has a virtual keyboard which occupies different amounts of
     * screen real estate depending on the device orientation. The keyboard will be active if
     * there is an active element in the document (i.e. something has focus).
     * Only take a virtual keyboard into account if this 
     */
    function getMaxVisibleHeight(allowForVirtualKeyboard) {
        var win = $(window),
            height = win.height(),
            result = height,
            visArea;
        if (Event.isTouch && !!document.activeElement && allowForVirtualKeyboard) {
            visArea = height > win.width() ? 0.60 : 0.35;
            result = height * visArea;
        }
        return result;
    }

    /**
     * Returns the top and bottom coordinates for the visible part of the editable.
    */
    function getVisibleBounds(editable, allowForVirtualKeyboard) {
        var cont = $(editable),
            body = $(document),
            virtContTop, virtContBottom, visContTop, visContBottom;
        virtContTop = cont.offset().top - body.scrollTop();
        virtContBottom = virtContTop + cont.innerHeight();
        visContTop = Math.max(virtContTop, 0);
        visContBottom = Math.min(virtContBottom, getMaxVisibleHeight(allowForVirtualKeyboard));
        return {
            top: visContTop,
            bottom: visContBottom
        };
    }

    return {
        popEl: popEl,
        pushEl: pushEl,
        isWithinDocument: isWithinDocument,
        nlSome: nlSome,
        makeQuinkRelative: makeQuinkRelative,
        getVisibleBounds: getVisibleBounds
    };
});

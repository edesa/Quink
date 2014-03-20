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
    'jquery',
    'rangy',
    'util/PubSub',
    'util/DomUtil'
], function ($, rangy, PubSub, DomUtil) {
    'use strict';

    /**
     * iOS7 makes getBoundingClientRect document relative instead of viewport relative.
     * This check uses the user agent to identify iOS7 which is far from ideal.
     */
    var clientRectIsViewportRelative = (function () {
        return navigator.userAgent.search(/iPad; CPU OS 7[0-9_]+ /) < 0;
    }());

    /**
     * Wrapper around a rangy range which makes determining page position and the relative position
     * of one range against another a lot less messy. Or at least keeps the mess in one place.
     * The location is set when the object is constructed. Changes made to the contained Rangy
     * range are not reflected in the LocRange wrapper object.
     */
    var LocRange = function (range, isDown) {
        this.range = range;
        this.isDown = isDown;
        this.map = isDown ? this.downMap : this.upMap;
        this.isRectFromRange = true;
    };

    LocRange.prototype.locate = function () {
        this.ensureLeaf();
        this.rect = this.range.nativeRange.getBoundingClientRect();
        if (this.isNull(this.rect)) {
            this.ensureLocatable();
        }
        return this;
    };

    LocRange.prototype.detach = function () {
        this.range.detach();
        this.range = null;
        this.map = null;
        this.rect = null;
        this.xcoord = null;
        this.offsetBound = null;
    };

    LocRange.prototype.upMap = {
        node: 'endContainer',
        offset: 'endOffset',
        x: 'right',
    };

    LocRange.prototype.downMap = {
        node: 'startContainer',
        offset: 'startOffset',
        x: 'left',
    };

    LocRange.prototype.getRange = function () {
        return this.range;
    };

    LocRange.prototype.getNode = function () {
        return this.range[this.map.node];
    };

    LocRange.prototype.getOffset = function () {
        return this.range[this.offsetBound || this.map.offset];
    };

    LocRange.prototype.getX = function () {
        return this.rect[this.xcoord || this.map.x];
    };

    LocRange.prototype.getTop = function () {
        return this.rect.top - this.getViewportCorrection();
    };

    LocRange.prototype.getBottom = function () {
        return this.rect.bottom - this.getViewportCorrection();
    };

    /**
     * Returns the value needed to make a vertical coordinate viewport relative. Some of the
     * client rects are now viewport and some are docoument relative. Since iOS7.
     */
    LocRange.prototype.getViewportCorrection = function () {
        var result = 0;
        if (this.isRectFromRange && !clientRectIsViewportRelative) {
            result = $('body').scrollTop();
        }
        return result;
    };

    LocRange.prototype.setBound = function (isStart) {
        if (isStart) {
            this.xcoord = 'left';
            this.offsetBound = 'startOffset';
        } else {
            this.xcoord = 'right';
            this.offsetBound = 'endOffset';
        }
    };

    /**
     * Ensures that this range is set to the node nearest the leaf rather than being set
     * on a parent node.
     * This is needed because sometimes cloning a range produces a new range that has
     * a different startContainer which can be a containing node, rather than a leaf node.
     */
    LocRange.prototype.ensureLeaf = function () {
        var range = this.getRange(),
            kids, index;
        if (range.collapsed && range.startContainer.hasChildNodes()) {
            kids = range.startContainer.childNodes;
            index = kids.length > range.startOffset ? range.startOffset : kids.length - 1;
            if (kids.length <= range.startOffset) {
                console.log('patching up the leaf...');
            }
            range.setStart(kids[index], 0);
            range.collapse(true);
            this.ensureLeaf();
        }
    };

    /**
     * Locate this range by wrapping it in an element. Assumes the range is collapsed and
     * is before a BR node.
     */
    LocRange.prototype.locateByWrapping = function () {
        var range = this.getRange(),
            $node = $(this.getNode()),
            cont = range.startContainer,
            el = DomUtil.popEl('span'),
            rect;
        $node.wrap(el);
        rect = $node.parent()[0].getBoundingClientRect();
        $node.unwrap();
        DomUtil.pushEl(el);
        range.setStart(cont, 0);
        range.collapse(true);
        this.isRectFromRange = false;
        return rect;
    };

    /**
     * Ensures that the range can be located on the page. Collapsed ranges have no bounding
     * rect nor do BR elements.
     * As a side effect this sets this.xcoord to the side (left or right) that represents
     * this range's x coordinate (rather than the extended coordinate).
     */
    LocRange.prototype.ensureLocatable = function () {
        var range = this.getRange(),
            rect;
        if (range.collapsed) {
            // Collapsed range, so start/end are the same.
            if (range.startContainer.tagName === 'BR') {
                rect = this.locateByWrapping();
            } else {
                rect = this.extend();
                if (this.isNull(rect)) {
                    // Failed to extend
                    rect = this.locateUsingEl();
                }
            }
        } else {
            rect = range.nativeRange.getBoundingClientRect();
            if (this.isNull(rect)) {
                // Can't locate using ranges, try wrapping in an element.
                rect = this.locateUsingEl();
            }
            // Assumes that a non-collapsed range is a result of movement during nav.
            this.setBound(this.isDown);
        }
        this.rect = rect;
    };

    /**
     * Tries to locate this range inserting an element at the start and returning that element's
     * client rect. Inserting a node into a range can change the range's start/end container.
     * To avoid this the range is cloned and the operation done on the clone.
     * If this range is within a text node inserting an element will split the text node into
     * two nodes. This causes problems if we're already in the middle of a navigation as
     * the number of nodes has been fixed at the start of the navigation. To avoid this
     * we normalise the parent which will glue any split text nodes back together.
     * Working with an off screen copy of the editable would probably be better, but that's
     * less efficient and more re-work at this point.
     */
    LocRange.prototype.locateUsingEl = function () {
        var range = this.getRange(),
            clone = range.cloneRange(),
            el = DomUtil.popEl('span'),
            node = this.getNode(),
            rect;
        clone.insertNode(el);
        rect = el.getBoundingClientRect();
        $(el).remove();
        DomUtil.pushEl(el);
        if (node.nodeType === 3) {
            node.parentNode.normalize();
            PubSub.publish('nav.afternormalise');
        }
        clone.detach();
        this.isRectFromRange = false;
        return rect;
    };

    /**
     * Determines whether the given client rect represents an empty rect.
     */
    LocRange.prototype.isNull = function (rect) {
        return !rect ||
            (rect.height === 0 && rect.width === 0);
    };

    /**
     * Tries to extend the start of this range and returns the resulting client rect.
     * Reset indicates that the extension is being done just to get the rect and the effect
     * should be reversed leaving no permanent change to the range.
     */
    LocRange.prototype.extendStart = function (reset) {
        var range = this.getRange(),
            node = this.getNode(),
            rect;
        if (range.startOffset > 0) {
            range.setStart(node, range.startOffset - 1);
            rect = range.nativeRange.getBoundingClientRect();
            if (reset) {
                range.setStart(node, range.startOffset + 1);
            } else {
                this.setBound(false);
            }
        }
        return rect;
    };

    /**
     * Tries to extend the end of this range and returns the resulting client rect.
     * Reset indicates that the extension is being done just to get the rect and the effect
     * should be reversed leaving no permanent change to the range.
     */
    LocRange.prototype.extendEnd = function (reset) {
        var range = this.getRange(),
            node = this.getNode(),
            rect;
        if (node.nodeValue && (range.endOffset < node.nodeValue.length)) {
            range.setEnd(node, range.endOffset + 1);
            rect = range.nativeRange.getBoundingClientRect();
            if (reset) {
                range.setEnd(node, range.endOffset - 1);
            } else {
                this.setBound(true);
            }
        }
        return rect;
    };

    /**
     * Extends this range. How it's extended depends on where on the page the range is located.
     * Extension must not change the line of the range. To try to work out which end it's safe to
     * extend from an attempt is made to extend both ends and the result is checked to determine
     * which is the right end to use.
     * Range extension is usually done in order to be able to locate the range on the page. A
     * collapsed range can't be located.
     */
    LocRange.prototype.extend = function () {
        var start = this.extendStart(true),
            end = this.extendEnd(true),
            rect;
        if (start && end) {
            if (this.isNull(start) && !this.isNull(end)) {
                // start of line, no vis space: extend END
                rect = this.extendEnd();
            } else if (!this.isNull(start) && this.isNull(end)) {
                // end of line, no vis space eol above: extend START
                rect = this.extendStart();
            } else {
                // extension possible at both start and end
                if (start.bottom === end.bottom) {
                    // middle of line: extend EITHER
                    rect = this.extendStart();
                } else if (start.bottom < end.bottom) {
                    rect = this.extendEnd();
                } else {
                    console.log('unknown 2: extend ???');
                }
            }
        } else {
            if (!start) {
                // start of document: extend END
                rect = this.extendEnd();
            } else if (!end) {
                // end of document: extend START
                rect = this.extendStart();
            } else {
                console.log('unknown 3: extend ???');
            }
        }
        return rect;
    };

    /**
     * Determine whether this represents the space at the end of a line.
    **/
    LocRange.prototype.isSpaceAtEol = function () {
        var node = this.getNode();
        return node.nodeType === 3 && node.nodeValue[this.getOffset()] === ' ';
    };

    LocRange.prototype.collapseToRange = function (other, isNewLine) {
        var range = this.getRange(),
            toStart;
        if (isNewLine && range.startContainer.nodeValue[range.startOffset] === ' ') {
            // To avoid moving the caret to the old line on the collapse.
            toStart = true;
        } else {
            // collapse to the end closest to the desired x-coord.
            toStart = Math.abs(this.rect.right - other.getX()) >= Math.abs(this.rect.left - other.getX());
        }
        this.getRange().collapse(toStart);
        rangy.getSelection().setSingleRange(this.getRange());
    };

    /**
     * Collapses this range and sets it as the current selection for the window.
     * The collapsing is done so that the collapsed range is as close to the other range's
     * xcoordinate as possible.
     */
    LocRange.prototype.select = function (other, isNewLine) {
        if (this.getNode().tagName === 'BR') {
            rangy.getSelection().setSingleRange(this.getRange());
        } else {
            this.collapseToRange(other, isNewLine);
        }
    };

    LocRange.prototype.selectToBound = function (toStart) {
        this.getRange().collapse(toStart);
        rangy.getSelection().setSingleRange(this.getRange());
    };

    /**
     * Returns an object suitable for starting navigation. If this range represents a text
     * node then the Rangy range for the current selection is returned. This ensures that
     * the navigation starts at the caret and not at the start of the node that contains the
     * caret.
     * If this range doesn't wrap a text node, the range node is returned.
     */
    LocRange.prototype.getNavStart = function () {
        var result;
        if (this.getNode().nodeType === 3) {
            result = rangy.createRange();
            result.setStart(this.getNode(), this.getOffset());
            result.collapse(true);
        } else {
            result = this.getNode();
        }
        return result;
    };

    return LocRange;
});

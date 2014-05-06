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
    'jquery',
    'rangy',
    'textrange',
    'locrange/LocRange',
    'util/PubSub',
    'nav/Position',
    'hithandler/HitHandler',
    'util/Env',
    'util/Event',
    'util/DomUtil'
], function (_, $, rangy, textrange, LocRange, PubSub, Position, HitHandler, Env, Event, DomUtil) {
    'use strict';

    var Nav = function () {
        var onInsert = this.onInsert.bind(this);
        PubSub.subscribe('event.orientationchange', _.bind(this.onOrientationChange, this));
        PubSub.subscribe('insert.char', onInsert);
        PubSub.subscribe('insert.text', onInsert);
        PubSub.subscribe('insert.html', onInsert);
        HitHandler.register(this);
        this.charMonitorInterval = Env.getParam('cmi', this.CHAR_MONITOR_INTERVAL);
        this.charMonitorTimer = null;
    };

    /**
     * Elements that are to be skipped during vertical navigation.
     * https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5/HTML5_element_list
     */
    Nav.prototype.SKIP_NODES = [
        'IMG',
        'IFRAME',
        'EMBED',
        'OBJECT',
        'PARAM',
        'VIDEO',
        'AUDIO',
        'SOURCE',
        'TRACK',
        'CANVAS',
        'MAP',
        'AREA',
        'SVG',
        'MATH',
        'TABLE'
    ];
    Nav.prototype.SKIP_NODES_STR = Nav.prototype.SKIP_NODES.join(',');

    /**
     * How long there has to be without character input before the text insertion point
     * is scrolled into the visible area (in millis). This can be overriden using the
     * 'cmi' query parameter.
     */
    Nav.prototype.CHAR_MONITOR_INTERVAL = 300;

    Nav.prototype.setState = function (state) {
        this.state = state;
    };

    Nav.prototype.getState = function () {
        return this.state;
    };

    Nav.prototype.hasNavChild = function (node) {
        var me = this;
        return $(node).contents().filter(function () {
            return me.isValidForNav(this);
        }).length > 0;
    };

    Nav.prototype.isValidForNav = function (node) {
        return node &&
               (node.nodeType === 3 ||
                (node.nodeType === 1 && this.SKIP_NODES.indexOf(node.tagName.toUpperCase()) < 0));
    };

    /**
     * Moves up and across the tree returning the first sibling or parent's sibling starting
     * from node. The siblings are either next or previous depending on the value of the
     * isNext argument.
     */
    Nav.prototype.up = function (node, isNext) {
        var n = isNext ? node.nextSibling : node.previousSibling;
        if (!this.isValidForNav(n)) {
            n = node.parentNode;
            if (n !== this.getState().editable) {
                n = this.up(n, isNext);
            } else {
                n = null;
            }
        }
        return n;
    };

    /**
     * Returns the leaf node starting from the given node. The traversal will use either the
     * first or last children on its way down depending on the value of isLast.
     */
    Nav.prototype.down = function (node, isLast) {
        var n = isLast ? node.lastChild : node.firstChild;
        if (this.isValidForNav(n) && this.hasNavChild(n)) {
            n = this.down(n, isLast);
        }
        return n;
    };

    /**
     * Returns the first leaf node starting from node. Can return null.
     */
    Nav.prototype.findLeaf = function (node, isDown) {
        var n = node,
            newStart;
        if (node && (node.nodeType !== 3 && node.tagName !== 'BR')) {
            newStart = this.hasNavChild(node) ? this.down(node, !isDown) : this.up(node, isDown);
            n = this.findLeaf(newStart, isDown);
        }
        return n;
    };

    /**
     * Determines whether obj is a Rangy range object.
     */
    Nav.prototype.isRange = function (obj) {
        return obj && obj.nativeRange !== undefined;
    };

    /**
     * Visit all nodes that are displayed in order from obj until func returns something truthy.
     * For each node visited, func is executed passing the text node as its argument.
     * Note that obj can be a Rangy range as well as a DOM node.
     */
    Nav.prototype.mapDisplay = function (obj, context, func) {
        var node, result;
        if (this.isRange(obj)) {
            result = func.call(this, obj, context);
            node = obj.startContainer;
        } else {
            node = this.findLeaf(obj, context.isDown);
            if (node) {
                result = func.call(this, node, context);
            }
        }
        if (node && !result) {
            result = this.mapDisplay(this.up(node, context.isDown), context, func);
        }
        return result;
    };

    /**
     * Returns a collapsed rangy range that forms the anchor for the current vertical navigation.
     */
    Nav.prototype.getStartRange = function (isDown, select) {
        var range = rangy.getSelection().getRangeAt(0),
            toStart = (select && this.getState().activeSelEnd === 'start') || (!select && !isDown),
            nonNav;
        range.collapse(toStart);
        nonNav = $(range.startContainer).parents(this.SKIP_NODES_STR);
        if (nonNav.length > 0) {
            range = this.findNextNavNode(nonNav, isDown);
        }
        return range;
    };

    /**
     * Finds the nearest node usable for navigation moving in the opposite direction to
     * the current navigation.
     */
    Nav.prototype.findNextNavNode = function (nonNav, isDown) {
        var node = this.up(nonNav[0], !isDown),
            range, offset;
        if (node) {
            range = rangy.createRange();
            if (!isDown) {
                range.setEnd(node, 0);
                range.collapse(false);
            } else {
                offset = node.nodeType === 1 ? node.childNodes.length : node.nodeValue.length;
                range.setEndAfter(node, offset);
                range.collapse(false);
            }
            // Just in case the navigation fails, this will be the best end point.
            rangy.getSelection().setSingleRange(range);
        }
        return range;
    };

    /**
     * Returns the editable within which the current selection lies.
     */
    Nav.prototype.getCurrentEditable = function () {
        var editable = $(rangy.getSelection().anchorNode).parents('[contenteditable="true"]');
        return editable.length === 1 ? editable[0] : null;
    };

    /**
     * Visit every character within the text node calling the given function once per char until
     * there are no more chars or until the function returns a truthy value.
     */
    Nav.prototype.mapChar = function (textNode, context, func, start) {
        var text = textNode.nodeValue,
            i, end, done;
        if (context.isDown) {
            i = _.isUndefined(start) ? 0 : start;
            for (end = text.length; !done && i <= end; i++) {
                done = func.call(this, text[i], i, context);
            }
        } else {
            i = _.isUndefined(start) ? text.length : start;
            for (end = 0; !done && i >= end; i--) {
                done = func.call(this, text[i], i, context);
            }
        }
        return done;
    };

    /**
     * Visits the text node to see whether it contains the navigation target.
     * Returns an object that indicates whether the target was found and the current best
     * possible navigation target.
     */
    Nav.prototype.mapTextNode = function (textNode, context, startIndex) {
        var done = this.mapChar(textNode, context, function (char, index, context) {
            var range = rangy.createRange(),
                dr;
            range.setStart(textNode, index);
            range.collapse(true);
            dr = new LocRange(range, context.isDown).locate();
            return context.compare(dr);
        }, startIndex);
        return done;
    };

    /**
     * Visits the range to see whether it contains the navigation target. Assumes that the
     * range wraps a text node and checks each character within that node starting at the
     * point indicated by the range.
     * Returns an object that indicates the current state of the navigation.
     */
    Nav.prototype.mapRange = function (range, context) {
        var node = range.startContainer,
            index = range.startOffset;
        return this.mapTextNode(node, context, index);
    };

    /**
     * Determines whether the BR node satifies the current navigation.
     */
    Nav.prototype.checkBr = function (node, context) {
        var range = rangy.createRange(),
            dr;
        range.setStart(node, 0);
        range.collapse(true);
        dr = new LocRange(range, context.isDown).locate();
        return context.compare(dr);
    };

    /**
     * Navigates a line up or down within the editable.
     */
    Nav.prototype.line = function (context) {
        this.mapDisplay(context.getNavStart(), context, function (obj, context) {
            var result;
            if (this.isRange(obj)) {
                result = this.mapRange(obj, context);
            } else if (obj.nodeType === 3) {
                result = this.mapTextNode(obj, context);
            } else if (obj.tagName === 'BR') {
                result = this.checkBr(obj, context);
            }
            return result;
        });
        context.checkSelectBest();
        return context;
    };

    /**
     * Checks that the navigation anchors are set correctly. A selection can be set outside
     * Quink or the Quink selection can be changed. If either of these things has happened, use
     * the current selection as the new anchor points.
     */
    Nav.prototype.checkAnchors = function (isDown, select) {
        var sel, range;
        if (select) {
            sel = rangy.getSelection();
            range = sel && sel.rangeCount && sel.getRangeAt(0);
            if (range) {
                // Selection set outside Quink, use it as the Quink anchors.
                if (!this.getState().selRange) {
                    this.getState().activeSelEnd = isDown ? 'end' : 'start';
                    this.setXAnchor();
                } else {
                    this.getState().selRange.detach();
                }
                this.getState().selRange = range;
            }
        }
    };

    /**
     * Can be called with a range (LocRange object) or with no args. If there are no args
     * then ensures that the current selection is visible. Otherwise ensures that the range
     * argument is visible.
     * The process can temporarily alter the DOM, so re-instate the current selection after
     * we're done.
     */
    Nav.prototype.ensureVisible = function (range) {
        var sel = rangy.getSelection(),
            rge = range,
            clone;
        if (!rge && sel.rangeCount > 0) {
            rge = sel.getRangeAt(0);
            clone = rge.cloneRange();
            rge = new LocRange(rge).locate();
        }
        try {
            this.makeRangeVisible(rge);
        } finally {
            if (clone) {
                sel.setSingleRange(clone);
            }
        }
    };

    /**
     * Makes sure that the given range is visible. range is a LocRange object.
     * On the iPad the document itself is scrolled because of the virtual keyboard.
     */
    Nav.prototype.makeRangeVisible = function (range) {
        var cont, body, visBounds,
            rangeTop, contScrollTop, delta;
        if (range) {
            cont = $(this.getState().editable);
            body = $('body');
            visBounds = DomUtil.getVisibleBounds(cont, true);
            rangeTop = range.getTop();
            contScrollTop = cont.scrollTop();
            if (rangeTop < visBounds.top) {
                delta = Math.ceil(visBounds.top - rangeTop);
                cont.scrollTop(contScrollTop - delta);
                if (cont.scrollTop() !== contScrollTop - delta) {
                    // Container didn't scroll enough, try the body
                    body.scrollTop(body.scrollTop() - delta);
                }
            } else if (range.getBottom() > visBounds.bottom) {
                delta = Math.ceil(range.getBottom() - visBounds.bottom);
                cont.scrollTop(contScrollTop + delta);
                if (cont.scrollTop() !== contScrollTop + delta) {
                    // Container didn't scroll enough, try the body
                    body.scrollTop(body.scrollTop() + delta);
                }
            }
        }
    };

    /**
     * Vertical navigation with selection. The aim is to emulate the browser behaviour when doing the
     * same operation, so the selection changes at the active end. If the active end is brought
     * to the initial selection anchor point, the process starts again.
     */
    Nav.prototype.lineAndSelect = function (isDown, select, context) {
        var origin;
        this.checkAnchors(isDown, select);
        origin = this.getStartRange(isDown, select);
        context.setNavStart(origin);
        context.setOrigin(this.getXAnchor());
        context = this.line(context);
        if (context.shouldSetXAnchor()) {
            this.setXAnchor();
        }
        if (select && context.result) {
            this.selectAfterNav(isDown, origin, context.result.getRange());
        } else if (!select) {
            this.clearSelAnchor();
        }
        this.ensureVisible(context.result);
        context.clear();
        origin.detach();
        return !!context.result;
    };

    /**
     * Horizontal navigation uses Rangy. Rangy navs left leaving the selection at the start of
     * the words and navs right leaving the selection at the end of words. This means that
     * navigating horizontally in one direction, then back in the other won't end up with the range
     * at exactly the same place.
     * In order to avoid problems with this where Quink ends up setting the selection's start
     * after it's end (or the other way around) this checks for such a scenario and switches
     * active ends.
     */
    Nav.prototype.checkReverseSel = function (range) {
        var state = this.getState();
        if (state.activeSelEnd === 'start' &&
            range.compareBoundaryPoints(range.END_TO_START, state.selRange) > 0) {
            state.activeSelEnd = 'end';
        } else if (state.activeSelEnd === 'end' &&
            range.compareBoundaryPoints(range.START_TO_END, state.selRange) < 0) {
            state.activeSelEnd = 'start';
        }
    };

    /**
     * Extends the selection after navigation has finished. Origin is the nav start point and
     * result the nav end point, both as Rangy ranges. Result is collapsed.
     */
    Nav.prototype.selectAfterNav = function (isDown, origin, result) {
        var range, setBoundFunc;
        if (this.getState().selRange) {
            // Extending an existing range.
            this.checkReverseSel(result);
            setBoundFunc = this.getState().activeSelEnd === 'start' ? 'setStart' : 'setEnd';
            this.getState().selRange[setBoundFunc](result.startContainer, result.startOffset);
        } else {
            // Creating a new range.
            range = rangy.createRange();
            if (isDown) {
                range.setStart(origin.startContainer, origin.startOffset);
                range.setEnd(result.startContainer, result.startOffset);
            } else {
                // Must create ranges with start before end.
                range.setStart(result.startContainer, result.startOffset);
                range.setEnd(origin.startContainer, origin.startOffset);
            }
            this.getState().selRange = range;
            this.getState().activeSelEnd = isDown ? 'end' : 'start';
        }
        if (this.getState().selRange.collapsed) {
            this.clearSelAnchor();
        } else {
            rangy.getSelection().setSingleRange(this.getState().selRange);
        }
    };

    /**
     * Navigates a word or character left or right within the editable. Need to store off the
     * start point in case the nav moves outside the editable.
     * Have to ensure that the initial selection is collapsed to allow nav with select to work
     * correctly when moving left across the page. If the initial selection isn't collapsed
     * the left nav just gets to the start of the range, then the select happens which simply
     * re-creates the initial selection.
     */
    Nav.prototype.across = function (origin, unit, amount) {
        var range = rangy.getSelection().getRangeAt(0).cloneRange(),
            moved, result;
        rangy.getSelection().setSingleRange(origin);
        moved = rangy.getSelection().move(unit, amount);
        if (moved) {
            if (this.getState().editable !== this.getCurrentEditable()) {
                rangy.getSelection().setSingleRange(range);
            } else {
                this.setXAnchor();
                result = rangy.getSelection().getRangeAt(0);
            }
        } else {
            rangy.getSelection().setSingleRange(range);
        }
        return result;
    };

    Nav.prototype.acrossAndSelect = function (unit, amount, select) {
        var isDown = amount >= 0,
            origin, result, dr;
        this.checkAnchors(isDown, select);
        origin = this.getStartRange(isDown, select);
        result = this.across(origin.cloneRange(), unit, amount);
        if (result) {
            if (select) {
                this.selectAfterNav(isDown, origin, result);
            } else {
                this.clearSelAnchor();
            }
            dr = new LocRange(result, isDown).locate();
            this.ensureVisible(dr);
            dr.detach();
        } else {
            this.clearSelAnchor();
        }
        origin.detach();
        return !!result;
    };

    /**
     * Sets the horizontal anchor used to position within the line during vertical
     * navigation.
     */
    Nav.prototype.setXAnchor = function (isClear) {
        var sel;
        if (isClear) {
            this.getState().xAnchor = null;
        } else {
            sel = rangy.getSelection();
            if (sel.rangeCount > 0) {
                if (this.getState().xAnchor) {
                    this.getState().xAnchor.detach();
                }
                this.getState().xAnchor = sel.getRangeAt(0).cloneRange();
            }
        }
    };

    /**
     * Retrieves the current position object as a Rangy range. If no x-anchor exists, create one
     * based on the current selection position.
     */
    Nav.prototype.getXAnchor = function () {
        var xa = this.getState().xAnchor,
            dr;
        if (!xa) {
            this.setXAnchor();
            xa = this.getState().xAnchor;
        } else {
            try {
                xa.refresh();
            } catch (e) {}
        }
        dr = new LocRange(xa.cloneRange()).locate();
        return new Position(dr.getX(), dr.getBottom());
    };

    /**
     * Clear the navigation's notion of the current selection anchor and active selection end.
     */
    Nav.prototype.clearSelAnchor = function () {
        var state = this.getState();
        if (state.selRange) {
            state.selRange.detach();
            state.selRange = null;
            state.activeSelEnd = null;
        }
    };

    /**
     * Fired before the browser has executed the default action (add char to DOM or move text
     * cursor), so reset the anchors after the browser has had a chance to execute the default
     * action and the cursor, DOM etc are in the correct state.
     */
    Nav.prototype.resetAnchors = function () {
        this.clearSelAnchor();
        this.setXAnchor();
    };

    Nav.prototype.onOrientationChange = function () {
        this.ensureVisible();
    };

    Nav.prototype.handle = function (event) {
        var handled;
        if (event.hitType === 'single') {
            this.doHandle(event);
            handled = true;
        }
        return handled;
    };

    /**
     * On mobile Safari the focus event happens after the hit event. In that scenario we have to
     * wait until after the focus event has been handled to handle the hit event.
     */
    Nav.prototype.doHandle = function (event) {
        var isStateStale = function (state, editable) {
                return !state || state.editable !== editable[0];
            },
            handleHit = function (event) {
                if (isStateStale(this.getState(), Event.getEditable(event.event))) {
                    setTimeout(function () {
                        handleHit(event);
                    }, 10);
                } else {
                    setTimeout(function () {
                        this.resetAnchors();
                    }.bind(this), 0);
                }
            }.bind(this);
        handleHit(event);
    };

    /**
     * Allow time for the DOM to update.
     */
    Nav.prototype.onInsert = function () {
        setTimeout(function () {
            this.resetAnchors();
        }.bind(this), 10);
        this.monitorCharInput();
    };

    /**
     * Trying to make sure that the text insertion point is kept visible at all times can cause
     * the caret to be placed behind entered characters. To avoid this we wait for periods when
     * there's been no characters entered to scroll the caret into view.
     */
    Nav.prototype.monitorCharInput = function () {
        var monitor = function () {
                this.ensureVisible();
            }.bind(this);
        clearTimeout(this.charMonitorTimer);
        this.charMonitorTimer = setTimeout(monitor, this.charMonitorInterval);
    };

    return Nav;
});

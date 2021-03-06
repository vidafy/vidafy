/*!
    * jQuery lazyTreeTable plugin v0.1
    * http://www.github.com/jdl/jquery-lazy-tree-table
    *
    * Copyright (c) 2009 James Ludlow
    * Licensed under the MIT license.
    * http://www.github.com/jdl/jquery-lazy-tree-table/tree/master/LICENSE
    *
    * @projectDescription  Adds asynchronous expand/collapse functions to a table.
    *
    * @author  James Ludlow
    * @version 0.1
*/
; (function ($) {

    var proxied = $.fn.lazyTreeTable;
    $.fn.lazyTreeTable = function (options) {
        var opts = $.extend({}, $.fn.lazyTreeTable.defaults, options);

        var childOfRegex = new RegExp(opts.childNodeClassPrefix);
        var hasChildTypeRegex = new RegExp(opts.childTypePrefix);

        return this.each(function () {
            opts.tableId = this.id;
            allNodes().each(function (i, node) {
                initNodeLinks(node);
                if (!isChild(node)) {
                    hideDescendents(node);
                }
            });
        });

        function allNodes(options) {
            var allNodesOpts = $.extend({}, { only_visible: false }, options);
            var nodeSelector = '#' + opts.tableId;
            if (opts.parentHtmlType == 'tr') {
                nodeSelector = nodeSelector + '>tbody>tr';
            } else if (opts.parentHtmlType == 'tbody') {
                nodeSelector = nodeSelector + '>tbody';
            }

            if (allNodesOpts.only_visible) {
                nodeSelector = nodeSelector + ':visible';
            }
            return $(nodeSelector);
        }


        /**
        * For a node's expand/collapse links, perform the following:
        * - Hide the collapse link(s).
        * - Show any expand links for which there are children of that type.
        * @param 
        */
        function initNodeLinks(node) {
            var collapseLinks = getCollapseLinks(node);
            var expandLinks = getExpandLinks(node);

            // Hide all of the collapse buttons.
            if (collapseLinks.length > 0) {
                $(collapseLinks).hide();
                $(collapseLinks).unbind("click").bind("click", { element: node }, handleCollapseEvent);
            }

            if (expandLinks.length > 0) {
                $(expandLinks).each(function (i, link) {
                    if (hasChildren(node, matchingClassFromElement(hasChildTypeRegex, link))) {
                        $(link).show();
                        $(link).unbind("click").bind("click", { element: node }, handleExpandEvent);
                    } else {
                        $(link).hide();
                    }
                });
            }
        };

        // Applies the supplied function to all descendents of the parentNode.
        // params
        // * parentNode: The top-level node of the branch to which we should apply the function.
        // * applyToParent: If true, then the parentNode itself will also have the function applied.
        // * fn: The function to apply to each node in this branch of the tree.
        function applyToBranch(parentNode, fn) {
            $.fn.lazyTreeTable.getChildren(parentNode, opts.childNodeClassPrefix).each(function (i, child) {
                fn(child);
                applyToBranch(child, fn);
            });
        };

        // Given a parent node, hide all descendents.
        function hideDescendents(parentNode) {
            applyToBranch(parentNode, function (node) {
                $(node).hide();
            });
        };

        // Checks to see if a given node ID is an ancestor of a given node.
        function hasAncestor(node, ancestorId) {
            var parentNode = getParent(node);
            if (parentNode) {
                return parentNode.attr('id') == ancestorId || hasAncestor(parentNode, ancestorId);
            } else {
                return false;
            }
        };

        // Given a node (node), this returns true if there is another node
        // which lists this node as a parent.
        function hasChildren(node, childType) {
            if (node != null && $.fn.lazyTreeTable.getChildren(node, opts.childNodeClassPrefix, childType).length > 0) {
                return true;
            } else {
                return false;
            }
        };

        // There should only be one placeholder child per parent, but this returns all of them if it
        // finds more than one.
        function getPlaceholderChildren(node, childType) {
            return $.fn.lazyTreeTable.getChildren(node, opts.childNodeClassPrefix, childType).filter('.' + opts.childPlaceholderNodeClass)
        }

        // Given a node (node), this returns true if this node is a child of
        // another node.
        function isChild(node) {
            if (node != null && $(node).attr('class').match(childOfRegex)) {
                return true;
            } else {
                return false;
            }
        };

        /* Someone clicked an "expand" link.
            * Several things are about to happen:
            *   1. Hide the clicked expand link.
            *   2. If there is a child placeholder, fetch the child nodes remotely.
            *   3. Show the child nodes.
            *   4. Show the collapse link. If the expand link is tied to a child type, then only show the 
            *      corresponding collapse link.
            *   5. If non-placeholder children exist for a different child type, remove those nodes and replace 
            *      them with a placeholder child node.
            */
        function handleExpandEvent(event) {
            var node = event.data.element;
            var clickedAnchor = this;
            var childType = matchingClassFromElement(hasChildTypeRegex, clickedAnchor);

            // Hide the link that was clicked.
            $(clickedAnchor).hide();
            expandChildren(node, childType);
            $(getCollapseLinks(node, childType)).show();
            hideDescendentsOfOtherTypes(node, childType);

            // If we're dealing with a child type, make sure that for the other types
            // only the expand links are showing.
            if (childType) {
                $(getExpandLinks(node)).each(function (i, link) {
                    var childTypeClass = matchingClassFromElement(hasChildTypeRegex, link);
                    if (childTypeClass != childType && hasChildren(node, childTypeClass)) {
                        $(link).show();
                    }
                });
                $(getCollapseLinks(node)).each(function (i, link) {
                    if (matchingClassFromElement(hasChildTypeRegex, link) != childType) {
                        $(link).hide();
                    }
                });
            }

            event.preventDefault();
        };

        // Given a parent node, this will expand (show) all of its child nodes.
        // This only drills down one level in the tree.  It won't open all of the 
        // descendents.
        function expandChildren(parentNode, childType) {
            if (getPlaceholderChildren(parentNode, childType).length > 0) {
                lazyLoadChildren(parentNode, childType);
            }
            $.fn.lazyTreeTable.getChildren(parentNode, opts.childNodeClassPrefix, childType).each(function (i, child) {
                $(child).show();
            });
            zebraStripe();
        };

        // Given a parent node, this finds any children which are currently placeholders and replaces them
        // with data from the server.
        function lazyLoadChildren(parentNode, childType) {
            $('td:first', parentNode).addClass(opts.spinnerClass);

            var indent = Number(parentNode.getAttribute("indent")) + 1;

            $.each(opts.params, function (key, value) {
                var newVale = parentNode.getAttribute("data-" + key);
                if (!!newVale) {
                    opts.params[key] = newVale;
                }
            });

            $.post(opts.childFetchPath, jQuery.extend({ parentID: parentNode.id, indent: indent }, opts.params, fetchExtraParams()), function (r) {
                getPlaceholderChildren(parentNode, childType).remove();
                $(parentNode).after(opts.build(r, parentNode.id, indent));

                // Hide any grandchildren (or lower) nodes from the parent that
                // was just expanded.
                $.fn.lazyTreeTable.getChildren(parentNode, opts.childNodeClassPrefix).each(function (i, newNode) {
                    applyToBranch(newNode, function (node) {
                        $(node).hide();
                    });
                });

                // Initialize the newly injected nodes.
                applyToBranch(parentNode, function (node) {
                    initNodeLinks(node);
                });

                $('td:first', parentNode).removeClass(opts.spinnerClass);
                zebraStripe();
            });
        };

        // If the option "extraParamsFormId" has been set, this generates name-value pairs from 
        // each input and select element in the form. Element names can be blacklisted by setting the
        // extraParamsIgnoreList array in the options.
        function fetchExtraParams() {
            var extraParams = {};
            if (opts.extraParamsFormId != '') {
                $('input,select', '#' + opts.extraParamsFormId).each(function (i, field) {
                    // Add this input field as an extra param, unless the name appears in our blacklist.
                    if (opts.extraParamsIgnoreList.length > 0 && !arrayContains(opts.extraParamsIgnoreList, field.name)) {
                        extraParams[field.name] = field.value;
                    }
                });
            }
            return extraParams;
        };

        /**
        * Hides descendents that are of a type which is different from the type that is passed 
        * in. This is useful when expanding children of a particular type, so that they don't 
        * get mixed in with children of a different type.
        * 
        * @param {Object} node  The parent element whose descendents will be searched.
        * @param {String} ignoredChildType  The name of the child type which should not be hidden.
        */
        function hideDescendentsOfOtherTypes(node, ignoredChildType) {
            var childTypesToBeHidden = [];
            $.fn.lazyTreeTable.getChildren(node, opts.childNodeClassPrefix).each(function (i, child) {
                var thisChildType = matchingClassFromElement(hasChildTypeRegex, child);
                if (thisChildType != '' && thisChildType != ignoredChildType && !arrayContains(childTypesToBeHidden, thisChildType)) {
                    // Not blank, not ignored, and not already found.
                    childTypesToBeHidden.push(thisChildType);
                }
            });

            for (var idx = 0; idx < childTypesToBeHidden.length; idx++) {
                // Hide the children of this type, and all of their descendents.
                $.fn.lazyTreeTable.getChildren(node, opts.childNodeClassPrefix, childTypesToBeHidden[idx]).each(function (i, childNode) {
                    collapseNode(childNode);     // This child ...
                    collapseChildren(childNode); // ... and its descendents too.
                });
            }
        };

        // Someone clicked a "collapse" link.
        // Note that the element being passed into here is the node which contains the link.
        function handleCollapseEvent(event) {
            var node = event.data.element;

            // If the target is an image, then we should look at the surrounding anchor tag, if any,
            // to determine which child type we're dealing with.
            var childType;
            if (event.target.tagName == "IMG" && event.target.parentElement.tagName == "A") {
                childType = matchingClassFromElement(hasChildTypeRegex, event.target.parentElement);
            } else {
                childType = matchingClassFromElement(hasChildTypeRegex, event.target);
            }

            $(getCollapseLinks(node, childType)).hide();
            collapseChildren(node);
            var expandLinks = $(getExpandLinks(node, childType));
            expandLinks.show();
            event.preventDefault();
        };

        // Given a parent node, this will collapse (hide) all of its child nodes including grandchildren, etc.
        // Any expand/collapse links on these descendents will also be reset.
        function collapseChildren(parentNode) {
            applyToBranch(parentNode, function (child) {
                collapseNode(child);
            });
            zebraStripe();
        };

        /**
        * Resets a given node to a "collapsed" state. This means that the row itself is hidden,
        * the expand link is shown, and the collapse link is hidden.
        * @param {Object} node  The element which should be collapsed.
        */
        function collapseNode(node) {
            initNodeLinks(node);
            $(node).hide();
        };

        // Finds the "expand" links in a given node.
        function getExpandLinks(node, childType) {
            var classString = '.' + opts.expandClass;
            if (childType) {
                classString = classString + '.' + childType;
            }
            return $(classString, $(node), $('td:first > a'))
        };

        // Finds the "collapse" links in a given node.
        function getCollapseLinks(node, childType) {
            var classString = '.' + opts.collapseClass;
            if (childType) {
                classString = classString + '.' + childType;
            }
            return $(classString, $(node), $('td:first > a'))
        };

        // Given an array of strings, return a single string with each array element
        // treated as a class name (prefixed with a '.').
        function arrayToClassString(a) {
            if (a != null && a.length > 0) {
                return "." + a.join(",.");
            } else {
                return '';
            }
        };

        // Returns the first class associated with the element which matches the regex.
        // We use this, because some of the classes used are just prefixes, filled in by 
        // more info at runtime. (i.e. "child-of-foo").
        function matchingClassFromElement(regex, element) {
            var result = "";
            if (element != null && element.className != null && element.className != '') {
                var classArray = element.className.split(' ');
                for (var i = 0; i < classArray.length; i++) {
                    if (classArray[i].match(regex)) {
                        result = classArray[i];
                        break;
                    }
                }
            }
            return result;
        };


        /* Does this array contain the string?
            In JavaScript 1.6, it would be faster to use Array#indexOf(), but I'm trying to keep this JS 1.5.
            
            Note: I got the idea for switching this to a while loop from here.
                    http://stackoverflow.com/questions/237104/javascript-array-containsobj/237176#237176
        */
        function arrayContains(a, obj) {
            var i = a.length;
            while (i--) {
                if (a[i] === obj) {
                    return true;
                }
            }
            return false;
        };


        /*
            * If zebra striping is enabled, this will reapply the odd/even classes to all visible nodes.
            */
        function zebraStripe() {
            if (opts.zebraStriping.enabled) {
                allNodes({ only_visible: true }).each(function (i, node) {
                    if (i % 2) {
                        // Odd node
                        // If an even row class is in use, remove it.  Then add the odd class.
                        if (opts.zebraStriping.even_class != "") {
                            $(node).removeClass(opts.zebraStriping.even_class);
                        }
                        if (opts.zebraStriping.odd_class != "") {
                            $(node).addClass(opts.zebraStriping.odd_class)
                        }
                    } else {
                        // Even node
                        // If an odd row class is in use, remove it.  Then add the even class.
                        if (opts.zebraStriping.odd_class != "") {
                            $(node).removeClass(opts.zebraStriping.odd_class);
                        }
                        if (opts.zebraStriping.even_class != "") {
                            $(node).addClass(opts.zebraStriping.even_class)
                        }
                    }
                });
            }
        }
    };

    // lazyTreeTable defaults
    $.fn.lazyTreeTable.defaults = {
        childFetchPath: "#",
        childNodeClassPrefix: "child-of-",
        childPlaceholderNodeClass: "child-placeholder",
        expandClass: "tree_expand",
        collapseClass: "tree_collapse",
        spinnerClass: "tree_spinner",
        childTypePrefix: "child-type-",  // Only needed if you want to have a parent with multiple sets of children.
        parentHtmlType: "tr", // 'tr' or 'tbody'. Complex tables which use rowspan can't really use a tr as a parent. Each node should be grouped into it's own tbody.
        extraParamsFormId: '', // If set to a form ID, the values from the form will be passed along with any remote calls.
        extraParamsIgnoreList: [], // Blacklist for form input NAMES (not IDs) that you want to ignore.
        zebraStriping: { enabled: false, odd_class: '', even_class: '' },
        build: function (d) { return d; }
        //    query: "",
        //    table: "",
        //    name: "T",
        //    nodeID: "",
        //    template: "",
        //    columns: []
    };

    // Returns an array of nodes which are direct descendents of the passed-in node.
    // If a childType is specifed, only child nodes with that class will be considered.
    $.fn.lazyTreeTable.getChildren = function (node, childNodeClassPrefix, childType) {
        // A node without an ID can't, by definition, have any children.
        if (!node.id) {
            return $([]);
        }

        // Don't let 'siblings' confuse you here.  That's in terms of the table, where all of the
        // nodes are siblings. The 'children' we're looking for are other nodes which reference the
        // current node as a parent.
        var selectorString = '.' + childNodeClassPrefix + node.id;
        if (childType) {
            selectorString = selectorString + "." + childType;
        }
        // Finding the node again by ID is a hack to get around what appears to be a bug in 
        // jQuery. Certain nodes would make it here with a null parent element, when the parent
        // elem definitely existed. 
        var children = $('#' + node.id).siblings(selectorString);
        return children;
    };

    // Returns the parent node to the supplied node, or null.
    $.fn.getParent = function (node) {
        var childOfClassName = matchingClassFromElement(childOfRegex, node);
        if (childOfClassName) {
            var parentId = childOfClassName.slice(opts.childNodeClassPrefix.length);
            // The call to .parent() here is the jQuery call that will give us the 
            // tbody (or table) that contains this node. This is being used to scope the
            // find to only this table in case there is a duplicate ID in another table
            // somewhere else on the page.
            var parent = $(node).parent().find('#' + parentId);
            return parent;
        } else {
            return null;
        }
    };

})(jQuery);

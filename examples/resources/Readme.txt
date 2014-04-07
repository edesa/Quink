plugins2.json is an example of a plugin config that allows creation with one plugin and editing with another for the same node. The two plugins are Method Draw (MD) and SVGEditor (SE) which both process SVG.

In this example the MD plugin is configured not to use a container (it has the 'node' configuration) so whatever is returned from the plugin adapter will be inserted into the document. This will be an SVG node. There are no hit targets configured so MD will not be used to edit anything.

The second plugin is again configured so that it doesn't use a container node and it has a hit target of SVG meaning it will be used to edit SVG nodes.

So MD creates an SVG node which is inserted into the document but it isn't configured to edit anything. SE is configured to edit SVG nodes. Create with MD, edit with SE.

SE can also be used to create SVG nodes as well as editing those created by MD.

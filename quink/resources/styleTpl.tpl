{
    "options": [
        <% _.each(styles, function(style, index, styles) { %>
            {
                "label": "<%= style %>",
                "value": "<%= style %>",
                "cssClass": "<%= style %>"
            },
        <% }); %>
        {
            "label": "close",
            "value": "close"
        }
    ]
}

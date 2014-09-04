{
    "options": [
        <% _.each(styles, function(style, index, styles) { %>
            {
                "label": "<%= style %>",
                "value": "<%= style %>"
            },
        <% }); %>
        {
            "label": "cancel",
            "value": "cancel"
        }
    ]
}

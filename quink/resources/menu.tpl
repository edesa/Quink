<div class="qk_popup qk_popup_menu qk_menu qk_hidden">
    <% _.each(options, function (opt) { %>
        <%
            var classes = 'qk_popup_menu_item';
            if (opt.cssClass) {
                classes += ' ' + opt.cssClass;
            }
        %>
        <div class="<%= classes %>" id="<%= opt.value %>"><%= opt.label %></div>
    <% }); %>
</div>

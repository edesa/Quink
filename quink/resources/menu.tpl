<div class="qk_popup qk_popup_menu qk_menu qk_hidden">
    <% _.each(options, function (opt) { %>
        <%
            var classes = 'qk_popup_menu_item_container';
            if (opt.cssClass) {
                classes += ' ' + opt.cssClass;
            }
        %>
        <div class="qk_popup_menu_item" data-value="<%= opt.value %>">
            <div class="<%= classes %>">
                <span class="qk_popup_menu_item_label"><%= opt.label %></span>
                <span class="qk_popup_menu_item_state">&#10004;</span>
            </div>
        </div>
    <% }); %>
</div>

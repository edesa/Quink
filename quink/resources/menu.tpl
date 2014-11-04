<div class="qk_popup qk_popup_menu qk_menu qk_hidden">
    <% _.each(options, function (opt) { %>
        <%
            var labelClasses = 'qk_popup_menu_item_label',
                stateClasses = 'qk_popup_menu_item_state';
            if (opt.cssClass) {
                labelClasses += ' ' + opt.cssClass;
                stateClasses += ' ' + opt.cssClass;
            }
        %>
        <div class="qk_popup_menu_item" data-value="<%= opt.value %>">
            <span class="<%= labelClasses %>"><%= opt.label %></span>
            <span class="<%= stateClasses %>">&#10004;</span>
        </div>
    <% }); %>
</div>

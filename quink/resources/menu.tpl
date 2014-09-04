<div class="qk_popup qk_popup_menu qk_menu qk_hidden">
    <% _.each(options, function (opt) { %>
        <div class="qk_popup_menu_item" id="<%= opt.value %>"><%= opt.label %></div>
    <% }); %>
</div>

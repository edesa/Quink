<div class="qk_toolbar_container qk_hidden">
    <div class="qk_toolbar_top_container qk_clearfix">
        <div class="qk_toolbar_tab_container qk_clearfix">
            <% data.forEach(function(grp) { %>
            <div class="qk_toolbar_item qk_toolbar_tab" data-tab=<%= grp.id %>>
                <button class="qk_toolbar_tab_button" <% if (grp.commandId) { %> data-cmd-id="<%= grp.commandId %>" <% } %>
                                    <% if (grp.commandArgs) { %> data-cmd-args="<%= grp.commandArgs %>" <% } %>
                                    >
                    <span><%= grp.label %></span>
                </button>
            </div>
            <% }); %>
        </div>
        <div class="qk_toolbar_item qk_toolbar_close">
            <button class="qk_toolbar_tab_button" id="qk_button_close">
                <span><b>x</b></span>
            </button>
        </div>
    </div>
    <div class="qk_toolbar_group_container">
        <% data.forEach(function(grp) { %>
        <div class="qk_tab qk_clearfix qk_hidden" id="qk_tab_<%= grp.id %>" >
            <% grp.items.forEach(function (item) { %>
            <button class="qk_button" <% if (item.command) { %> data-cmd="<%= item.command %>"
                                    <% } else if (item.commandId) { %> data-cmd-id="<%= item.commandId %>"
                                    <% } %>
                                    <% if (item.commandArgs) { %> data-cmd-args="<%= item.commandArgs %>" <% } %>
                                    <% if (item.repeat) { %> data-btn-repeat="true" <% } %>
                                    <% if (item.elId) { %> id="<%= item.elId %>" <% } %>
                                    >
                <% if (item.type === 'select') { %>
                <input class="qk_input_checkbox" type="checkbox" id="<%= item.selectId %>" value="<%= item.value %>"/>
                <label class="qk_input_label"><%= item.label %></label>
                <% } else { %>
                <span class="qk_button_bg <% if (item.cssClass) { %> <%= item.cssClass %> <% } %>"></span>
                <% } %>
            </button>
            <% }); %>
        </div>
        <% }); %>
    </div>
    <div class="qk_popup qk_dialog qk_hidden" id="qk_dialog_createlink">
        <button id="qk_button_createlink">Create link</button>
        <button id="qk_button_cancel">Cancel</button>
        <span class="qk_edit_createlink_container">
            <input type="text" id="qk_edit_createlink" autofocus="autofocus">
        </span>
    </div>
</div>

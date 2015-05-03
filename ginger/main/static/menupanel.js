/* Copyright (C) 2010-2013, Josef Hahn and friend

 This file is part of Ginger.

 Ginger is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 Ginger is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with Ginger.  If not, see <http://www.gnu.org/licenses/>. */

function MenuPanel(div, mainpartdiv) {
    this._div = div;
    var self = this;
    this._mainpartdiv = mainpartdiv;

    $(window).resize(function(){
        self._mainpart_resize();
    });

    div.html("&nbsp;&nbsp;<span id='menupanel_custommenu'></span><span id='menupanel_mainmenu'></span>" +
             "<div id='menupanel_rightpart'><span class='lightfont'>logged in as '</span><span id='username'>" +
             "</span><span class='lightfont'>'</span></div>");

    if (viewmode=="mobile")
        $("#menupanel_rightpart").css('visibility','collapse');
    
    var mainmenu = div.find("#menupanel_mainmenu");

    var menuitem;
    menuitem= $('<a href="do_logout" class="menulink">Logout</a>');
    mainmenu.append(menuitem);

    menuitem = $('<a class="menulink">Feeds</a>');
    menuitem.click(function(){
        new FeedAdminDialog().show();
    });
    mainmenu.append(menuitem);

    menuitem = $('<a class="menulink">Settings</a>');
    menuitem.click(function(){
        new SettingsDialog().show();
    });
    mainmenu.append(menuitem);

    menuitem = $('<a class="menulink superusermenulink" href="admin" target="_blank">AdminPanel</a>');
    mainmenu.append(menuitem);

    menuitem = $('<a class="menulink">Help</a>');
    menuitem.click(ShowHelp);
    mainmenu.append(menuitem);
    
    mainmenu.bind("DOMSubtreeModified", function() {
        self._mainpart_resize();
    });

    this._mainpart_resize();
}

MenuPanel.prototype._mainpart_resize = function() {
	this._mainpartdiv.css("top", (this._div.outerHeight()-1)+"px");
}

MenuPanel.prototype.enable_custom_menu = function() {
    this._div.find("#menupanel_mainmenu").css("visibility","collapse");
    this._div.find("#menupanel_custommenu").css("visibility","inherit");
    this._mainpart_resize();
    return this._div.find("#menupanel_custommenu");
}

MenuPanel.prototype.disable_custom_menu = function() {
    this._div.find("#menupanel_mainmenu").css("visibility","inherit");
    this._div.find("#menupanel_custommenu").css("visibility","collapse");
    this._mainpart_resize();
    this._div.find("#menupanel_custommenu").html("");
}

MenuPanel.prototype.setUsername = function(n) {
    this._div.find("#username").html(n);
}


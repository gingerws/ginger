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

function FeedAdminDialog() {
    ModalDialog.call(this);
    var self = this;
    this.keypresshandler = function(e) {
        if (e.which == 27) {
            e.preventDefault();
            self.close();
        }
    }
}

FeedAdminDialog.prototype = Object.create(ModalDialog.prototype);

FeedAdminDialog.prototype.show = function()
{
    ModalDialog.prototype.show.call(this, false, true);
    var self = this;
    this.ndiv.append('<h1>Feed management</h1>');
    this.ndiv.append('<div class="feedadmin_myfeeds"><h4>My Feeds</h4><table id="feedadmin_myfeeds_table">' +
                '<tr class="headrow"><th>Name</th><th>URL</th><th>Update interval</th><th></th></tr>' +
                '</table><br/></div>');
    this.ndiv.append('<div class="feedadmin_nofeeds">You do not have added any feeds so far :(</div>');
    this.ndiv.append('<div class="feedadmin_loading">loading ...</div>');
    this.ndiv.append('<h4>Add new feed</h4>');
    this.ndiv.append("Fill this form for adding a new feed into the list.<br/>Before adding a new feed, you must search for the feed url on the feed's website.");
    var t7 = $('<table class="headrow">');
    var t8 = $('<button>add</button>');
    t8.click(function(e){ e.preventDefault(); self._add_feed(); });
    t7.append('<tr><th>Name:</th><td><input type="text" name="name" /></td></tr>');
    t7.append('<tr><th>Feed URL:</th><td><input type="text" name="url" /></td></tr>');
    t7.append('<tr><th>Update interval:</th><td><select name="interval">' +
                 '<option value="5">5 minutes</option><option value="15">15 minutes</option><option value="30">30 minutes</option>' +
                 '<option value="60">1 hour</option><option value="240">4 hours</option></select></td></tr>');
    this.ndiv.append(t7);
    this.ndiv.append(t8);
    this.ndiv.append("<br/><br/>");
    this._textfields = t7.find("input[type='text']");
    this._fname = this.ndiv.find("input[name='name']");
    this._furl = this.ndiv.find("input[name='url']");
    this._finterval = this.ndiv.find("select");
    var _onenter = function(e){
        if (e.which==10 || e.which==13)
        {
            self._add_feed();
        }
    };
    this._fname.keypress(_onenter);
    this._furl.keypress(_onenter);
    this._finterval.keypress(_onenter);
    var btnback=$("<a class='menulink'>back to main</a>");
    btnback.click(function(e){
        e.preventDefault();
        self.close();
    });
    this.custommenu.append(btnback);
    this._reload_feedadmin_dialog();
}

FeedAdminDialog.prototype._reload_feedadmin_dialog = function(skiploadinganimation)
{
    var self = this;
    if (!skiploadinganimation) {
        self.ndiv.find(".feedadmin_loading").css("visibility","inherit");
        self.ndiv.find(".feedadmin_myfeeds").css("visibility","collapse");
        self.ndiv.find(".feedadmin_nofeeds").css("visibility","collapse");
    }
    retryAjax({
        url: "config/list_feeds",
        dataType: "json",
        type: "get",
        witherrordialog: true,
        success: function(data)
        {
            var myfeeds = $("#feedadmin_myfeeds");
            var myfeeds_table = $("#feedadmin_myfeeds_table");

            myfeeds_table.find("tr").filter(".dynamicrow").remove();
            for (i in data) {
                var feed = data[i];
                var btnremove=$("<button style='padding:0 2pt 0 2pt;'>remove</button>");
                btnremove.click((function(feed){
                    return function(e){
                        e.preventDefault();
                        self._disable_feed(feed.pk);
                }})(feed));
                var thremove=$("<th></th>");
                thremove.append(btnremove);
                var tr=$("<tr class='dynamicrow'></tr>");
                tr.append("<td>"+feed.fields.name+"</td><td>"+feed.fields.url+"</td><td>"+feed.fields.updateInterval+" min</td>");
                tr.append(thremove);
                myfeeds_table.append(tr);
            }
            self.ndiv.find(".feedadmin_loading").css("visibility","collapse");
            if (!data || !data.length) {
                self.ndiv.find(".feedadmin_myfeeds").css("visibility","collapse");
                self.ndiv.find(".feedadmin_nofeeds").css("visibility","inherit");
            } else {
                self.ndiv.find(".feedadmin_myfeeds").css("visibility","inherit");
                self.ndiv.find(".feedadmin_nofeeds").css("visibility","collapse");
            }
        },
        error: function() {
            self.close();
        },
    });
}

FeedAdminDialog.prototype._add_feed = function()
{
    var self = this;
    ajax({
        url: "config/add_feed",
        dataType: "text",
        type: "post",
        data: {name: this._fname.val(), url:this._furl.val(), interval:this._finterval.val()},
        withloadinganimation: true,
        witherrordialog: true,
        success: function(data)
        {
            self._reload_feedadmin_dialog(true);
            cloudpanel.load_tags();
        },
    });
    this._textfields.attr("value","");
}

FeedAdminDialog.prototype._disable_feed = function(id)
{
    var self = this;
    retryAjax({
        url: "config/disable_feed",
        dataType: "text",
        data: { id: id },
        type: "post",
        withloadinganimation: true,
        witherrordialog: true,
        success: function(data)
        {
            self._reload_feedadmin_dialog(true);
        },
    });
}

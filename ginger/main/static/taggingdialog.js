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

function TaggingDialog(title, mytags, onsuccess, forbidnew)
{
    ModalDialog.call(this);
    var self = this;
    this.title = title;
    this.mytags = mytags;
    this.savebtncaption = "Save";
    this.onsuccess = onsuccess;
    this.forbidnew = forbidnew;
    this.keypresshandler = function(e) {
        if (e.which == 27) {
            e.preventDefault();
            self.close();
        }
        else if (e.which == 13 || e.which == 10) {
            e.preventDefault();
            self.close();
            if (self.onsuccess)
                self.onsuccess(self.newmytags);
        }
    }

}

TaggingDialog.prototype = Object.create(ModalDialog.prototype);

TaggingDialog.prototype.show = function() {
    ModalDialog.prototype.show.call(this, true);
    var self = this;
    this.ndiv.append("<div class='modaldialogpart'><h1>"+this.title+"</h1></div");
    this.ndiv.append("<div class='modaldialogpart'>Check/Uncheck tags in the following list.</div");
    this.geometrydetection=$("<div class='modaldialogpart'></div");
    this.ndiv.append(self.geometrydetection);
    this.name2link=[];
    this.tagcloud=$("<div class='modaldialogpart tags' style='display:block;position:absolute;overflow:auto; left:30px;right:30px;'></div");
    this.ndiv.append(this.tagcloud);
    this.loadinglabel=$("<div>loading...</div>");
    this.ndiv.append(this.loadinglabel);
    this.btnpanel=$("<div class='modaldialogpart' style='position:absolute; bottom:0;left:30px;right:30px;'></div");
    var btncancel = $("<button class='importantbutton'>Cancel</button>");
    this.ndiv.append(self.btnpanel);
    btncancel.click(function(e){
        e.preventDefault();
        self.close();
        if (self.onback)
            self.onback();
    });
    this.btnpanel.append(btncancel);
    var btnok = $("<button class='importantbutton'>"+this.savebtncaption+"</button>");
    btnok.click(function(e){
        e.preventDefault();
        self.close();
        if (self.onsuccess)
            self.onsuccess(self.newmytags);
    });
    this.btnpanel.append(btnok);
    if (!this.forbidnew) 
    {
        var panelnewtag = $("<span style='margin-left:60pt;'><input type='text' /><button class='importantbutton'>Add tag</button></span>");
        var newtextfield = panelnewtag.find("input");
        panelnewtag.find("button").click(function(e){
            e.preventDefault();
            var tag = newtextfield.attr("value").trim();
            if (tag.length>0) {
                retryAjax({
                    url: "tags/add",
                    dataType: "text",
                    data: { tag: tag },
                    type: "post",
                    success: function(data)
                    {
                        self.newmytags.push(data);
                        self._loadtags();                    
                    },
                    error: function()
                    {
                        showGenericErrorDialog();                        
                    }
                });
            }
            newtextfield.attr("value", "");
        });
        this.panelnewtag = panelnewtag;
        this.btnpanel.append(panelnewtag);
        newtextfield.focus();
        newtextfield.keydown(function(e) {
            if (e.which==10 || e.which==13)
            {
                var txt = newtextfield.val();
                if (txt=="")
                {
                    self.close();
                    if (self.onsuccess)
                        self.onsuccess(self.newmytags);
                }
                else
                {
                    panelnewtag.find("button").click();
                }
                return false;
            }
        });
    }
    else
        this.panelnewtag = $();
    this.newmytags = [];
    for(var ti in self.mytags)
        this.newmytags.push(self.mytags[ti]);
    this._resize=function(){
        var t = self.geometrydetection.position().top;
        var b = self.btnpanel.height()+20;
        self.tagcloud.css("top", t+"px");
        self.tagcloud.css("bottom", b+"px");
    }
    $(window).resize(function(){
        self._resize();
    });
    this._resize();
    this._loadtags();
}

TaggingDialog.prototype.close = function() {
    ModalDialog.prototype.close.call(this);
    try {
        $(window).unbind("resize", this._resize);
    } catch(e){}
}

TaggingDialog.prototype._loadtags = function() {
    var self = this;
    self.panelnewtag.find("button").attr("disabled", "disabled");
    retryAjax({
        url: "tags/get",
        dataType: "json",
        type: "get",
        success: function(data)
        {
            self.loadinglabel.css("display", "none");
            self.panelnewtag.find("button").removeAttr("disabled");
            self.tagcloud.html("");
            var alltagsizelist = _tagcountlist_to_tagsizelist(data);
            for(var ti in alltagsizelist)
            {
                var tag=alltagsizelist[ti];
                var name=tag[0];
                var size=tag[1];
                self._addtaglink(name, size, self.newmytags.indexOf(name)>-1);
            }
        },
        error: function()
        {
            showGenericErrorDialog();                        
            self.close();
        }
    });
}

TaggingDialog.prototype._addtaglink = function(name, size, activated) {
    var lnk=$("<a style='display:block; float:left; margin:3pt; font-size:"+size+"pt;'>"+name+"</a>");
    var self=this;
    lnk.click((function(lnk, name){
        return function(e) {
            e.preventDefault();
            if (self.newmytags.indexOf(name)>-1) {
                self.newmytags.splice(self.newmytags.indexOf(name),1);
                lnk.removeClass('activated');
            } else {
                self.newmytags.push(name);
                lnk.addClass('activated');
            }
        };
    })(lnk, name));
    if(activated)
        lnk.addClass("activated");
    this.tagcloud.append(lnk);
    this.name2link[name]=lnk;
}

function showTaggingDialog(newsMessage, newsId, onsuccess)
{
    retryAjax({
        url: "newsmessages/list?lasttimestamp=&filter=" + encodeURIComponent(new IdFilter(newsId).tofilterstring()),
        dataType: "json",
        type: "get",
        withloadinganimation: true,
        witherrordialog: true,
        success: function(data)
        {
            var jtags = JSON.parse(data.tags);
            var tags = new Object();
            for (var ijtag in jtags)
            {
                var jtag = jtags[ijtag];
                tags[jtag.pk] = jtag.fields.name;
            }
            var mytags = [];
            var nnm = JSON.parse(data.elements)[0].fields;
            for (var iitag in nnm.tags)
            {
                var itag = nnm.tags[iitag];
                var tag = tags[itag];
                mytags.push(tag);
            }
            var dlg = new TaggingDialog("Tags for '"+nnm.title+"'", mytags, function(newmytags) {
                var tagdata = new Object();
                for (var i in newmytags)
                    tagdata["tag"+i]=newmytags[i];
                tagdata.id = newsId;
                retryAjax({
                    url: "newsmessages/set_tags",
                    dataType: "json",
                    type: "post",
                    data: tagdata,
                    withloadinganimation: true,
                    witherrordialog: true,
                    success: function(data)
                    {
                        cloudpanel.load_tags();
                        if (onsuccess)
                            onsuccess(data);
                    },
                    error: function()
                    {
                        cloudpanel.load_tags();
                    },
                });
            });
            dlg.show();
        },
    });

}

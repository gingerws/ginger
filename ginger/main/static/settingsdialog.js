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

function SettingsDialog() {
    ModalDialog.call(this);
    var self = this;
    this.keypresshandler = function(e) {
        if (e.which == 27) {
            e.preventDefault();
            self.close();
        }
    }
}

SettingsDialog.prototype = Object.create(ModalDialog.prototype);

SettingsDialog.prototype.show = function()
{
    ModalDialog.prototype.show.call(this, false, true);
    var self = this;
    this.ndiv.append('<h1>Settings</h1>');
    this.ndiv.append("<br/><br/>");
    
    var expBasic = new Expander("Basic Settings", true);
    var expTagProp = new Expander("Tag Propagation", false);
    var expScript = new Expander("Scripting", false);
    
    this.ndiv.append(expBasic.domelement);
    this.ndiv.append("<br/>");
    this.ndiv.append(expTagProp.domelement);
    this.ndiv.append("<br/>");
    this.ndiv.append(expScript.domelement);
    
    expBasic.innerdomelement.append("<br/>Change some basic settings here. They apply always when you login.<br/><div></div>");
    expTagProp.innerdomelement.append("<br/>Define tag propagation rules here, which automatically tag each message " +
                                "with a certain tag, whenever they get tagged with a certain other tag. " +
                                "Example: All messages with tag 'gorgonzola' should become tagged with 'bioweapons'. " +
                                "Tag propagation is an advanced feature.<br/><div></div>");
    expScript.innerdomelement.append("<br/>Write Python code here which post-processes all incoming messages. This is a very advanced " +
                                "feature, which you will not get right without reading the manual.<br/><div></div>");
    
    this._basicsettings = expBasic.innerdomelement.find("div");
    this._tagprop = expTagProp.innerdomelement.find("div");
    this._script = expScript.innerdomelement.find("div");
    
    this._basicsettings.append("<div class='settings_loading'>loading . . .</div><div class='settings_notloading'></div>");
    this._tagprop.append("<div class='settings_loading'>loading . . .</div><div class='settings_notloading'></div>");
    this._script.append("<div class='settings_loading'>loading . . .</div><div class='settings_notloading'></div>");
    var btnback=$("<a class='menulink'>back to main</a>");
    btnback.click(function(e){
        e.preventDefault();
        self.close();
    });
    this.custommenu.append(btnback);
    this._reload_basicsettings();
    this._reload_tagprop();
    this._reload_script();
}

SettingsDialog.prototype._reload_basicsettings = function(skiploadinganimation)
{
    var self = this;
    var _setSetting = function(k,v,onsuccess) {
        retryAjax({
            url: "config/setvalue?key="+k,
            dataType: "json",
            type: "post",
            data: { value: v },
            withloadinganimation: true,
            witherrordialog: true,
            success: function(data)
            {
                self._reload_basicsettings();
                if (onsuccess)
                    onsuccess();
            }
        });
    };
    self._basicsettings.find(".settings_loading").css("visibility","collapse");
    self._basicsettings.find(".settings_notloading").css("visibility","inherit");
    var mydiv = self._basicsettings.find(".settings_notloading");
    mydiv.html("");
    var lst = $("<ul></ul>");
    mydiv.append(lst);
    if (getListDirection()==-1)
    {
        var elemListOrder = $("<li>The message list is sorted from new to old. <button>toggle</button></li>");
        lst.append(elemListOrder);
        elemListOrder.find("button").click(function(){
            setListDirection(1);
            _setSetting("reverseSortOrder", "0");
        });
    }
    else
    {
        var elemListOrder = $("<li>The message list is sorted from old to new. <button>toggle</button></li>");
        lst.append(elemListOrder);
        elemListOrder.find("button").click(function(){
            setListDirection(-1);
            _setSetting("reverseSortOrder", "1");
        });
    }
    var elemStoreFilters=$("<li>You can store your current filters as right-after-login default. "+
                           "<button>store my filters as default</button></li>");
    lst.append(elemStoreFilters);
    elemStoreFilters.find("button").click(function(){
        retryAjax({
            url: "filter/storedefault",
            dataType: "json",
            type: "post",
            data: { "filterstring": filterpanel.messagefilters.tofilterstring() },
            witherrordialog: true,
            success: function(data)
            {
                var dlg = new ModalQuestionDialog("filters stored","Your current filters are now stored as default.");
                dlg.btnproceed = false;
                dlg.show();
            },
        });
    });
    var elemRemoveTags=$("<li>You can remove tags, which you don't want to use anymore. "+
                           "<button>remove tags</button></li>");
    lst.append(elemRemoveTags);
    elemRemoveTags.find("button").click(function(){
        var dlg = new TaggingDialog("Please choose tags which you want delete now.", [], function(rmtags) {
            if (rmtags.length>0) 
            {
                retryAjax({
                    url: "tags/remove",
                    dataType: "json",
                    type: "post",
                    data: { tags: rmtags },
                    witherrordialog: true,
                    withloadinganimation: true,
                    success: function(data)
                    {
                        cloudpanel.load_tags();
                        self._reload_tagprop(true); // they can indirectly be condensed now
                    },
                    error: function() 
                    {
                        cloudpanel.load_tags();
                        self._reload_tagprop(true); // they can indirectly be condensed now
                    },
                });
            }
        });
        dlg.savebtncaption = "Remove";
        dlg.forbidnew = true;
        dlg.show();
    });
    var elemRemoveFilters=$("<li>You can remove stored filters. "+
                           "<button>remove stored filters</button></li>");
    lst.append(elemRemoveFilters);
    elemRemoveFilters.find("button").click(function(){
        retryAjax({
            url: "filter/list",
            dataType: "json",
            type: "get",
            withloadinganimation: true,
            witherrordialog: true,
            success: function(data)
            {
                var filters = [];
                for (var fii in data.filter)
                    filters.push(data.filter[fii][0]);
                if (filters.length > 0) {
                    var dlg = new ModalQuestionDialog("remove filters","Please choose the filter list you want to remove.");
                    dlg.list = filters;
                    dlg.btnproceed = false;
                    dlg.onsuccess = function(filtername){
                        retryAjax({
                            url: "filter/remove",
                            dataType: "json",
                            type: "post",
                            data: { name: filtername },
                            withloadinganimation: true,
                            witherrordialog: true,
                        });
                    };
                    dlg.show();
                } else {
                    var dlg = new ModalQuestionDialog("remove filters","You don't have stored any filter lists so far.");
                    dlg.btnproceed = false;
                    dlg.show();
                }
            },
        });
    });
    var elemTogglePowerMode=$(powermode ?
        "<li>Currently Ginger offers all features. <button>switch to simple mode</button></li>" :
        "<li>Currently Ginger offers only the basic features. <button>switch to power mode</button></li>"
    );
    lst.append(elemTogglePowerMode);
    elemTogglePowerMode.find("button").click(function(){
        retryAjax({
            url: "config/setvalue?key=powermode",
            dataType: "json",
            type: "post",
            data: { value: powermode?"0":"1" },
            withloadinganimation: true,
            witherrordialog: true,
            success: function(data)
            {
                location.reload();
            },
        });
    });
}

SettingsDialog.prototype._reload_tagprop = function(skiploadinganimation)
{
    var phrase11 = "The tag #1 also implies #2.";
    var phrase1n = "The tag #1 also implies #2.";
    var phrasen1 = "The tags #1 also imply #2.";
    var phrasenn = "The tags #1 also imply #2.";
    var self = this;
    if (!skiploadinganimation) {
        self._tagprop.find(".settings_loading").css("visibility","inherit");
        self._tagprop.find(".settings_notloading").css("visibility","collapse");
    }
    retryAjax({
        url: "tagpropagationrules/get",
        dataType: "json",
        type: "get",
        success: function(data)
        {
            self._tagprop.find(".settings_loading").css("visibility","collapse");
            self._tagprop.find(".settings_notloading").css("visibility","inherit");
            var mydiv = self._tagprop.find(".settings_notloading");
            if (data.length>0)
                mydiv.html("Those rules are defined:<br/>");
            else
                mydiv.html("You have no tag propagation rules defined so far.");
            var mylist = $("<ul></ul>");
            mydiv.append(mylist);
            for(var irule in data)
            {
                var rule = data[irule];
                var myphrase;
                var iftags = rule[1];
                var applyalsotags = rule[2];
                if (iftags.length==1 && applyalsotags.length==1)
                    myphrase = phrase11;
                else if (iftags.length!=1 && applyalsotags.length==1)
                    myphrase = phrasen1;
                else if (iftags.length==1 && applyalsotags.length!=1)
                    myphrase = phrase1n;
                else
                    myphrase = phrasenn;
                if (iftags.length!=1)
                {
                    var n = "'" + iftags.splice(0,iftags.length-1).join("', '") + "' and '" + iftags[iftags.length-1] + "'";
                    myphrase = myphrase.replace("#1", n);
                }
                else
                    myphrase = myphrase.replace("#1","'"+iftags[0]+"'");
                if (applyalsotags.length!=1)
                {
                    var n = "'" + applyalsotags.splice(0,applyalsotags.length-1).join("', '") + "' and '" + applyalsotags[applyalsotags.length-1] + "'";
                    myphrase = myphrase.replace("#2", n);
                }
                else
                    myphrase = myphrase.replace("#2","'"+applyalsotags[0]+"'");                    
                mylist.append("<li>"+myphrase+" <button>remove</button></li>");
                mylist.find("button").last().click((function(id){
                    return function(){
                        retryAjax({
                            url: "tagpropagationrules/remove",
                            dataType: "json",
                            data: "id="+id,
                            type: "post",
                            withloadinganimation: true,
                            witherrordialog: true,
                            success: function(data)
                            {
                                self._reload_tagprop(true);
                            },
                            error: function() {
                                self._reload_tagprop(true);
                            },
                        });
                    };
                })(rule[0]));
            }
            var addbtn = $("<button>add a new rule</button>");
            mydiv.append(addbtn);
            addbtn.click(function(){
                var dlg = new TaggingDialog("Please choose, which tags should be the condition part of the new rule.", [], function(newiftags) {
                    if (newiftags.length>0) 
                    {
                        var dlg2 = new TaggingDialog("Please choose, which tags should be implied/propagated by the new rule.", [], function(newapplyalsotags) {
                            if (newapplyalsotags.length>0) 
                            {
                                ajax({
                                    url: "tagpropagationrules/add",
                                    dataType: "json",
                                    type: "post",
                                    data: { iftags: newiftags, applyalsotags: newapplyalsotags },
                                    withloadinganimation: true,
                                    witherrordialog: true,
                                    success: function(data)
                                    {
                                        self._reload_tagprop(true);
                                    },
                                    error: function()
                                    {
                                        self._reload_tagprop(true);
                                    }
                                });
                            }
                        });
                        dlg2.show();
                    }
                });
                dlg.savebtncaption = "Next";
                dlg.show();
            });
        },
        error: function() {
            self.close();
            showGenericErrorDialog();
        },
    });
}

SettingsDialog.prototype._reload_script = function(skiploadinganimation)
{
    var self = this;
    self._script.find(".settings_loading").css("visibility","collapse");
    self._script.find(".settings_notloading").css("visibility","inherit");
    var mydiv = self._script.find(".settings_notloading");
    var areaonnewmessage = $("<textarea disabled='disabled' class='scriptingarea'></textarea>");
    var areaontagset = $("<textarea disabled='disabled' class='scriptingarea'></textarea>");
    var btnstoreonnewmessage = $("<button disabled='disabled'>store</button>");
    var btnstoreontagset = $("<button disabled='disabled'>store</button>");
    mydiv.append("This event occurs whenever a new message arrives:<br/>");
    mydiv.append(areaonnewmessage);
    mydiv.append("<br/>");
    mydiv.append(btnstoreonnewmessage);
    mydiv.append("<br/><br/>");
    mydiv.append("This event occurs whenever a tag is set on a message:<br/>");
    mydiv.append(areaontagset);
    mydiv.append("<br/>");
    mydiv.append(btnstoreontagset);
    retryAjax({
        url: "config/getvalue?key=onnewmessage",
        dataType: "json",
        type: "get",
        success: function(data)
        {
            if (!data.value)
                data = {value:_onnewmessage_default};
            areaonnewmessage.removeAttr('disabled');
            btnstoreonnewmessage.removeAttr('disabled');
            areaonnewmessage.text(data.value);
        },
        error: function() {
            self.close();
            showGenericErrorDialog();
        },
    });
    retryAjax({
        url: "config/getvalue?key=ontagset",
        dataType: "json",
        type: "get",
        success: function(data)
        {
            if (!data.value)
                data = {value:_ontagset_default};
            areaontagset.removeAttr('disabled');
            btnstoreontagset.removeAttr('disabled');
            areaontagset.text(data.value);
        },
        error: function() {
            self.close();
            showGenericErrorDialog();
        },
    });
    btnstoreonnewmessage.click(function(){
        retryAjax({
            url: "config/setvalue?key=onnewmessage",
            dataType: "json",
            type: "post",
            data: { value: areaonnewmessage.val() },
            withloadinganimation: true,
            witherrordialog: true,
            success: function(data)
            {
                var dlg = new ModalQuestionDialog("script stored","Your script is now active.");
                dlg.btnproceed = false;
                dlg.show();
            },
        });
    });
    btnstoreontagset.click(function(){
        retryAjax({
            url: "config/setvalue?key=ontagset",
            dataType: "json",
            type: "post",
            data: { value: areaontagset.val() },
            withloadinganimation: true,
            witherrordialog: true,
            success: function(data)
            {
                var dlg = new ModalQuestionDialog("script stored","Your script is now active.");
                dlg.btnproceed = false;
                dlg.show();
            },
        });
    });
}

var _onnewmessage_default = "def onnewmessage(message):\n"+
                            "    #summary = message.getsummary().lower()\n"+
                            "    #if 'space' in summary:\n"+
                            "    #    message.addtag('deepspace')\n"+
                            "    #if 'enterprise' in summary:\n"+
                            "    #    message.addtag('deepspace')\n"+
                            "    #    message.addtag('enterprise')\n"+
                            "    #if 'pizza' in summary:\n"+
                            "    #    message.addtag('archive')\n"+
                            "    pass\n";

var _ontagset_default =     "def ontagset(message,tag):\n"+
                            "    #if tag=='deepspace':\n"+
                            "    #    message.addtag('favorite')\n"+
                            "    #if tag=='archive':\n"+
                            "    #    if 'tuna' in message.getsummary().lower():\n"+
                            "    #        message.delete()\n"+
                            "    #    else:\n"+
                            "    #        store_somehow_to_pdf(message.geturl())\n"+
                            "    pass\n";

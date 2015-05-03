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

function FilterPanel(div) {
    var self = this;
    this._div = div;
    this._currentview = $(div).find(".currentview");
    this.messagefilters = new Filter();
    if (viewmode=="mobile")
    {
        $(div).addClass("hover");
    }
    else
    {
        $(div).hover(function(){
            $(div).addClass("hover");
        }, function(){
            $(div).removeClass("hover");
        });
    }
    if (powermode)
    {
        var btnorlayer=$('<button>add or-layer</button>');
        btnorlayer.click(function(e){
            e.preventDefault();
            if (filterpanel.messagefilters.tofilterstring()!="")
            {
                if (filterpanel.messagefilters.childs[filterpanel.messagefilters.childs.length-1].childs.length>0)
                {
                    filterpanel.messagefilters.childs.push(new AndFilter([]));
                    filterpanel.set_filter(filterpanel.messagefilters);
                }
            }
        });
        div.find(".globalactions").append(btnorlayer);
    }
    var btnstore=$('<button>store filters</button>');
    btnstore.click(function(e){
        e.preventDefault();
        var dlg = new ModalQuestionDialog("store filters","If you proceed, your current list of filters will be stored. Please enter a name, so you can find it later on.\n\nIf you enter an existing name, the old one will be overwritten.");
        dlg.withfield = true;
        dlg.onsuccess = function(filtername){
            self.store_filter(self.messagefilters, filtername);
        };
        dlg.show();
    });
    div.find(".globalactions").append(btnstore);
    var btnload=$('<button>load filters</button>');
    btnload.click(function(e){
        e.preventDefault();
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
                    var dlg = new ModalQuestionDialog("load filters","Please choose the filter list you want to load.");
                    dlg.list = filters;
                    dlg.btnproceed = false;
                    dlg.onsuccess = function(filtername){
                        var filterq;
                        for (var fii in data.filter)
                            if(data.filter[fii][0]==filtername) {
                                filterq = data.filter[fii][1];
                                break;
                            }
                        self.set_filter(_getFilterForJsonData(JSON.parse(filterq)));
                    };
                    dlg.show();
                } else {
                    var dlg = new ModalQuestionDialog("load filters","You don't have stored any filter lists so far.");
                    dlg.btnproceed = false;
                    dlg.show();
                }
            },
        });
    });
    div.find(".globalactions").append(btnload);
    var btnclear=$('<button>clear filter</button>');
    btnclear.click(function(e){
        e.preventDefault();
        self.set_filter();
    });
    div.find(".globalactions").append(btnclear);
    this._update_current_view_text();
}

FilterPanel.prototype.remove_filter = function(i) {
    this.messagefilters.childs.splice(i, 1);
    if (this.messagefilters.childs.length==0)
        this.messagefilters = new Filter();
    this.set_filter(this.messagefilters);
}

FilterPanel.prototype.add_filter = function(filter) {
    if (this.messagefilters.tofilterstring())
    {
        var f = this.messagefilters.childs[this.messagefilters.childs.length-1];
        f.childs.push(filter);
    }
    else
    {
        this.messagefilters = new OrFilter([new AndFilter([filter])]);
    }
    this.set_filter(this.messagefilters);
}

FilterPanel.prototype._disablewelcometext = function() {
    this._nowelcometext = true;
    messagepanel.setContent(_noSearchResultsText);    
}

FilterPanel.prototype._update_current_view_text = function() {
    this._currentview.html("");
    this._currentview.append(this.messagefilters.toviewhtml());
    if (this.messagefilters.length > 0) {
        messagepanel.setContent(_noSearchResultsText);
        this._nowelcometext = true;
    } else {
        if (!this._nowelcometext)
            messagepanel.setContent(_welcomeToGingerText);
        else
            messagepanel.setContent(_noSearchResultsText);
    }
}

FilterPanel.prototype.set_filter = function(filter)
{
    if (!filter)
        filter = new Filter();
    var arti = filter;
    if (arti.tofilterstring()!=""){
        if (filter instanceof OrFilter)
        {
            var artlst = [];
            for(var i=0; i<filter.childs.length; i++)
            {
                var c = filter.childs[i];
                if (c instanceof AndFilter)
                    artlst.push(c);
                else
                    artlst.push(new AndFilter(c));
            }
            arti = new OrFilter(artlst);
        }
        else
        {
            arti = filter;
            if (!(arti instanceof AndFilter))
            {
                arti = new AndFilter([arti]);
            }
            arti = new OrFilter([arti]);
        }
    }
    this.messagefilters = arti;
    this._update_current_view_text();
    messagelist.refresh();
}

FilterPanel.prototype.store_filter = function(filter, filtername)
{
    retryAjax({
        url: "filter/store",
        dataType: "json",
        data: { "name": filtername, "v": filter.tofilterstring() },
        type: "post",
        withloadinganimation: true,
        witherrordialog: true,
    });
}

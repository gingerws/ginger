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

function CloudPanel(div) {
    var self=this;
    var h11 = $('<h1>Add filter criteria</h1>');
    this._tags = $('<div class="taglink tags" style="display: block; overflow: auto; height:0;">loading...</div>');
    var h12 = $('<div class="currentfilterpanel"><h1>Currently filtering by</h1>' +
             '<div class="globalactions"></div><div class="currentview"></div></div>');
    this._div = div;
    this._div.html("");
    this._div.append(h11);
    this._div.append(this._tags);
    this._div.append(h12);
    this.filterpanel = new FilterPanel(this._div.find(".currentfilterpanel"));
    this._resize_cloud=function(){
        var h = self._div.height()-h11.height()-h12.height()-20;
        self._tags.css("height",h+"px");
    }

    $(window).resize(function(){
        self._resize_cloud();
    });
    $(this.filterpanel._div).bind("DOMSubtreeModified", function() {
        self._resize_cloud();
    });
    self._resize_cloud();
    
    var _get_tags_regularly = undefined;
    _get_tags_regularly = function()
    {
        self.load_tags(function(){
            setTimeout(_get_tags_regularly ,30*1000);
        },
        function() {
            setTimeout(_get_tags_regularly ,30*1000);            
        });
    };
    _get_tags_regularly();

}

function _tagcountlist_to_tagsizelist(l) {
    var min=Number.MAX_VALUE;
    var max=-1;
    var avg=0;
    for (i in l) {
        var tag = l[i];
        var name = tag[0];
        var count = tag[1];
        if (count > max)
            max = count;
        if (count < min)
            min = count;
        avg += count;
    }
    // fontsize = m * count + 12        m=(fontsize-12)/count       m=(30)/count
    var m=30.0/(max-min);
    var r = [];
    for (i in l) {
        var tag = l[i];
        var name = tag[0];
        var count = tag[1];
        var size = 12+(count-min)*m;
        r.push([name,size]);
    }
    return r;
}

CloudPanel.prototype.load_tags = function(onsuccess,onerror) {
    var self = this;
    retryAjax({
        url: "tags/get",
        dataType: "json",
        type: "get",
        success: function(data)
        {
            self._tags.html("");
            var tagsizelist = _tagcountlist_to_tagsizelist(data);
            for (i in tagsizelist) {
                var tag = tagsizelist[i];
                var name = tag[0];
                var fontsize = tag[1];
                var lnk = $("<a style='font-size:"+fontsize+"pt;'>"+name+"</a>");
                lnk.click((function(name) {
                        return function(e){
                            e.preventDefault();
                            filterpanel.add_filter(new TagFilter(name));
                        };
                    }(name)));
                self._tags.append(lnk);
                self._tags.append(" ");
            }
            if (onsuccess)
                onsuccess();
        },
        error: function()
        {
            if (onerror)
                onerror();
        }
    });
}

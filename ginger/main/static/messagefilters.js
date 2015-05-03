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


function Filter()
{

}

Filter.prototype.tofilterstring = function() { return ""; };

Filter.prototype.toviewhtml = function() { return $("<div>nothing</div>"); };

function IdFilter(id)
{
    Filter.call(this);
    this.id = id;
}

IdFilter.prototype = Object.create(Filter.prototype);

IdFilter.prototype.tofilterstring = function() { return "t=id&v=" + this.id; };

IdFilter.prototype.toviewhtml = function() {
    return $("<span class='selectedtag'>id:"+this.id+"</span>");
};

function TagFilter(tag)
{
    Filter.call(this);
    this.tag = tag;
}

TagFilter.prototype = Object.create(Filter.prototype);

TagFilter.prototype.tofilterstring = function() { return "t=tag&v=" + encodeURIComponent(this.tag); };

TagFilter.prototype.toviewhtml = function() {
    return $("<span class='selectedtag'>"+this.tag+"</span>");
};

function CombinationFilter(childs)
{
    Filter.call(this);
    this.childs = childs;
}

CombinationFilter.prototype = Object.create(Filter.prototype);

CombinationFilter.prototype.tofilterstring = function() {
    var res = "t=" + this.t + "&v=";
    for(var i = 0; i < this.childs.length; i++){
        if (i > 0)
            res += encodeURIComponent("&");
        res += encodeURIComponent( i + "=" + encodeURIComponent(this.childs[i].tofilterstring()) );
    }
    return res;
};

function AndFilter(childs)
{
    CombinationFilter.call(this, childs);
    this.t = "and";
}

AndFilter.prototype = Object.create(CombinationFilter.prototype);

AndFilter.prototype.toviewhtml = function() {
    var res=$("<div></div>");
    for(var i=0; i<this.childs.length; i++)
    {
        res.append(this.childs[i].toviewhtml());
    }
    res.append($("<button>remove</button>"));
    return res;
};

function OrFilter(childs)
{
    CombinationFilter.call(this, childs);
    this.t = "or";
}

OrFilter.prototype = Object.create(CombinationFilter.prototype);

OrFilter.prototype.toviewhtml = function() {
    var res=$("<div></div>");
    function _rem(i)
    {
        return function() {
            filterpanel.remove_filter(i);
        };
    }
    for(var i=0; i<this.childs.length; i++)
    {
        var vv = this.childs[i].toviewhtml();
        res.append(vv);
        var removelink = vv.find("button");
        removelink.click(_rem(i));
    }
    return res;
};

function _getFilterForJsonData(d)
{
    if (d[0]=="Filter")
    {
        return new Filter();
    }
    else if (d[0]=="IdFilter")
    {
        return new IdFilter(d[1]);
    }
    else if (d[0]=="TagFilter")
    {
        return new TagFilter(d[1]);
    }
    else if (d[0]=="AndFilter")
    {
        var c = new Array();
        for(var i=1; i<d.length; i++)
            c.push(_getFilterForJsonData(d[i]));
        return new AndFilter(c);
    }
    else if (d[0]=="OrFilter")
    {
        var c = new Array();
        for(var i=1; i<d.length; i++)
            c.push(_getFilterForJsonData(d[i]));
        return new OrFilter(c);
    }
    else
        throw "unknown filter type " + d[0];
}

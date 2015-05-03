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

function Expander(caption, isopen)
{
    var self=this;
    this.domelement = $("<div class='expander'><a class='expander' href='#'>"
                    + "<span class='symb' style='padding-right:10px; width:2em;'></span>"
                    + "<span class='lbl'></span></a><br/><div></div></div>");
    this.innerdomelement = this.domelement.find("div");
    this.domelement.find("a").find(".lbl").text(caption);
    this.symb = this.domelement.find("a").find(".symb");
    if (isopen)
        this.open();
    else
        this.close();
    this.domelement.find("a").click(function(){
        if (!self.isopen)
            self.open();
        else
            self.close();
        return false;
    });
}

Expander.prototype.open = function()
{
    this.symb.html("&#x25FF;");
    this.domelement.find("a").css("color","inherit");
    this.innerdomelement.css('display', 'block');
    this.isopen=true;
}

Expander.prototype.close = function()
{
    this.symb.html("&#x25F8;");
    this.domelement.find("a").css("color","#007");
    this.innerdomelement.css('display', 'none');
    this.isopen=false;
}

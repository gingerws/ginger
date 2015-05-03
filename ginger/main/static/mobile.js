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

var mobile_incloudpanel = false;
var mobile_inmessagelist = false;

function initializeMobileIfMobile () 
{
    
    if (viewmode == "mobile")
    {
        $("#messagepart").css("left","0");
        $("#cloudpanel").css("right","0");

        var atoggle = $("<a href='#' class='menulink' id='menupanel_mobilenodeswitcher'></a>");
        atoggle.click(function(){
            if (mobile_inmessagelist) 
            {
                mobile_onlycloudpanel();
                cloudpanel._resize_cloud();
            }
            else
                mobile_onlymessagelist();
            return false;
        });
        $("#menupanel_mainmenu").append(atoggle);
        mobile_onlymessagelist();
        
    }

}

function mobile_onlymessagelist()
{
    $("#messagepart").css("z-index","200");            
    $("#cloudpanel").css("z-index","100");
    mobile_inmessagelist = true;
    mobile_incloudpanel = false;
    $("#menupanel_mobilenodeswitcher").html("Filter");
}

function mobile_onlycloudpanel()
{
    $("#messagepart").css("z-index","100");            
    $("#cloudpanel").css("z-index","200");
    mobile_inmessagelist = false;
    mobile_incloudpanel = true;
    $("#menupanel_mobilenodeswitcher").html("Messages");
}


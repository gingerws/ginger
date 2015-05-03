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

function getViewmode()
{
    return viewmode;
}

function getListDirection()
{
    return listdirection;
}

function setListDirection(v, _norefresh)
{
    listdirection = (v<0) ? -1: 1;
    var reverse = listdirection < 0;
    if (messagelist.reverselist != reverse)
    {
        messagelist.reverselist = reverse;
        if (!_norefresh)
            messagelist.refresh();
    }
}

function getUsername()
{
    return username;
}

function setUsername(v)
{
    username = v;
    menupanel.setUsername(username);    
}

function initializeSettings()
{
    setListDirection(listdirection, true);
    setUsername(username);
    if (defaultfilter)
        filterpanel.set_filter(_getFilterForJsonData(defaultfilter));
    else
        filterpanel.set_filter();
}

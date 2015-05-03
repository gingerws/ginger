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

var messagelist;
var menupanel;
var filterpanel;
var cloudpanel;
var messagepanel;
var ishortcutsenabled = 0;

var _noSearchResultsText;
var _welcomeToGingerText;

$(document).ready(function () {
    _noSearchResultsText="<div style='position:absolute;top:30%;left:20pt;right:20pt;text-align:center;'>There are no results for this filter. You should relax the filtering rules.</div>";
    _welcomeToGingerText="<div style='padding:20pt;'><h1>Welcome to Ginger!</h1>Your list is empty. Add some sources for getting more content here. Go to 'Feeds' in the menu bar on the top.</div>";
	menupanel = new MenuPanel($("#menupanel"), $("#mainpart"));
    messagepanel = new MessagePanel($("#messagepanel"));
    messagepanel.setVisible(false);
	cloudpanel = new CloudPanel($("#cloudpanel"));
    filterpanel = cloudpanel.filterpanel;
    messagelist = new MessageList($("#messagelist"));
    initializeMobileIfMobile();
    initializeSettings();
	messagelist.focus();
});

function open_message(url)
{
    window.open(url,"_blank");
}

function ajax(p)
{
    var cp = new Object();
    var loadinganimation;
    if (p.withloadinganimation)
    {
        loadinganimation = new LoadingAnimation();
        loadinganimation.makeVisible();
    }
    for (var i in p)
        cp[i] = p[i];
    cp.url = subsite + cp.url;
    cp.success = function(data) {
        if (loadinganimation)
            loadinganimation.close();
        if (p.success)
            p.success(data);
    };
    cp.error = function() {
        if (loadinganimation)
            loadinganimation.close();
        if (p.witherrordialog)
            showGenericErrorDialog();
        if (p.error)
            p.error();
    }
    $.ajax(cp);
}

function retryAjax(p, tries, _sofar, _loadinganimation)
{
    var sofar = (_sofar===undefined)?0:_sofar;
    var _tries = (tries===undefined)?5:tries;
    var cp = new Object();
    for (var i in p)
        cp[i] = p[i];
    cp.witherrordialog=false;
    cp.withloadinganimation=false;
    var rsuccess=function(data)
    {
        if (_loadinganimation)
            _loadinganimation.close();
        if (p.success)
            p.success(data);
    };
    var rerror=function()
    {
        if (_loadinganimation)
            _loadinganimation.close();
        if (p.witherrordialog)
            showGenericErrorDialog();
        if (p.error)
            p.error();
    };
    if (p.withloadinganimation && !_loadinganimation) {
        _loadinganimation = new LoadingAnimation();
        _loadinganimation.makeVisible();
    }
    if (_tries) {
        cp.error = function(){
            setTimeout(function(){
                retryAjax(p, _tries-1, sofar+1, _loadinganimation);
            }, (sofar+1)*300);
        };
        cp.success = function(data){
            try
            {
                rsuccess(data);
            } 
            catch(e)
            {
                if (e=="REDOAJAX")
                    setTimeout(function(){
                        retryAjax(p, _tries-1, sofar+1, _loadinganimation);
                    }, (sofar+1)*300);
                else
                    throw e;
            }
        }
    }
    else
    {
        cp.success = rsuccess;
        cp.error = rerror;
    }
    ajax(cp);
}

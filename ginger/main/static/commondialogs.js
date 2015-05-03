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

function ModalDialog()
{
    
}

ModalDialog.prototype.show = function(fullscreen, custommenu) {
    this.ndiv = $("<div class='modaldialog' style='z-index:"+_modal_zindex+";'></div>");
    _modal_zindex++;
    $(document.activeElement).blur();    
    if (this.keypresshandler) 
    {
        $(window).keydown(this.keypresshandler);
    }
    if (fullscreen)
        $(document.body).append(this.ndiv);
    else
        $("#mainpart").append(this.ndiv);
    if (custommenu)
    {
        this.custommenu = menupanel.enable_custom_menu();
        this.custommenu.html("");        
    }
    ishortcutsenabled--;
    this._isvisible = true;
}

ModalDialog.prototype.close = function() {
    if (this._isvisible)
    {
        ishortcutsenabled++;
        this._isvisible = false;
    }
    try 
    {
        this.ndiv.remove();
    } 
    catch(e)
    {}
    if (this.keypresshandler) 
    {
        try 
        {
            $(window).unbind("keydown", this.keypresshandler);
        } 
        catch(e)
        {}
    }
    if (this.custommenu) {
        try{
            menupanel.disable_custom_menu();
        } catch (e){}
    }
    try
    {
        messagelist.focus();
    } catch (e){}
}

function ModalQuestionDialog(title,question)
{
    ModalDialog.call(this);
    this.title = title;
    this.question = question;
    this.list = [];
    this.onsuccess = undefined;
    this.onback = undefined;
    this.withfield = false;
    this.btnback = true;
    this.btnproceed = true;
    
    var self = this;
    
    this.keypresshandler = function(e) {
        if (e.which == 27) {
            e.preventDefault();
            if (self.btnback)
                self._back();
        }
        else if (e.which == 13 || e.which == 10) {
            e.preventDefault();
            if (self.btnproceed)
                self._proceed();
            else if (self.btnback)
                self._back();
        }
    }
}

ModalQuestionDialog.prototype = Object.create(ModalDialog.prototype);

ModalQuestionDialog.prototype.show = function() {
    ModalDialog.prototype.show.call(this, true);
    var self = this;
    this.ndiv.append("<div class='modaldialogpart'><h1>"+this.title+"</h1></div");
    this.ndiv.append("<div class='modaldialogpart'>"+this.question.replace(/\n/g,"<br/>")+"</div");
    for(var lii in this.list){
        var li=this.list[lii];
        var btn = $("<button>"+li+"</button>");
        this.ndiv.append(btn);
        btn.click((function(li){
            return function(e){
                e.preventDefault();
                self.close();
                if (self.onsuccess)
                    self.onsuccess(li);
            };
        })(li));

    }
    if (this.withfield) {
        this.ndiv.append("<div class='modaldialogpart'><input type='text' /></div");
        this.input = this.ndiv.find("input");
        if (viewmode!="mobile")
            setTimeout(function(){
                self.input.focus();
            },0);
    }
    
    this._back = function() {
        this.close();
        if (this.onback)
            this.onback();
    };

    this._proceed = function() {
        this.close();
        if (this.onsuccess)
            this.onsuccess(this.input.attr('value'));
    };
        
    var btnpanel = $("<div class='modaldialogpart'></div");
    this.ndiv.append(btnpanel);
    if (this.btnback) {
        var btncancel = $("<button class='importantbutton'>Back</button>");
        btncancel.click(function(e){
            e.preventDefault();
            self._back();
        });
        btnpanel.append(btncancel);
    }
    if (this.btnproceed) {
        var btnok = $("<button class='importantbutton'>Proceed</button>");
        btnok.click(function(e){
            e.preventDefault();
            self._proceed();
        });
        btnpanel.append(btnok);
    }
}

ModalQuestionDialog.prototype.close = function() {
    ModalDialog.prototype.close.call(this);
}

function showGenericErrorDialog(aerror, btnback)
{
    if (btnback===undefined)
        btnback=true;
    var aaerror = "";
    if (aerror)
        aaerror = aerror;
    var error = "The process failed. " + aaerror + "\n\nIf the problem persists, please contact the system administrator.";
    var dlg = new ModalQuestionDialog("There was a problem :(", error);
    dlg.btnproceed=false;
    dlg.btnback=btnback;
    dlg.show();
}

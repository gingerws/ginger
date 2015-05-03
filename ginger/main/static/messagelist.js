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

function MessageList(div) {
    this.reverselist = false;
    this._odiv = div;
    this._div = $("<div style='position:absolute; left:0; right:0; bottom:0; top:0; overflow:auto;'></div>");
    div.append(this._div);
    this.latest_msg_timestamp = undefined;
    this.msg_fetch_request_counter = 0;
    this.togglefavorite_request_counter = 0;
    var self = this;
    $(window).keydown(function(e){
        var key=e.which;
        if (ishortcutsenabled < 0)
            return;
        if (key==38) {
            // arrow up
            if (self.selected_entry && self.selected_entry.m_prev) {
                self.select_entry( self.selected_entry.m_prev );
                self.scroll_to_entry(self.selected_entry);
            }
            return false;
        } else if (key==40) {
            // arrow down
            if (self.selected_entry && self.selected_entry.m_next) {
                self.select_entry( self.selected_entry.m_next );
                self.scroll_to_entry(self.selected_entry);
            }
            return false;
        } else if (key==39) {
            // arrow right
            if (self.selected_entry) {
                open_message(self.selected_entry.msg.url);
                self.mark_entry_as_seen(self.selected_entry);
            }
            return false;
        } else if (key==46) {
            // del
            if (self.selected_entry) {
                self.delete_entry(self.selected_entry);
            }
            return false;
        } else if (key==61 || key==107 || key==171) {
            // plus
            if (self.selected_entry) {
                self.openclose_toggle_entry(self.selected_entry);
            }
            return false;
        } else if (key==70) {
            // favorite
            if (self.selected_entry) {
                self.mark_entry_as_favorite(self.selected_entry);
            }
            return false;
        } else if (key==84) {
            // tags
            if (self.selected_entry) {
                self.showtagdialog(self.selected_entry);
            }
            return false;
        }
    });

    var _crawl_and_fetch_regularly = undefined;
    _crawl_and_fetch_regularly = function()
    {
        self.crawl_and_fetch_messages(function(){
            setTimeout(_crawl_and_fetch_regularly ,30000);
        });
    };
    setTimeout(_crawl_and_fetch_regularly, 5000);

    this.loadinglabel = $("<div class='msgloadinglabel' style='display:none;'>loading . . .</div>");
    this._odiv.append(this.loadinglabel);
}

MessageList.prototype.showtagdialog = function(entry)
{
    var self = this;
    var newsMessage = entry.msg;
    var newsId = entry.elemid;
    showTaggingDialog(newsMessage, newsId, function(data){
        self._updatefromdata(entry, data);
    });
}

MessageList.prototype._updatefromdata = function(entry, data)
{
    var nnewsMessage = JSON.parse(data.elements)[0].fields;
    var jtags = JSON.parse(data.tags);
    var tags = new Object();
    for (var ijtag in jtags)
    {
        var jtag = jtags[ijtag];
        tags[jtag.pk] = jtag.fields.name;
    }
    this.constructChild(nnewsMessage, entry.elemid, tags, entry);
}

MessageList.prototype.focus = function()
{
    this._div.focus();
}

MessageList.prototype.reset = function()
{
    this._div.html("");
    this.selected_entry = this.first_entry = this.last_entry = undefined;
}

MessageList.prototype.appendChild = function(x)
{
    var dd = this._div[0];
    if (!this.reverselist)
        dd.appendChild(x);
    else
        dd.insertBefore(x, dd.childNodes[0]);
    if (!this.last_entry)
    {
        x.m_next = undefined;
        x.m_prev = undefined;
        this.first_entry = this.last_entry = x;
    }
    else
    {
        if (!this.reverselist) 
        {
            x.m_prev = this.last_entry;
            this.last_entry.m_next = x;
            x.m_next = undefined;
            this.last_entry = x;
        } 
        else
        {
            x.m_prev = undefined;
            this.first_entry.m_prev = x;
            x.m_next = this.first_entry;
            this.first_entry = x;
        }
    }
    messagepanel.setVisible(false);
}

MessageList.prototype.constructChild = function(newsMessage, newsId, tags, useexistingentry)
{
    var self = this;
    var vListEntry;
    var createopen;
    if (useexistingentry)
    {
        createopen = useexistingentry.open;
        vListEntry = useexistingentry;
        $(vListEntry).html("");
    }
    else
    {
        var vListEntry = document.createElement("div");
    }
    vListEntry.open=false;
    vListEntry.elemid = newsId;
    vListEntry.msg=newsMessage;
    newsMessage.favorite = newsMessage.tags.indexOf( this._find_tag_in_list("favorite", tags) ) > -1;

    vListEntry.setMainclass=function(cls) {
        var entr=$(this);
        entr.removeClass(this._class);
        this._class = cls;
        entr.addClass( cls );
    };

    if (newsMessage.favorite) {
        vListEntry.setMainclass("entryfavorite");
    } else {
        vListEntry.setMainclass("entrydefault");
    }

    // control panel
    vListEntry.vControl = document.createElement("div");
    vListEntry.vControl.onclick=function(e) {
        e.stopPropagation();
    };
    if (viewmode=="mobile") {
        $(vListEntry.vControl).addClass("mobileentrycontrolpanel");
    } else {
        $(vListEntry.vControl).addClass("entrycontrolpanel");
    }

    var lnkOpen = document.createElement("a");
    lnkOpen.innerHTML="&nbsp;&nbsp;&#10145;";
    lnkOpen.href=newsMessage.url;
    $(lnkOpen).hover(
        function () {
            $(this).addClass("hovered");
        },
        function () {
            $(this).removeClass("hovered");
        }
    );
    $(lnkOpen).click(
        (function(entry){
            return function(){
                open_message(entry.msg.url);
                self.mark_entry_as_seen(entry);
                return false;
            }
        })(vListEntry)
    );

    var lnkDel = document.createElement("a");
    lnkDel.innerHTML="&nbsp;&#10005;&nbsp;";
    $(lnkDel).hover(
        function () {
            $(this).addClass("hovered");
        },
        function () {
            $(this).removeClass("hovered");
        }
    );
    $(lnkDel).click(
        (function(elem) {
            return function(){
                self.delete_entry(elem);
                return false;
            };
        })(vListEntry)
    );

    var lnkFav = document.createElement("a");
    vListEntry.lnkFav = lnkFav;
    lnkFav.className="enhancedlink";
    if (newsMessage.favorite) {
        lnkFav.innerHTML="&#9733;&nbsp;";
    } else {
        lnkFav.innerHTML="&#9734;&nbsp;";
    }
    $(lnkFav).hover(
        function () {
            $(this).addClass("hovered");
        },
        function () {
            $(this).removeClass("hovered");
        }
    );
    $(lnkFav).click(
        (function(elem){
            return function() {
                // toggle state in object
                self.mark_entry_as_favorite(elem);
                return false;
            };
        })(vListEntry)
    );

    var lnkTag = document.createElement("a");
    vListEntry.lnkTag = lnkTag;
    lnkTag.className="enhancedlink";
    lnkTag.innerHTML="⚎&nbsp;";
    $(lnkTag).hover(
        function () {
            $(this).addClass("hovered");
        },
        function () {
            $(this).removeClass("hovered");
        }
    );
    $(lnkTag).click(
        (function(elem){
            return function() {
                self.showtagdialog(elem);
                return false;
            };
        })(vListEntry)
    );


    vListEntry.vControl.appendChild(lnkFav);
    vListEntry.vControl.appendChild(lnkTag);
    vListEntry.vControl.appendChild(lnkDel);
    vListEntry.vControl.appendChild(lnkOpen);

    if (viewmode!="mobile")
        vListEntry.vControl.style.visibility="hidden";
    var zwi2 = document.createElement("div");
    zwi2.style.position="absolute";
    zwi2.style.right="0";
    zwi2.appendChild(vListEntry.vControl);
    vListEntry.appendChild(zwi2);

    // title
    vListEntry.vListEntryTitle = document.createElement("a");
    vListEntry.vListEntryTitle.setAttribute("name","title");
    vListEntry.vListEntryTitle.setAttribute("href",newsMessage.url);

    vListEntry.vExpander = document.createElement("span");
    vListEntry.vExpander.style.color = newsMessage.color;
    vListEntry.vInnerTitle = document.createElement("span");
    vListEntry.vExpander.innerHTML = "&nbsp;◸ ";
    vListEntry.vInnerTitle.innerHTML = newsMessage.title;

    vListEntry.vListEntryTitle.appendChild(vListEntry.vExpander);
    vListEntry.vListEntryTitle.appendChild(vListEntry.vInnerTitle);

    $(vListEntry).addClass(newsMessage.seen ? "seen" : "unseen");
    var zwi = document.createElement("div");
    zwi.style.padding="1px";
    vListEntry.appendChild(zwi);
    zwi.appendChild(vListEntry.vListEntryTitle);
    vListEntry.title=newsMessage.title;

    // details
    vListEntry.vListEntryDetails = document.createElement("div");
    vListEntry.vListEntryDetails.setAttribute("name","summary");
    vListEntry.vListEntryDetails.innerHTML = ((newsMessage.summary.length>0) ? newsMessage.summary : "(no summary available)");
    vListEntry.vListEntryDetails.style.display="none";
    vListEntry.vListEntryDetails.onclick=function(e){
        e.stopPropagation();
    };
    vListEntry.appendChild(vListEntry.vListEntryDetails);

    if (!useexistingentry) 
    {
        // click handler
        $(vListEntry).click(
            (function(lstentry){
                return function() {
                    self.select_entry(lstentry);
                    self.openclose_toggle_entry(lstentry);
                    return false;
                };
            })(vListEntry)
        );
    
        // hover
        if (viewmode!="mobile") {
            $(vListEntry).hover(
                (function(lstentry){
                    return function(){
                        lstentry.vControl.style.visibility="visible";
                    };
                })(vListEntry),
                (function(lstentry){
                    return function(){
                        lstentry.vControl.style.visibility="hidden";
                    };
                })(vListEntry)
            );
        }
    }
    
    // tags
    vListEntry.vListEntryTags = document.createElement("div");
    vListEntry.vListEntryTags.setAttribute("class","tags");
    vListEntry.appendChild(vListEntry.vListEntryTags);
    var hastags = false;
    var jvtags = $(vListEntry.vListEntryTags);
    jvtags.html("");
    for (var ti in newsMessage.tags) {
        hastags = true;
        var tag = newsMessage.tags[ti];
        var ttag = tags[tag];
        jvtags.append(" ");
        var tlink = $("<a style='display:block; float:left; margin:2pt;'>"+ttag+"</a>");
        tlink.click(
            (function(ttag){
                return function(e) {
                    e.preventDefault();
                    filterpanel.add_filter(new TagFilter(ttag));
                };
            })(ttag)
        );
        jvtags.append(tlink);
    }
    if (hastags)
        $(vListEntry.vListEntryTags).css("height","auto");
    else
        $(vListEntry.vListEntryTags).css("height","0");

    // footer
    vListEntry.vListEntryFooter = document.createElement("div");
    vListEntry.vListEntryFooter.setAttribute("class","entryfooter");
    vListEntry.vListEntryFooter.innerHTML = new Date(Date.parse(newsMessage.created)).toLocaleString();
    vListEntry.appendChild(vListEntry.vListEntryFooter);
    
    if (createopen)
        self.open_entry(vListEntry);
    
    return vListEntry;
}

MessageList.prototype.openclose_toggle_entry = function(lstentry)
{
	if (lstentry.open) {
		this.close_entry(lstentry);
	} else {
		this.open_entry(lstentry);
	}
}

MessageList.prototype.open_entry = function(lstentry)
{
	if (this.opened_entry)
	    this.close_entry(this.opened_entry);
	this.opened_entry=lstentry;
	lstentry.open=true;
	$(lstentry).addClass("expanded");
	this.mark_entry_as_seen(lstentry);
	lstentry.vListEntryDetails.style.display="block";
	lstentry.vListEntryTags.style.display="block";
	lstentry.vExpander.innerHTML="&nbsp;◿ ";
}

MessageList.prototype.close_entry = function(lstentry)
{
	this.opened_entry=undefined;
	lstentry.open=false;
	$(lstentry).removeClass("expanded");
	lstentry.vListEntryDetails.style.display="none";
	lstentry.vListEntryTags.style.display="none";
	lstentry.vExpander.innerHTML="&nbsp;◸ ";
}


MessageList.prototype.mark_entry_as_seen = function(entry)
{
	$(entry).removeClass("unseen");
	$(entry).addClass("seen");
	retryAjax({
		url: "newsmessages/mark_as_seen",
		type: "post",
		data: { id: entry.elemid },
		dataType: "json",
		success: function(data){},
		error: function() { showGenericErrorDialog(); },
	});
}

MessageList.prototype.mark_entry_as_favorite = function(entry,val)
{
    var self = this;
	var m=entry.msg;
	if (typeof val==='undefined') {
		val = !m.favorite;
	}
	if (val) {
		m.favorite=true;
		entry.setMainclass("entryfavorite");
		entry.lnkFav.innerHTML=" &#9733; ";
	} else {
		m.favorite=false;
		entry.setMainclass("entrydefault");
		entry.lnkFav.innerHTML=" &#9734; ";
	}
	var req = ++this.togglefavorite_request_counter;
    retryAjax({
        url: val ? "newsmessages/set_tag": "newsmessages/unset_tag",
        dataType: "json",
        type: "post",
        data: { id: entry.elemid, tag: "favorite" },
        witherrordialog: true,
        success: function(data)
        {
            if (req == self.togglefavorite_request_counter)
                self._updatefromdata(entry, data);
        },
    });
}


MessageList.prototype.delete_entry = function(entry)
{
	if (entry.msg.favorite) {
        var dlg = new ModalQuestionDialog("Unable to remove",
                                          "You cannot remove a favorite. Remove favorite status first.");
        dlg.btnproceed = false;
        dlg.show();
		return;
	}
    this._div[0].removeChild(entry);
	if (entry.m_prev) entry.m_prev.m_next = entry.m_next;
	if (entry.m_next) entry.m_next.m_prev = entry.m_prev;

	if (entry==this.first_entry) 
        this.first_entry=entry.m_next;
	if (entry==this.last_entry) 
        this.last_entry=entry.m_prev;

	if (this.selected_entry==entry)
	{
		if (entry.m_next)
		{
			this.select_entry(entry.m_next);
		}
		else
		{
			this.select_entry(entry.m_prev);
		}
	}
	
	if (!this.first_entry)
        messagepanel.setVisible(true);
	
	retryAjax({
		url: "newsmessages/remove",
		dataType: "json",
		type: "post",
		data: { id: entry.elemid },
		success: function(data){},
		error: function() {showGenericErrorDialog();},
	});
}

MessageList.prototype.select_entry = function(entry)
{
	if (this.selected_entry)
		$(this.selected_entry).removeClass("marked");
	this.selected_entry=entry;
	if (entry)
		$(entry).addClass("marked");
}

MessageList.prototype.scroll_to_entry = function(msg)
{
	var newentry=$(msg);
	var y1=newentry.offset().top;
	var y2=y1+newentry.height();
	var h=this._div.height();
	if (y1<50 || y2 > h-50) {
		var yi = (y1+y2)/2;
		var ys = h/2;
		var diff = ys-yi;
		this._div[0].scrollTop-=diff;
	}
}


MessageList.prototype._reset_messages = function()
{
    this.reset();
    this.latest_msg_timestamp = undefined;
}


MessageList.prototype._fetch_messages = function(onsuccess, onfailed, onskipped)
{
    var self = this;
    var myrequest = ++this.msg_fetch_request_counter;
	retryAjax({
		url: "newsmessages/list?lasttimestamp=" + (self.latest_msg_timestamp ? self.latest_msg_timestamp : "")
		 + "&filter=" + encodeURIComponent(filterpanel.messagefilters.tofilterstring()),
		dataType: "json",
		success: function(data){
            if (myrequest == self.msg_fetch_request_counter)
            {
                self.loadinglabel.css('display', 'none');
                try
                {
                    var elements = JSON.parse(data.elements);
                } 
                catch(e)
                {
                    throw "REDOAJAX";
                }
                var jtags = JSON.parse(data.tags);
                var tags = new Object();
                for (var ijtag in jtags)
                {
                    var jtag = jtags[ijtag];
                    tags[jtag.pk] = jtag.fields.name;
                }
                for(var i in elements) {
                    var newsMessage = elements[i].fields;
                    var newsId = elements[i].pk;
                    if (!self.latest_msg_timestamp || newsMessage.fetchedAt > self.latest_msg_timestamp)
                        self.latest_msg_timestamp = newsMessage.fetchedAt;
                    var vListEntry = messagelist.constructChild(newsMessage, newsId, tags);
                    messagelist.appendChild(vListEntry);
                }
                if (elements.length>0 && !self.selected_entry) {
                    messagelist.select_entry($(messagelist._div).find("div").first()[0]);
                    filterpanel._disablewelcometext();
                }
                if (onsuccess)
                    onsuccess();
            } 
            else
            {
                if (onskipped)
                    onskipped();                
            }
		},
		error: function() {
            if (myrequest == self.msg_fetch_request_counter)
            {
                self.loadinglabel.css('display', 'none');
                if (onfailed)
                    onfailed();
            } 
            else
            {
                if (onskipped)
                    onskipped();                                
            }
		}
	});
}

MessageList.prototype.refresh = function(onsuccess, onfailed) {
    var self = this;
    if (!onfailed)
        onfailed = function(){ showGenericErrorDialog(undefined, false); };
    this._reset_messages();
    this.loadinglabel.css('display', 'block');
    messagepanel.setVisible(false);
    this._fetch_messages(function(){
        if (onsuccess)
            onsuccess();
        messagepanel.setVisible(!self.first_entry);
    },
    function(){
        if (onfailed)
            onfailed();
        messagepanel.setVisible(!self.first_entry);
    },
    function(){
        if (onsuccess)
            onsuccess();
    }
    );
}

MessageList.prototype.crawl_and_fetch_messages = function(oncrawled)
{
    var self = this;
	ajax({
		url: "crawl/",
		dataType: "text",
		success: function(data){
			self._fetch_messages(oncrawled, oncrawled, oncrawled);
		},
		error: function(){
			self._fetch_messages(oncrawled, oncrawled, oncrawled);
		}
	});
}

MessageList.prototype._find_tag_in_list = function(tag, tags)
{
    for(var i in tags)
        if(tags[i] == tag)
            return parseInt(i);
}

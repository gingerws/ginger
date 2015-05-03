# Copyright (C) 2010-2013, Josef Hahn and friend
#
# This file is part of Ginger.
#
# Ginger is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Ginger is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with Ginger.  If not, see <http://www.gnu.org/licenses/>.

import django.db
from django.core import serializers
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.conf import settings
from django.http import HttpResponse
from django.template import Context, loader
from ginger.main import messagefilter
from ginger.main.models import Feed, NewsMessage, Tag, UserConfiguration, UserConfigurationLarge
import json
import subprocess
import ginger.main.feedadmin

json_serializer = serializers.get_serializer("json")()


def init_ginger(request):
    if not settings.EXTERNAL_AUTH_HELPER:
        newadmin = User.objects.create_user('admin', 'admin@localhost', 'admin')
        newadmin.is_superuser = True
        newadmin.is_staff = True
        newadmin.save()
        for (url, name) in [
                                    ("http://feeds.wired.com/wired/index?format=xml", "wired"),
                                    ("http://feeds.reuters.com/Reuters/worldNews", "reuters"),
                                    ("http://xkcd.com/rss.xml", "xkcd")]:
            ginger.main.feedadmin.createfeed(name, url, 15, newadmin)


def _dumpmessagedata(entries, user):
    return {"elements": json_serializer.serialize(entries),
            "tags": json_serializer.serialize(Tag.objects.filter(owner=user))}


def list_all_messages(request):
    try:
        idThresh = int(request.GET["lasttimestamp"])
    except Exception as e:
        idThresh = -1
    if request.user.is_authenticated():
        elements = NewsMessage.objects.filter(deleted=False \
                                              , owner=request.user, fetchedAt__gt=idThresh)
    if "filter" in request.GET and request.GET["filter"] != "":
        f = messagefilter.filterbyfilterstring(request.GET["filter"])
        elements = f.applyfilter(elements, request.user)
    elements = sorted(elements, key=lambda element: element.created)
    return HttpResponse(json.dumps(_dumpmessagedata(elements, request.user)))


def store_filter(request):
    UserConfigurationLarge.set(request.user, "filter:" + request.POST["name"],
                          json.dumps(messagefilter.filterbyfilterstring(request.POST["v"]).tonativerepresentation()))
    return HttpResponse("")


def list_filter(request):
    filters = []
    for k in UserConfigurationLarge.list(request.user):
        if k.startswith("filter:"):
            filters.append((k[7:], UserConfigurationLarge.get(request.user, k, "")))
    return HttpResponse(json.dumps({"filter": filters}))


def remove_filter(request):
    UserConfigurationLarge.remove(request.user, "filter:" + request.POST["name"])
    return HttpResponse("1")


def store_default_filter(request):
    f = json.dumps(messagefilter.filterbyfilterstring(request.POST["filterstring"]).tonativerepresentation())
    UserConfigurationLarge.set(request.user, "defaultFilter", f)
    return HttpResponse("")


def mark_as_seen(request):
    elemid = int(request.POST["id"])
    m = NewsMessage.objects.get(pk=elemid)
    if m.owner == request.user:
        m.seen = True
        m.save()
    return HttpResponse("")


def delete_message(request):
    elemid = int(request.POST["id"])
    m = NewsMessage.objects.get(pk=elemid)
    if m.owner == request.user:
        m.deletemessage()
    return HttpResponse("")


def set_tags(request):
    elemid = int(request.POST["id"])
    m = NewsMessage.objects.get(pk=elemid)
    if m.owner == request.user:
        m.settags([request.POST[k] for k in request.POST.keys() if k.startswith("tag")])
    return HttpResponse(json.dumps(_dumpmessagedata(NewsMessage.objects.filter(pk=elemid), request.user)))


def set_tag(request):
    elemid = int(request.POST["id"])
    tag = request.POST["tag"]
    m = NewsMessage.objects.get(pk=elemid)
    if m.owner == request.user:
        m.addtag(tag)
    return HttpResponse(json.dumps(_dumpmessagedata(NewsMessage.objects.filter(pk=elemid), request.user)))


def unset_tag(request):
    elemid = int(request.POST["id"])
    tag = request.POST["tag"]
    m = NewsMessage.objects.get(pk=elemid)
    if m.owner == request.user:
        m.removetag(tag)
    return HttpResponse(json.dumps(_dumpmessagedata(NewsMessage.objects.filter(pk=elemid), request.user)))


def do_login(request):
    # external auth?
    try:
        externalauth = settings.EXTERNAL_AUTH_HELPER
        if externalauth is not None and len(externalauth) == 0:
            externalauth = None
    except AttributeError:
        externalauth = None

    username = request.POST["username"]
    password = request.POST["password"]

    if externalauth is None:
        u = authenticate(username=username, password=password)
    else:
        extp = subprocess.Popen([externalauth, ], stdin=subprocess.PIPE,
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        username = extp.communicate(username + "\n" + password + "\n")[0].strip()
        u = None
        if len(username) > 0:
            m = User.objects.filter(username=username)
            if len(m) == 1:
                u = authenticate(username=username, password=password)
                if u is None:
                    m[0].set_password(password)
                    m[0].save()
                    u = authenticate(username=username, password=password)
            elif len(m) == 0:
                u = User.objects.create_user(username, '', password)
                u.save()
                u = authenticate(username=username, password=password)

    if u is not None:
        if u.is_active:
            login(request, u)
            return return_template(request, "logged_in.html", {'subsite': settings.SUB_SITE, })
    return show_login_screen(request, msg="Wrong login data. Please try again.")


def show_login_screen(request, msg="", username="", passwd=""):
    return return_template(request, "login.html",
                           {'subsite': settings.SUB_SITE,
                            'message': msg,
                            'username': username,
                            'passwd': passwd,
                           })


def do_logout(request):
    logout(request)
    return show_login_screen(request)


def test_if_ginger_initialized(request):
    s = False
    if len(User.objects.all()) + \
            len(Feed.objects.all()) + \
            len(NewsMessage.objects.all()) == 0:
        init_ginger(request)
        s = True
    return s


def return_index_html(request):
    try:
        freshly = test_if_ginger_initialized(request)
    except django.db.OperationalError as e:
        raise Exception("Your database seems to be wrongly configured or not initialized! Details: " + str(e))

    useragent = request.META['HTTP_USER_AGENT']
    if len([x for x in ("Android", "BlackBerry", "Opera Mini",
                        "Mobile", "Phone", )
            if (x in useragent)]) > 0:
        viewmode = "mobile"
    else:
        viewmode = "default"
    if request.user.is_authenticated():
        return return_template(request, "index.html", {'viewmode': viewmode,
                                                       'user': request.user,
                                                       'listdirection': -1 if UserConfiguration.get(
                                                           request.user, "reverseSortOrder", "0")=="1" else 1,
                                                       'defaultfilter': UserConfigurationLarge.get(
                                                           request.user, "defaultFilter", ""),
                                                       'subsite': settings.SUB_SITE,
                                                       'powermode': UserConfiguration.get(
                                                           request.user, "powermode", "0"),
                                                       })
    else:
        msg = ""
        user = ""
        passwd = ""
        if freshly:
            msg = """
            <span style="font-weight:bold;"/>Congratulations, </span>
            A first Ginger user is created. Its name
            is 'admin', password is 'admin'. It has also full
            administrative privileges (can create new users, ...) and some
            sample feeds included.
            """
            user = "admin"
            passwd = "admin"
        return show_login_screen(request, msg, user, passwd)


def listconfigurationvalues(request):
    return HttpResponse(json.dumps({"list": UserConfiguration.list(request.user)}))


def getconfigurationvalue(request):
    key=request.GET["key"]
    return HttpResponse(json.dumps({"value": UserConfiguration.get(request.user, key)}))


def setconfigurationvalue(request):
    key=request.GET["key"]
    value=request.POST["value"]
    UserConfiguration.set(request.user, key, value)
    return HttpResponse("1")


def return_template(request, filename, context={}):
    t = loader.get_template(filename)
    c = Context(context)
    return HttpResponse(t.render(c))

#TODO python3?


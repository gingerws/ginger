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

from django.http import HttpResponse, HttpResponseRedirect
from django.core import serializers
from ginger.main.models import Feed, Tag
from django.contrib.auth.models import User
from django.template import Context, loader
import random



# list_feeds is the handler for url "config/list_feeds" (see urls.py)
def list_feeds(request):
    return HttpResponse(serializers.serialize("json", Feed.objects.filter(enabled=True, owner=request.user)))

# remove_feed is the handler for urls like "config/remove_feed/[some id]"
# the url's id part is passed to the feedId parameter (see urls.py)
def disable_feed(request):
    feedId = int(request.POST["id"])
    # fetch the feed which is to be removed from the database by the given id from the url
    toBeRemoved = Feed.objects.get(id=int(feedId))

    # check if the logged in user is the owner of that feed. if not, return a simple error message
    if toBeRemoved.owner != request.user:
        return HttpResponse("failed")

    # at this point, we are allowed to delete it, so we do so...
    toBeRemoved.enabled = False
    toBeRemoved.save()
    # ... and return success to the browser ;)
    return HttpResponse("Done. Go back!")


def createfeed(name, url, interval, owner):
    feedtag = Tag.getnewtag(name, owner)
    f = Feed(url=url, name=name, updateInterval=int(interval), owner=owner)
    f.save()
    f.correspondingTags.add(feedtag)


def add_feed(request):
    url = request.POST["url"]
    name = request.POST["name"]
    interval = request.POST["interval"]
    owner = request.user
    createfeed(name, url, interval, owner)
    return HttpResponse("Done. Go back!")



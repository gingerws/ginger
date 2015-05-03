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


from django.core import serializers
from django.http import HttpResponse
import json
from ginger.main.models import Tag, TagPropagationRule, NewsMessage

json_serializer = serializers.get_serializer("json")()


def get(request):
    res = []
    for t in Tag.objects.filter(owner=request.user):
        count = len(NewsMessage.objects.filter(tags__pk=t.pk))
        res.append((t.name, count))
    res.sort(key=lambda x: x[1])
    res.reverse()
    return HttpResponse(json.dumps(res))


def remove(request):
    for t in request.POST.getlist("tags[]"):
        for x in Tag.objects.filter(owner=request.user, name=t):
            x.delete()
    return HttpResponse("1")


def add(request):
    return HttpResponse(Tag.gettag(request.POST["tag"], request.user).name)


def getpropagationrules(request):
    res = []
    for pr in TagPropagationRule.objects.filter(owner=request.user):
        iftags = [iftag.name for iftag in pr.iftags.all()]
        applyalsotags = [applyalsotag.name for applyalsotag in pr.applyalsotags.all()]
        if len(iftags) == 0 or len(applyalsotags) == 0:
            pr.delete()
        else:
            res.append((pr.pk, iftags, applyalsotags))
    return HttpResponse(json.dumps(res))


def addpropagationrule(request):
    newiftags = request.POST.getlist("iftags[]")
    newapplyalsotags = request.POST.getlist("applyalsotags[]")
    newrule = TagPropagationRule(owner=request.user)
    newrule.save()
    for newiftag in newiftags:
        newrule.iftags.add(Tag.gettag(newiftag, request.user))
    for newapplyalsotag in newapplyalsotags:
        newrule.applyalsotags.add(Tag.gettag(newapplyalsotag, request.user))
    return HttpResponse("1")


def removepropagationrule(request):
    id = int(request.POST["id"])
    r = TagPropagationRule.objects.filter(owner=request.user, pk=id)
    if len(r) > 0:
        r[0].delete()
    return HttpResponse("1")

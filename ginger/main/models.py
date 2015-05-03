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

from django.db import models
from django.contrib.auth.models import User
from ginger.main.userscripting import execute_user_script, Message

import datetime
import unicodedata

class Tag(models.Model):

    name = models.CharField(max_length=255)
    owner = models.ForeignKey(User)

    def __unicode__(self):
        return "[" + self.name + ";from " + self.owner.username + "]"

    @staticmethod
    def gettag(name, owner):
        fname = Tag.formatted_name(name)
        if len(fname)==0:
            return None
        res = Tag.objects.filter(name=fname, owner=owner)
        if len(res) > 0:
            return res[0]
        else:
            newtag = Tag(name=fname, owner=owner)
            newtag.save()
            return newtag

    @staticmethod
    def formatted_name(name):
        result = ""
        try:
            name=unicode(name)
        except Exception: # Python2/3 compatibility
            name=str(name)
        for char in name.lower():
            if unicodedata.category(char) in ["Lu","Ll","Lt","LC","Lo","N","Nd","Nl","No"]:
                result += char
            elif unicodedata.category(char) in ["P","Po","Pf","Pi","Pe","Ps","Pd","Pc"]:
                if len(result) > 0 and not result.endswith("-"):
                    result += "-"
        if result.endswith("-"):
            result = result[:-1]
        return result

    @staticmethod
    def getnewtag(name, owner):
        res = None
        fname = Tag.formatted_name(name)
        i = 2
        sname = fname
        while (res is None) or (len(res) > 0):
            res = Tag.objects.filter(name=sname, owner=owner)
            if len(res) > 0:
                sname = fname + str(i)
                i += 1
        newtag = Tag(name=sname, owner=owner)
        newtag.save()
        return newtag

    @staticmethod
    def propagate(msg):
        done = True
        for rule in TagPropagationRule.objects.filter(owner=msg.owner):
            tags=list(msg.tags.all())
            match=True
            for iftag in rule.iftags.all():
                if not iftag in tags:
                    match=False
                    break
            if match:
                for applyalsotag in rule.applyalsotags.all():
                    if not applyalsotag in tags:
                        done = False
                        msg.addtag(applyalsotag)
        if not done:
            Tag.propagate(msg)


class Feed(models.Model):

    url = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(User)
    enabled = models.BooleanField(default=True)
    lastFetched = models.DateTimeField(default=datetime.datetime(1954, 6, 7, 13, 37, 00))
    updateInterval = models.IntegerField(default=15)  # in minutes
    correspondingTags = models.ManyToManyField(Tag)

    def __unicode__(self):
        return "[" + self.name + ";" + self.url + ";from " + self.owner.username + "]"

class TagPropagationRule(models.Model):
    iftags = models.ManyToManyField(Tag, related_name="tif")
    applyalsotags = models.ManyToManyField(Tag, related_name="tapplyalso")
    owner = models.ForeignKey(User)


    def __unicode__(self):
        return "[tags " + ",".join([x.name for x in self.iftags.all()]) + " imply " \
               + ",".join([x.name for x in self.applyalsotags.all()]) + ";from " + self.owner.username + "]"


class NewsMessage(models.Model):

    title = models.CharField(max_length=150)
    summary = models.TextField()
    feed = models.ForeignKey(Feed)
    owner = models.ForeignKey(User)
    created = models.DateTimeField(auto_now=False)
    seen = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)
    url = models.CharField(max_length=400, default="", blank=True)
    guid = models.CharField(max_length=400, default="")
    fetchedAt = models.BigIntegerField(default=0)
    tags = models.ManyToManyField(Tag)

    def __unicode__(self):
        return "[" + self.title + "]"

    def _addtag(self, tag, firescript=True):
        try:
            if tag.owner != self.owner:
                raise Exception("violation detected")
        except AttributeError:
            tag = Tag.gettag(tag, self.owner)
        if len(self.tags.filter(pk=tag.pk)) == 0:
            self.tags.add(tag)
            if firescript:
                try:
                    execute_user_script(self.owner, "ontagset", (Message(self), tag.name))
                except Exception as e:
                    self.summary += "<br/><br/>Error in user script: " + str(e)
                    self.save()
        return tag

    def addtag(self, tag):
        self._addtag(tag)
        Tag.propagate(self)

    def addtags(self, tags):
        for tag in tags:
            self._addtag(tag)
        Tag.propagate(self)

    def removetag(self, tag):
        ttag = Tag.objects.filter(owner=self.owner, name=tag)
        if len(ttag)>0:
            if len(self.tags.filter(pk=ttag[0].pk)) > 0:
                self.tags.remove(ttag[0])

    def settags(self, tags):
        oldtags = list(self.tags.all())
        self.tags.clear()
        for tag in tags:
            ntag = self._addtag(tag, False)
            if not ntag in oldtags:
                try:
                    execute_user_script(self.owner, "ontagset", (Message(self), ntag.name))
                except Exception as e:
                    self.summary += "<br/><br/>Error in user script: " + str(e)
                    self.save()
        Tag.propagate(self)


    @staticmethod
    def addmessage(msg):
        msg.save()
        try:
            execute_user_script(msg.owner, "onnewmessage", (Message(msg),))
        except Exception as e:
            msg.summary += "<br/><br/>Error in user script: " + str(e)
            msg.save()

    def deletemessage(self):
        self.deleted = True
        self.tags.clear()
        self.save()


class UserConfiguration(models.Model):

    user = models.ForeignKey(User)
    configkey = models.CharField(max_length=200, default="")
    configvalue = models.CharField(max_length=1000, default="", blank=True)

    largefields = ["onnewmessage", "ontagset"]

    def __unicode__(self):
        return "[" + self.configkey + "=" + self.configvalue + ";from " + self.user.username + "]"

    @staticmethod
    def get(user, key, defaultvalue=None):
        if key in UserConfiguration.largefields:
            return UserConfigurationLarge.get(user, key, defaultvalue)
        l = UserConfiguration.objects.filter(user=user, configkey=key)
        if len(l)==0:
            return defaultvalue
        else:
            return l[0].configvalue

    @staticmethod
    def remove(user, key):
        if key in UserConfiguration.largefields:
            return UserConfigurationLarge.remove(user, key)
        l = UserConfiguration.objects.filter(user=user, configkey=key)
        l.delete()

    @staticmethod
    def set(user, key, value):
        if key in UserConfiguration.largefields:
            return UserConfigurationLarge.set(user, key, value)
        l = UserConfiguration.objects.filter(user=user, configkey=key)
        if len(l) == 0:
            o = UserConfiguration(user=user, configkey=key)
        else:
            o = l[0]
        o.configvalue = value
        o.save()

    @staticmethod
    def list(user):
        r = list(UserConfigurationLarge.list(user))
        for o in UserConfiguration.objects.filter(user=user):
            r.append(o.configkey)
        return r


class UserConfigurationLarge(models.Model):

    user = models.ForeignKey(User)
    configkey = models.CharField(max_length=200, default="")
    configvalue = models.TextField(default="", blank=True)

    def __unicode__(self):
        return "[" + self.configkey + "=" + self.configvalue + ";from " + self.user.username + "]"

    @staticmethod
    def get(user, key, defaultvalue=None):
        l = UserConfigurationLarge.objects.filter(user=user, configkey=key)
        if len(l)==0:
            return defaultvalue
        else:
            return l[0].configvalue

    @staticmethod
    def remove(user, key):
        l = UserConfigurationLarge.objects.filter(user=user, configkey=key)
        l.delete()

    @staticmethod
    def set(user, key, value):
        l = UserConfigurationLarge.objects.filter(user=user, configkey=key)
        if len(l) == 0:
            o = UserConfigurationLarge(user=user, configkey=key)
        else:
            o = l[0]
        o.configvalue = value
        o.save()

    @staticmethod
    def list(user):
        r = []
        for o in UserConfigurationLarge.objects.filter(user=user):
            r.append(o.configkey)
        return r


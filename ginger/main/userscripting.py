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

_uc = None


class Message:

    def __init__(self, nativemessage):
        self.nativeobject = nativemessage

    def setsummary(self, v):
        self.nativeobject.summary = v
        self.nativeobject.save()

    def getsummary(self):
        return self.nativeobject.summary

    def settitle(self, v):
        self.nativeobject.title = v
        self.nativeobject.save()

    def gettitle(self):
        return self.nativeobject.title

    def getfeed(self):
        return self.nativeobject.feed

    def setcreated(self, v):
        self.nativeobject.created = v
        self.nativeobject.save()

    def getcreated(self):
        return self.nativeobject.created

    def seturl(self, v):
        self.nativeobject.url = v
        self.nativeobject.save()

    def geturl(self):
        return self.nativeobject.url

    def gettags(self):
        return [x.name for x in self.nativeobject.tags.all()]

    def addtag(self, tag):
        self.nativeobject.addtag(tag)

    def removetag(self, tag):
        self.nativeobject.removetag(tag)

    def delete(self):
        self.nativeobject.deletemessage()

def execute_user_script(user, scriptname, params):
    global _uc
    if _uc is None:
        from ginger.main.models import UserConfiguration
        _uc = UserConfiguration
    code = _uc.get(user, scriptname)
    if code:
        g = {}
        l = {}
        exec(code, g, l)
        l[scriptname](*params)


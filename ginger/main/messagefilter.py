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

from ginger.main.models import Tag, NewsMessage

def httpparamunpack(x): # Python 2/3 compatibility
    try:
        import urlparse
        return urlparse.parse_qs(x)
    except:
        import urllib
        return urllib.parse.parse_qs(x)


class Filter:

    def __init__(self):
        pass

    def applyfilter(self, elements, user):
        return NewsMessage.objects.none()

    def tonativerepresentation(self):
        return ["Filter"]


class IdFilter(Filter):

    def __init__(self, id):
        Filter.__init__(self)
        self.id = id

    def applyfilter(self, elements, user):
        return elements.filter(pk=int(self.id))

    def tonativerepresentation(self):
        return ["IdFilter", self.id]


class TagFilter(Filter):

    def __init__(self, tag):
        Filter.__init__(self)
        self.tag = tag

    def applyfilter(self, elements, user):
        return elements.filter(tags__in=[Tag.gettag(self.tag, user).pk])

    def tonativerepresentation(self):
        return ["TagFilter", self.tag]


class CombinationFilter(Filter):

    def __init__(self, filterstring):
        Filter.__init__(self)
        d = httpparamunpack(filterstring)
        i = 0
        self.inner = []
        while str(i) in d:
            self.inner.append(filterbyfilterstring(d[str(i)][0]))
            i += 1



class AndFilter(CombinationFilter):

    def __init__(self, filterstring):
        CombinationFilter.__init__(self, filterstring)

    def applyfilter(self, elements, user):
        if len(self.inner) > 0:
            r = elements
            for inner in self.inner:
                r = inner.applyfilter(r, user)
            return r
        else:
            return NewsMessage.objects.none()

    def tonativerepresentation(self):
        return ["AndFilter"] + [x.tonativerepresentation() for x in self.inner]


class OrFilter(CombinationFilter):

    def __init__(self, filterstring):
        CombinationFilter.__init__(self,filterstring)

    def applyfilter(self, elements, user):
        r = None
        for inner in self.inner:
            rr = inner.applyfilter(elements, user)
            if r:
                r = r | rr
            else:
                r = rr
        return r.distinct()

    def tonativerepresentation(self):
        return ["OrFilter"] + [x.tonativerepresentation() for x in self.inner]


def filterbyfilterstring(filterstring):
    if not filterstring:
        return Filter()
    filterdict = httpparamunpack(filterstring)
    if "v" in filterdict:
        filtervalue = filterdict["v"][0]
    else:
        filtervalue = ""
    filtertype = filterdict["t"][0]
    if filtertype == "id":
        return IdFilter(filtervalue)
    elif filtertype == "tag":
        return TagFilter(filtervalue)
    elif filtertype == "or":
        return OrFilter(filtervalue)
    elif filtertype == "and":
        return AndFilter(filtervalue)
    else:
        raise Exception("unknown filter " + filtertype)

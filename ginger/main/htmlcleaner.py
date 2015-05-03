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

import re

tagPattern = re.compile(r"\<[^<>]*\>")  # matches to something like <a href="msn.com" /> or <bananatree?>
elementnamePattern = re.compile(r"[^A-Za-z]*([A-Za-z]*)[^A-Za-z]")  # matches to the 'a' in <a href="msn.com" />
attributePattern = re.compile(
    r"[^A-Za-z]([A-Za-z]*)\s*=\s*(('[^']*')|(\"[^\"]*\"))")  # matches to 'href="msn.com"' in <a href="msn.com" />

slashAtBeginPattern = re.compile(r"<\s*/")
slashAtEndPattern = re.compile(r"/\s*>")


def _translateTag(s, linktarget, tree):
    elementName = elementnamePattern.search(s).group(1).lower()
    attributes = {}
    for match in attributePattern.finditer(s):
        name = match.group(1)
        value = match.group(2)[1:-1]
        attributes[name] = value
    isSlashAtBegin = slashAtBeginPattern.search(s) != None
    isSlashAtEnd = slashAtEndPattern.search(s) != None

    if elementName == "a":
        if isSlashAtEnd: return ""
        if isSlashAtBegin:
            if "a" in tree:
                tree.pop()
                return "</a>"
        if not "href" in attributes: return ""
        if "a" in tree: return ""
        tree.append("a")
        return "<a onclick=\"return true;\" href=\"" + attributes["href"] + "\" target=\"" + linktarget + "\">"

    elif elementName == "img":
        if "src" in attributes:
            if "a" in tree:
                if "alt" in attributes:
                    return " [IMAGE:" + attributes["alt"] + "] "
                else:
                    return " [IMAGE:" + attributes["src"] + "] "
            else:
                alttxt = attributes["src"]
                if "alt" in attributes: alttxt = attributes["alt"]
                return " <a onclick=\"return true;\" href=\"" + attributes[
                    "src"] + "\" target=\"" + linktarget + "\">[IMAGE:" + alttxt + "]</a> "
        else:
            return ""

    else:
        return ""


def cleanHtml(s, linktarget):
    result = ""
    cursor = 0
    tree = []
    for match in tagPattern.finditer(s):
        startidx = match.start()
        endidx = match.end()
        result = result + s[cursor:startidx] + _translateTag(s[startidx:endidx], linktarget, tree)
        cursor = endidx
    result = result + s[cursor:]
    return result



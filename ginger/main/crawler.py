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

from django.http import HttpResponse
from ginger.main.models import Feed, NewsMessage
from ginger.main.htmlcleaner import cleanHtml

import feedparser
import time
import datetime


def garbage_collector(feed, seen_msgs):
    res = ""
    for msg in NewsMessage.objects.filter(deleted=True, feed=feed):
        if not (msg.guid in seen_msgs):
            res += "Deleteing '%s'...\n" % (msg.guid,)
            msg.delete()
    return res


def crawl(request):
    response = ""
    now = datetime.datetime.now()

    # lnow is an abstract integer which increases by each fetched message and
    # thereby provides an unique value along all message.
    # will be stored in the messages, so you can sort or filter by it
    lnow = (int(time.time()) - 1000000000) * 1000

    for feed in Feed.objects.all():

        if not feed.enabled:
            continue

        # feed messages
        try:
            if now - feed.lastFetched >= datetime.timedelta(minutes=feed.updateInterval):
                _seen_msgs = []  # we need this for collecting garbage in message storage
                tempFeed = feedparser.parse(feed.url)
                feedTitle = tempFeed['feed']['title']
                response += "Crawling %s: '%s'...\n" % (feed.name, feedTitle)

                for feedItem in tempFeed['items']:

                    # check if there is a timstamp and its format
                    if 'updated_parsed' in feedItem:
                        timeStamp = feedItem['updated_parsed']
                        itemTimeStamp = datetime.datetime(*timeStamp[:6])
                    elif 'published_parsed' in feedItem:
                        timeStamp = feedItem['published_parsed']
                        itemTimeStamp = datetime.datetime(*timeStamp[:6])
                    elif 'date_parsed' in feedItem:
                        timeStamp = feedItem['date_parsed']
                        itemTimeStamp = datetime.datetime(*timeStamp[:6])
                    else:
                        itemTimeStamp = now

                    # get URL
                    itemURL = feedItem['link']

                    # get title
                    itemTitle = feedItem['title']
                    restTitle = ''
                    if (len(itemTitle) > 140):
                        # look form blank char at position > 140
                        cut = itemTitle.find(" ", 140)
                        if (cut == -1):
                            cut = 140
                        tempTitle = itemTitle[0:cut] + ' ...'
                        restTitle = '... ' + itemTitle[cut:]
                        itemTitle = tempTitle

                    # check if there is a summary
                    if 'summary' in feedItem:
                        itemSummary = feedItem['summary']
                    else:
                        itemSummary = ''

                    # throw away most html stuff
                    itemSummary = cleanHtml(itemSummary, "_blank")

                    if (restTitle != ''):
                        itemSummary = restTitle + '\n' + itemSummary

                    # get item id if any)
                    if 'guid' in feedItem:
                        itemGuid = feedItem['guid']
                    elif 'id' in feedItem:
                        itemGuid = feedItem['id']
                    else:
                        itemGuid = itemURL

                    _seen_msgs.append(itemGuid)

                    # check if this is a double entry
                    l = NewsMessage.objects.filter(guid=itemGuid, feed=feed)
                    if (len(l) == 0):
                        # write to db
                        m = NewsMessage(title=itemTitle, summary=itemSummary, \
                                        feed=feed, url=itemURL, guid=itemGuid, \
                                        owner=feed.owner, created=itemTimeStamp, \
                                        fetchedAt=lnow)
                        lnow += 1
                        NewsMessage.addmessage(m)
                        m.addtags(feed.correspondingTags.all())
                        response += "Adding '%s'...\n" % (itemGuid,)
                response += garbage_collector(feed, _seen_msgs)
                feed.lastFetched = datetime.datetime.now()
                feed.save()
        except Exception as e:
            response += str(e) + "\n"
    return HttpResponse(response.replace("\n", "<br/>"))

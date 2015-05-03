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

from django.conf.urls import patterns, include, url
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',

    # main urls
    url(r'^$', "ginger.main.core.return_index_html"),

    # main model functions
    url(r'^newsmessages/list$', "ginger.main.core.list_all_messages"),
    url(r'^newsmessages/set_tags$', "ginger.main.core.set_tags"),
    url(r'^newsmessages/set_tag$', "ginger.main.core.set_tag"),
    url(r'^newsmessages/unset_tag$', "ginger.main.core.unset_tag"),
    url(r'^newsmessages/mark_as_seen$', "ginger.main.core.mark_as_seen"),
    url(r'^newsmessages/remove$', "ginger.main.core.delete_message"),

    url(r'^tags/get$', "ginger.main.tags.get"),
    url(r'^tags/add$', "ginger.main.tags.add"),
    url(r'^tags/remove$', "ginger.main.tags.remove"),

    url(r'^tagpropagationrules/get$', "ginger.main.tags.getpropagationrules"),
    url(r'^tagpropagationrules/add$', "ginger.main.tags.addpropagationrule"),
    url(r'^tagpropagationrules/remove$', "ginger.main.tags.removepropagationrule"),

    url(r'^filter/store$$', "ginger.main.core.store_filter"),
    url(r'^filter/list$', "ginger.main.core.list_filter"),
    url(r'^filter/remove', "ginger.main.core.remove_filter"),
    url(r'^filter/storedefault$$', "ginger.main.core.store_default_filter"),

    # configuration
    url(r'^config/list_feeds$', "ginger.main.feedadmin.list_feeds"),
    url(r'^config/disable_feed$', "ginger.main.feedadmin.disable_feed"),
    url(r'^config/add_feed$', "ginger.main.feedadmin.add_feed"),

    url(r'^config/listvalues$', "ginger.main.core.listconfigurationvalues"),
    url(r'^config/getvalue$', "ginger.main.core.getconfigurationvalue"),
    url(r'^config/setvalue$', "ginger.main.core.setconfigurationvalue"),

    # crawling trigger url (call it via wget/cron or so)
    url(r'^crawl/?$', "ginger.main.crawler.crawl"),

    # the admin interface.
    url(r'^admin/', include(admin.site.urls)),

    # login mechanics
    url(r'^do_login$', "ginger.main.core.do_login"),
    url(r'^do_logout$', "ginger.main.core.do_logout"),

)

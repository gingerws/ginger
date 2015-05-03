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

import os
import sys

me=os.path.dirname(os.path.abspath( __file__ ))
sys.path.append( me )
os.chdir(me)
os.environ['DJANGO_SETTINGS_MODULE'] = 'ginger.settings'
import django.core.handlers.wsgi
application = django.core.handlers.wsgi.WSGIHandler()

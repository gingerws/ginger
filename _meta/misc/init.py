#!/usr/bin/python2

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
import subprocess
import hashlib
import time
import platform

if not len(sys.argv) == 3:
    print("Usage: init.py [desired_runtime_dir] [ginger_installation_dir]")
    sys.exit(1)

rundir = os.path.abspath(sys.argv[1]).replace("\\","/")
installdir = os.path.abspath(sys.argv[2]).replace("\\","/")

if not os.path.isdir(rundir):
    os.makedirs(rundir)

secretkey = hashlib.md5(str(time.time()).encode("ascii")).hexdigest()

r = "}"
l = "{"

with open(installdir + "/ginger/settings_local.py", "w") as f:
    f.write("""
DEBUG = False
TEMPLATE_DEBUG = DEBUG
SECRET_KEY = '{secretkey}'
DATABASES = {l}
    'default': {l}
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': '{rundir}/ginger-db',
        'USER': '',
        'PASSWORD': '',
        'HOST': '',
        'PORT': '',
    {r}
{r}
""".format(**locals()) +
("""
STATIC_ROOT = "{rundir}/static"
DEBUG = True
TEMPLATE_DEBUG = DEBUG
""".format(**locals()) if (platform.system()=="Windows") else "")
)

os.chdir(installdir)

# detect python executable
python="python2"
try:
    subprocess.call([python, "-V"])
except FileNotFoundError:
    python="python"
subprocess.call([python, "manage.py", "syncdb", "--noinput"])
subprocess.call([python, "manage.py", "flush", "--noinput"])
subprocess.call([python, "manage.py", "collectstatic", "--noinput"])


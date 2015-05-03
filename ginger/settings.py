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

# Django settings for ginger project.


# WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING #
# WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING #

# If you find this file in a ginger installation (instead of the developer's
# source code), be aware of the fact that this file contains the factory
# default. Overriding values is possible by writing them to a
# settings_local.py file.

# WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING #
# WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING #


import os

DEBUG = True
TEMPLATE_DEBUG = DEBUG

ADMINS = ()

MANAGERS = ADMINS

SECRET_KEY = 'c628b1b3c0bdf2a3d14dbfcba1444f41'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': '/tmp/ginger-db',
        'USER': 'ingwer',
        'PASSWORD': 'ingwer',
        'HOST': '',
        'PORT': '',
    }
}

TIME_ZONE = None

LANGUAGE_CODE = 'en-us'

STATIC_URL = '/static/'
STATIC_ROOT = "/var/lib/ginger/static/"

TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
)

ROOT_URLCONF = 'ginger.urls'

TEMPLATE_DIRS = (os.path.abspath(os.path.dirname(__file__)) + "/templates", )

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.admin',
    'django.contrib.staticfiles',
    'ginger.main',
)

SUB_SITE = '/'

ALLOWED_HOSTS = ["*"]

# search for EXTERNAL_AUTH_HELPER in ginger manual
EXTERNAL_AUTH_HELPER = None # '/foo/ginger/authhelper'

try:
    from .settings_local import *
except ImportError:
    pass

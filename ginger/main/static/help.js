/* Copyright (C) 2010-2013, Josef Hahn and friend

 This file is part of Ginger.

 Ginger is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 Ginger is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with Ginger.  If not, see <http://www.gnu.org/licenses/>. */

function ShowHelp()
{
    var dlg = new ModalQuestionDialog("Ginger crash-course",
                                      "At first you have to add one or more feeds (i.e. search for rdf- or atom-"
                                      + "links on your favorite news sites).\n\n"
                                      + "You should then see a list of messages on the right side and filter panel"
                                      + "on the left side. On mobile clients, you have to switch between them"
                                      + "via main menu.\n\n"
                                      + "The message list shows a summary for each entry which currenty passes"
                                      + "through your filters (by default: all do). All actions on messages are"
                                      + "available from here.\n\n"
                                      + "The filter panel can be used to restrict the list of visible messages. "
                                      + "You can filter e.g. by one or more tags (for each feed you set up, "
                                      + "one tag will exist automatically and you can create more).\n\n"
                                      + "Keyboard control in the message list is possible as well by those "
                                      + "shortcuts:\n\n"
                                      + "ArrowUp/ArrowDown: navigation\n"
                                      + "ArrowRight: open website for message\n"
                                      + "Delete: delete selected message\n"
                                      + "Plus: expand/collapse the selected box\n"
                                      + "F: mark/unmark selected message as favorite\n"
                                      + "T: edit tags for the selected message"
                                     );
    dlg.btnproceed = false;
    dlg.show();
}
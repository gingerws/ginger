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

var _modal_zindex=50000;

function LoadingAnimation(div) {
    if (!div)
        div = $(document.body);
    this.ndiv = $("<div class='loadinganimation' style='z-index:"+_modal_zindex+";'></div>");
    _modal_zindex++;
    div.append(this.ndiv);
}

LoadingAnimation.prototype.makeVisible = function() {
    this.ndiv.addClass("visibleloadinganimation");
    ishortcutsenabled--;
    this.wasvisible = true;
}

LoadingAnimation.prototype.close = function() {
    if (this.wasvisible)
        ishortcutsenabled++;
    this.ndiv.remove();
}

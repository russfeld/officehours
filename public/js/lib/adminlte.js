function _init(){"use strict";$.AdminLTE.layout={activate:function(){var e=this;e.fix(),e.fixSidebar(),$(window,".wrapper").resize(function(){e.fix(),e.fixSidebar()})},fix:function(){var e=$(".main-header").outerHeight()+$(".main-footer").outerHeight(),i=$(window).height(),o=$(".sidebar").height();if($("body").hasClass("fixed"))$(".content-wrapper, .right-side").css("min-height",i-$(".main-footer").outerHeight());else{var n;i>=o?($(".content-wrapper, .right-side").css("min-height",i-e),n=i-e):($(".content-wrapper, .right-side").css("min-height",o),n=o);var t=$($.AdminLTE.options.controlSidebarOptions.selector);"undefined"!=typeof t&&t.height()>n&&$(".content-wrapper, .right-side").css("min-height",t.height())}},fixSidebar:function(){return $("body").hasClass("fixed")?("undefined"==typeof $.fn.slimScroll&&window.console&&window.console.error("Error: the fixed layout requires the slimscroll plugin!"),void($.AdminLTE.options.sidebarSlimScroll&&"undefined"!=typeof $.fn.slimScroll&&($(".sidebar").slimScroll({destroy:!0}).height("auto"),$(".sidebar").slimscroll({height:$(window).height()-$(".main-header").height()+"px",color:"rgba(0,0,0,0.2)",size:"3px"})))):void("undefined"!=typeof $.fn.slimScroll&&$(".sidebar").slimScroll({destroy:!0}).height("auto"))}},$.AdminLTE.pushMenu={activate:function(e){var i=$.AdminLTE.options.screenSizes;$(document).on("click",e,function(e){e.preventDefault(),$(window).width()>i.sm-1?$("body").hasClass("sidebar-collapse")?$("body").removeClass("sidebar-collapse").trigger("expanded.pushMenu"):$("body").addClass("sidebar-collapse").trigger("collapsed.pushMenu"):$("body").hasClass("sidebar-open")?$("body").removeClass("sidebar-open").removeClass("sidebar-collapse").trigger("collapsed.pushMenu"):$("body").addClass("sidebar-open").trigger("expanded.pushMenu")}),$(".content-wrapper").click(function(){$(window).width()<=i.sm-1&&$("body").hasClass("sidebar-open")&&$("body").removeClass("sidebar-open")}),($.AdminLTE.options.sidebarExpandOnHover||$("body").hasClass("fixed")&&$("body").hasClass("sidebar-mini"))&&this.expandOnHover()},expandOnHover:function(){var e=this,i=$.AdminLTE.options.screenSizes.sm-1;$(".main-sidebar").hover(function(){$("body").hasClass("sidebar-mini")&&$("body").hasClass("sidebar-collapse")&&$(window).width()>i&&e.expand()},function(){$("body").hasClass("sidebar-mini")&&$("body").hasClass("sidebar-expanded-on-hover")&&$(window).width()>i&&e.collapse()})},expand:function(){$("body").removeClass("sidebar-collapse").addClass("sidebar-expanded-on-hover")},collapse:function(){$("body").hasClass("sidebar-expanded-on-hover")&&$("body").removeClass("sidebar-expanded-on-hover").addClass("sidebar-collapse")}},$.AdminLTE.tree=function(e){var i=this,o=$.AdminLTE.options.animationSpeed;$(document).on("click",e+" li a",function(e){var n=$(this),t=n.next();if(t.is(".treeview-menu")&&t.is(":visible")&&!$("body").hasClass("sidebar-collapse"))t.slideUp(o,function(){t.removeClass("menu-open")}),t.parent("li").removeClass("active");else if(t.is(".treeview-menu")&&!t.is(":visible")){var s=n.parents("ul").first(),a=s.find("ul:visible").slideUp(o);a.removeClass("menu-open");var r=n.parent("li");t.slideDown(o,function(){t.addClass("menu-open"),s.find("li.active").removeClass("active"),r.addClass("active"),i.layout.fix()})}t.is(".treeview-menu")&&e.preventDefault()})},$.AdminLTE.controlSidebar={activate:function(){var e=this,i=$.AdminLTE.options.controlSidebarOptions,o=$(i.selector),n=$(i.toggleBtnSelector);n.on("click",function(n){n.preventDefault(),o.hasClass("control-sidebar-open")||$("body").hasClass("control-sidebar-open")?e.close(o,i.slide):e.open(o,i.slide)});var t=$(".control-sidebar-bg");e._fix(t),$("body").hasClass("fixed")?e._fixForFixed(o):$(".content-wrapper, .right-side").height()<o.height()&&e._fixForContent(o)},open:function(e,i){i?e.addClass("control-sidebar-open"):$("body").addClass("control-sidebar-open")},close:function(e,i){i?e.removeClass("control-sidebar-open"):$("body").removeClass("control-sidebar-open")},_fix:function(e){var i=this;$("body").hasClass("layout-boxed")?(e.css("position","absolute"),e.height($(".wrapper").height()),$(window).resize(function(){i._fix(e)})):e.css({position:"fixed",height:"auto"})},_fixForFixed:function(e){e.css({position:"fixed","max-height":"100%",overflow:"auto","padding-bottom":"50px"})},_fixForContent:function(e){$(".content-wrapper, .right-side").css("min-height",e.height())}},$.AdminLTE.boxWidget={selectors:$.AdminLTE.options.boxWidgetOptions.boxWidgetSelectors,icons:$.AdminLTE.options.boxWidgetOptions.boxWidgetIcons,animationSpeed:$.AdminLTE.options.animationSpeed,activate:function(e){var i=this;e||(e=document),$(e).on("click",i.selectors.collapse,function(e){e.preventDefault(),i.collapse($(this))}),$(e).on("click",i.selectors.remove,function(e){e.preventDefault(),i.remove($(this))})},collapse:function(e){var i=this,o=e.parents(".box").first(),n=o.find("> .box-body, > .box-footer, > form  >.box-body, > form > .box-footer");o.hasClass("collapsed-box")?(e.children(":first").removeClass(i.icons.open).addClass(i.icons.collapse),n.slideDown(i.animationSpeed,function(){o.removeClass("collapsed-box")})):(e.children(":first").removeClass(i.icons.collapse).addClass(i.icons.open),n.slideUp(i.animationSpeed,function(){o.addClass("collapsed-box")}))},remove:function(e){var i=e.parents(".box").first();i.slideUp(this.animationSpeed)}}}if("undefined"==typeof jQuery)throw new Error("AdminLTE requires jQuery");$.AdminLTE={},$.AdminLTE.options={navbarMenuSlimscroll:!0,navbarMenuSlimscrollWidth:"3px",navbarMenuHeight:"200px",animationSpeed:500,sidebarToggleSelector:"[data-toggle='offcanvas']",sidebarPushMenu:!0,sidebarSlimScroll:!0,sidebarExpandOnHover:!1,enableBoxRefresh:!0,enableBSToppltip:!0,BSTooltipSelector:"[data-toggle='tooltip']",enableFastclick:!0,enableControlSidebar:!0,controlSidebarOptions:{toggleBtnSelector:"[data-toggle='control-sidebar']",selector:".control-sidebar",slide:!0},enableBoxWidget:!0,boxWidgetOptions:{boxWidgetIcons:{collapse:"fa-minus",open:"fa-plus",remove:"fa-times"},boxWidgetSelectors:{remove:'[data-widget="remove"]',collapse:'[data-widget="collapse"]'}},directChat:{enable:!0,contactToggleSelector:'[data-widget="chat-pane-toggle"]'},colors:{lightBlue:"#3c8dbc",red:"#f56954",green:"#00a65a",aqua:"#00c0ef",yellow:"#f39c12",blue:"#0073b7",navy:"#001F3F",teal:"#39CCCC",olive:"#3D9970",lime:"#01FF70",orange:"#FF851B",fuchsia:"#F012BE",purple:"#8E24AA",maroon:"#D81B60",black:"#222222",gray:"#d2d6de"},screenSizes:{xs:480,sm:768,md:992,lg:1200}},$(function(){"use strict";$("body").removeClass("hold-transition"),"undefined"!=typeof AdminLTEOptions&&$.extend(!0,$.AdminLTE.options,AdminLTEOptions);var e=$.AdminLTE.options;_init(),$.AdminLTE.layout.activate(),$.AdminLTE.tree(".sidebar"),e.enableControlSidebar&&$.AdminLTE.controlSidebar.activate(),e.navbarMenuSlimscroll&&"undefined"!=typeof $.fn.slimscroll&&$(".navbar .menu").slimscroll({height:e.navbarMenuHeight,alwaysVisible:!1,size:e.navbarMenuSlimscrollWidth}).css("width","100%"),e.sidebarPushMenu&&$.AdminLTE.pushMenu.activate(e.sidebarToggleSelector),e.enableBSToppltip&&$("body").tooltip({selector:e.BSTooltipSelector}),e.enableBoxWidget&&$.AdminLTE.boxWidget.activate(),e.enableFastclick&&"undefined"!=typeof FastClick&&FastClick.attach(document.body),e.directChat.enable&&$(document).on("click",e.directChat.contactToggleSelector,function(){var e=$(this).parents(".direct-chat").first();e.toggleClass("direct-chat-contacts-open")}),$('.btn-group[data-toggle="btn-toggle"]').each(function(){var e=$(this);$(this).find(".btn").on("click",function(i){e.find(".btn.active").removeClass("active"),$(this).addClass("active"),i.preventDefault()})})}),function(e){"use strict";e.fn.boxRefresh=function(i){function o(e){e.append(s),t.onLoadStart.call(e)}function n(e){e.find(s).remove(),t.onLoadDone.call(e)}var t=e.extend({trigger:".refresh-btn",source:"",onLoadStart:function(e){return e},onLoadDone:function(e){return e}},i),s=e('<div class="overlay"><div class="fa fa-refresh fa-spin"></div></div>');return this.each(function(){if(""===t.source)return void(window.console&&window.console.log("Please specify a source first - boxRefresh()"));var i=e(this),s=i.find(t.trigger).first();s.on("click",function(e){e.preventDefault(),o(i),i.find(".box-body").load(t.source,function(){n(i)})})})}}(jQuery),function(e){"use strict";e.fn.activateBox=function(){e.AdminLTE.boxWidget.activate(this)},e.fn.toggleBox=function(){var i=e(e.AdminLTE.boxWidget.selectors.collapse,this);e.AdminLTE.boxWidget.collapse(i)},e.fn.removeBox=function(){var i=e(e.AdminLTE.boxWidget.selectors.remove,this);e.AdminLTE.boxWidget.remove(i)}}(jQuery),function(e){"use strict";e.fn.todolist=function(i){var o=e.extend({onCheck:function(e){return e},onUncheck:function(e){return e}},i);return this.each(function(){"undefined"!=typeof e.fn.iCheck?(e("input",this).on("ifChecked",function(){var i=e(this).parents("li").first();i.toggleClass("done"),o.onCheck.call(i)}),e("input",this).on("ifUnchecked",function(){var i=e(this).parents("li").first();i.toggleClass("done"),o.onUncheck.call(i)})):e("input",this).on("change",function(){var i=e(this).parents("li").first();i.toggleClass("done"),e("input",i).is(":checked")?o.onCheck.call(i):o.onUncheck.call(i)})})}}(jQuery);
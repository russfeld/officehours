webpackJsonp([1],{

/***/ 10:
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(5));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

var htmlConfig = {
  autoSelfClosers: {'area': true, 'base': true, 'br': true, 'col': true, 'command': true,
                    'embed': true, 'frame': true, 'hr': true, 'img': true, 'input': true,
                    'keygen': true, 'link': true, 'meta': true, 'param': true, 'source': true,
                    'track': true, 'wbr': true, 'menuitem': true},
  implicitlyClosed: {'dd': true, 'li': true, 'optgroup': true, 'option': true, 'p': true,
                     'rp': true, 'rt': true, 'tbody': true, 'td': true, 'tfoot': true,
                     'th': true, 'tr': true},
  contextGrabbers: {
    'dd': {'dd': true, 'dt': true},
    'dt': {'dd': true, 'dt': true},
    'li': {'li': true},
    'option': {'option': true, 'optgroup': true},
    'optgroup': {'optgroup': true},
    'p': {'address': true, 'article': true, 'aside': true, 'blockquote': true, 'dir': true,
          'div': true, 'dl': true, 'fieldset': true, 'footer': true, 'form': true,
          'h1': true, 'h2': true, 'h3': true, 'h4': true, 'h5': true, 'h6': true,
          'header': true, 'hgroup': true, 'hr': true, 'menu': true, 'nav': true, 'ol': true,
          'p': true, 'pre': true, 'section': true, 'table': true, 'ul': true},
    'rp': {'rp': true, 'rt': true},
    'rt': {'rp': true, 'rt': true},
    'tbody': {'tbody': true, 'tfoot': true},
    'td': {'td': true, 'th': true},
    'tfoot': {'tbody': true},
    'th': {'td': true, 'th': true},
    'thead': {'tbody': true, 'tfoot': true},
    'tr': {'tr': true}
  },
  doNotIndent: {"pre": true},
  allowUnquoted: true,
  allowMissing: true,
  caseFold: true
}

var xmlConfig = {
  autoSelfClosers: {},
  implicitlyClosed: {},
  contextGrabbers: {},
  doNotIndent: {},
  allowUnquoted: false,
  allowMissing: false,
  allowMissingTagName: false,
  caseFold: false
}

CodeMirror.defineMode("xml", function(editorConf, config_) {
  var indentUnit = editorConf.indentUnit
  var config = {}
  var defaults = config_.htmlMode ? htmlConfig : xmlConfig
  for (var prop in defaults) config[prop] = defaults[prop]
  for (var prop in config_) config[prop] = config_[prop]

  // Return variables for tokenizers
  var type, setStyle;

  function inText(stream, state) {
    function chain(parser) {
      state.tokenize = parser;
      return parser(stream, state);
    }

    var ch = stream.next();
    if (ch == "<") {
      if (stream.eat("!")) {
        if (stream.eat("[")) {
          if (stream.match("CDATA[")) return chain(inBlock("atom", "]]>"));
          else return null;
        } else if (stream.match("--")) {
          return chain(inBlock("comment", "-->"));
        } else if (stream.match("DOCTYPE", true, true)) {
          stream.eatWhile(/[\w\._\-]/);
          return chain(doctype(1));
        } else {
          return null;
        }
      } else if (stream.eat("?")) {
        stream.eatWhile(/[\w\._\-]/);
        state.tokenize = inBlock("meta", "?>");
        return "meta";
      } else {
        type = stream.eat("/") ? "closeTag" : "openTag";
        state.tokenize = inTag;
        return "tag bracket";
      }
    } else if (ch == "&") {
      var ok;
      if (stream.eat("#")) {
        if (stream.eat("x")) {
          ok = stream.eatWhile(/[a-fA-F\d]/) && stream.eat(";");
        } else {
          ok = stream.eatWhile(/[\d]/) && stream.eat(";");
        }
      } else {
        ok = stream.eatWhile(/[\w\.\-:]/) && stream.eat(";");
      }
      return ok ? "atom" : "error";
    } else {
      stream.eatWhile(/[^&<]/);
      return null;
    }
  }
  inText.isInText = true;

  function inTag(stream, state) {
    var ch = stream.next();
    if (ch == ">" || (ch == "/" && stream.eat(">"))) {
      state.tokenize = inText;
      type = ch == ">" ? "endTag" : "selfcloseTag";
      return "tag bracket";
    } else if (ch == "=") {
      type = "equals";
      return null;
    } else if (ch == "<") {
      state.tokenize = inText;
      state.state = baseState;
      state.tagName = state.tagStart = null;
      var next = state.tokenize(stream, state);
      return next ? next + " tag error" : "tag error";
    } else if (/[\'\"]/.test(ch)) {
      state.tokenize = inAttribute(ch);
      state.stringStartCol = stream.column();
      return state.tokenize(stream, state);
    } else {
      stream.match(/^[^\s\u00a0=<>\"\']*[^\s\u00a0=<>\"\'\/]/);
      return "word";
    }
  }

  function inAttribute(quote) {
    var closure = function(stream, state) {
      while (!stream.eol()) {
        if (stream.next() == quote) {
          state.tokenize = inTag;
          break;
        }
      }
      return "string";
    };
    closure.isInAttribute = true;
    return closure;
  }

  function inBlock(style, terminator) {
    return function(stream, state) {
      while (!stream.eol()) {
        if (stream.match(terminator)) {
          state.tokenize = inText;
          break;
        }
        stream.next();
      }
      return style;
    }
  }

  function doctype(depth) {
    return function(stream, state) {
      var ch;
      while ((ch = stream.next()) != null) {
        if (ch == "<") {
          state.tokenize = doctype(depth + 1);
          return state.tokenize(stream, state);
        } else if (ch == ">") {
          if (depth == 1) {
            state.tokenize = inText;
            break;
          } else {
            state.tokenize = doctype(depth - 1);
            return state.tokenize(stream, state);
          }
        }
      }
      return "meta";
    };
  }

  function Context(state, tagName, startOfLine) {
    this.prev = state.context;
    this.tagName = tagName;
    this.indent = state.indented;
    this.startOfLine = startOfLine;
    if (config.doNotIndent.hasOwnProperty(tagName) || (state.context && state.context.noIndent))
      this.noIndent = true;
  }
  function popContext(state) {
    if (state.context) state.context = state.context.prev;
  }
  function maybePopContext(state, nextTagName) {
    var parentTagName;
    while (true) {
      if (!state.context) {
        return;
      }
      parentTagName = state.context.tagName;
      if (!config.contextGrabbers.hasOwnProperty(parentTagName) ||
          !config.contextGrabbers[parentTagName].hasOwnProperty(nextTagName)) {
        return;
      }
      popContext(state);
    }
  }

  function baseState(type, stream, state) {
    if (type == "openTag") {
      state.tagStart = stream.column();
      return tagNameState;
    } else if (type == "closeTag") {
      return closeTagNameState;
    } else {
      return baseState;
    }
  }
  function tagNameState(type, stream, state) {
    if (type == "word") {
      state.tagName = stream.current();
      setStyle = "tag";
      return attrState;
    } else if (config.allowMissingTagName && type == "endTag") {
      setStyle = "tag bracket";
      return attrState(type, stream, state);
    } else {
      setStyle = "error";
      return tagNameState;
    }
  }
  function closeTagNameState(type, stream, state) {
    if (type == "word") {
      var tagName = stream.current();
      if (state.context && state.context.tagName != tagName &&
          config.implicitlyClosed.hasOwnProperty(state.context.tagName))
        popContext(state);
      if ((state.context && state.context.tagName == tagName) || config.matchClosing === false) {
        setStyle = "tag";
        return closeState;
      } else {
        setStyle = "tag error";
        return closeStateErr;
      }
    } else if (config.allowMissingTagName && type == "endTag") {
      setStyle = "tag bracket";
      return closeState(type, stream, state);
    } else {
      setStyle = "error";
      return closeStateErr;
    }
  }

  function closeState(type, _stream, state) {
    if (type != "endTag") {
      setStyle = "error";
      return closeState;
    }
    popContext(state);
    return baseState;
  }
  function closeStateErr(type, stream, state) {
    setStyle = "error";
    return closeState(type, stream, state);
  }

  function attrState(type, _stream, state) {
    if (type == "word") {
      setStyle = "attribute";
      return attrEqState;
    } else if (type == "endTag" || type == "selfcloseTag") {
      var tagName = state.tagName, tagStart = state.tagStart;
      state.tagName = state.tagStart = null;
      if (type == "selfcloseTag" ||
          config.autoSelfClosers.hasOwnProperty(tagName)) {
        maybePopContext(state, tagName);
      } else {
        maybePopContext(state, tagName);
        state.context = new Context(state, tagName, tagStart == state.indented);
      }
      return baseState;
    }
    setStyle = "error";
    return attrState;
  }
  function attrEqState(type, stream, state) {
    if (type == "equals") return attrValueState;
    if (!config.allowMissing) setStyle = "error";
    return attrState(type, stream, state);
  }
  function attrValueState(type, stream, state) {
    if (type == "string") return attrContinuedState;
    if (type == "word" && config.allowUnquoted) {setStyle = "string"; return attrState;}
    setStyle = "error";
    return attrState(type, stream, state);
  }
  function attrContinuedState(type, stream, state) {
    if (type == "string") return attrContinuedState;
    return attrState(type, stream, state);
  }

  return {
    startState: function(baseIndent) {
      var state = {tokenize: inText,
                   state: baseState,
                   indented: baseIndent || 0,
                   tagName: null, tagStart: null,
                   context: null}
      if (baseIndent != null) state.baseIndent = baseIndent
      return state
    },

    token: function(stream, state) {
      if (!state.tagName && stream.sol())
        state.indented = stream.indentation();

      if (stream.eatSpace()) return null;
      type = null;
      var style = state.tokenize(stream, state);
      if ((style || type) && style != "comment") {
        setStyle = null;
        state.state = state.state(type || style, stream, state);
        if (setStyle)
          style = setStyle == "error" ? style + " error" : setStyle;
      }
      return style;
    },

    indent: function(state, textAfter, fullLine) {
      var context = state.context;
      // Indent multi-line strings (e.g. css).
      if (state.tokenize.isInAttribute) {
        if (state.tagStart == state.indented)
          return state.stringStartCol + 1;
        else
          return state.indented + indentUnit;
      }
      if (context && context.noIndent) return CodeMirror.Pass;
      if (state.tokenize != inTag && state.tokenize != inText)
        return fullLine ? fullLine.match(/^(\s*)/)[0].length : 0;
      // Indent the starts of attribute names.
      if (state.tagName) {
        if (config.multilineTagIndentPastTag !== false)
          return state.tagStart + state.tagName.length + 2;
        else
          return state.tagStart + indentUnit * (config.multilineTagIndentFactor || 1);
      }
      if (config.alignCDATA && /<!\[CDATA\[/.test(textAfter)) return 0;
      var tagAfter = textAfter && /^<(\/)?([\w_:\.-]*)/.exec(textAfter);
      if (tagAfter && tagAfter[1]) { // Closing tag spotted
        while (context) {
          if (context.tagName == tagAfter[2]) {
            context = context.prev;
            break;
          } else if (config.implicitlyClosed.hasOwnProperty(context.tagName)) {
            context = context.prev;
          } else {
            break;
          }
        }
      } else if (tagAfter) { // Opening tag spotted
        while (context) {
          var grabbers = config.contextGrabbers[context.tagName];
          if (grabbers && grabbers.hasOwnProperty(tagAfter[2]))
            context = context.prev;
          else
            break;
        }
      }
      while (context && context.prev && !context.startOfLine)
        context = context.prev;
      if (context) return context.indent + indentUnit;
      else return state.baseIndent || 0;
    },

    electricInput: /<\/[\s\w:]+>$/,
    blockCommentStart: "<!--",
    blockCommentEnd: "-->",

    configuration: config.htmlMode ? "html" : "xml",
    helperType: config.htmlMode ? "html" : "xml",

    skipAttribute: function(state) {
      if (state.state == attrValueState)
        state.state = attrState
    },

    xmlCurrentTag: function(state) {
      return state.tagName ? {name: state.tagName, close: state.type == "closeTag"} : null
    },

    xmlCurrentContext: function(state) {
      var context = []
      for (var cx = state.context; cx; cx = cx.prev)
        if (cx.tagName) context.push(cx.tagName)
      return context.reverse()
    }
  };
});

CodeMirror.defineMIME("text/xml", "xml");
CodeMirror.defineMIME("application/xml", "xml");
if (!CodeMirror.mimeModes.hasOwnProperty("text/html"))
  CodeMirror.defineMIME("text/html", {name: "xml", htmlMode: true});

});


/***/ }),

/***/ 158:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {var dashboard = __webpack_require__(2);

exports.init = function () {
  var options = dashboard.dataTableOptions;
  options.dom = '<"newbutton">frtip';
  dashboard.init(options);

  $("div.newbutton").html('<a type="button" class="btn btn-success" href="/admin/newstudent">New Student</a>');

  $('#save').on('click', function () {
    var data = {
      first_name: $('#first_name').val(),
      last_name: $('#last_name').val(),
      email: $('#email').val()
    };
    if ($('#advisor_id').val() > 0) {
      data.advisor_id = $('#advisor_id').val();
    }
    if ($('#department_id').val() > 0) {
      data.department_id = $('#department_id').val();
    }
    var id = $('#id').val();
    data.eid = $('#eid').val();
    if (id.length == 0) {
      var url = '/admin/newstudent';
    } else {
      var url = '/admin/students/' + id;
    }
    dashboard.ajaxsave(data, url, id);
  });

  $('#delete').on('click', function () {
    var url = "/admin/deletestudent";
    var retUrl = "/admin/students";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxdelete(data, url, retUrl, true);
  });

  $('#forcedelete').on('click', function () {
    var url = "/admin/forcedeletestudent";
    var retUrl = "/admin/students";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxdelete(data, url, retUrl);
  });

  $('#restore').on('click', function () {
    var url = "/admin/restorestudent";
    var retUrl = "/admin/students";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxrestore(data, url, retUrl);
  });
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 159:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {var dashboard = __webpack_require__(2);
__webpack_require__(5);
__webpack_require__(10);
__webpack_require__(8);

exports.init = function () {
  var options = dashboard.dataTableOptions;
  options.dom = '<"newbutton">frtip';
  dashboard.init(options);

  $("div.newbutton").html('<a type="button" class="btn btn-success" href="/admin/newadvisor">New Advisor</a>');

  $('#notes').summernote({
    focus: true,
    toolbar: [
    // [groupName, [list of buttons]]
    ['style', ['style', 'bold', 'italic', 'underline', 'clear']], ['font', ['strikethrough', 'superscript', 'subscript', 'link']], ['para', ['ul', 'ol', 'paragraph']], ['misc', ['fullscreen', 'codeview', 'help']]],
    tabsize: 2,
    codemirror: {
      mode: 'text/html',
      htmlMode: true,
      lineNumbers: true,
      theme: 'monokai'
    }
  });

  $('#save').on('click', function () {
    var formData = new FormData($('form')[0]);
    formData.append("name", $('#name').val());
    formData.append("email", $('#email').val());
    formData.append("office", $('#office').val());
    formData.append("phone", $('#phone').val());
    formData.append("notes", $('#notes').val());
    formData.append("hidden", $('#hidden').is(':checked') ? 1 : 0);
    if ($('#pic').val()) {
      formData.append("pic", $('#pic')[0].files[0]);
    }
    if ($('#department_id').val() > 0) {
      formData.append("department_id", $('#department_id').val());
    }
    var id = $('#id').val();
    if (id.length == 0) {
      formData.append("eid", $('#eid').val());
      var url = '/admin/newadvisor';
    } else {
      formData.append("eid", $('#eid').val());
      var url = '/admin/advisors/' + id;
    }
    dashboard.ajaxsave(formData, url, id, true);
  });

  $('#delete').on('click', function () {
    var url = "/admin/deleteadvisor";
    var retUrl = "/admin/advisors";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxdelete(data, url, retUrl, true);
  });

  $('#forcedelete').on('click', function () {
    var url = "/admin/forcedeleteadvisor";
    var retUrl = "/admin/advisors";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxdelete(data, url, retUrl);
  });

  $('#restore').on('click', function () {
    var url = "/admin/restoreadvisor";
    var retUrl = "/admin/advisors";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxrestore(data, url, retUrl);
  });

  $(document).on('change', '.btn-file :file', function () {
    var input = $(this),
        numFiles = input.get(0).files ? input.get(0).files.length : 1,
        label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    input.trigger('fileselect', [numFiles, label]);
  });

  $('.btn-file :file').on('fileselect', function (event, numFiles, label) {

    var input = $(this).parents('.input-group').find(':text'),
        log = numFiles > 1 ? numFiles + ' files selected' : label;

    if (input.length) {
      input.val(log);
    } else {
      if (log) alert(log);
    }
  });
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 160:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {var dashboard = __webpack_require__(2);

exports.init = function () {
  var options = dashboard.dataTableOptions;
  options.dom = '<"newbutton">frtip';
  dashboard.init(options);

  $("div.newbutton").html('<a type="button" class="btn btn-success" href="/admin/newdepartment">New Department</a>');

  $('#save').on('click', function () {
    var data = {
      name: $('#name').val(),
      email: $('#email').val(),
      office: $('#office').val(),
      phone: $('#phone').val()
    };
    var id = $('#id').val();
    if (id.length == 0) {
      var url = '/admin/newdepartment';
    } else {
      var url = '/admin/departments/' + id;
    }
    dashboard.ajaxsave(data, url, id);
  });

  $('#delete').on('click', function () {
    var url = "/admin/deletedepartment";
    var retUrl = "/admin/departments";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxdelete(data, url, retUrl, true);
  });

  $('#forcedelete').on('click', function () {
    var url = "/admin/forcedeletedepartment";
    var retUrl = "/admin/departments";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxdelete(data, url, retUrl);
  });

  $('#restore').on('click', function () {
    var url = "/admin/restoredepartment";
    var retUrl = "/admin/departments";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxrestore(data, url, retUrl);
  });
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 161:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {var dashboard = __webpack_require__(2);

exports.init = function () {
  var options = dashboard.dataTableOptions;
  options.dom = '<"newbutton">frtip';
  dashboard.init(options);

  $("div.newbutton").html('<a type="button" class="btn btn-success" href="/admin/newgroupsessionlist">New Groupsession List</a>');

  $('#save').on('click', function () {
    var data = {
      name: $('#name').val()
    };
    var id = $('#id').val();
    if (id.length == 0) {
      var url = '/admin/newgroupsessionlist';
    } else {
      var url = '/admin/groupsessionlists/' + id;
    }
    dashboard.ajaxsave(data, url, id);
  });

  $('#delete').on('click', function () {
    var url = "/admin/deletegroupsessionlist";
    var retUrl = "/admin/groupsessionlists";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxdelete(data, url, retUrl, true);
  });
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 162:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {var dashboard = __webpack_require__(2);

exports.init = function () {
  var options = dashboard.dataTableOptions;
  options.dom = '<"newbutton">frtip';
  dashboard.init(options);

  $("div.newbutton").html('<a type="button" class="btn btn-success" href="/admin/newdegreeprogram">New Degree Program</a>');

  $('#save').on('click', function () {
    var data = {
      name: $('#name').val(),
      abbreviation: $('#abbreviation').val(),
      description: $('#description').val(),
      effective_year: $('#effective_year').val(),
      effective_semester: $('#effective_semester').val()
    };
    if ($('#department_id').val() > 0) {
      data.department_id = $('#department_id').val();
    }
    var id = $('#id').val();
    if (id.length == 0) {
      var url = '/admin/newdegreeprogram';
    } else {
      var url = '/admin/degreeprograms/' + id;
    }
    dashboard.ajaxsave(data, url, id);
  });

  $('#delete').on('click', function () {
    var url = "/admin/deletedegreeprogram";
    var retUrl = "/admin/degreeprograms";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxdelete(data, url, retUrl, true);
  });

  $('#forcedelete').on('click', function () {
    var url = "/admin/forcedeletedegreeprogram";
    var retUrl = "/admin/degreeprograms";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxdelete(data, url, retUrl);
  });

  $('#restore').on('click', function () {
    var url = "/admin/restoredegreeprogram";
    var retUrl = "/admin/degreeprograms";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxrestore(data, url, retUrl);
  });
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 163:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {var dashboard = __webpack_require__(2);

exports.init = function () {
  var options = dashboard.dataTableOptions;
  options.dom = '<"newbutton">frtip';
  dashboard.init(options);

  $("div.newbutton").html('<a type="button" class="btn btn-success" href="/admin/newelectivelist">New Elective List</a>');

  $('#save').on('click', function () {
    var data = {
      name: $('#name').val(),
      abbreviation: $('#abbreviation').val(),
      description: $('#description').val()
    };
    var id = $('#id').val();
    if (id.length == 0) {
      var url = '/admin/newelectivelist';
    } else {
      var url = '/admin/electivelists/' + id;
    }
    dashboard.ajaxsave(data, url, id);
  });

  $('#delete').on('click', function () {
    var url = "/admin/deleteelectivelist";
    var retUrl = "/admin/electivelists";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxdelete(data, url, retUrl, true);
  });

  $('#forcedelete').on('click', function () {
    var url = "/admin/forcedeleteelectivelist";
    var retUrl = "/admin/electivelists";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxdelete(data, url, retUrl);
  });

  $('#restore').on('click', function () {
    var url = "/admin/restoreelectivelist";
    var retUrl = "/admin/electivelists";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxrestore(data, url, retUrl);
  });
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 164:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {var dashboard = __webpack_require__(2);

exports.init = function () {
  var options = dashboard.dataTableOptions;
  options.dom = '<"newbutton">frtip';
  dashboard.init(options);

  $("div.newbutton").html('<a type="button" class="btn btn-success" href="/admin/newplan">New Plan</a>');

  $('#save').on('click', function () {
    var data = {
      name: $('#name').val(),
      description: $('#description').val(),
      start_year: $('#start_year').val(),
      start_semester: $('#start_semester').val(),
      degreeprogram_id: $('#degreeprogram_id').val(),
      student_id: $('#student_id').val()
    };
    var id = $('#id').val();
    if (id.length == 0) {
      var url = '/admin/newplan';
    } else {
      var url = '/admin/plans/' + id;
    }
    dashboard.ajaxsave(data, url, id);
  });

  $('#delete').on('click', function () {
    var url = "/admin/deleteplan";
    var retUrl = "/admin/plans";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxdelete(data, url, retUrl, true);
  });

  $('#forcedelete').on('click', function () {
    var url = "/admin/forcedeleteplan";
    var retUrl = "/admin/plans";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxdelete(data, url, retUrl);
  });

  $('#restore').on('click', function () {
    var url = "/admin/restoreplan";
    var retUrl = "/admin/plans";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxrestore(data, url, retUrl);
  });

  $('#repopulate').on('click', function () {
    var choice = confirm("Are you sure? This will permanently remove all requirements and repopulate them based on the selected degree program. You cannot undo this action.");
    if (choice === true) {
      var url = "/admin/populateplan";
      var data = {
        id: $('#id').val()
      };
      dashboard.ajaxsave(data, url, id);
    }
  });

  dashboard.ajaxautocomplete('student_id', '/profile/studentfeed');
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 165:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {var dashboard = __webpack_require__(2);

exports.init = function () {

  dashboard.init();

  $('#save').on('click', function () {
    var data = {
      name: $('#name').val(),
      ordering: $('#ordering').val(),
      plan_id: $('#plan_id').val()
    };
    var id = $('#id').val();
    if (id.length == 0) {
      var url = '/admin/plans/newplansemester/' + $('#plan_id').val();
    } else {
      var url = '/admin/plans/plansemester/' + id;
    }
    dashboard.ajaxsave(data, url, id);
  });

  $('#delete').on('click', function () {
    var url = "/admin/plans/deleteplansemester/" + $('#id').val();
    var retUrl = "/admin/plans/" + $('#plan_id').val();
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxdelete(data, url, retUrl, true);
  });
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 166:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {var dashboard = __webpack_require__(2);

exports.init = function () {
  var options = dashboard.dataTableOptions;
  options.dom = '<"newbutton">frtip';
  dashboard.init(options);

  $("div.newbutton").html('<a type="button" class="btn btn-success" href="/admin/newcompletedcourse">New Completed Course</a>');

  $('#save').on('click', function () {
    var data = {
      coursenumber: $('#coursenumber').val(),
      name: $('#name').val(),
      year: $('#year').val(),
      semester: $('#semester').val(),
      basis: $('#basis').val(),
      grade: $('#grade').val(),
      credits: $('#credits').val(),
      degreeprogram_id: $('#degreeprogram_id').val(),
      student_id: $('#student_id').val()
    };
    if ($('#student_id').val() > 0) {
      data.student_id = $('#student_id').val();
    }
    var selected = $("input[name='transfer']:checked");
    if (selected.length > 0) {
      var selectedVal = selected.val();
      if (selectedVal == 1) {
        data.transfer = false;
      } else if (selectedVal == 2) {
        data.transfer = true;
        data.incoming_institution = $('#incoming_institution').val();
        data.incoming_name = $('#incoming_name').val();
        data.incoming_description = $('#incoming_description').val();
        data.incoming_semester = $('#incoming_semester').val();
        data.incoming_credits = $('#incoming_credits').val();
        data.incoming_grade = $('#incoming_grade').val();
      }
    }
    var id = $('#id').val();
    if (id.length == 0) {
      var url = '/admin/newcompletedcourse';
    } else {
      var url = '/admin/completedcourses/' + id;
    }
    dashboard.ajaxsave(data, url, id);
  });

  $('#delete').on('click', function () {
    var url = "/admin/deletecompletedcourse";
    var retUrl = "/admin/completedcourses";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxdelete(data, url, retUrl);
  });

  $('input[name=transfer]').on('change', showselected);

  dashboard.ajaxautocomplete('student_id', '/profile/studentfeed');

  if ($('#transfercourse').is(':hidden')) {
    $('#transfer1').prop('checked', true);
  } else {
    $('#transfer2').prop('checked', true);
  }
};

/**
 * Determine which div to show in the form
 */
var showselected = function showselected() {
  //https://stackoverflow.com/questions/8622336/jquery-get-value-of-selected-radio-button
  var selected = $("input[name='transfer']:checked");
  if (selected.length > 0) {
    var selectedVal = selected.val();
    if (selectedVal == 1) {
      $('#kstatecourse').show();
      $('#transfercourse').hide();
    } else if (selectedVal == 2) {
      $('#kstatecourse').hide();
      $('#transfercourse').show();
    }
  }
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 169:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {var dashboard = __webpack_require__(2);

exports.init = function () {
  $('#save').on('click', function () {
    var data = {
      name: $('#name').val(),
      description: $('#description').val(),
      start_year: $('#start_year').val(),
      start_semester: $('#start_semester').val(),
      degreeprogram_id: $('#degreeprogram_id').val()
    };
    var id = $('#id').val();
    var student_id = $('#student_id').val();
    if (id.length == 0) {
      var url = '/flowcharts/new/' + student_id;
    } else {
      var url = '/flowcharts/edit/' + id;
    }
    dashboard.ajaxsave(data, url, id);
  });

  $('#delete').on('click', function () {
    var student_id = $('#student_id').val();
    var url = "/flowcharts/delete";
    var retUrl = "/flowcharts/" + student_id;
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxdelete(data, url, retUrl, true);
  });

  $('#repopulate').on('click', function () {
    var choice = confirm("Are you sure? This will permanently remove all requirements and repopulate them based on the selected degree program. You cannot undo this action.");
    if (choice === true) {
      var url = "/flowcharts/reset";
      var data = {
        id: $('#id').val()
      };
      dashboard.ajaxsave(data, url, id);
    }
  });
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 170:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(171);
__webpack_require__(218);
module.exports = __webpack_require__(219);


/***/ }),

/***/ 171:
/***/ (function(module, exports, __webpack_require__) {

//https://laravel.com/docs/5.4/mix#working-with-scripts
//https://andy-carter.com/blog/scoping-javascript-functionality-to-specific-pages-with-laravel-and-cakephp

//Load site-wide libraries in bootstrap file
__webpack_require__(172);

var App = {

	// Controller-action methods
	actions: {
		//Index for directly created views with no explicit controller
		RootRouteController: {
			getIndex: function getIndex() {
				var editable = __webpack_require__(7);
				editable.init();
				var site = __webpack_require__(4);
				site.checkMessage();
			},
			getAbout: function getAbout() {
				var editable = __webpack_require__(7);
				editable.init();
				var site = __webpack_require__(4);
				site.checkMessage();
			}
		},

		//Advising Controller for routes at /advising
		AdvisingController: {
			//advising/index
			getIndex: function getIndex() {
				var calendar = __webpack_require__(202);
				calendar.init();
			}
		},

		//Groupsession Controller for routes at /groupsession
		GroupsessionController: {
			//groupsession/index
			getIndex: function getIndex() {
				var editable = __webpack_require__(7);
				editable.init();
				var site = __webpack_require__(4);
				site.checkMessage();
			},
			//groupsesion/list
			getList: function getList() {
				var groupsession = __webpack_require__(204);
				groupsession.init();
			}
		},

		//Profiles Controller for routes at /profile
		ProfilesController: {
			//profile/index
			getIndex: function getIndex() {
				var profile = __webpack_require__(208);
				profile.init();
			}
		},

		//Dashboard Controller for routes at /admin-lte
		DashboardController: {
			//admin/index
			getIndex: function getIndex() {
				var dashboard = __webpack_require__(2);
				dashboard.init();
			}
		},

		StudentsController: {
			//admin/students
			getStudents: function getStudents() {
				var studentedit = __webpack_require__(158);
				studentedit.init();
			},
			//admin/newstudent
			getNewstudent: function getNewstudent() {
				var studentedit = __webpack_require__(158);
				studentedit.init();
			}
		},

		AdvisorsController: {
			//admin/advisors
			getAdvisors: function getAdvisors() {
				var advisoredit = __webpack_require__(159);
				advisoredit.init();
			},
			//admin/newadvisor
			getNewadvisor: function getNewadvisor() {
				var advisoredit = __webpack_require__(159);
				advisoredit.init();
			}
		},

		DepartmentsController: {
			//admin/departments
			getDepartments: function getDepartments() {
				var departmentedit = __webpack_require__(160);
				departmentedit.init();
			},
			//admin/newdepartment
			getNewdepartment: function getNewdepartment() {
				var departmentedit = __webpack_require__(160);
				departmentedit.init();
			}
		},

		GroupsessionlistsController: {
			//admin/groupsessionlists
			getGroupsessionlists: function getGroupsessionlists() {
				var groupsessionlistedit = __webpack_require__(161);
				groupsessionlistedit.init();
			},
			//admin/newgroupsessionlist
			getNewgroupsessionlist: function getNewgroupsessionlist() {
				var groupsessionlistedit = __webpack_require__(161);
				groupsessionlistedit.init();
			}
		},

		MeetingsController: {
			//admin/meetings
			getMeetings: function getMeetings() {
				var meetingedit = __webpack_require__(209);
				meetingedit.init();
			}
		},

		BlackoutsController: {
			//admin/blackouts
			getBlackouts: function getBlackouts() {
				var blackoutedit = __webpack_require__(210);
				blackoutedit.init();
			}
		},

		GroupsessionsController: {
			//admin/groupsessions
			getGroupsessions: function getGroupsessions() {
				var groupsessionedit = __webpack_require__(211);
				groupsessionedit.init();
			}
		},

		SettingsController: {
			//admin/settings
			getSettings: function getSettings() {
				var settings = __webpack_require__(212);
				settings.init();
			}
		},

		DegreeprogramsController: {
			//admin/degreeprograms
			getDegreeprograms: function getDegreeprograms() {
				var degreeprogramedit = __webpack_require__(162);
				degreeprogramedit.init();
			},
			//admin/degreeprogram/{id}
			getDegreeprogramDetail: function getDegreeprogramDetail() {
				var degreeprogramedit = __webpack_require__(213);
				degreeprogramedit.init();
			},
			//admin/newdegreeprogram
			getNewdegreeprogram: function getNewdegreeprogram() {
				var degreeprogramedit = __webpack_require__(162);
				degreeprogramedit.init();
			}
		},

		ElectivelistsController: {
			//admin/degreeprograms
			getElectivelists: function getElectivelists() {
				var electivelistedit = __webpack_require__(163);
				electivelistedit.init();
			},
			//admin/degreeprogram/{id}
			getElectivelistDetail: function getElectivelistDetail() {
				var electivelistedit = __webpack_require__(214);
				electivelistedit.init();
			},
			//admin/newdegreeprogram
			getNewelectivelist: function getNewelectivelist() {
				var electivelistedit = __webpack_require__(163);
				electivelistedit.init();
			}
		},

		PlansController: {
			//admin/plans
			getPlans: function getPlans() {
				var planedit = __webpack_require__(164);
				planedit.init();
			},
			//admin/plan/{id}
			getPlanDetail: function getPlanDetail() {
				var plandetail = __webpack_require__(215);
				plandetail.init();
			},
			//admin/newplan
			getNewplan: function getNewplan() {
				var planedit = __webpack_require__(164);
				planedit.init();
			}
		},

		PlansemestersController: {
			//admin/plansemester
			getPlanSemester: function getPlanSemester() {
				var plansemesteredit = __webpack_require__(165);
				plansemesteredit.init();
			},
			//admin/newplansemester
			getNewPlanSemester: function getNewPlanSemester() {
				var plansemesteredit = __webpack_require__(165);
				plansemesteredit.init();
			}
		},

		CompletedcoursesController: {
			//admin/completedcourses
			getCompletedcourses: function getCompletedcourses() {
				var completedcourseedit = __webpack_require__(166);
				completedcourseedit.init();
			},
			//admin/newcompletedcourse
			getNewcompletedcourse: function getNewcompletedcourse() {
				var completedcourseedit = __webpack_require__(166);
				completedcourseedit.init();
			}
		},

		FlowchartsController: {
			//flowcharts/view/
			getFlowchart: function getFlowchart() {
				var flowchart = __webpack_require__(216);
				flowchart.init();
			},
			getIndex: function getIndex() {
				var flowchart = __webpack_require__(217);
				flowchart.init();
			},
			newFlowchart: function newFlowchart() {
				var flowchart = __webpack_require__(169);
				flowchart.init();
			},
			editFlowchart: function editFlowchart() {
				var flowchart = __webpack_require__(169);
				flowchart.init();
			}
		}

	},

	//Function that is called by the page at load. Defined in resources/views/includes/scripts.blade.php
	//and App/Http/ViewComposers/Javascript Composer
	//See links at top of file for description of what's going on here
	//Assumes 2 inputs - the controller and action that created this page
	init: function init(controller, action) {
		if (typeof this.actions[controller] !== 'undefined' && typeof this.actions[controller][action] !== 'undefined') {
			//call the matching function in the array above
			return App.actions[controller][action]();
		}
	}
};

//Bind to the window
window.App = App;

/***/ }),

/***/ 172:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(__webpack_provided_window_dot_jQuery) {window._ = __webpack_require__(14);

/**
 * We'll load jQuery and the Bootstrap jQuery plugin which provides support
 * for JavaScript based Bootstrap features such as modals and tabs. This
 * code may be modified to fit the specific needs of your application.
 */

window.$ = __webpack_provided_window_dot_jQuery = __webpack_require__(1);

__webpack_require__(16);

/**
 * We'll load the axios HTTP library which allows us to easily issue requests
 * to our Laravel back-end. This library automatically handles sending the
 * CSRF token as a header based on the value of the "XSRF" token cookie.
 */

window.axios = __webpack_require__(17);

//https://github.com/rappasoft/laravel-5-boilerplate/blob/master/resources/assets/js/bootstrap.js
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

/**
 * Next we will register the CSRF Token as a common header with Axios so that
 * all outgoing HTTP requests automatically have it attached. This is just
 * a simple convenience so we don't have to attach every token manually.
 */

var token = document.head.querySelector('meta[name="csrf-token"]');

if (token) {
  window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
} else {
  console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
}
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 2:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {//load required libraries
var site = __webpack_require__(4);
__webpack_require__(156);
__webpack_require__(13);
__webpack_require__(157);
__webpack_require__(11);

//options for datatables
exports.dataTableOptions = {
  "pageLength": 50,
  "lengthChange": false

  /**
   * Initialization function
   * must be called explicitly on all datatables pages
   *
   * @param options - custom datatables options
   */
};exports.init = function (options) {
  options || (options = exports.dataTableOptions);
  $('#table').DataTable(options);
  site.checkMessage();

  $('#adminlte-togglemenu').on('click', function () {
    $('body').toggleClass('sidebar-open');
  });
};

/**
 * Function save via AJAX
 *
 * @param data - the data to save
 * @param url - the url to send data to
 * @param id - the id of the item to be save-dev
 * @param loadpicture - true to reload a profile picture
 */
exports.ajaxsave = function (data, url, id, loadpicture) {
  loadpicture || (loadpicture = false);
  $('#spin').removeClass('hide-spin');
  window.axios.post(url, data).then(function (response) {
    site.clearFormErrors();
    $('#spin').addClass('hide-spin');
    if (id.length == 0) {
      $(location).attr('href', response.data);
    } else {
      site.displayMessage(response.data, "success");
      if (loadpicture) exports.loadpicture(id);
    }
  }).catch(function (error) {
    site.handleError('save', '#', error);
  });
};

/**
 * Function save via AJAX on modal form
 *
 * @param data - the data to save
 * @param url - the url to send data to
 * @param element - the modal element to close
 */
exports.ajaxmodalsave = function (data, url, element) {
  $('#spin').removeClass('hide-spin');
  window.axios.post(url, data).then(function (response) {
    site.clearFormErrors();
    $('#spin').addClass('hide-spin');
    $(element).modal('hide');
    $('#table').DataTable().ajax.reload();
    site.displayMessage(response.data, "success");
  }).catch(function (error) {
    site.handleError('save', '#', error);
  });
};

/**
 * Function to load a picture via AJAX
 *
 * @param id - the user ID of the picture to reload
 */
exports.loadpicture = function (id) {
  window.axios.get('/profile/pic/' + id).then(function (response) {
    $('#pictext').val(response.data);
    $('#picimg').attr('src', response.data);
  }).catch(function (error) {
    site.handleError('retrieve picture', '', error);
  });
};

/**
 * Function to delete an item
 *
 * @param data - the data containing the item to delete
 * @param url - the URL to send the data to
 * @param retUrl - the URL to return to after delete
 * @param soft - boolean if this is a soft delete or not
 */
exports.ajaxdelete = function (data, url, retUrl) {
  var soft = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

  if (soft) {
    var choice = confirm("Are you sure?");
  } else {
    var choice = confirm("Are you sure? This will permanently remove all related records. You cannot undo this action.");
  }
  if (choice === true) {
    $('#spin').removeClass('hide-spin');
    window.axios.post(url, data).then(function (response) {
      $(location).attr('href', retUrl);
    }).catch(function (error) {
      site.handleError('delete', '#', error);
    });
  }
};

/**
 * Function to delete an item from a modal form
 *
 * @param data - the data containing the item to delete
 * @param url - the URL to send the data to
 * @param element - the modal element to close
 */
exports.ajaxmodaldelete = function (data, url, element) {
  var choice = confirm("Are you sure?");
  if (choice === true) {
    $('#spin').removeClass('hide-spin');
    window.axios.post(url, data).then(function (response) {
      site.clearFormErrors();
      $('#spin').addClass('hide-spin');
      $(element).modal('hide');
      $('#table').DataTable().ajax.reload();
      site.displayMessage(response.data, "success");
    }).catch(function (error) {
      site.handleError('delete', '#', error);
    });
  }
};

/**
 * Function to restore a soft-deleted item
 *
 * @param data - the item to be restored
 * @param url - the URL to send that information to
 * @param retUrl - the URL to return to
 */
exports.ajaxrestore = function (data, url, retUrl) {
  var choice = confirm("Are you sure?");
  if (choice === true) {
    $('#spin').removeClass('hide-spin');
    var data = {
      id: $('#id').val()
    };
    window.axios.post(url, data).then(function (response) {
      $(location).attr('href', retUrl);
    }).catch(function (error) {
      site.handleError('restore', '#', error);
    });
  }
};

exports.ajaxautocomplete = function (id, url) {
  site.ajaxautocomplete(id, url);
};

exports.ajaxautocompletelock = function (id, url) {
  site.ajaxautocompletelock(id, url);
};

exports.ajaxautocompleteset = function (id, value) {
  site.ajaxautocompleteset(id, value);
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 202:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {//load required JS libraries
__webpack_require__(24);
__webpack_require__(11);
var moment = __webpack_require__(0);
var site = __webpack_require__(4);
__webpack_require__(152);
var editable = __webpack_require__(7);

//Session for storing data between forms
exports.calendarSession = {};

//ID of the currently loaded calendar's advisor
exports.calendarAdvisorID = -1;

//Student's Name set by init
exports.calendarStudentName = "";

//Configuration data for fullcalendar instance
exports.calendarData = {
	header: {
		left: 'prev,next today',
		center: 'title',
		right: 'agendaWeek,agendaDay'
	},
	editable: false,
	eventLimit: true,
	height: 'auto',
	weekends: false,
	businessHours: {
		start: '8:00', // a start time (10am in this example)
		end: '17:00', // an end time (6pm in this example)
		dow: [1, 2, 3, 4, 5]
	},
	defaultView: 'agendaWeek',
	views: {
		agenda: {
			allDaySlot: false,
			slotDuration: '00:20:00',
			minTime: '08:00:00',
			maxTime: '17:00:00'
		}
	},
	eventSources: [{
		url: '/advising/meetingfeed',
		type: 'GET',
		error: function error() {
			alert('Error fetching meeting events from database');
		},
		color: '#512888',
		textColor: 'white'
	}, {
		url: '/advising/blackoutfeed',
		type: 'GET',
		error: function error() {
			alert('Error fetching blackout events from database');
		},
		color: '#FF8888',
		textColor: 'black'
	}],
	selectable: true,
	selectHelper: true,
	selectOverlap: function selectOverlap(event) {
		return event.rendering === 'background';
	},
	timeFormat: ' '
};

//Configuration data for datepicker instance
exports.datePickerData = {
	daysOfWeekDisabled: [0, 6],
	format: 'LLL',
	stepping: 20,
	enabledHours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
	maxHour: 17,
	sideBySide: true,
	ignoreReadonly: true,
	allowInputToggle: true
};

//Configuration data for datepicker instance day only
exports.datePickerDateOnly = {
	daysOfWeekDisabled: [0, 6],
	format: 'MM/DD/YYYY',
	ignoreReadonly: true,
	allowInputToggle: true
};

/**
 * Initialzation function for fullcalendar instance
 *
 * @param advisor - boolean true if the user is an advisor
 * @param nobind - boolean true if the buttons should not be bound (make calendar read-only)
 */
exports.init = function () {

	//Check for messages in the session from a previous action
	site.checkMessage();

	//initalize editable elements
	editable.init();

	//tweak parameters
	window.advisor || (window.advisor = false);
	window.nobind || (window.nobind = false);

	//get the current advisor's ID
	exports.calendarAdvisorID = $('#calendarAdvisorID').val().trim();

	//Set the advisor information for meeting event source
	exports.calendarData.eventSources[0].data = { id: exports.calendarAdvisorID };

	//Set the advsior inforamtion for blackout event source
	exports.calendarData.eventSources[1].data = { id: exports.calendarAdvisorID };

	//if the window is small, set different default for calendar
	if ($(window).width() < 600) {
		exports.calendarData.defaultView = 'agendaDay';
	}

	//If nobind, don't bind the forms
	if (!window.nobind) {
		//If the current user is an advisor, bind more data
		if (window.advisor) {

			//When the create event button is clicked, show the modal form
			$('#createEvent').on('shown.bs.modal', function () {
				$('#title').focus();
			});

			//Enable and disable certain form fields based on user
			$('#title').prop('disabled', false);
			$('#start').prop('disabled', false);
			$('#studentid').prop('disabled', false);
			$('#start_span').removeClass('datepicker-disabled');
			$('#end').prop('disabled', false);
			$('#end_span').removeClass('datepicker-disabled');
			$('#studentiddiv').show();
			$('#statusdiv').show();

			//bind the reset form method
			$('#createEvent').on('hidden.bs.modal', resetForm);

			//bind methods for buttons and forms
			$('#newStudentButton').bind('click', newStudent);

			$('#createBlackout').on('shown.bs.modal', function () {
				$('#btitle').focus();
			});

			$('#createBlackout').on('hidden.bs.modal', function () {
				$('#repeatdailydiv').hide();
				$('#repeatweeklydiv').hide();
				$('#repeatuntildiv').hide();
				$(this).find('form')[0].reset();
				$(this).find('.has-error').each(function () {
					$(this).removeClass('has-error');
				});
				$(this).find('.help-block').each(function () {
					$(this).text('');
				});
			});

			$('#createEvent').on('hidden.bs.modal', loadConflicts);

			$('#resolveConflict').on('hidden.bs.modal', loadConflicts);

			$('#resolveConflict').on('hidden.bs.modal', function () {
				$('#calendar').fullCalendar('refetchEvents');
			});

			//bind autocomplete field
			$('#studentid').autocomplete({
				serviceUrl: '/profile/studentfeed',
				ajaxSettings: {
					dataType: "json"
				},
				onSelect: function onSelect(suggestion) {
					$('#studentidval').val(suggestion.data);
				},
				transformResult: function transformResult(response) {
					return {
						suggestions: $.map(response.data, function (dataItem) {
							return { value: dataItem.value, data: dataItem.data };
						})
					};
				}
			});

			$('#start_datepicker').datetimepicker(exports.datePickerData);

			$('#end_datepicker').datetimepicker(exports.datePickerData);

			linkDatePickers('#start', '#end', '#duration');

			$('#bstart_datepicker').datetimepicker(exports.datePickerData);

			$('#bend_datepicker').datetimepicker(exports.datePickerData);

			linkDatePickers('#bstart', '#bend', '#bduration');

			$('#brepeatuntil_datepicker').datetimepicker(exports.datePickerDateOnly);

			//change rendering of events
			exports.calendarData.eventRender = function (event, element) {
				element.addClass("fc-clickable");
			};
			exports.calendarData.eventClick = function (event, element, view) {
				if (event.type == 'm') {
					$('#studentid').val(event.studentname);
					$('#studentidval').val(event.student_id);
					showMeetingForm(event);
				} else if (event.type == 'b') {
					exports.calendarSession = {
						event: event
					};
					if (event.repeat == '0') {
						blackoutSeries();
					} else {
						$('#blackoutOption').modal('show');
					}
				}
			};
			exports.calendarData.select = function (start, end) {
				exports.calendarSession = {
					start: start,
					end: end
				};
				$('#bblackoutid').val(-1);
				$('#bblackouteventid').val(-1);
				$('#meetingID').val(-1);
				$('#meetingOption').modal('show');
			};

			//bind more buttons
			$('#brepeat').change(repeatChange);

			$('#saveBlackoutButton').bind('click', saveBlackout);

			$('#deleteBlackoutButton').bind('click', deleteBlackout);

			$('#blackoutSeries').bind('click', function () {
				$('#blackoutOption').modal('hide');
				blackoutSeries();
			});

			$('#blackoutOccurrence').bind('click', function () {
				$('#blackoutOption').modal('hide');
				blackoutOccurrence();
			});

			$('#advisingButton').bind('click', function () {
				$('#meetingOption').off('hidden.bs.modal');
				$('#meetingOption').on('hidden.bs.modal', function (e) {
					createMeetingForm();
				});
				$('#meetingOption').modal('hide');
			});

			$('#createMeetingBtn').bind('click', function () {
				exports.calendarSession = {};
				createMeetingForm();
			});

			$('#blackoutButton').bind('click', function () {
				$('#meetingOption').off('hidden.bs.modal');
				$('#meetingOption').on('hidden.bs.modal', function (e) {
					createBlackoutForm();
				});
				$('#meetingOption').modal('hide');
			});

			$('#createBlackoutBtn').bind('click', function () {
				exports.calendarSession = {};
				createBlackoutForm();
			});

			$('#resolveButton').on('click', resolveConflicts);

			loadConflicts();

			//If the current user is not an advisor, bind less data
		} else {

			//Get the current student's name
			exports.calendarStudentName = $('#calendarStudentName').val().trim();

			//Render blackouts to background
			exports.calendarData.eventSources[1].rendering = 'background';

			//When rendering, use this custom function for blackouts and student meetings
			exports.calendarData.eventRender = function (event, element) {
				if (event.type == 'b') {
					element.append("<div style=\"color: #000000; z-index: 5;\">" + event.title + "</div>");
				}
				if (event.type == 's') {
					element.addClass("fc-green");
				}
			};

			//Use this method for clicking on meetings
			exports.calendarData.eventClick = function (event, element, view) {
				if (event.type == 's') {
					if (event.start.isAfter(moment())) {
						showMeetingForm(event);
					} else {
						alert("You cannot edit meetings in the past");
					}
				}
			};

			//When selecting new areas, use the studentSelect method in the calendar library
			exports.calendarData.select = studentSelect;

			//When the create event button is clicked, show the modal form
			$('#createEvent').on('shown.bs.modal', function () {
				$('#desc').focus();
			});

			//Enable and disable certain form fields based on user
			$('#title').prop('disabled', true);
			$("#start").prop('disabled', true);
			$('#studentid').prop('disabled', true);
			$("#start_span").addClass('datepicker-disabled');
			$("#end").prop('disabled', true);
			$("#end_span").addClass('datepicker-disabled');
			$('#studentiddiv').hide();
			$('#statusdiv').hide();
			$('#studentidval').val(-1);

			//bind the reset form method
			$('.modal').on('hidden.bs.modal', resetForm);
		}

		//Bind click handlers on the form
		$('#saveButton').bind('click', saveMeeting);
		$('#deleteButton').bind('click', deleteMeeting);
		$('#duration').on('change', changeDuration);

		//for read-only calendars with no binding
	} else {
		//for read-only calendars, set rendering to background
		exports.calendarData.eventSources[1].rendering = 'background';
		exports.calendarData.selectable = false;

		exports.calendarData.eventRender = function (event, element) {
			if (event.type == 'b') {
				element.append("<div style=\"color: #000000; z-index: 5;\">" + event.title + "</div>");
			}
			if (event.type == 's') {
				element.addClass("fc-green");
			}
		};
	}

	//initalize the calendar!
	$('#calendar').fullCalendar(exports.calendarData);
};

/**
 * Function to reset calendar by closing modals and reloading data
 *
 * @param element - the jQuery identifier of the form to hide (and the spin)
 * @param reponse - the Axios repsonse object received
 */
var resetCalendar = function resetCalendar(element, response) {
	//hide the form
	$(element).modal('hide');

	//display the message to the user
	site.displayMessage(response.data, "success");

	//refresh the calendar
	$('#calendar').fullCalendar('unselect');
	$('#calendar').fullCalendar('refetchEvents');
	$(element + 'spin').addClass('hide-spin');

	if (window.advisor) {
		loadConflicts();
	}
};

/**
 * AJAX method to save data from a form
 *
 * @param url - the URL to send the data to
 * @param data - the data object to send
 * @param element - the source element of the data
 * @param action - the string description of the action
 */
var ajaxSave = function ajaxSave(url, data, element, action) {
	//AJAX POST to server
	window.axios.post(url, data)
	//if response is 2xx
	.then(function (response) {
		resetCalendar(element, response);
	})
	//if response is not 2xx
	.catch(function (error) {
		site.handleError(action, element, error);
	});
};

var ajaxDelete = function ajaxDelete(url, data, element, action, noReset, noChoice) {
	//check noReset variable
	noReset || (noReset = false);
	noChoice || (noChoice = false);

	//prompt the user for confirmation
	if (!noChoice) {
		var choice = confirm("Are you sure?");
	} else {
		var choice = true;
	}

	if (choice === true) {

		//if confirmed, show spinning icon
		$(element + 'spin').removeClass('hide-spin');

		//make AJAX request to delete
		window.axios.post(url, data).then(function (response) {
			if (noReset) {
				//hide parent element - TODO TESTME
				//caller.parent().parent().addClass('hidden');
				$(element + 'spin').addClass('hide-spin');
				$(element).addClass('hidden');
			} else {
				resetCalendar(element, response);
			}
		}).catch(function (error) {
			site.handleError(action, element, error);
		});
	}
};

/**
 * Function to save a meeting
 */
var saveMeeting = function saveMeeting() {

	//Show the spinning status icon while working
	$('#createEventspin').removeClass('hide-spin');

	//build the data object and URL
	var data = {
		start: moment($('#start').val(), "LLL").format(),
		end: moment($('#end').val(), "LLL").format(),
		title: $('#title').val(),
		desc: $('#desc').val(),
		status: $('#status').val()
	};
	data.id = exports.calendarAdvisorID;
	if ($('#meetingID').val() > 0) {
		data.meetingid = $('#meetingID').val();
	}
	if ($('#studentidval').val() > 0) {
		data.studentid = $('#studentidval').val();
	}
	var url = '/advising/createmeeting';

	//AJAX POST to server
	ajaxSave(url, data, '#createEvent', 'save meeting');
};

/**
 * Function to delete a meeting
 */
var deleteMeeting = function deleteMeeting() {

	//build data and url
	var data = {
		meetingid: $('#meetingID').val()
	};
	var url = '/advising/deletemeeting';

	ajaxDelete(url, data, '#createEvent', 'delete meeting', false);
};

/**
 * Function to populate and show the meeting form for editing
 *
 * @param event - The event to edit
 */
var showMeetingForm = function showMeetingForm(event) {
	$('#title').val(event.title);
	$('#start').val(event.start.format("LLL"));
	$('#end').val(event.end.format("LLL"));
	$('#desc').val(event.desc);
	durationOptions(event.start, event.end);
	$('#meetingID').val(event.id);
	$('#studentidval').val(event.student_id);
	$('#status').val(event.status);
	$('#deleteButton').show();
	$('#createEvent').modal('show');
};

/**
 * Function to reset and show the meeting form for creation
 *
 * @param calendarStudentName - string name of the student
 */
var createMeetingForm = function createMeetingForm(calendarStudentName) {

	//populate the title automatically for a student
	if (calendarStudentName !== undefined) {
		$('#title').val(calendarStudentName);
	} else {
		$('#title').val('');
	}

	//Set start time
	if (exports.calendarSession.start === undefined) {
		$('#start').val(moment().hour(8).minute(0).format('LLL'));
	} else {
		$('#start').val(exports.calendarSession.start.format("LLL"));
	}

	//Set end time
	if (exports.calendarSession.end === undefined) {
		$('#end').val(moment().hour(8).minute(20).format('LLL'));
	} else {
		$('#end').val(exports.calendarSession.end.format("LLL"));
	}

	//Set duration options
	if (exports.calendarSession.start === undefined) {
		durationOptions(moment().hour(8).minute(0), moment().hour(8).minute(20));
	} else {
		durationOptions(exports.calendarSession.start, exports.calendarSession.end);
	}

	//Reset other options
	$('#meetingID').val(-1);
	$('#studentidval').val(-1);

	//Hide delete button
	$('#deleteButton').hide();

	//Show the modal form
	$('#createEvent').modal('show');
};

/*
 * Function to reset the form on this page
 */
var resetForm = function resetForm() {
	$(this).find('form')[0].reset();
	site.clearFormErrors();
};

/**
 * Function to set duration options for the meeting form
 *
 * @param start - a moment object for the start time
 * @param end - a moment object for the ending time
 */
var durationOptions = function durationOptions(start, end) {
	//clear the list
	$('#duration').empty();

	//assume all meetings have room for 20 minutes
	$('#duration').append("<option value='20'>20 minutes</option>");

	//if it starts on or before 4:20, allow 40 minutes as an option
	if (start.hour() < 16 || start.hour() == 16 && start.minutes() <= 20) {
		$('#duration').append("<option value='40'>40 minutes</option>");
	}

	//if it starts on or before 4:00, allow 60 minutes as an option
	if (start.hour() < 16 || start.hour() == 16 && start.minutes() <= 0) {
		$('#duration').append("<option value='60'>60 minutes</option>");
	}

	//set default value based on given span
	$('#duration').val(end.diff(start, "minutes"));
};

/**
 * Function to link the datepickers together
 *
 * @param elem1 - jQuery object for first datepicker
 * @param elem2 - jQuery object for second datepicker
 * @param duration - duration of the meeting
 */
var linkDatePickers = function linkDatePickers(elem1, elem2, duration) {
	//bind to change action on first datapicker
	$(elem1 + "_datepicker").on("dp.change", function (e) {
		var date2 = moment($(elem2).val(), 'LLL');
		if (e.date.isAfter(date2) || e.date.isSame(date2)) {
			date2 = e.date.clone();
			$(elem2).val(date2.format("LLL"));
		}
	});

	//bind to change action on second datepicker
	$(elem2 + "_datepicker").on("dp.change", function (e) {
		var date1 = moment($(elem1).val(), 'LLL');
		if (e.date.isBefore(date1) || e.date.isSame(date1)) {
			date1 = e.date.clone();
			$(elem1).val(date1.format("LLL"));
		}
	});
};

/**
 * Function to change the duration of the meeting
 */
var changeDuration = function changeDuration() {
	var newDate = moment($('#start').val(), 'LLL').add($(this).val(), "minutes");
	$('#end').val(newDate.format("LLL"));
};

/**
 * Function to verify that the students are selecting meetings that aren't too long
 *
 * @param start - moment object for the start of the meeting
 * @param end - moment object for the end of the meeting
 */
var studentSelect = function studentSelect(start, end) {

	//When students select a meeting, diff the start and end times
	if (end.diff(start, 'minutes') > 60) {

		//if invalid, unselect and show an error
		alert("Meetings cannot last longer than 1 hour");
		$('#calendar').fullCalendar('unselect');
	} else {

		//if valid, set data in the session and show the form
		exports.calendarSession = {
			start: start,
			end: end
		};
		$('#meetingID').val(-1);
		createMeetingForm(exports.calendarStudentName);
	}
};

/**
 * Load conflicting meetings from the server
 */
var loadConflicts = function loadConflicts() {

	//request conflicts via AJAX
	window.axios.get('/advising/conflicts').then(function (response) {

		//disable existing click handlers
		$(document).off('click', '.deleteConflict', deleteConflict);
		$(document).off('click', '.editConflict', editConflict);
		$(document).off('click', '.resolveConflict', resolveConflict);

		//If response is 200, data was received
		if (response.status == 200) {

			//Append HTML for conflicts to DOM
			$('#resolveConflictMeetings').empty();
			$.each(response.data, function (index, value) {
				$('<div/>', {
					'id': 'resolve' + value.id,
					'class': 'meeting-conflict',
					'html': '<p>&nbsp;<button type="button" class="btn btn-danger pull-right deleteConflict" data-id=' + value.id + '><i class="fa fa-trash" aria-hidden="true"></i> Delete</button>' + '&nbsp;<button type="button" class="btn btn-primary pull-right editConflict" data-id=' + value.id + '><i class="fa fa-pencil" aria-hidden="true"></i> Edit</button> ' + '<button type="button" class="btn btn-success pull-right resolveConflict" data-id=' + value.id + '><i class="fa fa-floppy-o" aria-hidden="true"></i> Keep</button>' + '<span id="resolve' + value.id + 'spin" class="fa fa-cog fa-spin fa-lg pull-right hide-spin">&nbsp;</span>' + '<b>' + value.title + '</b> (' + value.start + ')</p><hr>'
				}).appendTo('#resolveConflictMeetings');
			});

			//Re-register click handlers
			$(document).on('click', '.deleteConflict', deleteConflict);
			$(document).on('click', '.editConflict', editConflict);
			$(document).on('click', '.resolveConflict', resolveConflict);

			//Show the <div> containing conflicts
			$('#conflictingMeetings').removeClass('hidden');

			//If response is 204, no conflicts are present
		} else if (response.status == 204) {

			//Hide the <div> containing conflicts
			$('#conflictingMeetings').addClass('hidden');
		}
	}).catch(function (error) {
		alert("Unable to retrieve conflicting meetings: " + error.response.data);
	});
};

/**
 * Save blackouts and blackout events
 */
var saveBlackout = function saveBlackout() {

	//Show the spinning status icon while working
	$('#createBlackoutspin').removeClass('hide-spin');

	//build the data object and url;
	var data = {
		bstart: moment($('#bstart').val(), 'LLL').format(),
		bend: moment($('#bend').val(), 'LLL').format(),
		btitle: $('#btitle').val()
	};
	var url;
	if ($('#bblackouteventid').val() > 0) {
		url = '/advising/createblackoutevent';
		data.bblackouteventid = $('#bblackouteventid').val();
	} else {
		url = '/advising/createblackout';
		if ($('#bblackoutid').val() > 0) {
			data.bblackoutid = $('#bblackoutid').val();
		}
		data.brepeat = $('#brepeat').val();
		if ($('#brepeat').val() == 1) {
			data.brepeatevery = $('#brepeatdaily').val();
			data.brepeatuntil = moment($('#brepeatuntil').val(), "MM/DD/YYYY").format();
		}
		if ($('#brepeat').val() == 2) {
			data.brepeatevery = $('#brepeatweekly').val();
			data.brepeatweekdaysm = $('#brepeatweekdays1').prop('checked');
			data.brepeatweekdayst = $('#brepeatweekdays2').prop('checked');
			data.brepeatweekdaysw = $('#brepeatweekdays3').prop('checked');
			data.brepeatweekdaysu = $('#brepeatweekdays4').prop('checked');
			data.brepeatweekdaysf = $('#brepeatweekdays5').prop('checked');
			data.brepeatuntil = moment($('#brepeatuntil').val(), "MM/DD/YYYY").format();
		}
	}

	//send AJAX post
	ajaxSave(url, data, '#createBlackout', 'save blackout');
};

/**
 * Delete blackout and blackout events
 */
var deleteBlackout = function deleteBlackout() {

	//build URL and data object
	var url, data;
	if ($('#bblackouteventid').val() > 0) {
		url = '/advising/deleteblackoutevent';
		data = { bblackouteventid: $('#bblackouteventid').val() };
	} else {
		url = '/advising/deleteblackout';
		data = { bblackoutid: $('#bblackoutid').val() };
	}

	//send AJAX post
	ajaxDelete(url, data, '#createBlackout', 'delete blackout', false);
};

/**
 * Function for handling the change of repeat options on the blackout form
 */
var repeatChange = function repeatChange() {
	if ($(this).val() == 0) {
		$('#repeatdailydiv').hide();
		$('#repeatweeklydiv').hide();
		$('#repeatuntildiv').hide();
	} else if ($(this).val() == 1) {
		$('#repeatdailydiv').show();
		$('#repeatweeklydiv').hide();
		$('#repeatuntildiv').show();
	} else if ($(this).val() == 2) {
		$('#repeatdailydiv').hide();
		$('#repeatweeklydiv').show();
		$('#repeatuntildiv').show();
	}
};

/**
 * Show the resolve conflicts modal form
 */
var resolveConflicts = function resolveConflicts() {
	$('#resolveConflict').modal('show');
};

/**
 * Delete conflicting meeting
 */
var deleteConflict = function deleteConflict() {

	//build data and URL
	var id = $(this).data('id');
	var data = {
		meetingid: id
	};
	var url = '/advising/deletemeeting';

	//send AJAX delete
	ajaxDelete(url, data, '#resolve' + id, 'delete meeting', true);
};

/**
 * Edit conflicting meeting
 */
var editConflict = function editConflict() {

	//build data and URL
	var id = $(this).data('id');
	var data = {
		meetingid: id
	};
	var url = '/advising/meeting';

	//show spinner to load meeting
	$('#resolve' + id + 'spin').removeClass('hide-spin');

	//load meeting and display form
	window.axios.get(url, {
		params: data
	}).then(function (response) {
		$('#resolve' + id + 'spin').addClass('hide-spin');
		$('#resolveConflict').modal('hide');
		event = response.data;
		event.start = moment(event.start);
		event.end = moment(event.end);
		showMeetingForm(event);
	}).catch(function (error) {
		site.handleError('retrieve meeting', '#resolve' + id, error);
	});
};

/**
 * Resolve a conflicting meeting
 */
var resolveConflict = function resolveConflict() {

	//build data and URL
	var id = $(this).data('id');
	var data = {
		meetingid: id
	};
	var url = '/advising/resolveconflict';

	ajaxDelete(url, data, '#resolve' + id, 'resolve meeting', true, true);
};

/**
 * Function to create the create blackout form
 */
var createBlackoutForm = function createBlackoutForm() {
	$('#btitle').val("");
	if (exports.calendarSession.start === undefined) {
		$('#bstart').val(moment().hour(8).minute(0).format('LLL'));
	} else {
		$('#bstart').val(exports.calendarSession.start.format("LLL"));
	}
	if (exports.calendarSession.end === undefined) {
		$('#bend').val(moment().hour(9).minute(0).format('LLL'));
	} else {
		$('#bend').val(exports.calendarSession.end.format("LLL"));
	}
	$('#bblackoutid').val(-1);
	$('#repeatdiv').show();
	$('#brepeat').val(0);
	$('#brepeat').trigger('change');
	$('#deleteBlackoutButton').hide();
	$('#createBlackout').modal('show');
};

/**
 * Function to reset the form to a single occurrence
 */
var blackoutOccurrence = function blackoutOccurrence() {
	//hide the modal form
	$('#blackoutOption').modal('hide');

	//set form values and hide unneeded fields
	$('#btitle').val(exports.calendarSession.event.title);
	$('#bstart').val(exports.calendarSession.event.start.format("LLL"));
	$('#bend').val(exports.calendarSession.event.end.format("LLL"));
	$('#repeatdiv').hide();
	$('#repeatdailydiv').hide();
	$('#repeatweeklydiv').hide();
	$('#repeatuntildiv').hide();
	$('#bblackoutid').val(exports.calendarSession.event.blackout_id);
	$('#bblackouteventid').val(exports.calendarSession.event.id);
	$('#deleteBlackoutButton').show();

	//show the form
	$('#createBlackout').modal('show');
};

/**
 * Function to load a blackout series edit form
 */
var blackoutSeries = function blackoutSeries() {
	//hide the modal form
	$('#blackoutOption').modal('hide');

	//build data and URL
	var data = {
		id: exports.calendarSession.event.blackout_id
	};
	var url = '/advising/blackout';

	window.axios.get(url, {
		params: data
	}).then(function (response) {
		$('#btitle').val(response.data.title);
		$('#bstart').val(moment(response.data.start, 'YYYY-MM-DD HH:mm:ss').format('LLL'));
		$('#bend').val(moment(response.data.end, 'YYYY-MM-DD HH:mm:ss').format('LLL'));
		$('#bblackoutid').val(response.data.id);
		$('#bblackouteventid').val(-1);
		$('#repeatdiv').show();
		$('#brepeat').val(response.data.repeat_type);
		$('#brepeat').trigger('change');
		if (response.data.repeat_type == 1) {
			$('#brepeatdaily').val(response.data.repeat_every);
			$('#brepeatuntil').val(moment(response.data.repeat_until, 'YYYY-MM-DD HH:mm:ss').format('MM/DD/YYYY'));
		} else if (response.data.repeat_type == 2) {
			$('#brepeatweekly').val(response.data.repeat_every);
			var repeat_detail = String(response.data.repeat_detail);
			$('#brepeatweekdays1').prop('checked', repeat_detail.indexOf("1") >= 0);
			$('#brepeatweekdays2').prop('checked', repeat_detail.indexOf("2") >= 0);
			$('#brepeatweekdays3').prop('checked', repeat_detail.indexOf("3") >= 0);
			$('#brepeatweekdays4').prop('checked', repeat_detail.indexOf("4") >= 0);
			$('#brepeatweekdays5').prop('checked', repeat_detail.indexOf("5") >= 0);
			$('#brepeatuntil').val(moment(response.data.repeat_until, 'YYYY-MM-DD HH:mm:ss').format('MM/DD/YYYY'));
		}
		$('#deleteBlackoutButton').show();
		$('#createBlackout').modal('show');
	}).catch(function (error) {
		site.handleError('retrieve blackout series', '', error);
	});
};

/**
 * Function to create a new student in the database
 */
var newStudent = function newStudent() {
	//prompt the user for an eID to add to the system
	var eid = prompt("Enter the student's eID");

	//build the URL and data
	var data = {
		eid: eid
	};
	var url = '/profile/newstudent';

	//send AJAX post
	window.axios.post(url, data).then(function (response) {
		alert(response.data);
	}).catch(function (error) {
		if (error.response) {
			//If response is 422, errors were provided
			if (error.response.status == 422) {
				alert("Unable to create user: " + error.response.data["eid"]);
			} else {
				alert("Unable to create user: " + error.response.data);
			}
		}
	});
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 204:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {window.Vue = __webpack_require__(12);
var site = __webpack_require__(4);
var Echo = __webpack_require__(153).default;
//import Echo from 'laravel-echo'
__webpack_require__(154);

window.Pusher = __webpack_require__(155);
/**
 * Groupsession init function
 * must be called explicitly to start
 */
exports.init = function () {

	//load ion-sound library
	ion.sound({
		sounds: [{
			name: "door_bell"
		}],
		volume: 1.0,
		path: "/sounds/",
		preload: true
	});

	//get userID and isAdvisor variables
	window.userID = parseInt($('#userID').val());

	//register button click
	$('#groupRegisterBtn').on('click', groupRegisterBtn);

	//disable button click
	$('#groupDisableBtn').on('click', groupDisableBtn);

	//render Vue App
	window.vm = new Vue({
		el: '#groupList',
		data: {
			queue: [],
			advisor: parseInt($('#isAdvisor').val()) == 1,
			userID: parseInt($('#userID').val()),
			online: []
		},
		methods: {
			//Function to get CSS classes for a student object
			getClass: function getClass(s) {
				return {
					'alert-info': s.status == 0 || s.status == 1,
					'alert-success': s.status == 2,
					'groupsession-me': s.userid == this.userID,
					'groupsession-offline': $.inArray(s.userid, this.online) == -1
				};
			},
			//function to take a student from the list
			takeStudent: function takeStudent(event) {
				var data = { gid: event.currentTarget.dataset.id };
				var url = '/groupsession/take';
				ajaxPost(url, data, 'take');
			},

			//function to put a student back at the end of the list
			putStudent: function putStudent(event) {
				var data = { gid: event.currentTarget.dataset.id };
				var url = '/groupsession/put';
				ajaxPost(url, data, 'put');
			},

			// function to mark a student done on the list
			doneStudent: function doneStudent(event) {
				var data = { gid: event.currentTarget.dataset.id };
				var url = '/groupsession/done';
				ajaxPost(url, data, 'mark done');
			},

			//function to delete a student from the list
			delStudent: function delStudent(event) {
				var data = { gid: event.currentTarget.dataset.id };
				var url = '/groupsession/delete';
				ajaxPost(url, data, 'delete');
			}
		}
	});

	//Enable Pusher logging
	if (window.env == "local" || window.env == "staging") {
		console.log("Pusher logging enabled!");
		Pusher.logToConsole = true;
	}

	//Load the Echo instance on the window

	window.Echo = new Echo({
		broadcaster: 'pusher',
		key: window.pusherKey,
		cluster: window.pusherCluster
	});

	//Bind to the connected action on Pusher (called when connected)
	window.Echo.connector.pusher.connection.bind('connected', function () {
		//when connected, disable the spinner
		$('#groupspin').addClass('hide-spin');

		//Load the initial student queue via AJAX
		window.axios.get('/groupsession/queue/' + window.gsid).then(function (response) {
			window.vm.queue = window.vm.queue.concat(response.data);
			checkButtons(window.vm.queue);
			initialCheckDing(window.vm.queue);
			window.vm.queue.sort(sortFunction);
		}).catch(function (error) {
			site.handleError('get queue', '', error);
		});
	});

	//Connect to the groupsession channel
	/*
 window.Echo.channel('groupsession')
 	.listen('GroupsessionRegister', (data) => {
 		});
 */

	//Connect to the groupsessionend channel
	window.Echo.channel('groupsessionend').listen('GroupsessionEnd', function (e) {
		if (e.gsid == window.gsid) {
			//if ending, redirect back to home page
			window.location.href = "/groupsession/" + window.gsid;
		}
	});

	window.Echo.join('presence').here(function (users) {
		var len = users.length;
		for (var i = 0; i < len; i++) {
			window.vm.online.push(users[i].id);
		}
	}).joining(function (user) {
		window.vm.online.push(user.id);
	}).leaving(function (user) {
		window.vm.online.splice($.inArray(user.id, window.vm.online), 1);
	}).listen('GroupsessionRegister', function (data) {
		var queue = window.vm.queue;
		var found = false;
		var len = queue.length;

		//update the queue based on response
		for (var i = 0; i < len; i++) {
			if (queue[i].id === data.id) {
				if (data.status < 3) {
					queue[i] = data;
				} else {
					queue.splice(i, 1);
					i--;
					len--;
				}
				found = true;
			}
		}

		//if element not found on current queue, push it on to the queue
		if (!found) {
			queue.push(data);
		}

		//check to see if current user is on queue before enabling button
		checkButtons(queue);

		//if current user is found, check for status update to play sound
		if (data.userid === userID) {
			checkDing(data);
		}

		//sort the queue correctly
		queue.sort(sortFunction);

		//update Vue state, might be unnecessary
		window.vm.queue = queue;
	});
};

/**
 * Vue filter for status text
 *
 * @param data - the student to render
 */
Vue.filter('statustext', function (data) {
	if (data.status === 0) return "NEW";
	if (data.status === 1) return "QUEUED";
	if (data.status === 2) return "MEET WITH " + data.advisor;
	if (data.status === 3) return "DELAY";
	if (data.status === 4) return "ABSENT";
	if (data.status === 5) return "DONE";
});

/**
 * Function for clicking on the register button
 */
var groupRegisterBtn = function groupRegisterBtn() {
	$('#groupspin').removeClass('hide-spin');

	var url = '/groupsession/register/' + window.gsid;
	window.axios.post(url, {}).then(function (response) {
		site.displayMessage(response.data, "success");
		disableButton();
		$('#groupspin').addClass('hide-spin');
	}).catch(function (error) {
		site.handleError('register', '#group', error);
	});
};

/**
 * Function for advisors to disable groupsession
 */
var groupDisableBtn = function groupDisableBtn() {
	var choice = confirm("Are you sure?");
	if (choice === true) {
		var really = confirm("Seriously, this will lose all current data. Are you really sure?");
		if (really === true) {
			//this is a bit hacky, but it works
			var token = $('meta[name="csrf-token"]').attr('content');
			$('<form action="/groupsession/disable/' + window.gsid + '" method="POST"/>').append($('<input type="hidden" name="id" value="' + window.userID + '">')).append($('<input type="hidden" name="_token" value="' + token + '">')).appendTo($(document.body)) //it has to be added somewhere into the <body>
			.submit();
		}
	}
};

/**
 * Function to enable registration button
 */
var enableButton = function enableButton() {
	$('#groupRegisterBtn').removeAttr('disabled');
};

/**
 * Function to disable registration button
 */
var disableButton = function disableButton() {
	$('#groupRegisterBtn').attr('disabled', 'disabled');
};

/**
 * Function to check and see if user is on the list - if not, don't enable button
 */
var checkButtons = function checkButtons(queue) {
	var len = queue.length;
	var foundMe = false;

	//iterate through users on list, looking for current user
	for (var i = 0; i < len; i++) {
		if (queue[i].userid === window.userID) {
			foundMe = true;
			break;
		}
	}

	//if found, disable button; if not, enable button
	if (foundMe) {
		disableButton();
	} else {
		enableButton();
	}
};

/**
 * Check to see if the current user is beckoned, if so, play sound!
 *
 * @param person - the current user to check
 */
var checkDing = function checkDing(person) {
	if (person.status == 2) {
		ion.sound.play("door_bell");
	}
};

/**
 * Check if the person has been beckoned on load; if so, play sound!
 *
 * @param queue - the initial queue of users loaded
 */
var initialCheckDing = function initialCheckDing(queue) {
	var len = queue.length;
	for (var i = 0; i < len; i++) {
		if (queue[i].userid === window.userID) {
			checkDing(queue[i]);
			break;
		}
	}
};

/**
 * Helper function to sort elements based on their status
 *
 * @param a - first person
 * @param b - second person
 * @return - sorting value indicating who should go first_name
 */
var sortFunction = function sortFunction(a, b) {
	if (a.status == b.status) {
		return a.id < b.id ? -1 : 1;
	}
	return a.status < b.status ? 1 : -1;
};

/**
 * Function for making AJAX POST requests
 *
 * @param url - the URL to send to
 * @param data - the data object to send
 * @param action - the string describing the action
 */
var ajaxPost = function ajaxPost(url, data, action) {
	window.axios.post(url, data).then(function (response) {
		site.displayMessage(response.data, "success");
	}).catch(function (error) {
		site.handleError(action, '', error);
	});
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 208:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {var site = __webpack_require__(4);
__webpack_require__(5);
__webpack_require__(10);
__webpack_require__(8);

exports.init = function () {

	$('#notes').summernote({
		focus: true,
		toolbar: [
		// [groupName, [list of buttons]]
		['style', ['style', 'bold', 'italic', 'underline', 'clear']], ['font', ['strikethrough', 'superscript', 'subscript', 'link']], ['para', ['ul', 'ol', 'paragraph']], ['misc', ['fullscreen', 'codeview', 'help']]],
		tabsize: 2,
		codemirror: {
			mode: 'text/html',
			htmlMode: true,
			lineNumbers: true,
			theme: 'monokai'
		}
	});

	//bind click handler for save button
	$('#saveProfile').on('click', function () {

		//show spinning icon
		$('#profilespin').removeClass('hide-spin');

		//build data and URL
		var data = {
			first_name: $('#first_name').val(),
			last_name: $('#last_name').val()
		};
		var url = '/profile/update';

		//send AJAX post
		window.axios.post(url, data).then(function (response) {
			site.displayMessage(response.data, "success");
			site.clearFormErrors();
			$('#profilespin').addClass('hide-spin');
			$('#profileAdvisingBtn').removeClass('hide-spin');
		}).catch(function (error) {
			site.handleError('save profile', '#profile', error);
		});
	});

	//bind click handler for advisor save button
	$('#saveAdvisorProfile').on('click', function () {

		//show spinning icon
		$('#profilespin').removeClass('hide-spin');

		//build data and URL
		//TODO TESTME
		var data = new FormData($('form')[0]);
		data.append("name", $('#name').val());
		data.append("email", $('#email').val());
		data.append("office", $('#office').val());
		data.append("phone", $('#phone').val());
		data.append("notes", $('#notes').val());
		if ($('#pic').val()) {
			data.append("pic", $('#pic')[0].files[0]);
		}
		var url = '/profile/update';

		window.axios.post(url, data).then(function (response) {
			site.displayMessage(response.data, "success");
			site.clearFormErrors();
			$('#profilespin').addClass('hide-spin');
			$('#profileAdvisingBtn').removeClass('hide-spin');
			window.axios.get('/profile/pic').then(function (response) {
				$('#pictext').val(response.data);
				$('#picimg').attr('src', response.data);
			}).catch(function (error) {
				site.handleError('retrieve picture', '', error);
			});
		}).catch(function (error) {
			site.handleError('save profile', '#profile', error);
		});
	});

	//http://www.abeautifulsite.net/whipping-file-inputs-into-shape-with-bootstrap-3/
	$(document).on('change', '.btn-file :file', function () {
		var input = $(this),
		    numFiles = input.get(0).files ? input.get(0).files.length : 1,
		    label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
		input.trigger('fileselect', [numFiles, label]);
	});

	//bind to fileselect button
	$('.btn-file :file').on('fileselect', function (event, numFiles, label) {

		var input = $(this).parents('.input-group').find(':text');
		var log = numFiles > 1 ? numFiles + ' files selected' : label;

		if (input.length) {
			input.val(log);
		} else {
			if (log) {
				alert(log);
			}
		}
	});
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 209:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {var dashboard = __webpack_require__(2);

exports.init = function () {
  var options = dashboard.dataTableOptions;
  options.dom = '<"newbutton">frtip';
  dashboard.init(options);

  $('#delete').on('click', function () {
    var url = "/admin/deletemeeting";
    var retUrl = "/admin/meetings";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxdelete(data, url, retUrl, true);
  });

  $('#forcedelete').on('click', function () {
    var url = "/admin/forcedeletemeeting";
    var retUrl = "/admin/meetings";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxdelete(data, url, retUrl);
  });
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 210:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {var dashboard = __webpack_require__(2);

exports.init = function () {
  var options = dashboard.dataTableOptions;
  options.dom = '<"newbutton">frtip';
  dashboard.init(options);

  $('#delete').on('click', function () {
    var url = "/admin/deleteblackout";
    var retUrl = "/admin/blackouts";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxdelete(data, url, retUrl);
  });
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 211:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {var dashboard = __webpack_require__(2);

exports.init = function () {
  var options = dashboard.dataTableOptions;
  options.dom = '<"newbutton">frtip';
  dashboard.init(options);

  //$("div.newbutton").html('<a type="button" class="btn btn-success" href="/admin/newstudent">New Student</a>');

  $('#delete').on('click', function () {
    var url = "/admin/deletegroupsession";
    var retUrl = "/admin/groupsessions";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxdelete(data, url, retUrl);
  });
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 212:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {var dashboard = __webpack_require__(2);
var site = __webpack_require__(4);

exports.init = function () {
  //load custom button on the dom
  var options = dashboard.dataTableOptions;
  options.dom = '<"newbutton">frtip';
  dashboard.init();

  //bind settings buttons
  $('.settingsbutton').on('click', function () {
    var data = {
      key: $(this).attr('id')
    };
    var url = '/admin/savesetting';

    window.axios.post(url, data).then(function (message) {
      $(location).attr('href', '/admin/settings');
    }).catch(function (error) {
      site.handleError('save', '', error);
    });
  });

  //bind new setting button
  $('#newsetting').on('click', function () {
    var choice = prompt("Enter a name for the new setting:");
    var data = {
      key: choice
    };
    var url = "/admin/newsetting";

    window.axios.post(url, data).then(function (message) {
      $(location).attr('href', '/admin/settings');
    }).catch(function (error) {
      site.handleError('create', '', error);
    });
  });
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 213:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {var dashboard = __webpack_require__(2);
var site = __webpack_require__(4);

exports.init = function () {
  var options = dashboard.dataTableOptions;
  options.dom = '<"newbutton">frtip';
  var id = $('#degreeprogram_id').val();
  options.ajax = {
    url: '/admin/degreeprogramrequirements/' + id,
    dataSrc: ''
  };
  options.columns = [{ 'data': 'id' }, { 'data': 'name' }, { 'data': 'credits' }, { 'data': 'semester' }, { 'data': 'ordering' }, { 'data': 'notes' }, { 'data': 'id' }];
  options.columnDefs = [{
    "targets": -1,
    "data": 'id',
    "render": function render(data, type, row, meta) {
      return "<a class=\"btn btn-primary btn-sm edit\" href=\"#\" data-id=\"" + data + "\" role=\"button\">Edit</a>";
    }
  }];
  options.order = [[3, "asc"], [4, "asc"]];
  dashboard.init(options);

  $("div.newbutton").html('<a type="button" class="btn btn-success" href="#" id="new">New Degree Requirement</a>');

  $('#save').on('click', function () {
    var data = {
      notes: $('#notes').val(),
      degreeprogram_id: $('#degreeprogram_id').val(),
      semester: $('#semester').val(),
      ordering: $('#ordering').val(),
      credits: $('#credits').val()
    };
    var selected = $("input[name='requireable']:checked");
    if (selected.length > 0) {
      var selectedVal = selected.val();
      if (selectedVal == 1) {
        data.course_name = $('#course_name').val();
      } else if (selectedVal == 2) {
        if ($('#electivelist_id').val() > 0) {
          data.electivelist_id = $('#electivelist_id').val();
        }
      }
    }
    var id = $('#id').val();
    if (id.length == 0) {
      var url = '/admin/newdegreerequirement';
    } else {
      var url = '/admin/degreerequirement/' + id;
    }
    dashboard.ajaxmodalsave(data, url, '#degreerequirementform');
  });

  $('#delete').on('click', function () {
    var url = "/admin/deletedegreerequirement";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxmodaldelete(data, url, '#degreerequirementform');
  });

  $('#degreerequirementform').on('shown.bs.modal', showselected);

  $('#degreerequirementform').on('hidden.bs.modal', resetForm);

  resetForm();

  $('#new').on('click', function () {
    $('#id').val("");
    $('#degreeprogram_idview').val($('#degreeprogram_idview').attr('value'));
    $('#delete').hide();
    $('#degreerequirementform').modal('show');
  });

  $('#table').on('click', '.edit', function () {
    var id = $(this).data('id');
    var url = '/admin/degreerequirement/' + id;
    window.axios.get(url).then(function (message) {
      $('#id').val(message.data.id);
      $('#semester').val(message.data.semester);
      $('#ordering').val(message.data.ordering);
      $('#credits').val(message.data.credits);
      $('#notes').val(message.data.notes);
      $('#degreeprogram_idview').val($('#degreeprogram_idview').attr('value'));
      if (message.data.type == "course") {
        $('#course_name').val(message.data.course_name);
        $('#requireable1').prop('checked', true);
        $('#requiredcourse').show();
        $('#electivecourse').hide();
      } else if (message.data.type == "electivelist") {
        $('#electivelist_id').val(message.data.electivelist_id);
        $('#electivelist_idtext').html("Selected: (" + message.data.electivelist_id + ") " + message.data.electivelist_name);
        $('#requireable2').prop('checked', true);
        $('#requiredcourse').hide();
        $('#electivecourse').show();
      }
      $('#delete').show();
      $('#degreerequirementform').modal('show');
    }).catch(function (error) {
      site.handleError('retrieve requirement', '', error);
    });
  });

  $('input[name=requireable]').on('change', showselected);

  dashboard.ajaxautocomplete('electivelist_id', '/electivelists/electivelistfeed');
};

/**
 * Determine which div to show in the form
 */
var showselected = function showselected() {
  //https://stackoverflow.com/questions/8622336/jquery-get-value-of-selected-radio-button
  var selected = $("input[name='requireable']:checked");
  if (selected.length > 0) {
    var selectedVal = selected.val();
    if (selectedVal == 1) {
      $('#requiredcourse').show();
      $('#electivecourse').hide();
    } else if (selectedVal == 2) {
      $('#requiredcourse').hide();
      $('#electivecourse').show();
    }
  }
};

var resetForm = function resetForm() {
  site.clearFormErrors();
  $('#id').val("");
  $('#semester').val("");
  $('#ordering').val("");
  $('#credits').val("");
  $('#notes').val("");
  $('#degreeprogram_idview').val($('#degreeprogram_idview').attr('value'));
  $('#course_name').val("");
  $('#electivelist_id').val("-1");
  $('#electivelist_idauto').val("");
  $('#electivelist_idtext').html("Selected (0) ");
  $('#requireable1').prop('checked', true);
  $('#requireable2').prop('checked', false);
  $('#requiredcourse').show();
  $('#electivecourse').hide();
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 214:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {var dashboard = __webpack_require__(2);
var site = __webpack_require__(4);

exports.init = function () {
  var options = dashboard.dataTableOptions;
  options.dom = '<"newbutton">frtip';
  var id = $('#electivelist_id').val();
  options.ajax = {
    url: '/admin/electivelistcourses/' + id,
    dataSrc: ''
  };
  options.columns = [{ 'data': 'id' }, { 'data': 'name' }, { 'data': 'id' }];
  options.columnDefs = [{
    "targets": -1,
    "data": 'id',
    "render": function render(data, type, row, meta) {
      return "<a class=\"btn btn-primary btn-sm edit\" href=\"#\" data-id=\"" + data + "\" role=\"button\">Edit</a>";
    }
  }];
  options.order = [[1, "asc"]];
  dashboard.init(options);

  $("div.newbutton").html('<a type="button" class="btn btn-success" href="#" id="new">Add Course</a>');

  $('#save').on('click', function () {
    var data = {
      electivelist_id: $('#electivelist_id').val(),
      course_prefix: $('#course_prefix').val()
    };
    var selected = $("input[name='range']:checked");
    if (selected.length > 0) {
      var selectedVal = selected.val();
      if (selectedVal == 1) {
        data.course_min_number = $('#course_min_number').val();
      } else if (selectedVal == 2) {
        data.course_min_number = $('#course_min_number').val();
        data.course_max_number = $('#course_max_number').val();
      }
    }
    var id = $('#id').val();
    if (id.length == 0) {
      var url = '/admin/newelectivelistcourse';
    } else {
      var url = '/admin/electivecourse/' + id;
    }
    dashboard.ajaxmodalsave(data, url, '#electivelistcourseform');
  });

  $('#delete').on('click', function () {
    var url = "/admin/deleteelectivecourse";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxmodaldelete(data, url, '#electivelistcourseform');
  });

  $('#electivelistcourseform').on('shown.bs.modal', showselected);

  $('#electivelistcourseform').on('hidden.bs.modal', resetForm);

  resetForm();

  $('#new').on('click', function () {
    $('#id').val("");
    $('#electivelist_idview').val($('#electivelist_idview').attr('value'));
    $('#delete').hide();
    $('#electivelistcourseform').modal('show');
  });

  $('#table').on('click', '.edit', function () {
    var id = $(this).data('id');
    var url = '/admin/electivecourse/' + id;
    window.axios.get(url).then(function (message) {
      $('#id').val(message.data.id);
      $('#course_prefix').val(message.data.course_prefix);
      $('#course_min_number').val(message.data.course_min_number);
      if (message.data.course_max_number) {
        $('#course_max_number').val(message.data.course_max_number);
        $('#range2').prop('checked', true);
        $('#courserange').show();
        $('#singlecourse').hide();
      } else {
        $('#course_max_number').val("");
        $('#range1').prop('checked', true);
        $('#singlecourse').show();
        $('#courserange').hide();
      }
      $('#delete').show();
      $('#electivelistcourseform').modal('show');
    }).catch(function (error) {
      site.handleError('retrieve elective list course', '', error);
    });
  });

  $('input[name=range]').on('change', showselected);
};

/**
 * Determine which div to show in the form
 */
var showselected = function showselected() {
  //https://stackoverflow.com/questions/8622336/jquery-get-value-of-selected-radio-button
  var selected = $("input[name='range']:checked");
  if (selected.length > 0) {
    var selectedVal = selected.val();
    if (selectedVal == 1) {
      $('#singlecourse').show();
      $('#courserange').hide();
    } else if (selectedVal == 2) {
      $('#singlecourse').hide();
      $('#courserange').show();
    }
  }
};

var resetForm = function resetForm() {
  site.clearFormErrors();
  $('#id').val("");
  $('#course_prefix').val("");
  $('#course_min_number').val("");
  $('#course_max_number').val("");
  $('#range1').prop('checked', true);
  $('#range2').prop('checked', false);
  $('#singlecourse').show();
  $('#courserange').hide();
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 215:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {var dashboard = __webpack_require__(2);
var site = __webpack_require__(4);

exports.init = function () {
  var options = dashboard.dataTableOptions;
  options.dom = '<"newbutton">frtip';
  var id = $('#plan_id').val();
  options.ajax = {
    url: '/admin/planrequirements/' + id,
    dataSrc: ''
  };
  options.columns = [{ 'data': 'id' }, { 'data': 'name' }, { 'data': 'electivelist_abbr' }, { 'data': 'credits' }, { 'data': 'semester' }, { 'data': 'ordering' }, { 'data': 'notes' }, { 'data': 'catalog_course' }, { 'data': 'completed_course' }, { 'data': 'id' }];
  options.columnDefs = [{
    "targets": -1,
    "data": 'id',
    "render": function render(data, type, row, meta) {
      return "<a class=\"btn btn-primary btn-sm edit\" href=\"#\" data-id=\"" + data + "\" role=\"button\">Edit</a>";
    }
  }];
  options.order = [[4, "asc"], [5, "asc"]];
  dashboard.init(options);

  $("div.newbutton").html('<a type="button" class="btn btn-success" href="#" id="new">New Plan Requirement</a>');

  //added for new semesters table
  var options2 = {
    "pageLength": 50,
    "lengthChange": false
  };
  options2.dom = '<"newbutton2">frtip';
  options2.ajax = {
    url: '/admin/plans/plansemesters/' + id,
    dataSrc: ''
  };
  options2.columns = [{ 'data': 'id' }, { 'data': 'name' }, { 'data': 'ordering' }, { 'data': 'id' }];
  options2.columnDefs = [{
    "targets": -1,
    "data": 'id',
    "render": function render(data, type, row, meta) {
      return "<a class=\"btn btn-primary btn-sm editsem\" href=\"/admin/plans/plansemester/" + data + "\" role=\"button\">Edit</a>";
    }
  }];
  options2.order = [[2, "asc"]];
  $('#tablesem').DataTable(options2);

  $("div.newbutton2").html('<a type="button" class="btn btn-success" href="/admin/plans/newplansemester/' + id + '" id="new2">New Semester</a>');

  $('#save').on('click', function () {
    var data = {
      notes: $('#notes').val(),
      plan_id: $('#plan_id').val(),
      ordering: $('#ordering').val(),
      credits: $('#credits').val(),
      student_id: $('#student_id').val(),
      course_id_lock: $('#course_idlock').val(),
      completedcourse_id_lock: $('#completedcourse_idlock').val()
    };
    if ($('#semester_id').val() > 0) {
      data.semester_id = $('#semester_id').val();
    }
    data.course_name = $('#course_name').val();
    if ($('#electivelist_id').val() > 0) {
      data.electivelist_id = $('#electivelist_id').val();
    } else {
      data.electivelist_id = '';
    }
    if ($('#course_id').val() > 0) {
      data.course_id = $('#course_id').val();
    } else {
      data.course_id = '';
    }
    if ($('#completedcourse_id').val() > 0) {
      data.completedcourse_id = $('#completedcourse_id').val();
    } else {
      data.completedcourse_id = '';
    }
    var id = $('#id').val();
    if (id.length == 0) {
      var url = '/admin/newplanrequirement';
    } else {
      var url = '/admin/planrequirement/' + id;
    }
    dashboard.ajaxmodalsave(data, url, '#planrequirementform');
  });

  $('#delete').on('click', function () {
    var url = "/admin/deleteplanrequirement";
    var data = {
      id: $('#id').val()
    };
    dashboard.ajaxmodaldelete(data, url, '#planrequirementform');
  });

  $('#planrequirementform').on('hidden.bs.modal', resetForm);

  resetForm();

  $('#new').on('click', function () {
    $('#id').val("");
    $('#plan_idview').val($('#plan_idview').attr('value'));
    $('#delete').hide();
    var planid = $('#plan_id').val();
    window.axios.get('/admin/plans/plansemesters/' + planid).then(function (message) {
      var listitems = '';
      $.each(message.data, function (key, value) {
        listitems += '<option value=' + value.id + '>' + value.name + '</option>';
      });
      $('#semester_id').find('option').remove().end().append(listitems);
      $('#semester_id').val(semester_id);
      $('#planrequirementform').modal('show');
    });
  });

  $('#table').on('click', '.edit', function () {
    var id = $(this).data('id');
    var url = '/admin/planrequirement/' + id;
    window.axios.get(url).then(function (message) {
      $('#id').val(message.data.id);
      $('#ordering').val(message.data.ordering);
      $('#credits').val(message.data.credits);
      $('#notes').val(message.data.notes);
      $('#degreerequirement_id').val(message.data.degreerequirement_id);
      $('#plan_idview').val($('#plan_idview').attr('value'));
      $('#course_name').val(message.data.course_name);
      $('#electivelist_id').val(message.data.electivelist_id);
      $('#electivelist_idtext').html("Selected: (" + message.data.electivelist_id + ") " + site.truncateText(message.data.electivelist_name, 30));
      $('#course_id').val(message.data.course_id);
      $('#course_idtext').html("Selected: (" + message.data.course_id + ") " + site.truncateText(message.data.catalog_course, 30));
      dashboard.ajaxautocompleteset('course_id', message.data.course_id_lock);
      $('#completedcourse_id').val(message.data.completedcourse_id);
      $('#completedcourse_idtext').html("Selected: (" + message.data.completedcourse_id + ") " + site.truncateText(message.data.completed_course, 30));
      dashboard.ajaxautocompleteset('completedcourse_id', message.data.completedcourse_id_lock);
      $('#delete').show();

      var semester_id = message.data.semester_id;

      //load semesters
      var planid = $('#plan_id').val();
      window.axios.get('/admin/plans/plansemesters/' + planid).then(function (message) {
        var listitems = '';
        $.each(message.data, function (key, value) {
          listitems += '<option value=' + value.id + '>' + value.name + '</option>';
        });
        $('#semester_id').find('option').remove().end().append(listitems);
        $('#semester_id').val(semester_id);
        $('#planrequirementform').modal('show');
      }).catch(function (error) {
        site.handleError('retrieve semesters', '', error);
      });
    }).catch(function (error) {
      site.handleError('retrieve requirement', '', error);
    });
  });

  dashboard.ajaxautocomplete('electivelist_id', '/electivelists/electivelistfeed');

  dashboard.ajaxautocompletelock('course_id', '/courses/coursefeed');

  var student_id = $('#student_id').val();
  dashboard.ajaxautocompletelock('completedcourse_id', '/completedcourses/completedcoursefeed/' + student_id);
};

var resetForm = function resetForm() {
  site.clearFormErrors();
  $('#id').val("");
  $('#semester').val("");
  $('#ordering').val("");
  $('#credits').val("");
  $('#notes').val("");
  $('#degreerequirement_id').val("");
  $('#plan_idview').val($('#plan_idview').attr('value'));
  $('#course_name').val("");
  $('#electivelist_id').val("-1");
  $('#electivelist_idauto').val("");
  $('#electivelist_idtext').html("Selected (0) ");
  $('#course_id').val("-1");
  $('#course_idauto').val("");
  $('#course_idtext').html("Selected (0) ");
  $('#completedcourse_id').val("-1");
  $('#completedcourse_idauto').val("");
  $('#completedcourse_idtext').html("Selected (0) ");
  dashboard.ajaxautocompleteset('course_id', 0);
  dashboard.ajaxautocompleteset('completedcourse_id', 0);
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 216:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {var site = __webpack_require__(4);
window.Vue = __webpack_require__(12);
var draggable = __webpack_require__(167);

exports.init = function () {

  window.vm = new Vue({
    el: '#flowchart',
    data: {
      semesters: [],
      course_id: -1,
      prerequisites: [],
      followers: []
    },
    methods: {
      editSemester: editSemester,
      saveSemester: saveSemester,
      deleteSemester: deleteSemester,
      dropSemester: dropSemester,
      dropCourse: dropCourse,
      editCourse: editCourse,
      showPrereqs: showPrereqs,
      prereqClass: prereqClass
    },
    components: {
      draggable: draggable
    }
  });

  loadData();

  $('#reset').on('click', loadData);
  $('#add-sem').on('click', addSemester);
  $('#add-course').on('click', addCourse);

  $('#saveCourse').on('click', saveCourse);
  $('#deleteCourse').on('click', deleteCourse);

  site.ajaxautocomplete('electivelist_id', '/electivelists/electivelistfeed');

  site.ajaxautocompletelock('course_id', '/courses/coursefeed');

  var student_id = $('#student_id').val();
  site.ajaxautocompletelock('completedcourse_id', '/completedcourses/completedcoursefeed/' + student_id);
};

/**
 * Helper function to sort elements based on their ordering
 *
 * @param a - first item
 * @param b - second item
 * @return - sorting value indicating who should go first
 */
var sortFunction = function sortFunction(a, b) {
  if (a.ordering == b.ordering) {
    return a.id < b.id ? -1 : 1;
  }
  return a.ordering < b.ordering ? -1 : 1;
};

var loadData = function loadData() {
  var id = $('#id').val();
  window.axios.get('/flowcharts/semesters/' + id).then(function (response) {
    window.vm.semesters = response.data;
    window.vm.semesters.sort(sortFunction);
    $(document.documentElement)[0].style.setProperty('--colNum', window.vm.semesters.length);
    window.axios.get('/flowcharts/data/' + id).then(function (response) {
      $.each(response.data, function (index, value) {
        var semester = window.vm.semesters.find(function (element) {
          return element.id == value.semester_id;
        });
        if (value.degreerequirement_id <= 0) {
          value.custom = true;
        } else {
          value.custom = false;
        }
        if (value.completedcourse_id <= 0) {
          value.complete = false;
        } else {
          value.complete = true;
        }
        semester.courses.push(value);
      });
      $.each(window.vm.semesters, function (index, value) {
        value.courses.sort(sortFunction);
      });
    }).catch(function (error) {
      site.handleError('get data', '', error);
    });
  }).catch(function (error) {
    site.handleError('get data', '', error);
  });
};

var editSemester = function editSemester(event) {
  var semid = $(event.currentTarget).data('id');
  $("#sem-paneledit-" + semid).show();
  $("#sem-panelhead-" + semid).hide();
};

var saveSemester = function saveSemester(event) {
  var id = $('#id').val();
  var semid = $(event.currentTarget).data('id');
  var data = {
    id: semid,
    name: $("#sem-text-" + semid).val()
  };
  window.axios.post('/flowcharts/semesters/' + id + '/save', data).then(function (response) {
    $("#sem-paneledit-" + semid).hide();
    $("#sem-panelhead-" + semid).show();
    //site.displayMessage(response.data, "success");
  }).catch(function (error) {
    site.displayMessage("AJAX Error", "danger");
  });
};

var deleteSemester = function deleteSemester(event) {
  var choice = confirm("Are you sure?");
  if (choice === true) {
    var id = $('#id').val();
    var semid = $(event.currentTarget).data('id');
    var data = {
      id: semid
    };
    window.axios.post('/flowcharts/semesters/' + id + '/delete', data).then(function (response) {
      for (var i = 0; i < window.vm.semesters.length; i++) {
        if (window.vm.semesters[i].id == semid) {
          window.vm.semesters.splice(i, 1);
          break;
        }
      }
      //site.displayMessage(response.data, "success");
    }).catch(function (error) {
      site.displayMessage("AJAX Error", "danger");
    });
  }
};

var addSemester = function addSemester() {
  var id = $('#id').val();
  var data = {};
  window.axios.post('/flowcharts/semesters/' + id + '/add', data).then(function (response) {
    window.vm.semesters.push(response.data);
    //Vue.set(window.vm.semesters[window.vm.semester.length - 1], 'courses', new Array());
    $(document.documentElement)[0].style.setProperty('--colNum', window.vm.semesters.length);
    //site.displayMessage("Item Saved", "success");
  }).catch(function (error) {
    site.displayMessage("AJAX Error", "danger");
  });
};

var dropSemester = function dropSemester(event) {
  var ordering = [];
  $.each(window.vm.semesters, function (index, value) {
    ordering.push({
      id: value.id
    });
  });
  var data = {
    ordering: ordering
  };
  var id = $('#id').val();
  window.axios.post('/flowcharts/semesters/' + id + '/move', data).then(function (response) {
    //site.displayMessage(response.data, "success");
  }).catch(function (error) {
    site.displayMessage("AJAX Error", "danger");
  });
};

var dropCourse = function dropCourse(event) {
  var ordering = [];
  var toSemIndex = $(event.to).data('id');
  $.each(window.vm.semesters[toSemIndex].courses, function (index, value) {
    ordering.push({
      id: value.id
    });
  });
  var data = {
    semester_id: window.vm.semesters[toSemIndex].id,
    course_id: $(event.item).data('id'),
    ordering: ordering
  };
  var id = $('#id').val();
  window.axios.post('/flowcharts/data/' + id + '/move', data).then(function (response) {
    //site.displayMessage(response.data, "success");
  }).catch(function (error) {
    site.displayMessage("AJAX Error", "danger");
  });
};

var editCourse = function editCourse(event) {
  site.clearFormErrors();
  var courseIndex = $(event.currentTarget).data('id');
  var semIndex = $(event.currentTarget).data('sem');
  var course = window.vm.semesters[semIndex].courses[courseIndex];
  $('#course_name').val(course.name);
  $('#credits').val(course.credits);
  $('#notes').val(course.notes);
  $('#planrequirement_id').val(course.id);
  $('#electlivelist_id').val(course.electivelist_id);
  $('#electivelist_idauto').val('');
  $('#electivelist_idtext').html("Selected: (" + course.electivelist_id + ") " + site.truncateText(course.electivelist_name, 30));
  $('#course_id').val(course.course_id);
  $('#course_idauto').val('');
  $('#course_idtext').html("Selected: (" + course.course_id + ") " + site.truncateText(course.course_name, 30));
  site.ajaxautocompleteset('course_id', course.course_id_lock);
  $('#completedcourse_id').val(course.completedcourse_id);
  $('#completedcourse_idauto').val('');
  $('#completedcourse_idtext').html("Selected: (" + course.completedcourse_id + ") " + site.truncateText(course.completedcourse_name, 30));
  site.ajaxautocompleteset('completedcourse_id', course.completedcourse_id_lock);
  if (course.degreerequirement_id <= 0) {
    $('#course_name').prop('disabled', false);
    $('#credits').prop('disabled', false);
    $('#electivelist_idauto').prop('disabled', false);
    $('#deleteCourse').show();
  } else {
    if (course.electivelist_id <= 0) {
      $('#course_name').prop('disabled', true);
    } else {
      $('#course_name').prop('disabled', false);
    }
    $('#credits').prop('disabled', true);
    $('#electivelist_idauto').prop('disabled', true);
    $('#deleteCourse').hide();
  }

  $('#editCourse').modal('show');
};

var saveCourse = function saveCourse() {
  $('#spin').removeClass('hide-spin');
  var id = $('#id').val();
  var planrequirement_id = $('#planrequirement_id').val();
  var data = {
    notes: $('#notes').val(),
    course_id_lock: $('#course_idlock').val(),
    completedcourse_id_lock: $('#completedcourse_idlock').val()
  };
  if ($('#course_id').val() > 0) {
    data.course_id = $('#course_id').val();
  } else {
    data.course_id = '';
  }
  if ($('#completedcourse_id').val() > 0) {
    data.completedcourse_id = $('#completedcourse_id').val();
  } else {
    data.completedcourse_id = '';
  }
  if ($('#planrequirement_id').val().length > 0) {
    data.planrequirement_id = $('#planrequirement_id').val();
  }
  if (!$('#course_name').is(':disabled')) {
    data.course_name = $('#course_name').val();
  }
  if (!$('#credits').is(':disabled')) {
    data.credits = $('#credits').val();
  }
  if (!$('#electivelist_idauto').is(':disabled')) {
    if ($('#electivelist_id').val() > 0) {
      data.electivelist_id = $('#electivelist_id').val();
    } else {
      data.electivelist_id = '';
    }
  }
  window.axios.post('/flowcharts/data/' + id + '/save', data).then(function (response) {
    $('#editCourse').modal('hide');
    $('#spin').addClass('hide-spin');
    site.displayMessage(response.data, "success");
    site.clearFormErrors();
    loadData();
  }).catch(function (error) {
    $('#spin').addClass('hide-spin');
    site.handleError("save course", "#editCourse", error);
  });
};

var deleteCourse = function deleteCourse(event) {
  $('#spin').removeClass('hide-spin');
  var id = $('#id').val();
  var planrequirement_id = $('#planrequirement_id').val();
  var data = {
    planrequirement_id: planrequirement_id
  };
  window.axios.post('/flowcharts/data/' + id + '/delete', data).then(function (response) {
    $('#editCourse').modal('hide');
    $('#spin').addClass('hide-spin');
    site.displayMessage(response.data, "success");
    site.clearFormErrors();
    loadData();
  }).catch(function (error) {
    $('#spin').addClass('hide-spin');
    site.handleError("delete course", "#editCourse", error);
  });
};

var showPrereqs = function showPrereqs(event) {
  var courseIndex = $(event.currentTarget).data('id');
  var semIndex = $(event.currentTarget).data('sem');
  var course = window.vm.semesters[semIndex].courses[courseIndex];
  if (course.course_id == window.vm.course_id) {
    window.vm.course_id = -1;
    window.vm.prerequisites = [];
    window.vm.followers = [];
  } else {
    window.axios.get('/courses/prereqfeed/' + course.course_id).then(function (message) {
      window.vm.course_id = course.course_id;
      window.vm.prerequisites = message.data.prerequisites;
      window.vm.followers = message.data.followers;
    }).catch(function (error) {
      site.handleError("retrieve prerequisites", "", error);
    });
  }
};

var prereqClass = function prereqClass(id) {
  var cur = false;
  var pre = false;
  var post = false;
  if (id == window.vm.course_id) {
    cur = true;
  }
  if (window.vm.prerequisites.includes(id)) {
    pre = true;
  }
  if (window.vm.followers.includes(id)) {
    post = true;
  }
  return {
    'fa': cur || pre || post,
    'fa-3x': cur || pre || post,
    'fa-circle': cur,
    'fa-arrow-circle-right': pre,
    'fa-arrow-circle-left': post
  };
};

var addCourse = function addCourse() {
  $('#course_name').val('');
  $('#credits').val('');
  $('#notes').val('');
  $('#planrequirement_id').val('');
  $('#electlivelist_id').val(0);
  $('#electivelist_idauto').val('');
  $('#electivelist_idtext').html("Selected: (" + 0 + ") ");
  $('#course_id').val(0);
  $('#course_idauto').val('');
  $('#course_idtext').html("Selected: (" + 0 + ") ");
  $('#completedcourse_id').val(0);
  $('#completedcourse_idauto').val('');
  $('#completedcourse_idtext').html("Selected: (" + 0 + ") ");
  $('#course_name').prop('disabled', false);
  $('#credits').prop('disabled', false);
  $('#electivelist_idauto').prop('disabled', false);
  $('#deleteCourse').hide();
  $('#editCourse').modal('show');
  site.ajaxautocompleteset('course_id', 0);
  site.ajaxautocompleteset('completedcourse_id', 0);
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 217:
/***/ (function(module, exports, __webpack_require__) {

var dashboard = __webpack_require__(2);

exports.init = function () {
  var options = dashboard.dataTableOptions;
  dashboard.init(options);
};

/***/ }),

/***/ 218:
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),

/***/ 219:
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),

/***/ 4:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {/**
 * Displays a message from the flashed session data
 *
 * use $request->session()->put('message', trans('messages.item_saved'));
 *     $request->session()->put('type', 'success');
 * to set message text and type
 */
exports.displayMessage = function (message, type) {
  var html = '<div id="javascriptMessage" class="alert fade in alert-dismissable alert-' + type + '"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><span class="h4">' + message + '</span></div>';
  $('#message').append(html);
  setTimeout(function () {
    $("#javascriptMessage").alert('close');
  }, 3000);
};

/*
exports.ajaxcrsf = function(){
	$.ajaxSetup({
		headers: {
			'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
		}
	});
};
*/

/**
 * Clears errors on forms by removing error classes
 */
exports.clearFormErrors = function () {
  $('.form-group').each(function () {
    $(this).removeClass('has-error');
    $(this).find('.help-block').text('');
  });
};

/**
 * Sets errors on forms based on response JSON
 */
exports.setFormErrors = function (json) {
  exports.clearFormErrors();
  $.each(json, function (key, value) {
    $('#' + key).parents('.form-group').addClass('has-error');
    $('#' + key + 'help').text(value.join(' '));
  });
};

/**
 * Checks for messages in the flash data. Must be called explicitly by the page
 */
exports.checkMessage = function () {
  if ($('#message_flash').length) {
    var message = $('#message_flash').val();
    var type = $('#message_type_flash').val();
    exports.displayMessage(message, type);
  }
};

/**
 * Function to handle errors from AJAX
 *
 * @param message - the message to display to the user
 * @param element - the jQuery identifier of the element
 * @param error - the Axios error received
 */
exports.handleError = function (message, element, error) {
  if (error.response) {
    //If response is 422, errors were provided
    if (error.response.status == 422) {
      exports.setFormErrors(error.response.data);
    } else {
      alert("Unable to " + message + ": " + error.response.data);
    }
  }

  //hide spinning icon
  if (element.length > 0) {
    $(element + 'spin').addClass('hide-spin');
  }
};

/**
 * Function to truncate text
 *
 * @param text - the text to truncate
 * @param length - the maximum length
 *
 * http://jsfiddle.net/schadeck/GpCZL/
 */
exports.truncateText = function (text, length) {
  if (text.length > length) {
    return $.trim(text).substring(0, length).split(" ").slice(0, -1).join(" ") + "...";
  } else {
    return text;
  }
};

/**
 * Function to autocomplete a field
 *
 * @param id - the ID of the field
 * @param url - the URL to request data from
 */
exports.ajaxautocomplete = function (id, url) {
  $('#' + id + 'auto').autocomplete({
    serviceUrl: url,
    ajaxSettings: {
      dataType: "json"
    },
    minChars: 3,
    autoSelectFirst: true,
    onSelect: function onSelect(suggestion) {
      $('#' + id).val(suggestion.data);
      $('#' + id + 'text').html("Selected: (" + suggestion.data + ") " + exports.truncateText(suggestion.value, 30));
      $('#' + id + 'auto').val("");
    },
    transformResult: function transformResult(response) {
      return {
        suggestions: $.map(response.data, function (dataItem) {
          return { value: dataItem.value, data: dataItem.data };
        })
      };
    }
  });

  $('#' + id + 'clear').on('click', function () {
    $('#' + id).val(0);
    $('#' + id + 'text').html("Selected: (" + 0 + ") ");
    $('#' + id + 'auto').val("");
  });
};

/**
 * Function to autocomplete a field with a lock
 *
 * @param id - the ID of the field
 * @param url - the URL to request data from
 */
exports.ajaxautocompletelock = function (id, url) {
  $('#' + id + 'auto').autocomplete({
    serviceUrl: url,
    ajaxSettings: {
      dataType: "json"
    },
    minChars: 3,
    autoSelectFirst: true,
    onSelect: function onSelect(suggestion) {
      $('#' + id).val(suggestion.data);
      $('#' + id + 'text').html("Selected: (" + suggestion.data + ") " + exports.truncateText(suggestion.value, 30));
      $('#' + id + 'auto').val("");
      exports.ajaxautocompleteset(id, 1);
    },
    transformResult: function transformResult(response) {
      return {
        suggestions: $.map(response.data, function (dataItem) {
          return { value: dataItem.value, data: dataItem.data };
        })
      };
    }
  });

  $('#' + id + 'clear').on('click', function () {
    $('#' + id).val(0);
    $('#' + id + 'text').html("Selected: (" + 0 + ") ");
    $('#' + id + 'auto').val("");
    exports.ajaxautocompleteset(id, 0);
  });

  $('#' + id + 'lockBtn').on('click', function () {
    val = parseInt($('#' + id + 'lock').val());
    exports.ajaxautocompleteset(id, (val + 1) % 2);
  });
};

/**
 * Function to update a locked autocomplete button
 *
 * @param id - the ID of the field
 * @param value - the value to set
 */
exports.ajaxautocompleteset = function (id, value) {
  if (value == 1) {
    $('#' + id + 'lock').val(1);
    $('#' + id + 'lockBtn').addClass("active");
    $('#' + id + 'lockBtn').html('<i class="fa fa-lock"></i>');
  } else {
    $('#' + id + 'lock').val(0);
    $('#' + id + 'lockBtn').removeClass("active");
    $('#' + id + 'lockBtn').html('<i class="fa fa-unlock-alt"></i>');
  }
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),

/***/ 7:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function($) {/**
 * Initialization function for editable text-boxes on the site
 * Must be called explicitly
 */
exports.init = function () {

  //Load required libraries
  __webpack_require__(5);
  __webpack_require__(10);
  __webpack_require__(8);

  //Register click handlers for [edit] links
  $('.editable-link').each(function () {
    $(this).click(function (e) {
      e.stopPropagation();
      e.preventDefault();

      //get ID of item clicked
      var id = $(this).data('id');

      //hide the [edit] links, enable editor, and show Save and Cancel buttons
      $('#editablebutton-' + id).addClass('hidden');
      $('#editablesave-' + id).removeClass('hidden');
      $('#editable-' + id).summernote({
        focus: true,
        toolbar: [
        // [groupName, [list of buttons]]
        ['style', ['style', 'bold', 'italic', 'underline', 'clear']], ['font', ['strikethrough', 'superscript', 'subscript', 'link']], ['para', ['ul', 'ol', 'paragraph']], ['misc', ['fullscreen', 'codeview', 'help']]],
        tabsize: 2,
        codemirror: {
          mode: 'text/html',
          htmlMode: true,
          lineNumbers: true,
          theme: 'monokai'
        }
      });
    });
  });

  //Register click handlers for Save buttons
  $('.editable-save').each(function () {
    $(this).click(function (e) {
      e.stopPropagation();
      e.preventDefault();

      //get ID of item clicked
      var id = $(this).data('id');

      //Display spinner while AJAX call is performed
      $('#editablespin-' + id).removeClass('hide-spin');

      //Get contents of editor
      var htmlString = $('#editable-' + id).summernote('code');

      //Post contents to server, wait for response
      window.axios.post('/editable/save/' + id, {
        contents: htmlString
      }).then(function (response) {
        //If response 200 received, assume it saved and reload page
        location.reload(true);
      }).catch(function (error) {
        alert("Unable to save content: " + error.response.data);
      });
    });
  });

  //Register click handlers for Cancel buttons
  $('.editable-cancel').each(function () {
    $(this).click(function (e) {
      e.stopPropagation();
      e.preventDefault();

      //get ID of item clicked
      var id = $(this).data('id');

      //Reset the contents of the editor and destroy it
      $('#editable-' + id).summernote('reset');
      $('#editable-' + id).summernote('destroy');

      //Hide Save and Cancel buttons, and show [edit] link
      $('#editablebutton-' + id).removeClass('hidden');
      $('#editablesave-' + id).addClass('hidden');
    });
  });
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ })

},[170]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvY29kZW1pcnJvci9tb2RlL3htbC94bWwuanMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc3R1ZGVudGVkaXQuanMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvYWR2aXNvcmVkaXQuanMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvZGVwYXJ0bWVudGVkaXQuanMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvZ3JvdXBzZXNzaW9ubGlzdGVkaXQuanMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvZGVncmVlcHJvZ3JhbWVkaXQuanMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvZWxlY3RpdmVsaXN0ZWRpdC5qcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9wbGFuZWRpdC5qcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9wbGFuc2VtZXN0ZXJlZGl0LmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL2NvbXBsZXRlZGNvdXJzZWVkaXQuanMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9mbG93Y2hhcnRlZGl0LmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvYm9vdHN0cmFwLmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvdXRpbC9kYXNoYm9hcmQuanMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9jYWxlbmRhci5qcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2dyb3Vwc2Vzc2lvbi5qcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL3Byb2ZpbGUuanMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvbWVldGluZ2VkaXQuanMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvYmxhY2tvdXRlZGl0LmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL2dyb3Vwc2Vzc2lvbmVkaXQuanMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2V0dGluZ3MuanMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvZGVncmVlcHJvZ3JhbWRldGFpbC5qcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9lbGVjdGl2ZWxpc3RkZXRhaWwuanMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvcGxhbmRldGFpbC5qcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Zsb3djaGFydC5qcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Zsb3djaGFydGxpc3QuanMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9zYXNzL2FwcC5zY3NzPzZkMTAiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9zYXNzL2Zsb3djaGFydC5zY3NzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvdXRpbC9zaXRlLmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvdXRpbC9lZGl0YWJsZS5qcyJdLCJuYW1lcyI6WyJkYXNoYm9hcmQiLCJyZXF1aXJlIiwiZXhwb3J0cyIsImluaXQiLCJvcHRpb25zIiwiZGF0YVRhYmxlT3B0aW9ucyIsImRvbSIsIiQiLCJodG1sIiwib24iLCJkYXRhIiwiZmlyc3RfbmFtZSIsInZhbCIsImxhc3RfbmFtZSIsImVtYWlsIiwiYWR2aXNvcl9pZCIsImRlcGFydG1lbnRfaWQiLCJpZCIsImVpZCIsImxlbmd0aCIsInVybCIsImFqYXhzYXZlIiwicmV0VXJsIiwiYWpheGRlbGV0ZSIsImFqYXhyZXN0b3JlIiwic3VtbWVybm90ZSIsImZvY3VzIiwidG9vbGJhciIsInRhYnNpemUiLCJjb2RlbWlycm9yIiwibW9kZSIsImh0bWxNb2RlIiwibGluZU51bWJlcnMiLCJ0aGVtZSIsImZvcm1EYXRhIiwiRm9ybURhdGEiLCJhcHBlbmQiLCJpcyIsImZpbGVzIiwiZG9jdW1lbnQiLCJpbnB1dCIsIm51bUZpbGVzIiwiZ2V0IiwibGFiZWwiLCJyZXBsYWNlIiwidHJpZ2dlciIsImV2ZW50IiwicGFyZW50cyIsImZpbmQiLCJsb2ciLCJhbGVydCIsIm5hbWUiLCJvZmZpY2UiLCJwaG9uZSIsImFiYnJldmlhdGlvbiIsImRlc2NyaXB0aW9uIiwiZWZmZWN0aXZlX3llYXIiLCJlZmZlY3RpdmVfc2VtZXN0ZXIiLCJzdGFydF95ZWFyIiwic3RhcnRfc2VtZXN0ZXIiLCJkZWdyZWVwcm9ncmFtX2lkIiwic3R1ZGVudF9pZCIsImNob2ljZSIsImNvbmZpcm0iLCJhamF4YXV0b2NvbXBsZXRlIiwib3JkZXJpbmciLCJwbGFuX2lkIiwiY291cnNlbnVtYmVyIiwieWVhciIsInNlbWVzdGVyIiwiYmFzaXMiLCJncmFkZSIsImNyZWRpdHMiLCJzZWxlY3RlZCIsInNlbGVjdGVkVmFsIiwidHJhbnNmZXIiLCJpbmNvbWluZ19pbnN0aXR1dGlvbiIsImluY29taW5nX25hbWUiLCJpbmNvbWluZ19kZXNjcmlwdGlvbiIsImluY29taW5nX3NlbWVzdGVyIiwiaW5jb21pbmdfY3JlZGl0cyIsImluY29taW5nX2dyYWRlIiwic2hvd3NlbGVjdGVkIiwicHJvcCIsInNob3ciLCJoaWRlIiwiQXBwIiwiYWN0aW9ucyIsIlJvb3RSb3V0ZUNvbnRyb2xsZXIiLCJnZXRJbmRleCIsImVkaXRhYmxlIiwic2l0ZSIsImNoZWNrTWVzc2FnZSIsImdldEFib3V0IiwiQWR2aXNpbmdDb250cm9sbGVyIiwiY2FsZW5kYXIiLCJHcm91cHNlc3Npb25Db250cm9sbGVyIiwiZ2V0TGlzdCIsImdyb3Vwc2Vzc2lvbiIsIlByb2ZpbGVzQ29udHJvbGxlciIsInByb2ZpbGUiLCJEYXNoYm9hcmRDb250cm9sbGVyIiwiU3R1ZGVudHNDb250cm9sbGVyIiwiZ2V0U3R1ZGVudHMiLCJzdHVkZW50ZWRpdCIsImdldE5ld3N0dWRlbnQiLCJBZHZpc29yc0NvbnRyb2xsZXIiLCJnZXRBZHZpc29ycyIsImFkdmlzb3JlZGl0IiwiZ2V0TmV3YWR2aXNvciIsIkRlcGFydG1lbnRzQ29udHJvbGxlciIsImdldERlcGFydG1lbnRzIiwiZGVwYXJ0bWVudGVkaXQiLCJnZXROZXdkZXBhcnRtZW50IiwiR3JvdXBzZXNzaW9ubGlzdHNDb250cm9sbGVyIiwiZ2V0R3JvdXBzZXNzaW9ubGlzdHMiLCJncm91cHNlc3Npb25saXN0ZWRpdCIsImdldE5ld2dyb3Vwc2Vzc2lvbmxpc3QiLCJNZWV0aW5nc0NvbnRyb2xsZXIiLCJnZXRNZWV0aW5ncyIsIm1lZXRpbmdlZGl0IiwiQmxhY2tvdXRzQ29udHJvbGxlciIsImdldEJsYWNrb3V0cyIsImJsYWNrb3V0ZWRpdCIsIkdyb3Vwc2Vzc2lvbnNDb250cm9sbGVyIiwiZ2V0R3JvdXBzZXNzaW9ucyIsImdyb3Vwc2Vzc2lvbmVkaXQiLCJTZXR0aW5nc0NvbnRyb2xsZXIiLCJnZXRTZXR0aW5ncyIsInNldHRpbmdzIiwiRGVncmVlcHJvZ3JhbXNDb250cm9sbGVyIiwiZ2V0RGVncmVlcHJvZ3JhbXMiLCJkZWdyZWVwcm9ncmFtZWRpdCIsImdldERlZ3JlZXByb2dyYW1EZXRhaWwiLCJnZXROZXdkZWdyZWVwcm9ncmFtIiwiRWxlY3RpdmVsaXN0c0NvbnRyb2xsZXIiLCJnZXRFbGVjdGl2ZWxpc3RzIiwiZWxlY3RpdmVsaXN0ZWRpdCIsImdldEVsZWN0aXZlbGlzdERldGFpbCIsImdldE5ld2VsZWN0aXZlbGlzdCIsIlBsYW5zQ29udHJvbGxlciIsImdldFBsYW5zIiwicGxhbmVkaXQiLCJnZXRQbGFuRGV0YWlsIiwicGxhbmRldGFpbCIsImdldE5ld3BsYW4iLCJQbGFuc2VtZXN0ZXJzQ29udHJvbGxlciIsImdldFBsYW5TZW1lc3RlciIsInBsYW5zZW1lc3RlcmVkaXQiLCJnZXROZXdQbGFuU2VtZXN0ZXIiLCJDb21wbGV0ZWRjb3Vyc2VzQ29udHJvbGxlciIsImdldENvbXBsZXRlZGNvdXJzZXMiLCJjb21wbGV0ZWRjb3Vyc2VlZGl0IiwiZ2V0TmV3Y29tcGxldGVkY291cnNlIiwiRmxvd2NoYXJ0c0NvbnRyb2xsZXIiLCJnZXRGbG93Y2hhcnQiLCJmbG93Y2hhcnQiLCJuZXdGbG93Y2hhcnQiLCJlZGl0Rmxvd2NoYXJ0IiwiY29udHJvbGxlciIsImFjdGlvbiIsIndpbmRvdyIsIl8iLCJheGlvcyIsImRlZmF1bHRzIiwiaGVhZGVycyIsImNvbW1vbiIsInRva2VuIiwiaGVhZCIsInF1ZXJ5U2VsZWN0b3IiLCJjb250ZW50IiwiY29uc29sZSIsImVycm9yIiwiRGF0YVRhYmxlIiwidG9nZ2xlQ2xhc3MiLCJsb2FkcGljdHVyZSIsInJlbW92ZUNsYXNzIiwicG9zdCIsInRoZW4iLCJyZXNwb25zZSIsImNsZWFyRm9ybUVycm9ycyIsImFkZENsYXNzIiwibG9jYXRpb24iLCJhdHRyIiwiZGlzcGxheU1lc3NhZ2UiLCJjYXRjaCIsImhhbmRsZUVycm9yIiwiYWpheG1vZGFsc2F2ZSIsImVsZW1lbnQiLCJtb2RhbCIsImFqYXgiLCJyZWxvYWQiLCJzb2Z0IiwiYWpheG1vZGFsZGVsZXRlIiwiYWpheGF1dG9jb21wbGV0ZWxvY2siLCJhamF4YXV0b2NvbXBsZXRlc2V0IiwidmFsdWUiLCJtb21lbnQiLCJjYWxlbmRhclNlc3Npb24iLCJjYWxlbmRhckFkdmlzb3JJRCIsImNhbGVuZGFyU3R1ZGVudE5hbWUiLCJjYWxlbmRhckRhdGEiLCJoZWFkZXIiLCJsZWZ0IiwiY2VudGVyIiwicmlnaHQiLCJldmVudExpbWl0IiwiaGVpZ2h0Iiwid2Vla2VuZHMiLCJidXNpbmVzc0hvdXJzIiwic3RhcnQiLCJlbmQiLCJkb3ciLCJkZWZhdWx0VmlldyIsInZpZXdzIiwiYWdlbmRhIiwiYWxsRGF5U2xvdCIsInNsb3REdXJhdGlvbiIsIm1pblRpbWUiLCJtYXhUaW1lIiwiZXZlbnRTb3VyY2VzIiwidHlwZSIsImNvbG9yIiwidGV4dENvbG9yIiwic2VsZWN0YWJsZSIsInNlbGVjdEhlbHBlciIsInNlbGVjdE92ZXJsYXAiLCJyZW5kZXJpbmciLCJ0aW1lRm9ybWF0IiwiZGF0ZVBpY2tlckRhdGEiLCJkYXlzT2ZXZWVrRGlzYWJsZWQiLCJmb3JtYXQiLCJzdGVwcGluZyIsImVuYWJsZWRIb3VycyIsIm1heEhvdXIiLCJzaWRlQnlTaWRlIiwiaWdub3JlUmVhZG9ubHkiLCJhbGxvd0lucHV0VG9nZ2xlIiwiZGF0ZVBpY2tlckRhdGVPbmx5IiwiYWR2aXNvciIsIm5vYmluZCIsInRyaW0iLCJ3aWR0aCIsInJlc2V0Rm9ybSIsImJpbmQiLCJuZXdTdHVkZW50IiwicmVzZXQiLCJlYWNoIiwidGV4dCIsImxvYWRDb25mbGljdHMiLCJmdWxsQ2FsZW5kYXIiLCJhdXRvY29tcGxldGUiLCJzZXJ2aWNlVXJsIiwiYWpheFNldHRpbmdzIiwiZGF0YVR5cGUiLCJvblNlbGVjdCIsInN1Z2dlc3Rpb24iLCJ0cmFuc2Zvcm1SZXN1bHQiLCJzdWdnZXN0aW9ucyIsIm1hcCIsImRhdGFJdGVtIiwiZGF0ZXRpbWVwaWNrZXIiLCJsaW5rRGF0ZVBpY2tlcnMiLCJldmVudFJlbmRlciIsImV2ZW50Q2xpY2siLCJ2aWV3Iiwic3R1ZGVudG5hbWUiLCJzaG93TWVldGluZ0Zvcm0iLCJyZXBlYXQiLCJibGFja291dFNlcmllcyIsInNlbGVjdCIsImNoYW5nZSIsInJlcGVhdENoYW5nZSIsInNhdmVCbGFja291dCIsImRlbGV0ZUJsYWNrb3V0IiwiYmxhY2tvdXRPY2N1cnJlbmNlIiwib2ZmIiwiZSIsImNyZWF0ZU1lZXRpbmdGb3JtIiwiY3JlYXRlQmxhY2tvdXRGb3JtIiwicmVzb2x2ZUNvbmZsaWN0cyIsInRpdGxlIiwiaXNBZnRlciIsInN0dWRlbnRTZWxlY3QiLCJzYXZlTWVldGluZyIsImRlbGV0ZU1lZXRpbmciLCJjaGFuZ2VEdXJhdGlvbiIsInJlc2V0Q2FsZW5kYXIiLCJhamF4U2F2ZSIsImFqYXhEZWxldGUiLCJub1Jlc2V0Iiwibm9DaG9pY2UiLCJkZXNjIiwic3RhdHVzIiwibWVldGluZ2lkIiwic3R1ZGVudGlkIiwiZHVyYXRpb25PcHRpb25zIiwidW5kZWZpbmVkIiwiaG91ciIsIm1pbnV0ZSIsImVtcHR5IiwibWludXRlcyIsImRpZmYiLCJlbGVtMSIsImVsZW0yIiwiZHVyYXRpb24iLCJkYXRlMiIsImRhdGUiLCJpc1NhbWUiLCJjbG9uZSIsImRhdGUxIiwiaXNCZWZvcmUiLCJuZXdEYXRlIiwiYWRkIiwiZGVsZXRlQ29uZmxpY3QiLCJlZGl0Q29uZmxpY3QiLCJyZXNvbHZlQ29uZmxpY3QiLCJpbmRleCIsImFwcGVuZFRvIiwiYnN0YXJ0IiwiYmVuZCIsImJ0aXRsZSIsImJibGFja291dGV2ZW50aWQiLCJiYmxhY2tvdXRpZCIsImJyZXBlYXQiLCJicmVwZWF0ZXZlcnkiLCJicmVwZWF0dW50aWwiLCJicmVwZWF0d2Vla2RheXNtIiwiYnJlcGVhdHdlZWtkYXlzdCIsImJyZXBlYXR3ZWVrZGF5c3ciLCJicmVwZWF0d2Vla2RheXN1IiwiYnJlcGVhdHdlZWtkYXlzZiIsInBhcmFtcyIsImJsYWNrb3V0X2lkIiwicmVwZWF0X3R5cGUiLCJyZXBlYXRfZXZlcnkiLCJyZXBlYXRfdW50aWwiLCJyZXBlYXRfZGV0YWlsIiwiU3RyaW5nIiwiaW5kZXhPZiIsInByb21wdCIsIlZ1ZSIsIkVjaG8iLCJkZWZhdWx0IiwiUHVzaGVyIiwiaW9uIiwic291bmQiLCJzb3VuZHMiLCJ2b2x1bWUiLCJwYXRoIiwicHJlbG9hZCIsInVzZXJJRCIsInBhcnNlSW50IiwiZ3JvdXBSZWdpc3RlckJ0biIsImdyb3VwRGlzYWJsZUJ0biIsInZtIiwiZWwiLCJxdWV1ZSIsIm9ubGluZSIsIm1ldGhvZHMiLCJnZXRDbGFzcyIsInMiLCJ1c2VyaWQiLCJpbkFycmF5IiwidGFrZVN0dWRlbnQiLCJnaWQiLCJjdXJyZW50VGFyZ2V0IiwiZGF0YXNldCIsImFqYXhQb3N0IiwicHV0U3R1ZGVudCIsImRvbmVTdHVkZW50IiwiZGVsU3R1ZGVudCIsImVudiIsImxvZ1RvQ29uc29sZSIsImJyb2FkY2FzdGVyIiwia2V5IiwicHVzaGVyS2V5IiwiY2x1c3RlciIsInB1c2hlckNsdXN0ZXIiLCJjb25uZWN0b3IiLCJwdXNoZXIiLCJjb25uZWN0aW9uIiwiZ3NpZCIsImNvbmNhdCIsImNoZWNrQnV0dG9ucyIsImluaXRpYWxDaGVja0RpbmciLCJzb3J0Iiwic29ydEZ1bmN0aW9uIiwiY2hhbm5lbCIsImxpc3RlbiIsImhyZWYiLCJqb2luIiwiaGVyZSIsInVzZXJzIiwibGVuIiwiaSIsInB1c2giLCJqb2luaW5nIiwidXNlciIsImxlYXZpbmciLCJzcGxpY2UiLCJmb3VuZCIsImNoZWNrRGluZyIsImZpbHRlciIsImRpc2FibGVCdXR0b24iLCJyZWFsbHkiLCJib2R5Iiwic3VibWl0IiwiZW5hYmxlQnV0dG9uIiwicmVtb3ZlQXR0ciIsImZvdW5kTWUiLCJwZXJzb24iLCJwbGF5IiwiYSIsImIiLCJtZXNzYWdlIiwiZGF0YVNyYyIsImNvbHVtbnMiLCJjb2x1bW5EZWZzIiwicm93IiwibWV0YSIsIm9yZGVyIiwibm90ZXMiLCJjb3Vyc2VfbmFtZSIsImVsZWN0aXZlbGlzdF9pZCIsImVsZWN0aXZlbGlzdF9uYW1lIiwiY291cnNlX3ByZWZpeCIsImNvdXJzZV9taW5fbnVtYmVyIiwiY291cnNlX21heF9udW1iZXIiLCJvcHRpb25zMiIsImNvdXJzZV9pZF9sb2NrIiwiY29tcGxldGVkY291cnNlX2lkX2xvY2siLCJzZW1lc3Rlcl9pZCIsImNvdXJzZV9pZCIsImNvbXBsZXRlZGNvdXJzZV9pZCIsInBsYW5pZCIsImxpc3RpdGVtcyIsInJlbW92ZSIsImRlZ3JlZXJlcXVpcmVtZW50X2lkIiwidHJ1bmNhdGVUZXh0IiwiY2F0YWxvZ19jb3Vyc2UiLCJjb21wbGV0ZWRfY291cnNlIiwiZHJhZ2dhYmxlIiwic2VtZXN0ZXJzIiwicHJlcmVxdWlzaXRlcyIsImZvbGxvd2VycyIsImVkaXRTZW1lc3RlciIsInNhdmVTZW1lc3RlciIsImRlbGV0ZVNlbWVzdGVyIiwiZHJvcFNlbWVzdGVyIiwiZHJvcENvdXJzZSIsImVkaXRDb3Vyc2UiLCJzaG93UHJlcmVxcyIsInByZXJlcUNsYXNzIiwiY29tcG9uZW50cyIsImxvYWREYXRhIiwiYWRkU2VtZXN0ZXIiLCJhZGRDb3Vyc2UiLCJzYXZlQ291cnNlIiwiZGVsZXRlQ291cnNlIiwiZG9jdW1lbnRFbGVtZW50Iiwic3R5bGUiLCJzZXRQcm9wZXJ0eSIsImN1c3RvbSIsImNvbXBsZXRlIiwiY291cnNlcyIsInNlbWlkIiwidG9TZW1JbmRleCIsInRvIiwiaXRlbSIsImNvdXJzZUluZGV4Iiwic2VtSW5kZXgiLCJjb3Vyc2UiLCJjb21wbGV0ZWRjb3Vyc2VfbmFtZSIsInBsYW5yZXF1aXJlbWVudF9pZCIsImN1ciIsInByZSIsImluY2x1ZGVzIiwic2V0VGltZW91dCIsInNldEZvcm1FcnJvcnMiLCJqc29uIiwic3Vic3RyaW5nIiwic3BsaXQiLCJzbGljZSIsIm1pbkNoYXJzIiwiYXV0b1NlbGVjdEZpcnN0IiwiY2xpY2siLCJzdG9wUHJvcGFnYXRpb24iLCJwcmV2ZW50RGVmYXVsdCIsImh0bWxTdHJpbmciLCJjb250ZW50cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEOztBQUVBO0FBQ0Esb0JBQW9CO0FBQ3BCO0FBQ0E7QUFDQSxpRUFBaUU7QUFDakUscUJBQXFCO0FBQ3JCO0FBQ0EsNENBQTRDO0FBQzVDO0FBQ0EsV0FBVyx1QkFBdUI7QUFDbEMsV0FBVyx1QkFBdUI7QUFDbEMsV0FBVyxXQUFXO0FBQ3RCLGVBQWUsaUNBQWlDO0FBQ2hELGlCQUFpQixpQkFBaUI7QUFDbEMsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBLDZFQUE2RTtBQUM3RSxXQUFXLHVCQUF1QjtBQUNsQyxXQUFXLHVCQUF1QjtBQUNsQyxjQUFjLDZCQUE2QjtBQUMzQyxXQUFXLHVCQUF1QjtBQUNsQyxjQUFjLGNBQWM7QUFDNUIsV0FBVyx1QkFBdUI7QUFDbEMsY0FBYyw2QkFBNkI7QUFDM0MsV0FBVztBQUNYLEdBQUc7QUFDSCxnQkFBZ0IsWUFBWTtBQUM1QjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLHFCQUFxQjtBQUNyQixzQkFBc0I7QUFDdEIscUJBQXFCO0FBQ3JCLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0EsNkRBQTZEO0FBQzdELFNBQVM7QUFDVCx1REFBdUQ7QUFDdkQ7QUFDQSxPQUFPO0FBQ1AsMERBQTBEO0FBQzFEO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsV0FBVztBQUNYO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlEQUFpRCxvQkFBb0I7QUFDckU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLG1CQUFtQjtBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOztBQUVMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7O0FBRUw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0NBQW9DO0FBQ3BDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVztBQUNYO0FBQ0EsV0FBVztBQUNYO0FBQ0E7QUFDQTtBQUNBLE9BQU8scUJBQXFCO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7O0FBRUw7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7QUFFTDtBQUNBLDhCQUE4QixxREFBcUQ7QUFDbkYsS0FBSzs7QUFFTDtBQUNBO0FBQ0Esa0NBQWtDLElBQUk7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBLHNDQUFzQyw0QkFBNEI7O0FBRWxFLENBQUM7Ozs7Ozs7O0FDNVpELDZDQUFJQSxZQUFZLG1CQUFBQyxDQUFRLENBQVIsQ0FBaEI7O0FBRUFDLFFBQVFDLElBQVIsR0FBZSxZQUFVO0FBQ3ZCLE1BQUlDLFVBQVVKLFVBQVVLLGdCQUF4QjtBQUNBRCxVQUFRRSxHQUFSLEdBQWMsb0JBQWQ7QUFDQU4sWUFBVUcsSUFBVixDQUFlQyxPQUFmOztBQUVBRyxJQUFFLGVBQUYsRUFBbUJDLElBQW5CLENBQXdCLG1GQUF4Qjs7QUFFQUQsSUFBRSxPQUFGLEVBQVdFLEVBQVgsQ0FBYyxPQUFkLEVBQXVCLFlBQVU7QUFDL0IsUUFBSUMsT0FBTztBQUNUQyxrQkFBWUosRUFBRSxhQUFGLEVBQWlCSyxHQUFqQixFQURIO0FBRVRDLGlCQUFXTixFQUFFLFlBQUYsRUFBZ0JLLEdBQWhCLEVBRkY7QUFHVEUsYUFBT1AsRUFBRSxRQUFGLEVBQVlLLEdBQVo7QUFIRSxLQUFYO0FBS0EsUUFBR0wsRUFBRSxhQUFGLEVBQWlCSyxHQUFqQixLQUF5QixDQUE1QixFQUE4QjtBQUM1QkYsV0FBS0ssVUFBTCxHQUFrQlIsRUFBRSxhQUFGLEVBQWlCSyxHQUFqQixFQUFsQjtBQUNEO0FBQ0QsUUFBR0wsRUFBRSxnQkFBRixFQUFvQkssR0FBcEIsS0FBNEIsQ0FBL0IsRUFBaUM7QUFDL0JGLFdBQUtNLGFBQUwsR0FBcUJULEVBQUUsZ0JBQUYsRUFBb0JLLEdBQXBCLEVBQXJCO0FBQ0Q7QUFDRCxRQUFJSyxLQUFLVixFQUFFLEtBQUYsRUFBU0ssR0FBVCxFQUFUO0FBQ0FGLFNBQUtRLEdBQUwsR0FBV1gsRUFBRSxNQUFGLEVBQVVLLEdBQVYsRUFBWDtBQUNBLFFBQUdLLEdBQUdFLE1BQUgsSUFBYSxDQUFoQixFQUFrQjtBQUNoQixVQUFJQyxNQUFNLG1CQUFWO0FBQ0QsS0FGRCxNQUVLO0FBQ0gsVUFBSUEsTUFBTSxxQkFBcUJILEVBQS9CO0FBQ0Q7QUFDRGpCLGNBQVVxQixRQUFWLENBQW1CWCxJQUFuQixFQUF5QlUsR0FBekIsRUFBOEJILEVBQTlCO0FBQ0QsR0FwQkQ7O0FBc0JBVixJQUFFLFNBQUYsRUFBYUUsRUFBYixDQUFnQixPQUFoQixFQUF5QixZQUFVO0FBQ2pDLFFBQUlXLE1BQU0sc0JBQVY7QUFDQSxRQUFJRSxTQUFTLGlCQUFiO0FBQ0EsUUFBSVosT0FBTztBQUNUTyxVQUFJVixFQUFFLEtBQUYsRUFBU0ssR0FBVDtBQURLLEtBQVg7QUFHQVosY0FBVXVCLFVBQVYsQ0FBcUJiLElBQXJCLEVBQTJCVSxHQUEzQixFQUFnQ0UsTUFBaEMsRUFBd0MsSUFBeEM7QUFDRCxHQVBEOztBQVNBZixJQUFFLGNBQUYsRUFBa0JFLEVBQWxCLENBQXFCLE9BQXJCLEVBQThCLFlBQVU7QUFDdEMsUUFBSVcsTUFBTSwyQkFBVjtBQUNBLFFBQUlFLFNBQVMsaUJBQWI7QUFDQSxRQUFJWixPQUFPO0FBQ1RPLFVBQUlWLEVBQUUsS0FBRixFQUFTSyxHQUFUO0FBREssS0FBWDtBQUdBWixjQUFVdUIsVUFBVixDQUFxQmIsSUFBckIsRUFBMkJVLEdBQTNCLEVBQWdDRSxNQUFoQztBQUNELEdBUEQ7O0FBU0FmLElBQUUsVUFBRixFQUFjRSxFQUFkLENBQWlCLE9BQWpCLEVBQTBCLFlBQVU7QUFDbEMsUUFBSVcsTUFBTSx1QkFBVjtBQUNBLFFBQUlFLFNBQVMsaUJBQWI7QUFDQSxRQUFJWixPQUFPO0FBQ1RPLFVBQUlWLEVBQUUsS0FBRixFQUFTSyxHQUFUO0FBREssS0FBWDtBQUdBWixjQUFVd0IsV0FBVixDQUFzQmQsSUFBdEIsRUFBNEJVLEdBQTVCLEVBQWlDRSxNQUFqQztBQUNELEdBUEQ7QUFRRCxDQXZERCxDOzs7Ozs7OztBQ0ZBLDZDQUFJdEIsWUFBWSxtQkFBQUMsQ0FBUSxDQUFSLENBQWhCO0FBQ0EsbUJBQUFBLENBQVEsQ0FBUjtBQUNBLG1CQUFBQSxDQUFRLEVBQVI7QUFDQSxtQkFBQUEsQ0FBUSxDQUFSOztBQUVBQyxRQUFRQyxJQUFSLEdBQWUsWUFBVTtBQUN2QixNQUFJQyxVQUFVSixVQUFVSyxnQkFBeEI7QUFDQUQsVUFBUUUsR0FBUixHQUFjLG9CQUFkO0FBQ0FOLFlBQVVHLElBQVYsQ0FBZUMsT0FBZjs7QUFFQUcsSUFBRSxlQUFGLEVBQW1CQyxJQUFuQixDQUF3QixtRkFBeEI7O0FBRUFELElBQUUsUUFBRixFQUFZa0IsVUFBWixDQUF1QjtBQUN2QkMsV0FBTyxJQURnQjtBQUV2QkMsYUFBUztBQUNSO0FBQ0EsS0FBQyxPQUFELEVBQVUsQ0FBQyxPQUFELEVBQVUsTUFBVixFQUFrQixRQUFsQixFQUE0QixXQUE1QixFQUF5QyxPQUF6QyxDQUFWLENBRlEsRUFHUixDQUFDLE1BQUQsRUFBUyxDQUFDLGVBQUQsRUFBa0IsYUFBbEIsRUFBaUMsV0FBakMsRUFBOEMsTUFBOUMsQ0FBVCxDQUhRLEVBSVIsQ0FBQyxNQUFELEVBQVMsQ0FBQyxJQUFELEVBQU8sSUFBUCxFQUFhLFdBQWIsQ0FBVCxDQUpRLEVBS1IsQ0FBQyxNQUFELEVBQVMsQ0FBQyxZQUFELEVBQWUsVUFBZixFQUEyQixNQUEzQixDQUFULENBTFEsQ0FGYztBQVN2QkMsYUFBUyxDQVRjO0FBVXZCQyxnQkFBWTtBQUNYQyxZQUFNLFdBREs7QUFFWEMsZ0JBQVUsSUFGQztBQUdYQyxtQkFBYSxJQUhGO0FBSVhDLGFBQU87QUFKSTtBQVZXLEdBQXZCOztBQW1CQTFCLElBQUUsT0FBRixFQUFXRSxFQUFYLENBQWMsT0FBZCxFQUF1QixZQUFVO0FBQy9CLFFBQUl5QixXQUFXLElBQUlDLFFBQUosQ0FBYTVCLEVBQUUsTUFBRixFQUFVLENBQVYsQ0FBYixDQUFmO0FBQ0YyQixhQUFTRSxNQUFULENBQWdCLE1BQWhCLEVBQXdCN0IsRUFBRSxPQUFGLEVBQVdLLEdBQVgsRUFBeEI7QUFDQXNCLGFBQVNFLE1BQVQsQ0FBZ0IsT0FBaEIsRUFBeUI3QixFQUFFLFFBQUYsRUFBWUssR0FBWixFQUF6QjtBQUNBc0IsYUFBU0UsTUFBVCxDQUFnQixRQUFoQixFQUEwQjdCLEVBQUUsU0FBRixFQUFhSyxHQUFiLEVBQTFCO0FBQ0FzQixhQUFTRSxNQUFULENBQWdCLE9BQWhCLEVBQXlCN0IsRUFBRSxRQUFGLEVBQVlLLEdBQVosRUFBekI7QUFDQXNCLGFBQVNFLE1BQVQsQ0FBZ0IsT0FBaEIsRUFBeUI3QixFQUFFLFFBQUYsRUFBWUssR0FBWixFQUF6QjtBQUNFc0IsYUFBU0UsTUFBVCxDQUFnQixRQUFoQixFQUEwQjdCLEVBQUUsU0FBRixFQUFhOEIsRUFBYixDQUFnQixVQUFoQixJQUE4QixDQUE5QixHQUFrQyxDQUE1RDtBQUNGLFFBQUc5QixFQUFFLE1BQUYsRUFBVUssR0FBVixFQUFILEVBQW1CO0FBQ2xCc0IsZUFBU0UsTUFBVCxDQUFnQixLQUFoQixFQUF1QjdCLEVBQUUsTUFBRixFQUFVLENBQVYsRUFBYStCLEtBQWIsQ0FBbUIsQ0FBbkIsQ0FBdkI7QUFDQTtBQUNDLFFBQUcvQixFQUFFLGdCQUFGLEVBQW9CSyxHQUFwQixLQUE0QixDQUEvQixFQUFpQztBQUMvQnNCLGVBQVNFLE1BQVQsQ0FBZ0IsZUFBaEIsRUFBaUM3QixFQUFFLGdCQUFGLEVBQW9CSyxHQUFwQixFQUFqQztBQUNEO0FBQ0QsUUFBSUssS0FBS1YsRUFBRSxLQUFGLEVBQVNLLEdBQVQsRUFBVDtBQUNBLFFBQUdLLEdBQUdFLE1BQUgsSUFBYSxDQUFoQixFQUFrQjtBQUNoQmUsZUFBU0UsTUFBVCxDQUFnQixLQUFoQixFQUF1QjdCLEVBQUUsTUFBRixFQUFVSyxHQUFWLEVBQXZCO0FBQ0EsVUFBSVEsTUFBTSxtQkFBVjtBQUNELEtBSEQsTUFHSztBQUNIYyxlQUFTRSxNQUFULENBQWdCLEtBQWhCLEVBQXVCN0IsRUFBRSxNQUFGLEVBQVVLLEdBQVYsRUFBdkI7QUFDQSxVQUFJUSxNQUFNLHFCQUFxQkgsRUFBL0I7QUFDRDtBQUNIakIsY0FBVXFCLFFBQVYsQ0FBbUJhLFFBQW5CLEVBQTZCZCxHQUE3QixFQUFrQ0gsRUFBbEMsRUFBc0MsSUFBdEM7QUFDQyxHQXZCRDs7QUF5QkFWLElBQUUsU0FBRixFQUFhRSxFQUFiLENBQWdCLE9BQWhCLEVBQXlCLFlBQVU7QUFDakMsUUFBSVcsTUFBTSxzQkFBVjtBQUNBLFFBQUlFLFNBQVMsaUJBQWI7QUFDQSxRQUFJWixPQUFPO0FBQ1RPLFVBQUlWLEVBQUUsS0FBRixFQUFTSyxHQUFUO0FBREssS0FBWDtBQUdBWixjQUFVdUIsVUFBVixDQUFxQmIsSUFBckIsRUFBMkJVLEdBQTNCLEVBQWdDRSxNQUFoQyxFQUF3QyxJQUF4QztBQUNELEdBUEQ7O0FBU0FmLElBQUUsY0FBRixFQUFrQkUsRUFBbEIsQ0FBcUIsT0FBckIsRUFBOEIsWUFBVTtBQUN0QyxRQUFJVyxNQUFNLDJCQUFWO0FBQ0EsUUFBSUUsU0FBUyxpQkFBYjtBQUNBLFFBQUlaLE9BQU87QUFDVE8sVUFBSVYsRUFBRSxLQUFGLEVBQVNLLEdBQVQ7QUFESyxLQUFYO0FBR0FaLGNBQVV1QixVQUFWLENBQXFCYixJQUFyQixFQUEyQlUsR0FBM0IsRUFBZ0NFLE1BQWhDO0FBQ0QsR0FQRDs7QUFTQWYsSUFBRSxVQUFGLEVBQWNFLEVBQWQsQ0FBaUIsT0FBakIsRUFBMEIsWUFBVTtBQUNsQyxRQUFJVyxNQUFNLHVCQUFWO0FBQ0EsUUFBSUUsU0FBUyxpQkFBYjtBQUNBLFFBQUlaLE9BQU87QUFDVE8sVUFBSVYsRUFBRSxLQUFGLEVBQVNLLEdBQVQ7QUFESyxLQUFYO0FBR0FaLGNBQVV3QixXQUFWLENBQXNCZCxJQUF0QixFQUE0QlUsR0FBNUIsRUFBaUNFLE1BQWpDO0FBQ0QsR0FQRDs7QUFTQWYsSUFBRWdDLFFBQUYsRUFBWTlCLEVBQVosQ0FBZSxRQUFmLEVBQXlCLGlCQUF6QixFQUE0QyxZQUFXO0FBQ3JELFFBQUkrQixRQUFRakMsRUFBRSxJQUFGLENBQVo7QUFBQSxRQUNJa0MsV0FBV0QsTUFBTUUsR0FBTixDQUFVLENBQVYsRUFBYUosS0FBYixHQUFxQkUsTUFBTUUsR0FBTixDQUFVLENBQVYsRUFBYUosS0FBYixDQUFtQm5CLE1BQXhDLEdBQWlELENBRGhFO0FBQUEsUUFFSXdCLFFBQVFILE1BQU01QixHQUFOLEdBQVlnQyxPQUFaLENBQW9CLEtBQXBCLEVBQTJCLEdBQTNCLEVBQWdDQSxPQUFoQyxDQUF3QyxNQUF4QyxFQUFnRCxFQUFoRCxDQUZaO0FBR0FKLFVBQU1LLE9BQU4sQ0FBYyxZQUFkLEVBQTRCLENBQUNKLFFBQUQsRUFBV0UsS0FBWCxDQUE1QjtBQUNELEdBTEQ7O0FBT0FwQyxJQUFFLGlCQUFGLEVBQXFCRSxFQUFyQixDQUF3QixZQUF4QixFQUFzQyxVQUFTcUMsS0FBVCxFQUFnQkwsUUFBaEIsRUFBMEJFLEtBQTFCLEVBQWlDOztBQUVuRSxRQUFJSCxRQUFRakMsRUFBRSxJQUFGLEVBQVF3QyxPQUFSLENBQWdCLGNBQWhCLEVBQWdDQyxJQUFoQyxDQUFxQyxPQUFyQyxDQUFaO0FBQUEsUUFDSUMsTUFBTVIsV0FBVyxDQUFYLEdBQWVBLFdBQVcsaUJBQTFCLEdBQThDRSxLQUR4RDs7QUFHQSxRQUFJSCxNQUFNckIsTUFBVixFQUFtQjtBQUNmcUIsWUFBTTVCLEdBQU4sQ0FBVXFDLEdBQVY7QUFDSCxLQUZELE1BRU87QUFDSCxVQUFJQSxHQUFKLEVBQVVDLE1BQU1ELEdBQU47QUFDYjtBQUVKLEdBWEQ7QUFhRCxDQWxHRCxDOzs7Ozs7OztBQ0xBLDZDQUFJakQsWUFBWSxtQkFBQUMsQ0FBUSxDQUFSLENBQWhCOztBQUVBQyxRQUFRQyxJQUFSLEdBQWUsWUFBVTtBQUN2QixNQUFJQyxVQUFVSixVQUFVSyxnQkFBeEI7QUFDQUQsVUFBUUUsR0FBUixHQUFjLG9CQUFkO0FBQ0FOLFlBQVVHLElBQVYsQ0FBZUMsT0FBZjs7QUFFQUcsSUFBRSxlQUFGLEVBQW1CQyxJQUFuQixDQUF3Qix5RkFBeEI7O0FBRUFELElBQUUsT0FBRixFQUFXRSxFQUFYLENBQWMsT0FBZCxFQUF1QixZQUFVO0FBQy9CLFFBQUlDLE9BQU87QUFDVHlDLFlBQU01QyxFQUFFLE9BQUYsRUFBV0ssR0FBWCxFQURHO0FBRVRFLGFBQU9QLEVBQUUsUUFBRixFQUFZSyxHQUFaLEVBRkU7QUFHVHdDLGNBQVE3QyxFQUFFLFNBQUYsRUFBYUssR0FBYixFQUhDO0FBSVR5QyxhQUFPOUMsRUFBRSxRQUFGLEVBQVlLLEdBQVo7QUFKRSxLQUFYO0FBTUEsUUFBSUssS0FBS1YsRUFBRSxLQUFGLEVBQVNLLEdBQVQsRUFBVDtBQUNBLFFBQUdLLEdBQUdFLE1BQUgsSUFBYSxDQUFoQixFQUFrQjtBQUNoQixVQUFJQyxNQUFNLHNCQUFWO0FBQ0QsS0FGRCxNQUVLO0FBQ0gsVUFBSUEsTUFBTSx3QkFBd0JILEVBQWxDO0FBQ0Q7QUFDRGpCLGNBQVVxQixRQUFWLENBQW1CWCxJQUFuQixFQUF5QlUsR0FBekIsRUFBOEJILEVBQTlCO0FBQ0QsR0FkRDs7QUFnQkFWLElBQUUsU0FBRixFQUFhRSxFQUFiLENBQWdCLE9BQWhCLEVBQXlCLFlBQVU7QUFDakMsUUFBSVcsTUFBTSx5QkFBVjtBQUNBLFFBQUlFLFNBQVMsb0JBQWI7QUFDQSxRQUFJWixPQUFPO0FBQ1RPLFVBQUlWLEVBQUUsS0FBRixFQUFTSyxHQUFUO0FBREssS0FBWDtBQUdBWixjQUFVdUIsVUFBVixDQUFxQmIsSUFBckIsRUFBMkJVLEdBQTNCLEVBQWdDRSxNQUFoQyxFQUF3QyxJQUF4QztBQUNELEdBUEQ7O0FBU0FmLElBQUUsY0FBRixFQUFrQkUsRUFBbEIsQ0FBcUIsT0FBckIsRUFBOEIsWUFBVTtBQUN0QyxRQUFJVyxNQUFNLDhCQUFWO0FBQ0EsUUFBSUUsU0FBUyxvQkFBYjtBQUNBLFFBQUlaLE9BQU87QUFDVE8sVUFBSVYsRUFBRSxLQUFGLEVBQVNLLEdBQVQ7QUFESyxLQUFYO0FBR0FaLGNBQVV1QixVQUFWLENBQXFCYixJQUFyQixFQUEyQlUsR0FBM0IsRUFBZ0NFLE1BQWhDO0FBQ0QsR0FQRDs7QUFTQWYsSUFBRSxVQUFGLEVBQWNFLEVBQWQsQ0FBaUIsT0FBakIsRUFBMEIsWUFBVTtBQUNsQyxRQUFJVyxNQUFNLDBCQUFWO0FBQ0EsUUFBSUUsU0FBUyxvQkFBYjtBQUNBLFFBQUlaLE9BQU87QUFDVE8sVUFBSVYsRUFBRSxLQUFGLEVBQVNLLEdBQVQ7QUFESyxLQUFYO0FBR0FaLGNBQVV3QixXQUFWLENBQXNCZCxJQUF0QixFQUE0QlUsR0FBNUIsRUFBaUNFLE1BQWpDO0FBQ0QsR0FQRDtBQVNELENBbERELEM7Ozs7Ozs7O0FDRkEsNkNBQUl0QixZQUFZLG1CQUFBQyxDQUFRLENBQVIsQ0FBaEI7O0FBRUFDLFFBQVFDLElBQVIsR0FBZSxZQUFVO0FBQ3ZCLE1BQUlDLFVBQVVKLFVBQVVLLGdCQUF4QjtBQUNBRCxVQUFRRSxHQUFSLEdBQWMsb0JBQWQ7QUFDQU4sWUFBVUcsSUFBVixDQUFlQyxPQUFmOztBQUVBRyxJQUFFLGVBQUYsRUFBbUJDLElBQW5CLENBQXdCLHNHQUF4Qjs7QUFFQUQsSUFBRSxPQUFGLEVBQVdFLEVBQVgsQ0FBYyxPQUFkLEVBQXVCLFlBQVU7QUFDL0IsUUFBSUMsT0FBTztBQUNUeUMsWUFBTTVDLEVBQUUsT0FBRixFQUFXSyxHQUFYO0FBREcsS0FBWDtBQUdBLFFBQUlLLEtBQUtWLEVBQUUsS0FBRixFQUFTSyxHQUFULEVBQVQ7QUFDQSxRQUFHSyxHQUFHRSxNQUFILElBQWEsQ0FBaEIsRUFBa0I7QUFDaEIsVUFBSUMsTUFBTSw0QkFBVjtBQUNELEtBRkQsTUFFSztBQUNILFVBQUlBLE1BQU0sOEJBQThCSCxFQUF4QztBQUNEO0FBQ0RqQixjQUFVcUIsUUFBVixDQUFtQlgsSUFBbkIsRUFBeUJVLEdBQXpCLEVBQThCSCxFQUE5QjtBQUNELEdBWEQ7O0FBYUFWLElBQUUsU0FBRixFQUFhRSxFQUFiLENBQWdCLE9BQWhCLEVBQXlCLFlBQVU7QUFDakMsUUFBSVcsTUFBTSwrQkFBVjtBQUNBLFFBQUlFLFNBQVMsMEJBQWI7QUFDQSxRQUFJWixPQUFPO0FBQ1RPLFVBQUlWLEVBQUUsS0FBRixFQUFTSyxHQUFUO0FBREssS0FBWDtBQUdBWixjQUFVdUIsVUFBVixDQUFxQmIsSUFBckIsRUFBMkJVLEdBQTNCLEVBQWdDRSxNQUFoQyxFQUF3QyxJQUF4QztBQUNELEdBUEQ7QUFTRCxDQTdCRCxDOzs7Ozs7OztBQ0ZBLDZDQUFJdEIsWUFBWSxtQkFBQUMsQ0FBUSxDQUFSLENBQWhCOztBQUVBQyxRQUFRQyxJQUFSLEdBQWUsWUFBVTtBQUN2QixNQUFJQyxVQUFVSixVQUFVSyxnQkFBeEI7QUFDQUQsVUFBUUUsR0FBUixHQUFjLG9CQUFkO0FBQ0FOLFlBQVVHLElBQVYsQ0FBZUMsT0FBZjs7QUFFQUcsSUFBRSxlQUFGLEVBQW1CQyxJQUFuQixDQUF3QixnR0FBeEI7O0FBRUFELElBQUUsT0FBRixFQUFXRSxFQUFYLENBQWMsT0FBZCxFQUF1QixZQUFVO0FBQy9CLFFBQUlDLE9BQU87QUFDVHlDLFlBQU01QyxFQUFFLE9BQUYsRUFBV0ssR0FBWCxFQURHO0FBRVQwQyxvQkFBYy9DLEVBQUUsZUFBRixFQUFtQkssR0FBbkIsRUFGTDtBQUdUMkMsbUJBQWFoRCxFQUFFLGNBQUYsRUFBa0JLLEdBQWxCLEVBSEo7QUFJVDRDLHNCQUFnQmpELEVBQUUsaUJBQUYsRUFBcUJLLEdBQXJCLEVBSlA7QUFLVDZDLDBCQUFvQmxELEVBQUUscUJBQUYsRUFBeUJLLEdBQXpCO0FBTFgsS0FBWDtBQU9BLFFBQUdMLEVBQUUsZ0JBQUYsRUFBb0JLLEdBQXBCLEtBQTRCLENBQS9CLEVBQWlDO0FBQy9CRixXQUFLTSxhQUFMLEdBQXFCVCxFQUFFLGdCQUFGLEVBQW9CSyxHQUFwQixFQUFyQjtBQUNEO0FBQ0QsUUFBSUssS0FBS1YsRUFBRSxLQUFGLEVBQVNLLEdBQVQsRUFBVDtBQUNBLFFBQUdLLEdBQUdFLE1BQUgsSUFBYSxDQUFoQixFQUFrQjtBQUNoQixVQUFJQyxNQUFNLHlCQUFWO0FBQ0QsS0FGRCxNQUVLO0FBQ0gsVUFBSUEsTUFBTSwyQkFBMkJILEVBQXJDO0FBQ0Q7QUFDRGpCLGNBQVVxQixRQUFWLENBQW1CWCxJQUFuQixFQUF5QlUsR0FBekIsRUFBOEJILEVBQTlCO0FBQ0QsR0FsQkQ7O0FBb0JBVixJQUFFLFNBQUYsRUFBYUUsRUFBYixDQUFnQixPQUFoQixFQUF5QixZQUFVO0FBQ2pDLFFBQUlXLE1BQU0sNEJBQVY7QUFDQSxRQUFJRSxTQUFTLHVCQUFiO0FBQ0EsUUFBSVosT0FBTztBQUNUTyxVQUFJVixFQUFFLEtBQUYsRUFBU0ssR0FBVDtBQURLLEtBQVg7QUFHQVosY0FBVXVCLFVBQVYsQ0FBcUJiLElBQXJCLEVBQTJCVSxHQUEzQixFQUFnQ0UsTUFBaEMsRUFBd0MsSUFBeEM7QUFDRCxHQVBEOztBQVNBZixJQUFFLGNBQUYsRUFBa0JFLEVBQWxCLENBQXFCLE9BQXJCLEVBQThCLFlBQVU7QUFDdEMsUUFBSVcsTUFBTSxpQ0FBVjtBQUNBLFFBQUlFLFNBQVMsdUJBQWI7QUFDQSxRQUFJWixPQUFPO0FBQ1RPLFVBQUlWLEVBQUUsS0FBRixFQUFTSyxHQUFUO0FBREssS0FBWDtBQUdBWixjQUFVdUIsVUFBVixDQUFxQmIsSUFBckIsRUFBMkJVLEdBQTNCLEVBQWdDRSxNQUFoQztBQUNELEdBUEQ7O0FBU0FmLElBQUUsVUFBRixFQUFjRSxFQUFkLENBQWlCLE9BQWpCLEVBQTBCLFlBQVU7QUFDbEMsUUFBSVcsTUFBTSw2QkFBVjtBQUNBLFFBQUlFLFNBQVMsdUJBQWI7QUFDQSxRQUFJWixPQUFPO0FBQ1RPLFVBQUlWLEVBQUUsS0FBRixFQUFTSyxHQUFUO0FBREssS0FBWDtBQUdBWixjQUFVd0IsV0FBVixDQUFzQmQsSUFBdEIsRUFBNEJVLEdBQTVCLEVBQWlDRSxNQUFqQztBQUNELEdBUEQ7QUFTRCxDQXRERCxDOzs7Ozs7OztBQ0ZBLDZDQUFJdEIsWUFBWSxtQkFBQUMsQ0FBUSxDQUFSLENBQWhCOztBQUVBQyxRQUFRQyxJQUFSLEdBQWUsWUFBVTtBQUN2QixNQUFJQyxVQUFVSixVQUFVSyxnQkFBeEI7QUFDQUQsVUFBUUUsR0FBUixHQUFjLG9CQUFkO0FBQ0FOLFlBQVVHLElBQVYsQ0FBZUMsT0FBZjs7QUFFQUcsSUFBRSxlQUFGLEVBQW1CQyxJQUFuQixDQUF3Qiw4RkFBeEI7O0FBRUFELElBQUUsT0FBRixFQUFXRSxFQUFYLENBQWMsT0FBZCxFQUF1QixZQUFVO0FBQy9CLFFBQUlDLE9BQU87QUFDVHlDLFlBQU01QyxFQUFFLE9BQUYsRUFBV0ssR0FBWCxFQURHO0FBRVQwQyxvQkFBYy9DLEVBQUUsZUFBRixFQUFtQkssR0FBbkIsRUFGTDtBQUdUMkMsbUJBQWFoRCxFQUFFLGNBQUYsRUFBa0JLLEdBQWxCO0FBSEosS0FBWDtBQUtBLFFBQUlLLEtBQUtWLEVBQUUsS0FBRixFQUFTSyxHQUFULEVBQVQ7QUFDQSxRQUFHSyxHQUFHRSxNQUFILElBQWEsQ0FBaEIsRUFBa0I7QUFDaEIsVUFBSUMsTUFBTSx3QkFBVjtBQUNELEtBRkQsTUFFSztBQUNILFVBQUlBLE1BQU0sMEJBQTBCSCxFQUFwQztBQUNEO0FBQ0RqQixjQUFVcUIsUUFBVixDQUFtQlgsSUFBbkIsRUFBeUJVLEdBQXpCLEVBQThCSCxFQUE5QjtBQUNELEdBYkQ7O0FBZUFWLElBQUUsU0FBRixFQUFhRSxFQUFiLENBQWdCLE9BQWhCLEVBQXlCLFlBQVU7QUFDakMsUUFBSVcsTUFBTSwyQkFBVjtBQUNBLFFBQUlFLFNBQVMsc0JBQWI7QUFDQSxRQUFJWixPQUFPO0FBQ1RPLFVBQUlWLEVBQUUsS0FBRixFQUFTSyxHQUFUO0FBREssS0FBWDtBQUdBWixjQUFVdUIsVUFBVixDQUFxQmIsSUFBckIsRUFBMkJVLEdBQTNCLEVBQWdDRSxNQUFoQyxFQUF3QyxJQUF4QztBQUNELEdBUEQ7O0FBU0FmLElBQUUsY0FBRixFQUFrQkUsRUFBbEIsQ0FBcUIsT0FBckIsRUFBOEIsWUFBVTtBQUN0QyxRQUFJVyxNQUFNLGdDQUFWO0FBQ0EsUUFBSUUsU0FBUyxzQkFBYjtBQUNBLFFBQUlaLE9BQU87QUFDVE8sVUFBSVYsRUFBRSxLQUFGLEVBQVNLLEdBQVQ7QUFESyxLQUFYO0FBR0FaLGNBQVV1QixVQUFWLENBQXFCYixJQUFyQixFQUEyQlUsR0FBM0IsRUFBZ0NFLE1BQWhDO0FBQ0QsR0FQRDs7QUFTQWYsSUFBRSxVQUFGLEVBQWNFLEVBQWQsQ0FBaUIsT0FBakIsRUFBMEIsWUFBVTtBQUNsQyxRQUFJVyxNQUFNLDRCQUFWO0FBQ0EsUUFBSUUsU0FBUyxzQkFBYjtBQUNBLFFBQUlaLE9BQU87QUFDVE8sVUFBSVYsRUFBRSxLQUFGLEVBQVNLLEdBQVQ7QUFESyxLQUFYO0FBR0FaLGNBQVV3QixXQUFWLENBQXNCZCxJQUF0QixFQUE0QlUsR0FBNUIsRUFBaUNFLE1BQWpDO0FBQ0QsR0FQRDtBQVNELENBakRELEM7Ozs7Ozs7O0FDRkEsNkNBQUl0QixZQUFZLG1CQUFBQyxDQUFRLENBQVIsQ0FBaEI7O0FBRUFDLFFBQVFDLElBQVIsR0FBZSxZQUFVO0FBQ3ZCLE1BQUlDLFVBQVVKLFVBQVVLLGdCQUF4QjtBQUNBRCxVQUFRRSxHQUFSLEdBQWMsb0JBQWQ7QUFDQU4sWUFBVUcsSUFBVixDQUFlQyxPQUFmOztBQUVBRyxJQUFFLGVBQUYsRUFBbUJDLElBQW5CLENBQXdCLDZFQUF4Qjs7QUFFQUQsSUFBRSxPQUFGLEVBQVdFLEVBQVgsQ0FBYyxPQUFkLEVBQXVCLFlBQVU7QUFDL0IsUUFBSUMsT0FBTztBQUNUeUMsWUFBTTVDLEVBQUUsT0FBRixFQUFXSyxHQUFYLEVBREc7QUFFVDJDLG1CQUFhaEQsRUFBRSxjQUFGLEVBQWtCSyxHQUFsQixFQUZKO0FBR1Q4QyxrQkFBWW5ELEVBQUUsYUFBRixFQUFpQkssR0FBakIsRUFISDtBQUlUK0Msc0JBQWdCcEQsRUFBRSxpQkFBRixFQUFxQkssR0FBckIsRUFKUDtBQUtUZ0Qsd0JBQWtCckQsRUFBRSxtQkFBRixFQUF1QkssR0FBdkIsRUFMVDtBQU1UaUQsa0JBQVl0RCxFQUFFLGFBQUYsRUFBaUJLLEdBQWpCO0FBTkgsS0FBWDtBQVFBLFFBQUlLLEtBQUtWLEVBQUUsS0FBRixFQUFTSyxHQUFULEVBQVQ7QUFDQSxRQUFHSyxHQUFHRSxNQUFILElBQWEsQ0FBaEIsRUFBa0I7QUFDaEIsVUFBSUMsTUFBTSxnQkFBVjtBQUNELEtBRkQsTUFFSztBQUNILFVBQUlBLE1BQU0sa0JBQWtCSCxFQUE1QjtBQUNEO0FBQ0RqQixjQUFVcUIsUUFBVixDQUFtQlgsSUFBbkIsRUFBeUJVLEdBQXpCLEVBQThCSCxFQUE5QjtBQUNELEdBaEJEOztBQWtCQVYsSUFBRSxTQUFGLEVBQWFFLEVBQWIsQ0FBZ0IsT0FBaEIsRUFBeUIsWUFBVTtBQUNqQyxRQUFJVyxNQUFNLG1CQUFWO0FBQ0EsUUFBSUUsU0FBUyxjQUFiO0FBQ0EsUUFBSVosT0FBTztBQUNUTyxVQUFJVixFQUFFLEtBQUYsRUFBU0ssR0FBVDtBQURLLEtBQVg7QUFHQVosY0FBVXVCLFVBQVYsQ0FBcUJiLElBQXJCLEVBQTJCVSxHQUEzQixFQUFnQ0UsTUFBaEMsRUFBd0MsSUFBeEM7QUFDRCxHQVBEOztBQVNBZixJQUFFLGNBQUYsRUFBa0JFLEVBQWxCLENBQXFCLE9BQXJCLEVBQThCLFlBQVU7QUFDdEMsUUFBSVcsTUFBTSx3QkFBVjtBQUNBLFFBQUlFLFNBQVMsY0FBYjtBQUNBLFFBQUlaLE9BQU87QUFDVE8sVUFBSVYsRUFBRSxLQUFGLEVBQVNLLEdBQVQ7QUFESyxLQUFYO0FBR0FaLGNBQVV1QixVQUFWLENBQXFCYixJQUFyQixFQUEyQlUsR0FBM0IsRUFBZ0NFLE1BQWhDO0FBQ0QsR0FQRDs7QUFTQWYsSUFBRSxVQUFGLEVBQWNFLEVBQWQsQ0FBaUIsT0FBakIsRUFBMEIsWUFBVTtBQUNsQyxRQUFJVyxNQUFNLG9CQUFWO0FBQ0EsUUFBSUUsU0FBUyxjQUFiO0FBQ0EsUUFBSVosT0FBTztBQUNUTyxVQUFJVixFQUFFLEtBQUYsRUFBU0ssR0FBVDtBQURLLEtBQVg7QUFHQVosY0FBVXdCLFdBQVYsQ0FBc0JkLElBQXRCLEVBQTRCVSxHQUE1QixFQUFpQ0UsTUFBakM7QUFDRCxHQVBEOztBQVNBZixJQUFFLGFBQUYsRUFBaUJFLEVBQWpCLENBQW9CLE9BQXBCLEVBQTZCLFlBQVU7QUFDckMsUUFBSXFELFNBQVNDLFFBQVEsb0pBQVIsQ0FBYjtBQUNELFFBQUdELFdBQVcsSUFBZCxFQUFtQjtBQUNoQixVQUFJMUMsTUFBTSxxQkFBVjtBQUNBLFVBQUlWLE9BQU87QUFDVE8sWUFBSVYsRUFBRSxLQUFGLEVBQVNLLEdBQVQ7QUFESyxPQUFYO0FBR0FaLGdCQUFVcUIsUUFBVixDQUFtQlgsSUFBbkIsRUFBeUJVLEdBQXpCLEVBQThCSCxFQUE5QjtBQUNEO0FBQ0YsR0FURDs7QUFXQWpCLFlBQVVnRSxnQkFBVixDQUEyQixZQUEzQixFQUF5QyxzQkFBekM7QUFFRCxDQWpFRCxDOzs7Ozs7OztBQ0ZBLDZDQUFJaEUsWUFBWSxtQkFBQUMsQ0FBUSxDQUFSLENBQWhCOztBQUVBQyxRQUFRQyxJQUFSLEdBQWUsWUFBVTs7QUFFdkJILFlBQVVHLElBQVY7O0FBRUFJLElBQUUsT0FBRixFQUFXRSxFQUFYLENBQWMsT0FBZCxFQUF1QixZQUFVO0FBQy9CLFFBQUlDLE9BQU87QUFDVHlDLFlBQU01QyxFQUFFLE9BQUYsRUFBV0ssR0FBWCxFQURHO0FBRVRxRCxnQkFBVTFELEVBQUUsV0FBRixFQUFlSyxHQUFmLEVBRkQ7QUFHVHNELGVBQVMzRCxFQUFFLFVBQUYsRUFBY0ssR0FBZDtBQUhBLEtBQVg7QUFLQSxRQUFJSyxLQUFLVixFQUFFLEtBQUYsRUFBU0ssR0FBVCxFQUFUO0FBQ0EsUUFBR0ssR0FBR0UsTUFBSCxJQUFhLENBQWhCLEVBQWtCO0FBQ2hCLFVBQUlDLE1BQU0sa0NBQWtDYixFQUFFLFVBQUYsRUFBY0ssR0FBZCxFQUE1QztBQUNELEtBRkQsTUFFSztBQUNILFVBQUlRLE1BQU0sK0JBQStCSCxFQUF6QztBQUNEO0FBQ0RqQixjQUFVcUIsUUFBVixDQUFtQlgsSUFBbkIsRUFBeUJVLEdBQXpCLEVBQThCSCxFQUE5QjtBQUNELEdBYkQ7O0FBZUFWLElBQUUsU0FBRixFQUFhRSxFQUFiLENBQWdCLE9BQWhCLEVBQXlCLFlBQVU7QUFDakMsUUFBSVcsTUFBTSxxQ0FBcUNiLEVBQUUsS0FBRixFQUFTSyxHQUFULEVBQS9DO0FBQ0EsUUFBSVUsU0FBUyxrQkFBa0JmLEVBQUUsVUFBRixFQUFjSyxHQUFkLEVBQS9CO0FBQ0EsUUFBSUYsT0FBTztBQUNUTyxVQUFJVixFQUFFLEtBQUYsRUFBU0ssR0FBVDtBQURLLEtBQVg7QUFHQVosY0FBVXVCLFVBQVYsQ0FBcUJiLElBQXJCLEVBQTJCVSxHQUEzQixFQUFnQ0UsTUFBaEMsRUFBd0MsSUFBeEM7QUFDRCxHQVBEO0FBU0QsQ0E1QkQsQzs7Ozs7Ozs7QUNGQSw2Q0FBSXRCLFlBQVksbUJBQUFDLENBQVEsQ0FBUixDQUFoQjs7QUFFQUMsUUFBUUMsSUFBUixHQUFlLFlBQVU7QUFDdkIsTUFBSUMsVUFBVUosVUFBVUssZ0JBQXhCO0FBQ0FELFVBQVFFLEdBQVIsR0FBYyxvQkFBZDtBQUNBTixZQUFVRyxJQUFWLENBQWVDLE9BQWY7O0FBRUFHLElBQUUsZUFBRixFQUFtQkMsSUFBbkIsQ0FBd0Isb0dBQXhCOztBQUVBRCxJQUFFLE9BQUYsRUFBV0UsRUFBWCxDQUFjLE9BQWQsRUFBdUIsWUFBVTtBQUMvQixRQUFJQyxPQUFPO0FBQ1R5RCxvQkFBYzVELEVBQUUsZUFBRixFQUFtQkssR0FBbkIsRUFETDtBQUVUdUMsWUFBTTVDLEVBQUUsT0FBRixFQUFXSyxHQUFYLEVBRkc7QUFHVHdELFlBQU03RCxFQUFFLE9BQUYsRUFBV0ssR0FBWCxFQUhHO0FBSVR5RCxnQkFBVTlELEVBQUUsV0FBRixFQUFlSyxHQUFmLEVBSkQ7QUFLVDBELGFBQU8vRCxFQUFFLFFBQUYsRUFBWUssR0FBWixFQUxFO0FBTVQyRCxhQUFPaEUsRUFBRSxRQUFGLEVBQVlLLEdBQVosRUFORTtBQU9UNEQsZUFBU2pFLEVBQUUsVUFBRixFQUFjSyxHQUFkLEVBUEE7QUFRVGdELHdCQUFrQnJELEVBQUUsbUJBQUYsRUFBdUJLLEdBQXZCLEVBUlQ7QUFTVGlELGtCQUFZdEQsRUFBRSxhQUFGLEVBQWlCSyxHQUFqQjtBQVRILEtBQVg7QUFXQSxRQUFHTCxFQUFFLGFBQUYsRUFBaUJLLEdBQWpCLEtBQXlCLENBQTVCLEVBQThCO0FBQzVCRixXQUFLbUQsVUFBTCxHQUFrQnRELEVBQUUsYUFBRixFQUFpQkssR0FBakIsRUFBbEI7QUFDRDtBQUNELFFBQUk2RCxXQUFXbEUsRUFBRSxnQ0FBRixDQUFmO0FBQ0EsUUFBSWtFLFNBQVN0RCxNQUFULEdBQWtCLENBQXRCLEVBQXlCO0FBQ3JCLFVBQUl1RCxjQUFjRCxTQUFTN0QsR0FBVCxFQUFsQjtBQUNBLFVBQUc4RCxlQUFlLENBQWxCLEVBQW9CO0FBQ2xCaEUsYUFBS2lFLFFBQUwsR0FBZ0IsS0FBaEI7QUFDRCxPQUZELE1BRU0sSUFBR0QsZUFBZSxDQUFsQixFQUFvQjtBQUN4QmhFLGFBQUtpRSxRQUFMLEdBQWdCLElBQWhCO0FBQ0FqRSxhQUFLa0Usb0JBQUwsR0FBNEJyRSxFQUFFLHVCQUFGLEVBQTJCSyxHQUEzQixFQUE1QjtBQUNBRixhQUFLbUUsYUFBTCxHQUFxQnRFLEVBQUUsZ0JBQUYsRUFBb0JLLEdBQXBCLEVBQXJCO0FBQ0FGLGFBQUtvRSxvQkFBTCxHQUE0QnZFLEVBQUUsdUJBQUYsRUFBMkJLLEdBQTNCLEVBQTVCO0FBQ0FGLGFBQUtxRSxpQkFBTCxHQUF5QnhFLEVBQUUsb0JBQUYsRUFBd0JLLEdBQXhCLEVBQXpCO0FBQ0FGLGFBQUtzRSxnQkFBTCxHQUF3QnpFLEVBQUUsbUJBQUYsRUFBdUJLLEdBQXZCLEVBQXhCO0FBQ0FGLGFBQUt1RSxjQUFMLEdBQXNCMUUsRUFBRSxpQkFBRixFQUFxQkssR0FBckIsRUFBdEI7QUFDRDtBQUNKO0FBQ0QsUUFBSUssS0FBS1YsRUFBRSxLQUFGLEVBQVNLLEdBQVQsRUFBVDtBQUNBLFFBQUdLLEdBQUdFLE1BQUgsSUFBYSxDQUFoQixFQUFrQjtBQUNoQixVQUFJQyxNQUFNLDJCQUFWO0FBQ0QsS0FGRCxNQUVLO0FBQ0gsVUFBSUEsTUFBTSw2QkFBNkJILEVBQXZDO0FBQ0Q7QUFDRGpCLGNBQVVxQixRQUFWLENBQW1CWCxJQUFuQixFQUF5QlUsR0FBekIsRUFBOEJILEVBQTlCO0FBQ0QsR0FyQ0Q7O0FBdUNBVixJQUFFLFNBQUYsRUFBYUUsRUFBYixDQUFnQixPQUFoQixFQUF5QixZQUFVO0FBQ2pDLFFBQUlXLE1BQU0sOEJBQVY7QUFDQSxRQUFJRSxTQUFTLHlCQUFiO0FBQ0EsUUFBSVosT0FBTztBQUNUTyxVQUFJVixFQUFFLEtBQUYsRUFBU0ssR0FBVDtBQURLLEtBQVg7QUFHQVosY0FBVXVCLFVBQVYsQ0FBcUJiLElBQXJCLEVBQTJCVSxHQUEzQixFQUFnQ0UsTUFBaEM7QUFDRCxHQVBEOztBQVNBZixJQUFFLHNCQUFGLEVBQTBCRSxFQUExQixDQUE2QixRQUE3QixFQUF1Q3lFLFlBQXZDOztBQUVBbEYsWUFBVWdFLGdCQUFWLENBQTJCLFlBQTNCLEVBQXlDLHNCQUF6Qzs7QUFFQSxNQUFHekQsRUFBRSxpQkFBRixFQUFxQjhCLEVBQXJCLENBQXdCLFNBQXhCLENBQUgsRUFBc0M7QUFDcEM5QixNQUFFLFlBQUYsRUFBZ0I0RSxJQUFoQixDQUFxQixTQUFyQixFQUFnQyxJQUFoQztBQUNELEdBRkQsTUFFSztBQUNINUUsTUFBRSxZQUFGLEVBQWdCNEUsSUFBaEIsQ0FBcUIsU0FBckIsRUFBZ0MsSUFBaEM7QUFDRDtBQUVGLENBakVEOztBQW1FQTs7O0FBR0EsSUFBSUQsZUFBZSxTQUFmQSxZQUFlLEdBQVU7QUFDM0I7QUFDQSxNQUFJVCxXQUFXbEUsRUFBRSxnQ0FBRixDQUFmO0FBQ0EsTUFBSWtFLFNBQVN0RCxNQUFULEdBQWtCLENBQXRCLEVBQXlCO0FBQ3JCLFFBQUl1RCxjQUFjRCxTQUFTN0QsR0FBVCxFQUFsQjtBQUNBLFFBQUc4RCxlQUFlLENBQWxCLEVBQW9CO0FBQ2xCbkUsUUFBRSxlQUFGLEVBQW1CNkUsSUFBbkI7QUFDQTdFLFFBQUUsaUJBQUYsRUFBcUI4RSxJQUFyQjtBQUNELEtBSEQsTUFHTSxJQUFHWCxlQUFlLENBQWxCLEVBQW9CO0FBQ3hCbkUsUUFBRSxlQUFGLEVBQW1COEUsSUFBbkI7QUFDQTlFLFFBQUUsaUJBQUYsRUFBcUI2RSxJQUFyQjtBQUNEO0FBQ0o7QUFDRixDQWJELEM7Ozs7Ozs7O0FDeEVBLDZDQUFJcEYsWUFBWSxtQkFBQUMsQ0FBUSxDQUFSLENBQWhCOztBQUVBQyxRQUFRQyxJQUFSLEdBQWUsWUFBVTtBQUN2QkksSUFBRSxPQUFGLEVBQVdFLEVBQVgsQ0FBYyxPQUFkLEVBQXVCLFlBQVU7QUFDL0IsUUFBSUMsT0FBTztBQUNUeUMsWUFBTTVDLEVBQUUsT0FBRixFQUFXSyxHQUFYLEVBREc7QUFFVDJDLG1CQUFhaEQsRUFBRSxjQUFGLEVBQWtCSyxHQUFsQixFQUZKO0FBR1Q4QyxrQkFBWW5ELEVBQUUsYUFBRixFQUFpQkssR0FBakIsRUFISDtBQUlUK0Msc0JBQWdCcEQsRUFBRSxpQkFBRixFQUFxQkssR0FBckIsRUFKUDtBQUtUZ0Qsd0JBQWtCckQsRUFBRSxtQkFBRixFQUF1QkssR0FBdkI7QUFMVCxLQUFYO0FBT0EsUUFBSUssS0FBS1YsRUFBRSxLQUFGLEVBQVNLLEdBQVQsRUFBVDtBQUNBLFFBQUlpRCxhQUFhdEQsRUFBRSxhQUFGLEVBQWlCSyxHQUFqQixFQUFqQjtBQUNBLFFBQUdLLEdBQUdFLE1BQUgsSUFBYSxDQUFoQixFQUFrQjtBQUNoQixVQUFJQyxNQUFNLHFCQUFxQnlDLFVBQS9CO0FBQ0QsS0FGRCxNQUVLO0FBQ0gsVUFBSXpDLE1BQU0sc0JBQXNCSCxFQUFoQztBQUNEO0FBQ0RqQixjQUFVcUIsUUFBVixDQUFtQlgsSUFBbkIsRUFBeUJVLEdBQXpCLEVBQThCSCxFQUE5QjtBQUNELEdBaEJEOztBQWtCQVYsSUFBRSxTQUFGLEVBQWFFLEVBQWIsQ0FBZ0IsT0FBaEIsRUFBeUIsWUFBVTtBQUNqQyxRQUFJb0QsYUFBYXRELEVBQUUsYUFBRixFQUFpQkssR0FBakIsRUFBakI7QUFDQSxRQUFJUSxNQUFNLG9CQUFWO0FBQ0EsUUFBSUUsU0FBUyxpQkFBaUJ1QyxVQUE5QjtBQUNBLFFBQUluRCxPQUFPO0FBQ1RPLFVBQUlWLEVBQUUsS0FBRixFQUFTSyxHQUFUO0FBREssS0FBWDtBQUdBWixjQUFVdUIsVUFBVixDQUFxQmIsSUFBckIsRUFBMkJVLEdBQTNCLEVBQWdDRSxNQUFoQyxFQUF3QyxJQUF4QztBQUNELEdBUkQ7O0FBVUFmLElBQUUsYUFBRixFQUFpQkUsRUFBakIsQ0FBb0IsT0FBcEIsRUFBNkIsWUFBVTtBQUNyQyxRQUFJcUQsU0FBU0MsUUFBUSxvSkFBUixDQUFiO0FBQ0QsUUFBR0QsV0FBVyxJQUFkLEVBQW1CO0FBQ2hCLFVBQUkxQyxNQUFNLG1CQUFWO0FBQ0EsVUFBSVYsT0FBTztBQUNUTyxZQUFJVixFQUFFLEtBQUYsRUFBU0ssR0FBVDtBQURLLE9BQVg7QUFHQVosZ0JBQVVxQixRQUFWLENBQW1CWCxJQUFuQixFQUF5QlUsR0FBekIsRUFBOEJILEVBQTlCO0FBQ0Q7QUFDRixHQVREO0FBVUQsQ0F2Q0QsQzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDRkE7QUFDQTs7QUFFQTtBQUNBLG1CQUFBaEIsQ0FBUSxHQUFSOztBQUVBLElBQUlxRixNQUFNOztBQUVUO0FBQ0FDLFVBQVM7QUFDUjtBQUNBQyx1QkFBcUI7QUFDcEJDLGFBQVUsb0JBQVc7QUFDcEIsUUFBSUMsV0FBVyxtQkFBQXpGLENBQVEsQ0FBUixDQUFmO0FBQ0F5RixhQUFTdkYsSUFBVDtBQUNBLFFBQUl3RixPQUFPLG1CQUFBMUYsQ0FBUSxDQUFSLENBQVg7QUFDQTBGLFNBQUtDLFlBQUw7QUFDQSxJQU5tQjtBQU9wQkMsYUFBVSxvQkFBVztBQUNwQixRQUFJSCxXQUFXLG1CQUFBekYsQ0FBUSxDQUFSLENBQWY7QUFDQXlGLGFBQVN2RixJQUFUO0FBQ0EsUUFBSXdGLE9BQU8sbUJBQUExRixDQUFRLENBQVIsQ0FBWDtBQUNBMEYsU0FBS0MsWUFBTDtBQUNBO0FBWm1CLEdBRmI7O0FBaUJSO0FBQ0FFLHNCQUFvQjtBQUNuQjtBQUNBTCxhQUFVLG9CQUFXO0FBQ3BCLFFBQUlNLFdBQVcsbUJBQUE5RixDQUFRLEdBQVIsQ0FBZjtBQUNBOEYsYUFBUzVGLElBQVQ7QUFDQTtBQUxrQixHQWxCWjs7QUEwQlI7QUFDRTZGLDBCQUF3QjtBQUN6QjtBQUNHUCxhQUFVLG9CQUFXO0FBQ25CLFFBQUlDLFdBQVcsbUJBQUF6RixDQUFRLENBQVIsQ0FBZjtBQUNKeUYsYUFBU3ZGLElBQVQ7QUFDQSxRQUFJd0YsT0FBTyxtQkFBQTFGLENBQVEsQ0FBUixDQUFYO0FBQ0EwRixTQUFLQyxZQUFMO0FBQ0csSUFQcUI7QUFRekI7QUFDQUssWUFBUyxtQkFBVztBQUNuQixRQUFJQyxlQUFlLG1CQUFBakcsQ0FBUSxHQUFSLENBQW5CO0FBQ0FpRyxpQkFBYS9GLElBQWI7QUFDQTtBQVp3QixHQTNCbEI7O0FBMENSO0FBQ0FnRyxzQkFBb0I7QUFDbkI7QUFDQVYsYUFBVSxvQkFBVztBQUNwQixRQUFJVyxVQUFVLG1CQUFBbkcsQ0FBUSxHQUFSLENBQWQ7QUFDQW1HLFlBQVFqRyxJQUFSO0FBQ0E7QUFMa0IsR0EzQ1o7O0FBbURSO0FBQ0FrRyx1QkFBcUI7QUFDcEI7QUFDQVosYUFBVSxvQkFBVztBQUNwQixRQUFJekYsWUFBWSxtQkFBQUMsQ0FBUSxDQUFSLENBQWhCO0FBQ0FELGNBQVVHLElBQVY7QUFDQTtBQUxtQixHQXBEYjs7QUE0RFJtRyxzQkFBb0I7QUFDbkI7QUFDQUMsZ0JBQWEsdUJBQVc7QUFDdkIsUUFBSUMsY0FBYyxtQkFBQXZHLENBQVEsR0FBUixDQUFsQjtBQUNBdUcsZ0JBQVlyRyxJQUFaO0FBQ0EsSUFMa0I7QUFNbkI7QUFDQXNHLGtCQUFlLHlCQUFXO0FBQ3pCLFFBQUlELGNBQWMsbUJBQUF2RyxDQUFRLEdBQVIsQ0FBbEI7QUFDQXVHLGdCQUFZckcsSUFBWjtBQUNBO0FBVmtCLEdBNURaOztBQXlFUnVHLHNCQUFvQjtBQUNuQjtBQUNBQyxnQkFBYSx1QkFBVztBQUN2QixRQUFJQyxjQUFjLG1CQUFBM0csQ0FBUSxHQUFSLENBQWxCO0FBQ0EyRyxnQkFBWXpHLElBQVo7QUFDQSxJQUxrQjtBQU1uQjtBQUNBMEcsa0JBQWUseUJBQVc7QUFDekIsUUFBSUQsY0FBYyxtQkFBQTNHLENBQVEsR0FBUixDQUFsQjtBQUNBMkcsZ0JBQVl6RyxJQUFaO0FBQ0E7QUFWa0IsR0F6RVo7O0FBc0ZSMkcseUJBQXVCO0FBQ3RCO0FBQ0FDLG1CQUFnQiwwQkFBVztBQUMxQixRQUFJQyxpQkFBaUIsbUJBQUEvRyxDQUFRLEdBQVIsQ0FBckI7QUFDQStHLG1CQUFlN0csSUFBZjtBQUNBLElBTHFCO0FBTXRCO0FBQ0E4RyxxQkFBa0IsNEJBQVc7QUFDNUIsUUFBSUQsaUJBQWlCLG1CQUFBL0csQ0FBUSxHQUFSLENBQXJCO0FBQ0ErRyxtQkFBZTdHLElBQWY7QUFDQTtBQVZxQixHQXRGZjs7QUFtR1IrRywrQkFBNkI7QUFDNUI7QUFDQUMseUJBQXNCLGdDQUFXO0FBQ2hDLFFBQUlDLHVCQUF1QixtQkFBQW5ILENBQVEsR0FBUixDQUEzQjtBQUNBbUgseUJBQXFCakgsSUFBckI7QUFDQSxJQUwyQjtBQU01QjtBQUNBa0gsMkJBQXdCLGtDQUFXO0FBQ2xDLFFBQUlELHVCQUF1QixtQkFBQW5ILENBQVEsR0FBUixDQUEzQjtBQUNBbUgseUJBQXFCakgsSUFBckI7QUFDQTtBQVYyQixHQW5HckI7O0FBZ0hSbUgsc0JBQW9CO0FBQ25CO0FBQ0FDLGdCQUFhLHVCQUFXO0FBQ3ZCLFFBQUlDLGNBQWMsbUJBQUF2SCxDQUFRLEdBQVIsQ0FBbEI7QUFDQXVILGdCQUFZckgsSUFBWjtBQUNBO0FBTGtCLEdBaEhaOztBQXdIUnNILHVCQUFxQjtBQUNwQjtBQUNBQyxpQkFBYyx3QkFBVztBQUN4QixRQUFJQyxlQUFlLG1CQUFBMUgsQ0FBUSxHQUFSLENBQW5CO0FBQ0EwSCxpQkFBYXhILElBQWI7QUFDQTtBQUxtQixHQXhIYjs7QUFnSVJ5SCwyQkFBeUI7QUFDeEI7QUFDQUMscUJBQWtCLDRCQUFXO0FBQzVCLFFBQUlDLG1CQUFtQixtQkFBQTdILENBQVEsR0FBUixDQUF2QjtBQUNBNkgscUJBQWlCM0gsSUFBakI7QUFDQTtBQUx1QixHQWhJakI7O0FBd0lSNEgsc0JBQW9CO0FBQ25CO0FBQ0FDLGdCQUFhLHVCQUFXO0FBQ3ZCLFFBQUlDLFdBQVcsbUJBQUFoSSxDQUFRLEdBQVIsQ0FBZjtBQUNBZ0ksYUFBUzlILElBQVQ7QUFDQTtBQUxrQixHQXhJWjs7QUFnSlIrSCw0QkFBMEI7QUFDekI7QUFDQUMsc0JBQW1CLDZCQUFXO0FBQzdCLFFBQUlDLG9CQUFvQixtQkFBQW5JLENBQVEsR0FBUixDQUF4QjtBQUNBbUksc0JBQWtCakksSUFBbEI7QUFDQSxJQUx3QjtBQU16QjtBQUNBa0ksMkJBQXdCLGtDQUFXO0FBQ2xDLFFBQUlELG9CQUFvQixtQkFBQW5JLENBQVEsR0FBUixDQUF4QjtBQUNBbUksc0JBQWtCakksSUFBbEI7QUFDQSxJQVZ3QjtBQVd6QjtBQUNBbUksd0JBQXFCLCtCQUFXO0FBQy9CLFFBQUlGLG9CQUFvQixtQkFBQW5JLENBQVEsR0FBUixDQUF4QjtBQUNBbUksc0JBQWtCakksSUFBbEI7QUFDQTtBQWZ3QixHQWhKbEI7O0FBa0tSb0ksMkJBQXlCO0FBQ3hCO0FBQ0FDLHFCQUFrQiw0QkFBVztBQUM1QixRQUFJQyxtQkFBbUIsbUJBQUF4SSxDQUFRLEdBQVIsQ0FBdkI7QUFDQXdJLHFCQUFpQnRJLElBQWpCO0FBQ0EsSUFMdUI7QUFNeEI7QUFDQXVJLDBCQUF1QixpQ0FBVztBQUNqQyxRQUFJRCxtQkFBbUIsbUJBQUF4SSxDQUFRLEdBQVIsQ0FBdkI7QUFDQXdJLHFCQUFpQnRJLElBQWpCO0FBQ0EsSUFWdUI7QUFXeEI7QUFDQXdJLHVCQUFvQiw4QkFBVztBQUM5QixRQUFJRixtQkFBbUIsbUJBQUF4SSxDQUFRLEdBQVIsQ0FBdkI7QUFDQXdJLHFCQUFpQnRJLElBQWpCO0FBQ0E7QUFmdUIsR0FsS2pCOztBQW9MUnlJLG1CQUFpQjtBQUNoQjtBQUNBQyxhQUFVLG9CQUFXO0FBQ3BCLFFBQUlDLFdBQVcsbUJBQUE3SSxDQUFRLEdBQVIsQ0FBZjtBQUNBNkksYUFBUzNJLElBQVQ7QUFDQSxJQUxlO0FBTWhCO0FBQ0E0SSxrQkFBZSx5QkFBVztBQUN6QixRQUFJQyxhQUFhLG1CQUFBL0ksQ0FBUSxHQUFSLENBQWpCO0FBQ0ErSSxlQUFXN0ksSUFBWDtBQUNBLElBVmU7QUFXaEI7QUFDQThJLGVBQVksc0JBQVc7QUFDdEIsUUFBSUgsV0FBVyxtQkFBQTdJLENBQVEsR0FBUixDQUFmO0FBQ0E2SSxhQUFTM0ksSUFBVDtBQUNBO0FBZmUsR0FwTFQ7O0FBc01SK0ksMkJBQXlCO0FBQ3hCO0FBQ0FDLG9CQUFpQiwyQkFBVztBQUMzQixRQUFJQyxtQkFBbUIsbUJBQUFuSixDQUFRLEdBQVIsQ0FBdkI7QUFDQW1KLHFCQUFpQmpKLElBQWpCO0FBQ0EsSUFMdUI7QUFNeEI7QUFDQWtKLHVCQUFvQiw4QkFBVztBQUM5QixRQUFJRCxtQkFBbUIsbUJBQUFuSixDQUFRLEdBQVIsQ0FBdkI7QUFDQW1KLHFCQUFpQmpKLElBQWpCO0FBQ0E7QUFWdUIsR0F0TWpCOztBQW1OUm1KLDhCQUE0QjtBQUMzQjtBQUNBQyx3QkFBcUIsK0JBQVc7QUFDL0IsUUFBSUMsc0JBQXNCLG1CQUFBdkosQ0FBUSxHQUFSLENBQTFCO0FBQ0F1Six3QkFBb0JySixJQUFwQjtBQUNBLElBTDBCO0FBTTNCO0FBQ0FzSiwwQkFBdUIsaUNBQVc7QUFDakMsUUFBSUQsc0JBQXNCLG1CQUFBdkosQ0FBUSxHQUFSLENBQTFCO0FBQ0F1Six3QkFBb0JySixJQUFwQjtBQUNBO0FBVjBCLEdBbk5wQjs7QUFnT1J1Six3QkFBc0I7QUFDckI7QUFDQUMsaUJBQWMsd0JBQVc7QUFDeEIsUUFBSUMsWUFBWSxtQkFBQTNKLENBQVEsR0FBUixDQUFoQjtBQUNBMkosY0FBVXpKLElBQVY7QUFDQSxJQUxvQjtBQU1yQnNGLGFBQVUsb0JBQVc7QUFDcEIsUUFBSW1FLFlBQVksbUJBQUEzSixDQUFRLEdBQVIsQ0FBaEI7QUFDQTJKLGNBQVV6SixJQUFWO0FBQ0EsSUFUb0I7QUFVckIwSixpQkFBYyx3QkFBVTtBQUN2QixRQUFJRCxZQUFZLG1CQUFBM0osQ0FBUSxHQUFSLENBQWhCO0FBQ0EySixjQUFVekosSUFBVjtBQUNBLElBYm9CO0FBY3JCMkosa0JBQWUseUJBQVU7QUFDeEIsUUFBSUYsWUFBWSxtQkFBQTNKLENBQVEsR0FBUixDQUFoQjtBQUNBMkosY0FBVXpKLElBQVY7QUFDQTtBQWpCb0I7O0FBaE9kLEVBSEE7O0FBeVBUO0FBQ0E7QUFDQTtBQUNBO0FBQ0FBLE9BQU0sY0FBUzRKLFVBQVQsRUFBcUJDLE1BQXJCLEVBQTZCO0FBQ2xDLE1BQUksT0FBTyxLQUFLekUsT0FBTCxDQUFhd0UsVUFBYixDQUFQLEtBQW9DLFdBQXBDLElBQW1ELE9BQU8sS0FBS3hFLE9BQUwsQ0FBYXdFLFVBQWIsRUFBeUJDLE1BQXpCLENBQVAsS0FBNEMsV0FBbkcsRUFBZ0g7QUFDL0c7QUFDQSxVQUFPMUUsSUFBSUMsT0FBSixDQUFZd0UsVUFBWixFQUF3QkMsTUFBeEIsR0FBUDtBQUNBO0FBQ0Q7QUFsUVEsQ0FBVjs7QUFxUUE7QUFDQUMsT0FBTzNFLEdBQVAsR0FBYUEsR0FBYixDOzs7Ozs7O0FDNVFBLDRFQUFBMkUsT0FBT0MsQ0FBUCxHQUFXLG1CQUFBakssQ0FBUSxFQUFSLENBQVg7O0FBRUE7Ozs7OztBQU1BZ0ssT0FBTzFKLENBQVAsR0FBVyx1Q0FBZ0IsbUJBQUFOLENBQVEsQ0FBUixDQUEzQjs7QUFFQSxtQkFBQUEsQ0FBUSxFQUFSOztBQUVBOzs7Ozs7QUFNQWdLLE9BQU9FLEtBQVAsR0FBZSxtQkFBQWxLLENBQVEsRUFBUixDQUFmOztBQUVBO0FBQ0FnSyxPQUFPRSxLQUFQLENBQWFDLFFBQWIsQ0FBc0JDLE9BQXRCLENBQThCQyxNQUE5QixDQUFxQyxrQkFBckMsSUFBMkQsZ0JBQTNEOztBQUVBOzs7Ozs7QUFNQSxJQUFJQyxRQUFRaEksU0FBU2lJLElBQVQsQ0FBY0MsYUFBZCxDQUE0Qix5QkFBNUIsQ0FBWjs7QUFFQSxJQUFJRixLQUFKLEVBQVc7QUFDUE4sU0FBT0UsS0FBUCxDQUFhQyxRQUFiLENBQXNCQyxPQUF0QixDQUE4QkMsTUFBOUIsQ0FBcUMsY0FBckMsSUFBdURDLE1BQU1HLE9BQTdEO0FBQ0gsQ0FGRCxNQUVPO0FBQ0hDLFVBQVFDLEtBQVIsQ0FBYyx1RUFBZDtBQUNILEM7Ozs7Ozs7O0FDbkNEO0FBQ0EsSUFBSWpGLE9BQU8sbUJBQUExRixDQUFRLENBQVIsQ0FBWDtBQUNBLG1CQUFBQSxDQUFRLEdBQVI7QUFDQSxtQkFBQUEsQ0FBUSxFQUFSO0FBQ0EsbUJBQUFBLENBQVEsR0FBUjtBQUNBLG1CQUFBQSxDQUFRLEVBQVI7O0FBRUE7QUFDQUMsUUFBUUcsZ0JBQVIsR0FBMkI7QUFDekIsZ0JBQWMsRUFEVztBQUV6QixrQkFBZ0I7O0FBR2xCOzs7Ozs7QUFMMkIsQ0FBM0IsQ0FXQUgsUUFBUUMsSUFBUixHQUFlLFVBQVNDLE9BQVQsRUFBaUI7QUFDOUJBLGNBQVlBLFVBQVVGLFFBQVFHLGdCQUE5QjtBQUNBRSxJQUFFLFFBQUYsRUFBWXNLLFNBQVosQ0FBc0J6SyxPQUF0QjtBQUNBdUYsT0FBS0MsWUFBTDs7QUFFQXJGLElBQUUsc0JBQUYsRUFBMEJFLEVBQTFCLENBQTZCLE9BQTdCLEVBQXNDLFlBQVU7QUFDOUNGLE1BQUUsTUFBRixFQUFVdUssV0FBVixDQUFzQixjQUF0QjtBQUNELEdBRkQ7QUFHRCxDQVJEOztBQVVBOzs7Ozs7OztBQVFBNUssUUFBUW1CLFFBQVIsR0FBbUIsVUFBU1gsSUFBVCxFQUFlVSxHQUFmLEVBQW9CSCxFQUFwQixFQUF3QjhKLFdBQXhCLEVBQW9DO0FBQ3JEQSxrQkFBZ0JBLGNBQWMsS0FBOUI7QUFDQXhLLElBQUUsT0FBRixFQUFXeUssV0FBWCxDQUF1QixXQUF2QjtBQUNBZixTQUFPRSxLQUFQLENBQWFjLElBQWIsQ0FBa0I3SixHQUFsQixFQUF1QlYsSUFBdkIsRUFDR3dLLElBREgsQ0FDUSxVQUFTQyxRQUFULEVBQWtCO0FBQ3RCeEYsU0FBS3lGLGVBQUw7QUFDQTdLLE1BQUUsT0FBRixFQUFXOEssUUFBWCxDQUFvQixXQUFwQjtBQUNBLFFBQUdwSyxHQUFHRSxNQUFILElBQWEsQ0FBaEIsRUFBa0I7QUFDaEJaLFFBQUUrSyxRQUFGLEVBQVlDLElBQVosQ0FBaUIsTUFBakIsRUFBeUJKLFNBQVN6SyxJQUFsQztBQUNELEtBRkQsTUFFSztBQUNIaUYsV0FBSzZGLGNBQUwsQ0FBb0JMLFNBQVN6SyxJQUE3QixFQUFtQyxTQUFuQztBQUNBLFVBQUdxSyxXQUFILEVBQWdCN0ssUUFBUTZLLFdBQVIsQ0FBb0I5SixFQUFwQjtBQUNqQjtBQUNGLEdBVkgsRUFXR3dLLEtBWEgsQ0FXUyxVQUFTYixLQUFULEVBQWU7QUFDcEJqRixTQUFLK0YsV0FBTCxDQUFpQixNQUFqQixFQUF5QixHQUF6QixFQUE4QmQsS0FBOUI7QUFDRCxHQWJIO0FBY0QsQ0FqQkQ7O0FBbUJBOzs7Ozs7O0FBT0ExSyxRQUFReUwsYUFBUixHQUF3QixVQUFTakwsSUFBVCxFQUFlVSxHQUFmLEVBQW9Cd0ssT0FBcEIsRUFBNEI7QUFDbERyTCxJQUFFLE9BQUYsRUFBV3lLLFdBQVgsQ0FBdUIsV0FBdkI7QUFDQWYsU0FBT0UsS0FBUCxDQUFhYyxJQUFiLENBQWtCN0osR0FBbEIsRUFBdUJWLElBQXZCLEVBQ0d3SyxJQURILENBQ1EsVUFBU0MsUUFBVCxFQUFrQjtBQUN0QnhGLFNBQUt5RixlQUFMO0FBQ0E3SyxNQUFFLE9BQUYsRUFBVzhLLFFBQVgsQ0FBb0IsV0FBcEI7QUFDQTlLLE1BQUVxTCxPQUFGLEVBQVdDLEtBQVgsQ0FBaUIsTUFBakI7QUFDQXRMLE1BQUUsUUFBRixFQUFZc0ssU0FBWixHQUF3QmlCLElBQXhCLENBQTZCQyxNQUE3QjtBQUNBcEcsU0FBSzZGLGNBQUwsQ0FBb0JMLFNBQVN6SyxJQUE3QixFQUFtQyxTQUFuQztBQUNELEdBUEgsRUFRRytLLEtBUkgsQ0FRUyxVQUFTYixLQUFULEVBQWU7QUFDcEJqRixTQUFLK0YsV0FBTCxDQUFpQixNQUFqQixFQUF5QixHQUF6QixFQUE4QmQsS0FBOUI7QUFDRCxHQVZIO0FBV0QsQ0FiRDs7QUFlQTs7Ozs7QUFLQTFLLFFBQVE2SyxXQUFSLEdBQXNCLFVBQVM5SixFQUFULEVBQVk7QUFDaENnSixTQUFPRSxLQUFQLENBQWF6SCxHQUFiLENBQWlCLGtCQUFrQnpCLEVBQW5DLEVBQ0dpSyxJQURILENBQ1EsVUFBU0MsUUFBVCxFQUFrQjtBQUN0QjVLLE1BQUUsVUFBRixFQUFjSyxHQUFkLENBQWtCdUssU0FBU3pLLElBQTNCO0FBQ0FILE1BQUUsU0FBRixFQUFhZ0wsSUFBYixDQUFrQixLQUFsQixFQUF5QkosU0FBU3pLLElBQWxDO0FBQ0QsR0FKSCxFQUtHK0ssS0FMSCxDQUtTLFVBQVNiLEtBQVQsRUFBZTtBQUNwQmpGLFNBQUsrRixXQUFMLENBQWlCLGtCQUFqQixFQUFxQyxFQUFyQyxFQUF5Q2QsS0FBekM7QUFDRCxHQVBIO0FBUUQsQ0FURDs7QUFXQTs7Ozs7Ozs7QUFRQTFLLFFBQVFxQixVQUFSLEdBQXFCLFVBQVViLElBQVYsRUFBZ0JVLEdBQWhCLEVBQXFCRSxNQUFyQixFQUEwQztBQUFBLE1BQWIwSyxJQUFhLHVFQUFOLEtBQU07O0FBQzdELE1BQUdBLElBQUgsRUFBUTtBQUNOLFFBQUlsSSxTQUFTQyxRQUFRLGVBQVIsQ0FBYjtBQUNELEdBRkQsTUFFSztBQUNILFFBQUlELFNBQVNDLFFBQVEsOEZBQVIsQ0FBYjtBQUNEO0FBQ0YsTUFBR0QsV0FBVyxJQUFkLEVBQW1CO0FBQ2hCdkQsTUFBRSxPQUFGLEVBQVd5SyxXQUFYLENBQXVCLFdBQXZCO0FBQ0FmLFdBQU9FLEtBQVAsQ0FBYWMsSUFBYixDQUFrQjdKLEdBQWxCLEVBQXVCVixJQUF2QixFQUNHd0ssSUFESCxDQUNRLFVBQVNDLFFBQVQsRUFBa0I7QUFDdEI1SyxRQUFFK0ssUUFBRixFQUFZQyxJQUFaLENBQWlCLE1BQWpCLEVBQXlCakssTUFBekI7QUFDRCxLQUhILEVBSUdtSyxLQUpILENBSVMsVUFBU2IsS0FBVCxFQUFlO0FBQ3BCakYsV0FBSytGLFdBQUwsQ0FBaUIsUUFBakIsRUFBMkIsR0FBM0IsRUFBZ0NkLEtBQWhDO0FBQ0QsS0FOSDtBQU9EO0FBQ0YsQ0FoQkQ7O0FBa0JBOzs7Ozs7O0FBT0ExSyxRQUFRK0wsZUFBUixHQUEwQixVQUFVdkwsSUFBVixFQUFnQlUsR0FBaEIsRUFBcUJ3SyxPQUFyQixFQUE2QjtBQUNyRCxNQUFJOUgsU0FBU0MsUUFBUSxlQUFSLENBQWI7QUFDRCxNQUFHRCxXQUFXLElBQWQsRUFBbUI7QUFDaEJ2RCxNQUFFLE9BQUYsRUFBV3lLLFdBQVgsQ0FBdUIsV0FBdkI7QUFDQWYsV0FBT0UsS0FBUCxDQUFhYyxJQUFiLENBQWtCN0osR0FBbEIsRUFBdUJWLElBQXZCLEVBQ0d3SyxJQURILENBQ1EsVUFBU0MsUUFBVCxFQUFrQjtBQUN0QnhGLFdBQUt5RixlQUFMO0FBQ0E3SyxRQUFFLE9BQUYsRUFBVzhLLFFBQVgsQ0FBb0IsV0FBcEI7QUFDQTlLLFFBQUVxTCxPQUFGLEVBQVdDLEtBQVgsQ0FBaUIsTUFBakI7QUFDQXRMLFFBQUUsUUFBRixFQUFZc0ssU0FBWixHQUF3QmlCLElBQXhCLENBQTZCQyxNQUE3QjtBQUNBcEcsV0FBSzZGLGNBQUwsQ0FBb0JMLFNBQVN6SyxJQUE3QixFQUFtQyxTQUFuQztBQUNELEtBUEgsRUFRRytLLEtBUkgsQ0FRUyxVQUFTYixLQUFULEVBQWU7QUFDcEJqRixXQUFLK0YsV0FBTCxDQUFpQixRQUFqQixFQUEyQixHQUEzQixFQUFnQ2QsS0FBaEM7QUFDRCxLQVZIO0FBV0Q7QUFDRixDQWhCRDs7QUFrQkE7Ozs7Ozs7QUFPQTFLLFFBQVFzQixXQUFSLEdBQXNCLFVBQVNkLElBQVQsRUFBZVUsR0FBZixFQUFvQkUsTUFBcEIsRUFBMkI7QUFDL0MsTUFBSXdDLFNBQVNDLFFBQVEsZUFBUixDQUFiO0FBQ0QsTUFBR0QsV0FBVyxJQUFkLEVBQW1CO0FBQ2hCdkQsTUFBRSxPQUFGLEVBQVd5SyxXQUFYLENBQXVCLFdBQXZCO0FBQ0EsUUFBSXRLLE9BQU87QUFDVE8sVUFBSVYsRUFBRSxLQUFGLEVBQVNLLEdBQVQ7QUFESyxLQUFYO0FBR0FxSixXQUFPRSxLQUFQLENBQWFjLElBQWIsQ0FBa0I3SixHQUFsQixFQUF1QlYsSUFBdkIsRUFDR3dLLElBREgsQ0FDUSxVQUFTQyxRQUFULEVBQWtCO0FBQ3RCNUssUUFBRStLLFFBQUYsRUFBWUMsSUFBWixDQUFpQixNQUFqQixFQUF5QmpLLE1BQXpCO0FBQ0QsS0FISCxFQUlHbUssS0FKSCxDQUlTLFVBQVNiLEtBQVQsRUFBZTtBQUNwQmpGLFdBQUsrRixXQUFMLENBQWlCLFNBQWpCLEVBQTRCLEdBQTVCLEVBQWlDZCxLQUFqQztBQUNELEtBTkg7QUFPRDtBQUNGLENBZkQ7O0FBaUJBMUssUUFBUThELGdCQUFSLEdBQTJCLFVBQVMvQyxFQUFULEVBQWFHLEdBQWIsRUFBaUI7QUFDMUN1RSxPQUFLM0IsZ0JBQUwsQ0FBc0IvQyxFQUF0QixFQUEwQkcsR0FBMUI7QUFDRCxDQUZEOztBQUlBbEIsUUFBUWdNLG9CQUFSLEdBQStCLFVBQVNqTCxFQUFULEVBQWFHLEdBQWIsRUFBaUI7QUFDOUN1RSxPQUFLdUcsb0JBQUwsQ0FBMEJqTCxFQUExQixFQUE4QkcsR0FBOUI7QUFDRCxDQUZEOztBQUlBbEIsUUFBUWlNLG1CQUFSLEdBQThCLFVBQVNsTCxFQUFULEVBQWFtTCxLQUFiLEVBQW1CO0FBQy9DekcsT0FBS3dHLG1CQUFMLENBQXlCbEwsRUFBekIsRUFBNkJtTCxLQUE3QjtBQUNELENBRkQsQzs7Ozs7Ozs7QUNqTEE7QUFDQSxtQkFBQW5NLENBQVEsRUFBUjtBQUNBLG1CQUFBQSxDQUFRLEVBQVI7QUFDQSxJQUFJb00sU0FBUyxtQkFBQXBNLENBQVEsQ0FBUixDQUFiO0FBQ0EsSUFBSTBGLE9BQU8sbUJBQUExRixDQUFRLENBQVIsQ0FBWDtBQUNBLG1CQUFBQSxDQUFRLEdBQVI7QUFDQSxJQUFJeUYsV0FBVyxtQkFBQXpGLENBQVEsQ0FBUixDQUFmOztBQUVBO0FBQ0FDLFFBQVFvTSxlQUFSLEdBQTBCLEVBQTFCOztBQUVBO0FBQ0FwTSxRQUFRcU0saUJBQVIsR0FBNEIsQ0FBQyxDQUE3Qjs7QUFFQTtBQUNBck0sUUFBUXNNLG1CQUFSLEdBQThCLEVBQTlCOztBQUVBO0FBQ0F0TSxRQUFRdU0sWUFBUixHQUF1QjtBQUN0QkMsU0FBUTtBQUNQQyxRQUFNLGlCQURDO0FBRVBDLFVBQVEsT0FGRDtBQUdQQyxTQUFPO0FBSEEsRUFEYztBQU10Qm5ILFdBQVUsS0FOWTtBQU90Qm9ILGFBQVksSUFQVTtBQVF0QkMsU0FBUSxNQVJjO0FBU3RCQyxXQUFVLEtBVFk7QUFVdEJDLGdCQUFlO0FBQ2RDLFNBQU8sTUFETyxFQUNDO0FBQ2ZDLE9BQUssT0FGUyxFQUVBO0FBQ2RDLE9BQUssQ0FBRSxDQUFGLEVBQUssQ0FBTCxFQUFRLENBQVIsRUFBVyxDQUFYLEVBQWMsQ0FBZDtBQUhTLEVBVk87QUFldEJDLGNBQWEsWUFmUztBQWdCdEJDLFFBQU87QUFDTkMsVUFBUTtBQUNQQyxlQUFZLEtBREw7QUFFUEMsaUJBQWMsVUFGUDtBQUdQQyxZQUFTLFVBSEY7QUFJUEMsWUFBUztBQUpGO0FBREYsRUFoQmU7QUF3QnRCQyxlQUFjLENBQ2I7QUFDQ3hNLE9BQUssdUJBRE47QUFFQ3lNLFFBQU0sS0FGUDtBQUdDakQsU0FBTyxpQkFBVztBQUNqQjFILFNBQU0sNkNBQU47QUFDQSxHQUxGO0FBTUM0SyxTQUFPLFNBTlI7QUFPQ0MsYUFBVztBQVBaLEVBRGEsRUFVYjtBQUNDM00sT0FBSyx3QkFETjtBQUVDeU0sUUFBTSxLQUZQO0FBR0NqRCxTQUFPLGlCQUFXO0FBQ2pCMUgsU0FBTSw4Q0FBTjtBQUNBLEdBTEY7QUFNQzRLLFNBQU8sU0FOUjtBQU9DQyxhQUFXO0FBUFosRUFWYSxDQXhCUTtBQTRDdEJDLGFBQVksSUE1Q1U7QUE2Q3RCQyxlQUFjLElBN0NRO0FBOEN0QkMsZ0JBQWUsdUJBQVNwTCxLQUFULEVBQWdCO0FBQzlCLFNBQU9BLE1BQU1xTCxTQUFOLEtBQW9CLFlBQTNCO0FBQ0EsRUFoRHFCO0FBaUR0QkMsYUFBWTtBQWpEVSxDQUF2Qjs7QUFvREE7QUFDQWxPLFFBQVFtTyxjQUFSLEdBQXlCO0FBQ3ZCQyxxQkFBb0IsQ0FBQyxDQUFELEVBQUksQ0FBSixDQURHO0FBRXZCQyxTQUFRLEtBRmU7QUFHdkJDLFdBQVUsRUFIYTtBQUl2QkMsZUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sRUFBUCxFQUFXLEVBQVgsRUFBZSxFQUFmLEVBQW1CLEVBQW5CLEVBQXVCLEVBQXZCLEVBQTJCLEVBQTNCLEVBQStCLEVBQS9CLEVBQW1DLEVBQW5DLENBSlM7QUFLdkJDLFVBQVMsRUFMYztBQU12QkMsYUFBWSxJQU5XO0FBT3ZCQyxpQkFBZ0IsSUFQTztBQVF2QkMsbUJBQWtCO0FBUkssQ0FBekI7O0FBV0E7QUFDQTNPLFFBQVE0TyxrQkFBUixHQUE2QjtBQUMzQlIscUJBQW9CLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FETztBQUUzQkMsU0FBUSxZQUZtQjtBQUczQkssaUJBQWdCLElBSFc7QUFJM0JDLG1CQUFrQjtBQUpTLENBQTdCOztBQU9BOzs7Ozs7QUFNQTNPLFFBQVFDLElBQVIsR0FBZSxZQUFVOztBQUV4QjtBQUNBd0YsTUFBS0MsWUFBTDs7QUFFQTtBQUNBRixVQUFTdkYsSUFBVDs7QUFFQTtBQUNBOEosUUFBTzhFLE9BQVAsS0FBbUI5RSxPQUFPOEUsT0FBUCxHQUFpQixLQUFwQztBQUNBOUUsUUFBTytFLE1BQVAsS0FBa0IvRSxPQUFPK0UsTUFBUCxHQUFnQixLQUFsQzs7QUFFQTtBQUNBOU8sU0FBUXFNLGlCQUFSLEdBQTRCaE0sRUFBRSxvQkFBRixFQUF3QkssR0FBeEIsR0FBOEJxTyxJQUE5QixFQUE1Qjs7QUFFQTtBQUNBL08sU0FBUXVNLFlBQVIsQ0FBcUJtQixZQUFyQixDQUFrQyxDQUFsQyxFQUFxQ2xOLElBQXJDLEdBQTRDLEVBQUNPLElBQUlmLFFBQVFxTSxpQkFBYixFQUE1Qzs7QUFFQTtBQUNBck0sU0FBUXVNLFlBQVIsQ0FBcUJtQixZQUFyQixDQUFrQyxDQUFsQyxFQUFxQ2xOLElBQXJDLEdBQTRDLEVBQUNPLElBQUlmLFFBQVFxTSxpQkFBYixFQUE1Qzs7QUFFQTtBQUNBLEtBQUdoTSxFQUFFMEosTUFBRixFQUFVaUYsS0FBVixLQUFvQixHQUF2QixFQUEyQjtBQUMxQmhQLFVBQVF1TSxZQUFSLENBQXFCWSxXQUFyQixHQUFtQyxXQUFuQztBQUNBOztBQUVEO0FBQ0EsS0FBRyxDQUFDcEQsT0FBTytFLE1BQVgsRUFBa0I7QUFDakI7QUFDQSxNQUFHL0UsT0FBTzhFLE9BQVYsRUFBa0I7O0FBRWpCO0FBQ0F4TyxLQUFFLGNBQUYsRUFBa0JFLEVBQWxCLENBQXFCLGdCQUFyQixFQUF1QyxZQUFZO0FBQ2pERixNQUFFLFFBQUYsRUFBWW1CLEtBQVo7QUFDRCxJQUZEOztBQUlBO0FBQ0FuQixLQUFFLFFBQUYsRUFBWTRFLElBQVosQ0FBaUIsVUFBakIsRUFBNkIsS0FBN0I7QUFDQTVFLEtBQUUsUUFBRixFQUFZNEUsSUFBWixDQUFpQixVQUFqQixFQUE2QixLQUE3QjtBQUNBNUUsS0FBRSxZQUFGLEVBQWdCNEUsSUFBaEIsQ0FBcUIsVUFBckIsRUFBaUMsS0FBakM7QUFDQTVFLEtBQUUsYUFBRixFQUFpQnlLLFdBQWpCLENBQTZCLHFCQUE3QjtBQUNBekssS0FBRSxNQUFGLEVBQVU0RSxJQUFWLENBQWUsVUFBZixFQUEyQixLQUEzQjtBQUNBNUUsS0FBRSxXQUFGLEVBQWV5SyxXQUFmLENBQTJCLHFCQUEzQjtBQUNBekssS0FBRSxlQUFGLEVBQW1CNkUsSUFBbkI7QUFDQTdFLEtBQUUsWUFBRixFQUFnQjZFLElBQWhCOztBQUVBO0FBQ0E3RSxLQUFFLGNBQUYsRUFBa0JFLEVBQWxCLENBQXFCLGlCQUFyQixFQUF3QzBPLFNBQXhDOztBQUVBO0FBQ0E1TyxLQUFFLG1CQUFGLEVBQXVCNk8sSUFBdkIsQ0FBNEIsT0FBNUIsRUFBcUNDLFVBQXJDOztBQUVBOU8sS0FBRSxpQkFBRixFQUFxQkUsRUFBckIsQ0FBd0IsZ0JBQXhCLEVBQTBDLFlBQVk7QUFDcERGLE1BQUUsU0FBRixFQUFhbUIsS0FBYjtBQUNELElBRkQ7O0FBSUFuQixLQUFFLGlCQUFGLEVBQXFCRSxFQUFyQixDQUF3QixpQkFBeEIsRUFBMkMsWUFBVTtBQUNwREYsTUFBRSxpQkFBRixFQUFxQjhFLElBQXJCO0FBQ0E5RSxNQUFFLGtCQUFGLEVBQXNCOEUsSUFBdEI7QUFDQTlFLE1BQUUsaUJBQUYsRUFBcUI4RSxJQUFyQjtBQUNBOUUsTUFBRSxJQUFGLEVBQVF5QyxJQUFSLENBQWEsTUFBYixFQUFxQixDQUFyQixFQUF3QnNNLEtBQXhCO0FBQ0cvTyxNQUFFLElBQUYsRUFBUXlDLElBQVIsQ0FBYSxZQUFiLEVBQTJCdU0sSUFBM0IsQ0FBZ0MsWUFBVTtBQUM1Q2hQLE9BQUUsSUFBRixFQUFReUssV0FBUixDQUFvQixXQUFwQjtBQUNBLEtBRkU7QUFHSHpLLE1BQUUsSUFBRixFQUFReUMsSUFBUixDQUFhLGFBQWIsRUFBNEJ1TSxJQUE1QixDQUFpQyxZQUFVO0FBQzFDaFAsT0FBRSxJQUFGLEVBQVFpUCxJQUFSLENBQWEsRUFBYjtBQUNBLEtBRkQ7QUFHQSxJQVhEOztBQWFBalAsS0FBRSxjQUFGLEVBQWtCRSxFQUFsQixDQUFxQixpQkFBckIsRUFBd0NnUCxhQUF4Qzs7QUFFQWxQLEtBQUUsa0JBQUYsRUFBc0JFLEVBQXRCLENBQXlCLGlCQUF6QixFQUE0Q2dQLGFBQTVDOztBQUVBbFAsS0FBRSxrQkFBRixFQUFzQkUsRUFBdEIsQ0FBeUIsaUJBQXpCLEVBQTRDLFlBQVU7QUFDckRGLE1BQUUsV0FBRixFQUFlbVAsWUFBZixDQUE0QixlQUE1QjtBQUNBLElBRkQ7O0FBSUE7QUFDQW5QLEtBQUUsWUFBRixFQUFnQm9QLFlBQWhCLENBQTZCO0FBQ3pCQyxnQkFBWSxzQkFEYTtBQUV6QkMsa0JBQWM7QUFDYkMsZUFBVTtBQURHLEtBRlc7QUFLekJDLGNBQVUsa0JBQVVDLFVBQVYsRUFBc0I7QUFDNUJ6UCxPQUFFLGVBQUYsRUFBbUJLLEdBQW5CLENBQXVCb1AsV0FBV3RQLElBQWxDO0FBQ0gsS0FQd0I7QUFRekJ1UCxxQkFBaUIseUJBQVM5RSxRQUFULEVBQW1CO0FBQ2hDLFlBQU87QUFDSCtFLG1CQUFhM1AsRUFBRTRQLEdBQUYsQ0FBTWhGLFNBQVN6SyxJQUFmLEVBQXFCLFVBQVMwUCxRQUFULEVBQW1CO0FBQ2pELGNBQU8sRUFBRWhFLE9BQU9nRSxTQUFTaEUsS0FBbEIsRUFBeUIxTCxNQUFNMFAsU0FBUzFQLElBQXhDLEVBQVA7QUFDSCxPQUZZO0FBRFYsTUFBUDtBQUtIO0FBZHdCLElBQTdCOztBQWlCQUgsS0FBRSxtQkFBRixFQUF1QjhQLGNBQXZCLENBQXNDblEsUUFBUW1PLGNBQTlDOztBQUVDOU4sS0FBRSxpQkFBRixFQUFxQjhQLGNBQXJCLENBQW9DblEsUUFBUW1PLGNBQTVDOztBQUVBaUMsbUJBQWdCLFFBQWhCLEVBQTBCLE1BQTFCLEVBQWtDLFdBQWxDOztBQUVBL1AsS0FBRSxvQkFBRixFQUF3QjhQLGNBQXhCLENBQXVDblEsUUFBUW1PLGNBQS9DOztBQUVBOU4sS0FBRSxrQkFBRixFQUFzQjhQLGNBQXRCLENBQXFDblEsUUFBUW1PLGNBQTdDOztBQUVBaUMsbUJBQWdCLFNBQWhCLEVBQTJCLE9BQTNCLEVBQW9DLFlBQXBDOztBQUVBL1AsS0FBRSwwQkFBRixFQUE4QjhQLGNBQTlCLENBQTZDblEsUUFBUTRPLGtCQUFyRDs7QUFFRDtBQUNBNU8sV0FBUXVNLFlBQVIsQ0FBcUI4RCxXQUFyQixHQUFtQyxVQUFTek4sS0FBVCxFQUFnQjhJLE9BQWhCLEVBQXdCO0FBQzFEQSxZQUFRUCxRQUFSLENBQWlCLGNBQWpCO0FBQ0EsSUFGRDtBQUdBbkwsV0FBUXVNLFlBQVIsQ0FBcUIrRCxVQUFyQixHQUFrQyxVQUFTMU4sS0FBVCxFQUFnQjhJLE9BQWhCLEVBQXlCNkUsSUFBekIsRUFBOEI7QUFDL0QsUUFBRzNOLE1BQU0rSyxJQUFOLElBQWMsR0FBakIsRUFBcUI7QUFDcEJ0TixPQUFFLFlBQUYsRUFBZ0JLLEdBQWhCLENBQW9Ca0MsTUFBTTROLFdBQTFCO0FBQ0FuUSxPQUFFLGVBQUYsRUFBbUJLLEdBQW5CLENBQXVCa0MsTUFBTWUsVUFBN0I7QUFDQThNLHFCQUFnQjdOLEtBQWhCO0FBQ0EsS0FKRCxNQUlNLElBQUlBLE1BQU0rSyxJQUFOLElBQWMsR0FBbEIsRUFBc0I7QUFDM0IzTixhQUFRb00sZUFBUixHQUEwQjtBQUN6QnhKLGFBQU9BO0FBRGtCLE1BQTFCO0FBR0EsU0FBR0EsTUFBTThOLE1BQU4sSUFBZ0IsR0FBbkIsRUFBdUI7QUFDdEJDO0FBQ0EsTUFGRCxNQUVLO0FBQ0p0USxRQUFFLGlCQUFGLEVBQXFCc0wsS0FBckIsQ0FBMkIsTUFBM0I7QUFDQTtBQUNEO0FBQ0QsSUFmRDtBQWdCQTNMLFdBQVF1TSxZQUFSLENBQXFCcUUsTUFBckIsR0FBOEIsVUFBUzVELEtBQVQsRUFBZ0JDLEdBQWhCLEVBQXFCO0FBQ2xEak4sWUFBUW9NLGVBQVIsR0FBMEI7QUFDekJZLFlBQU9BLEtBRGtCO0FBRXpCQyxVQUFLQTtBQUZvQixLQUExQjtBQUlBNU0sTUFBRSxjQUFGLEVBQWtCSyxHQUFsQixDQUFzQixDQUFDLENBQXZCO0FBQ0FMLE1BQUUsbUJBQUYsRUFBdUJLLEdBQXZCLENBQTJCLENBQUMsQ0FBNUI7QUFDQUwsTUFBRSxZQUFGLEVBQWdCSyxHQUFoQixDQUFvQixDQUFDLENBQXJCO0FBQ0FMLE1BQUUsZ0JBQUYsRUFBb0JzTCxLQUFwQixDQUEwQixNQUExQjtBQUNBLElBVEQ7O0FBV0E7QUFDQXRMLEtBQUUsVUFBRixFQUFjd1EsTUFBZCxDQUFxQkMsWUFBckI7O0FBRUF6USxLQUFFLHFCQUFGLEVBQXlCNk8sSUFBekIsQ0FBOEIsT0FBOUIsRUFBdUM2QixZQUF2Qzs7QUFFQTFRLEtBQUUsdUJBQUYsRUFBMkI2TyxJQUEzQixDQUFnQyxPQUFoQyxFQUF5QzhCLGNBQXpDOztBQUVBM1EsS0FBRSxpQkFBRixFQUFxQjZPLElBQXJCLENBQTBCLE9BQTFCLEVBQW1DLFlBQVU7QUFDNUM3TyxNQUFFLGlCQUFGLEVBQXFCc0wsS0FBckIsQ0FBMkIsTUFBM0I7QUFDQWdGO0FBQ0EsSUFIRDs7QUFLQXRRLEtBQUUscUJBQUYsRUFBeUI2TyxJQUF6QixDQUE4QixPQUE5QixFQUF1QyxZQUFVO0FBQ2hEN08sTUFBRSxpQkFBRixFQUFxQnNMLEtBQXJCLENBQTJCLE1BQTNCO0FBQ0FzRjtBQUNBLElBSEQ7O0FBS0E1USxLQUFFLGlCQUFGLEVBQXFCNk8sSUFBckIsQ0FBMEIsT0FBMUIsRUFBbUMsWUFBVTtBQUM1QzdPLE1BQUUsZ0JBQUYsRUFBb0I2USxHQUFwQixDQUF3QixpQkFBeEI7QUFDQTdRLE1BQUUsZ0JBQUYsRUFBb0JFLEVBQXBCLENBQXVCLGlCQUF2QixFQUEwQyxVQUFVNFEsQ0FBVixFQUFhO0FBQ3REQztBQUNBLEtBRkQ7QUFHQS9RLE1BQUUsZ0JBQUYsRUFBb0JzTCxLQUFwQixDQUEwQixNQUExQjtBQUNBLElBTkQ7O0FBUUF0TCxLQUFFLG1CQUFGLEVBQXVCNk8sSUFBdkIsQ0FBNEIsT0FBNUIsRUFBcUMsWUFBVTtBQUM5Q2xQLFlBQVFvTSxlQUFSLEdBQTBCLEVBQTFCO0FBQ0FnRjtBQUNBLElBSEQ7O0FBS0EvUSxLQUFFLGlCQUFGLEVBQXFCNk8sSUFBckIsQ0FBMEIsT0FBMUIsRUFBbUMsWUFBVTtBQUM1QzdPLE1BQUUsZ0JBQUYsRUFBb0I2USxHQUFwQixDQUF3QixpQkFBeEI7QUFDQTdRLE1BQUUsZ0JBQUYsRUFBb0JFLEVBQXBCLENBQXVCLGlCQUF2QixFQUEwQyxVQUFVNFEsQ0FBVixFQUFhO0FBQ3RERTtBQUNBLEtBRkQ7QUFHQWhSLE1BQUUsZ0JBQUYsRUFBb0JzTCxLQUFwQixDQUEwQixNQUExQjtBQUNBLElBTkQ7O0FBUUF0TCxLQUFFLG9CQUFGLEVBQXdCNk8sSUFBeEIsQ0FBNkIsT0FBN0IsRUFBc0MsWUFBVTtBQUMvQ2xQLFlBQVFvTSxlQUFSLEdBQTBCLEVBQTFCO0FBQ0FpRjtBQUNBLElBSEQ7O0FBTUFoUixLQUFFLGdCQUFGLEVBQW9CRSxFQUFwQixDQUF1QixPQUF2QixFQUFnQytRLGdCQUFoQzs7QUFFQS9COztBQUVEO0FBQ0MsR0FoS0QsTUFnS0s7O0FBRUo7QUFDQXZQLFdBQVFzTSxtQkFBUixHQUE4QmpNLEVBQUUsc0JBQUYsRUFBMEJLLEdBQTFCLEdBQWdDcU8sSUFBaEMsRUFBOUI7O0FBRUM7QUFDQS9PLFdBQVF1TSxZQUFSLENBQXFCbUIsWUFBckIsQ0FBa0MsQ0FBbEMsRUFBcUNPLFNBQXJDLEdBQWlELFlBQWpEOztBQUVBO0FBQ0FqTyxXQUFRdU0sWUFBUixDQUFxQjhELFdBQXJCLEdBQW1DLFVBQVN6TixLQUFULEVBQWdCOEksT0FBaEIsRUFBd0I7QUFDekQsUUFBRzlJLE1BQU0rSyxJQUFOLElBQWMsR0FBakIsRUFBcUI7QUFDakJqQyxhQUFReEosTUFBUixDQUFlLGdEQUFnRFUsTUFBTTJPLEtBQXRELEdBQThELFFBQTdFO0FBQ0g7QUFDRCxRQUFHM08sTUFBTStLLElBQU4sSUFBYyxHQUFqQixFQUFxQjtBQUNwQmpDLGFBQVFQLFFBQVIsQ0FBaUIsVUFBakI7QUFDQTtBQUNILElBUEE7O0FBU0E7QUFDRG5MLFdBQVF1TSxZQUFSLENBQXFCK0QsVUFBckIsR0FBa0MsVUFBUzFOLEtBQVQsRUFBZ0I4SSxPQUFoQixFQUF5QjZFLElBQXpCLEVBQThCO0FBQy9ELFFBQUczTixNQUFNK0ssSUFBTixJQUFjLEdBQWpCLEVBQXFCO0FBQ3BCLFNBQUcvSyxNQUFNb0ssS0FBTixDQUFZd0UsT0FBWixDQUFvQnJGLFFBQXBCLENBQUgsRUFBaUM7QUFDaENzRSxzQkFBZ0I3TixLQUFoQjtBQUNBLE1BRkQsTUFFSztBQUNKSSxZQUFNLHNDQUFOO0FBQ0E7QUFDRDtBQUNELElBUkQ7O0FBVUM7QUFDRGhELFdBQVF1TSxZQUFSLENBQXFCcUUsTUFBckIsR0FBOEJhLGFBQTlCOztBQUVBO0FBQ0FwUixLQUFFLGNBQUYsRUFBa0JFLEVBQWxCLENBQXFCLGdCQUFyQixFQUF1QyxZQUFZO0FBQ2pERixNQUFFLE9BQUYsRUFBV21CLEtBQVg7QUFDRCxJQUZEOztBQUlBO0FBQ0FuQixLQUFFLFFBQUYsRUFBWTRFLElBQVosQ0FBaUIsVUFBakIsRUFBNkIsSUFBN0I7QUFDQTVFLEtBQUUsUUFBRixFQUFZNEUsSUFBWixDQUFpQixVQUFqQixFQUE2QixJQUE3QjtBQUNBNUUsS0FBRSxZQUFGLEVBQWdCNEUsSUFBaEIsQ0FBcUIsVUFBckIsRUFBaUMsSUFBakM7QUFDQTVFLEtBQUUsYUFBRixFQUFpQjhLLFFBQWpCLENBQTBCLHFCQUExQjtBQUNBOUssS0FBRSxNQUFGLEVBQVU0RSxJQUFWLENBQWUsVUFBZixFQUEyQixJQUEzQjtBQUNBNUUsS0FBRSxXQUFGLEVBQWU4SyxRQUFmLENBQXdCLHFCQUF4QjtBQUNBOUssS0FBRSxlQUFGLEVBQW1COEUsSUFBbkI7QUFDQTlFLEtBQUUsWUFBRixFQUFnQjhFLElBQWhCO0FBQ0E5RSxLQUFFLGVBQUYsRUFBbUJLLEdBQW5CLENBQXVCLENBQUMsQ0FBeEI7O0FBRUE7QUFDQUwsS0FBRSxRQUFGLEVBQVlFLEVBQVosQ0FBZSxpQkFBZixFQUFrQzBPLFNBQWxDO0FBQ0E7O0FBRUQ7QUFDQTVPLElBQUUsYUFBRixFQUFpQjZPLElBQWpCLENBQXNCLE9BQXRCLEVBQStCd0MsV0FBL0I7QUFDQXJSLElBQUUsZUFBRixFQUFtQjZPLElBQW5CLENBQXdCLE9BQXhCLEVBQWlDeUMsYUFBakM7QUFDQXRSLElBQUUsV0FBRixFQUFlRSxFQUFmLENBQWtCLFFBQWxCLEVBQTRCcVIsY0FBNUI7O0FBRUQ7QUFDQyxFQTVORCxNQTROSztBQUNKO0FBQ0E1UixVQUFRdU0sWUFBUixDQUFxQm1CLFlBQXJCLENBQWtDLENBQWxDLEVBQXFDTyxTQUFyQyxHQUFpRCxZQUFqRDtBQUNFak8sVUFBUXVNLFlBQVIsQ0FBcUJ1QixVQUFyQixHQUFrQyxLQUFsQzs7QUFFQTlOLFVBQVF1TSxZQUFSLENBQXFCOEQsV0FBckIsR0FBbUMsVUFBU3pOLEtBQVQsRUFBZ0I4SSxPQUFoQixFQUF3QjtBQUMxRCxPQUFHOUksTUFBTStLLElBQU4sSUFBYyxHQUFqQixFQUFxQjtBQUNqQmpDLFlBQVF4SixNQUFSLENBQWUsZ0RBQWdEVSxNQUFNMk8sS0FBdEQsR0FBOEQsUUFBN0U7QUFDSDtBQUNELE9BQUczTyxNQUFNK0ssSUFBTixJQUFjLEdBQWpCLEVBQXFCO0FBQ3BCakMsWUFBUVAsUUFBUixDQUFpQixVQUFqQjtBQUNBO0FBQ0gsR0FQQztBQVFGOztBQUVEO0FBQ0E5SyxHQUFFLFdBQUYsRUFBZW1QLFlBQWYsQ0FBNEJ4UCxRQUFRdU0sWUFBcEM7QUFDQSxDQXhRRDs7QUEwUUE7Ozs7OztBQU1BLElBQUlzRixnQkFBZ0IsU0FBaEJBLGFBQWdCLENBQVNuRyxPQUFULEVBQWtCVCxRQUFsQixFQUEyQjtBQUM5QztBQUNBNUssR0FBRXFMLE9BQUYsRUFBV0MsS0FBWCxDQUFpQixNQUFqQjs7QUFFQTtBQUNBbEcsTUFBSzZGLGNBQUwsQ0FBb0JMLFNBQVN6SyxJQUE3QixFQUFtQyxTQUFuQzs7QUFFQTtBQUNBSCxHQUFFLFdBQUYsRUFBZW1QLFlBQWYsQ0FBNEIsVUFBNUI7QUFDQW5QLEdBQUUsV0FBRixFQUFlbVAsWUFBZixDQUE0QixlQUE1QjtBQUNBblAsR0FBRXFMLFVBQVUsTUFBWixFQUFvQlAsUUFBcEIsQ0FBNkIsV0FBN0I7O0FBRUEsS0FBR3BCLE9BQU84RSxPQUFWLEVBQWtCO0FBQ2pCVTtBQUNBO0FBQ0QsQ0FmRDs7QUFpQkE7Ozs7Ozs7O0FBUUEsSUFBSXVDLFdBQVcsU0FBWEEsUUFBVyxDQUFTNVEsR0FBVCxFQUFjVixJQUFkLEVBQW9Ca0wsT0FBcEIsRUFBNkI1QixNQUE3QixFQUFvQztBQUNsRDtBQUNBQyxRQUFPRSxLQUFQLENBQWFjLElBQWIsQ0FBa0I3SixHQUFsQixFQUF1QlYsSUFBdkI7QUFDRTtBQURGLEVBRUV3SyxJQUZGLENBRU8sVUFBU0MsUUFBVCxFQUFrQjtBQUN2QjRHLGdCQUFjbkcsT0FBZCxFQUF1QlQsUUFBdkI7QUFDQSxFQUpGO0FBS0M7QUFMRCxFQU1FTSxLQU5GLENBTVEsVUFBU2IsS0FBVCxFQUFlO0FBQ3JCakYsT0FBSytGLFdBQUwsQ0FBaUIxQixNQUFqQixFQUF5QjRCLE9BQXpCLEVBQWtDaEIsS0FBbEM7QUFDQSxFQVJGO0FBU0EsQ0FYRDs7QUFhQSxJQUFJcUgsYUFBYSxTQUFiQSxVQUFhLENBQVM3USxHQUFULEVBQWNWLElBQWQsRUFBb0JrTCxPQUFwQixFQUE2QjVCLE1BQTdCLEVBQXFDa0ksT0FBckMsRUFBOENDLFFBQTlDLEVBQXVEO0FBQ3ZFO0FBQ0FELGFBQVlBLFVBQVUsS0FBdEI7QUFDQUMsY0FBYUEsV0FBVyxLQUF4Qjs7QUFFQTtBQUNBLEtBQUcsQ0FBQ0EsUUFBSixFQUFhO0FBQ1osTUFBSXJPLFNBQVNDLFFBQVEsZUFBUixDQUFiO0FBQ0EsRUFGRCxNQUVLO0FBQ0osTUFBSUQsU0FBUyxJQUFiO0FBQ0E7O0FBRUQsS0FBR0EsV0FBVyxJQUFkLEVBQW1COztBQUVsQjtBQUNBdkQsSUFBRXFMLFVBQVUsTUFBWixFQUFvQlosV0FBcEIsQ0FBZ0MsV0FBaEM7O0FBRUE7QUFDQWYsU0FBT0UsS0FBUCxDQUFhYyxJQUFiLENBQWtCN0osR0FBbEIsRUFBdUJWLElBQXZCLEVBQ0V3SyxJQURGLENBQ08sVUFBU0MsUUFBVCxFQUFrQjtBQUN2QixPQUFHK0csT0FBSCxFQUFXO0FBQ1Y7QUFDQTtBQUNBM1IsTUFBRXFMLFVBQVUsTUFBWixFQUFvQlAsUUFBcEIsQ0FBNkIsV0FBN0I7QUFDQTlLLE1BQUVxTCxPQUFGLEVBQVdQLFFBQVgsQ0FBb0IsUUFBcEI7QUFDQSxJQUxELE1BS0s7QUFDSjBHLGtCQUFjbkcsT0FBZCxFQUF1QlQsUUFBdkI7QUFDQTtBQUNELEdBVkYsRUFXRU0sS0FYRixDQVdRLFVBQVNiLEtBQVQsRUFBZTtBQUNyQmpGLFFBQUsrRixXQUFMLENBQWlCMUIsTUFBakIsRUFBeUI0QixPQUF6QixFQUFrQ2hCLEtBQWxDO0FBQ0EsR0FiRjtBQWNBO0FBQ0QsQ0FqQ0Q7O0FBbUNBOzs7QUFHQSxJQUFJZ0gsY0FBYyxTQUFkQSxXQUFjLEdBQVU7O0FBRTNCO0FBQ0FyUixHQUFFLGtCQUFGLEVBQXNCeUssV0FBdEIsQ0FBa0MsV0FBbEM7O0FBRUE7QUFDQSxLQUFJdEssT0FBTztBQUNWd00sU0FBT2IsT0FBTzlMLEVBQUUsUUFBRixFQUFZSyxHQUFaLEVBQVAsRUFBMEIsS0FBMUIsRUFBaUMyTixNQUFqQyxFQURHO0FBRVZwQixPQUFLZCxPQUFPOUwsRUFBRSxNQUFGLEVBQVVLLEdBQVYsRUFBUCxFQUF3QixLQUF4QixFQUErQjJOLE1BQS9CLEVBRks7QUFHVmtELFNBQU9sUixFQUFFLFFBQUYsRUFBWUssR0FBWixFQUhHO0FBSVZ3UixRQUFNN1IsRUFBRSxPQUFGLEVBQVdLLEdBQVgsRUFKSTtBQUtWeVIsVUFBUTlSLEVBQUUsU0FBRixFQUFhSyxHQUFiO0FBTEUsRUFBWDtBQU9BRixNQUFLTyxFQUFMLEdBQVVmLFFBQVFxTSxpQkFBbEI7QUFDQSxLQUFHaE0sRUFBRSxZQUFGLEVBQWdCSyxHQUFoQixLQUF3QixDQUEzQixFQUE2QjtBQUM1QkYsT0FBSzRSLFNBQUwsR0FBaUIvUixFQUFFLFlBQUYsRUFBZ0JLLEdBQWhCLEVBQWpCO0FBQ0E7QUFDRCxLQUFHTCxFQUFFLGVBQUYsRUFBbUJLLEdBQW5CLEtBQTJCLENBQTlCLEVBQWdDO0FBQy9CRixPQUFLNlIsU0FBTCxHQUFpQmhTLEVBQUUsZUFBRixFQUFtQkssR0FBbkIsRUFBakI7QUFDQTtBQUNELEtBQUlRLE1BQU0seUJBQVY7O0FBRUE7QUFDQTRRLFVBQVM1USxHQUFULEVBQWNWLElBQWQsRUFBb0IsY0FBcEIsRUFBb0MsY0FBcEM7QUFDQSxDQXhCRDs7QUEwQkE7OztBQUdBLElBQUltUixnQkFBZ0IsU0FBaEJBLGFBQWdCLEdBQVU7O0FBRTdCO0FBQ0EsS0FBSW5SLE9BQU87QUFDVjRSLGFBQVcvUixFQUFFLFlBQUYsRUFBZ0JLLEdBQWhCO0FBREQsRUFBWDtBQUdBLEtBQUlRLE1BQU0seUJBQVY7O0FBRUE2USxZQUFXN1EsR0FBWCxFQUFnQlYsSUFBaEIsRUFBc0IsY0FBdEIsRUFBc0MsZ0JBQXRDLEVBQXdELEtBQXhEO0FBQ0EsQ0FURDs7QUFXQTs7Ozs7QUFLQSxJQUFJaVEsa0JBQWtCLFNBQWxCQSxlQUFrQixDQUFTN04sS0FBVCxFQUFlO0FBQ3BDdkMsR0FBRSxRQUFGLEVBQVlLLEdBQVosQ0FBZ0JrQyxNQUFNMk8sS0FBdEI7QUFDQWxSLEdBQUUsUUFBRixFQUFZSyxHQUFaLENBQWdCa0MsTUFBTW9LLEtBQU4sQ0FBWXFCLE1BQVosQ0FBbUIsS0FBbkIsQ0FBaEI7QUFDQWhPLEdBQUUsTUFBRixFQUFVSyxHQUFWLENBQWNrQyxNQUFNcUssR0FBTixDQUFVb0IsTUFBVixDQUFpQixLQUFqQixDQUFkO0FBQ0FoTyxHQUFFLE9BQUYsRUFBV0ssR0FBWCxDQUFla0MsTUFBTXNQLElBQXJCO0FBQ0FJLGlCQUFnQjFQLE1BQU1vSyxLQUF0QixFQUE2QnBLLE1BQU1xSyxHQUFuQztBQUNBNU0sR0FBRSxZQUFGLEVBQWdCSyxHQUFoQixDQUFvQmtDLE1BQU03QixFQUExQjtBQUNBVixHQUFFLGVBQUYsRUFBbUJLLEdBQW5CLENBQXVCa0MsTUFBTWUsVUFBN0I7QUFDQXRELEdBQUUsU0FBRixFQUFhSyxHQUFiLENBQWlCa0MsTUFBTXVQLE1BQXZCO0FBQ0E5UixHQUFFLGVBQUYsRUFBbUI2RSxJQUFuQjtBQUNBN0UsR0FBRSxjQUFGLEVBQWtCc0wsS0FBbEIsQ0FBd0IsTUFBeEI7QUFDQSxDQVhEOztBQWFBOzs7OztBQUtBLElBQUl5RixvQkFBb0IsU0FBcEJBLGlCQUFvQixDQUFTOUUsbUJBQVQsRUFBNkI7O0FBRXBEO0FBQ0EsS0FBR0Esd0JBQXdCaUcsU0FBM0IsRUFBcUM7QUFDcENsUyxJQUFFLFFBQUYsRUFBWUssR0FBWixDQUFnQjRMLG1CQUFoQjtBQUNBLEVBRkQsTUFFSztBQUNKak0sSUFBRSxRQUFGLEVBQVlLLEdBQVosQ0FBZ0IsRUFBaEI7QUFDQTs7QUFFRDtBQUNBLEtBQUdWLFFBQVFvTSxlQUFSLENBQXdCWSxLQUF4QixLQUFrQ3VGLFNBQXJDLEVBQStDO0FBQzlDbFMsSUFBRSxRQUFGLEVBQVlLLEdBQVosQ0FBZ0J5TCxTQUFTcUcsSUFBVCxDQUFjLENBQWQsRUFBaUJDLE1BQWpCLENBQXdCLENBQXhCLEVBQTJCcEUsTUFBM0IsQ0FBa0MsS0FBbEMsQ0FBaEI7QUFDQSxFQUZELE1BRUs7QUFDSmhPLElBQUUsUUFBRixFQUFZSyxHQUFaLENBQWdCVixRQUFRb00sZUFBUixDQUF3QlksS0FBeEIsQ0FBOEJxQixNQUE5QixDQUFxQyxLQUFyQyxDQUFoQjtBQUNBOztBQUVEO0FBQ0EsS0FBR3JPLFFBQVFvTSxlQUFSLENBQXdCYSxHQUF4QixLQUFnQ3NGLFNBQW5DLEVBQTZDO0FBQzVDbFMsSUFBRSxNQUFGLEVBQVVLLEdBQVYsQ0FBY3lMLFNBQVNxRyxJQUFULENBQWMsQ0FBZCxFQUFpQkMsTUFBakIsQ0FBd0IsRUFBeEIsRUFBNEJwRSxNQUE1QixDQUFtQyxLQUFuQyxDQUFkO0FBQ0EsRUFGRCxNQUVLO0FBQ0poTyxJQUFFLE1BQUYsRUFBVUssR0FBVixDQUFjVixRQUFRb00sZUFBUixDQUF3QmEsR0FBeEIsQ0FBNEJvQixNQUE1QixDQUFtQyxLQUFuQyxDQUFkO0FBQ0E7O0FBRUQ7QUFDQSxLQUFHck8sUUFBUW9NLGVBQVIsQ0FBd0JZLEtBQXhCLEtBQWtDdUYsU0FBckMsRUFBK0M7QUFDOUNELGtCQUFnQm5HLFNBQVNxRyxJQUFULENBQWMsQ0FBZCxFQUFpQkMsTUFBakIsQ0FBd0IsQ0FBeEIsQ0FBaEIsRUFBNEN0RyxTQUFTcUcsSUFBVCxDQUFjLENBQWQsRUFBaUJDLE1BQWpCLENBQXdCLEVBQXhCLENBQTVDO0FBQ0EsRUFGRCxNQUVLO0FBQ0pILGtCQUFnQnRTLFFBQVFvTSxlQUFSLENBQXdCWSxLQUF4QyxFQUErQ2hOLFFBQVFvTSxlQUFSLENBQXdCYSxHQUF2RTtBQUNBOztBQUVEO0FBQ0E1TSxHQUFFLFlBQUYsRUFBZ0JLLEdBQWhCLENBQW9CLENBQUMsQ0FBckI7QUFDQUwsR0FBRSxlQUFGLEVBQW1CSyxHQUFuQixDQUF1QixDQUFDLENBQXhCOztBQUVBO0FBQ0FMLEdBQUUsZUFBRixFQUFtQjhFLElBQW5COztBQUVBO0FBQ0E5RSxHQUFFLGNBQUYsRUFBa0JzTCxLQUFsQixDQUF3QixNQUF4QjtBQUNBLENBdkNEOztBQXlDQTs7O0FBR0EsSUFBSXNELFlBQVksU0FBWkEsU0FBWSxHQUFVO0FBQ3hCNU8sR0FBRSxJQUFGLEVBQVF5QyxJQUFSLENBQWEsTUFBYixFQUFxQixDQUFyQixFQUF3QnNNLEtBQXhCO0FBQ0QzSixNQUFLeUYsZUFBTDtBQUNBLENBSEQ7O0FBS0E7Ozs7OztBQU1BLElBQUlvSCxrQkFBa0IsU0FBbEJBLGVBQWtCLENBQVN0RixLQUFULEVBQWdCQyxHQUFoQixFQUFvQjtBQUN6QztBQUNBNU0sR0FBRSxXQUFGLEVBQWVxUyxLQUFmOztBQUVBO0FBQ0FyUyxHQUFFLFdBQUYsRUFBZTZCLE1BQWYsQ0FBc0Isd0NBQXRCOztBQUVBO0FBQ0EsS0FBRzhLLE1BQU13RixJQUFOLEtBQWUsRUFBZixJQUFzQnhGLE1BQU13RixJQUFOLE1BQWdCLEVBQWhCLElBQXNCeEYsTUFBTTJGLE9BQU4sTUFBbUIsRUFBbEUsRUFBc0U7QUFDckV0UyxJQUFFLFdBQUYsRUFBZTZCLE1BQWYsQ0FBc0Isd0NBQXRCO0FBQ0E7O0FBRUQ7QUFDQSxLQUFHOEssTUFBTXdGLElBQU4sS0FBZSxFQUFmLElBQXNCeEYsTUFBTXdGLElBQU4sTUFBZ0IsRUFBaEIsSUFBc0J4RixNQUFNMkYsT0FBTixNQUFtQixDQUFsRSxFQUFxRTtBQUNwRXRTLElBQUUsV0FBRixFQUFlNkIsTUFBZixDQUFzQix3Q0FBdEI7QUFDQTs7QUFFRDtBQUNBN0IsR0FBRSxXQUFGLEVBQWVLLEdBQWYsQ0FBbUJ1TSxJQUFJMkYsSUFBSixDQUFTNUYsS0FBVCxFQUFnQixTQUFoQixDQUFuQjtBQUNBLENBbkJEOztBQXFCQTs7Ozs7OztBQU9BLElBQUlvRCxrQkFBa0IsU0FBbEJBLGVBQWtCLENBQVN5QyxLQUFULEVBQWdCQyxLQUFoQixFQUF1QkMsUUFBdkIsRUFBZ0M7QUFDckQ7QUFDQTFTLEdBQUV3UyxRQUFRLGFBQVYsRUFBeUJ0UyxFQUF6QixDQUE0QixXQUE1QixFQUF5QyxVQUFVNFEsQ0FBVixFQUFhO0FBQ3JELE1BQUk2QixRQUFRN0csT0FBTzlMLEVBQUV5UyxLQUFGLEVBQVNwUyxHQUFULEVBQVAsRUFBdUIsS0FBdkIsQ0FBWjtBQUNBLE1BQUd5USxFQUFFOEIsSUFBRixDQUFPekIsT0FBUCxDQUFld0IsS0FBZixLQUF5QjdCLEVBQUU4QixJQUFGLENBQU9DLE1BQVAsQ0FBY0YsS0FBZCxDQUE1QixFQUFpRDtBQUNoREEsV0FBUTdCLEVBQUU4QixJQUFGLENBQU9FLEtBQVAsRUFBUjtBQUNBOVMsS0FBRXlTLEtBQUYsRUFBU3BTLEdBQVQsQ0FBYXNTLE1BQU0zRSxNQUFOLENBQWEsS0FBYixDQUFiO0FBQ0E7QUFDRCxFQU5EOztBQVFBO0FBQ0FoTyxHQUFFeVMsUUFBUSxhQUFWLEVBQXlCdlMsRUFBekIsQ0FBNEIsV0FBNUIsRUFBeUMsVUFBVTRRLENBQVYsRUFBYTtBQUNyRCxNQUFJaUMsUUFBUWpILE9BQU85TCxFQUFFd1MsS0FBRixFQUFTblMsR0FBVCxFQUFQLEVBQXVCLEtBQXZCLENBQVo7QUFDQSxNQUFHeVEsRUFBRThCLElBQUYsQ0FBT0ksUUFBUCxDQUFnQkQsS0FBaEIsS0FBMEJqQyxFQUFFOEIsSUFBRixDQUFPQyxNQUFQLENBQWNFLEtBQWQsQ0FBN0IsRUFBa0Q7QUFDakRBLFdBQVFqQyxFQUFFOEIsSUFBRixDQUFPRSxLQUFQLEVBQVI7QUFDQTlTLEtBQUV3UyxLQUFGLEVBQVNuUyxHQUFULENBQWEwUyxNQUFNL0UsTUFBTixDQUFhLEtBQWIsQ0FBYjtBQUNBO0FBQ0QsRUFORDtBQU9BLENBbEJEOztBQW9CQTs7O0FBR0EsSUFBSXVELGlCQUFpQixTQUFqQkEsY0FBaUIsR0FBVTtBQUM5QixLQUFJMEIsVUFBVW5ILE9BQU85TCxFQUFFLFFBQUYsRUFBWUssR0FBWixFQUFQLEVBQTBCLEtBQTFCLEVBQWlDNlMsR0FBakMsQ0FBcUNsVCxFQUFFLElBQUYsRUFBUUssR0FBUixFQUFyQyxFQUFvRCxTQUFwRCxDQUFkO0FBQ0FMLEdBQUUsTUFBRixFQUFVSyxHQUFWLENBQWM0UyxRQUFRakYsTUFBUixDQUFlLEtBQWYsQ0FBZDtBQUNBLENBSEQ7O0FBS0E7Ozs7OztBQU1BLElBQUlvRCxnQkFBZ0IsU0FBaEJBLGFBQWdCLENBQVN6RSxLQUFULEVBQWdCQyxHQUFoQixFQUFxQjs7QUFFeEM7QUFDQSxLQUFHQSxJQUFJMkYsSUFBSixDQUFTNUYsS0FBVCxFQUFnQixTQUFoQixJQUE2QixFQUFoQyxFQUFtQzs7QUFFbEM7QUFDQWhLLFFBQU0seUNBQU47QUFDQTNDLElBQUUsV0FBRixFQUFlbVAsWUFBZixDQUE0QixVQUE1QjtBQUNBLEVBTEQsTUFLSzs7QUFFSjtBQUNBeFAsVUFBUW9NLGVBQVIsR0FBMEI7QUFDekJZLFVBQU9BLEtBRGtCO0FBRXpCQyxRQUFLQTtBQUZvQixHQUExQjtBQUlBNU0sSUFBRSxZQUFGLEVBQWdCSyxHQUFoQixDQUFvQixDQUFDLENBQXJCO0FBQ0EwUSxvQkFBa0JwUixRQUFRc00sbUJBQTFCO0FBQ0E7QUFDRCxDQWxCRDs7QUFvQkE7OztBQUdBLElBQUlpRCxnQkFBZ0IsU0FBaEJBLGFBQWdCLEdBQVU7O0FBRTdCO0FBQ0F4RixRQUFPRSxLQUFQLENBQWF6SCxHQUFiLENBQWlCLHFCQUFqQixFQUNFd0ksSUFERixDQUNPLFVBQVNDLFFBQVQsRUFBa0I7O0FBRXZCO0FBQ0E1SyxJQUFFZ0MsUUFBRixFQUFZNk8sR0FBWixDQUFnQixPQUFoQixFQUF5QixpQkFBekIsRUFBNENzQyxjQUE1QztBQUNBblQsSUFBRWdDLFFBQUYsRUFBWTZPLEdBQVosQ0FBZ0IsT0FBaEIsRUFBeUIsZUFBekIsRUFBMEN1QyxZQUExQztBQUNBcFQsSUFBRWdDLFFBQUYsRUFBWTZPLEdBQVosQ0FBZ0IsT0FBaEIsRUFBeUIsa0JBQXpCLEVBQTZDd0MsZUFBN0M7O0FBRUE7QUFDQSxNQUFHekksU0FBU2tILE1BQVQsSUFBbUIsR0FBdEIsRUFBMEI7O0FBRXpCO0FBQ0E5UixLQUFFLDBCQUFGLEVBQThCcVMsS0FBOUI7QUFDQXJTLEtBQUVnUCxJQUFGLENBQU9wRSxTQUFTekssSUFBaEIsRUFBc0IsVUFBU21ULEtBQVQsRUFBZ0J6SCxLQUFoQixFQUFzQjtBQUMzQzdMLE1BQUUsUUFBRixFQUFZO0FBQ1gsV0FBTyxZQUFVNkwsTUFBTW5MLEVBRFo7QUFFWCxjQUFTLGtCQUZFO0FBR1gsYUFBUyw2RkFBMkZtTCxNQUFNbkwsRUFBakcsR0FBb0csaUVBQXBHLEdBQ04sc0ZBRE0sR0FDaUZtTCxNQUFNbkwsRUFEdkYsR0FDMEYsaUVBRDFGLEdBRU4sbUZBRk0sR0FFOEVtTCxNQUFNbkwsRUFGcEYsR0FFdUYsa0VBRnZGLEdBR04sbUJBSE0sR0FHY21MLE1BQU1uTCxFQUhwQixHQUd1QiwwRUFIdkIsR0FJTCxLQUpLLEdBSUNtTCxNQUFNcUYsS0FKUCxHQUlhLFFBSmIsR0FJc0JyRixNQUFNYyxLQUo1QixHQUlrQztBQVBoQyxLQUFaLEVBUUk0RyxRQVJKLENBUWEsMEJBUmI7QUFTQSxJQVZEOztBQVlBO0FBQ0F2VCxLQUFFZ0MsUUFBRixFQUFZOUIsRUFBWixDQUFlLE9BQWYsRUFBd0IsaUJBQXhCLEVBQTJDaVQsY0FBM0M7QUFDQW5ULEtBQUVnQyxRQUFGLEVBQVk5QixFQUFaLENBQWUsT0FBZixFQUF3QixlQUF4QixFQUF5Q2tULFlBQXpDO0FBQ0FwVCxLQUFFZ0MsUUFBRixFQUFZOUIsRUFBWixDQUFlLE9BQWYsRUFBd0Isa0JBQXhCLEVBQTRDbVQsZUFBNUM7O0FBRUE7QUFDQXJULEtBQUUsc0JBQUYsRUFBMEJ5SyxXQUExQixDQUFzQyxRQUF0Qzs7QUFFQTtBQUNBLEdBekJELE1BeUJNLElBQUdHLFNBQVNrSCxNQUFULElBQW1CLEdBQXRCLEVBQTBCOztBQUUvQjtBQUNBOVIsS0FBRSxzQkFBRixFQUEwQjhLLFFBQTFCLENBQW1DLFFBQW5DO0FBQ0E7QUFDRCxFQXZDRixFQXdDRUksS0F4Q0YsQ0F3Q1EsVUFBU2IsS0FBVCxFQUFlO0FBQ3JCMUgsUUFBTSw4Q0FBOEMwSCxNQUFNTyxRQUFOLENBQWV6SyxJQUFuRTtBQUNBLEVBMUNGO0FBMkNBLENBOUNEOztBQWdEQTs7O0FBR0EsSUFBSXVRLGVBQWUsU0FBZkEsWUFBZSxHQUFVOztBQUU1QjtBQUNBMVEsR0FBRSxxQkFBRixFQUF5QnlLLFdBQXpCLENBQXFDLFdBQXJDOztBQUVBO0FBQ0EsS0FBSXRLLE9BQU87QUFDVnFULFVBQVExSCxPQUFPOUwsRUFBRSxTQUFGLEVBQWFLLEdBQWIsRUFBUCxFQUEyQixLQUEzQixFQUFrQzJOLE1BQWxDLEVBREU7QUFFVnlGLFFBQU0zSCxPQUFPOUwsRUFBRSxPQUFGLEVBQVdLLEdBQVgsRUFBUCxFQUF5QixLQUF6QixFQUFnQzJOLE1BQWhDLEVBRkk7QUFHVjBGLFVBQVExVCxFQUFFLFNBQUYsRUFBYUssR0FBYjtBQUhFLEVBQVg7QUFLQSxLQUFJUSxHQUFKO0FBQ0EsS0FBR2IsRUFBRSxtQkFBRixFQUF1QkssR0FBdkIsS0FBK0IsQ0FBbEMsRUFBb0M7QUFDbkNRLFFBQU0sK0JBQU47QUFDQVYsT0FBS3dULGdCQUFMLEdBQXdCM1QsRUFBRSxtQkFBRixFQUF1QkssR0FBdkIsRUFBeEI7QUFDQSxFQUhELE1BR0s7QUFDSlEsUUFBTSwwQkFBTjtBQUNBLE1BQUdiLEVBQUUsY0FBRixFQUFrQkssR0FBbEIsS0FBMEIsQ0FBN0IsRUFBK0I7QUFDOUJGLFFBQUt5VCxXQUFMLEdBQW1CNVQsRUFBRSxjQUFGLEVBQWtCSyxHQUFsQixFQUFuQjtBQUNBO0FBQ0RGLE9BQUswVCxPQUFMLEdBQWU3VCxFQUFFLFVBQUYsRUFBY0ssR0FBZCxFQUFmO0FBQ0EsTUFBR0wsRUFBRSxVQUFGLEVBQWNLLEdBQWQsTUFBdUIsQ0FBMUIsRUFBNEI7QUFDM0JGLFFBQUsyVCxZQUFMLEdBQW1COVQsRUFBRSxlQUFGLEVBQW1CSyxHQUFuQixFQUFuQjtBQUNBRixRQUFLNFQsWUFBTCxHQUFvQmpJLE9BQU85TCxFQUFFLGVBQUYsRUFBbUJLLEdBQW5CLEVBQVAsRUFBaUMsWUFBakMsRUFBK0MyTixNQUEvQyxFQUFwQjtBQUNBO0FBQ0QsTUFBR2hPLEVBQUUsVUFBRixFQUFjSyxHQUFkLE1BQXVCLENBQTFCLEVBQTRCO0FBQzNCRixRQUFLMlQsWUFBTCxHQUFvQjlULEVBQUUsZ0JBQUYsRUFBb0JLLEdBQXBCLEVBQXBCO0FBQ0FGLFFBQUs2VCxnQkFBTCxHQUF3QmhVLEVBQUUsbUJBQUYsRUFBdUI0RSxJQUF2QixDQUE0QixTQUE1QixDQUF4QjtBQUNBekUsUUFBSzhULGdCQUFMLEdBQXdCalUsRUFBRSxtQkFBRixFQUF1QjRFLElBQXZCLENBQTRCLFNBQTVCLENBQXhCO0FBQ0F6RSxRQUFLK1QsZ0JBQUwsR0FBd0JsVSxFQUFFLG1CQUFGLEVBQXVCNEUsSUFBdkIsQ0FBNEIsU0FBNUIsQ0FBeEI7QUFDQXpFLFFBQUtnVSxnQkFBTCxHQUF3Qm5VLEVBQUUsbUJBQUYsRUFBdUI0RSxJQUF2QixDQUE0QixTQUE1QixDQUF4QjtBQUNBekUsUUFBS2lVLGdCQUFMLEdBQXdCcFUsRUFBRSxtQkFBRixFQUF1QjRFLElBQXZCLENBQTRCLFNBQTVCLENBQXhCO0FBQ0F6RSxRQUFLNFQsWUFBTCxHQUFvQmpJLE9BQU85TCxFQUFFLGVBQUYsRUFBbUJLLEdBQW5CLEVBQVAsRUFBaUMsWUFBakMsRUFBK0MyTixNQUEvQyxFQUFwQjtBQUNBO0FBQ0Q7O0FBRUQ7QUFDQXlELFVBQVM1USxHQUFULEVBQWNWLElBQWQsRUFBb0IsaUJBQXBCLEVBQXVDLGVBQXZDO0FBQ0EsQ0F0Q0Q7O0FBd0NBOzs7QUFHQSxJQUFJd1EsaUJBQWlCLFNBQWpCQSxjQUFpQixHQUFVOztBQUU5QjtBQUNBLEtBQUk5UCxHQUFKLEVBQVNWLElBQVQ7QUFDQSxLQUFHSCxFQUFFLG1CQUFGLEVBQXVCSyxHQUF2QixLQUErQixDQUFsQyxFQUFvQztBQUNuQ1EsUUFBTSwrQkFBTjtBQUNBVixTQUFPLEVBQUV3VCxrQkFBa0IzVCxFQUFFLG1CQUFGLEVBQXVCSyxHQUF2QixFQUFwQixFQUFQO0FBQ0EsRUFIRCxNQUdLO0FBQ0pRLFFBQU0sMEJBQU47QUFDQVYsU0FBTyxFQUFFeVQsYUFBYTVULEVBQUUsY0FBRixFQUFrQkssR0FBbEIsRUFBZixFQUFQO0FBQ0E7O0FBRUQ7QUFDQXFSLFlBQVc3USxHQUFYLEVBQWdCVixJQUFoQixFQUFzQixpQkFBdEIsRUFBeUMsaUJBQXpDLEVBQTRELEtBQTVEO0FBQ0EsQ0FkRDs7QUFnQkE7OztBQUdBLElBQUlzUSxlQUFlLFNBQWZBLFlBQWUsR0FBVTtBQUM1QixLQUFHelEsRUFBRSxJQUFGLEVBQVFLLEdBQVIsTUFBaUIsQ0FBcEIsRUFBc0I7QUFDckJMLElBQUUsaUJBQUYsRUFBcUI4RSxJQUFyQjtBQUNBOUUsSUFBRSxrQkFBRixFQUFzQjhFLElBQXRCO0FBQ0E5RSxJQUFFLGlCQUFGLEVBQXFCOEUsSUFBckI7QUFDQSxFQUpELE1BSU0sSUFBRzlFLEVBQUUsSUFBRixFQUFRSyxHQUFSLE1BQWlCLENBQXBCLEVBQXNCO0FBQzNCTCxJQUFFLGlCQUFGLEVBQXFCNkUsSUFBckI7QUFDQTdFLElBQUUsa0JBQUYsRUFBc0I4RSxJQUF0QjtBQUNBOUUsSUFBRSxpQkFBRixFQUFxQjZFLElBQXJCO0FBQ0EsRUFKSyxNQUlBLElBQUc3RSxFQUFFLElBQUYsRUFBUUssR0FBUixNQUFpQixDQUFwQixFQUFzQjtBQUMzQkwsSUFBRSxpQkFBRixFQUFxQjhFLElBQXJCO0FBQ0E5RSxJQUFFLGtCQUFGLEVBQXNCNkUsSUFBdEI7QUFDQTdFLElBQUUsaUJBQUYsRUFBcUI2RSxJQUFyQjtBQUNBO0FBQ0QsQ0FkRDs7QUFnQkE7OztBQUdBLElBQUlvTSxtQkFBbUIsU0FBbkJBLGdCQUFtQixHQUFVO0FBQ2hDalIsR0FBRSxrQkFBRixFQUFzQnNMLEtBQXRCLENBQTRCLE1BQTVCO0FBQ0EsQ0FGRDs7QUFJQTs7O0FBR0EsSUFBSTZILGlCQUFpQixTQUFqQkEsY0FBaUIsR0FBVTs7QUFFOUI7QUFDQSxLQUFJelMsS0FBS1YsRUFBRSxJQUFGLEVBQVFHLElBQVIsQ0FBYSxJQUFiLENBQVQ7QUFDQSxLQUFJQSxPQUFPO0FBQ1Y0UixhQUFXclI7QUFERCxFQUFYO0FBR0EsS0FBSUcsTUFBTSx5QkFBVjs7QUFFQTtBQUNBNlEsWUFBVzdRLEdBQVgsRUFBZ0JWLElBQWhCLEVBQXNCLGFBQWFPLEVBQW5DLEVBQXVDLGdCQUF2QyxFQUF5RCxJQUF6RDtBQUVBLENBWkQ7O0FBY0E7OztBQUdBLElBQUkwUyxlQUFlLFNBQWZBLFlBQWUsR0FBVTs7QUFFNUI7QUFDQSxLQUFJMVMsS0FBS1YsRUFBRSxJQUFGLEVBQVFHLElBQVIsQ0FBYSxJQUFiLENBQVQ7QUFDQSxLQUFJQSxPQUFPO0FBQ1Y0UixhQUFXclI7QUFERCxFQUFYO0FBR0EsS0FBSUcsTUFBTSxtQkFBVjs7QUFFQTtBQUNBYixHQUFFLGFBQVlVLEVBQVosR0FBaUIsTUFBbkIsRUFBMkIrSixXQUEzQixDQUF1QyxXQUF2Qzs7QUFFQTtBQUNBZixRQUFPRSxLQUFQLENBQWF6SCxHQUFiLENBQWlCdEIsR0FBakIsRUFBc0I7QUFDcEJ3VCxVQUFRbFU7QUFEWSxFQUF0QixFQUdFd0ssSUFIRixDQUdPLFVBQVNDLFFBQVQsRUFBa0I7QUFDdkI1SyxJQUFFLGFBQVlVLEVBQVosR0FBaUIsTUFBbkIsRUFBMkJvSyxRQUEzQixDQUFvQyxXQUFwQztBQUNBOUssSUFBRSxrQkFBRixFQUFzQnNMLEtBQXRCLENBQTRCLE1BQTVCO0FBQ0EvSSxVQUFRcUksU0FBU3pLLElBQWpCO0FBQ0FvQyxRQUFNb0ssS0FBTixHQUFjYixPQUFPdkosTUFBTW9LLEtBQWIsQ0FBZDtBQUNBcEssUUFBTXFLLEdBQU4sR0FBWWQsT0FBT3ZKLE1BQU1xSyxHQUFiLENBQVo7QUFDQXdELGtCQUFnQjdOLEtBQWhCO0FBQ0EsRUFWRixFQVVJMkksS0FWSixDQVVVLFVBQVNiLEtBQVQsRUFBZTtBQUN2QmpGLE9BQUsrRixXQUFMLENBQWlCLGtCQUFqQixFQUFxQyxhQUFhekssRUFBbEQsRUFBc0QySixLQUF0RDtBQUNBLEVBWkY7QUFhQSxDQTFCRDs7QUE0QkE7OztBQUdBLElBQUlnSixrQkFBa0IsU0FBbEJBLGVBQWtCLEdBQVU7O0FBRS9CO0FBQ0EsS0FBSTNTLEtBQUtWLEVBQUUsSUFBRixFQUFRRyxJQUFSLENBQWEsSUFBYixDQUFUO0FBQ0EsS0FBSUEsT0FBTztBQUNWNFIsYUFBV3JSO0FBREQsRUFBWDtBQUdBLEtBQUlHLE1BQU0sMkJBQVY7O0FBRUE2USxZQUFXN1EsR0FBWCxFQUFnQlYsSUFBaEIsRUFBc0IsYUFBYU8sRUFBbkMsRUFBdUMsaUJBQXZDLEVBQTBELElBQTFELEVBQWdFLElBQWhFO0FBQ0EsQ0FWRDs7QUFZQTs7O0FBR0EsSUFBSXNRLHFCQUFxQixTQUFyQkEsa0JBQXFCLEdBQVU7QUFDbENoUixHQUFFLFNBQUYsRUFBYUssR0FBYixDQUFpQixFQUFqQjtBQUNBLEtBQUdWLFFBQVFvTSxlQUFSLENBQXdCWSxLQUF4QixLQUFrQ3VGLFNBQXJDLEVBQStDO0FBQzlDbFMsSUFBRSxTQUFGLEVBQWFLLEdBQWIsQ0FBaUJ5TCxTQUFTcUcsSUFBVCxDQUFjLENBQWQsRUFBaUJDLE1BQWpCLENBQXdCLENBQXhCLEVBQTJCcEUsTUFBM0IsQ0FBa0MsS0FBbEMsQ0FBakI7QUFDQSxFQUZELE1BRUs7QUFDSmhPLElBQUUsU0FBRixFQUFhSyxHQUFiLENBQWlCVixRQUFRb00sZUFBUixDQUF3QlksS0FBeEIsQ0FBOEJxQixNQUE5QixDQUFxQyxLQUFyQyxDQUFqQjtBQUNBO0FBQ0QsS0FBR3JPLFFBQVFvTSxlQUFSLENBQXdCYSxHQUF4QixLQUFnQ3NGLFNBQW5DLEVBQTZDO0FBQzVDbFMsSUFBRSxPQUFGLEVBQVdLLEdBQVgsQ0FBZXlMLFNBQVNxRyxJQUFULENBQWMsQ0FBZCxFQUFpQkMsTUFBakIsQ0FBd0IsQ0FBeEIsRUFBMkJwRSxNQUEzQixDQUFrQyxLQUFsQyxDQUFmO0FBQ0EsRUFGRCxNQUVLO0FBQ0poTyxJQUFFLE9BQUYsRUFBV0ssR0FBWCxDQUFlVixRQUFRb00sZUFBUixDQUF3QmEsR0FBeEIsQ0FBNEJvQixNQUE1QixDQUFtQyxLQUFuQyxDQUFmO0FBQ0E7QUFDRGhPLEdBQUUsY0FBRixFQUFrQkssR0FBbEIsQ0FBc0IsQ0FBQyxDQUF2QjtBQUNBTCxHQUFFLFlBQUYsRUFBZ0I2RSxJQUFoQjtBQUNBN0UsR0FBRSxVQUFGLEVBQWNLLEdBQWQsQ0FBa0IsQ0FBbEI7QUFDQUwsR0FBRSxVQUFGLEVBQWNzQyxPQUFkLENBQXNCLFFBQXRCO0FBQ0F0QyxHQUFFLHVCQUFGLEVBQTJCOEUsSUFBM0I7QUFDQTlFLEdBQUUsaUJBQUYsRUFBcUJzTCxLQUFyQixDQUEyQixNQUEzQjtBQUNBLENBbEJEOztBQW9CQTs7O0FBR0EsSUFBSXNGLHFCQUFxQixTQUFyQkEsa0JBQXFCLEdBQVU7QUFDbEM7QUFDQTVRLEdBQUUsaUJBQUYsRUFBcUJzTCxLQUFyQixDQUEyQixNQUEzQjs7QUFFQTtBQUNBdEwsR0FBRSxTQUFGLEVBQWFLLEdBQWIsQ0FBaUJWLFFBQVFvTSxlQUFSLENBQXdCeEosS0FBeEIsQ0FBOEIyTyxLQUEvQztBQUNBbFIsR0FBRSxTQUFGLEVBQWFLLEdBQWIsQ0FBaUJWLFFBQVFvTSxlQUFSLENBQXdCeEosS0FBeEIsQ0FBOEJvSyxLQUE5QixDQUFvQ3FCLE1BQXBDLENBQTJDLEtBQTNDLENBQWpCO0FBQ0FoTyxHQUFFLE9BQUYsRUFBV0ssR0FBWCxDQUFlVixRQUFRb00sZUFBUixDQUF3QnhKLEtBQXhCLENBQThCcUssR0FBOUIsQ0FBa0NvQixNQUFsQyxDQUF5QyxLQUF6QyxDQUFmO0FBQ0FoTyxHQUFFLFlBQUYsRUFBZ0I4RSxJQUFoQjtBQUNBOUUsR0FBRSxpQkFBRixFQUFxQjhFLElBQXJCO0FBQ0E5RSxHQUFFLGtCQUFGLEVBQXNCOEUsSUFBdEI7QUFDQTlFLEdBQUUsaUJBQUYsRUFBcUI4RSxJQUFyQjtBQUNBOUUsR0FBRSxjQUFGLEVBQWtCSyxHQUFsQixDQUFzQlYsUUFBUW9NLGVBQVIsQ0FBd0J4SixLQUF4QixDQUE4QitSLFdBQXBEO0FBQ0F0VSxHQUFFLG1CQUFGLEVBQXVCSyxHQUF2QixDQUEyQlYsUUFBUW9NLGVBQVIsQ0FBd0J4SixLQUF4QixDQUE4QjdCLEVBQXpEO0FBQ0FWLEdBQUUsdUJBQUYsRUFBMkI2RSxJQUEzQjs7QUFFQTtBQUNBN0UsR0FBRSxpQkFBRixFQUFxQnNMLEtBQXJCLENBQTJCLE1BQTNCO0FBQ0EsQ0FsQkQ7O0FBb0JBOzs7QUFHQSxJQUFJZ0YsaUJBQWlCLFNBQWpCQSxjQUFpQixHQUFVO0FBQzlCO0FBQ0N0USxHQUFFLGlCQUFGLEVBQXFCc0wsS0FBckIsQ0FBMkIsTUFBM0I7O0FBRUQ7QUFDQSxLQUFJbkwsT0FBTztBQUNWTyxNQUFJZixRQUFRb00sZUFBUixDQUF3QnhKLEtBQXhCLENBQThCK1I7QUFEeEIsRUFBWDtBQUdBLEtBQUl6VCxNQUFNLG9CQUFWOztBQUVBNkksUUFBT0UsS0FBUCxDQUFhekgsR0FBYixDQUFpQnRCLEdBQWpCLEVBQXNCO0FBQ3BCd1QsVUFBUWxVO0FBRFksRUFBdEIsRUFHRXdLLElBSEYsQ0FHTyxVQUFTQyxRQUFULEVBQWtCO0FBQ3ZCNUssSUFBRSxTQUFGLEVBQWFLLEdBQWIsQ0FBaUJ1SyxTQUFTekssSUFBVCxDQUFjK1EsS0FBL0I7QUFDQ2xSLElBQUUsU0FBRixFQUFhSyxHQUFiLENBQWlCeUwsT0FBT2xCLFNBQVN6SyxJQUFULENBQWN3TSxLQUFyQixFQUE0QixxQkFBNUIsRUFBbURxQixNQUFuRCxDQUEwRCxLQUExRCxDQUFqQjtBQUNBaE8sSUFBRSxPQUFGLEVBQVdLLEdBQVgsQ0FBZXlMLE9BQU9sQixTQUFTekssSUFBVCxDQUFjeU0sR0FBckIsRUFBMEIscUJBQTFCLEVBQWlEb0IsTUFBakQsQ0FBd0QsS0FBeEQsQ0FBZjtBQUNBaE8sSUFBRSxjQUFGLEVBQWtCSyxHQUFsQixDQUFzQnVLLFNBQVN6SyxJQUFULENBQWNPLEVBQXBDO0FBQ0FWLElBQUUsbUJBQUYsRUFBdUJLLEdBQXZCLENBQTJCLENBQUMsQ0FBNUI7QUFDQUwsSUFBRSxZQUFGLEVBQWdCNkUsSUFBaEI7QUFDQTdFLElBQUUsVUFBRixFQUFjSyxHQUFkLENBQWtCdUssU0FBU3pLLElBQVQsQ0FBY29VLFdBQWhDO0FBQ0F2VSxJQUFFLFVBQUYsRUFBY3NDLE9BQWQsQ0FBc0IsUUFBdEI7QUFDQSxNQUFHc0ksU0FBU3pLLElBQVQsQ0FBY29VLFdBQWQsSUFBNkIsQ0FBaEMsRUFBa0M7QUFDakN2VSxLQUFFLGVBQUYsRUFBbUJLLEdBQW5CLENBQXVCdUssU0FBU3pLLElBQVQsQ0FBY3FVLFlBQXJDO0FBQ0F4VSxLQUFFLGVBQUYsRUFBbUJLLEdBQW5CLENBQXVCeUwsT0FBT2xCLFNBQVN6SyxJQUFULENBQWNzVSxZQUFyQixFQUFtQyxxQkFBbkMsRUFBMER6RyxNQUExRCxDQUFpRSxZQUFqRSxDQUF2QjtBQUNBLEdBSEQsTUFHTSxJQUFJcEQsU0FBU3pLLElBQVQsQ0FBY29VLFdBQWQsSUFBNkIsQ0FBakMsRUFBbUM7QUFDeEN2VSxLQUFFLGdCQUFGLEVBQW9CSyxHQUFwQixDQUF3QnVLLFNBQVN6SyxJQUFULENBQWNxVSxZQUF0QztBQUNELE9BQUlFLGdCQUFnQkMsT0FBTy9KLFNBQVN6SyxJQUFULENBQWN1VSxhQUFyQixDQUFwQjtBQUNDMVUsS0FBRSxtQkFBRixFQUF1QjRFLElBQXZCLENBQTRCLFNBQTVCLEVBQXdDOFAsY0FBY0UsT0FBZCxDQUFzQixHQUF0QixLQUE4QixDQUF0RTtBQUNBNVUsS0FBRSxtQkFBRixFQUF1QjRFLElBQXZCLENBQTRCLFNBQTVCLEVBQXdDOFAsY0FBY0UsT0FBZCxDQUFzQixHQUF0QixLQUE4QixDQUF0RTtBQUNBNVUsS0FBRSxtQkFBRixFQUF1QjRFLElBQXZCLENBQTRCLFNBQTVCLEVBQXdDOFAsY0FBY0UsT0FBZCxDQUFzQixHQUF0QixLQUE4QixDQUF0RTtBQUNBNVUsS0FBRSxtQkFBRixFQUF1QjRFLElBQXZCLENBQTRCLFNBQTVCLEVBQXdDOFAsY0FBY0UsT0FBZCxDQUFzQixHQUF0QixLQUE4QixDQUF0RTtBQUNBNVUsS0FBRSxtQkFBRixFQUF1QjRFLElBQXZCLENBQTRCLFNBQTVCLEVBQXdDOFAsY0FBY0UsT0FBZCxDQUFzQixHQUF0QixLQUE4QixDQUF0RTtBQUNBNVUsS0FBRSxlQUFGLEVBQW1CSyxHQUFuQixDQUF1QnlMLE9BQU9sQixTQUFTekssSUFBVCxDQUFjc1UsWUFBckIsRUFBbUMscUJBQW5DLEVBQTBEekcsTUFBMUQsQ0FBaUUsWUFBakUsQ0FBdkI7QUFDQTtBQUNEaE8sSUFBRSx1QkFBRixFQUEyQjZFLElBQTNCO0FBQ0E3RSxJQUFFLGlCQUFGLEVBQXFCc0wsS0FBckIsQ0FBMkIsTUFBM0I7QUFDRCxFQTNCRixFQTRCRUosS0E1QkYsQ0E0QlEsVUFBU2IsS0FBVCxFQUFlO0FBQ3JCakYsT0FBSytGLFdBQUwsQ0FBaUIsMEJBQWpCLEVBQTZDLEVBQTdDLEVBQWlEZCxLQUFqRDtBQUNBLEVBOUJGO0FBK0JBLENBekNEOztBQTJDQTs7O0FBR0EsSUFBSXlFLGFBQWEsU0FBYkEsVUFBYSxHQUFVO0FBQzFCO0FBQ0EsS0FBSW5PLE1BQU1rVSxPQUFPLHlCQUFQLENBQVY7O0FBRUE7QUFDQSxLQUFJMVUsT0FBTztBQUNWUSxPQUFLQTtBQURLLEVBQVg7QUFHQSxLQUFJRSxNQUFNLHFCQUFWOztBQUVBO0FBQ0E2SSxRQUFPRSxLQUFQLENBQWFjLElBQWIsQ0FBa0I3SixHQUFsQixFQUF1QlYsSUFBdkIsRUFDRXdLLElBREYsQ0FDTyxVQUFTQyxRQUFULEVBQWtCO0FBQ3ZCakksUUFBTWlJLFNBQVN6SyxJQUFmO0FBQ0EsRUFIRixFQUlFK0ssS0FKRixDQUlRLFVBQVNiLEtBQVQsRUFBZTtBQUNyQixNQUFHQSxNQUFNTyxRQUFULEVBQWtCO0FBQ2pCO0FBQ0EsT0FBR1AsTUFBTU8sUUFBTixDQUFla0gsTUFBZixJQUF5QixHQUE1QixFQUFnQztBQUMvQm5QLFVBQU0sNEJBQTRCMEgsTUFBTU8sUUFBTixDQUFlekssSUFBZixDQUFvQixLQUFwQixDQUFsQztBQUNBLElBRkQsTUFFSztBQUNKd0MsVUFBTSw0QkFBNEIwSCxNQUFNTyxRQUFOLENBQWV6SyxJQUFqRDtBQUNBO0FBQ0Q7QUFDRCxFQWJGO0FBY0EsQ0F6QkQsQzs7Ozs7Ozs7QUM3NkJBLHlDQUFBdUosT0FBT29MLEdBQVAsR0FBYSxtQkFBQXBWLENBQVEsRUFBUixDQUFiO0FBQ0EsSUFBSTBGLE9BQU8sbUJBQUExRixDQUFRLENBQVIsQ0FBWDtBQUNBLElBQUlxVixPQUFPLG1CQUFBclYsQ0FBUSxHQUFSLEVBQXdCc1YsT0FBbkM7QUFDQTtBQUNBLG1CQUFBdFYsQ0FBUSxHQUFSOztBQUVBZ0ssT0FBT3VMLE1BQVAsR0FBZ0IsbUJBQUF2VixDQUFRLEdBQVIsQ0FBaEI7QUFDQTs7OztBQUlBQyxRQUFRQyxJQUFSLEdBQWUsWUFBVTs7QUFFeEI7QUFDQXNWLEtBQUlDLEtBQUosQ0FBVTtBQUNQQyxVQUFRLENBQ0o7QUFDSXhTLFNBQU07QUFEVixHQURJLENBREQ7QUFNUHlTLFVBQVEsR0FORDtBQU9QQyxRQUFNLFVBUEM7QUFRUEMsV0FBUztBQVJGLEVBQVY7O0FBV0E7QUFDQTdMLFFBQU84TCxNQUFQLEdBQWdCQyxTQUFTelYsRUFBRSxTQUFGLEVBQWFLLEdBQWIsRUFBVCxDQUFoQjs7QUFFQTtBQUNBTCxHQUFFLG1CQUFGLEVBQXVCRSxFQUF2QixDQUEwQixPQUExQixFQUFtQ3dWLGdCQUFuQzs7QUFFQTtBQUNBMVYsR0FBRSxrQkFBRixFQUFzQkUsRUFBdEIsQ0FBeUIsT0FBekIsRUFBa0N5VixlQUFsQzs7QUFFQTtBQUNBak0sUUFBT2tNLEVBQVAsR0FBWSxJQUFJZCxHQUFKLENBQVE7QUFDbkJlLE1BQUksWUFEZTtBQUVuQjFWLFFBQU07QUFDTDJWLFVBQU8sRUFERjtBQUVMdEgsWUFBU2lILFNBQVN6VixFQUFFLFlBQUYsRUFBZ0JLLEdBQWhCLEVBQVQsS0FBbUMsQ0FGdkM7QUFHTG1WLFdBQVFDLFNBQVN6VixFQUFFLFNBQUYsRUFBYUssR0FBYixFQUFULENBSEg7QUFJTDBWLFdBQVE7QUFKSCxHQUZhO0FBUW5CQyxXQUFTO0FBQ1I7QUFDQUMsYUFBVSxrQkFBU0MsQ0FBVCxFQUFXO0FBQ3BCLFdBQU07QUFDTCxtQkFBY0EsRUFBRXBFLE1BQUYsSUFBWSxDQUFaLElBQWlCb0UsRUFBRXBFLE1BQUYsSUFBWSxDQUR0QztBQUVMLHNCQUFpQm9FLEVBQUVwRSxNQUFGLElBQVksQ0FGeEI7QUFHTCx3QkFBbUJvRSxFQUFFQyxNQUFGLElBQVksS0FBS1gsTUFIL0I7QUFJTCw2QkFBd0J4VixFQUFFb1csT0FBRixDQUFVRixFQUFFQyxNQUFaLEVBQW9CLEtBQUtKLE1BQXpCLEtBQW9DLENBQUM7QUFKeEQsS0FBTjtBQU1BLElBVE87QUFVUjtBQUNBTSxnQkFBYSxxQkFBUzlULEtBQVQsRUFBZTtBQUMzQixRQUFJcEMsT0FBTyxFQUFFbVcsS0FBSy9ULE1BQU1nVSxhQUFOLENBQW9CQyxPQUFwQixDQUE0QjlWLEVBQW5DLEVBQVg7QUFDQSxRQUFJRyxNQUFNLG9CQUFWO0FBQ0E0VixhQUFTNVYsR0FBVCxFQUFjVixJQUFkLEVBQW9CLE1BQXBCO0FBQ0EsSUFmTzs7QUFpQlI7QUFDQXVXLGVBQVksb0JBQVNuVSxLQUFULEVBQWU7QUFDMUIsUUFBSXBDLE9BQU8sRUFBRW1XLEtBQUsvVCxNQUFNZ1UsYUFBTixDQUFvQkMsT0FBcEIsQ0FBNEI5VixFQUFuQyxFQUFYO0FBQ0EsUUFBSUcsTUFBTSxtQkFBVjtBQUNBNFYsYUFBUzVWLEdBQVQsRUFBY1YsSUFBZCxFQUFvQixLQUFwQjtBQUNBLElBdEJPOztBQXdCUjtBQUNBd1csZ0JBQWEscUJBQVNwVSxLQUFULEVBQWU7QUFDM0IsUUFBSXBDLE9BQU8sRUFBRW1XLEtBQUsvVCxNQUFNZ1UsYUFBTixDQUFvQkMsT0FBcEIsQ0FBNEI5VixFQUFuQyxFQUFYO0FBQ0EsUUFBSUcsTUFBTSxvQkFBVjtBQUNBNFYsYUFBUzVWLEdBQVQsRUFBY1YsSUFBZCxFQUFvQixXQUFwQjtBQUNBLElBN0JPOztBQStCUjtBQUNBeVcsZUFBWSxvQkFBU3JVLEtBQVQsRUFBZTtBQUMxQixRQUFJcEMsT0FBTyxFQUFFbVcsS0FBSy9ULE1BQU1nVSxhQUFOLENBQW9CQyxPQUFwQixDQUE0QjlWLEVBQW5DLEVBQVg7QUFDQSxRQUFJRyxNQUFNLHNCQUFWO0FBQ0E0VixhQUFTNVYsR0FBVCxFQUFjVixJQUFkLEVBQW9CLFFBQXBCO0FBQ0E7QUFwQ087QUFSVSxFQUFSLENBQVo7O0FBaURBO0FBQ0EsS0FBR3VKLE9BQU9tTixHQUFQLElBQWMsT0FBZCxJQUF5Qm5OLE9BQU9tTixHQUFQLElBQWMsU0FBMUMsRUFBb0Q7QUFDbkR6TSxVQUFRMUgsR0FBUixDQUFZLHlCQUFaO0FBQ0F1UyxTQUFPNkIsWUFBUCxHQUFzQixJQUF0QjtBQUNBOztBQUVEOztBQUVBcE4sUUFBT3FMLElBQVAsR0FBYyxJQUFJQSxJQUFKLENBQVM7QUFDdEJnQyxlQUFhLFFBRFM7QUFFdEJDLE9BQUt0TixPQUFPdU4sU0FGVTtBQUd0QkMsV0FBU3hOLE9BQU95TjtBQUhNLEVBQVQsQ0FBZDs7QUFNQTtBQUNBek4sUUFBT3FMLElBQVAsQ0FBWXFDLFNBQVosQ0FBc0JDLE1BQXRCLENBQTZCQyxVQUE3QixDQUF3Q3pJLElBQXhDLENBQTZDLFdBQTdDLEVBQTBELFlBQVU7QUFDbkU7QUFDQTdPLElBQUUsWUFBRixFQUFnQjhLLFFBQWhCLENBQXlCLFdBQXpCOztBQUVBO0FBQ0FwQixTQUFPRSxLQUFQLENBQWF6SCxHQUFiLENBQWlCLHlCQUF5QnVILE9BQU82TixJQUFqRCxFQUNFNU0sSUFERixDQUNPLFVBQVNDLFFBQVQsRUFBa0I7QUFDdkJsQixVQUFPa00sRUFBUCxDQUFVRSxLQUFWLEdBQWtCcE0sT0FBT2tNLEVBQVAsQ0FBVUUsS0FBVixDQUFnQjBCLE1BQWhCLENBQXVCNU0sU0FBU3pLLElBQWhDLENBQWxCO0FBQ0FzWCxnQkFBYS9OLE9BQU9rTSxFQUFQLENBQVVFLEtBQXZCO0FBQ0E0QixvQkFBaUJoTyxPQUFPa00sRUFBUCxDQUFVRSxLQUEzQjtBQUNBcE0sVUFBT2tNLEVBQVAsQ0FBVUUsS0FBVixDQUFnQjZCLElBQWhCLENBQXFCQyxZQUFyQjtBQUNBLEdBTkYsRUFPRTFNLEtBUEYsQ0FPUSxVQUFTYixLQUFULEVBQWU7QUFDckJqRixRQUFLK0YsV0FBTCxDQUFpQixXQUFqQixFQUE4QixFQUE5QixFQUFrQ2QsS0FBbEM7QUFDQSxHQVRGO0FBVUEsRUFmRDs7QUFpQkE7QUFDQTs7Ozs7O0FBT0E7QUFDQVgsUUFBT3FMLElBQVAsQ0FBWThDLE9BQVosQ0FBb0IsaUJBQXBCLEVBQ0VDLE1BREYsQ0FDUyxpQkFEVCxFQUM0QixVQUFDaEgsQ0FBRCxFQUFPO0FBQ2pDLE1BQUdBLEVBQUV5RyxJQUFGLElBQVU3TixPQUFPNk4sSUFBcEIsRUFBeUI7QUFDeEI7QUFDQTdOLFVBQU9xQixRQUFQLENBQWdCZ04sSUFBaEIsR0FBdUIsbUJBQW1Cck8sT0FBTzZOLElBQWpEO0FBQ0E7QUFDRixFQU5EOztBQVFBN04sUUFBT3FMLElBQVAsQ0FBWWlELElBQVosQ0FBaUIsVUFBakIsRUFDRUMsSUFERixDQUNPLFVBQUNDLEtBQUQsRUFBVztBQUNoQixNQUFJQyxNQUFNRCxNQUFNdFgsTUFBaEI7QUFDQSxPQUFJLElBQUl3WCxJQUFJLENBQVosRUFBZUEsSUFBSUQsR0FBbkIsRUFBd0JDLEdBQXhCLEVBQTRCO0FBQzNCMU8sVUFBT2tNLEVBQVAsQ0FBVUcsTUFBVixDQUFpQnNDLElBQWpCLENBQXNCSCxNQUFNRSxDQUFOLEVBQVMxWCxFQUEvQjtBQUNBO0FBQ0QsRUFORixFQU9FNFgsT0FQRixDQU9VLFVBQUNDLElBQUQsRUFBVTtBQUNsQjdPLFNBQU9rTSxFQUFQLENBQVVHLE1BQVYsQ0FBaUJzQyxJQUFqQixDQUFzQkUsS0FBSzdYLEVBQTNCO0FBQ0EsRUFURixFQVVFOFgsT0FWRixDQVVVLFVBQUNELElBQUQsRUFBVTtBQUNsQjdPLFNBQU9rTSxFQUFQLENBQVVHLE1BQVYsQ0FBaUIwQyxNQUFqQixDQUF5QnpZLEVBQUVvVyxPQUFGLENBQVVtQyxLQUFLN1gsRUFBZixFQUFtQmdKLE9BQU9rTSxFQUFQLENBQVVHLE1BQTdCLENBQXpCLEVBQStELENBQS9EO0FBQ0EsRUFaRixFQWFFK0IsTUFiRixDQWFTLHNCQWJULEVBYWlDLFVBQUMzWCxJQUFELEVBQVU7QUFDekMsTUFBSTJWLFFBQVFwTSxPQUFPa00sRUFBUCxDQUFVRSxLQUF0QjtBQUNBLE1BQUk0QyxRQUFRLEtBQVo7QUFDQSxNQUFJUCxNQUFNckMsTUFBTWxWLE1BQWhCOztBQUVBO0FBQ0EsT0FBSSxJQUFJd1gsSUFBSSxDQUFaLEVBQWVBLElBQUlELEdBQW5CLEVBQXdCQyxHQUF4QixFQUE0QjtBQUMzQixPQUFHdEMsTUFBTXNDLENBQU4sRUFBUzFYLEVBQVQsS0FBZ0JQLEtBQUtPLEVBQXhCLEVBQTJCO0FBQzFCLFFBQUdQLEtBQUsyUixNQUFMLEdBQWMsQ0FBakIsRUFBbUI7QUFDbEJnRSxXQUFNc0MsQ0FBTixJQUFXalksSUFBWDtBQUNBLEtBRkQsTUFFSztBQUNKMlYsV0FBTTJDLE1BQU4sQ0FBYUwsQ0FBYixFQUFnQixDQUFoQjtBQUNBQTtBQUNBRDtBQUNBO0FBQ0RPLFlBQVEsSUFBUjtBQUNBO0FBQ0Q7O0FBRUQ7QUFDQSxNQUFHLENBQUNBLEtBQUosRUFBVTtBQUNUNUMsU0FBTXVDLElBQU4sQ0FBV2xZLElBQVg7QUFDQTs7QUFFRDtBQUNBc1gsZUFBYTNCLEtBQWI7O0FBRUE7QUFDQSxNQUFHM1YsS0FBS2dXLE1BQUwsS0FBZ0JYLE1BQW5CLEVBQTBCO0FBQ3pCbUQsYUFBVXhZLElBQVY7QUFDQTs7QUFFRDtBQUNBMlYsUUFBTTZCLElBQU4sQ0FBV0MsWUFBWDs7QUFFQTtBQUNBbE8sU0FBT2tNLEVBQVAsQ0FBVUUsS0FBVixHQUFrQkEsS0FBbEI7QUFDQSxFQWxERjtBQW9EQSxDQTlLRDs7QUFnTEE7Ozs7O0FBS0FoQixJQUFJOEQsTUFBSixDQUFXLFlBQVgsRUFBeUIsVUFBU3pZLElBQVQsRUFBYztBQUN0QyxLQUFHQSxLQUFLMlIsTUFBTCxLQUFnQixDQUFuQixFQUFzQixPQUFPLEtBQVA7QUFDdEIsS0FBRzNSLEtBQUsyUixNQUFMLEtBQWdCLENBQW5CLEVBQXNCLE9BQU8sUUFBUDtBQUN0QixLQUFHM1IsS0FBSzJSLE1BQUwsS0FBZ0IsQ0FBbkIsRUFBc0IsT0FBTyxlQUFlM1IsS0FBS3FPLE9BQTNCO0FBQ3RCLEtBQUdyTyxLQUFLMlIsTUFBTCxLQUFnQixDQUFuQixFQUFzQixPQUFPLE9BQVA7QUFDdEIsS0FBRzNSLEtBQUsyUixNQUFMLEtBQWdCLENBQW5CLEVBQXNCLE9BQU8sUUFBUDtBQUN0QixLQUFHM1IsS0FBSzJSLE1BQUwsS0FBZ0IsQ0FBbkIsRUFBc0IsT0FBTyxNQUFQO0FBQ3RCLENBUEQ7O0FBU0E7OztBQUdBLElBQUk0RCxtQkFBbUIsU0FBbkJBLGdCQUFtQixHQUFVO0FBQ2hDMVYsR0FBRSxZQUFGLEVBQWdCeUssV0FBaEIsQ0FBNEIsV0FBNUI7O0FBRUEsS0FBSTVKLE1BQU0sNEJBQTRCNkksT0FBTzZOLElBQTdDO0FBQ0E3TixRQUFPRSxLQUFQLENBQWFjLElBQWIsQ0FBa0I3SixHQUFsQixFQUF1QixFQUF2QixFQUNFOEosSUFERixDQUNPLFVBQVNDLFFBQVQsRUFBa0I7QUFDdkJ4RixPQUFLNkYsY0FBTCxDQUFvQkwsU0FBU3pLLElBQTdCLEVBQW1DLFNBQW5DO0FBQ0EwWTtBQUNBN1ksSUFBRSxZQUFGLEVBQWdCOEssUUFBaEIsQ0FBeUIsV0FBekI7QUFDQSxFQUxGLEVBTUVJLEtBTkYsQ0FNUSxVQUFTYixLQUFULEVBQWU7QUFDckJqRixPQUFLK0YsV0FBTCxDQUFpQixVQUFqQixFQUE2QixRQUE3QixFQUF1Q2QsS0FBdkM7QUFDQSxFQVJGO0FBU0EsQ0FiRDs7QUFlQTs7O0FBR0EsSUFBSXNMLGtCQUFrQixTQUFsQkEsZUFBa0IsR0FBVTtBQUMvQixLQUFJcFMsU0FBU0MsUUFBUSxlQUFSLENBQWI7QUFDQSxLQUFHRCxXQUFXLElBQWQsRUFBbUI7QUFDbEIsTUFBSXVWLFNBQVN0VixRQUFRLGtFQUFSLENBQWI7QUFDQSxNQUFHc1YsV0FBVyxJQUFkLEVBQW1CO0FBQ2xCO0FBQ0EsT0FBSTlPLFFBQVFoSyxFQUFFLHlCQUFGLEVBQTZCZ0wsSUFBN0IsQ0FBa0MsU0FBbEMsQ0FBWjtBQUNBaEwsS0FBRSx5Q0FBeUMwSixPQUFPNk4sSUFBaEQsR0FBdUQsbUJBQXpELEVBQ0UxVixNQURGLENBQ1M3QixFQUFFLDJDQUEyQzBKLE9BQU84TCxNQUFsRCxHQUEyRCxJQUE3RCxDQURULEVBRUUzVCxNQUZGLENBRVM3QixFQUFFLCtDQUErQ2dLLEtBQS9DLEdBQXVELElBQXpELENBRlQsRUFHRXVKLFFBSEYsQ0FHV3ZULEVBQUVnQyxTQUFTK1csSUFBWCxDQUhYLEVBRzZCO0FBSDdCLElBSUVDLE1BSkY7QUFLQTtBQUNEO0FBQ0QsQ0FkRDs7QUFnQkE7OztBQUdBLElBQUlDLGVBQWUsU0FBZkEsWUFBZSxHQUFVO0FBQzVCalosR0FBRSxtQkFBRixFQUF1QmtaLFVBQXZCLENBQWtDLFVBQWxDO0FBQ0EsQ0FGRDs7QUFJQTs7O0FBR0EsSUFBSUwsZ0JBQWdCLFNBQWhCQSxhQUFnQixHQUFVO0FBQzdCN1ksR0FBRSxtQkFBRixFQUF1QmdMLElBQXZCLENBQTRCLFVBQTVCLEVBQXdDLFVBQXhDO0FBQ0EsQ0FGRDs7QUFJQTs7O0FBR0EsSUFBSXlNLGVBQWUsU0FBZkEsWUFBZSxDQUFTM0IsS0FBVCxFQUFlO0FBQ2pDLEtBQUlxQyxNQUFNckMsTUFBTWxWLE1BQWhCO0FBQ0EsS0FBSXVZLFVBQVUsS0FBZDs7QUFFQTtBQUNBLE1BQUksSUFBSWYsSUFBSSxDQUFaLEVBQWVBLElBQUlELEdBQW5CLEVBQXdCQyxHQUF4QixFQUE0QjtBQUMzQixNQUFHdEMsTUFBTXNDLENBQU4sRUFBU2pDLE1BQVQsS0FBb0J6TSxPQUFPOEwsTUFBOUIsRUFBcUM7QUFDcEMyRCxhQUFVLElBQVY7QUFDQTtBQUNBO0FBQ0Q7O0FBRUQ7QUFDQSxLQUFHQSxPQUFILEVBQVc7QUFDVk47QUFDQSxFQUZELE1BRUs7QUFDSkk7QUFDQTtBQUNELENBbEJEOztBQW9CQTs7Ozs7QUFLQSxJQUFJTixZQUFZLFNBQVpBLFNBQVksQ0FBU1MsTUFBVCxFQUFnQjtBQUMvQixLQUFHQSxPQUFPdEgsTUFBUCxJQUFpQixDQUFwQixFQUFzQjtBQUNyQm9ELE1BQUlDLEtBQUosQ0FBVWtFLElBQVYsQ0FBZSxXQUFmO0FBQ0E7QUFDRCxDQUpEOztBQU1BOzs7OztBQUtBLElBQUkzQixtQkFBbUIsU0FBbkJBLGdCQUFtQixDQUFTNUIsS0FBVCxFQUFlO0FBQ3JDLEtBQUlxQyxNQUFNckMsTUFBTWxWLE1BQWhCO0FBQ0EsTUFBSSxJQUFJd1gsSUFBSSxDQUFaLEVBQWVBLElBQUlELEdBQW5CLEVBQXdCQyxHQUF4QixFQUE0QjtBQUMzQixNQUFHdEMsTUFBTXNDLENBQU4sRUFBU2pDLE1BQVQsS0FBb0J6TSxPQUFPOEwsTUFBOUIsRUFBcUM7QUFDcENtRCxhQUFVN0MsTUFBTXNDLENBQU4sQ0FBVjtBQUNBO0FBQ0E7QUFDRDtBQUNELENBUkQ7O0FBVUE7Ozs7Ozs7QUFPQSxJQUFJUixlQUFlLFNBQWZBLFlBQWUsQ0FBUzBCLENBQVQsRUFBWUMsQ0FBWixFQUFjO0FBQ2hDLEtBQUdELEVBQUV4SCxNQUFGLElBQVl5SCxFQUFFekgsTUFBakIsRUFBd0I7QUFDdkIsU0FBUXdILEVBQUU1WSxFQUFGLEdBQU82WSxFQUFFN1ksRUFBVCxHQUFjLENBQUMsQ0FBZixHQUFtQixDQUEzQjtBQUNBO0FBQ0QsUUFBUTRZLEVBQUV4SCxNQUFGLEdBQVd5SCxFQUFFekgsTUFBYixHQUFzQixDQUF0QixHQUEwQixDQUFDLENBQW5DO0FBQ0EsQ0FMRDs7QUFTQTs7Ozs7OztBQU9BLElBQUkyRSxXQUFXLFNBQVhBLFFBQVcsQ0FBUzVWLEdBQVQsRUFBY1YsSUFBZCxFQUFvQnNKLE1BQXBCLEVBQTJCO0FBQ3pDQyxRQUFPRSxLQUFQLENBQWFjLElBQWIsQ0FBa0I3SixHQUFsQixFQUF1QlYsSUFBdkIsRUFDRXdLLElBREYsQ0FDTyxVQUFTQyxRQUFULEVBQWtCO0FBQ3ZCeEYsT0FBSzZGLGNBQUwsQ0FBb0JMLFNBQVN6SyxJQUE3QixFQUFtQyxTQUFuQztBQUNBLEVBSEYsRUFJRStLLEtBSkYsQ0FJUSxVQUFTYixLQUFULEVBQWU7QUFDckJqRixPQUFLK0YsV0FBTCxDQUFpQjFCLE1BQWpCLEVBQXlCLEVBQXpCLEVBQTZCWSxLQUE3QjtBQUNBLEVBTkY7QUFPQSxDQVJELEM7Ozs7Ozs7O0FDcFVBLDZDQUFJakYsT0FBTyxtQkFBQTFGLENBQVEsQ0FBUixDQUFYO0FBQ0EsbUJBQUFBLENBQVEsQ0FBUjtBQUNBLG1CQUFBQSxDQUFRLEVBQVI7QUFDQSxtQkFBQUEsQ0FBUSxDQUFSOztBQUVBQyxRQUFRQyxJQUFSLEdBQWUsWUFBVTs7QUFFeEJJLEdBQUUsUUFBRixFQUFZa0IsVUFBWixDQUF1QjtBQUN0QkMsU0FBTyxJQURlO0FBRXRCQyxXQUFTO0FBQ1I7QUFDQSxHQUFDLE9BQUQsRUFBVSxDQUFDLE9BQUQsRUFBVSxNQUFWLEVBQWtCLFFBQWxCLEVBQTRCLFdBQTVCLEVBQXlDLE9BQXpDLENBQVYsQ0FGUSxFQUdSLENBQUMsTUFBRCxFQUFTLENBQUMsZUFBRCxFQUFrQixhQUFsQixFQUFpQyxXQUFqQyxFQUE4QyxNQUE5QyxDQUFULENBSFEsRUFJUixDQUFDLE1BQUQsRUFBUyxDQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsV0FBYixDQUFULENBSlEsRUFLUixDQUFDLE1BQUQsRUFBUyxDQUFDLFlBQUQsRUFBZSxVQUFmLEVBQTJCLE1BQTNCLENBQVQsQ0FMUSxDQUZhO0FBU3RCQyxXQUFTLENBVGE7QUFVdEJDLGNBQVk7QUFDWEMsU0FBTSxXQURLO0FBRVhDLGFBQVUsSUFGQztBQUdYQyxnQkFBYSxJQUhGO0FBSVhDLFVBQU87QUFKSTtBQVZVLEVBQXZCOztBQWtCQTtBQUNBMUIsR0FBRSxjQUFGLEVBQWtCRSxFQUFsQixDQUFxQixPQUFyQixFQUE4QixZQUFVOztBQUV2QztBQUNBRixJQUFFLGNBQUYsRUFBa0J5SyxXQUFsQixDQUE4QixXQUE5Qjs7QUFFQTtBQUNBLE1BQUl0SyxPQUFPO0FBQ1ZDLGVBQVlKLEVBQUUsYUFBRixFQUFpQkssR0FBakIsRUFERjtBQUVWQyxjQUFXTixFQUFFLFlBQUYsRUFBZ0JLLEdBQWhCO0FBRkQsR0FBWDtBQUlBLE1BQUlRLE1BQU0saUJBQVY7O0FBRUE7QUFDQTZJLFNBQU9FLEtBQVAsQ0FBYWMsSUFBYixDQUFrQjdKLEdBQWxCLEVBQXVCVixJQUF2QixFQUNFd0ssSUFERixDQUNPLFVBQVNDLFFBQVQsRUFBa0I7QUFDdkJ4RixRQUFLNkYsY0FBTCxDQUFvQkwsU0FBU3pLLElBQTdCLEVBQW1DLFNBQW5DO0FBQ0FpRixRQUFLeUYsZUFBTDtBQUNBN0ssS0FBRSxjQUFGLEVBQWtCOEssUUFBbEIsQ0FBMkIsV0FBM0I7QUFDQTlLLEtBQUUscUJBQUYsRUFBeUJ5SyxXQUF6QixDQUFxQyxXQUFyQztBQUNBLEdBTkYsRUFPRVMsS0FQRixDQU9RLFVBQVNiLEtBQVQsRUFBZTtBQUNyQmpGLFFBQUsrRixXQUFMLENBQWlCLGNBQWpCLEVBQWlDLFVBQWpDLEVBQTZDZCxLQUE3QztBQUNBLEdBVEY7QUFVQSxFQXZCRDs7QUF5QkE7QUFDQXJLLEdBQUUscUJBQUYsRUFBeUJFLEVBQXpCLENBQTRCLE9BQTVCLEVBQXFDLFlBQVU7O0FBRTlDO0FBQ0FGLElBQUUsY0FBRixFQUFrQnlLLFdBQWxCLENBQThCLFdBQTlCOztBQUVBO0FBQ0E7QUFDQSxNQUFJdEssT0FBTyxJQUFJeUIsUUFBSixDQUFhNUIsRUFBRSxNQUFGLEVBQVUsQ0FBVixDQUFiLENBQVg7QUFDQUcsT0FBSzBCLE1BQUwsQ0FBWSxNQUFaLEVBQW9CN0IsRUFBRSxPQUFGLEVBQVdLLEdBQVgsRUFBcEI7QUFDQUYsT0FBSzBCLE1BQUwsQ0FBWSxPQUFaLEVBQXFCN0IsRUFBRSxRQUFGLEVBQVlLLEdBQVosRUFBckI7QUFDQUYsT0FBSzBCLE1BQUwsQ0FBWSxRQUFaLEVBQXNCN0IsRUFBRSxTQUFGLEVBQWFLLEdBQWIsRUFBdEI7QUFDQUYsT0FBSzBCLE1BQUwsQ0FBWSxPQUFaLEVBQXFCN0IsRUFBRSxRQUFGLEVBQVlLLEdBQVosRUFBckI7QUFDQUYsT0FBSzBCLE1BQUwsQ0FBWSxPQUFaLEVBQXFCN0IsRUFBRSxRQUFGLEVBQVlLLEdBQVosRUFBckI7QUFDQSxNQUFHTCxFQUFFLE1BQUYsRUFBVUssR0FBVixFQUFILEVBQW1CO0FBQ2xCRixRQUFLMEIsTUFBTCxDQUFZLEtBQVosRUFBbUI3QixFQUFFLE1BQUYsRUFBVSxDQUFWLEVBQWErQixLQUFiLENBQW1CLENBQW5CLENBQW5CO0FBQ0E7QUFDRCxNQUFJbEIsTUFBTSxpQkFBVjs7QUFFQTZJLFNBQU9FLEtBQVAsQ0FBYWMsSUFBYixDQUFrQjdKLEdBQWxCLEVBQXVCVixJQUF2QixFQUNFd0ssSUFERixDQUNPLFVBQVNDLFFBQVQsRUFBa0I7QUFDdkJ4RixRQUFLNkYsY0FBTCxDQUFvQkwsU0FBU3pLLElBQTdCLEVBQW1DLFNBQW5DO0FBQ0FpRixRQUFLeUYsZUFBTDtBQUNBN0ssS0FBRSxjQUFGLEVBQWtCOEssUUFBbEIsQ0FBMkIsV0FBM0I7QUFDQTlLLEtBQUUscUJBQUYsRUFBeUJ5SyxXQUF6QixDQUFxQyxXQUFyQztBQUNBZixVQUFPRSxLQUFQLENBQWF6SCxHQUFiLENBQWlCLGNBQWpCLEVBQ0V3SSxJQURGLENBQ08sVUFBU0MsUUFBVCxFQUFrQjtBQUN2QjVLLE1BQUUsVUFBRixFQUFjSyxHQUFkLENBQWtCdUssU0FBU3pLLElBQTNCO0FBQ0FILE1BQUUsU0FBRixFQUFhZ0wsSUFBYixDQUFrQixLQUFsQixFQUF5QkosU0FBU3pLLElBQWxDO0FBQ0EsSUFKRixFQUtFK0ssS0FMRixDQUtRLFVBQVNiLEtBQVQsRUFBZTtBQUNyQmpGLFNBQUsrRixXQUFMLENBQWlCLGtCQUFqQixFQUFxQyxFQUFyQyxFQUF5Q2QsS0FBekM7QUFDQSxJQVBGO0FBUUEsR0FkRixFQWVFYSxLQWZGLENBZVEsVUFBU2IsS0FBVCxFQUFlO0FBQ3JCakYsUUFBSytGLFdBQUwsQ0FBaUIsY0FBakIsRUFBaUMsVUFBakMsRUFBNkNkLEtBQTdDO0FBQ0EsR0FqQkY7QUFrQkEsRUFwQ0Q7O0FBc0NBO0FBQ0FySyxHQUFFZ0MsUUFBRixFQUFZOUIsRUFBWixDQUFlLFFBQWYsRUFBeUIsaUJBQXpCLEVBQTRDLFlBQVc7QUFDckQsTUFBSStCLFFBQVFqQyxFQUFFLElBQUYsQ0FBWjtBQUFBLE1BQ0lrQyxXQUFXRCxNQUFNRSxHQUFOLENBQVUsQ0FBVixFQUFhSixLQUFiLEdBQXFCRSxNQUFNRSxHQUFOLENBQVUsQ0FBVixFQUFhSixLQUFiLENBQW1CbkIsTUFBeEMsR0FBaUQsQ0FEaEU7QUFBQSxNQUVJd0IsUUFBUUgsTUFBTTVCLEdBQU4sR0FBWWdDLE9BQVosQ0FBb0IsS0FBcEIsRUFBMkIsR0FBM0IsRUFBZ0NBLE9BQWhDLENBQXdDLE1BQXhDLEVBQWdELEVBQWhELENBRlo7QUFHQUosUUFBTUssT0FBTixDQUFjLFlBQWQsRUFBNEIsQ0FBQ0osUUFBRCxFQUFXRSxLQUFYLENBQTVCO0FBQ0QsRUFMRDs7QUFPQTtBQUNDcEMsR0FBRSxpQkFBRixFQUFxQkUsRUFBckIsQ0FBd0IsWUFBeEIsRUFBc0MsVUFBU3FDLEtBQVQsRUFBZ0JMLFFBQWhCLEVBQTBCRSxLQUExQixFQUFpQzs7QUFFbkUsTUFBSUgsUUFBUWpDLEVBQUUsSUFBRixFQUFRd0MsT0FBUixDQUFnQixjQUFoQixFQUFnQ0MsSUFBaEMsQ0FBcUMsT0FBckMsQ0FBWjtBQUNILE1BQUlDLE1BQU1SLFdBQVcsQ0FBWCxHQUFlQSxXQUFXLGlCQUExQixHQUE4Q0UsS0FBeEQ7O0FBRUcsTUFBR0gsTUFBTXJCLE1BQVQsRUFBaUI7QUFDYnFCLFNBQU01QixHQUFOLENBQVVxQyxHQUFWO0FBQ0gsR0FGRCxNQUVLO0FBQ0QsT0FBR0EsR0FBSCxFQUFPO0FBQ1hDLFVBQU1ELEdBQU47QUFDQTtBQUNDO0FBQ0osRUFaRDtBQWFELENBM0dELEM7Ozs7Ozs7O0FDTEEsNkNBQUlqRCxZQUFZLG1CQUFBQyxDQUFRLENBQVIsQ0FBaEI7O0FBRUFDLFFBQVFDLElBQVIsR0FBZSxZQUFVO0FBQ3ZCLE1BQUlDLFVBQVVKLFVBQVVLLGdCQUF4QjtBQUNBRCxVQUFRRSxHQUFSLEdBQWMsb0JBQWQ7QUFDQU4sWUFBVUcsSUFBVixDQUFlQyxPQUFmOztBQUVBRyxJQUFFLFNBQUYsRUFBYUUsRUFBYixDQUFnQixPQUFoQixFQUF5QixZQUFVO0FBQ2pDLFFBQUlXLE1BQU0sc0JBQVY7QUFDQSxRQUFJRSxTQUFTLGlCQUFiO0FBQ0EsUUFBSVosT0FBTztBQUNUTyxVQUFJVixFQUFFLEtBQUYsRUFBU0ssR0FBVDtBQURLLEtBQVg7QUFHQVosY0FBVXVCLFVBQVYsQ0FBcUJiLElBQXJCLEVBQTJCVSxHQUEzQixFQUFnQ0UsTUFBaEMsRUFBd0MsSUFBeEM7QUFDRCxHQVBEOztBQVNBZixJQUFFLGNBQUYsRUFBa0JFLEVBQWxCLENBQXFCLE9BQXJCLEVBQThCLFlBQVU7QUFDdEMsUUFBSVcsTUFBTSwyQkFBVjtBQUNBLFFBQUlFLFNBQVMsaUJBQWI7QUFDQSxRQUFJWixPQUFPO0FBQ1RPLFVBQUlWLEVBQUUsS0FBRixFQUFTSyxHQUFUO0FBREssS0FBWDtBQUdBWixjQUFVdUIsVUFBVixDQUFxQmIsSUFBckIsRUFBMkJVLEdBQTNCLEVBQWdDRSxNQUFoQztBQUNELEdBUEQ7QUFTRCxDQXZCRCxDOzs7Ozs7OztBQ0ZBLDZDQUFJdEIsWUFBWSxtQkFBQUMsQ0FBUSxDQUFSLENBQWhCOztBQUVBQyxRQUFRQyxJQUFSLEdBQWUsWUFBVTtBQUN2QixNQUFJQyxVQUFVSixVQUFVSyxnQkFBeEI7QUFDQUQsVUFBUUUsR0FBUixHQUFjLG9CQUFkO0FBQ0FOLFlBQVVHLElBQVYsQ0FBZUMsT0FBZjs7QUFFQUcsSUFBRSxTQUFGLEVBQWFFLEVBQWIsQ0FBZ0IsT0FBaEIsRUFBeUIsWUFBVTtBQUNqQyxRQUFJVyxNQUFNLHVCQUFWO0FBQ0EsUUFBSUUsU0FBUyxrQkFBYjtBQUNBLFFBQUlaLE9BQU87QUFDVE8sVUFBSVYsRUFBRSxLQUFGLEVBQVNLLEdBQVQ7QUFESyxLQUFYO0FBR0FaLGNBQVV1QixVQUFWLENBQXFCYixJQUFyQixFQUEyQlUsR0FBM0IsRUFBZ0NFLE1BQWhDO0FBQ0QsR0FQRDtBQVNELENBZEQsQzs7Ozs7Ozs7QUNGQSw2Q0FBSXRCLFlBQVksbUJBQUFDLENBQVEsQ0FBUixDQUFoQjs7QUFFQUMsUUFBUUMsSUFBUixHQUFlLFlBQVU7QUFDdkIsTUFBSUMsVUFBVUosVUFBVUssZ0JBQXhCO0FBQ0FELFVBQVFFLEdBQVIsR0FBYyxvQkFBZDtBQUNBTixZQUFVRyxJQUFWLENBQWVDLE9BQWY7O0FBRUE7O0FBRUFHLElBQUUsU0FBRixFQUFhRSxFQUFiLENBQWdCLE9BQWhCLEVBQXlCLFlBQVU7QUFDakMsUUFBSVcsTUFBTSwyQkFBVjtBQUNBLFFBQUlFLFNBQVMsc0JBQWI7QUFDQSxRQUFJWixPQUFPO0FBQ1RPLFVBQUlWLEVBQUUsS0FBRixFQUFTSyxHQUFUO0FBREssS0FBWDtBQUdBWixjQUFVdUIsVUFBVixDQUFxQmIsSUFBckIsRUFBMkJVLEdBQTNCLEVBQWdDRSxNQUFoQztBQUNELEdBUEQ7QUFTRCxDQWhCRCxDOzs7Ozs7OztBQ0ZBLDZDQUFJdEIsWUFBWSxtQkFBQUMsQ0FBUSxDQUFSLENBQWhCO0FBQ0EsSUFBSTBGLE9BQU8sbUJBQUExRixDQUFRLENBQVIsQ0FBWDs7QUFFQUMsUUFBUUMsSUFBUixHQUFlLFlBQVU7QUFDdkI7QUFDQSxNQUFJQyxVQUFVSixVQUFVSyxnQkFBeEI7QUFDQUQsVUFBUUUsR0FBUixHQUFjLG9CQUFkO0FBQ0FOLFlBQVVHLElBQVY7O0FBRUE7QUFDQUksSUFBRSxpQkFBRixFQUFxQkUsRUFBckIsQ0FBd0IsT0FBeEIsRUFBaUMsWUFBVTtBQUN6QyxRQUFJQyxPQUFPO0FBQ1Q2VyxXQUFLaFgsRUFBRSxJQUFGLEVBQVFnTCxJQUFSLENBQWEsSUFBYjtBQURJLEtBQVg7QUFHQSxRQUFJbkssTUFBTSxvQkFBVjs7QUFFQTZJLFdBQU9FLEtBQVAsQ0FBYWMsSUFBYixDQUFrQjdKLEdBQWxCLEVBQXVCVixJQUF2QixFQUNHd0ssSUFESCxDQUNRLFVBQVM2TyxPQUFULEVBQWlCO0FBQ3JCeFosUUFBRStLLFFBQUYsRUFBWUMsSUFBWixDQUFpQixNQUFqQixFQUF5QixpQkFBekI7QUFDRCxLQUhILEVBSUdFLEtBSkgsQ0FJUyxVQUFTYixLQUFULEVBQWU7QUFDcEJqRixXQUFLK0YsV0FBTCxDQUFpQixNQUFqQixFQUF5QixFQUF6QixFQUE2QmQsS0FBN0I7QUFDRCxLQU5IO0FBT0QsR0FiRDs7QUFlQTtBQUNBckssSUFBRSxhQUFGLEVBQWlCRSxFQUFqQixDQUFvQixPQUFwQixFQUE2QixZQUFVO0FBQ3JDLFFBQUlxRCxTQUFTc1IsT0FBTyxtQ0FBUCxDQUFiO0FBQ0EsUUFBSTFVLE9BQU87QUFDVDZXLFdBQUt6VDtBQURJLEtBQVg7QUFHQSxRQUFJMUMsTUFBTSxtQkFBVjs7QUFFQTZJLFdBQU9FLEtBQVAsQ0FBYWMsSUFBYixDQUFrQjdKLEdBQWxCLEVBQXVCVixJQUF2QixFQUNHd0ssSUFESCxDQUNRLFVBQVM2TyxPQUFULEVBQWlCO0FBQ3JCeFosUUFBRStLLFFBQUYsRUFBWUMsSUFBWixDQUFpQixNQUFqQixFQUF5QixpQkFBekI7QUFDRCxLQUhILEVBSUdFLEtBSkgsQ0FJUyxVQUFTYixLQUFULEVBQWU7QUFDcEJqRixXQUFLK0YsV0FBTCxDQUFpQixRQUFqQixFQUEyQixFQUEzQixFQUErQmQsS0FBL0I7QUFDRCxLQU5IO0FBT0QsR0FkRDtBQWVELENBdENELEM7Ozs7Ozs7O0FDSEEsNkNBQUk1SyxZQUFZLG1CQUFBQyxDQUFRLENBQVIsQ0FBaEI7QUFDQSxJQUFJMEYsT0FBTyxtQkFBQTFGLENBQVEsQ0FBUixDQUFYOztBQUVBQyxRQUFRQyxJQUFSLEdBQWUsWUFBVTtBQUN2QixNQUFJQyxVQUFVSixVQUFVSyxnQkFBeEI7QUFDQUQsVUFBUUUsR0FBUixHQUFjLG9CQUFkO0FBQ0EsTUFBSVcsS0FBS1YsRUFBRSxtQkFBRixFQUF1QkssR0FBdkIsRUFBVDtBQUNBUixVQUFRMEwsSUFBUixHQUFlO0FBQ1gxSyxTQUFLLHNDQUFzQ0gsRUFEaEM7QUFFWCtZLGFBQVM7QUFGRSxHQUFmO0FBSUE1WixVQUFRNlosT0FBUixHQUFrQixDQUNoQixFQUFDLFFBQVEsSUFBVCxFQURnQixFQUVoQixFQUFDLFFBQVEsTUFBVCxFQUZnQixFQUdoQixFQUFDLFFBQVEsU0FBVCxFQUhnQixFQUloQixFQUFDLFFBQVEsVUFBVCxFQUpnQixFQUtoQixFQUFDLFFBQVEsVUFBVCxFQUxnQixFQU1oQixFQUFDLFFBQVEsT0FBVCxFQU5nQixFQU9oQixFQUFDLFFBQVEsSUFBVCxFQVBnQixDQUFsQjtBQVNBN1osVUFBUThaLFVBQVIsR0FBcUIsQ0FBQztBQUNaLGVBQVcsQ0FBQyxDQURBO0FBRVosWUFBUSxJQUZJO0FBR1osY0FBVSxnQkFBU3haLElBQVQsRUFBZW1OLElBQWYsRUFBcUJzTSxHQUFyQixFQUEwQkMsSUFBMUIsRUFBZ0M7QUFDeEMsYUFBTyxtRUFBbUUxWixJQUFuRSxHQUEwRSw2QkFBakY7QUFDRDtBQUxXLEdBQUQsQ0FBckI7QUFPQU4sVUFBUWlhLEtBQVIsR0FBZ0IsQ0FDZCxDQUFDLENBQUQsRUFBSSxLQUFKLENBRGMsRUFFZCxDQUFDLENBQUQsRUFBSSxLQUFKLENBRmMsQ0FBaEI7QUFJQXJhLFlBQVVHLElBQVYsQ0FBZUMsT0FBZjs7QUFFQUcsSUFBRSxlQUFGLEVBQW1CQyxJQUFuQixDQUF3Qix1RkFBeEI7O0FBRUFELElBQUUsT0FBRixFQUFXRSxFQUFYLENBQWMsT0FBZCxFQUF1QixZQUFVO0FBQy9CLFFBQUlDLE9BQU87QUFDVDRaLGFBQU8vWixFQUFFLFFBQUYsRUFBWUssR0FBWixFQURFO0FBRVRnRCx3QkFBa0JyRCxFQUFFLG1CQUFGLEVBQXVCSyxHQUF2QixFQUZUO0FBR1R5RCxnQkFBVTlELEVBQUUsV0FBRixFQUFlSyxHQUFmLEVBSEQ7QUFJVHFELGdCQUFVMUQsRUFBRSxXQUFGLEVBQWVLLEdBQWYsRUFKRDtBQUtUNEQsZUFBU2pFLEVBQUUsVUFBRixFQUFjSyxHQUFkO0FBTEEsS0FBWDtBQU9BLFFBQUk2RCxXQUFXbEUsRUFBRSxtQ0FBRixDQUFmO0FBQ0EsUUFBSWtFLFNBQVN0RCxNQUFULEdBQWtCLENBQXRCLEVBQXlCO0FBQ3JCLFVBQUl1RCxjQUFjRCxTQUFTN0QsR0FBVCxFQUFsQjtBQUNBLFVBQUc4RCxlQUFlLENBQWxCLEVBQW9CO0FBQ2xCaEUsYUFBSzZaLFdBQUwsR0FBbUJoYSxFQUFFLGNBQUYsRUFBa0JLLEdBQWxCLEVBQW5CO0FBQ0QsT0FGRCxNQUVNLElBQUc4RCxlQUFlLENBQWxCLEVBQW9CO0FBQ3hCLFlBQUduRSxFQUFFLGtCQUFGLEVBQXNCSyxHQUF0QixLQUE4QixDQUFqQyxFQUFtQztBQUNqQ0YsZUFBSzhaLGVBQUwsR0FBdUJqYSxFQUFFLGtCQUFGLEVBQXNCSyxHQUF0QixFQUF2QjtBQUNEO0FBQ0Y7QUFDSjtBQUNELFFBQUlLLEtBQUtWLEVBQUUsS0FBRixFQUFTSyxHQUFULEVBQVQ7QUFDQSxRQUFHSyxHQUFHRSxNQUFILElBQWEsQ0FBaEIsRUFBa0I7QUFDaEIsVUFBSUMsTUFBTSw2QkFBVjtBQUNELEtBRkQsTUFFSztBQUNILFVBQUlBLE1BQU0sOEJBQThCSCxFQUF4QztBQUNEO0FBQ0RqQixjQUFVMkwsYUFBVixDQUF3QmpMLElBQXhCLEVBQThCVSxHQUE5QixFQUFtQyx3QkFBbkM7QUFDRCxHQTFCRDs7QUE0QkFiLElBQUUsU0FBRixFQUFhRSxFQUFiLENBQWdCLE9BQWhCLEVBQXlCLFlBQVU7QUFDakMsUUFBSVcsTUFBTSxnQ0FBVjtBQUNBLFFBQUlWLE9BQU87QUFDVE8sVUFBSVYsRUFBRSxLQUFGLEVBQVNLLEdBQVQ7QUFESyxLQUFYO0FBR0FaLGNBQVVpTSxlQUFWLENBQTBCdkwsSUFBMUIsRUFBZ0NVLEdBQWhDLEVBQXFDLHdCQUFyQztBQUNELEdBTkQ7O0FBUUFiLElBQUUsd0JBQUYsRUFBNEJFLEVBQTVCLENBQStCLGdCQUEvQixFQUFpRHlFLFlBQWpEOztBQUVBM0UsSUFBRSx3QkFBRixFQUE0QkUsRUFBNUIsQ0FBK0IsaUJBQS9CLEVBQWtEME8sU0FBbEQ7O0FBRUFBOztBQUVBNU8sSUFBRSxNQUFGLEVBQVVFLEVBQVYsQ0FBYSxPQUFiLEVBQXNCLFlBQVU7QUFDOUJGLE1BQUUsS0FBRixFQUFTSyxHQUFULENBQWEsRUFBYjtBQUNBTCxNQUFFLHVCQUFGLEVBQTJCSyxHQUEzQixDQUErQkwsRUFBRSx1QkFBRixFQUEyQmdMLElBQTNCLENBQWdDLE9BQWhDLENBQS9CO0FBQ0FoTCxNQUFFLFNBQUYsRUFBYThFLElBQWI7QUFDQTlFLE1BQUUsd0JBQUYsRUFBNEJzTCxLQUE1QixDQUFrQyxNQUFsQztBQUNELEdBTEQ7O0FBT0F0TCxJQUFFLFFBQUYsRUFBWUUsRUFBWixDQUFlLE9BQWYsRUFBd0IsT0FBeEIsRUFBaUMsWUFBVTtBQUN6QyxRQUFJUSxLQUFLVixFQUFFLElBQUYsRUFBUUcsSUFBUixDQUFhLElBQWIsQ0FBVDtBQUNBLFFBQUlVLE1BQU0sOEJBQThCSCxFQUF4QztBQUNBZ0osV0FBT0UsS0FBUCxDQUFhekgsR0FBYixDQUFpQnRCLEdBQWpCLEVBQ0c4SixJQURILENBQ1EsVUFBUzZPLE9BQVQsRUFBaUI7QUFDckJ4WixRQUFFLEtBQUYsRUFBU0ssR0FBVCxDQUFhbVosUUFBUXJaLElBQVIsQ0FBYU8sRUFBMUI7QUFDQVYsUUFBRSxXQUFGLEVBQWVLLEdBQWYsQ0FBbUJtWixRQUFRclosSUFBUixDQUFhMkQsUUFBaEM7QUFDQTlELFFBQUUsV0FBRixFQUFlSyxHQUFmLENBQW1CbVosUUFBUXJaLElBQVIsQ0FBYXVELFFBQWhDO0FBQ0ExRCxRQUFFLFVBQUYsRUFBY0ssR0FBZCxDQUFrQm1aLFFBQVFyWixJQUFSLENBQWE4RCxPQUEvQjtBQUNBakUsUUFBRSxRQUFGLEVBQVlLLEdBQVosQ0FBZ0JtWixRQUFRclosSUFBUixDQUFhNFosS0FBN0I7QUFDQS9aLFFBQUUsdUJBQUYsRUFBMkJLLEdBQTNCLENBQStCTCxFQUFFLHVCQUFGLEVBQTJCZ0wsSUFBM0IsQ0FBZ0MsT0FBaEMsQ0FBL0I7QUFDQSxVQUFHd08sUUFBUXJaLElBQVIsQ0FBYW1OLElBQWIsSUFBcUIsUUFBeEIsRUFBaUM7QUFDL0J0TixVQUFFLGNBQUYsRUFBa0JLLEdBQWxCLENBQXNCbVosUUFBUXJaLElBQVIsQ0FBYTZaLFdBQW5DO0FBQ0FoYSxVQUFFLGVBQUYsRUFBbUI0RSxJQUFuQixDQUF3QixTQUF4QixFQUFtQyxJQUFuQztBQUNBNUUsVUFBRSxpQkFBRixFQUFxQjZFLElBQXJCO0FBQ0E3RSxVQUFFLGlCQUFGLEVBQXFCOEUsSUFBckI7QUFDRCxPQUxELE1BS00sSUFBSTBVLFFBQVFyWixJQUFSLENBQWFtTixJQUFiLElBQXFCLGNBQXpCLEVBQXdDO0FBQzVDdE4sVUFBRSxrQkFBRixFQUFzQkssR0FBdEIsQ0FBMEJtWixRQUFRclosSUFBUixDQUFhOFosZUFBdkM7QUFDQWphLFVBQUUsc0JBQUYsRUFBMEJDLElBQTFCLENBQStCLGdCQUFnQnVaLFFBQVFyWixJQUFSLENBQWE4WixlQUE3QixHQUErQyxJQUEvQyxHQUFzRFQsUUFBUXJaLElBQVIsQ0FBYStaLGlCQUFsRztBQUNBbGEsVUFBRSxlQUFGLEVBQW1CNEUsSUFBbkIsQ0FBd0IsU0FBeEIsRUFBbUMsSUFBbkM7QUFDQTVFLFVBQUUsaUJBQUYsRUFBcUI4RSxJQUFyQjtBQUNBOUUsVUFBRSxpQkFBRixFQUFxQjZFLElBQXJCO0FBQ0Q7QUFDRDdFLFFBQUUsU0FBRixFQUFhNkUsSUFBYjtBQUNBN0UsUUFBRSx3QkFBRixFQUE0QnNMLEtBQTVCLENBQWtDLE1BQWxDO0FBQ0QsS0F0QkgsRUF1QkdKLEtBdkJILENBdUJTLFVBQVNiLEtBQVQsRUFBZTtBQUNwQmpGLFdBQUsrRixXQUFMLENBQWlCLHNCQUFqQixFQUF5QyxFQUF6QyxFQUE2Q2QsS0FBN0M7QUFDRCxLQXpCSDtBQTJCRCxHQTlCRDs7QUFnQ0FySyxJQUFFLHlCQUFGLEVBQTZCRSxFQUE3QixDQUFnQyxRQUFoQyxFQUEwQ3lFLFlBQTFDOztBQUVBbEYsWUFBVWdFLGdCQUFWLENBQTJCLGlCQUEzQixFQUE4QyxpQ0FBOUM7QUFDRCxDQXBIRDs7QUFzSEE7OztBQUdBLElBQUlrQixlQUFlLFNBQWZBLFlBQWUsR0FBVTtBQUMzQjtBQUNBLE1BQUlULFdBQVdsRSxFQUFFLG1DQUFGLENBQWY7QUFDQSxNQUFJa0UsU0FBU3RELE1BQVQsR0FBa0IsQ0FBdEIsRUFBeUI7QUFDckIsUUFBSXVELGNBQWNELFNBQVM3RCxHQUFULEVBQWxCO0FBQ0EsUUFBRzhELGVBQWUsQ0FBbEIsRUFBb0I7QUFDbEJuRSxRQUFFLGlCQUFGLEVBQXFCNkUsSUFBckI7QUFDQTdFLFFBQUUsaUJBQUYsRUFBcUI4RSxJQUFyQjtBQUNELEtBSEQsTUFHTSxJQUFHWCxlQUFlLENBQWxCLEVBQW9CO0FBQ3hCbkUsUUFBRSxpQkFBRixFQUFxQjhFLElBQXJCO0FBQ0E5RSxRQUFFLGlCQUFGLEVBQXFCNkUsSUFBckI7QUFDRDtBQUNKO0FBQ0YsQ0FiRDs7QUFlQSxJQUFJK0osWUFBWSxTQUFaQSxTQUFZLEdBQVU7QUFDeEJ4SixPQUFLeUYsZUFBTDtBQUNBN0ssSUFBRSxLQUFGLEVBQVNLLEdBQVQsQ0FBYSxFQUFiO0FBQ0FMLElBQUUsV0FBRixFQUFlSyxHQUFmLENBQW1CLEVBQW5CO0FBQ0FMLElBQUUsV0FBRixFQUFlSyxHQUFmLENBQW1CLEVBQW5CO0FBQ0FMLElBQUUsVUFBRixFQUFjSyxHQUFkLENBQWtCLEVBQWxCO0FBQ0FMLElBQUUsUUFBRixFQUFZSyxHQUFaLENBQWdCLEVBQWhCO0FBQ0FMLElBQUUsdUJBQUYsRUFBMkJLLEdBQTNCLENBQStCTCxFQUFFLHVCQUFGLEVBQTJCZ0wsSUFBM0IsQ0FBZ0MsT0FBaEMsQ0FBL0I7QUFDQWhMLElBQUUsY0FBRixFQUFrQkssR0FBbEIsQ0FBc0IsRUFBdEI7QUFDQUwsSUFBRSxrQkFBRixFQUFzQkssR0FBdEIsQ0FBMEIsSUFBMUI7QUFDQUwsSUFBRSxzQkFBRixFQUEwQkssR0FBMUIsQ0FBOEIsRUFBOUI7QUFDQUwsSUFBRSxzQkFBRixFQUEwQkMsSUFBMUIsQ0FBK0IsZUFBL0I7QUFDQUQsSUFBRSxlQUFGLEVBQW1CNEUsSUFBbkIsQ0FBd0IsU0FBeEIsRUFBbUMsSUFBbkM7QUFDQTVFLElBQUUsZUFBRixFQUFtQjRFLElBQW5CLENBQXdCLFNBQXhCLEVBQW1DLEtBQW5DO0FBQ0E1RSxJQUFFLGlCQUFGLEVBQXFCNkUsSUFBckI7QUFDQTdFLElBQUUsaUJBQUYsRUFBcUI4RSxJQUFyQjtBQUNELENBaEJELEM7Ozs7Ozs7O0FDM0lBLDZDQUFJckYsWUFBWSxtQkFBQUMsQ0FBUSxDQUFSLENBQWhCO0FBQ0EsSUFBSTBGLE9BQU8sbUJBQUExRixDQUFRLENBQVIsQ0FBWDs7QUFFQUMsUUFBUUMsSUFBUixHQUFlLFlBQVU7QUFDdkIsTUFBSUMsVUFBVUosVUFBVUssZ0JBQXhCO0FBQ0FELFVBQVFFLEdBQVIsR0FBYyxvQkFBZDtBQUNBLE1BQUlXLEtBQUtWLEVBQUUsa0JBQUYsRUFBc0JLLEdBQXRCLEVBQVQ7QUFDQVIsVUFBUTBMLElBQVIsR0FBZTtBQUNYMUssU0FBSyxnQ0FBZ0NILEVBRDFCO0FBRVgrWSxhQUFTO0FBRkUsR0FBZjtBQUlBNVosVUFBUTZaLE9BQVIsR0FBa0IsQ0FDaEIsRUFBQyxRQUFRLElBQVQsRUFEZ0IsRUFFaEIsRUFBQyxRQUFRLE1BQVQsRUFGZ0IsRUFHaEIsRUFBQyxRQUFRLElBQVQsRUFIZ0IsQ0FBbEI7QUFLQTdaLFVBQVE4WixVQUFSLEdBQXFCLENBQUM7QUFDWixlQUFXLENBQUMsQ0FEQTtBQUVaLFlBQVEsSUFGSTtBQUdaLGNBQVUsZ0JBQVN4WixJQUFULEVBQWVtTixJQUFmLEVBQXFCc00sR0FBckIsRUFBMEJDLElBQTFCLEVBQWdDO0FBQ3hDLGFBQU8sbUVBQW1FMVosSUFBbkUsR0FBMEUsNkJBQWpGO0FBQ0Q7QUFMVyxHQUFELENBQXJCO0FBT0FOLFVBQVFpYSxLQUFSLEdBQWdCLENBQ2QsQ0FBQyxDQUFELEVBQUksS0FBSixDQURjLENBQWhCO0FBR0FyYSxZQUFVRyxJQUFWLENBQWVDLE9BQWY7O0FBRUFHLElBQUUsZUFBRixFQUFtQkMsSUFBbkIsQ0FBd0IsMkVBQXhCOztBQUVBRCxJQUFFLE9BQUYsRUFBV0UsRUFBWCxDQUFjLE9BQWQsRUFBdUIsWUFBVTtBQUMvQixRQUFJQyxPQUFPO0FBQ1Q4Wix1QkFBaUJqYSxFQUFFLGtCQUFGLEVBQXNCSyxHQUF0QixFQURSO0FBRVQ4WixxQkFBZW5hLEVBQUUsZ0JBQUYsRUFBb0JLLEdBQXBCO0FBRk4sS0FBWDtBQUlBLFFBQUk2RCxXQUFXbEUsRUFBRSw2QkFBRixDQUFmO0FBQ0EsUUFBSWtFLFNBQVN0RCxNQUFULEdBQWtCLENBQXRCLEVBQXlCO0FBQ3JCLFVBQUl1RCxjQUFjRCxTQUFTN0QsR0FBVCxFQUFsQjtBQUNBLFVBQUc4RCxlQUFlLENBQWxCLEVBQW9CO0FBQ2xCaEUsYUFBS2lhLGlCQUFMLEdBQXlCcGEsRUFBRSxvQkFBRixFQUF3QkssR0FBeEIsRUFBekI7QUFDRCxPQUZELE1BRU0sSUFBRzhELGVBQWUsQ0FBbEIsRUFBb0I7QUFDeEJoRSxhQUFLaWEsaUJBQUwsR0FBeUJwYSxFQUFFLG9CQUFGLEVBQXdCSyxHQUF4QixFQUF6QjtBQUNBRixhQUFLa2EsaUJBQUwsR0FBeUJyYSxFQUFFLG9CQUFGLEVBQXdCSyxHQUF4QixFQUF6QjtBQUNEO0FBQ0o7QUFDRCxRQUFJSyxLQUFLVixFQUFFLEtBQUYsRUFBU0ssR0FBVCxFQUFUO0FBQ0EsUUFBR0ssR0FBR0UsTUFBSCxJQUFhLENBQWhCLEVBQWtCO0FBQ2hCLFVBQUlDLE1BQU0sOEJBQVY7QUFDRCxLQUZELE1BRUs7QUFDSCxVQUFJQSxNQUFNLDJCQUEyQkgsRUFBckM7QUFDRDtBQUNEakIsY0FBVTJMLGFBQVYsQ0FBd0JqTCxJQUF4QixFQUE4QlUsR0FBOUIsRUFBbUMseUJBQW5DO0FBQ0QsR0F0QkQ7O0FBd0JBYixJQUFFLFNBQUYsRUFBYUUsRUFBYixDQUFnQixPQUFoQixFQUF5QixZQUFVO0FBQ2pDLFFBQUlXLE1BQU0sNkJBQVY7QUFDQSxRQUFJVixPQUFPO0FBQ1RPLFVBQUlWLEVBQUUsS0FBRixFQUFTSyxHQUFUO0FBREssS0FBWDtBQUdBWixjQUFVaU0sZUFBVixDQUEwQnZMLElBQTFCLEVBQWdDVSxHQUFoQyxFQUFxQyx5QkFBckM7QUFDRCxHQU5EOztBQVFBYixJQUFFLHlCQUFGLEVBQTZCRSxFQUE3QixDQUFnQyxnQkFBaEMsRUFBa0R5RSxZQUFsRDs7QUFFQTNFLElBQUUseUJBQUYsRUFBNkJFLEVBQTdCLENBQWdDLGlCQUFoQyxFQUFtRDBPLFNBQW5EOztBQUVBQTs7QUFFQTVPLElBQUUsTUFBRixFQUFVRSxFQUFWLENBQWEsT0FBYixFQUFzQixZQUFVO0FBQzlCRixNQUFFLEtBQUYsRUFBU0ssR0FBVCxDQUFhLEVBQWI7QUFDQUwsTUFBRSxzQkFBRixFQUEwQkssR0FBMUIsQ0FBOEJMLEVBQUUsc0JBQUYsRUFBMEJnTCxJQUExQixDQUErQixPQUEvQixDQUE5QjtBQUNBaEwsTUFBRSxTQUFGLEVBQWE4RSxJQUFiO0FBQ0E5RSxNQUFFLHlCQUFGLEVBQTZCc0wsS0FBN0IsQ0FBbUMsTUFBbkM7QUFDRCxHQUxEOztBQU9BdEwsSUFBRSxRQUFGLEVBQVlFLEVBQVosQ0FBZSxPQUFmLEVBQXdCLE9BQXhCLEVBQWlDLFlBQVU7QUFDekMsUUFBSVEsS0FBS1YsRUFBRSxJQUFGLEVBQVFHLElBQVIsQ0FBYSxJQUFiLENBQVQ7QUFDQSxRQUFJVSxNQUFNLDJCQUEyQkgsRUFBckM7QUFDQWdKLFdBQU9FLEtBQVAsQ0FBYXpILEdBQWIsQ0FBaUJ0QixHQUFqQixFQUNHOEosSUFESCxDQUNRLFVBQVM2TyxPQUFULEVBQWlCO0FBQ3JCeFosUUFBRSxLQUFGLEVBQVNLLEdBQVQsQ0FBYW1aLFFBQVFyWixJQUFSLENBQWFPLEVBQTFCO0FBQ0FWLFFBQUUsZ0JBQUYsRUFBb0JLLEdBQXBCLENBQXdCbVosUUFBUXJaLElBQVIsQ0FBYWdhLGFBQXJDO0FBQ0FuYSxRQUFFLG9CQUFGLEVBQXdCSyxHQUF4QixDQUE0Qm1aLFFBQVFyWixJQUFSLENBQWFpYSxpQkFBekM7QUFDQSxVQUFHWixRQUFRclosSUFBUixDQUFha2EsaUJBQWhCLEVBQWtDO0FBQ2hDcmEsVUFBRSxvQkFBRixFQUF3QkssR0FBeEIsQ0FBNEJtWixRQUFRclosSUFBUixDQUFha2EsaUJBQXpDO0FBQ0FyYSxVQUFFLFNBQUYsRUFBYTRFLElBQWIsQ0FBa0IsU0FBbEIsRUFBNkIsSUFBN0I7QUFDQTVFLFVBQUUsY0FBRixFQUFrQjZFLElBQWxCO0FBQ0E3RSxVQUFFLGVBQUYsRUFBbUI4RSxJQUFuQjtBQUNELE9BTEQsTUFLSztBQUNIOUUsVUFBRSxvQkFBRixFQUF3QkssR0FBeEIsQ0FBNEIsRUFBNUI7QUFDQUwsVUFBRSxTQUFGLEVBQWE0RSxJQUFiLENBQWtCLFNBQWxCLEVBQTZCLElBQTdCO0FBQ0E1RSxVQUFFLGVBQUYsRUFBbUI2RSxJQUFuQjtBQUNBN0UsVUFBRSxjQUFGLEVBQWtCOEUsSUFBbEI7QUFDRDtBQUNEOUUsUUFBRSxTQUFGLEVBQWE2RSxJQUFiO0FBQ0E3RSxRQUFFLHlCQUFGLEVBQTZCc0wsS0FBN0IsQ0FBbUMsTUFBbkM7QUFDRCxLQWxCSCxFQW1CR0osS0FuQkgsQ0FtQlMsVUFBU2IsS0FBVCxFQUFlO0FBQ3BCakYsV0FBSytGLFdBQUwsQ0FBaUIsK0JBQWpCLEVBQWtELEVBQWxELEVBQXNEZCxLQUF0RDtBQUNELEtBckJIO0FBdUJDLEdBMUJIOztBQTRCRXJLLElBQUUsbUJBQUYsRUFBdUJFLEVBQXZCLENBQTBCLFFBQTFCLEVBQW9DeUUsWUFBcEM7QUFDSCxDQXJHRDs7QUF1R0E7OztBQUdBLElBQUlBLGVBQWUsU0FBZkEsWUFBZSxHQUFVO0FBQzNCO0FBQ0EsTUFBSVQsV0FBV2xFLEVBQUUsNkJBQUYsQ0FBZjtBQUNBLE1BQUlrRSxTQUFTdEQsTUFBVCxHQUFrQixDQUF0QixFQUF5QjtBQUNyQixRQUFJdUQsY0FBY0QsU0FBUzdELEdBQVQsRUFBbEI7QUFDQSxRQUFHOEQsZUFBZSxDQUFsQixFQUFvQjtBQUNsQm5FLFFBQUUsZUFBRixFQUFtQjZFLElBQW5CO0FBQ0E3RSxRQUFFLGNBQUYsRUFBa0I4RSxJQUFsQjtBQUNELEtBSEQsTUFHTSxJQUFHWCxlQUFlLENBQWxCLEVBQW9CO0FBQ3hCbkUsUUFBRSxlQUFGLEVBQW1COEUsSUFBbkI7QUFDQTlFLFFBQUUsY0FBRixFQUFrQjZFLElBQWxCO0FBQ0Q7QUFDSjtBQUNGLENBYkQ7O0FBZUEsSUFBSStKLFlBQVksU0FBWkEsU0FBWSxHQUFVO0FBQ3hCeEosT0FBS3lGLGVBQUw7QUFDQTdLLElBQUUsS0FBRixFQUFTSyxHQUFULENBQWEsRUFBYjtBQUNBTCxJQUFFLGdCQUFGLEVBQW9CSyxHQUFwQixDQUF3QixFQUF4QjtBQUNBTCxJQUFFLG9CQUFGLEVBQXdCSyxHQUF4QixDQUE0QixFQUE1QjtBQUNBTCxJQUFFLG9CQUFGLEVBQXdCSyxHQUF4QixDQUE0QixFQUE1QjtBQUNBTCxJQUFFLFNBQUYsRUFBYTRFLElBQWIsQ0FBa0IsU0FBbEIsRUFBNkIsSUFBN0I7QUFDQTVFLElBQUUsU0FBRixFQUFhNEUsSUFBYixDQUFrQixTQUFsQixFQUE2QixLQUE3QjtBQUNBNUUsSUFBRSxlQUFGLEVBQW1CNkUsSUFBbkI7QUFDQTdFLElBQUUsY0FBRixFQUFrQjhFLElBQWxCO0FBQ0QsQ0FWRCxDOzs7Ozs7OztBQzVIQSw2Q0FBSXJGLFlBQVksbUJBQUFDLENBQVEsQ0FBUixDQUFoQjtBQUNBLElBQUkwRixPQUFPLG1CQUFBMUYsQ0FBUSxDQUFSLENBQVg7O0FBRUFDLFFBQVFDLElBQVIsR0FBZSxZQUFVO0FBQ3ZCLE1BQUlDLFVBQVVKLFVBQVVLLGdCQUF4QjtBQUNBRCxVQUFRRSxHQUFSLEdBQWMsb0JBQWQ7QUFDQSxNQUFJVyxLQUFLVixFQUFFLFVBQUYsRUFBY0ssR0FBZCxFQUFUO0FBQ0FSLFVBQVEwTCxJQUFSLEdBQWU7QUFDWDFLLFNBQUssNkJBQTZCSCxFQUR2QjtBQUVYK1ksYUFBUztBQUZFLEdBQWY7QUFJQTVaLFVBQVE2WixPQUFSLEdBQWtCLENBQ2hCLEVBQUMsUUFBUSxJQUFULEVBRGdCLEVBRWhCLEVBQUMsUUFBUSxNQUFULEVBRmdCLEVBR2hCLEVBQUMsUUFBUSxtQkFBVCxFQUhnQixFQUloQixFQUFDLFFBQVEsU0FBVCxFQUpnQixFQUtoQixFQUFDLFFBQVEsVUFBVCxFQUxnQixFQU1oQixFQUFDLFFBQVEsVUFBVCxFQU5nQixFQU9oQixFQUFDLFFBQVEsT0FBVCxFQVBnQixFQVFoQixFQUFDLFFBQVEsZ0JBQVQsRUFSZ0IsRUFTaEIsRUFBQyxRQUFRLGtCQUFULEVBVGdCLEVBVWhCLEVBQUMsUUFBUSxJQUFULEVBVmdCLENBQWxCO0FBWUE3WixVQUFROFosVUFBUixHQUFxQixDQUFDO0FBQ1osZUFBVyxDQUFDLENBREE7QUFFWixZQUFRLElBRkk7QUFHWixjQUFVLGdCQUFTeFosSUFBVCxFQUFlbU4sSUFBZixFQUFxQnNNLEdBQXJCLEVBQTBCQyxJQUExQixFQUFnQztBQUN4QyxhQUFPLG1FQUFtRTFaLElBQW5FLEdBQTBFLDZCQUFqRjtBQUNEO0FBTFcsR0FBRCxDQUFyQjtBQU9BTixVQUFRaWEsS0FBUixHQUFnQixDQUNkLENBQUMsQ0FBRCxFQUFJLEtBQUosQ0FEYyxFQUVkLENBQUMsQ0FBRCxFQUFJLEtBQUosQ0FGYyxDQUFoQjtBQUlBcmEsWUFBVUcsSUFBVixDQUFlQyxPQUFmOztBQUVBRyxJQUFFLGVBQUYsRUFBbUJDLElBQW5CLENBQXdCLHFGQUF4Qjs7QUFFQTtBQUNBLE1BQUlxYSxXQUFXO0FBQ2Isa0JBQWMsRUFERDtBQUViLG9CQUFnQjtBQUZILEdBQWY7QUFJQUEsV0FBU3ZhLEdBQVQsR0FBZSxxQkFBZjtBQUNBdWEsV0FBUy9PLElBQVQsR0FBZ0I7QUFDWjFLLFNBQUssZ0NBQWdDSCxFQUR6QjtBQUVaK1ksYUFBUztBQUZHLEdBQWhCO0FBSUFhLFdBQVNaLE9BQVQsR0FBbUIsQ0FDakIsRUFBQyxRQUFRLElBQVQsRUFEaUIsRUFFakIsRUFBQyxRQUFRLE1BQVQsRUFGaUIsRUFHakIsRUFBQyxRQUFRLFVBQVQsRUFIaUIsRUFJakIsRUFBQyxRQUFRLElBQVQsRUFKaUIsQ0FBbkI7QUFNQVksV0FBU1gsVUFBVCxHQUFzQixDQUFDO0FBQ2IsZUFBVyxDQUFDLENBREM7QUFFYixZQUFRLElBRks7QUFHYixjQUFVLGdCQUFTeFosSUFBVCxFQUFlbU4sSUFBZixFQUFxQnNNLEdBQXJCLEVBQTBCQyxJQUExQixFQUFnQztBQUN4QyxhQUFPLGtGQUFrRjFaLElBQWxGLEdBQXlGLDZCQUFoRztBQUNEO0FBTFksR0FBRCxDQUF0QjtBQU9BbWEsV0FBU1IsS0FBVCxHQUFpQixDQUNmLENBQUMsQ0FBRCxFQUFJLEtBQUosQ0FEZSxDQUFqQjtBQUdBOVosSUFBRSxXQUFGLEVBQWVzSyxTQUFmLENBQXlCZ1EsUUFBekI7O0FBRUF0YSxJQUFFLGdCQUFGLEVBQW9CQyxJQUFwQixDQUF5QixpRkFBaUZTLEVBQWpGLEdBQXNGLDhCQUEvRzs7QUFFQVYsSUFBRSxPQUFGLEVBQVdFLEVBQVgsQ0FBYyxPQUFkLEVBQXVCLFlBQVU7QUFDL0IsUUFBSUMsT0FBTztBQUNUNFosYUFBTy9aLEVBQUUsUUFBRixFQUFZSyxHQUFaLEVBREU7QUFFVHNELGVBQVMzRCxFQUFFLFVBQUYsRUFBY0ssR0FBZCxFQUZBO0FBR1RxRCxnQkFBVTFELEVBQUUsV0FBRixFQUFlSyxHQUFmLEVBSEQ7QUFJVDRELGVBQVNqRSxFQUFFLFVBQUYsRUFBY0ssR0FBZCxFQUpBO0FBS1RpRCxrQkFBWXRELEVBQUUsYUFBRixFQUFpQkssR0FBakIsRUFMSDtBQU1Ua2Esc0JBQWdCdmEsRUFBRSxnQkFBRixFQUFvQkssR0FBcEIsRUFOUDtBQU9UbWEsK0JBQXlCeGEsRUFBRSx5QkFBRixFQUE2QkssR0FBN0I7QUFQaEIsS0FBWDtBQVNBLFFBQUdMLEVBQUUsY0FBRixFQUFrQkssR0FBbEIsS0FBMEIsQ0FBN0IsRUFBK0I7QUFDN0JGLFdBQUtzYSxXQUFMLEdBQW1CemEsRUFBRSxjQUFGLEVBQWtCSyxHQUFsQixFQUFuQjtBQUNEO0FBQ0RGLFNBQUs2WixXQUFMLEdBQW1CaGEsRUFBRSxjQUFGLEVBQWtCSyxHQUFsQixFQUFuQjtBQUNBLFFBQUdMLEVBQUUsa0JBQUYsRUFBc0JLLEdBQXRCLEtBQThCLENBQWpDLEVBQW1DO0FBQ2pDRixXQUFLOFosZUFBTCxHQUF1QmphLEVBQUUsa0JBQUYsRUFBc0JLLEdBQXRCLEVBQXZCO0FBQ0QsS0FGRCxNQUVLO0FBQ0hGLFdBQUs4WixlQUFMLEdBQXVCLEVBQXZCO0FBQ0Q7QUFDRCxRQUFHamEsRUFBRSxZQUFGLEVBQWdCSyxHQUFoQixLQUF3QixDQUEzQixFQUE2QjtBQUMzQkYsV0FBS3VhLFNBQUwsR0FBaUIxYSxFQUFFLFlBQUYsRUFBZ0JLLEdBQWhCLEVBQWpCO0FBQ0QsS0FGRCxNQUVLO0FBQ0hGLFdBQUt1YSxTQUFMLEdBQWlCLEVBQWpCO0FBQ0Q7QUFDRCxRQUFHMWEsRUFBRSxxQkFBRixFQUF5QkssR0FBekIsS0FBaUMsQ0FBcEMsRUFBc0M7QUFDcENGLFdBQUt3YSxrQkFBTCxHQUEwQjNhLEVBQUUscUJBQUYsRUFBeUJLLEdBQXpCLEVBQTFCO0FBQ0QsS0FGRCxNQUVLO0FBQ0hGLFdBQUt3YSxrQkFBTCxHQUEwQixFQUExQjtBQUNEO0FBQ0QsUUFBSWphLEtBQUtWLEVBQUUsS0FBRixFQUFTSyxHQUFULEVBQVQ7QUFDQSxRQUFHSyxHQUFHRSxNQUFILElBQWEsQ0FBaEIsRUFBa0I7QUFDaEIsVUFBSUMsTUFBTSwyQkFBVjtBQUNELEtBRkQsTUFFSztBQUNILFVBQUlBLE1BQU0sNEJBQTRCSCxFQUF0QztBQUNEO0FBQ0RqQixjQUFVMkwsYUFBVixDQUF3QmpMLElBQXhCLEVBQThCVSxHQUE5QixFQUFtQyxzQkFBbkM7QUFDRCxHQXBDRDs7QUFzQ0FiLElBQUUsU0FBRixFQUFhRSxFQUFiLENBQWdCLE9BQWhCLEVBQXlCLFlBQVU7QUFDakMsUUFBSVcsTUFBTSw4QkFBVjtBQUNBLFFBQUlWLE9BQU87QUFDVE8sVUFBSVYsRUFBRSxLQUFGLEVBQVNLLEdBQVQ7QUFESyxLQUFYO0FBR0FaLGNBQVVpTSxlQUFWLENBQTBCdkwsSUFBMUIsRUFBZ0NVLEdBQWhDLEVBQXFDLHNCQUFyQztBQUNELEdBTkQ7O0FBUUFiLElBQUUsc0JBQUYsRUFBMEJFLEVBQTFCLENBQTZCLGlCQUE3QixFQUFnRDBPLFNBQWhEOztBQUVBQTs7QUFFQTVPLElBQUUsTUFBRixFQUFVRSxFQUFWLENBQWEsT0FBYixFQUFzQixZQUFVO0FBQzlCRixNQUFFLEtBQUYsRUFBU0ssR0FBVCxDQUFhLEVBQWI7QUFDQUwsTUFBRSxjQUFGLEVBQWtCSyxHQUFsQixDQUFzQkwsRUFBRSxjQUFGLEVBQWtCZ0wsSUFBbEIsQ0FBdUIsT0FBdkIsQ0FBdEI7QUFDQWhMLE1BQUUsU0FBRixFQUFhOEUsSUFBYjtBQUNBLFFBQUk4VixTQUFTNWEsRUFBRSxVQUFGLEVBQWNLLEdBQWQsRUFBYjtBQUNBcUosV0FBT0UsS0FBUCxDQUFhekgsR0FBYixDQUFpQixnQ0FBZ0N5WSxNQUFqRCxFQUNHalEsSUFESCxDQUNRLFVBQVM2TyxPQUFULEVBQWlCO0FBQ3JCLFVBQUlxQixZQUFZLEVBQWhCO0FBQ0E3YSxRQUFFZ1AsSUFBRixDQUFPd0ssUUFBUXJaLElBQWYsRUFBcUIsVUFBUzZXLEdBQVQsRUFBY25MLEtBQWQsRUFBb0I7QUFDdkNnUCxxQkFBYSxtQkFBbUJoUCxNQUFNbkwsRUFBekIsR0FBOEIsR0FBOUIsR0FBb0NtTCxNQUFNakosSUFBMUMsR0FBZ0QsV0FBN0Q7QUFDRCxPQUZEO0FBR0E1QyxRQUFFLGNBQUYsRUFBa0J5QyxJQUFsQixDQUF1QixRQUF2QixFQUFpQ3FZLE1BQWpDLEdBQTBDbE8sR0FBMUMsR0FBZ0QvSyxNQUFoRCxDQUF1RGdaLFNBQXZEO0FBQ0E3YSxRQUFFLGNBQUYsRUFBa0JLLEdBQWxCLENBQXNCb2EsV0FBdEI7QUFDQXphLFFBQUUsc0JBQUYsRUFBMEJzTCxLQUExQixDQUFnQyxNQUFoQztBQUNELEtBVEg7QUFVRCxHQWZEOztBQWlCQXRMLElBQUUsUUFBRixFQUFZRSxFQUFaLENBQWUsT0FBZixFQUF3QixPQUF4QixFQUFpQyxZQUFVO0FBQ3pDLFFBQUlRLEtBQUtWLEVBQUUsSUFBRixFQUFRRyxJQUFSLENBQWEsSUFBYixDQUFUO0FBQ0EsUUFBSVUsTUFBTSw0QkFBNEJILEVBQXRDO0FBQ0FnSixXQUFPRSxLQUFQLENBQWF6SCxHQUFiLENBQWlCdEIsR0FBakIsRUFDRzhKLElBREgsQ0FDUSxVQUFTNk8sT0FBVCxFQUFpQjtBQUNyQnhaLFFBQUUsS0FBRixFQUFTSyxHQUFULENBQWFtWixRQUFRclosSUFBUixDQUFhTyxFQUExQjtBQUNBVixRQUFFLFdBQUYsRUFBZUssR0FBZixDQUFtQm1aLFFBQVFyWixJQUFSLENBQWF1RCxRQUFoQztBQUNBMUQsUUFBRSxVQUFGLEVBQWNLLEdBQWQsQ0FBa0JtWixRQUFRclosSUFBUixDQUFhOEQsT0FBL0I7QUFDQWpFLFFBQUUsUUFBRixFQUFZSyxHQUFaLENBQWdCbVosUUFBUXJaLElBQVIsQ0FBYTRaLEtBQTdCO0FBQ0EvWixRQUFFLHVCQUFGLEVBQTJCSyxHQUEzQixDQUErQm1aLFFBQVFyWixJQUFSLENBQWE0YSxvQkFBNUM7QUFDQS9hLFFBQUUsY0FBRixFQUFrQkssR0FBbEIsQ0FBc0JMLEVBQUUsY0FBRixFQUFrQmdMLElBQWxCLENBQXVCLE9BQXZCLENBQXRCO0FBQ0FoTCxRQUFFLGNBQUYsRUFBa0JLLEdBQWxCLENBQXNCbVosUUFBUXJaLElBQVIsQ0FBYTZaLFdBQW5DO0FBQ0FoYSxRQUFFLGtCQUFGLEVBQXNCSyxHQUF0QixDQUEwQm1aLFFBQVFyWixJQUFSLENBQWE4WixlQUF2QztBQUNBamEsUUFBRSxzQkFBRixFQUEwQkMsSUFBMUIsQ0FBK0IsZ0JBQWdCdVosUUFBUXJaLElBQVIsQ0FBYThaLGVBQTdCLEdBQStDLElBQS9DLEdBQXNEN1UsS0FBSzRWLFlBQUwsQ0FBa0J4QixRQUFRclosSUFBUixDQUFhK1osaUJBQS9CLEVBQWtELEVBQWxELENBQXJGO0FBQ0FsYSxRQUFFLFlBQUYsRUFBZ0JLLEdBQWhCLENBQW9CbVosUUFBUXJaLElBQVIsQ0FBYXVhLFNBQWpDO0FBQ0ExYSxRQUFFLGdCQUFGLEVBQW9CQyxJQUFwQixDQUF5QixnQkFBZ0J1WixRQUFRclosSUFBUixDQUFhdWEsU0FBN0IsR0FBeUMsSUFBekMsR0FBZ0R0VixLQUFLNFYsWUFBTCxDQUFrQnhCLFFBQVFyWixJQUFSLENBQWE4YSxjQUEvQixFQUErQyxFQUEvQyxDQUF6RTtBQUNBeGIsZ0JBQVVtTSxtQkFBVixDQUE4QixXQUE5QixFQUEyQzROLFFBQVFyWixJQUFSLENBQWFvYSxjQUF4RDtBQUNBdmEsUUFBRSxxQkFBRixFQUF5QkssR0FBekIsQ0FBNkJtWixRQUFRclosSUFBUixDQUFhd2Esa0JBQTFDO0FBQ0EzYSxRQUFFLHlCQUFGLEVBQTZCQyxJQUE3QixDQUFrQyxnQkFBZ0J1WixRQUFRclosSUFBUixDQUFhd2Esa0JBQTdCLEdBQWtELElBQWxELEdBQXlEdlYsS0FBSzRWLFlBQUwsQ0FBa0J4QixRQUFRclosSUFBUixDQUFhK2EsZ0JBQS9CLEVBQWlELEVBQWpELENBQTNGO0FBQ0F6YixnQkFBVW1NLG1CQUFWLENBQThCLG9CQUE5QixFQUFvRDROLFFBQVFyWixJQUFSLENBQWFxYSx1QkFBakU7QUFDQXhhLFFBQUUsU0FBRixFQUFhNkUsSUFBYjs7QUFFQSxVQUFJNFYsY0FBY2pCLFFBQVFyWixJQUFSLENBQWFzYSxXQUEvQjs7QUFFQTtBQUNBLFVBQUlHLFNBQVM1YSxFQUFFLFVBQUYsRUFBY0ssR0FBZCxFQUFiO0FBQ0FxSixhQUFPRSxLQUFQLENBQWF6SCxHQUFiLENBQWlCLGdDQUFnQ3lZLE1BQWpELEVBQ0dqUSxJQURILENBQ1EsVUFBUzZPLE9BQVQsRUFBaUI7QUFDckIsWUFBSXFCLFlBQVksRUFBaEI7QUFDQTdhLFVBQUVnUCxJQUFGLENBQU93SyxRQUFRclosSUFBZixFQUFxQixVQUFTNlcsR0FBVCxFQUFjbkwsS0FBZCxFQUFvQjtBQUN2Q2dQLHVCQUFhLG1CQUFtQmhQLE1BQU1uTCxFQUF6QixHQUE4QixHQUE5QixHQUFvQ21MLE1BQU1qSixJQUExQyxHQUFnRCxXQUE3RDtBQUNELFNBRkQ7QUFHQTVDLFVBQUUsY0FBRixFQUFrQnlDLElBQWxCLENBQXVCLFFBQXZCLEVBQWlDcVksTUFBakMsR0FBMENsTyxHQUExQyxHQUFnRC9LLE1BQWhELENBQXVEZ1osU0FBdkQ7QUFDQTdhLFVBQUUsY0FBRixFQUFrQkssR0FBbEIsQ0FBc0JvYSxXQUF0QjtBQUNBemEsVUFBRSxzQkFBRixFQUEwQnNMLEtBQTFCLENBQWdDLE1BQWhDO0FBQ0QsT0FUSCxFQVVHSixLQVZILENBVVMsVUFBU2IsS0FBVCxFQUFlO0FBQ3BCakYsYUFBSytGLFdBQUwsQ0FBaUIsb0JBQWpCLEVBQXVDLEVBQXZDLEVBQTJDZCxLQUEzQztBQUNELE9BWkg7QUFhRCxLQXBDSCxFQXFDR2EsS0FyQ0gsQ0FxQ1MsVUFBU2IsS0FBVCxFQUFlO0FBQ3BCakYsV0FBSytGLFdBQUwsQ0FBaUIsc0JBQWpCLEVBQXlDLEVBQXpDLEVBQTZDZCxLQUE3QztBQUNELEtBdkNIO0FBeUNELEdBNUNEOztBQThDQTVLLFlBQVVnRSxnQkFBVixDQUEyQixpQkFBM0IsRUFBOEMsaUNBQTlDOztBQUVBaEUsWUFBVWtNLG9CQUFWLENBQStCLFdBQS9CLEVBQTRDLHFCQUE1Qzs7QUFFQSxNQUFJckksYUFBYXRELEVBQUUsYUFBRixFQUFpQkssR0FBakIsRUFBakI7QUFDQVosWUFBVWtNLG9CQUFWLENBQStCLG9CQUEvQixFQUFxRCwyQ0FBMkNySSxVQUFoRztBQUNELENBeExEOztBQTBMQSxJQUFJc0wsWUFBWSxTQUFaQSxTQUFZLEdBQVU7QUFDeEJ4SixPQUFLeUYsZUFBTDtBQUNBN0ssSUFBRSxLQUFGLEVBQVNLLEdBQVQsQ0FBYSxFQUFiO0FBQ0FMLElBQUUsV0FBRixFQUFlSyxHQUFmLENBQW1CLEVBQW5CO0FBQ0FMLElBQUUsV0FBRixFQUFlSyxHQUFmLENBQW1CLEVBQW5CO0FBQ0FMLElBQUUsVUFBRixFQUFjSyxHQUFkLENBQWtCLEVBQWxCO0FBQ0FMLElBQUUsUUFBRixFQUFZSyxHQUFaLENBQWdCLEVBQWhCO0FBQ0FMLElBQUUsdUJBQUYsRUFBMkJLLEdBQTNCLENBQStCLEVBQS9CO0FBQ0FMLElBQUUsY0FBRixFQUFrQkssR0FBbEIsQ0FBc0JMLEVBQUUsY0FBRixFQUFrQmdMLElBQWxCLENBQXVCLE9BQXZCLENBQXRCO0FBQ0FoTCxJQUFFLGNBQUYsRUFBa0JLLEdBQWxCLENBQXNCLEVBQXRCO0FBQ0FMLElBQUUsa0JBQUYsRUFBc0JLLEdBQXRCLENBQTBCLElBQTFCO0FBQ0FMLElBQUUsc0JBQUYsRUFBMEJLLEdBQTFCLENBQThCLEVBQTlCO0FBQ0FMLElBQUUsc0JBQUYsRUFBMEJDLElBQTFCLENBQStCLGVBQS9CO0FBQ0FELElBQUUsWUFBRixFQUFnQkssR0FBaEIsQ0FBb0IsSUFBcEI7QUFDQUwsSUFBRSxnQkFBRixFQUFvQkssR0FBcEIsQ0FBd0IsRUFBeEI7QUFDQUwsSUFBRSxnQkFBRixFQUFvQkMsSUFBcEIsQ0FBeUIsZUFBekI7QUFDQUQsSUFBRSxxQkFBRixFQUF5QkssR0FBekIsQ0FBNkIsSUFBN0I7QUFDQUwsSUFBRSx5QkFBRixFQUE2QkssR0FBN0IsQ0FBaUMsRUFBakM7QUFDQUwsSUFBRSx5QkFBRixFQUE2QkMsSUFBN0IsQ0FBa0MsZUFBbEM7QUFDQVIsWUFBVW1NLG1CQUFWLENBQThCLFdBQTlCLEVBQTJDLENBQTNDO0FBQ0FuTSxZQUFVbU0sbUJBQVYsQ0FBOEIsb0JBQTlCLEVBQW9ELENBQXBEO0FBQ0QsQ0FyQkQsQzs7Ozs7Ozs7QUM3TEEsNkNBQUl4RyxPQUFPLG1CQUFBMUYsQ0FBUSxDQUFSLENBQVg7QUFDQWdLLE9BQU9vTCxHQUFQLEdBQWEsbUJBQUFwVixDQUFRLEVBQVIsQ0FBYjtBQUNBLElBQUl5YixZQUFZLG1CQUFBemIsQ0FBUSxHQUFSLENBQWhCOztBQUVBQyxRQUFRQyxJQUFSLEdBQWUsWUFBVTs7QUFFdkI4SixTQUFPa00sRUFBUCxHQUFZLElBQUlkLEdBQUosQ0FBUTtBQUNwQmUsUUFBSSxZQURnQjtBQUVwQjFWLFVBQU07QUFDRmliLGlCQUFXLEVBRFQ7QUFFRlYsaUJBQVcsQ0FBQyxDQUZWO0FBR0ZXLHFCQUFlLEVBSGI7QUFJRkMsaUJBQVc7QUFKVCxLQUZjO0FBUWxCdEYsYUFBUztBQUNQdUYsb0JBQWNBLFlBRFA7QUFFUEMsb0JBQWNBLFlBRlA7QUFHUEMsc0JBQWdCQSxjQUhUO0FBSVBDLG9CQUFjQSxZQUpQO0FBS1BDLGtCQUFZQSxVQUxMO0FBTVBDLGtCQUFZQSxVQU5MO0FBT1BDLG1CQUFhQSxXQVBOO0FBUVBDLG1CQUFhQTtBQVJOLEtBUlM7QUFrQmxCQyxnQkFBWTtBQUNWWjtBQURVO0FBbEJNLEdBQVIsQ0FBWjs7QUF1QkFhOztBQUVBaGMsSUFBRSxRQUFGLEVBQVlFLEVBQVosQ0FBZSxPQUFmLEVBQXdCOGIsUUFBeEI7QUFDQWhjLElBQUUsVUFBRixFQUFjRSxFQUFkLENBQWlCLE9BQWpCLEVBQTBCK2IsV0FBMUI7QUFDQWpjLElBQUUsYUFBRixFQUFpQkUsRUFBakIsQ0FBb0IsT0FBcEIsRUFBNkJnYyxTQUE3Qjs7QUFFQWxjLElBQUUsYUFBRixFQUFpQkUsRUFBakIsQ0FBb0IsT0FBcEIsRUFBNkJpYyxVQUE3QjtBQUNBbmMsSUFBRSxlQUFGLEVBQW1CRSxFQUFuQixDQUFzQixPQUF0QixFQUErQmtjLFlBQS9COztBQUVBaFgsT0FBSzNCLGdCQUFMLENBQXNCLGlCQUF0QixFQUF5QyxpQ0FBekM7O0FBRUEyQixPQUFLdUcsb0JBQUwsQ0FBMEIsV0FBMUIsRUFBdUMscUJBQXZDOztBQUVBLE1BQUlySSxhQUFhdEQsRUFBRSxhQUFGLEVBQWlCSyxHQUFqQixFQUFqQjtBQUNBK0UsT0FBS3VHLG9CQUFMLENBQTBCLG9CQUExQixFQUFnRCwyQ0FBMkNySSxVQUEzRjtBQUNELENBeENEOztBQTBDQTs7Ozs7OztBQU9BLElBQUlzVSxlQUFlLFNBQWZBLFlBQWUsQ0FBUzBCLENBQVQsRUFBWUMsQ0FBWixFQUFjO0FBQ2hDLE1BQUdELEVBQUU1VixRQUFGLElBQWM2VixFQUFFN1YsUUFBbkIsRUFBNEI7QUFDM0IsV0FBUTRWLEVBQUU1WSxFQUFGLEdBQU82WSxFQUFFN1ksRUFBVCxHQUFjLENBQUMsQ0FBZixHQUFtQixDQUEzQjtBQUNBO0FBQ0QsU0FBUTRZLEVBQUU1VixRQUFGLEdBQWE2VixFQUFFN1YsUUFBZixHQUEwQixDQUFDLENBQTNCLEdBQStCLENBQXZDO0FBQ0EsQ0FMRDs7QUFPQSxJQUFJc1ksV0FBVyxTQUFYQSxRQUFXLEdBQVU7QUFDdkIsTUFBSXRiLEtBQUtWLEVBQUUsS0FBRixFQUFTSyxHQUFULEVBQVQ7QUFDQXFKLFNBQU9FLEtBQVAsQ0FBYXpILEdBQWIsQ0FBaUIsMkJBQTJCekIsRUFBNUMsRUFDQ2lLLElBREQsQ0FDTSxVQUFTQyxRQUFULEVBQWtCO0FBQ3RCbEIsV0FBT2tNLEVBQVAsQ0FBVXdGLFNBQVYsR0FBc0J4USxTQUFTekssSUFBL0I7QUFDQXVKLFdBQU9rTSxFQUFQLENBQVV3RixTQUFWLENBQW9CekQsSUFBcEIsQ0FBeUJDLFlBQXpCO0FBQ0E1WCxNQUFFZ0MsU0FBU3FhLGVBQVgsRUFBNEIsQ0FBNUIsRUFBK0JDLEtBQS9CLENBQXFDQyxXQUFyQyxDQUFpRCxVQUFqRCxFQUE2RDdTLE9BQU9rTSxFQUFQLENBQVV3RixTQUFWLENBQW9CeGEsTUFBakY7QUFDQThJLFdBQU9FLEtBQVAsQ0FBYXpILEdBQWIsQ0FBaUIsc0JBQXNCekIsRUFBdkMsRUFDQ2lLLElBREQsQ0FDTSxVQUFTQyxRQUFULEVBQWtCO0FBQ3RCNUssUUFBRWdQLElBQUYsQ0FBT3BFLFNBQVN6SyxJQUFoQixFQUFzQixVQUFTbVQsS0FBVCxFQUFnQnpILEtBQWhCLEVBQXNCO0FBQzFDLFlBQUkvSCxXQUFXNEYsT0FBT2tNLEVBQVAsQ0FBVXdGLFNBQVYsQ0FBb0IzWSxJQUFwQixDQUF5QixVQUFTNEksT0FBVCxFQUFpQjtBQUN2RCxpQkFBT0EsUUFBUTNLLEVBQVIsSUFBY21MLE1BQU00TyxXQUEzQjtBQUNELFNBRmMsQ0FBZjtBQUdBLFlBQUc1TyxNQUFNa1Asb0JBQU4sSUFBOEIsQ0FBakMsRUFBbUM7QUFDakNsUCxnQkFBTTJRLE1BQU4sR0FBZSxJQUFmO0FBQ0QsU0FGRCxNQUVLO0FBQ0gzUSxnQkFBTTJRLE1BQU4sR0FBZSxLQUFmO0FBQ0Q7QUFDRCxZQUFHM1EsTUFBTThPLGtCQUFOLElBQTRCLENBQS9CLEVBQWlDO0FBQy9COU8sZ0JBQU00USxRQUFOLEdBQWlCLEtBQWpCO0FBQ0QsU0FGRCxNQUVLO0FBQ0g1USxnQkFBTTRRLFFBQU4sR0FBaUIsSUFBakI7QUFDRDtBQUNEM1ksaUJBQVM0WSxPQUFULENBQWlCckUsSUFBakIsQ0FBc0J4TSxLQUF0QjtBQUNELE9BZkQ7QUFnQkE3TCxRQUFFZ1AsSUFBRixDQUFPdEYsT0FBT2tNLEVBQVAsQ0FBVXdGLFNBQWpCLEVBQTRCLFVBQVM5SCxLQUFULEVBQWdCekgsS0FBaEIsRUFBc0I7QUFDaERBLGNBQU02USxPQUFOLENBQWMvRSxJQUFkLENBQW1CQyxZQUFuQjtBQUNELE9BRkQ7QUFHRCxLQXJCRCxFQXNCQzFNLEtBdEJELENBc0JPLFVBQVNiLEtBQVQsRUFBZTtBQUNwQmpGLFdBQUsrRixXQUFMLENBQWlCLFVBQWpCLEVBQTZCLEVBQTdCLEVBQWlDZCxLQUFqQztBQUNELEtBeEJEO0FBeUJELEdBOUJELEVBK0JDYSxLQS9CRCxDQStCTyxVQUFTYixLQUFULEVBQWU7QUFDcEJqRixTQUFLK0YsV0FBTCxDQUFpQixVQUFqQixFQUE2QixFQUE3QixFQUFpQ2QsS0FBakM7QUFDRCxHQWpDRDtBQWtDRCxDQXBDRDs7QUFzQ0EsSUFBSWtSLGVBQWUsU0FBZkEsWUFBZSxDQUFTaFosS0FBVCxFQUFlO0FBQ2hDLE1BQUlvYSxRQUFRM2MsRUFBRXVDLE1BQU1nVSxhQUFSLEVBQXVCcFcsSUFBdkIsQ0FBNEIsSUFBNUIsQ0FBWjtBQUNBSCxJQUFFLG9CQUFvQjJjLEtBQXRCLEVBQTZCOVgsSUFBN0I7QUFDQTdFLElBQUUsb0JBQW9CMmMsS0FBdEIsRUFBNkI3WCxJQUE3QjtBQUNELENBSkQ7O0FBTUEsSUFBSTBXLGVBQWUsU0FBZkEsWUFBZSxDQUFTalosS0FBVCxFQUFlO0FBQ2hDLE1BQUk3QixLQUFLVixFQUFFLEtBQUYsRUFBU0ssR0FBVCxFQUFUO0FBQ0EsTUFBSXNjLFFBQVEzYyxFQUFFdUMsTUFBTWdVLGFBQVIsRUFBdUJwVyxJQUF2QixDQUE0QixJQUE1QixDQUFaO0FBQ0EsTUFBSUEsT0FBTztBQUNUTyxRQUFJaWMsS0FESztBQUVUL1osVUFBTTVDLEVBQUUsZUFBZTJjLEtBQWpCLEVBQXdCdGMsR0FBeEI7QUFGRyxHQUFYO0FBSUFxSixTQUFPRSxLQUFQLENBQWFjLElBQWIsQ0FBa0IsMkJBQTJCaEssRUFBM0IsR0FBZ0MsT0FBbEQsRUFBMkRQLElBQTNELEVBQ0d3SyxJQURILENBQ1EsVUFBU0MsUUFBVCxFQUFrQjtBQUN0QjVLLE1BQUUsb0JBQW9CMmMsS0FBdEIsRUFBNkI3WCxJQUE3QjtBQUNBOUUsTUFBRSxvQkFBb0IyYyxLQUF0QixFQUE2QjlYLElBQTdCO0FBQ0E7QUFDRCxHQUxILEVBTUdxRyxLQU5ILENBTVMsVUFBU2IsS0FBVCxFQUFlO0FBQ3BCakYsU0FBSzZGLGNBQUwsQ0FBb0IsWUFBcEIsRUFBa0MsUUFBbEM7QUFDRCxHQVJIO0FBU0QsQ0FoQkQ7O0FBa0JBLElBQUl3USxpQkFBaUIsU0FBakJBLGNBQWlCLENBQVNsWixLQUFULEVBQWU7QUFDbEMsTUFBSWdCLFNBQVNDLFFBQVEsZUFBUixDQUFiO0FBQ0UsTUFBR0QsV0FBVyxJQUFkLEVBQW1CO0FBQ25CLFFBQUk3QyxLQUFLVixFQUFFLEtBQUYsRUFBU0ssR0FBVCxFQUFUO0FBQ0EsUUFBSXNjLFFBQVEzYyxFQUFFdUMsTUFBTWdVLGFBQVIsRUFBdUJwVyxJQUF2QixDQUE0QixJQUE1QixDQUFaO0FBQ0EsUUFBSUEsT0FBTztBQUNUTyxVQUFJaWM7QUFESyxLQUFYO0FBR0FqVCxXQUFPRSxLQUFQLENBQWFjLElBQWIsQ0FBa0IsMkJBQTJCaEssRUFBM0IsR0FBZ0MsU0FBbEQsRUFBNkRQLElBQTdELEVBQ0d3SyxJQURILENBQ1EsVUFBU0MsUUFBVCxFQUFrQjtBQUN0QixXQUFJLElBQUl3TixJQUFJLENBQVosRUFBZUEsSUFBSTFPLE9BQU9rTSxFQUFQLENBQVV3RixTQUFWLENBQW9CeGEsTUFBdkMsRUFBK0N3WCxHQUEvQyxFQUFtRDtBQUNqRCxZQUFHMU8sT0FBT2tNLEVBQVAsQ0FBVXdGLFNBQVYsQ0FBb0JoRCxDQUFwQixFQUF1QjFYLEVBQXZCLElBQTZCaWMsS0FBaEMsRUFBc0M7QUFDcENqVCxpQkFBT2tNLEVBQVAsQ0FBVXdGLFNBQVYsQ0FBb0IzQyxNQUFwQixDQUEyQkwsQ0FBM0IsRUFBOEIsQ0FBOUI7QUFDQTtBQUNEO0FBQ0Y7QUFDRDtBQUNELEtBVEgsRUFVR2xOLEtBVkgsQ0FVUyxVQUFTYixLQUFULEVBQWU7QUFDcEJqRixXQUFLNkYsY0FBTCxDQUFvQixZQUFwQixFQUFrQyxRQUFsQztBQUNELEtBWkg7QUFhRDtBQUNGLENBdEJEOztBQXdCQSxJQUFJZ1IsY0FBYyxTQUFkQSxXQUFjLEdBQVU7QUFDMUIsTUFBSXZiLEtBQUtWLEVBQUUsS0FBRixFQUFTSyxHQUFULEVBQVQ7QUFDQSxNQUFJRixPQUFPLEVBQVg7QUFFQXVKLFNBQU9FLEtBQVAsQ0FBYWMsSUFBYixDQUFrQiwyQkFBMkJoSyxFQUEzQixHQUFnQyxNQUFsRCxFQUEwRFAsSUFBMUQsRUFDR3dLLElBREgsQ0FDUSxVQUFTQyxRQUFULEVBQWtCO0FBQ3RCbEIsV0FBT2tNLEVBQVAsQ0FBVXdGLFNBQVYsQ0FBb0IvQyxJQUFwQixDQUF5QnpOLFNBQVN6SyxJQUFsQztBQUNBO0FBQ0FILE1BQUVnQyxTQUFTcWEsZUFBWCxFQUE0QixDQUE1QixFQUErQkMsS0FBL0IsQ0FBcUNDLFdBQXJDLENBQWlELFVBQWpELEVBQTZEN1MsT0FBT2tNLEVBQVAsQ0FBVXdGLFNBQVYsQ0FBb0J4YSxNQUFqRjtBQUNBO0FBQ0QsR0FOSCxFQU9Hc0ssS0FQSCxDQU9TLFVBQVNiLEtBQVQsRUFBZTtBQUNwQmpGLFNBQUs2RixjQUFMLENBQW9CLFlBQXBCLEVBQWtDLFFBQWxDO0FBQ0QsR0FUSDtBQVVELENBZEQ7O0FBZ0JBLElBQUl5USxlQUFlLFNBQWZBLFlBQWUsQ0FBU25aLEtBQVQsRUFBZTtBQUNoQyxNQUFJbUIsV0FBVyxFQUFmO0FBQ0ExRCxJQUFFZ1AsSUFBRixDQUFPdEYsT0FBT2tNLEVBQVAsQ0FBVXdGLFNBQWpCLEVBQTRCLFVBQVM5SCxLQUFULEVBQWdCekgsS0FBaEIsRUFBc0I7QUFDaERuSSxhQUFTMlUsSUFBVCxDQUFjO0FBQ1ozWCxVQUFJbUwsTUFBTW5MO0FBREUsS0FBZDtBQUdELEdBSkQ7QUFLQSxNQUFJUCxPQUFPO0FBQ1R1RCxjQUFVQTtBQURELEdBQVg7QUFHQSxNQUFJaEQsS0FBS1YsRUFBRSxLQUFGLEVBQVNLLEdBQVQsRUFBVDtBQUNBcUosU0FBT0UsS0FBUCxDQUFhYyxJQUFiLENBQWtCLDJCQUEyQmhLLEVBQTNCLEdBQWdDLE9BQWxELEVBQTJEUCxJQUEzRCxFQUNHd0ssSUFESCxDQUNRLFVBQVNDLFFBQVQsRUFBa0I7QUFDdEI7QUFDRCxHQUhILEVBSUdNLEtBSkgsQ0FJUyxVQUFTYixLQUFULEVBQWU7QUFDcEJqRixTQUFLNkYsY0FBTCxDQUFvQixZQUFwQixFQUFrQyxRQUFsQztBQUNELEdBTkg7QUFPRCxDQWxCRDs7QUFvQkEsSUFBSTBRLGFBQWEsU0FBYkEsVUFBYSxDQUFTcFosS0FBVCxFQUFlO0FBQzlCLE1BQUltQixXQUFXLEVBQWY7QUFDQSxNQUFJa1osYUFBYTVjLEVBQUV1QyxNQUFNc2EsRUFBUixFQUFZMWMsSUFBWixDQUFpQixJQUFqQixDQUFqQjtBQUNBSCxJQUFFZ1AsSUFBRixDQUFPdEYsT0FBT2tNLEVBQVAsQ0FBVXdGLFNBQVYsQ0FBb0J3QixVQUFwQixFQUFnQ0YsT0FBdkMsRUFBZ0QsVUFBU3BKLEtBQVQsRUFBZ0J6SCxLQUFoQixFQUFzQjtBQUNwRW5JLGFBQVMyVSxJQUFULENBQWM7QUFDWjNYLFVBQUltTCxNQUFNbkw7QUFERSxLQUFkO0FBR0QsR0FKRDtBQUtBLE1BQUlQLE9BQU87QUFDVHNhLGlCQUFhL1EsT0FBT2tNLEVBQVAsQ0FBVXdGLFNBQVYsQ0FBb0J3QixVQUFwQixFQUFnQ2xjLEVBRHBDO0FBRVRnYSxlQUFXMWEsRUFBRXVDLE1BQU11YSxJQUFSLEVBQWMzYyxJQUFkLENBQW1CLElBQW5CLENBRkY7QUFHVHVELGNBQVVBO0FBSEQsR0FBWDtBQUtBLE1BQUloRCxLQUFLVixFQUFFLEtBQUYsRUFBU0ssR0FBVCxFQUFUO0FBQ0FxSixTQUFPRSxLQUFQLENBQWFjLElBQWIsQ0FBa0Isc0JBQXNCaEssRUFBdEIsR0FBMkIsT0FBN0MsRUFBc0RQLElBQXRELEVBQ0d3SyxJQURILENBQ1EsVUFBU0MsUUFBVCxFQUFrQjtBQUN0QjtBQUNELEdBSEgsRUFJR00sS0FKSCxDQUlTLFVBQVNiLEtBQVQsRUFBZTtBQUNwQmpGLFNBQUs2RixjQUFMLENBQW9CLFlBQXBCLEVBQWtDLFFBQWxDO0FBQ0QsR0FOSDtBQU9ELENBckJEOztBQXVCQSxJQUFJMlEsYUFBYSxTQUFiQSxVQUFhLENBQVNyWixLQUFULEVBQWU7QUFDOUI2QyxPQUFLeUYsZUFBTDtBQUNBLE1BQUlrUyxjQUFjL2MsRUFBRXVDLE1BQU1nVSxhQUFSLEVBQXVCcFcsSUFBdkIsQ0FBNEIsSUFBNUIsQ0FBbEI7QUFDQSxNQUFJNmMsV0FBV2hkLEVBQUV1QyxNQUFNZ1UsYUFBUixFQUF1QnBXLElBQXZCLENBQTRCLEtBQTVCLENBQWY7QUFDQSxNQUFJOGMsU0FBU3ZULE9BQU9rTSxFQUFQLENBQVV3RixTQUFWLENBQW9CNEIsUUFBcEIsRUFBOEJOLE9BQTlCLENBQXNDSyxXQUF0QyxDQUFiO0FBQ0EvYyxJQUFFLGNBQUYsRUFBa0JLLEdBQWxCLENBQXNCNGMsT0FBT3JhLElBQTdCO0FBQ0E1QyxJQUFFLFVBQUYsRUFBY0ssR0FBZCxDQUFrQjRjLE9BQU9oWixPQUF6QjtBQUNBakUsSUFBRSxRQUFGLEVBQVlLLEdBQVosQ0FBZ0I0YyxPQUFPbEQsS0FBdkI7QUFDQS9aLElBQUUscUJBQUYsRUFBeUJLLEdBQXpCLENBQTZCNGMsT0FBT3ZjLEVBQXBDO0FBQ0FWLElBQUUsbUJBQUYsRUFBdUJLLEdBQXZCLENBQTJCNGMsT0FBT2hELGVBQWxDO0FBQ0FqYSxJQUFFLHNCQUFGLEVBQTBCSyxHQUExQixDQUE4QixFQUE5QjtBQUNBTCxJQUFFLHNCQUFGLEVBQTBCQyxJQUExQixDQUErQixnQkFBZ0JnZCxPQUFPaEQsZUFBdkIsR0FBeUMsSUFBekMsR0FBZ0Q3VSxLQUFLNFYsWUFBTCxDQUFrQmlDLE9BQU8vQyxpQkFBekIsRUFBNEMsRUFBNUMsQ0FBL0U7QUFDQWxhLElBQUUsWUFBRixFQUFnQkssR0FBaEIsQ0FBb0I0YyxPQUFPdkMsU0FBM0I7QUFDQTFhLElBQUUsZ0JBQUYsRUFBb0JLLEdBQXBCLENBQXdCLEVBQXhCO0FBQ0FMLElBQUUsZ0JBQUYsRUFBb0JDLElBQXBCLENBQXlCLGdCQUFnQmdkLE9BQU92QyxTQUF2QixHQUFtQyxJQUFuQyxHQUEwQ3RWLEtBQUs0VixZQUFMLENBQWtCaUMsT0FBT2pELFdBQXpCLEVBQXNDLEVBQXRDLENBQW5FO0FBQ0E1VSxPQUFLd0csbUJBQUwsQ0FBeUIsV0FBekIsRUFBc0NxUixPQUFPMUMsY0FBN0M7QUFDQXZhLElBQUUscUJBQUYsRUFBeUJLLEdBQXpCLENBQTZCNGMsT0FBT3RDLGtCQUFwQztBQUNBM2EsSUFBRSx5QkFBRixFQUE2QkssR0FBN0IsQ0FBaUMsRUFBakM7QUFDQUwsSUFBRSx5QkFBRixFQUE2QkMsSUFBN0IsQ0FBa0MsZ0JBQWdCZ2QsT0FBT3RDLGtCQUF2QixHQUE0QyxJQUE1QyxHQUFtRHZWLEtBQUs0VixZQUFMLENBQWtCaUMsT0FBT0Msb0JBQXpCLEVBQStDLEVBQS9DLENBQXJGO0FBQ0E5WCxPQUFLd0csbUJBQUwsQ0FBeUIsb0JBQXpCLEVBQStDcVIsT0FBT3pDLHVCQUF0RDtBQUNBLE1BQUd5QyxPQUFPbEMsb0JBQVAsSUFBK0IsQ0FBbEMsRUFBb0M7QUFDbEMvYSxNQUFFLGNBQUYsRUFBa0I0RSxJQUFsQixDQUF1QixVQUF2QixFQUFtQyxLQUFuQztBQUNBNUUsTUFBRSxVQUFGLEVBQWM0RSxJQUFkLENBQW1CLFVBQW5CLEVBQStCLEtBQS9CO0FBQ0E1RSxNQUFFLHNCQUFGLEVBQTBCNEUsSUFBMUIsQ0FBK0IsVUFBL0IsRUFBMkMsS0FBM0M7QUFDQTVFLE1BQUUsZUFBRixFQUFtQjZFLElBQW5CO0FBQ0QsR0FMRCxNQUtLO0FBQ0gsUUFBR29ZLE9BQU9oRCxlQUFQLElBQTBCLENBQTdCLEVBQStCO0FBQzdCamEsUUFBRSxjQUFGLEVBQWtCNEUsSUFBbEIsQ0FBdUIsVUFBdkIsRUFBbUMsSUFBbkM7QUFDRCxLQUZELE1BRUs7QUFDSDVFLFFBQUUsY0FBRixFQUFrQjRFLElBQWxCLENBQXVCLFVBQXZCLEVBQW1DLEtBQW5DO0FBQ0Q7QUFDRDVFLE1BQUUsVUFBRixFQUFjNEUsSUFBZCxDQUFtQixVQUFuQixFQUErQixJQUEvQjtBQUNBNUUsTUFBRSxzQkFBRixFQUEwQjRFLElBQTFCLENBQStCLFVBQS9CLEVBQTJDLElBQTNDO0FBQ0E1RSxNQUFFLGVBQUYsRUFBbUI4RSxJQUFuQjtBQUNEOztBQUVEOUUsSUFBRSxhQUFGLEVBQWlCc0wsS0FBakIsQ0FBdUIsTUFBdkI7QUFDRCxDQXJDRDs7QUF1Q0EsSUFBSTZRLGFBQWEsU0FBYkEsVUFBYSxHQUFVO0FBQ3pCbmMsSUFBRSxPQUFGLEVBQVd5SyxXQUFYLENBQXVCLFdBQXZCO0FBQ0EsTUFBSS9KLEtBQUtWLEVBQUUsS0FBRixFQUFTSyxHQUFULEVBQVQ7QUFDQSxNQUFJOGMscUJBQXFCbmQsRUFBRSxxQkFBRixFQUF5QkssR0FBekIsRUFBekI7QUFDQSxNQUFJRixPQUFPO0FBQ1Q0WixXQUFPL1osRUFBRSxRQUFGLEVBQVlLLEdBQVosRUFERTtBQUVUa2Esb0JBQWdCdmEsRUFBRSxnQkFBRixFQUFvQkssR0FBcEIsRUFGUDtBQUdUbWEsNkJBQXlCeGEsRUFBRSx5QkFBRixFQUE2QkssR0FBN0I7QUFIaEIsR0FBWDtBQUtBLE1BQUdMLEVBQUUsWUFBRixFQUFnQkssR0FBaEIsS0FBd0IsQ0FBM0IsRUFBNkI7QUFDM0JGLFNBQUt1YSxTQUFMLEdBQWlCMWEsRUFBRSxZQUFGLEVBQWdCSyxHQUFoQixFQUFqQjtBQUNELEdBRkQsTUFFSztBQUNIRixTQUFLdWEsU0FBTCxHQUFpQixFQUFqQjtBQUNEO0FBQ0QsTUFBRzFhLEVBQUUscUJBQUYsRUFBeUJLLEdBQXpCLEtBQWlDLENBQXBDLEVBQXNDO0FBQ3BDRixTQUFLd2Esa0JBQUwsR0FBMEIzYSxFQUFFLHFCQUFGLEVBQXlCSyxHQUF6QixFQUExQjtBQUNELEdBRkQsTUFFSztBQUNIRixTQUFLd2Esa0JBQUwsR0FBMEIsRUFBMUI7QUFDRDtBQUNELE1BQUczYSxFQUFFLHFCQUFGLEVBQXlCSyxHQUF6QixHQUErQk8sTUFBL0IsR0FBd0MsQ0FBM0MsRUFBNkM7QUFDM0NULFNBQUtnZCxrQkFBTCxHQUEwQm5kLEVBQUUscUJBQUYsRUFBeUJLLEdBQXpCLEVBQTFCO0FBQ0Q7QUFDRCxNQUFHLENBQUNMLEVBQUUsY0FBRixFQUFrQjhCLEVBQWxCLENBQXFCLFdBQXJCLENBQUosRUFBc0M7QUFDcEMzQixTQUFLNlosV0FBTCxHQUFtQmhhLEVBQUUsY0FBRixFQUFrQkssR0FBbEIsRUFBbkI7QUFDRDtBQUNELE1BQUcsQ0FBQ0wsRUFBRSxVQUFGLEVBQWM4QixFQUFkLENBQWlCLFdBQWpCLENBQUosRUFBa0M7QUFDaEMzQixTQUFLOEQsT0FBTCxHQUFlakUsRUFBRSxVQUFGLEVBQWNLLEdBQWQsRUFBZjtBQUNEO0FBQ0QsTUFBRyxDQUFDTCxFQUFFLHNCQUFGLEVBQTBCOEIsRUFBMUIsQ0FBNkIsV0FBN0IsQ0FBSixFQUE4QztBQUM1QyxRQUFHOUIsRUFBRSxrQkFBRixFQUFzQkssR0FBdEIsS0FBOEIsQ0FBakMsRUFBbUM7QUFDakNGLFdBQUs4WixlQUFMLEdBQXVCamEsRUFBRSxrQkFBRixFQUFzQkssR0FBdEIsRUFBdkI7QUFDRCxLQUZELE1BRUs7QUFDSEYsV0FBSzhaLGVBQUwsR0FBdUIsRUFBdkI7QUFDRDtBQUNGO0FBQ0R2USxTQUFPRSxLQUFQLENBQWFjLElBQWIsQ0FBa0Isc0JBQXNCaEssRUFBdEIsR0FBMkIsT0FBN0MsRUFBc0RQLElBQXRELEVBQ0d3SyxJQURILENBQ1EsVUFBU0MsUUFBVCxFQUFrQjtBQUN0QjVLLE1BQUUsYUFBRixFQUFpQnNMLEtBQWpCLENBQXVCLE1BQXZCO0FBQ0F0TCxNQUFFLE9BQUYsRUFBVzhLLFFBQVgsQ0FBb0IsV0FBcEI7QUFDQTFGLFNBQUs2RixjQUFMLENBQW9CTCxTQUFTekssSUFBN0IsRUFBbUMsU0FBbkM7QUFDQWlGLFNBQUt5RixlQUFMO0FBQ0FtUjtBQUNELEdBUEgsRUFRRzlRLEtBUkgsQ0FRUyxVQUFTYixLQUFULEVBQWU7QUFDcEJySyxNQUFFLE9BQUYsRUFBVzhLLFFBQVgsQ0FBb0IsV0FBcEI7QUFDQTFGLFNBQUsrRixXQUFMLENBQWlCLGFBQWpCLEVBQWdDLGFBQWhDLEVBQStDZCxLQUEvQztBQUNELEdBWEg7QUFhRCxDQWhERDs7QUFrREEsSUFBSStSLGVBQWUsU0FBZkEsWUFBZSxDQUFTN1osS0FBVCxFQUFlO0FBQ2hDdkMsSUFBRSxPQUFGLEVBQVd5SyxXQUFYLENBQXVCLFdBQXZCO0FBQ0EsTUFBSS9KLEtBQUtWLEVBQUUsS0FBRixFQUFTSyxHQUFULEVBQVQ7QUFDQSxNQUFJOGMscUJBQXFCbmQsRUFBRSxxQkFBRixFQUF5QkssR0FBekIsRUFBekI7QUFDQSxNQUFJRixPQUFPO0FBQ1RnZCx3QkFBb0JBO0FBRFgsR0FBWDtBQUdBelQsU0FBT0UsS0FBUCxDQUFhYyxJQUFiLENBQWtCLHNCQUFzQmhLLEVBQXRCLEdBQTJCLFNBQTdDLEVBQXdEUCxJQUF4RCxFQUNHd0ssSUFESCxDQUNRLFVBQVNDLFFBQVQsRUFBa0I7QUFDdEI1SyxNQUFFLGFBQUYsRUFBaUJzTCxLQUFqQixDQUF1QixNQUF2QjtBQUNBdEwsTUFBRSxPQUFGLEVBQVc4SyxRQUFYLENBQW9CLFdBQXBCO0FBQ0ExRixTQUFLNkYsY0FBTCxDQUFvQkwsU0FBU3pLLElBQTdCLEVBQW1DLFNBQW5DO0FBQ0FpRixTQUFLeUYsZUFBTDtBQUNBbVI7QUFDRCxHQVBILEVBUUc5USxLQVJILENBUVMsVUFBU2IsS0FBVCxFQUFlO0FBQ3BCckssTUFBRSxPQUFGLEVBQVc4SyxRQUFYLENBQW9CLFdBQXBCO0FBQ0ExRixTQUFLK0YsV0FBTCxDQUFpQixlQUFqQixFQUFrQyxhQUFsQyxFQUFpRGQsS0FBakQ7QUFDRCxHQVhIO0FBYUQsQ0FwQkQ7O0FBc0JBLElBQUl3UixjQUFjLFNBQWRBLFdBQWMsQ0FBU3RaLEtBQVQsRUFBZTtBQUMvQixNQUFJd2EsY0FBYy9jLEVBQUV1QyxNQUFNZ1UsYUFBUixFQUF1QnBXLElBQXZCLENBQTRCLElBQTVCLENBQWxCO0FBQ0EsTUFBSTZjLFdBQVdoZCxFQUFFdUMsTUFBTWdVLGFBQVIsRUFBdUJwVyxJQUF2QixDQUE0QixLQUE1QixDQUFmO0FBQ0EsTUFBSThjLFNBQVN2VCxPQUFPa00sRUFBUCxDQUFVd0YsU0FBVixDQUFvQjRCLFFBQXBCLEVBQThCTixPQUE5QixDQUFzQ0ssV0FBdEMsQ0FBYjtBQUNBLE1BQUdFLE9BQU92QyxTQUFQLElBQW9CaFIsT0FBT2tNLEVBQVAsQ0FBVThFLFNBQWpDLEVBQTJDO0FBQ3pDaFIsV0FBT2tNLEVBQVAsQ0FBVThFLFNBQVYsR0FBc0IsQ0FBQyxDQUF2QjtBQUNBaFIsV0FBT2tNLEVBQVAsQ0FBVXlGLGFBQVYsR0FBMEIsRUFBMUI7QUFDQTNSLFdBQU9rTSxFQUFQLENBQVUwRixTQUFWLEdBQXNCLEVBQXRCO0FBQ0QsR0FKRCxNQUlLO0FBQ0g1UixXQUFPRSxLQUFQLENBQWF6SCxHQUFiLENBQWlCLHlCQUF5QjhhLE9BQU92QyxTQUFqRCxFQUNHL1AsSUFESCxDQUNRLFVBQVM2TyxPQUFULEVBQWlCO0FBQ3JCOVAsYUFBT2tNLEVBQVAsQ0FBVThFLFNBQVYsR0FBc0J1QyxPQUFPdkMsU0FBN0I7QUFDQWhSLGFBQU9rTSxFQUFQLENBQVV5RixhQUFWLEdBQTBCN0IsUUFBUXJaLElBQVIsQ0FBYWtiLGFBQXZDO0FBQ0EzUixhQUFPa00sRUFBUCxDQUFVMEYsU0FBVixHQUFzQjlCLFFBQVFyWixJQUFSLENBQWFtYixTQUFuQztBQUNELEtBTEgsRUFNR3BRLEtBTkgsQ0FNUyxVQUFTYixLQUFULEVBQWU7QUFDcEJqRixXQUFLK0YsV0FBTCxDQUFpQix3QkFBakIsRUFBMkMsRUFBM0MsRUFBK0NkLEtBQS9DO0FBQ0QsS0FSSDtBQVNEO0FBQ0YsQ0FuQkQ7O0FBcUJBLElBQUl5UixjQUFjLFNBQWRBLFdBQWMsQ0FBU3BiLEVBQVQsRUFBWTtBQUM1QixNQUFJMGMsTUFBTSxLQUFWO0FBQ0EsTUFBSUMsTUFBTSxLQUFWO0FBQ0EsTUFBSTNTLE9BQU8sS0FBWDtBQUNBLE1BQUdoSyxNQUFNZ0osT0FBT2tNLEVBQVAsQ0FBVThFLFNBQW5CLEVBQTZCO0FBQzNCMEMsVUFBTSxJQUFOO0FBQ0Q7QUFDRCxNQUFHMVQsT0FBT2tNLEVBQVAsQ0FBVXlGLGFBQVYsQ0FBd0JpQyxRQUF4QixDQUFpQzVjLEVBQWpDLENBQUgsRUFBd0M7QUFDdEMyYyxVQUFNLElBQU47QUFDRDtBQUNELE1BQUczVCxPQUFPa00sRUFBUCxDQUFVMEYsU0FBVixDQUFvQmdDLFFBQXBCLENBQTZCNWMsRUFBN0IsQ0FBSCxFQUFvQztBQUNsQ2dLLFdBQU8sSUFBUDtBQUNEO0FBQ0QsU0FBTztBQUNMLFVBQU0wUyxPQUFPQyxHQUFQLElBQWMzUyxJQURmO0FBRUwsYUFBUzBTLE9BQU9DLEdBQVAsSUFBYzNTLElBRmxCO0FBR0wsaUJBQWEwUyxHQUhSO0FBSUwsNkJBQXlCQyxHQUpwQjtBQUtMLDRCQUF3QjNTO0FBTG5CLEdBQVA7QUFPRCxDQXBCRDs7QUFzQkEsSUFBSXdSLFlBQVksU0FBWkEsU0FBWSxHQUFVO0FBQ3hCbGMsSUFBRSxjQUFGLEVBQWtCSyxHQUFsQixDQUFzQixFQUF0QjtBQUNBTCxJQUFFLFVBQUYsRUFBY0ssR0FBZCxDQUFrQixFQUFsQjtBQUNBTCxJQUFFLFFBQUYsRUFBWUssR0FBWixDQUFnQixFQUFoQjtBQUNBTCxJQUFFLHFCQUFGLEVBQXlCSyxHQUF6QixDQUE2QixFQUE3QjtBQUNBTCxJQUFFLG1CQUFGLEVBQXVCSyxHQUF2QixDQUEyQixDQUEzQjtBQUNBTCxJQUFFLHNCQUFGLEVBQTBCSyxHQUExQixDQUE4QixFQUE5QjtBQUNBTCxJQUFFLHNCQUFGLEVBQTBCQyxJQUExQixDQUErQixnQkFBZ0IsQ0FBaEIsR0FBb0IsSUFBbkQ7QUFDQUQsSUFBRSxZQUFGLEVBQWdCSyxHQUFoQixDQUFvQixDQUFwQjtBQUNBTCxJQUFFLGdCQUFGLEVBQW9CSyxHQUFwQixDQUF3QixFQUF4QjtBQUNBTCxJQUFFLGdCQUFGLEVBQW9CQyxJQUFwQixDQUF5QixnQkFBZ0IsQ0FBaEIsR0FBb0IsSUFBN0M7QUFDQUQsSUFBRSxxQkFBRixFQUF5QkssR0FBekIsQ0FBNkIsQ0FBN0I7QUFDQUwsSUFBRSx5QkFBRixFQUE2QkssR0FBN0IsQ0FBaUMsRUFBakM7QUFDQUwsSUFBRSx5QkFBRixFQUE2QkMsSUFBN0IsQ0FBa0MsZ0JBQWdCLENBQWhCLEdBQW9CLElBQXREO0FBQ0FELElBQUUsY0FBRixFQUFrQjRFLElBQWxCLENBQXVCLFVBQXZCLEVBQW1DLEtBQW5DO0FBQ0E1RSxJQUFFLFVBQUYsRUFBYzRFLElBQWQsQ0FBbUIsVUFBbkIsRUFBK0IsS0FBL0I7QUFDQTVFLElBQUUsc0JBQUYsRUFBMEI0RSxJQUExQixDQUErQixVQUEvQixFQUEyQyxLQUEzQztBQUNBNUUsSUFBRSxlQUFGLEVBQW1COEUsSUFBbkI7QUFDQTlFLElBQUUsYUFBRixFQUFpQnNMLEtBQWpCLENBQXVCLE1BQXZCO0FBQ0FsRyxPQUFLd0csbUJBQUwsQ0FBeUIsV0FBekIsRUFBc0MsQ0FBdEM7QUFDQXhHLE9BQUt3RyxtQkFBTCxDQUF5QixvQkFBekIsRUFBK0MsQ0FBL0M7QUFDRCxDQXJCRCxDOzs7Ozs7OztBQ3ZXQSxJQUFJbk0sWUFBWSxtQkFBQUMsQ0FBUSxDQUFSLENBQWhCOztBQUVBQyxRQUFRQyxJQUFSLEdBQWUsWUFBVTtBQUN2QixNQUFJQyxVQUFVSixVQUFVSyxnQkFBeEI7QUFDQUwsWUFBVUcsSUFBVixDQUFlQyxPQUFmO0FBQ0QsQ0FIRCxDOzs7Ozs7O0FDRkEseUM7Ozs7Ozs7QUNBQSx5Qzs7Ozs7OztBQ0FBOzs7Ozs7O0FBT0FGLFFBQVFzTCxjQUFSLEdBQXlCLFVBQVN1TyxPQUFULEVBQWtCbE0sSUFBbEIsRUFBdUI7QUFDL0MsTUFBSXJOLE9BQU8sOEVBQThFcU4sSUFBOUUsR0FBcUYsaUpBQXJGLEdBQXlPa00sT0FBek8sR0FBbVAsZUFBOVA7QUFDQXhaLElBQUUsVUFBRixFQUFjNkIsTUFBZCxDQUFxQjVCLElBQXJCO0FBQ0FzZCxhQUFXLFlBQVc7QUFDckJ2ZCxNQUFFLG9CQUFGLEVBQXdCMkMsS0FBeEIsQ0FBOEIsT0FBOUI7QUFDQSxHQUZELEVBRUcsSUFGSDtBQUdBLENBTkQ7O0FBUUE7Ozs7Ozs7Ozs7QUFVQTs7O0FBR0FoRCxRQUFRa0wsZUFBUixHQUEwQixZQUFVO0FBQ25DN0ssSUFBRSxhQUFGLEVBQWlCZ1AsSUFBakIsQ0FBc0IsWUFBVztBQUNoQ2hQLE1BQUUsSUFBRixFQUFReUssV0FBUixDQUFvQixXQUFwQjtBQUNBekssTUFBRSxJQUFGLEVBQVF5QyxJQUFSLENBQWEsYUFBYixFQUE0QndNLElBQTVCLENBQWlDLEVBQWpDO0FBQ0EsR0FIRDtBQUlBLENBTEQ7O0FBT0E7OztBQUdBdFAsUUFBUTZkLGFBQVIsR0FBd0IsVUFBU0MsSUFBVCxFQUFjO0FBQ3JDOWQsVUFBUWtMLGVBQVI7QUFDQTdLLElBQUVnUCxJQUFGLENBQU95TyxJQUFQLEVBQWEsVUFBVXpHLEdBQVYsRUFBZW5MLEtBQWYsRUFBc0I7QUFDbEM3TCxNQUFFLE1BQU1nWCxHQUFSLEVBQWF4VSxPQUFiLENBQXFCLGFBQXJCLEVBQW9Dc0ksUUFBcEMsQ0FBNkMsV0FBN0M7QUFDQTlLLE1BQUUsTUFBTWdYLEdBQU4sR0FBWSxNQUFkLEVBQXNCL0gsSUFBdEIsQ0FBMkJwRCxNQUFNbU0sSUFBTixDQUFXLEdBQVgsQ0FBM0I7QUFDQSxHQUhEO0FBSUEsQ0FORDs7QUFRQTs7O0FBR0FyWSxRQUFRMEYsWUFBUixHQUF1QixZQUFVO0FBQ2hDLE1BQUdyRixFQUFFLGdCQUFGLEVBQW9CWSxNQUF2QixFQUE4QjtBQUM3QixRQUFJNFksVUFBVXhaLEVBQUUsZ0JBQUYsRUFBb0JLLEdBQXBCLEVBQWQ7QUFDQSxRQUFJaU4sT0FBT3ROLEVBQUUscUJBQUYsRUFBeUJLLEdBQXpCLEVBQVg7QUFDQVYsWUFBUXNMLGNBQVIsQ0FBdUJ1TyxPQUF2QixFQUFnQ2xNLElBQWhDO0FBQ0E7QUFDRCxDQU5EOztBQVFBOzs7Ozs7O0FBT0EzTixRQUFRd0wsV0FBUixHQUFzQixVQUFTcU8sT0FBVCxFQUFrQm5PLE9BQWxCLEVBQTJCaEIsS0FBM0IsRUFBaUM7QUFDdEQsTUFBR0EsTUFBTU8sUUFBVCxFQUFrQjtBQUNqQjtBQUNBLFFBQUdQLE1BQU1PLFFBQU4sQ0FBZWtILE1BQWYsSUFBeUIsR0FBNUIsRUFBZ0M7QUFDL0JuUyxjQUFRNmQsYUFBUixDQUFzQm5ULE1BQU1PLFFBQU4sQ0FBZXpLLElBQXJDO0FBQ0EsS0FGRCxNQUVLO0FBQ0p3QyxZQUFNLGVBQWU2VyxPQUFmLEdBQXlCLElBQXpCLEdBQWdDblAsTUFBTU8sUUFBTixDQUFlekssSUFBckQ7QUFDQTtBQUNEOztBQUVEO0FBQ0EsTUFBR2tMLFFBQVF6SyxNQUFSLEdBQWlCLENBQXBCLEVBQXNCO0FBQ3JCWixNQUFFcUwsVUFBVSxNQUFaLEVBQW9CUCxRQUFwQixDQUE2QixXQUE3QjtBQUNBO0FBQ0QsQ0FkRDs7QUFnQkE7Ozs7Ozs7O0FBUUFuTCxRQUFRcWIsWUFBUixHQUF1QixVQUFTL0wsSUFBVCxFQUFlck8sTUFBZixFQUFzQjtBQUM1QyxNQUFHcU8sS0FBS3JPLE1BQUwsR0FBY0EsTUFBakIsRUFBd0I7QUFDdkIsV0FBT1osRUFBRTBPLElBQUYsQ0FBT08sSUFBUCxFQUFheU8sU0FBYixDQUF1QixDQUF2QixFQUEwQjljLE1BQTFCLEVBQWtDK2MsS0FBbEMsQ0FBd0MsR0FBeEMsRUFBNkNDLEtBQTdDLENBQW1ELENBQW5ELEVBQXNELENBQUMsQ0FBdkQsRUFBMEQ1RixJQUExRCxDQUErRCxHQUEvRCxJQUFzRSxLQUE3RTtBQUNBLEdBRkQsTUFFSztBQUNKLFdBQU8vSSxJQUFQO0FBQ0E7QUFDRCxDQU5EOztBQVFBOzs7Ozs7QUFNQXRQLFFBQVE4RCxnQkFBUixHQUEyQixVQUFTL0MsRUFBVCxFQUFhRyxHQUFiLEVBQWlCO0FBQzFDYixJQUFFLE1BQU1VLEVBQU4sR0FBVyxNQUFiLEVBQXFCME8sWUFBckIsQ0FBa0M7QUFDL0JDLGdCQUFZeE8sR0FEbUI7QUFFL0J5TyxrQkFBYztBQUNiQyxnQkFBVTtBQURHLEtBRmlCO0FBSzlCc08sY0FBVSxDQUxvQjtBQU05QkMscUJBQWlCLElBTmE7QUFPL0J0TyxjQUFVLGtCQUFVQyxVQUFWLEVBQXNCO0FBQzVCelAsUUFBRSxNQUFNVSxFQUFSLEVBQVlMLEdBQVosQ0FBZ0JvUCxXQUFXdFAsSUFBM0I7QUFDQ0gsUUFBRSxNQUFNVSxFQUFOLEdBQVcsTUFBYixFQUFxQlQsSUFBckIsQ0FBMEIsZ0JBQWdCd1AsV0FBV3RQLElBQTNCLEdBQWtDLElBQWxDLEdBQXlDUixRQUFRcWIsWUFBUixDQUFxQnZMLFdBQVc1RCxLQUFoQyxFQUF1QyxFQUF2QyxDQUFuRTtBQUNMN0wsUUFBRSxNQUFNVSxFQUFOLEdBQVcsTUFBYixFQUFxQkwsR0FBckIsQ0FBeUIsRUFBekI7QUFDQyxLQVg4QjtBQVkvQnFQLHFCQUFpQix5QkFBUzlFLFFBQVQsRUFBbUI7QUFDaEMsYUFBTztBQUNIK0UscUJBQWEzUCxFQUFFNFAsR0FBRixDQUFNaEYsU0FBU3pLLElBQWYsRUFBcUIsVUFBUzBQLFFBQVQsRUFBbUI7QUFDakQsaUJBQU8sRUFBRWhFLE9BQU9nRSxTQUFTaEUsS0FBbEIsRUFBeUIxTCxNQUFNMFAsU0FBUzFQLElBQXhDLEVBQVA7QUFDSCxTQUZZO0FBRFYsT0FBUDtBQUtIO0FBbEI4QixHQUFsQzs7QUFxQkFILElBQUUsTUFBTVUsRUFBTixHQUFXLE9BQWIsRUFBc0JSLEVBQXRCLENBQXlCLE9BQXpCLEVBQWtDLFlBQVU7QUFDMUNGLE1BQUUsTUFBTVUsRUFBUixFQUFZTCxHQUFaLENBQWdCLENBQWhCO0FBQ0FMLE1BQUUsTUFBTVUsRUFBTixHQUFXLE1BQWIsRUFBcUJULElBQXJCLENBQTBCLGdCQUFnQixDQUFoQixHQUFvQixJQUE5QztBQUNBRCxNQUFFLE1BQU1VLEVBQU4sR0FBVyxNQUFiLEVBQXFCTCxHQUFyQixDQUF5QixFQUF6QjtBQUNELEdBSkQ7QUFLRCxDQTNCRDs7QUE2QkE7Ozs7OztBQU1BVixRQUFRZ00sb0JBQVIsR0FBK0IsVUFBU2pMLEVBQVQsRUFBYUcsR0FBYixFQUFpQjtBQUM5Q2IsSUFBRSxNQUFNVSxFQUFOLEdBQVcsTUFBYixFQUFxQjBPLFlBQXJCLENBQWtDO0FBQy9CQyxnQkFBWXhPLEdBRG1CO0FBRS9CeU8sa0JBQWM7QUFDYkMsZ0JBQVU7QUFERyxLQUZpQjtBQUs5QnNPLGNBQVUsQ0FMb0I7QUFNOUJDLHFCQUFpQixJQU5hO0FBTy9CdE8sY0FBVSxrQkFBVUMsVUFBVixFQUFzQjtBQUM1QnpQLFFBQUUsTUFBTVUsRUFBUixFQUFZTCxHQUFaLENBQWdCb1AsV0FBV3RQLElBQTNCO0FBQ0NILFFBQUUsTUFBTVUsRUFBTixHQUFXLE1BQWIsRUFBcUJULElBQXJCLENBQTBCLGdCQUFnQndQLFdBQVd0UCxJQUEzQixHQUFrQyxJQUFsQyxHQUF5Q1IsUUFBUXFiLFlBQVIsQ0FBcUJ2TCxXQUFXNUQsS0FBaEMsRUFBdUMsRUFBdkMsQ0FBbkU7QUFDTDdMLFFBQUUsTUFBTVUsRUFBTixHQUFXLE1BQWIsRUFBcUJMLEdBQXJCLENBQXlCLEVBQXpCO0FBQ0tWLGNBQVFpTSxtQkFBUixDQUE0QmxMLEVBQTVCLEVBQWdDLENBQWhDO0FBQ0osS0FaOEI7QUFhL0JnUCxxQkFBaUIseUJBQVM5RSxRQUFULEVBQW1CO0FBQ2hDLGFBQU87QUFDSCtFLHFCQUFhM1AsRUFBRTRQLEdBQUYsQ0FBTWhGLFNBQVN6SyxJQUFmLEVBQXFCLFVBQVMwUCxRQUFULEVBQW1CO0FBQ2pELGlCQUFPLEVBQUVoRSxPQUFPZ0UsU0FBU2hFLEtBQWxCLEVBQXlCMUwsTUFBTTBQLFNBQVMxUCxJQUF4QyxFQUFQO0FBQ0gsU0FGWTtBQURWLE9BQVA7QUFLSDtBQW5COEIsR0FBbEM7O0FBc0JBSCxJQUFFLE1BQU1VLEVBQU4sR0FBVyxPQUFiLEVBQXNCUixFQUF0QixDQUF5QixPQUF6QixFQUFrQyxZQUFVO0FBQzFDRixNQUFFLE1BQU1VLEVBQVIsRUFBWUwsR0FBWixDQUFnQixDQUFoQjtBQUNBTCxNQUFFLE1BQU1VLEVBQU4sR0FBVyxNQUFiLEVBQXFCVCxJQUFyQixDQUEwQixnQkFBZ0IsQ0FBaEIsR0FBb0IsSUFBOUM7QUFDQUQsTUFBRSxNQUFNVSxFQUFOLEdBQVcsTUFBYixFQUFxQkwsR0FBckIsQ0FBeUIsRUFBekI7QUFDQVYsWUFBUWlNLG1CQUFSLENBQTRCbEwsRUFBNUIsRUFBZ0MsQ0FBaEM7QUFDRCxHQUxEOztBQU9BVixJQUFFLE1BQU1VLEVBQU4sR0FBVyxTQUFiLEVBQXdCUixFQUF4QixDQUEyQixPQUEzQixFQUFvQyxZQUFVO0FBQzVDRyxVQUFNb1YsU0FBU3pWLEVBQUUsTUFBTVUsRUFBTixHQUFXLE1BQWIsRUFBcUJMLEdBQXJCLEVBQVQsQ0FBTjtBQUNBVixZQUFRaU0sbUJBQVIsQ0FBNEJsTCxFQUE1QixFQUFnQyxDQUFDTCxNQUFNLENBQVAsSUFBWSxDQUE1QztBQUNELEdBSEQ7QUFJRCxDQWxDRDs7QUFvQ0E7Ozs7OztBQU1BVixRQUFRaU0sbUJBQVIsR0FBOEIsVUFBU2xMLEVBQVQsRUFBYW1MLEtBQWIsRUFBbUI7QUFDL0MsTUFBR0EsU0FBUyxDQUFaLEVBQWM7QUFDWjdMLE1BQUUsTUFBTVUsRUFBTixHQUFXLE1BQWIsRUFBcUJMLEdBQXJCLENBQXlCLENBQXpCO0FBQ0FMLE1BQUUsTUFBTVUsRUFBTixHQUFXLFNBQWIsRUFBd0JvSyxRQUF4QixDQUFpQyxRQUFqQztBQUNBOUssTUFBRSxNQUFNVSxFQUFOLEdBQVcsU0FBYixFQUF3QlQsSUFBeEIsQ0FBNkIsNEJBQTdCO0FBQ0QsR0FKRCxNQUlLO0FBQ0hELE1BQUUsTUFBTVUsRUFBTixHQUFXLE1BQWIsRUFBcUJMLEdBQXJCLENBQXlCLENBQXpCO0FBQ0FMLE1BQUUsTUFBTVUsRUFBTixHQUFXLFNBQWIsRUFBd0IrSixXQUF4QixDQUFvQyxRQUFwQztBQUNBekssTUFBRSxNQUFNVSxFQUFOLEdBQVcsU0FBYixFQUF3QlQsSUFBeEIsQ0FBNkIsa0NBQTdCO0FBQ0Q7QUFDRixDQVZELEM7Ozs7Ozs7O0FDbkxBOzs7O0FBSUFOLFFBQVFDLElBQVIsR0FBZSxZQUFVOztBQUV2QjtBQUNBRixFQUFBLG1CQUFBQSxDQUFRLENBQVI7QUFDQUEsRUFBQSxtQkFBQUEsQ0FBUSxFQUFSO0FBQ0FBLEVBQUEsbUJBQUFBLENBQVEsQ0FBUjs7QUFFQTtBQUNBTSxJQUFFLGdCQUFGLEVBQW9CZ1AsSUFBcEIsQ0FBeUIsWUFBVTtBQUNqQ2hQLE1BQUUsSUFBRixFQUFRK2QsS0FBUixDQUFjLFVBQVNqTixDQUFULEVBQVc7QUFDdkJBLFFBQUVrTixlQUFGO0FBQ0FsTixRQUFFbU4sY0FBRjs7QUFFQTtBQUNBLFVBQUl2ZCxLQUFLVixFQUFFLElBQUYsRUFBUUcsSUFBUixDQUFhLElBQWIsQ0FBVDs7QUFFQTtBQUNBSCxRQUFFLHFCQUFxQlUsRUFBdkIsRUFBMkJvSyxRQUEzQixDQUFvQyxRQUFwQztBQUNBOUssUUFBRSxtQkFBbUJVLEVBQXJCLEVBQXlCK0osV0FBekIsQ0FBcUMsUUFBckM7QUFDQXpLLFFBQUUsZUFBZVUsRUFBakIsRUFBcUJRLFVBQXJCLENBQWdDO0FBQzlCQyxlQUFPLElBRHVCO0FBRTlCQyxpQkFBUztBQUNQO0FBQ0EsU0FBQyxPQUFELEVBQVUsQ0FBQyxPQUFELEVBQVUsTUFBVixFQUFrQixRQUFsQixFQUE0QixXQUE1QixFQUF5QyxPQUF6QyxDQUFWLENBRk8sRUFHUCxDQUFDLE1BQUQsRUFBUyxDQUFDLGVBQUQsRUFBa0IsYUFBbEIsRUFBaUMsV0FBakMsRUFBOEMsTUFBOUMsQ0FBVCxDQUhPLEVBSVAsQ0FBQyxNQUFELEVBQVMsQ0FBQyxJQUFELEVBQU8sSUFBUCxFQUFhLFdBQWIsQ0FBVCxDQUpPLEVBS1AsQ0FBQyxNQUFELEVBQVMsQ0FBQyxZQUFELEVBQWUsVUFBZixFQUEyQixNQUEzQixDQUFULENBTE8sQ0FGcUI7QUFTOUJDLGlCQUFTLENBVHFCO0FBVTlCQyxvQkFBWTtBQUNWQyxnQkFBTSxXQURJO0FBRVZDLG9CQUFVLElBRkE7QUFHVkMsdUJBQWEsSUFISDtBQUlWQyxpQkFBTztBQUpHO0FBVmtCLE9BQWhDO0FBaUJELEtBM0JEO0FBNEJELEdBN0JEOztBQStCQTtBQUNBMUIsSUFBRSxnQkFBRixFQUFvQmdQLElBQXBCLENBQXlCLFlBQVU7QUFDakNoUCxNQUFFLElBQUYsRUFBUStkLEtBQVIsQ0FBYyxVQUFTak4sQ0FBVCxFQUFXO0FBQ3ZCQSxRQUFFa04sZUFBRjtBQUNBbE4sUUFBRW1OLGNBQUY7O0FBRUE7QUFDQSxVQUFJdmQsS0FBS1YsRUFBRSxJQUFGLEVBQVFHLElBQVIsQ0FBYSxJQUFiLENBQVQ7O0FBRUE7QUFDQUgsUUFBRSxtQkFBbUJVLEVBQXJCLEVBQXlCK0osV0FBekIsQ0FBcUMsV0FBckM7O0FBRUE7QUFDQSxVQUFJeVQsYUFBYWxlLEVBQUUsZUFBZVUsRUFBakIsRUFBcUJRLFVBQXJCLENBQWdDLE1BQWhDLENBQWpCOztBQUVBO0FBQ0F3SSxhQUFPRSxLQUFQLENBQWFjLElBQWIsQ0FBa0Isb0JBQW9CaEssRUFBdEMsRUFBMEM7QUFDeEN5ZCxrQkFBVUQ7QUFEOEIsT0FBMUMsRUFHQ3ZULElBSEQsQ0FHTSxVQUFTQyxRQUFULEVBQWtCO0FBQ3RCO0FBQ0FHLGlCQUFTUyxNQUFULENBQWdCLElBQWhCO0FBQ0QsT0FORCxFQU9DTixLQVBELENBT08sVUFBU2IsS0FBVCxFQUFlO0FBQ3BCMUgsY0FBTSw2QkFBNkIwSCxNQUFNTyxRQUFOLENBQWV6SyxJQUFsRDtBQUNELE9BVEQ7QUFVRCxLQXhCRDtBQXlCRCxHQTFCRDs7QUE0QkE7QUFDQUgsSUFBRSxrQkFBRixFQUFzQmdQLElBQXRCLENBQTJCLFlBQVU7QUFDbkNoUCxNQUFFLElBQUYsRUFBUStkLEtBQVIsQ0FBYyxVQUFTak4sQ0FBVCxFQUFXO0FBQ3ZCQSxRQUFFa04sZUFBRjtBQUNBbE4sUUFBRW1OLGNBQUY7O0FBRUE7QUFDQSxVQUFJdmQsS0FBS1YsRUFBRSxJQUFGLEVBQVFHLElBQVIsQ0FBYSxJQUFiLENBQVQ7O0FBRUE7QUFDQUgsUUFBRSxlQUFlVSxFQUFqQixFQUFxQlEsVUFBckIsQ0FBZ0MsT0FBaEM7QUFDQWxCLFFBQUUsZUFBZVUsRUFBakIsRUFBcUJRLFVBQXJCLENBQWdDLFNBQWhDOztBQUVBO0FBQ0FsQixRQUFFLHFCQUFxQlUsRUFBdkIsRUFBMkIrSixXQUEzQixDQUF1QyxRQUF2QztBQUNBekssUUFBRSxtQkFBbUJVLEVBQXJCLEVBQXlCb0ssUUFBekIsQ0FBa0MsUUFBbEM7QUFDRCxLQWREO0FBZUQsR0FoQkQ7QUFpQkQsQ0F0RkQsQyIsImZpbGUiOiIvanMvYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29kZU1pcnJvciwgY29weXJpZ2h0IChjKSBieSBNYXJpam4gSGF2ZXJiZWtlIGFuZCBvdGhlcnNcbi8vIERpc3RyaWJ1dGVkIHVuZGVyIGFuIE1JVCBsaWNlbnNlOiBodHRwczovL2NvZGVtaXJyb3IubmV0L0xJQ0VOU0VcblxuKGZ1bmN0aW9uKG1vZCkge1xuICBpZiAodHlwZW9mIGV4cG9ydHMgPT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgbW9kdWxlID09IFwib2JqZWN0XCIpIC8vIENvbW1vbkpTXG4gICAgbW9kKHJlcXVpcmUoXCIuLi8uLi9saWIvY29kZW1pcnJvclwiKSk7XG4gIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIC8vIEFNRFxuICAgIGRlZmluZShbXCIuLi8uLi9saWIvY29kZW1pcnJvclwiXSwgbW9kKTtcbiAgZWxzZSAvLyBQbGFpbiBicm93c2VyIGVudlxuICAgIG1vZChDb2RlTWlycm9yKTtcbn0pKGZ1bmN0aW9uKENvZGVNaXJyb3IpIHtcblwidXNlIHN0cmljdFwiO1xuXG52YXIgaHRtbENvbmZpZyA9IHtcbiAgYXV0b1NlbGZDbG9zZXJzOiB7J2FyZWEnOiB0cnVlLCAnYmFzZSc6IHRydWUsICdicic6IHRydWUsICdjb2wnOiB0cnVlLCAnY29tbWFuZCc6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICdlbWJlZCc6IHRydWUsICdmcmFtZSc6IHRydWUsICdocic6IHRydWUsICdpbWcnOiB0cnVlLCAnaW5wdXQnOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAna2V5Z2VuJzogdHJ1ZSwgJ2xpbmsnOiB0cnVlLCAnbWV0YSc6IHRydWUsICdwYXJhbSc6IHRydWUsICdzb3VyY2UnOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAndHJhY2snOiB0cnVlLCAnd2JyJzogdHJ1ZSwgJ21lbnVpdGVtJzogdHJ1ZX0sXG4gIGltcGxpY2l0bHlDbG9zZWQ6IHsnZGQnOiB0cnVlLCAnbGknOiB0cnVlLCAnb3B0Z3JvdXAnOiB0cnVlLCAnb3B0aW9uJzogdHJ1ZSwgJ3AnOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgJ3JwJzogdHJ1ZSwgJ3J0JzogdHJ1ZSwgJ3Rib2R5JzogdHJ1ZSwgJ3RkJzogdHJ1ZSwgJ3Rmb290JzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICd0aCc6IHRydWUsICd0cic6IHRydWV9LFxuICBjb250ZXh0R3JhYmJlcnM6IHtcbiAgICAnZGQnOiB7J2RkJzogdHJ1ZSwgJ2R0JzogdHJ1ZX0sXG4gICAgJ2R0JzogeydkZCc6IHRydWUsICdkdCc6IHRydWV9LFxuICAgICdsaSc6IHsnbGknOiB0cnVlfSxcbiAgICAnb3B0aW9uJzogeydvcHRpb24nOiB0cnVlLCAnb3B0Z3JvdXAnOiB0cnVlfSxcbiAgICAnb3B0Z3JvdXAnOiB7J29wdGdyb3VwJzogdHJ1ZX0sXG4gICAgJ3AnOiB7J2FkZHJlc3MnOiB0cnVlLCAnYXJ0aWNsZSc6IHRydWUsICdhc2lkZSc6IHRydWUsICdibG9ja3F1b3RlJzogdHJ1ZSwgJ2Rpcic6IHRydWUsXG4gICAgICAgICAgJ2Rpdic6IHRydWUsICdkbCc6IHRydWUsICdmaWVsZHNldCc6IHRydWUsICdmb290ZXInOiB0cnVlLCAnZm9ybSc6IHRydWUsXG4gICAgICAgICAgJ2gxJzogdHJ1ZSwgJ2gyJzogdHJ1ZSwgJ2gzJzogdHJ1ZSwgJ2g0JzogdHJ1ZSwgJ2g1JzogdHJ1ZSwgJ2g2JzogdHJ1ZSxcbiAgICAgICAgICAnaGVhZGVyJzogdHJ1ZSwgJ2hncm91cCc6IHRydWUsICdocic6IHRydWUsICdtZW51JzogdHJ1ZSwgJ25hdic6IHRydWUsICdvbCc6IHRydWUsXG4gICAgICAgICAgJ3AnOiB0cnVlLCAncHJlJzogdHJ1ZSwgJ3NlY3Rpb24nOiB0cnVlLCAndGFibGUnOiB0cnVlLCAndWwnOiB0cnVlfSxcbiAgICAncnAnOiB7J3JwJzogdHJ1ZSwgJ3J0JzogdHJ1ZX0sXG4gICAgJ3J0JzogeydycCc6IHRydWUsICdydCc6IHRydWV9LFxuICAgICd0Ym9keSc6IHsndGJvZHknOiB0cnVlLCAndGZvb3QnOiB0cnVlfSxcbiAgICAndGQnOiB7J3RkJzogdHJ1ZSwgJ3RoJzogdHJ1ZX0sXG4gICAgJ3Rmb290Jzogeyd0Ym9keSc6IHRydWV9LFxuICAgICd0aCc6IHsndGQnOiB0cnVlLCAndGgnOiB0cnVlfSxcbiAgICAndGhlYWQnOiB7J3Rib2R5JzogdHJ1ZSwgJ3Rmb290JzogdHJ1ZX0sXG4gICAgJ3RyJzogeyd0cic6IHRydWV9XG4gIH0sXG4gIGRvTm90SW5kZW50OiB7XCJwcmVcIjogdHJ1ZX0sXG4gIGFsbG93VW5xdW90ZWQ6IHRydWUsXG4gIGFsbG93TWlzc2luZzogdHJ1ZSxcbiAgY2FzZUZvbGQ6IHRydWVcbn1cblxudmFyIHhtbENvbmZpZyA9IHtcbiAgYXV0b1NlbGZDbG9zZXJzOiB7fSxcbiAgaW1wbGljaXRseUNsb3NlZDoge30sXG4gIGNvbnRleHRHcmFiYmVyczoge30sXG4gIGRvTm90SW5kZW50OiB7fSxcbiAgYWxsb3dVbnF1b3RlZDogZmFsc2UsXG4gIGFsbG93TWlzc2luZzogZmFsc2UsXG4gIGFsbG93TWlzc2luZ1RhZ05hbWU6IGZhbHNlLFxuICBjYXNlRm9sZDogZmFsc2Vcbn1cblxuQ29kZU1pcnJvci5kZWZpbmVNb2RlKFwieG1sXCIsIGZ1bmN0aW9uKGVkaXRvckNvbmYsIGNvbmZpZ18pIHtcbiAgdmFyIGluZGVudFVuaXQgPSBlZGl0b3JDb25mLmluZGVudFVuaXRcbiAgdmFyIGNvbmZpZyA9IHt9XG4gIHZhciBkZWZhdWx0cyA9IGNvbmZpZ18uaHRtbE1vZGUgPyBodG1sQ29uZmlnIDogeG1sQ29uZmlnXG4gIGZvciAodmFyIHByb3AgaW4gZGVmYXVsdHMpIGNvbmZpZ1twcm9wXSA9IGRlZmF1bHRzW3Byb3BdXG4gIGZvciAodmFyIHByb3AgaW4gY29uZmlnXykgY29uZmlnW3Byb3BdID0gY29uZmlnX1twcm9wXVxuXG4gIC8vIFJldHVybiB2YXJpYWJsZXMgZm9yIHRva2VuaXplcnNcbiAgdmFyIHR5cGUsIHNldFN0eWxlO1xuXG4gIGZ1bmN0aW9uIGluVGV4dChzdHJlYW0sIHN0YXRlKSB7XG4gICAgZnVuY3Rpb24gY2hhaW4ocGFyc2VyKSB7XG4gICAgICBzdGF0ZS50b2tlbml6ZSA9IHBhcnNlcjtcbiAgICAgIHJldHVybiBwYXJzZXIoc3RyZWFtLCBzdGF0ZSk7XG4gICAgfVxuXG4gICAgdmFyIGNoID0gc3RyZWFtLm5leHQoKTtcbiAgICBpZiAoY2ggPT0gXCI8XCIpIHtcbiAgICAgIGlmIChzdHJlYW0uZWF0KFwiIVwiKSkge1xuICAgICAgICBpZiAoc3RyZWFtLmVhdChcIltcIikpIHtcbiAgICAgICAgICBpZiAoc3RyZWFtLm1hdGNoKFwiQ0RBVEFbXCIpKSByZXR1cm4gY2hhaW4oaW5CbG9jayhcImF0b21cIiwgXCJdXT5cIikpO1xuICAgICAgICAgIGVsc2UgcmV0dXJuIG51bGw7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RyZWFtLm1hdGNoKFwiLS1cIikpIHtcbiAgICAgICAgICByZXR1cm4gY2hhaW4oaW5CbG9jayhcImNvbW1lbnRcIiwgXCItLT5cIikpO1xuICAgICAgICB9IGVsc2UgaWYgKHN0cmVhbS5tYXRjaChcIkRPQ1RZUEVcIiwgdHJ1ZSwgdHJ1ZSkpIHtcbiAgICAgICAgICBzdHJlYW0uZWF0V2hpbGUoL1tcXHdcXC5fXFwtXS8pO1xuICAgICAgICAgIHJldHVybiBjaGFpbihkb2N0eXBlKDEpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChzdHJlYW0uZWF0KFwiP1wiKSkge1xuICAgICAgICBzdHJlYW0uZWF0V2hpbGUoL1tcXHdcXC5fXFwtXS8pO1xuICAgICAgICBzdGF0ZS50b2tlbml6ZSA9IGluQmxvY2soXCJtZXRhXCIsIFwiPz5cIik7XG4gICAgICAgIHJldHVybiBcIm1ldGFcIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHR5cGUgPSBzdHJlYW0uZWF0KFwiL1wiKSA/IFwiY2xvc2VUYWdcIiA6IFwib3BlblRhZ1wiO1xuICAgICAgICBzdGF0ZS50b2tlbml6ZSA9IGluVGFnO1xuICAgICAgICByZXR1cm4gXCJ0YWcgYnJhY2tldFwiO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY2ggPT0gXCImXCIpIHtcbiAgICAgIHZhciBvaztcbiAgICAgIGlmIChzdHJlYW0uZWF0KFwiI1wiKSkge1xuICAgICAgICBpZiAoc3RyZWFtLmVhdChcInhcIikpIHtcbiAgICAgICAgICBvayA9IHN0cmVhbS5lYXRXaGlsZSgvW2EtZkEtRlxcZF0vKSAmJiBzdHJlYW0uZWF0KFwiO1wiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvayA9IHN0cmVhbS5lYXRXaGlsZSgvW1xcZF0vKSAmJiBzdHJlYW0uZWF0KFwiO1wiKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb2sgPSBzdHJlYW0uZWF0V2hpbGUoL1tcXHdcXC5cXC06XS8pICYmIHN0cmVhbS5lYXQoXCI7XCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG9rID8gXCJhdG9tXCIgOiBcImVycm9yXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0cmVhbS5lYXRXaGlsZSgvW14mPF0vKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuICBpblRleHQuaXNJblRleHQgPSB0cnVlO1xuXG4gIGZ1bmN0aW9uIGluVGFnKHN0cmVhbSwgc3RhdGUpIHtcbiAgICB2YXIgY2ggPSBzdHJlYW0ubmV4dCgpO1xuICAgIGlmIChjaCA9PSBcIj5cIiB8fCAoY2ggPT0gXCIvXCIgJiYgc3RyZWFtLmVhdChcIj5cIikpKSB7XG4gICAgICBzdGF0ZS50b2tlbml6ZSA9IGluVGV4dDtcbiAgICAgIHR5cGUgPSBjaCA9PSBcIj5cIiA/IFwiZW5kVGFnXCIgOiBcInNlbGZjbG9zZVRhZ1wiO1xuICAgICAgcmV0dXJuIFwidGFnIGJyYWNrZXRcIjtcbiAgICB9IGVsc2UgaWYgKGNoID09IFwiPVwiKSB7XG4gICAgICB0eXBlID0gXCJlcXVhbHNcIjtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0gZWxzZSBpZiAoY2ggPT0gXCI8XCIpIHtcbiAgICAgIHN0YXRlLnRva2VuaXplID0gaW5UZXh0O1xuICAgICAgc3RhdGUuc3RhdGUgPSBiYXNlU3RhdGU7XG4gICAgICBzdGF0ZS50YWdOYW1lID0gc3RhdGUudGFnU3RhcnQgPSBudWxsO1xuICAgICAgdmFyIG5leHQgPSBzdGF0ZS50b2tlbml6ZShzdHJlYW0sIHN0YXRlKTtcbiAgICAgIHJldHVybiBuZXh0ID8gbmV4dCArIFwiIHRhZyBlcnJvclwiIDogXCJ0YWcgZXJyb3JcIjtcbiAgICB9IGVsc2UgaWYgKC9bXFwnXFxcIl0vLnRlc3QoY2gpKSB7XG4gICAgICBzdGF0ZS50b2tlbml6ZSA9IGluQXR0cmlidXRlKGNoKTtcbiAgICAgIHN0YXRlLnN0cmluZ1N0YXJ0Q29sID0gc3RyZWFtLmNvbHVtbigpO1xuICAgICAgcmV0dXJuIHN0YXRlLnRva2VuaXplKHN0cmVhbSwgc3RhdGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHJlYW0ubWF0Y2goL15bXlxcc1xcdTAwYTA9PD5cXFwiXFwnXSpbXlxcc1xcdTAwYTA9PD5cXFwiXFwnXFwvXS8pO1xuICAgICAgcmV0dXJuIFwid29yZFwiO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGluQXR0cmlidXRlKHF1b3RlKSB7XG4gICAgdmFyIGNsb3N1cmUgPSBmdW5jdGlvbihzdHJlYW0sIHN0YXRlKSB7XG4gICAgICB3aGlsZSAoIXN0cmVhbS5lb2woKSkge1xuICAgICAgICBpZiAoc3RyZWFtLm5leHQoKSA9PSBxdW90ZSkge1xuICAgICAgICAgIHN0YXRlLnRva2VuaXplID0gaW5UYWc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBcInN0cmluZ1wiO1xuICAgIH07XG4gICAgY2xvc3VyZS5pc0luQXR0cmlidXRlID0gdHJ1ZTtcbiAgICByZXR1cm4gY2xvc3VyZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGluQmxvY2soc3R5bGUsIHRlcm1pbmF0b3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oc3RyZWFtLCBzdGF0ZSkge1xuICAgICAgd2hpbGUgKCFzdHJlYW0uZW9sKCkpIHtcbiAgICAgICAgaWYgKHN0cmVhbS5tYXRjaCh0ZXJtaW5hdG9yKSkge1xuICAgICAgICAgIHN0YXRlLnRva2VuaXplID0gaW5UZXh0O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHN0cmVhbS5uZXh0KCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gc3R5bGU7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZG9jdHlwZShkZXB0aCkge1xuICAgIHJldHVybiBmdW5jdGlvbihzdHJlYW0sIHN0YXRlKSB7XG4gICAgICB2YXIgY2g7XG4gICAgICB3aGlsZSAoKGNoID0gc3RyZWFtLm5leHQoKSkgIT0gbnVsbCkge1xuICAgICAgICBpZiAoY2ggPT0gXCI8XCIpIHtcbiAgICAgICAgICBzdGF0ZS50b2tlbml6ZSA9IGRvY3R5cGUoZGVwdGggKyAxKTtcbiAgICAgICAgICByZXR1cm4gc3RhdGUudG9rZW5pemUoc3RyZWFtLCBzdGF0ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoY2ggPT0gXCI+XCIpIHtcbiAgICAgICAgICBpZiAoZGVwdGggPT0gMSkge1xuICAgICAgICAgICAgc3RhdGUudG9rZW5pemUgPSBpblRleHQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RhdGUudG9rZW5pemUgPSBkb2N0eXBlKGRlcHRoIC0gMSk7XG4gICAgICAgICAgICByZXR1cm4gc3RhdGUudG9rZW5pemUoc3RyZWFtLCBzdGF0ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gXCJtZXRhXCI7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIENvbnRleHQoc3RhdGUsIHRhZ05hbWUsIHN0YXJ0T2ZMaW5lKSB7XG4gICAgdGhpcy5wcmV2ID0gc3RhdGUuY29udGV4dDtcbiAgICB0aGlzLnRhZ05hbWUgPSB0YWdOYW1lO1xuICAgIHRoaXMuaW5kZW50ID0gc3RhdGUuaW5kZW50ZWQ7XG4gICAgdGhpcy5zdGFydE9mTGluZSA9IHN0YXJ0T2ZMaW5lO1xuICAgIGlmIChjb25maWcuZG9Ob3RJbmRlbnQuaGFzT3duUHJvcGVydHkodGFnTmFtZSkgfHwgKHN0YXRlLmNvbnRleHQgJiYgc3RhdGUuY29udGV4dC5ub0luZGVudCkpXG4gICAgICB0aGlzLm5vSW5kZW50ID0gdHJ1ZTtcbiAgfVxuICBmdW5jdGlvbiBwb3BDb250ZXh0KHN0YXRlKSB7XG4gICAgaWYgKHN0YXRlLmNvbnRleHQpIHN0YXRlLmNvbnRleHQgPSBzdGF0ZS5jb250ZXh0LnByZXY7XG4gIH1cbiAgZnVuY3Rpb24gbWF5YmVQb3BDb250ZXh0KHN0YXRlLCBuZXh0VGFnTmFtZSkge1xuICAgIHZhciBwYXJlbnRUYWdOYW1lO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAoIXN0YXRlLmNvbnRleHQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcGFyZW50VGFnTmFtZSA9IHN0YXRlLmNvbnRleHQudGFnTmFtZTtcbiAgICAgIGlmICghY29uZmlnLmNvbnRleHRHcmFiYmVycy5oYXNPd25Qcm9wZXJ0eShwYXJlbnRUYWdOYW1lKSB8fFxuICAgICAgICAgICFjb25maWcuY29udGV4dEdyYWJiZXJzW3BhcmVudFRhZ05hbWVdLmhhc093blByb3BlcnR5KG5leHRUYWdOYW1lKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBwb3BDb250ZXh0KHN0YXRlKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBiYXNlU3RhdGUodHlwZSwgc3RyZWFtLCBzdGF0ZSkge1xuICAgIGlmICh0eXBlID09IFwib3BlblRhZ1wiKSB7XG4gICAgICBzdGF0ZS50YWdTdGFydCA9IHN0cmVhbS5jb2x1bW4oKTtcbiAgICAgIHJldHVybiB0YWdOYW1lU3RhdGU7XG4gICAgfSBlbHNlIGlmICh0eXBlID09IFwiY2xvc2VUYWdcIikge1xuICAgICAgcmV0dXJuIGNsb3NlVGFnTmFtZVN0YXRlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYmFzZVN0YXRlO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiB0YWdOYW1lU3RhdGUodHlwZSwgc3RyZWFtLCBzdGF0ZSkge1xuICAgIGlmICh0eXBlID09IFwid29yZFwiKSB7XG4gICAgICBzdGF0ZS50YWdOYW1lID0gc3RyZWFtLmN1cnJlbnQoKTtcbiAgICAgIHNldFN0eWxlID0gXCJ0YWdcIjtcbiAgICAgIHJldHVybiBhdHRyU3RhdGU7XG4gICAgfSBlbHNlIGlmIChjb25maWcuYWxsb3dNaXNzaW5nVGFnTmFtZSAmJiB0eXBlID09IFwiZW5kVGFnXCIpIHtcbiAgICAgIHNldFN0eWxlID0gXCJ0YWcgYnJhY2tldFwiO1xuICAgICAgcmV0dXJuIGF0dHJTdGF0ZSh0eXBlLCBzdHJlYW0sIHN0YXRlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2V0U3R5bGUgPSBcImVycm9yXCI7XG4gICAgICByZXR1cm4gdGFnTmFtZVN0YXRlO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBjbG9zZVRhZ05hbWVTdGF0ZSh0eXBlLCBzdHJlYW0sIHN0YXRlKSB7XG4gICAgaWYgKHR5cGUgPT0gXCJ3b3JkXCIpIHtcbiAgICAgIHZhciB0YWdOYW1lID0gc3RyZWFtLmN1cnJlbnQoKTtcbiAgICAgIGlmIChzdGF0ZS5jb250ZXh0ICYmIHN0YXRlLmNvbnRleHQudGFnTmFtZSAhPSB0YWdOYW1lICYmXG4gICAgICAgICAgY29uZmlnLmltcGxpY2l0bHlDbG9zZWQuaGFzT3duUHJvcGVydHkoc3RhdGUuY29udGV4dC50YWdOYW1lKSlcbiAgICAgICAgcG9wQ29udGV4dChzdGF0ZSk7XG4gICAgICBpZiAoKHN0YXRlLmNvbnRleHQgJiYgc3RhdGUuY29udGV4dC50YWdOYW1lID09IHRhZ05hbWUpIHx8IGNvbmZpZy5tYXRjaENsb3NpbmcgPT09IGZhbHNlKSB7XG4gICAgICAgIHNldFN0eWxlID0gXCJ0YWdcIjtcbiAgICAgICAgcmV0dXJuIGNsb3NlU3RhdGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRTdHlsZSA9IFwidGFnIGVycm9yXCI7XG4gICAgICAgIHJldHVybiBjbG9zZVN0YXRlRXJyO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY29uZmlnLmFsbG93TWlzc2luZ1RhZ05hbWUgJiYgdHlwZSA9PSBcImVuZFRhZ1wiKSB7XG4gICAgICBzZXRTdHlsZSA9IFwidGFnIGJyYWNrZXRcIjtcbiAgICAgIHJldHVybiBjbG9zZVN0YXRlKHR5cGUsIHN0cmVhbSwgc3RhdGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXRTdHlsZSA9IFwiZXJyb3JcIjtcbiAgICAgIHJldHVybiBjbG9zZVN0YXRlRXJyO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsb3NlU3RhdGUodHlwZSwgX3N0cmVhbSwgc3RhdGUpIHtcbiAgICBpZiAodHlwZSAhPSBcImVuZFRhZ1wiKSB7XG4gICAgICBzZXRTdHlsZSA9IFwiZXJyb3JcIjtcbiAgICAgIHJldHVybiBjbG9zZVN0YXRlO1xuICAgIH1cbiAgICBwb3BDb250ZXh0KHN0YXRlKTtcbiAgICByZXR1cm4gYmFzZVN0YXRlO1xuICB9XG4gIGZ1bmN0aW9uIGNsb3NlU3RhdGVFcnIodHlwZSwgc3RyZWFtLCBzdGF0ZSkge1xuICAgIHNldFN0eWxlID0gXCJlcnJvclwiO1xuICAgIHJldHVybiBjbG9zZVN0YXRlKHR5cGUsIHN0cmVhbSwgc3RhdGUpO1xuICB9XG5cbiAgZnVuY3Rpb24gYXR0clN0YXRlKHR5cGUsIF9zdHJlYW0sIHN0YXRlKSB7XG4gICAgaWYgKHR5cGUgPT0gXCJ3b3JkXCIpIHtcbiAgICAgIHNldFN0eWxlID0gXCJhdHRyaWJ1dGVcIjtcbiAgICAgIHJldHVybiBhdHRyRXFTdGF0ZTtcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT0gXCJlbmRUYWdcIiB8fCB0eXBlID09IFwic2VsZmNsb3NlVGFnXCIpIHtcbiAgICAgIHZhciB0YWdOYW1lID0gc3RhdGUudGFnTmFtZSwgdGFnU3RhcnQgPSBzdGF0ZS50YWdTdGFydDtcbiAgICAgIHN0YXRlLnRhZ05hbWUgPSBzdGF0ZS50YWdTdGFydCA9IG51bGw7XG4gICAgICBpZiAodHlwZSA9PSBcInNlbGZjbG9zZVRhZ1wiIHx8XG4gICAgICAgICAgY29uZmlnLmF1dG9TZWxmQ2xvc2Vycy5oYXNPd25Qcm9wZXJ0eSh0YWdOYW1lKSkge1xuICAgICAgICBtYXliZVBvcENvbnRleHQoc3RhdGUsIHRhZ05hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWF5YmVQb3BDb250ZXh0KHN0YXRlLCB0YWdOYW1lKTtcbiAgICAgICAgc3RhdGUuY29udGV4dCA9IG5ldyBDb250ZXh0KHN0YXRlLCB0YWdOYW1lLCB0YWdTdGFydCA9PSBzdGF0ZS5pbmRlbnRlZCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYmFzZVN0YXRlO1xuICAgIH1cbiAgICBzZXRTdHlsZSA9IFwiZXJyb3JcIjtcbiAgICByZXR1cm4gYXR0clN0YXRlO1xuICB9XG4gIGZ1bmN0aW9uIGF0dHJFcVN0YXRlKHR5cGUsIHN0cmVhbSwgc3RhdGUpIHtcbiAgICBpZiAodHlwZSA9PSBcImVxdWFsc1wiKSByZXR1cm4gYXR0clZhbHVlU3RhdGU7XG4gICAgaWYgKCFjb25maWcuYWxsb3dNaXNzaW5nKSBzZXRTdHlsZSA9IFwiZXJyb3JcIjtcbiAgICByZXR1cm4gYXR0clN0YXRlKHR5cGUsIHN0cmVhbSwgc3RhdGUpO1xuICB9XG4gIGZ1bmN0aW9uIGF0dHJWYWx1ZVN0YXRlKHR5cGUsIHN0cmVhbSwgc3RhdGUpIHtcbiAgICBpZiAodHlwZSA9PSBcInN0cmluZ1wiKSByZXR1cm4gYXR0ckNvbnRpbnVlZFN0YXRlO1xuICAgIGlmICh0eXBlID09IFwid29yZFwiICYmIGNvbmZpZy5hbGxvd1VucXVvdGVkKSB7c2V0U3R5bGUgPSBcInN0cmluZ1wiOyByZXR1cm4gYXR0clN0YXRlO31cbiAgICBzZXRTdHlsZSA9IFwiZXJyb3JcIjtcbiAgICByZXR1cm4gYXR0clN0YXRlKHR5cGUsIHN0cmVhbSwgc3RhdGUpO1xuICB9XG4gIGZ1bmN0aW9uIGF0dHJDb250aW51ZWRTdGF0ZSh0eXBlLCBzdHJlYW0sIHN0YXRlKSB7XG4gICAgaWYgKHR5cGUgPT0gXCJzdHJpbmdcIikgcmV0dXJuIGF0dHJDb250aW51ZWRTdGF0ZTtcbiAgICByZXR1cm4gYXR0clN0YXRlKHR5cGUsIHN0cmVhbSwgc3RhdGUpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzdGFydFN0YXRlOiBmdW5jdGlvbihiYXNlSW5kZW50KSB7XG4gICAgICB2YXIgc3RhdGUgPSB7dG9rZW5pemU6IGluVGV4dCxcbiAgICAgICAgICAgICAgICAgICBzdGF0ZTogYmFzZVN0YXRlLFxuICAgICAgICAgICAgICAgICAgIGluZGVudGVkOiBiYXNlSW5kZW50IHx8IDAsXG4gICAgICAgICAgICAgICAgICAgdGFnTmFtZTogbnVsbCwgdGFnU3RhcnQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgY29udGV4dDogbnVsbH1cbiAgICAgIGlmIChiYXNlSW5kZW50ICE9IG51bGwpIHN0YXRlLmJhc2VJbmRlbnQgPSBiYXNlSW5kZW50XG4gICAgICByZXR1cm4gc3RhdGVcbiAgICB9LFxuXG4gICAgdG9rZW46IGZ1bmN0aW9uKHN0cmVhbSwgc3RhdGUpIHtcbiAgICAgIGlmICghc3RhdGUudGFnTmFtZSAmJiBzdHJlYW0uc29sKCkpXG4gICAgICAgIHN0YXRlLmluZGVudGVkID0gc3RyZWFtLmluZGVudGF0aW9uKCk7XG5cbiAgICAgIGlmIChzdHJlYW0uZWF0U3BhY2UoKSkgcmV0dXJuIG51bGw7XG4gICAgICB0eXBlID0gbnVsbDtcbiAgICAgIHZhciBzdHlsZSA9IHN0YXRlLnRva2VuaXplKHN0cmVhbSwgc3RhdGUpO1xuICAgICAgaWYgKChzdHlsZSB8fCB0eXBlKSAmJiBzdHlsZSAhPSBcImNvbW1lbnRcIikge1xuICAgICAgICBzZXRTdHlsZSA9IG51bGw7XG4gICAgICAgIHN0YXRlLnN0YXRlID0gc3RhdGUuc3RhdGUodHlwZSB8fCBzdHlsZSwgc3RyZWFtLCBzdGF0ZSk7XG4gICAgICAgIGlmIChzZXRTdHlsZSlcbiAgICAgICAgICBzdHlsZSA9IHNldFN0eWxlID09IFwiZXJyb3JcIiA/IHN0eWxlICsgXCIgZXJyb3JcIiA6IHNldFN0eWxlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHN0eWxlO1xuICAgIH0sXG5cbiAgICBpbmRlbnQ6IGZ1bmN0aW9uKHN0YXRlLCB0ZXh0QWZ0ZXIsIGZ1bGxMaW5lKSB7XG4gICAgICB2YXIgY29udGV4dCA9IHN0YXRlLmNvbnRleHQ7XG4gICAgICAvLyBJbmRlbnQgbXVsdGktbGluZSBzdHJpbmdzIChlLmcuIGNzcykuXG4gICAgICBpZiAoc3RhdGUudG9rZW5pemUuaXNJbkF0dHJpYnV0ZSkge1xuICAgICAgICBpZiAoc3RhdGUudGFnU3RhcnQgPT0gc3RhdGUuaW5kZW50ZWQpXG4gICAgICAgICAgcmV0dXJuIHN0YXRlLnN0cmluZ1N0YXJ0Q29sICsgMTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBzdGF0ZS5pbmRlbnRlZCArIGluZGVudFVuaXQ7XG4gICAgICB9XG4gICAgICBpZiAoY29udGV4dCAmJiBjb250ZXh0Lm5vSW5kZW50KSByZXR1cm4gQ29kZU1pcnJvci5QYXNzO1xuICAgICAgaWYgKHN0YXRlLnRva2VuaXplICE9IGluVGFnICYmIHN0YXRlLnRva2VuaXplICE9IGluVGV4dClcbiAgICAgICAgcmV0dXJuIGZ1bGxMaW5lID8gZnVsbExpbmUubWF0Y2goL14oXFxzKikvKVswXS5sZW5ndGggOiAwO1xuICAgICAgLy8gSW5kZW50IHRoZSBzdGFydHMgb2YgYXR0cmlidXRlIG5hbWVzLlxuICAgICAgaWYgKHN0YXRlLnRhZ05hbWUpIHtcbiAgICAgICAgaWYgKGNvbmZpZy5tdWx0aWxpbmVUYWdJbmRlbnRQYXN0VGFnICE9PSBmYWxzZSlcbiAgICAgICAgICByZXR1cm4gc3RhdGUudGFnU3RhcnQgKyBzdGF0ZS50YWdOYW1lLmxlbmd0aCArIDI7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gc3RhdGUudGFnU3RhcnQgKyBpbmRlbnRVbml0ICogKGNvbmZpZy5tdWx0aWxpbmVUYWdJbmRlbnRGYWN0b3IgfHwgMSk7XG4gICAgICB9XG4gICAgICBpZiAoY29uZmlnLmFsaWduQ0RBVEEgJiYgLzwhXFxbQ0RBVEFcXFsvLnRlc3QodGV4dEFmdGVyKSkgcmV0dXJuIDA7XG4gICAgICB2YXIgdGFnQWZ0ZXIgPSB0ZXh0QWZ0ZXIgJiYgL148KFxcLyk/KFtcXHdfOlxcLi1dKikvLmV4ZWModGV4dEFmdGVyKTtcbiAgICAgIGlmICh0YWdBZnRlciAmJiB0YWdBZnRlclsxXSkgeyAvLyBDbG9zaW5nIHRhZyBzcG90dGVkXG4gICAgICAgIHdoaWxlIChjb250ZXh0KSB7XG4gICAgICAgICAgaWYgKGNvbnRleHQudGFnTmFtZSA9PSB0YWdBZnRlclsyXSkge1xuICAgICAgICAgICAgY29udGV4dCA9IGNvbnRleHQucHJldjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY29uZmlnLmltcGxpY2l0bHlDbG9zZWQuaGFzT3duUHJvcGVydHkoY29udGV4dC50YWdOYW1lKSkge1xuICAgICAgICAgICAgY29udGV4dCA9IGNvbnRleHQucHJldjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRhZ0FmdGVyKSB7IC8vIE9wZW5pbmcgdGFnIHNwb3R0ZWRcbiAgICAgICAgd2hpbGUgKGNvbnRleHQpIHtcbiAgICAgICAgICB2YXIgZ3JhYmJlcnMgPSBjb25maWcuY29udGV4dEdyYWJiZXJzW2NvbnRleHQudGFnTmFtZV07XG4gICAgICAgICAgaWYgKGdyYWJiZXJzICYmIGdyYWJiZXJzLmhhc093blByb3BlcnR5KHRhZ0FmdGVyWzJdKSlcbiAgICAgICAgICAgIGNvbnRleHQgPSBjb250ZXh0LnByZXY7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHdoaWxlIChjb250ZXh0ICYmIGNvbnRleHQucHJldiAmJiAhY29udGV4dC5zdGFydE9mTGluZSlcbiAgICAgICAgY29udGV4dCA9IGNvbnRleHQucHJldjtcbiAgICAgIGlmIChjb250ZXh0KSByZXR1cm4gY29udGV4dC5pbmRlbnQgKyBpbmRlbnRVbml0O1xuICAgICAgZWxzZSByZXR1cm4gc3RhdGUuYmFzZUluZGVudCB8fCAwO1xuICAgIH0sXG5cbiAgICBlbGVjdHJpY0lucHV0OiAvPFxcL1tcXHNcXHc6XSs+JC8sXG4gICAgYmxvY2tDb21tZW50U3RhcnQ6IFwiPCEtLVwiLFxuICAgIGJsb2NrQ29tbWVudEVuZDogXCItLT5cIixcblxuICAgIGNvbmZpZ3VyYXRpb246IGNvbmZpZy5odG1sTW9kZSA/IFwiaHRtbFwiIDogXCJ4bWxcIixcbiAgICBoZWxwZXJUeXBlOiBjb25maWcuaHRtbE1vZGUgPyBcImh0bWxcIiA6IFwieG1sXCIsXG5cbiAgICBza2lwQXR0cmlidXRlOiBmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgaWYgKHN0YXRlLnN0YXRlID09IGF0dHJWYWx1ZVN0YXRlKVxuICAgICAgICBzdGF0ZS5zdGF0ZSA9IGF0dHJTdGF0ZVxuICAgIH0sXG5cbiAgICB4bWxDdXJyZW50VGFnOiBmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgcmV0dXJuIHN0YXRlLnRhZ05hbWUgPyB7bmFtZTogc3RhdGUudGFnTmFtZSwgY2xvc2U6IHN0YXRlLnR5cGUgPT0gXCJjbG9zZVRhZ1wifSA6IG51bGxcbiAgICB9LFxuXG4gICAgeG1sQ3VycmVudENvbnRleHQ6IGZ1bmN0aW9uKHN0YXRlKSB7XG4gICAgICB2YXIgY29udGV4dCA9IFtdXG4gICAgICBmb3IgKHZhciBjeCA9IHN0YXRlLmNvbnRleHQ7IGN4OyBjeCA9IGN4LnByZXYpXG4gICAgICAgIGlmIChjeC50YWdOYW1lKSBjb250ZXh0LnB1c2goY3gudGFnTmFtZSlcbiAgICAgIHJldHVybiBjb250ZXh0LnJldmVyc2UoKVxuICAgIH1cbiAgfTtcbn0pO1xuXG5Db2RlTWlycm9yLmRlZmluZU1JTUUoXCJ0ZXh0L3htbFwiLCBcInhtbFwiKTtcbkNvZGVNaXJyb3IuZGVmaW5lTUlNRShcImFwcGxpY2F0aW9uL3htbFwiLCBcInhtbFwiKTtcbmlmICghQ29kZU1pcnJvci5taW1lTW9kZXMuaGFzT3duUHJvcGVydHkoXCJ0ZXh0L2h0bWxcIikpXG4gIENvZGVNaXJyb3IuZGVmaW5lTUlNRShcInRleHQvaHRtbFwiLCB7bmFtZTogXCJ4bWxcIiwgaHRtbE1vZGU6IHRydWV9KTtcblxufSk7XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9jb2RlbWlycm9yL21vZGUveG1sL3htbC5qc1xuLy8gbW9kdWxlIGlkID0gMTBcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwidmFyIGRhc2hib2FyZCA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvZGFzaGJvYXJkJyk7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uKCl7XG4gIHZhciBvcHRpb25zID0gZGFzaGJvYXJkLmRhdGFUYWJsZU9wdGlvbnM7XG4gIG9wdGlvbnMuZG9tID0gJzxcIm5ld2J1dHRvblwiPmZydGlwJztcbiAgZGFzaGJvYXJkLmluaXQob3B0aW9ucyk7XG5cbiAgJChcImRpdi5uZXdidXR0b25cIikuaHRtbCgnPGEgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1zdWNjZXNzXCIgaHJlZj1cIi9hZG1pbi9uZXdzdHVkZW50XCI+TmV3IFN0dWRlbnQ8L2E+Jyk7XG5cbiAgJCgnI3NhdmUnKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgIHZhciBkYXRhID0ge1xuICAgICAgZmlyc3RfbmFtZTogJCgnI2ZpcnN0X25hbWUnKS52YWwoKSxcbiAgICAgIGxhc3RfbmFtZTogJCgnI2xhc3RfbmFtZScpLnZhbCgpLFxuICAgICAgZW1haWw6ICQoJyNlbWFpbCcpLnZhbCgpLFxuICAgIH07XG4gICAgaWYoJCgnI2Fkdmlzb3JfaWQnKS52YWwoKSA+IDApe1xuICAgICAgZGF0YS5hZHZpc29yX2lkID0gJCgnI2Fkdmlzb3JfaWQnKS52YWwoKTtcbiAgICB9XG4gICAgaWYoJCgnI2RlcGFydG1lbnRfaWQnKS52YWwoKSA+IDApe1xuICAgICAgZGF0YS5kZXBhcnRtZW50X2lkID0gJCgnI2RlcGFydG1lbnRfaWQnKS52YWwoKTtcbiAgICB9XG4gICAgdmFyIGlkID0gJCgnI2lkJykudmFsKCk7XG4gICAgZGF0YS5laWQgPSAkKCcjZWlkJykudmFsKCk7XG4gICAgaWYoaWQubGVuZ3RoID09IDApe1xuICAgICAgdmFyIHVybCA9ICcvYWRtaW4vbmV3c3R1ZGVudCc7XG4gICAgfWVsc2V7XG4gICAgICB2YXIgdXJsID0gJy9hZG1pbi9zdHVkZW50cy8nICsgaWQ7XG4gICAgfVxuICAgIGRhc2hib2FyZC5hamF4c2F2ZShkYXRhLCB1cmwsIGlkKTtcbiAgfSk7XG5cbiAgJCgnI2RlbGV0ZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIHVybCA9IFwiL2FkbWluL2RlbGV0ZXN0dWRlbnRcIjtcbiAgICB2YXIgcmV0VXJsID0gXCIvYWRtaW4vc3R1ZGVudHNcIjtcbiAgICB2YXIgZGF0YSA9IHtcbiAgICAgIGlkOiAkKCcjaWQnKS52YWwoKSxcbiAgICB9O1xuICAgIGRhc2hib2FyZC5hamF4ZGVsZXRlKGRhdGEsIHVybCwgcmV0VXJsLCB0cnVlKTtcbiAgfSk7XG5cbiAgJCgnI2ZvcmNlZGVsZXRlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgdXJsID0gXCIvYWRtaW4vZm9yY2VkZWxldGVzdHVkZW50XCI7XG4gICAgdmFyIHJldFVybCA9IFwiL2FkbWluL3N0dWRlbnRzXCI7XG4gICAgdmFyIGRhdGEgPSB7XG4gICAgICBpZDogJCgnI2lkJykudmFsKCksXG4gICAgfTtcbiAgICBkYXNoYm9hcmQuYWpheGRlbGV0ZShkYXRhLCB1cmwsIHJldFVybCk7XG4gIH0pO1xuXG4gICQoJyNyZXN0b3JlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgdXJsID0gXCIvYWRtaW4vcmVzdG9yZXN0dWRlbnRcIjtcbiAgICB2YXIgcmV0VXJsID0gXCIvYWRtaW4vc3R1ZGVudHNcIjtcbiAgICB2YXIgZGF0YSA9IHtcbiAgICAgIGlkOiAkKCcjaWQnKS52YWwoKSxcbiAgICB9O1xuICAgIGRhc2hib2FyZC5hamF4cmVzdG9yZShkYXRhLCB1cmwsIHJldFVybCk7XG4gIH0pO1xufTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3N0dWRlbnRlZGl0LmpzIiwidmFyIGRhc2hib2FyZCA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvZGFzaGJvYXJkJyk7XG5yZXF1aXJlKCdjb2RlbWlycm9yJyk7XG5yZXF1aXJlKCdjb2RlbWlycm9yL21vZGUveG1sL3htbC5qcycpO1xucmVxdWlyZSgnc3VtbWVybm90ZScpO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbigpe1xuICB2YXIgb3B0aW9ucyA9IGRhc2hib2FyZC5kYXRhVGFibGVPcHRpb25zO1xuICBvcHRpb25zLmRvbSA9ICc8XCJuZXdidXR0b25cIj5mcnRpcCc7XG4gIGRhc2hib2FyZC5pbml0KG9wdGlvbnMpO1xuXG4gICQoXCJkaXYubmV3YnV0dG9uXCIpLmh0bWwoJzxhIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tc3VjY2Vzc1wiIGhyZWY9XCIvYWRtaW4vbmV3YWR2aXNvclwiPk5ldyBBZHZpc29yPC9hPicpO1xuXG4gICQoJyNub3RlcycpLnN1bW1lcm5vdGUoe1xuXHRcdGZvY3VzOiB0cnVlLFxuXHRcdHRvb2xiYXI6IFtcblx0XHRcdC8vIFtncm91cE5hbWUsIFtsaXN0IG9mIGJ1dHRvbnNdXVxuXHRcdFx0WydzdHlsZScsIFsnc3R5bGUnLCAnYm9sZCcsICdpdGFsaWMnLCAndW5kZXJsaW5lJywgJ2NsZWFyJ11dLFxuXHRcdFx0Wydmb250JywgWydzdHJpa2V0aHJvdWdoJywgJ3N1cGVyc2NyaXB0JywgJ3N1YnNjcmlwdCcsICdsaW5rJ11dLFxuXHRcdFx0WydwYXJhJywgWyd1bCcsICdvbCcsICdwYXJhZ3JhcGgnXV0sXG5cdFx0XHRbJ21pc2MnLCBbJ2Z1bGxzY3JlZW4nLCAnY29kZXZpZXcnLCAnaGVscCddXSxcblx0XHRdLFxuXHRcdHRhYnNpemU6IDIsXG5cdFx0Y29kZW1pcnJvcjoge1xuXHRcdFx0bW9kZTogJ3RleHQvaHRtbCcsXG5cdFx0XHRodG1sTW9kZTogdHJ1ZSxcblx0XHRcdGxpbmVOdW1iZXJzOiB0cnVlLFxuXHRcdFx0dGhlbWU6ICdtb25va2FpJ1xuXHRcdH0sXG5cdH0pO1xuXG5cbiAgJCgnI3NhdmUnKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgIHZhciBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgkKCdmb3JtJylbMF0pO1xuXHRcdGZvcm1EYXRhLmFwcGVuZChcIm5hbWVcIiwgJCgnI25hbWUnKS52YWwoKSk7XG5cdFx0Zm9ybURhdGEuYXBwZW5kKFwiZW1haWxcIiwgJCgnI2VtYWlsJykudmFsKCkpO1xuXHRcdGZvcm1EYXRhLmFwcGVuZChcIm9mZmljZVwiLCAkKCcjb2ZmaWNlJykudmFsKCkpO1xuXHRcdGZvcm1EYXRhLmFwcGVuZChcInBob25lXCIsICQoJyNwaG9uZScpLnZhbCgpKTtcblx0XHRmb3JtRGF0YS5hcHBlbmQoXCJub3Rlc1wiLCAkKCcjbm90ZXMnKS52YWwoKSk7XG4gICAgZm9ybURhdGEuYXBwZW5kKFwiaGlkZGVuXCIsICQoJyNoaWRkZW4nKS5pcygnOmNoZWNrZWQnKSA/IDEgOiAwKTtcblx0XHRpZigkKCcjcGljJykudmFsKCkpe1xuXHRcdFx0Zm9ybURhdGEuYXBwZW5kKFwicGljXCIsICQoJyNwaWMnKVswXS5maWxlc1swXSk7XG5cdFx0fVxuICAgIGlmKCQoJyNkZXBhcnRtZW50X2lkJykudmFsKCkgPiAwKXtcbiAgICAgIGZvcm1EYXRhLmFwcGVuZChcImRlcGFydG1lbnRfaWRcIiwgJCgnI2RlcGFydG1lbnRfaWQnKS52YWwoKSk7XG4gICAgfVxuICAgIHZhciBpZCA9ICQoJyNpZCcpLnZhbCgpO1xuICAgIGlmKGlkLmxlbmd0aCA9PSAwKXtcbiAgICAgIGZvcm1EYXRhLmFwcGVuZChcImVpZFwiLCAkKCcjZWlkJykudmFsKCkpO1xuICAgICAgdmFyIHVybCA9ICcvYWRtaW4vbmV3YWR2aXNvcic7XG4gICAgfWVsc2V7XG4gICAgICBmb3JtRGF0YS5hcHBlbmQoXCJlaWRcIiwgJCgnI2VpZCcpLnZhbCgpKTtcbiAgICAgIHZhciB1cmwgPSAnL2FkbWluL2Fkdmlzb3JzLycgKyBpZDtcbiAgICB9XG5cdFx0ZGFzaGJvYXJkLmFqYXhzYXZlKGZvcm1EYXRhLCB1cmwsIGlkLCB0cnVlKTtcbiAgfSk7XG5cbiAgJCgnI2RlbGV0ZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIHVybCA9IFwiL2FkbWluL2RlbGV0ZWFkdmlzb3JcIjtcbiAgICB2YXIgcmV0VXJsID0gXCIvYWRtaW4vYWR2aXNvcnNcIjtcbiAgICB2YXIgZGF0YSA9IHtcbiAgICAgIGlkOiAkKCcjaWQnKS52YWwoKSxcbiAgICB9O1xuICAgIGRhc2hib2FyZC5hamF4ZGVsZXRlKGRhdGEsIHVybCwgcmV0VXJsLCB0cnVlKTtcbiAgfSk7XG5cbiAgJCgnI2ZvcmNlZGVsZXRlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgdXJsID0gXCIvYWRtaW4vZm9yY2VkZWxldGVhZHZpc29yXCI7XG4gICAgdmFyIHJldFVybCA9IFwiL2FkbWluL2Fkdmlzb3JzXCI7XG4gICAgdmFyIGRhdGEgPSB7XG4gICAgICBpZDogJCgnI2lkJykudmFsKCksXG4gICAgfTtcbiAgICBkYXNoYm9hcmQuYWpheGRlbGV0ZShkYXRhLCB1cmwsIHJldFVybCk7XG4gIH0pO1xuXG4gICQoJyNyZXN0b3JlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgdXJsID0gXCIvYWRtaW4vcmVzdG9yZWFkdmlzb3JcIjtcbiAgICB2YXIgcmV0VXJsID0gXCIvYWRtaW4vYWR2aXNvcnNcIjtcbiAgICB2YXIgZGF0YSA9IHtcbiAgICAgIGlkOiAkKCcjaWQnKS52YWwoKSxcbiAgICB9O1xuICAgIGRhc2hib2FyZC5hamF4cmVzdG9yZShkYXRhLCB1cmwsIHJldFVybCk7XG4gIH0pO1xuXG4gICQoZG9jdW1lbnQpLm9uKCdjaGFuZ2UnLCAnLmJ0bi1maWxlIDpmaWxlJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGlucHV0ID0gJCh0aGlzKSxcbiAgICAgICAgbnVtRmlsZXMgPSBpbnB1dC5nZXQoMCkuZmlsZXMgPyBpbnB1dC5nZXQoMCkuZmlsZXMubGVuZ3RoIDogMSxcbiAgICAgICAgbGFiZWwgPSBpbnB1dC52YWwoKS5yZXBsYWNlKC9cXFxcL2csICcvJykucmVwbGFjZSgvLipcXC8vLCAnJyk7XG4gICAgaW5wdXQudHJpZ2dlcignZmlsZXNlbGVjdCcsIFtudW1GaWxlcywgbGFiZWxdKTtcbiAgfSk7XG5cbiAgJCgnLmJ0bi1maWxlIDpmaWxlJykub24oJ2ZpbGVzZWxlY3QnLCBmdW5jdGlvbihldmVudCwgbnVtRmlsZXMsIGxhYmVsKSB7XG5cbiAgICAgIHZhciBpbnB1dCA9ICQodGhpcykucGFyZW50cygnLmlucHV0LWdyb3VwJykuZmluZCgnOnRleHQnKSxcbiAgICAgICAgICBsb2cgPSBudW1GaWxlcyA+IDEgPyBudW1GaWxlcyArICcgZmlsZXMgc2VsZWN0ZWQnIDogbGFiZWw7XG5cbiAgICAgIGlmKCBpbnB1dC5sZW5ndGggKSB7XG4gICAgICAgICAgaW5wdXQudmFsKGxvZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmKCBsb2cgKSBhbGVydChsb2cpO1xuICAgICAgfVxuXG4gIH0pO1xuXG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9hZHZpc29yZWRpdC5qcyIsInZhciBkYXNoYm9hcmQgPSByZXF1aXJlKCcuLi8uLi91dGlsL2Rhc2hib2FyZCcpO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbigpe1xuICB2YXIgb3B0aW9ucyA9IGRhc2hib2FyZC5kYXRhVGFibGVPcHRpb25zO1xuICBvcHRpb25zLmRvbSA9ICc8XCJuZXdidXR0b25cIj5mcnRpcCc7XG4gIGRhc2hib2FyZC5pbml0KG9wdGlvbnMpO1xuXG4gICQoXCJkaXYubmV3YnV0dG9uXCIpLmh0bWwoJzxhIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tc3VjY2Vzc1wiIGhyZWY9XCIvYWRtaW4vbmV3ZGVwYXJ0bWVudFwiPk5ldyBEZXBhcnRtZW50PC9hPicpO1xuXG4gICQoJyNzYXZlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgZGF0YSA9IHtcbiAgICAgIG5hbWU6ICQoJyNuYW1lJykudmFsKCksXG4gICAgICBlbWFpbDogJCgnI2VtYWlsJykudmFsKCksXG4gICAgICBvZmZpY2U6ICQoJyNvZmZpY2UnKS52YWwoKSxcbiAgICAgIHBob25lOiAkKCcjcGhvbmUnKS52YWwoKSxcbiAgICB9O1xuICAgIHZhciBpZCA9ICQoJyNpZCcpLnZhbCgpO1xuICAgIGlmKGlkLmxlbmd0aCA9PSAwKXtcbiAgICAgIHZhciB1cmwgPSAnL2FkbWluL25ld2RlcGFydG1lbnQnO1xuICAgIH1lbHNle1xuICAgICAgdmFyIHVybCA9ICcvYWRtaW4vZGVwYXJ0bWVudHMvJyArIGlkO1xuICAgIH1cbiAgICBkYXNoYm9hcmQuYWpheHNhdmUoZGF0YSwgdXJsLCBpZCk7XG4gIH0pO1xuXG4gICQoJyNkZWxldGUnKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgIHZhciB1cmwgPSBcIi9hZG1pbi9kZWxldGVkZXBhcnRtZW50XCI7XG4gICAgdmFyIHJldFVybCA9IFwiL2FkbWluL2RlcGFydG1lbnRzXCI7XG4gICAgdmFyIGRhdGEgPSB7XG4gICAgICBpZDogJCgnI2lkJykudmFsKCksXG4gICAgfTtcbiAgICBkYXNoYm9hcmQuYWpheGRlbGV0ZShkYXRhLCB1cmwsIHJldFVybCwgdHJ1ZSk7XG4gIH0pO1xuXG4gICQoJyNmb3JjZWRlbGV0ZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIHVybCA9IFwiL2FkbWluL2ZvcmNlZGVsZXRlZGVwYXJ0bWVudFwiO1xuICAgIHZhciByZXRVcmwgPSBcIi9hZG1pbi9kZXBhcnRtZW50c1wiO1xuICAgIHZhciBkYXRhID0ge1xuICAgICAgaWQ6ICQoJyNpZCcpLnZhbCgpLFxuICAgIH07XG4gICAgZGFzaGJvYXJkLmFqYXhkZWxldGUoZGF0YSwgdXJsLCByZXRVcmwpO1xuICB9KTtcblxuICAkKCcjcmVzdG9yZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIHVybCA9IFwiL2FkbWluL3Jlc3RvcmVkZXBhcnRtZW50XCI7XG4gICAgdmFyIHJldFVybCA9IFwiL2FkbWluL2RlcGFydG1lbnRzXCI7XG4gICAgdmFyIGRhdGEgPSB7XG4gICAgICBpZDogJCgnI2lkJykudmFsKCksXG4gICAgfTtcbiAgICBkYXNoYm9hcmQuYWpheHJlc3RvcmUoZGF0YSwgdXJsLCByZXRVcmwpO1xuICB9KTtcblxufTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL2RlcGFydG1lbnRlZGl0LmpzIiwidmFyIGRhc2hib2FyZCA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvZGFzaGJvYXJkJyk7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uKCl7XG4gIHZhciBvcHRpb25zID0gZGFzaGJvYXJkLmRhdGFUYWJsZU9wdGlvbnM7XG4gIG9wdGlvbnMuZG9tID0gJzxcIm5ld2J1dHRvblwiPmZydGlwJztcbiAgZGFzaGJvYXJkLmluaXQob3B0aW9ucyk7XG5cbiAgJChcImRpdi5uZXdidXR0b25cIikuaHRtbCgnPGEgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1zdWNjZXNzXCIgaHJlZj1cIi9hZG1pbi9uZXdncm91cHNlc3Npb25saXN0XCI+TmV3IEdyb3Vwc2Vzc2lvbiBMaXN0PC9hPicpO1xuXG4gICQoJyNzYXZlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgZGF0YSA9IHtcbiAgICAgIG5hbWU6ICQoJyNuYW1lJykudmFsKCksXG4gICAgfTtcbiAgICB2YXIgaWQgPSAkKCcjaWQnKS52YWwoKTtcbiAgICBpZihpZC5sZW5ndGggPT0gMCl7XG4gICAgICB2YXIgdXJsID0gJy9hZG1pbi9uZXdncm91cHNlc3Npb25saXN0JztcbiAgICB9ZWxzZXtcbiAgICAgIHZhciB1cmwgPSAnL2FkbWluL2dyb3Vwc2Vzc2lvbmxpc3RzLycgKyBpZDtcbiAgICB9XG4gICAgZGFzaGJvYXJkLmFqYXhzYXZlKGRhdGEsIHVybCwgaWQpO1xuICB9KTtcblxuICAkKCcjZGVsZXRlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgdXJsID0gXCIvYWRtaW4vZGVsZXRlZ3JvdXBzZXNzaW9ubGlzdFwiO1xuICAgIHZhciByZXRVcmwgPSBcIi9hZG1pbi9ncm91cHNlc3Npb25saXN0c1wiO1xuICAgIHZhciBkYXRhID0ge1xuICAgICAgaWQ6ICQoJyNpZCcpLnZhbCgpLFxuICAgIH07XG4gICAgZGFzaGJvYXJkLmFqYXhkZWxldGUoZGF0YSwgdXJsLCByZXRVcmwsIHRydWUpO1xuICB9KTtcblxufTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL2dyb3Vwc2Vzc2lvbmxpc3RlZGl0LmpzIiwidmFyIGRhc2hib2FyZCA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvZGFzaGJvYXJkJyk7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uKCl7XG4gIHZhciBvcHRpb25zID0gZGFzaGJvYXJkLmRhdGFUYWJsZU9wdGlvbnM7XG4gIG9wdGlvbnMuZG9tID0gJzxcIm5ld2J1dHRvblwiPmZydGlwJztcbiAgZGFzaGJvYXJkLmluaXQob3B0aW9ucyk7XG5cbiAgJChcImRpdi5uZXdidXR0b25cIikuaHRtbCgnPGEgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1zdWNjZXNzXCIgaHJlZj1cIi9hZG1pbi9uZXdkZWdyZWVwcm9ncmFtXCI+TmV3IERlZ3JlZSBQcm9ncmFtPC9hPicpO1xuXG4gICQoJyNzYXZlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgZGF0YSA9IHtcbiAgICAgIG5hbWU6ICQoJyNuYW1lJykudmFsKCksXG4gICAgICBhYmJyZXZpYXRpb246ICQoJyNhYmJyZXZpYXRpb24nKS52YWwoKSxcbiAgICAgIGRlc2NyaXB0aW9uOiAkKCcjZGVzY3JpcHRpb24nKS52YWwoKSxcbiAgICAgIGVmZmVjdGl2ZV95ZWFyOiAkKCcjZWZmZWN0aXZlX3llYXInKS52YWwoKSxcbiAgICAgIGVmZmVjdGl2ZV9zZW1lc3RlcjogJCgnI2VmZmVjdGl2ZV9zZW1lc3RlcicpLnZhbCgpLFxuICAgIH07XG4gICAgaWYoJCgnI2RlcGFydG1lbnRfaWQnKS52YWwoKSA+IDApe1xuICAgICAgZGF0YS5kZXBhcnRtZW50X2lkID0gJCgnI2RlcGFydG1lbnRfaWQnKS52YWwoKTtcbiAgICB9XG4gICAgdmFyIGlkID0gJCgnI2lkJykudmFsKCk7XG4gICAgaWYoaWQubGVuZ3RoID09IDApe1xuICAgICAgdmFyIHVybCA9ICcvYWRtaW4vbmV3ZGVncmVlcHJvZ3JhbSc7XG4gICAgfWVsc2V7XG4gICAgICB2YXIgdXJsID0gJy9hZG1pbi9kZWdyZWVwcm9ncmFtcy8nICsgaWQ7XG4gICAgfVxuICAgIGRhc2hib2FyZC5hamF4c2F2ZShkYXRhLCB1cmwsIGlkKTtcbiAgfSk7XG5cbiAgJCgnI2RlbGV0ZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIHVybCA9IFwiL2FkbWluL2RlbGV0ZWRlZ3JlZXByb2dyYW1cIjtcbiAgICB2YXIgcmV0VXJsID0gXCIvYWRtaW4vZGVncmVlcHJvZ3JhbXNcIjtcbiAgICB2YXIgZGF0YSA9IHtcbiAgICAgIGlkOiAkKCcjaWQnKS52YWwoKSxcbiAgICB9O1xuICAgIGRhc2hib2FyZC5hamF4ZGVsZXRlKGRhdGEsIHVybCwgcmV0VXJsLCB0cnVlKTtcbiAgfSk7XG5cbiAgJCgnI2ZvcmNlZGVsZXRlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgdXJsID0gXCIvYWRtaW4vZm9yY2VkZWxldGVkZWdyZWVwcm9ncmFtXCI7XG4gICAgdmFyIHJldFVybCA9IFwiL2FkbWluL2RlZ3JlZXByb2dyYW1zXCI7XG4gICAgdmFyIGRhdGEgPSB7XG4gICAgICBpZDogJCgnI2lkJykudmFsKCksXG4gICAgfTtcbiAgICBkYXNoYm9hcmQuYWpheGRlbGV0ZShkYXRhLCB1cmwsIHJldFVybCk7XG4gIH0pO1xuXG4gICQoJyNyZXN0b3JlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgdXJsID0gXCIvYWRtaW4vcmVzdG9yZWRlZ3JlZXByb2dyYW1cIjtcbiAgICB2YXIgcmV0VXJsID0gXCIvYWRtaW4vZGVncmVlcHJvZ3JhbXNcIjtcbiAgICB2YXIgZGF0YSA9IHtcbiAgICAgIGlkOiAkKCcjaWQnKS52YWwoKSxcbiAgICB9O1xuICAgIGRhc2hib2FyZC5hamF4cmVzdG9yZShkYXRhLCB1cmwsIHJldFVybCk7XG4gIH0pO1xuXG59O1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvZGVncmVlcHJvZ3JhbWVkaXQuanMiLCJ2YXIgZGFzaGJvYXJkID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9kYXNoYm9hcmQnKTtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24oKXtcbiAgdmFyIG9wdGlvbnMgPSBkYXNoYm9hcmQuZGF0YVRhYmxlT3B0aW9ucztcbiAgb3B0aW9ucy5kb20gPSAnPFwibmV3YnV0dG9uXCI+ZnJ0aXAnO1xuICBkYXNoYm9hcmQuaW5pdChvcHRpb25zKTtcblxuICAkKFwiZGl2Lm5ld2J1dHRvblwiKS5odG1sKCc8YSB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLXN1Y2Nlc3NcIiBocmVmPVwiL2FkbWluL25ld2VsZWN0aXZlbGlzdFwiPk5ldyBFbGVjdGl2ZSBMaXN0PC9hPicpO1xuXG4gICQoJyNzYXZlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgZGF0YSA9IHtcbiAgICAgIG5hbWU6ICQoJyNuYW1lJykudmFsKCksXG4gICAgICBhYmJyZXZpYXRpb246ICQoJyNhYmJyZXZpYXRpb24nKS52YWwoKSxcbiAgICAgIGRlc2NyaXB0aW9uOiAkKCcjZGVzY3JpcHRpb24nKS52YWwoKSxcbiAgICB9O1xuICAgIHZhciBpZCA9ICQoJyNpZCcpLnZhbCgpO1xuICAgIGlmKGlkLmxlbmd0aCA9PSAwKXtcbiAgICAgIHZhciB1cmwgPSAnL2FkbWluL25ld2VsZWN0aXZlbGlzdCc7XG4gICAgfWVsc2V7XG4gICAgICB2YXIgdXJsID0gJy9hZG1pbi9lbGVjdGl2ZWxpc3RzLycgKyBpZDtcbiAgICB9XG4gICAgZGFzaGJvYXJkLmFqYXhzYXZlKGRhdGEsIHVybCwgaWQpO1xuICB9KTtcblxuICAkKCcjZGVsZXRlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgdXJsID0gXCIvYWRtaW4vZGVsZXRlZWxlY3RpdmVsaXN0XCI7XG4gICAgdmFyIHJldFVybCA9IFwiL2FkbWluL2VsZWN0aXZlbGlzdHNcIjtcbiAgICB2YXIgZGF0YSA9IHtcbiAgICAgIGlkOiAkKCcjaWQnKS52YWwoKSxcbiAgICB9O1xuICAgIGRhc2hib2FyZC5hamF4ZGVsZXRlKGRhdGEsIHVybCwgcmV0VXJsLCB0cnVlKTtcbiAgfSk7XG5cbiAgJCgnI2ZvcmNlZGVsZXRlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgdXJsID0gXCIvYWRtaW4vZm9yY2VkZWxldGVlbGVjdGl2ZWxpc3RcIjtcbiAgICB2YXIgcmV0VXJsID0gXCIvYWRtaW4vZWxlY3RpdmVsaXN0c1wiO1xuICAgIHZhciBkYXRhID0ge1xuICAgICAgaWQ6ICQoJyNpZCcpLnZhbCgpLFxuICAgIH07XG4gICAgZGFzaGJvYXJkLmFqYXhkZWxldGUoZGF0YSwgdXJsLCByZXRVcmwpO1xuICB9KTtcblxuICAkKCcjcmVzdG9yZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIHVybCA9IFwiL2FkbWluL3Jlc3RvcmVlbGVjdGl2ZWxpc3RcIjtcbiAgICB2YXIgcmV0VXJsID0gXCIvYWRtaW4vZWxlY3RpdmVsaXN0c1wiO1xuICAgIHZhciBkYXRhID0ge1xuICAgICAgaWQ6ICQoJyNpZCcpLnZhbCgpLFxuICAgIH07XG4gICAgZGFzaGJvYXJkLmFqYXhyZXN0b3JlKGRhdGEsIHVybCwgcmV0VXJsKTtcbiAgfSk7XG5cbn07XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9lbGVjdGl2ZWxpc3RlZGl0LmpzIiwidmFyIGRhc2hib2FyZCA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvZGFzaGJvYXJkJyk7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uKCl7XG4gIHZhciBvcHRpb25zID0gZGFzaGJvYXJkLmRhdGFUYWJsZU9wdGlvbnM7XG4gIG9wdGlvbnMuZG9tID0gJzxcIm5ld2J1dHRvblwiPmZydGlwJztcbiAgZGFzaGJvYXJkLmluaXQob3B0aW9ucyk7XG5cbiAgJChcImRpdi5uZXdidXR0b25cIikuaHRtbCgnPGEgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1zdWNjZXNzXCIgaHJlZj1cIi9hZG1pbi9uZXdwbGFuXCI+TmV3IFBsYW48L2E+Jyk7XG5cbiAgJCgnI3NhdmUnKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgIHZhciBkYXRhID0ge1xuICAgICAgbmFtZTogJCgnI25hbWUnKS52YWwoKSxcbiAgICAgIGRlc2NyaXB0aW9uOiAkKCcjZGVzY3JpcHRpb24nKS52YWwoKSxcbiAgICAgIHN0YXJ0X3llYXI6ICQoJyNzdGFydF95ZWFyJykudmFsKCksXG4gICAgICBzdGFydF9zZW1lc3RlcjogJCgnI3N0YXJ0X3NlbWVzdGVyJykudmFsKCksXG4gICAgICBkZWdyZWVwcm9ncmFtX2lkOiAkKCcjZGVncmVlcHJvZ3JhbV9pZCcpLnZhbCgpLFxuICAgICAgc3R1ZGVudF9pZDogJCgnI3N0dWRlbnRfaWQnKS52YWwoKSxcbiAgICB9O1xuICAgIHZhciBpZCA9ICQoJyNpZCcpLnZhbCgpO1xuICAgIGlmKGlkLmxlbmd0aCA9PSAwKXtcbiAgICAgIHZhciB1cmwgPSAnL2FkbWluL25ld3BsYW4nO1xuICAgIH1lbHNle1xuICAgICAgdmFyIHVybCA9ICcvYWRtaW4vcGxhbnMvJyArIGlkO1xuICAgIH1cbiAgICBkYXNoYm9hcmQuYWpheHNhdmUoZGF0YSwgdXJsLCBpZCk7XG4gIH0pO1xuXG4gICQoJyNkZWxldGUnKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgIHZhciB1cmwgPSBcIi9hZG1pbi9kZWxldGVwbGFuXCI7XG4gICAgdmFyIHJldFVybCA9IFwiL2FkbWluL3BsYW5zXCI7XG4gICAgdmFyIGRhdGEgPSB7XG4gICAgICBpZDogJCgnI2lkJykudmFsKCksXG4gICAgfTtcbiAgICBkYXNoYm9hcmQuYWpheGRlbGV0ZShkYXRhLCB1cmwsIHJldFVybCwgdHJ1ZSk7XG4gIH0pO1xuXG4gICQoJyNmb3JjZWRlbGV0ZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIHVybCA9IFwiL2FkbWluL2ZvcmNlZGVsZXRlcGxhblwiO1xuICAgIHZhciByZXRVcmwgPSBcIi9hZG1pbi9wbGFuc1wiO1xuICAgIHZhciBkYXRhID0ge1xuICAgICAgaWQ6ICQoJyNpZCcpLnZhbCgpLFxuICAgIH07XG4gICAgZGFzaGJvYXJkLmFqYXhkZWxldGUoZGF0YSwgdXJsLCByZXRVcmwpO1xuICB9KTtcblxuICAkKCcjcmVzdG9yZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIHVybCA9IFwiL2FkbWluL3Jlc3RvcmVwbGFuXCI7XG4gICAgdmFyIHJldFVybCA9IFwiL2FkbWluL3BsYW5zXCI7XG4gICAgdmFyIGRhdGEgPSB7XG4gICAgICBpZDogJCgnI2lkJykudmFsKCksXG4gICAgfTtcbiAgICBkYXNoYm9hcmQuYWpheHJlc3RvcmUoZGF0YSwgdXJsLCByZXRVcmwpO1xuICB9KTtcblxuICAkKCcjcmVwb3B1bGF0ZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIGNob2ljZSA9IGNvbmZpcm0oXCJBcmUgeW91IHN1cmU/IFRoaXMgd2lsbCBwZXJtYW5lbnRseSByZW1vdmUgYWxsIHJlcXVpcmVtZW50cyBhbmQgcmVwb3B1bGF0ZSB0aGVtIGJhc2VkIG9uIHRoZSBzZWxlY3RlZCBkZWdyZWUgcHJvZ3JhbS4gWW91IGNhbm5vdCB1bmRvIHRoaXMgYWN0aW9uLlwiKTtcbiAgXHRpZihjaG9pY2UgPT09IHRydWUpe1xuICAgICAgdmFyIHVybCA9IFwiL2FkbWluL3BvcHVsYXRlcGxhblwiO1xuICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgIGlkOiAkKCcjaWQnKS52YWwoKSxcbiAgICAgIH07XG4gICAgICBkYXNoYm9hcmQuYWpheHNhdmUoZGF0YSwgdXJsLCBpZCk7XG4gICAgfVxuICB9KVxuXG4gIGRhc2hib2FyZC5hamF4YXV0b2NvbXBsZXRlKCdzdHVkZW50X2lkJywgJy9wcm9maWxlL3N0dWRlbnRmZWVkJyk7XG5cbn07XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9wbGFuZWRpdC5qcyIsInZhciBkYXNoYm9hcmQgPSByZXF1aXJlKCcuLi8uLi91dGlsL2Rhc2hib2FyZCcpO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbigpe1xuXG4gIGRhc2hib2FyZC5pbml0KCk7XG5cbiAgJCgnI3NhdmUnKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgIHZhciBkYXRhID0ge1xuICAgICAgbmFtZTogJCgnI25hbWUnKS52YWwoKSxcbiAgICAgIG9yZGVyaW5nOiAkKCcjb3JkZXJpbmcnKS52YWwoKSxcbiAgICAgIHBsYW5faWQ6ICQoJyNwbGFuX2lkJykudmFsKCksXG4gICAgfTtcbiAgICB2YXIgaWQgPSAkKCcjaWQnKS52YWwoKTtcbiAgICBpZihpZC5sZW5ndGggPT0gMCl7XG4gICAgICB2YXIgdXJsID0gJy9hZG1pbi9wbGFucy9uZXdwbGFuc2VtZXN0ZXIvJyArICQoJyNwbGFuX2lkJykudmFsKCk7XG4gICAgfWVsc2V7XG4gICAgICB2YXIgdXJsID0gJy9hZG1pbi9wbGFucy9wbGFuc2VtZXN0ZXIvJyArIGlkO1xuICAgIH1cbiAgICBkYXNoYm9hcmQuYWpheHNhdmUoZGF0YSwgdXJsLCBpZCk7XG4gIH0pO1xuXG4gICQoJyNkZWxldGUnKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgIHZhciB1cmwgPSBcIi9hZG1pbi9wbGFucy9kZWxldGVwbGFuc2VtZXN0ZXIvXCIgKyAkKCcjaWQnKS52YWwoKSA7XG4gICAgdmFyIHJldFVybCA9IFwiL2FkbWluL3BsYW5zL1wiICsgJCgnI3BsYW5faWQnKS52YWwoKTtcbiAgICB2YXIgZGF0YSA9IHtcbiAgICAgIGlkOiAkKCcjaWQnKS52YWwoKSxcbiAgICB9O1xuICAgIGRhc2hib2FyZC5hamF4ZGVsZXRlKGRhdGEsIHVybCwgcmV0VXJsLCB0cnVlKTtcbiAgfSk7XG5cbn07XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9wbGFuc2VtZXN0ZXJlZGl0LmpzIiwidmFyIGRhc2hib2FyZCA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvZGFzaGJvYXJkJyk7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uKCl7XG4gIHZhciBvcHRpb25zID0gZGFzaGJvYXJkLmRhdGFUYWJsZU9wdGlvbnM7XG4gIG9wdGlvbnMuZG9tID0gJzxcIm5ld2J1dHRvblwiPmZydGlwJztcbiAgZGFzaGJvYXJkLmluaXQob3B0aW9ucyk7XG5cbiAgJChcImRpdi5uZXdidXR0b25cIikuaHRtbCgnPGEgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1zdWNjZXNzXCIgaHJlZj1cIi9hZG1pbi9uZXdjb21wbGV0ZWRjb3Vyc2VcIj5OZXcgQ29tcGxldGVkIENvdXJzZTwvYT4nKTtcblxuICAkKCcjc2F2ZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIGRhdGEgPSB7XG4gICAgICBjb3Vyc2VudW1iZXI6ICQoJyNjb3Vyc2VudW1iZXInKS52YWwoKSxcbiAgICAgIG5hbWU6ICQoJyNuYW1lJykudmFsKCksXG4gICAgICB5ZWFyOiAkKCcjeWVhcicpLnZhbCgpLFxuICAgICAgc2VtZXN0ZXI6ICQoJyNzZW1lc3RlcicpLnZhbCgpLFxuICAgICAgYmFzaXM6ICQoJyNiYXNpcycpLnZhbCgpLFxuICAgICAgZ3JhZGU6ICQoJyNncmFkZScpLnZhbCgpLFxuICAgICAgY3JlZGl0czogJCgnI2NyZWRpdHMnKS52YWwoKSxcbiAgICAgIGRlZ3JlZXByb2dyYW1faWQ6ICQoJyNkZWdyZWVwcm9ncmFtX2lkJykudmFsKCksXG4gICAgICBzdHVkZW50X2lkOiAkKCcjc3R1ZGVudF9pZCcpLnZhbCgpLFxuICAgIH07XG4gICAgaWYoJCgnI3N0dWRlbnRfaWQnKS52YWwoKSA+IDApe1xuICAgICAgZGF0YS5zdHVkZW50X2lkID0gJCgnI3N0dWRlbnRfaWQnKS52YWwoKTtcbiAgICB9XG4gICAgdmFyIHNlbGVjdGVkID0gJChcImlucHV0W25hbWU9J3RyYW5zZmVyJ106Y2hlY2tlZFwiKTtcbiAgICBpZiAoc2VsZWN0ZWQubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgc2VsZWN0ZWRWYWwgPSBzZWxlY3RlZC52YWwoKTtcbiAgICAgICAgaWYoc2VsZWN0ZWRWYWwgPT0gMSl7XG4gICAgICAgICAgZGF0YS50cmFuc2ZlciA9IGZhbHNlO1xuICAgICAgICB9ZWxzZSBpZihzZWxlY3RlZFZhbCA9PSAyKXtcbiAgICAgICAgICBkYXRhLnRyYW5zZmVyID0gdHJ1ZTtcbiAgICAgICAgICBkYXRhLmluY29taW5nX2luc3RpdHV0aW9uID0gJCgnI2luY29taW5nX2luc3RpdHV0aW9uJykudmFsKCk7XG4gICAgICAgICAgZGF0YS5pbmNvbWluZ19uYW1lID0gJCgnI2luY29taW5nX25hbWUnKS52YWwoKTtcbiAgICAgICAgICBkYXRhLmluY29taW5nX2Rlc2NyaXB0aW9uID0gJCgnI2luY29taW5nX2Rlc2NyaXB0aW9uJykudmFsKCk7XG4gICAgICAgICAgZGF0YS5pbmNvbWluZ19zZW1lc3RlciA9ICQoJyNpbmNvbWluZ19zZW1lc3RlcicpLnZhbCgpO1xuICAgICAgICAgIGRhdGEuaW5jb21pbmdfY3JlZGl0cyA9ICQoJyNpbmNvbWluZ19jcmVkaXRzJykudmFsKCk7XG4gICAgICAgICAgZGF0YS5pbmNvbWluZ19ncmFkZSA9ICQoJyNpbmNvbWluZ19ncmFkZScpLnZhbCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBpZCA9ICQoJyNpZCcpLnZhbCgpO1xuICAgIGlmKGlkLmxlbmd0aCA9PSAwKXtcbiAgICAgIHZhciB1cmwgPSAnL2FkbWluL25ld2NvbXBsZXRlZGNvdXJzZSc7XG4gICAgfWVsc2V7XG4gICAgICB2YXIgdXJsID0gJy9hZG1pbi9jb21wbGV0ZWRjb3Vyc2VzLycgKyBpZDtcbiAgICB9XG4gICAgZGFzaGJvYXJkLmFqYXhzYXZlKGRhdGEsIHVybCwgaWQpO1xuICB9KTtcblxuICAkKCcjZGVsZXRlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgdXJsID0gXCIvYWRtaW4vZGVsZXRlY29tcGxldGVkY291cnNlXCI7XG4gICAgdmFyIHJldFVybCA9IFwiL2FkbWluL2NvbXBsZXRlZGNvdXJzZXNcIjtcbiAgICB2YXIgZGF0YSA9IHtcbiAgICAgIGlkOiAkKCcjaWQnKS52YWwoKSxcbiAgICB9O1xuICAgIGRhc2hib2FyZC5hamF4ZGVsZXRlKGRhdGEsIHVybCwgcmV0VXJsKTtcbiAgfSk7XG5cbiAgJCgnaW5wdXRbbmFtZT10cmFuc2Zlcl0nKS5vbignY2hhbmdlJywgc2hvd3NlbGVjdGVkKTtcblxuICBkYXNoYm9hcmQuYWpheGF1dG9jb21wbGV0ZSgnc3R1ZGVudF9pZCcsICcvcHJvZmlsZS9zdHVkZW50ZmVlZCcpO1xuXG4gIGlmKCQoJyN0cmFuc2ZlcmNvdXJzZScpLmlzKCc6aGlkZGVuJykpe1xuICAgICQoJyN0cmFuc2ZlcjEnKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XG4gIH1lbHNle1xuICAgICQoJyN0cmFuc2ZlcjInKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XG4gIH1cblxufTtcblxuLyoqXG4gKiBEZXRlcm1pbmUgd2hpY2ggZGl2IHRvIHNob3cgaW4gdGhlIGZvcm1cbiAqL1xudmFyIHNob3dzZWxlY3RlZCA9IGZ1bmN0aW9uKCl7XG4gIC8vaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvODYyMjMzNi9qcXVlcnktZ2V0LXZhbHVlLW9mLXNlbGVjdGVkLXJhZGlvLWJ1dHRvblxuICB2YXIgc2VsZWN0ZWQgPSAkKFwiaW5wdXRbbmFtZT0ndHJhbnNmZXInXTpjaGVja2VkXCIpO1xuICBpZiAoc2VsZWN0ZWQubGVuZ3RoID4gMCkge1xuICAgICAgdmFyIHNlbGVjdGVkVmFsID0gc2VsZWN0ZWQudmFsKCk7XG4gICAgICBpZihzZWxlY3RlZFZhbCA9PSAxKXtcbiAgICAgICAgJCgnI2tzdGF0ZWNvdXJzZScpLnNob3coKTtcbiAgICAgICAgJCgnI3RyYW5zZmVyY291cnNlJykuaGlkZSgpO1xuICAgICAgfWVsc2UgaWYoc2VsZWN0ZWRWYWwgPT0gMil7XG4gICAgICAgICQoJyNrc3RhdGVjb3Vyc2UnKS5oaWRlKCk7XG4gICAgICAgICQoJyN0cmFuc2ZlcmNvdXJzZScpLnNob3coKTtcbiAgICAgIH1cbiAgfVxufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvY29tcGxldGVkY291cnNlZWRpdC5qcyIsInZhciBkYXNoYm9hcmQgPSByZXF1aXJlKCcuLi91dGlsL2Rhc2hib2FyZCcpO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbigpe1xuICAkKCcjc2F2ZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIGRhdGEgPSB7XG4gICAgICBuYW1lOiAkKCcjbmFtZScpLnZhbCgpLFxuICAgICAgZGVzY3JpcHRpb246ICQoJyNkZXNjcmlwdGlvbicpLnZhbCgpLFxuICAgICAgc3RhcnRfeWVhcjogJCgnI3N0YXJ0X3llYXInKS52YWwoKSxcbiAgICAgIHN0YXJ0X3NlbWVzdGVyOiAkKCcjc3RhcnRfc2VtZXN0ZXInKS52YWwoKSxcbiAgICAgIGRlZ3JlZXByb2dyYW1faWQ6ICQoJyNkZWdyZWVwcm9ncmFtX2lkJykudmFsKCksXG4gICAgfTtcbiAgICB2YXIgaWQgPSAkKCcjaWQnKS52YWwoKTtcbiAgICB2YXIgc3R1ZGVudF9pZCA9ICQoJyNzdHVkZW50X2lkJykudmFsKCk7XG4gICAgaWYoaWQubGVuZ3RoID09IDApe1xuICAgICAgdmFyIHVybCA9ICcvZmxvd2NoYXJ0cy9uZXcvJyArIHN0dWRlbnRfaWQ7XG4gICAgfWVsc2V7XG4gICAgICB2YXIgdXJsID0gJy9mbG93Y2hhcnRzL2VkaXQvJyArIGlkO1xuICAgIH1cbiAgICBkYXNoYm9hcmQuYWpheHNhdmUoZGF0YSwgdXJsLCBpZCk7XG4gIH0pO1xuXG4gICQoJyNkZWxldGUnKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgIHZhciBzdHVkZW50X2lkID0gJCgnI3N0dWRlbnRfaWQnKS52YWwoKTtcbiAgICB2YXIgdXJsID0gXCIvZmxvd2NoYXJ0cy9kZWxldGVcIjtcbiAgICB2YXIgcmV0VXJsID0gXCIvZmxvd2NoYXJ0cy9cIiArIHN0dWRlbnRfaWQ7XG4gICAgdmFyIGRhdGEgPSB7XG4gICAgICBpZDogJCgnI2lkJykudmFsKCksXG4gICAgfTtcbiAgICBkYXNoYm9hcmQuYWpheGRlbGV0ZShkYXRhLCB1cmwsIHJldFVybCwgdHJ1ZSk7XG4gIH0pO1xuXG4gICQoJyNyZXBvcHVsYXRlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgY2hvaWNlID0gY29uZmlybShcIkFyZSB5b3Ugc3VyZT8gVGhpcyB3aWxsIHBlcm1hbmVudGx5IHJlbW92ZSBhbGwgcmVxdWlyZW1lbnRzIGFuZCByZXBvcHVsYXRlIHRoZW0gYmFzZWQgb24gdGhlIHNlbGVjdGVkIGRlZ3JlZSBwcm9ncmFtLiBZb3UgY2Fubm90IHVuZG8gdGhpcyBhY3Rpb24uXCIpO1xuICBcdGlmKGNob2ljZSA9PT0gdHJ1ZSl7XG4gICAgICB2YXIgdXJsID0gXCIvZmxvd2NoYXJ0cy9yZXNldFwiO1xuICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgIGlkOiAkKCcjaWQnKS52YWwoKSxcbiAgICAgIH07XG4gICAgICBkYXNoYm9hcmQuYWpheHNhdmUoZGF0YSwgdXJsLCBpZCk7XG4gICAgfVxuICB9KVxufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9mbG93Y2hhcnRlZGl0LmpzIiwiLy9odHRwczovL2xhcmF2ZWwuY29tL2RvY3MvNS40L21peCN3b3JraW5nLXdpdGgtc2NyaXB0c1xuLy9odHRwczovL2FuZHktY2FydGVyLmNvbS9ibG9nL3Njb3BpbmctamF2YXNjcmlwdC1mdW5jdGlvbmFsaXR5LXRvLXNwZWNpZmljLXBhZ2VzLXdpdGgtbGFyYXZlbC1hbmQtY2FrZXBocFxuXG4vL0xvYWQgc2l0ZS13aWRlIGxpYnJhcmllcyBpbiBib290c3RyYXAgZmlsZVxucmVxdWlyZSgnLi9ib290c3RyYXAnKTtcblxudmFyIEFwcCA9IHtcblxuXHQvLyBDb250cm9sbGVyLWFjdGlvbiBtZXRob2RzXG5cdGFjdGlvbnM6IHtcblx0XHQvL0luZGV4IGZvciBkaXJlY3RseSBjcmVhdGVkIHZpZXdzIHdpdGggbm8gZXhwbGljaXQgY29udHJvbGxlclxuXHRcdFJvb3RSb3V0ZUNvbnRyb2xsZXI6IHtcblx0XHRcdGdldEluZGV4OiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGVkaXRhYmxlID0gcmVxdWlyZSgnLi91dGlsL2VkaXRhYmxlJyk7XG5cdFx0XHRcdGVkaXRhYmxlLmluaXQoKTtcblx0XHRcdFx0dmFyIHNpdGUgPSByZXF1aXJlKCcuL3V0aWwvc2l0ZScpO1xuXHRcdFx0XHRzaXRlLmNoZWNrTWVzc2FnZSgpO1xuXHRcdFx0fSxcblx0XHRcdGdldEFib3V0OiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGVkaXRhYmxlID0gcmVxdWlyZSgnLi91dGlsL2VkaXRhYmxlJyk7XG5cdFx0XHRcdGVkaXRhYmxlLmluaXQoKTtcblx0XHRcdFx0dmFyIHNpdGUgPSByZXF1aXJlKCcuL3V0aWwvc2l0ZScpO1xuXHRcdFx0XHRzaXRlLmNoZWNrTWVzc2FnZSgpO1xuXHRcdFx0fSxcbiAgICB9LFxuXG5cdFx0Ly9BZHZpc2luZyBDb250cm9sbGVyIGZvciByb3V0ZXMgYXQgL2FkdmlzaW5nXG5cdFx0QWR2aXNpbmdDb250cm9sbGVyOiB7XG5cdFx0XHQvL2FkdmlzaW5nL2luZGV4XG5cdFx0XHRnZXRJbmRleDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBjYWxlbmRhciA9IHJlcXVpcmUoJy4vcGFnZXMvY2FsZW5kYXInKTtcblx0XHRcdFx0Y2FsZW5kYXIuaW5pdCgpO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHQvL0dyb3Vwc2Vzc2lvbiBDb250cm9sbGVyIGZvciByb3V0ZXMgYXQgL2dyb3Vwc2Vzc2lvblxuICAgIEdyb3Vwc2Vzc2lvbkNvbnRyb2xsZXI6IHtcblx0XHRcdC8vZ3JvdXBzZXNzaW9uL2luZGV4XG4gICAgICBnZXRJbmRleDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlZGl0YWJsZSA9IHJlcXVpcmUoJy4vdXRpbC9lZGl0YWJsZScpO1xuXHRcdFx0XHRlZGl0YWJsZS5pbml0KCk7XG5cdFx0XHRcdHZhciBzaXRlID0gcmVxdWlyZSgnLi91dGlsL3NpdGUnKTtcblx0XHRcdFx0c2l0ZS5jaGVja01lc3NhZ2UoKTtcbiAgICAgIH0sXG5cdFx0XHQvL2dyb3Vwc2VzaW9uL2xpc3Rcblx0XHRcdGdldExpc3Q6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgZ3JvdXBzZXNzaW9uID0gcmVxdWlyZSgnLi9wYWdlcy9ncm91cHNlc3Npb24nKTtcblx0XHRcdFx0Z3JvdXBzZXNzaW9uLmluaXQoKTtcblx0XHRcdH0sXG5cdFx0fSxcblxuXHRcdC8vUHJvZmlsZXMgQ29udHJvbGxlciBmb3Igcm91dGVzIGF0IC9wcm9maWxlXG5cdFx0UHJvZmlsZXNDb250cm9sbGVyOiB7XG5cdFx0XHQvL3Byb2ZpbGUvaW5kZXhcblx0XHRcdGdldEluZGV4OiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIHByb2ZpbGUgPSByZXF1aXJlKCcuL3BhZ2VzL3Byb2ZpbGUnKTtcblx0XHRcdFx0cHJvZmlsZS5pbml0KCk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdC8vRGFzaGJvYXJkIENvbnRyb2xsZXIgZm9yIHJvdXRlcyBhdCAvYWRtaW4tbHRlXG5cdFx0RGFzaGJvYXJkQ29udHJvbGxlcjoge1xuXHRcdFx0Ly9hZG1pbi9pbmRleFxuXHRcdFx0Z2V0SW5kZXg6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgZGFzaGJvYXJkID0gcmVxdWlyZSgnLi91dGlsL2Rhc2hib2FyZCcpO1xuXHRcdFx0XHRkYXNoYm9hcmQuaW5pdCgpO1xuXHRcdFx0fSxcblx0XHR9LFxuXG5cdFx0U3R1ZGVudHNDb250cm9sbGVyOiB7XG5cdFx0XHQvL2FkbWluL3N0dWRlbnRzXG5cdFx0XHRnZXRTdHVkZW50czogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBzdHVkZW50ZWRpdCA9IHJlcXVpcmUoJy4vcGFnZXMvZGFzaGJvYXJkL3N0dWRlbnRlZGl0Jyk7XG5cdFx0XHRcdHN0dWRlbnRlZGl0LmluaXQoKTtcblx0XHRcdH0sXG5cdFx0XHQvL2FkbWluL25ld3N0dWRlbnRcblx0XHRcdGdldE5ld3N0dWRlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgc3R1ZGVudGVkaXQgPSByZXF1aXJlKCcuL3BhZ2VzL2Rhc2hib2FyZC9zdHVkZW50ZWRpdCcpO1xuXHRcdFx0XHRzdHVkZW50ZWRpdC5pbml0KCk7XG5cdFx0XHR9LFxuXHRcdH0sXG5cblx0XHRBZHZpc29yc0NvbnRyb2xsZXI6IHtcblx0XHRcdC8vYWRtaW4vYWR2aXNvcnNcblx0XHRcdGdldEFkdmlzb3JzOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGFkdmlzb3JlZGl0ID0gcmVxdWlyZSgnLi9wYWdlcy9kYXNoYm9hcmQvYWR2aXNvcmVkaXQnKTtcblx0XHRcdFx0YWR2aXNvcmVkaXQuaW5pdCgpO1xuXHRcdFx0fSxcblx0XHRcdC8vYWRtaW4vbmV3YWR2aXNvclxuXHRcdFx0Z2V0TmV3YWR2aXNvcjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBhZHZpc29yZWRpdCA9IHJlcXVpcmUoJy4vcGFnZXMvZGFzaGJvYXJkL2Fkdmlzb3JlZGl0Jyk7XG5cdFx0XHRcdGFkdmlzb3JlZGl0LmluaXQoKTtcblx0XHRcdH0sXG5cdFx0fSxcblxuXHRcdERlcGFydG1lbnRzQ29udHJvbGxlcjoge1xuXHRcdFx0Ly9hZG1pbi9kZXBhcnRtZW50c1xuXHRcdFx0Z2V0RGVwYXJ0bWVudHM6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgZGVwYXJ0bWVudGVkaXQgPSByZXF1aXJlKCcuL3BhZ2VzL2Rhc2hib2FyZC9kZXBhcnRtZW50ZWRpdCcpO1xuXHRcdFx0XHRkZXBhcnRtZW50ZWRpdC5pbml0KCk7XG5cdFx0XHR9LFxuXHRcdFx0Ly9hZG1pbi9uZXdkZXBhcnRtZW50XG5cdFx0XHRnZXROZXdkZXBhcnRtZW50OiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGRlcGFydG1lbnRlZGl0ID0gcmVxdWlyZSgnLi9wYWdlcy9kYXNoYm9hcmQvZGVwYXJ0bWVudGVkaXQnKTtcblx0XHRcdFx0ZGVwYXJ0bWVudGVkaXQuaW5pdCgpO1xuXHRcdFx0fSxcblx0XHR9LFxuXG5cdFx0R3JvdXBzZXNzaW9ubGlzdHNDb250cm9sbGVyOiB7XG5cdFx0XHQvL2FkbWluL2dyb3Vwc2Vzc2lvbmxpc3RzXG5cdFx0XHRnZXRHcm91cHNlc3Npb25saXN0czogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBncm91cHNlc3Npb25saXN0ZWRpdCA9IHJlcXVpcmUoJy4vcGFnZXMvZGFzaGJvYXJkL2dyb3Vwc2Vzc2lvbmxpc3RlZGl0LmpzJyk7XG5cdFx0XHRcdGdyb3Vwc2Vzc2lvbmxpc3RlZGl0LmluaXQoKTtcblx0XHRcdH0sXG5cdFx0XHQvL2FkbWluL25ld2dyb3Vwc2Vzc2lvbmxpc3Rcblx0XHRcdGdldE5ld2dyb3Vwc2Vzc2lvbmxpc3Q6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgZ3JvdXBzZXNzaW9ubGlzdGVkaXQgPSByZXF1aXJlKCcuL3BhZ2VzL2Rhc2hib2FyZC9ncm91cHNlc3Npb25saXN0ZWRpdC5qcycpO1xuXHRcdFx0XHRncm91cHNlc3Npb25saXN0ZWRpdC5pbml0KCk7XG5cdFx0XHR9LFxuXHRcdH0sXG5cblx0XHRNZWV0aW5nc0NvbnRyb2xsZXI6IHtcblx0XHRcdC8vYWRtaW4vbWVldGluZ3Ncblx0XHRcdGdldE1lZXRpbmdzOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIG1lZXRpbmdlZGl0ID0gcmVxdWlyZSgnLi9wYWdlcy9kYXNoYm9hcmQvbWVldGluZ2VkaXQnKTtcblx0XHRcdFx0bWVldGluZ2VkaXQuaW5pdCgpO1xuXHRcdFx0fSxcblx0XHR9LFxuXG5cdFx0QmxhY2tvdXRzQ29udHJvbGxlcjoge1xuXHRcdFx0Ly9hZG1pbi9ibGFja291dHNcblx0XHRcdGdldEJsYWNrb3V0czogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBibGFja291dGVkaXQgPSByZXF1aXJlKCcuL3BhZ2VzL2Rhc2hib2FyZC9ibGFja291dGVkaXQnKTtcblx0XHRcdFx0YmxhY2tvdXRlZGl0LmluaXQoKTtcblx0XHRcdH0sXG5cdFx0fSxcblxuXHRcdEdyb3Vwc2Vzc2lvbnNDb250cm9sbGVyOiB7XG5cdFx0XHQvL2FkbWluL2dyb3Vwc2Vzc2lvbnNcblx0XHRcdGdldEdyb3Vwc2Vzc2lvbnM6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgZ3JvdXBzZXNzaW9uZWRpdCA9IHJlcXVpcmUoJy4vcGFnZXMvZGFzaGJvYXJkL2dyb3Vwc2Vzc2lvbmVkaXQnKTtcblx0XHRcdFx0Z3JvdXBzZXNzaW9uZWRpdC5pbml0KCk7XG5cdFx0XHR9LFxuXHRcdH0sXG5cblx0XHRTZXR0aW5nc0NvbnRyb2xsZXI6IHtcblx0XHRcdC8vYWRtaW4vc2V0dGluZ3Ncblx0XHRcdGdldFNldHRpbmdzOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIHNldHRpbmdzID0gcmVxdWlyZSgnLi9wYWdlcy9kYXNoYm9hcmQvc2V0dGluZ3MnKTtcblx0XHRcdFx0c2V0dGluZ3MuaW5pdCgpO1xuXHRcdFx0fSxcblx0XHR9LFxuXG5cdFx0RGVncmVlcHJvZ3JhbXNDb250cm9sbGVyOiB7XG5cdFx0XHQvL2FkbWluL2RlZ3JlZXByb2dyYW1zXG5cdFx0XHRnZXREZWdyZWVwcm9ncmFtczogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBkZWdyZWVwcm9ncmFtZWRpdCA9IHJlcXVpcmUoJy4vcGFnZXMvZGFzaGJvYXJkL2RlZ3JlZXByb2dyYW1lZGl0Jyk7XG5cdFx0XHRcdGRlZ3JlZXByb2dyYW1lZGl0LmluaXQoKTtcblx0XHRcdH0sXG5cdFx0XHQvL2FkbWluL2RlZ3JlZXByb2dyYW0ve2lkfVxuXHRcdFx0Z2V0RGVncmVlcHJvZ3JhbURldGFpbDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBkZWdyZWVwcm9ncmFtZWRpdCA9IHJlcXVpcmUoJy4vcGFnZXMvZGFzaGJvYXJkL2RlZ3JlZXByb2dyYW1kZXRhaWwnKTtcblx0XHRcdFx0ZGVncmVlcHJvZ3JhbWVkaXQuaW5pdCgpO1xuXHRcdFx0fSxcblx0XHRcdC8vYWRtaW4vbmV3ZGVncmVlcHJvZ3JhbVxuXHRcdFx0Z2V0TmV3ZGVncmVlcHJvZ3JhbTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBkZWdyZWVwcm9ncmFtZWRpdCA9IHJlcXVpcmUoJy4vcGFnZXMvZGFzaGJvYXJkL2RlZ3JlZXByb2dyYW1lZGl0Jyk7XG5cdFx0XHRcdGRlZ3JlZXByb2dyYW1lZGl0LmluaXQoKTtcblx0XHRcdH0sXG5cdFx0fSxcblxuXHRcdEVsZWN0aXZlbGlzdHNDb250cm9sbGVyOiB7XG5cdFx0XHQvL2FkbWluL2RlZ3JlZXByb2dyYW1zXG5cdFx0XHRnZXRFbGVjdGl2ZWxpc3RzOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGVsZWN0aXZlbGlzdGVkaXQgPSByZXF1aXJlKCcuL3BhZ2VzL2Rhc2hib2FyZC9lbGVjdGl2ZWxpc3RlZGl0Jyk7XG5cdFx0XHRcdGVsZWN0aXZlbGlzdGVkaXQuaW5pdCgpO1xuXHRcdFx0fSxcblx0XHRcdC8vYWRtaW4vZGVncmVlcHJvZ3JhbS97aWR9XG5cdFx0XHRnZXRFbGVjdGl2ZWxpc3REZXRhaWw6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgZWxlY3RpdmVsaXN0ZWRpdCA9IHJlcXVpcmUoJy4vcGFnZXMvZGFzaGJvYXJkL2VsZWN0aXZlbGlzdGRldGFpbCcpO1xuXHRcdFx0XHRlbGVjdGl2ZWxpc3RlZGl0LmluaXQoKTtcblx0XHRcdH0sXG5cdFx0XHQvL2FkbWluL25ld2RlZ3JlZXByb2dyYW1cblx0XHRcdGdldE5ld2VsZWN0aXZlbGlzdDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBlbGVjdGl2ZWxpc3RlZGl0ID0gcmVxdWlyZSgnLi9wYWdlcy9kYXNoYm9hcmQvZWxlY3RpdmVsaXN0ZWRpdCcpO1xuXHRcdFx0XHRlbGVjdGl2ZWxpc3RlZGl0LmluaXQoKTtcblx0XHRcdH0sXG5cdFx0fSxcblxuXHRcdFBsYW5zQ29udHJvbGxlcjoge1xuXHRcdFx0Ly9hZG1pbi9wbGFuc1xuXHRcdFx0Z2V0UGxhbnM6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgcGxhbmVkaXQgPSByZXF1aXJlKCcuL3BhZ2VzL2Rhc2hib2FyZC9wbGFuZWRpdCcpO1xuXHRcdFx0XHRwbGFuZWRpdC5pbml0KCk7XG5cdFx0XHR9LFxuXHRcdFx0Ly9hZG1pbi9wbGFuL3tpZH1cblx0XHRcdGdldFBsYW5EZXRhaWw6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgcGxhbmRldGFpbCA9IHJlcXVpcmUoJy4vcGFnZXMvZGFzaGJvYXJkL3BsYW5kZXRhaWwnKTtcblx0XHRcdFx0cGxhbmRldGFpbC5pbml0KCk7XG5cdFx0XHR9LFxuXHRcdFx0Ly9hZG1pbi9uZXdwbGFuXG5cdFx0XHRnZXROZXdwbGFuOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIHBsYW5lZGl0ID0gcmVxdWlyZSgnLi9wYWdlcy9kYXNoYm9hcmQvcGxhbmVkaXQnKTtcblx0XHRcdFx0cGxhbmVkaXQuaW5pdCgpO1xuXHRcdFx0fSxcblx0XHR9LFxuXG5cdFx0UGxhbnNlbWVzdGVyc0NvbnRyb2xsZXI6IHtcblx0XHRcdC8vYWRtaW4vcGxhbnNlbWVzdGVyXG5cdFx0XHRnZXRQbGFuU2VtZXN0ZXI6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgcGxhbnNlbWVzdGVyZWRpdCA9IHJlcXVpcmUoJy4vcGFnZXMvZGFzaGJvYXJkL3BsYW5zZW1lc3RlcmVkaXQnKTtcblx0XHRcdFx0cGxhbnNlbWVzdGVyZWRpdC5pbml0KCk7XG5cdFx0XHR9LFxuXHRcdFx0Ly9hZG1pbi9uZXdwbGFuc2VtZXN0ZXJcblx0XHRcdGdldE5ld1BsYW5TZW1lc3RlcjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBwbGFuc2VtZXN0ZXJlZGl0ID0gcmVxdWlyZSgnLi9wYWdlcy9kYXNoYm9hcmQvcGxhbnNlbWVzdGVyZWRpdCcpO1xuXHRcdFx0XHRwbGFuc2VtZXN0ZXJlZGl0LmluaXQoKTtcblx0XHRcdH0sXG5cdFx0fSxcblxuXHRcdENvbXBsZXRlZGNvdXJzZXNDb250cm9sbGVyOiB7XG5cdFx0XHQvL2FkbWluL2NvbXBsZXRlZGNvdXJzZXNcblx0XHRcdGdldENvbXBsZXRlZGNvdXJzZXM6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgY29tcGxldGVkY291cnNlZWRpdCA9IHJlcXVpcmUoJy4vcGFnZXMvZGFzaGJvYXJkL2NvbXBsZXRlZGNvdXJzZWVkaXQnKTtcblx0XHRcdFx0Y29tcGxldGVkY291cnNlZWRpdC5pbml0KCk7XG5cdFx0XHR9LFxuXHRcdFx0Ly9hZG1pbi9uZXdjb21wbGV0ZWRjb3Vyc2Vcblx0XHRcdGdldE5ld2NvbXBsZXRlZGNvdXJzZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBjb21wbGV0ZWRjb3Vyc2VlZGl0ID0gcmVxdWlyZSgnLi9wYWdlcy9kYXNoYm9hcmQvY29tcGxldGVkY291cnNlZWRpdCcpO1xuXHRcdFx0XHRjb21wbGV0ZWRjb3Vyc2VlZGl0LmluaXQoKTtcblx0XHRcdH0sXG5cdFx0fSxcblxuXHRcdEZsb3djaGFydHNDb250cm9sbGVyOiB7XG5cdFx0XHQvL2Zsb3djaGFydHMvdmlldy9cblx0XHRcdGdldEZsb3djaGFydDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBmbG93Y2hhcnQgPSByZXF1aXJlKCcuL3BhZ2VzL2Zsb3djaGFydCcpO1xuXHRcdFx0XHRmbG93Y2hhcnQuaW5pdCgpO1xuXHRcdFx0fSxcblx0XHRcdGdldEluZGV4OiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGZsb3djaGFydCA9IHJlcXVpcmUoJy4vcGFnZXMvZmxvd2NoYXJ0bGlzdCcpO1xuXHRcdFx0XHRmbG93Y2hhcnQuaW5pdCgpO1xuXHRcdFx0fSxcblx0XHRcdG5ld0Zsb3djaGFydDogZnVuY3Rpb24oKXtcblx0XHRcdFx0dmFyIGZsb3djaGFydCA9IHJlcXVpcmUoJy4vcGFnZXMvZmxvd2NoYXJ0ZWRpdCcpO1xuXHRcdFx0XHRmbG93Y2hhcnQuaW5pdCgpO1xuXHRcdFx0fSxcblx0XHRcdGVkaXRGbG93Y2hhcnQ6IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHZhciBmbG93Y2hhcnQgPSByZXF1aXJlKCcuL3BhZ2VzL2Zsb3djaGFydGVkaXQnKTtcblx0XHRcdFx0Zmxvd2NoYXJ0LmluaXQoKTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdH0sXG5cblx0Ly9GdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCBieSB0aGUgcGFnZSBhdCBsb2FkLiBEZWZpbmVkIGluIHJlc291cmNlcy92aWV3cy9pbmNsdWRlcy9zY3JpcHRzLmJsYWRlLnBocFxuXHQvL2FuZCBBcHAvSHR0cC9WaWV3Q29tcG9zZXJzL0phdmFzY3JpcHQgQ29tcG9zZXJcblx0Ly9TZWUgbGlua3MgYXQgdG9wIG9mIGZpbGUgZm9yIGRlc2NyaXB0aW9uIG9mIHdoYXQncyBnb2luZyBvbiBoZXJlXG5cdC8vQXNzdW1lcyAyIGlucHV0cyAtIHRoZSBjb250cm9sbGVyIGFuZCBhY3Rpb24gdGhhdCBjcmVhdGVkIHRoaXMgcGFnZVxuXHRpbml0OiBmdW5jdGlvbihjb250cm9sbGVyLCBhY3Rpb24pIHtcblx0XHRpZiAodHlwZW9mIHRoaXMuYWN0aW9uc1tjb250cm9sbGVyXSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHRoaXMuYWN0aW9uc1tjb250cm9sbGVyXVthY3Rpb25dICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0Ly9jYWxsIHRoZSBtYXRjaGluZyBmdW5jdGlvbiBpbiB0aGUgYXJyYXkgYWJvdmVcblx0XHRcdHJldHVybiBBcHAuYWN0aW9uc1tjb250cm9sbGVyXVthY3Rpb25dKCk7XG5cdFx0fVxuXHR9LFxufTtcblxuLy9CaW5kIHRvIHRoZSB3aW5kb3dcbndpbmRvdy5BcHAgPSBBcHA7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2FwcC5qcyIsIndpbmRvdy5fID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbi8qKlxuICogV2UnbGwgbG9hZCBqUXVlcnkgYW5kIHRoZSBCb290c3RyYXAgalF1ZXJ5IHBsdWdpbiB3aGljaCBwcm92aWRlcyBzdXBwb3J0XG4gKiBmb3IgSmF2YVNjcmlwdCBiYXNlZCBCb290c3RyYXAgZmVhdHVyZXMgc3VjaCBhcyBtb2RhbHMgYW5kIHRhYnMuIFRoaXNcbiAqIGNvZGUgbWF5IGJlIG1vZGlmaWVkIHRvIGZpdCB0aGUgc3BlY2lmaWMgbmVlZHMgb2YgeW91ciBhcHBsaWNhdGlvbi5cbiAqL1xuXG53aW5kb3cuJCA9IHdpbmRvdy5qUXVlcnkgPSByZXF1aXJlKCdqcXVlcnknKTtcblxucmVxdWlyZSgnYm9vdHN0cmFwJyk7XG5cbi8qKlxuICogV2UnbGwgbG9hZCB0aGUgYXhpb3MgSFRUUCBsaWJyYXJ5IHdoaWNoIGFsbG93cyB1cyB0byBlYXNpbHkgaXNzdWUgcmVxdWVzdHNcbiAqIHRvIG91ciBMYXJhdmVsIGJhY2stZW5kLiBUaGlzIGxpYnJhcnkgYXV0b21hdGljYWxseSBoYW5kbGVzIHNlbmRpbmcgdGhlXG4gKiBDU1JGIHRva2VuIGFzIGEgaGVhZGVyIGJhc2VkIG9uIHRoZSB2YWx1ZSBvZiB0aGUgXCJYU1JGXCIgdG9rZW4gY29va2llLlxuICovXG5cbndpbmRvdy5heGlvcyA9IHJlcXVpcmUoJ2F4aW9zJyk7XG5cbi8vaHR0cHM6Ly9naXRodWIuY29tL3JhcHBhc29mdC9sYXJhdmVsLTUtYm9pbGVycGxhdGUvYmxvYi9tYXN0ZXIvcmVzb3VyY2VzL2Fzc2V0cy9qcy9ib290c3RyYXAuanNcbndpbmRvdy5heGlvcy5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnWC1SZXF1ZXN0ZWQtV2l0aCddID0gJ1hNTEh0dHBSZXF1ZXN0JztcblxuLyoqXG4gKiBOZXh0IHdlIHdpbGwgcmVnaXN0ZXIgdGhlIENTUkYgVG9rZW4gYXMgYSBjb21tb24gaGVhZGVyIHdpdGggQXhpb3Mgc28gdGhhdFxuICogYWxsIG91dGdvaW5nIEhUVFAgcmVxdWVzdHMgYXV0b21hdGljYWxseSBoYXZlIGl0IGF0dGFjaGVkLiBUaGlzIGlzIGp1c3RcbiAqIGEgc2ltcGxlIGNvbnZlbmllbmNlIHNvIHdlIGRvbid0IGhhdmUgdG8gYXR0YWNoIGV2ZXJ5IHRva2VuIG1hbnVhbGx5LlxuICovXG5cbmxldCB0b2tlbiA9IGRvY3VtZW50LmhlYWQucXVlcnlTZWxlY3RvcignbWV0YVtuYW1lPVwiY3NyZi10b2tlblwiXScpO1xuXG5pZiAodG9rZW4pIHtcbiAgICB3aW5kb3cuYXhpb3MuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ1gtQ1NSRi1UT0tFTiddID0gdG9rZW4uY29udGVudDtcbn0gZWxzZSB7XG4gICAgY29uc29sZS5lcnJvcignQ1NSRiB0b2tlbiBub3QgZm91bmQ6IGh0dHBzOi8vbGFyYXZlbC5jb20vZG9jcy9jc3JmI2NzcmYteC1jc3JmLXRva2VuJyk7XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2Jvb3RzdHJhcC5qcyIsIi8vbG9hZCByZXF1aXJlZCBsaWJyYXJpZXNcbnZhciBzaXRlID0gcmVxdWlyZSgnLi4vdXRpbC9zaXRlJyk7XG5yZXF1aXJlKCdhZG1pbi1sdGUnKTtcbnJlcXVpcmUoJ2RhdGF0YWJsZXMubmV0Jyk7XG5yZXF1aXJlKCdkYXRhdGFibGVzLm5ldC1icycpO1xucmVxdWlyZSgnZGV2YnJpZGdlLWF1dG9jb21wbGV0ZScpO1xuXG4vL29wdGlvbnMgZm9yIGRhdGF0YWJsZXNcbmV4cG9ydHMuZGF0YVRhYmxlT3B0aW9ucyA9IHtcbiAgXCJwYWdlTGVuZ3RoXCI6IDUwLFxuICBcImxlbmd0aENoYW5nZVwiOiBmYWxzZSxcbn1cblxuLyoqXG4gKiBJbml0aWFsaXphdGlvbiBmdW5jdGlvblxuICogbXVzdCBiZSBjYWxsZWQgZXhwbGljaXRseSBvbiBhbGwgZGF0YXRhYmxlcyBwYWdlc1xuICpcbiAqIEBwYXJhbSBvcHRpb25zIC0gY3VzdG9tIGRhdGF0YWJsZXMgb3B0aW9uc1xuICovXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbihvcHRpb25zKXtcbiAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IGV4cG9ydHMuZGF0YVRhYmxlT3B0aW9ucyk7XG4gICQoJyN0YWJsZScpLkRhdGFUYWJsZShvcHRpb25zKTtcbiAgc2l0ZS5jaGVja01lc3NhZ2UoKTtcblxuICAkKCcjYWRtaW5sdGUtdG9nZ2xlbWVudScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgJCgnYm9keScpLnRvZ2dsZUNsYXNzKCdzaWRlYmFyLW9wZW4nKTtcbiAgfSk7XG59XG5cbi8qKlxuICogRnVuY3Rpb24gc2F2ZSB2aWEgQUpBWFxuICpcbiAqIEBwYXJhbSBkYXRhIC0gdGhlIGRhdGEgdG8gc2F2ZVxuICogQHBhcmFtIHVybCAtIHRoZSB1cmwgdG8gc2VuZCBkYXRhIHRvXG4gKiBAcGFyYW0gaWQgLSB0aGUgaWQgb2YgdGhlIGl0ZW0gdG8gYmUgc2F2ZS1kZXZcbiAqIEBwYXJhbSBsb2FkcGljdHVyZSAtIHRydWUgdG8gcmVsb2FkIGEgcHJvZmlsZSBwaWN0dXJlXG4gKi9cbmV4cG9ydHMuYWpheHNhdmUgPSBmdW5jdGlvbihkYXRhLCB1cmwsIGlkLCBsb2FkcGljdHVyZSl7XG4gIGxvYWRwaWN0dXJlIHx8IChsb2FkcGljdHVyZSA9IGZhbHNlKTtcbiAgJCgnI3NwaW4nKS5yZW1vdmVDbGFzcygnaGlkZS1zcGluJyk7XG4gIHdpbmRvdy5heGlvcy5wb3N0KHVybCwgZGF0YSlcbiAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICBzaXRlLmNsZWFyRm9ybUVycm9ycygpO1xuICAgICAgJCgnI3NwaW4nKS5hZGRDbGFzcygnaGlkZS1zcGluJyk7XG4gICAgICBpZihpZC5sZW5ndGggPT0gMCl7XG4gICAgICAgICQobG9jYXRpb24pLmF0dHIoJ2hyZWYnLCByZXNwb25zZS5kYXRhKTtcbiAgICAgIH1lbHNle1xuICAgICAgICBzaXRlLmRpc3BsYXlNZXNzYWdlKHJlc3BvbnNlLmRhdGEsIFwic3VjY2Vzc1wiKTtcbiAgICAgICAgaWYobG9hZHBpY3R1cmUpIGV4cG9ydHMubG9hZHBpY3R1cmUoaWQpO1xuICAgICAgfVxuICAgIH0pXG4gICAgLmNhdGNoKGZ1bmN0aW9uKGVycm9yKXtcbiAgICAgIHNpdGUuaGFuZGxlRXJyb3IoJ3NhdmUnLCAnIycsIGVycm9yKVxuICAgIH0pO1xufVxuXG4vKipcbiAqIEZ1bmN0aW9uIHNhdmUgdmlhIEFKQVggb24gbW9kYWwgZm9ybVxuICpcbiAqIEBwYXJhbSBkYXRhIC0gdGhlIGRhdGEgdG8gc2F2ZVxuICogQHBhcmFtIHVybCAtIHRoZSB1cmwgdG8gc2VuZCBkYXRhIHRvXG4gKiBAcGFyYW0gZWxlbWVudCAtIHRoZSBtb2RhbCBlbGVtZW50IHRvIGNsb3NlXG4gKi9cbmV4cG9ydHMuYWpheG1vZGFsc2F2ZSA9IGZ1bmN0aW9uKGRhdGEsIHVybCwgZWxlbWVudCl7XG4gICQoJyNzcGluJykucmVtb3ZlQ2xhc3MoJ2hpZGUtc3BpbicpO1xuICB3aW5kb3cuYXhpb3MucG9zdCh1cmwsIGRhdGEpXG4gICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgc2l0ZS5jbGVhckZvcm1FcnJvcnMoKTtcbiAgICAgICQoJyNzcGluJykuYWRkQ2xhc3MoJ2hpZGUtc3BpbicpO1xuICAgICAgJChlbGVtZW50KS5tb2RhbCgnaGlkZScpO1xuICAgICAgJCgnI3RhYmxlJykuRGF0YVRhYmxlKCkuYWpheC5yZWxvYWQoKTtcbiAgICAgIHNpdGUuZGlzcGxheU1lc3NhZ2UocmVzcG9uc2UuZGF0YSwgXCJzdWNjZXNzXCIpO1xuICAgIH0pXG4gICAgLmNhdGNoKGZ1bmN0aW9uKGVycm9yKXtcbiAgICAgIHNpdGUuaGFuZGxlRXJyb3IoJ3NhdmUnLCAnIycsIGVycm9yKVxuICAgIH0pO1xufVxuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGxvYWQgYSBwaWN0dXJlIHZpYSBBSkFYXG4gKlxuICogQHBhcmFtIGlkIC0gdGhlIHVzZXIgSUQgb2YgdGhlIHBpY3R1cmUgdG8gcmVsb2FkXG4gKi9cbmV4cG9ydHMubG9hZHBpY3R1cmUgPSBmdW5jdGlvbihpZCl7XG4gIHdpbmRvdy5heGlvcy5nZXQoJy9wcm9maWxlL3BpYy8nICsgaWQpXG4gICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgJCgnI3BpY3RleHQnKS52YWwocmVzcG9uc2UuZGF0YSk7XG4gICAgICAkKCcjcGljaW1nJykuYXR0cignc3JjJywgcmVzcG9uc2UuZGF0YSk7XG4gICAgfSlcbiAgICAuY2F0Y2goZnVuY3Rpb24oZXJyb3Ipe1xuICAgICAgc2l0ZS5oYW5kbGVFcnJvcigncmV0cmlldmUgcGljdHVyZScsICcnLCBlcnJvcik7XG4gICAgfSlcbn1cblxuLyoqXG4gKiBGdW5jdGlvbiB0byBkZWxldGUgYW4gaXRlbVxuICpcbiAqIEBwYXJhbSBkYXRhIC0gdGhlIGRhdGEgY29udGFpbmluZyB0aGUgaXRlbSB0byBkZWxldGVcbiAqIEBwYXJhbSB1cmwgLSB0aGUgVVJMIHRvIHNlbmQgdGhlIGRhdGEgdG9cbiAqIEBwYXJhbSByZXRVcmwgLSB0aGUgVVJMIHRvIHJldHVybiB0byBhZnRlciBkZWxldGVcbiAqIEBwYXJhbSBzb2Z0IC0gYm9vbGVhbiBpZiB0aGlzIGlzIGEgc29mdCBkZWxldGUgb3Igbm90XG4gKi9cbmV4cG9ydHMuYWpheGRlbGV0ZSA9IGZ1bmN0aW9uIChkYXRhLCB1cmwsIHJldFVybCwgc29mdCA9IGZhbHNlKXtcbiAgaWYoc29mdCl7XG4gICAgdmFyIGNob2ljZSA9IGNvbmZpcm0oXCJBcmUgeW91IHN1cmU/XCIpO1xuICB9ZWxzZXtcbiAgICB2YXIgY2hvaWNlID0gY29uZmlybShcIkFyZSB5b3Ugc3VyZT8gVGhpcyB3aWxsIHBlcm1hbmVudGx5IHJlbW92ZSBhbGwgcmVsYXRlZCByZWNvcmRzLiBZb3UgY2Fubm90IHVuZG8gdGhpcyBhY3Rpb24uXCIpO1xuICB9XG5cdGlmKGNob2ljZSA9PT0gdHJ1ZSl7XG4gICAgJCgnI3NwaW4nKS5yZW1vdmVDbGFzcygnaGlkZS1zcGluJyk7XG4gICAgd2luZG93LmF4aW9zLnBvc3QodXJsLCBkYXRhKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAkKGxvY2F0aW9uKS5hdHRyKCdocmVmJywgcmV0VXJsKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyb3Ipe1xuICAgICAgICBzaXRlLmhhbmRsZUVycm9yKCdkZWxldGUnLCAnIycsIGVycm9yKVxuICAgICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBGdW5jdGlvbiB0byBkZWxldGUgYW4gaXRlbSBmcm9tIGEgbW9kYWwgZm9ybVxuICpcbiAqIEBwYXJhbSBkYXRhIC0gdGhlIGRhdGEgY29udGFpbmluZyB0aGUgaXRlbSB0byBkZWxldGVcbiAqIEBwYXJhbSB1cmwgLSB0aGUgVVJMIHRvIHNlbmQgdGhlIGRhdGEgdG9cbiAqIEBwYXJhbSBlbGVtZW50IC0gdGhlIG1vZGFsIGVsZW1lbnQgdG8gY2xvc2VcbiAqL1xuZXhwb3J0cy5hamF4bW9kYWxkZWxldGUgPSBmdW5jdGlvbiAoZGF0YSwgdXJsLCBlbGVtZW50KXtcbiAgdmFyIGNob2ljZSA9IGNvbmZpcm0oXCJBcmUgeW91IHN1cmU/XCIpO1xuXHRpZihjaG9pY2UgPT09IHRydWUpe1xuICAgICQoJyNzcGluJykucmVtb3ZlQ2xhc3MoJ2hpZGUtc3BpbicpO1xuICAgIHdpbmRvdy5heGlvcy5wb3N0KHVybCwgZGF0YSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgc2l0ZS5jbGVhckZvcm1FcnJvcnMoKTtcbiAgICAgICAgJCgnI3NwaW4nKS5hZGRDbGFzcygnaGlkZS1zcGluJyk7XG4gICAgICAgICQoZWxlbWVudCkubW9kYWwoJ2hpZGUnKTtcbiAgICAgICAgJCgnI3RhYmxlJykuRGF0YVRhYmxlKCkuYWpheC5yZWxvYWQoKTtcbiAgICAgICAgc2l0ZS5kaXNwbGF5TWVzc2FnZShyZXNwb25zZS5kYXRhLCBcInN1Y2Nlc3NcIik7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycm9yKXtcbiAgICAgICAgc2l0ZS5oYW5kbGVFcnJvcignZGVsZXRlJywgJyMnLCBlcnJvcilcbiAgICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gcmVzdG9yZSBhIHNvZnQtZGVsZXRlZCBpdGVtXG4gKlxuICogQHBhcmFtIGRhdGEgLSB0aGUgaXRlbSB0byBiZSByZXN0b3JlZFxuICogQHBhcmFtIHVybCAtIHRoZSBVUkwgdG8gc2VuZCB0aGF0IGluZm9ybWF0aW9uIHRvXG4gKiBAcGFyYW0gcmV0VXJsIC0gdGhlIFVSTCB0byByZXR1cm4gdG9cbiAqL1xuZXhwb3J0cy5hamF4cmVzdG9yZSA9IGZ1bmN0aW9uKGRhdGEsIHVybCwgcmV0VXJsKXtcbiAgdmFyIGNob2ljZSA9IGNvbmZpcm0oXCJBcmUgeW91IHN1cmU/XCIpO1xuXHRpZihjaG9pY2UgPT09IHRydWUpe1xuICAgICQoJyNzcGluJykucmVtb3ZlQ2xhc3MoJ2hpZGUtc3BpbicpO1xuICAgIHZhciBkYXRhID0ge1xuICAgICAgaWQ6ICQoJyNpZCcpLnZhbCgpLFxuICAgIH07XG4gICAgd2luZG93LmF4aW9zLnBvc3QodXJsLCBkYXRhKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAkKGxvY2F0aW9uKS5hdHRyKCdocmVmJywgcmV0VXJsKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyb3Ipe1xuICAgICAgICBzaXRlLmhhbmRsZUVycm9yKCdyZXN0b3JlJywgJyMnLCBlcnJvcilcbiAgICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydHMuYWpheGF1dG9jb21wbGV0ZSA9IGZ1bmN0aW9uKGlkLCB1cmwpe1xuICBzaXRlLmFqYXhhdXRvY29tcGxldGUoaWQsIHVybCk7XG59XG5cbmV4cG9ydHMuYWpheGF1dG9jb21wbGV0ZWxvY2sgPSBmdW5jdGlvbihpZCwgdXJsKXtcbiAgc2l0ZS5hamF4YXV0b2NvbXBsZXRlbG9jayhpZCwgdXJsKTtcbn1cblxuZXhwb3J0cy5hamF4YXV0b2NvbXBsZXRlc2V0ID0gZnVuY3Rpb24oaWQsIHZhbHVlKXtcbiAgc2l0ZS5hamF4YXV0b2NvbXBsZXRlc2V0KGlkLCB2YWx1ZSk7XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3V0aWwvZGFzaGJvYXJkLmpzIiwiLy9sb2FkIHJlcXVpcmVkIEpTIGxpYnJhcmllc1xucmVxdWlyZSgnZnVsbGNhbGVuZGFyJyk7XG5yZXF1aXJlKCdkZXZicmlkZ2UtYXV0b2NvbXBsZXRlJyk7XG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XG52YXIgc2l0ZSA9IHJlcXVpcmUoJy4uL3V0aWwvc2l0ZScpO1xucmVxdWlyZSgnZW9uYXNkYW4tYm9vdHN0cmFwLWRhdGV0aW1lcGlja2VyLXJ1c3NmZWxkJyk7XG52YXIgZWRpdGFibGUgPSByZXF1aXJlKCcuLi91dGlsL2VkaXRhYmxlJyk7XG5cbi8vU2Vzc2lvbiBmb3Igc3RvcmluZyBkYXRhIGJldHdlZW4gZm9ybXNcbmV4cG9ydHMuY2FsZW5kYXJTZXNzaW9uID0ge307XG5cbi8vSUQgb2YgdGhlIGN1cnJlbnRseSBsb2FkZWQgY2FsZW5kYXIncyBhZHZpc29yXG5leHBvcnRzLmNhbGVuZGFyQWR2aXNvcklEID0gLTE7XG5cbi8vU3R1ZGVudCdzIE5hbWUgc2V0IGJ5IGluaXRcbmV4cG9ydHMuY2FsZW5kYXJTdHVkZW50TmFtZSA9IFwiXCI7XG5cbi8vQ29uZmlndXJhdGlvbiBkYXRhIGZvciBmdWxsY2FsZW5kYXIgaW5zdGFuY2VcbmV4cG9ydHMuY2FsZW5kYXJEYXRhID0ge1xuXHRoZWFkZXI6IHtcblx0XHRsZWZ0OiAncHJldixuZXh0IHRvZGF5Jyxcblx0XHRjZW50ZXI6ICd0aXRsZScsXG5cdFx0cmlnaHQ6ICdhZ2VuZGFXZWVrLGFnZW5kYURheSdcblx0fSxcblx0ZWRpdGFibGU6IGZhbHNlLFxuXHRldmVudExpbWl0OiB0cnVlLFxuXHRoZWlnaHQ6ICdhdXRvJyxcblx0d2Vla2VuZHM6IGZhbHNlLFxuXHRidXNpbmVzc0hvdXJzOiB7XG5cdFx0c3RhcnQ6ICc4OjAwJywgLy8gYSBzdGFydCB0aW1lICgxMGFtIGluIHRoaXMgZXhhbXBsZSlcblx0XHRlbmQ6ICcxNzowMCcsIC8vIGFuIGVuZCB0aW1lICg2cG0gaW4gdGhpcyBleGFtcGxlKVxuXHRcdGRvdzogWyAxLCAyLCAzLCA0LCA1IF1cblx0fSxcblx0ZGVmYXVsdFZpZXc6ICdhZ2VuZGFXZWVrJyxcblx0dmlld3M6IHtcblx0XHRhZ2VuZGE6IHtcblx0XHRcdGFsbERheVNsb3Q6IGZhbHNlLFxuXHRcdFx0c2xvdER1cmF0aW9uOiAnMDA6MjA6MDAnLFxuXHRcdFx0bWluVGltZTogJzA4OjAwOjAwJyxcblx0XHRcdG1heFRpbWU6ICcxNzowMDowMCdcblx0XHR9XG5cdH0sXG5cdGV2ZW50U291cmNlczogW1xuXHRcdHtcblx0XHRcdHVybDogJy9hZHZpc2luZy9tZWV0aW5nZmVlZCcsXG5cdFx0XHR0eXBlOiAnR0VUJyxcblx0XHRcdGVycm9yOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0YWxlcnQoJ0Vycm9yIGZldGNoaW5nIG1lZXRpbmcgZXZlbnRzIGZyb20gZGF0YWJhc2UnKTtcblx0XHRcdH0sXG5cdFx0XHRjb2xvcjogJyM1MTI4ODgnLFxuXHRcdFx0dGV4dENvbG9yOiAnd2hpdGUnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dXJsOiAnL2FkdmlzaW5nL2JsYWNrb3V0ZmVlZCcsXG5cdFx0XHR0eXBlOiAnR0VUJyxcblx0XHRcdGVycm9yOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0YWxlcnQoJ0Vycm9yIGZldGNoaW5nIGJsYWNrb3V0IGV2ZW50cyBmcm9tIGRhdGFiYXNlJyk7XG5cdFx0XHR9LFxuXHRcdFx0Y29sb3I6ICcjRkY4ODg4Jyxcblx0XHRcdHRleHRDb2xvcjogJ2JsYWNrJyxcblx0XHR9LFxuXHRdLFxuXHRzZWxlY3RhYmxlOiB0cnVlLFxuXHRzZWxlY3RIZWxwZXI6IHRydWUsXG5cdHNlbGVjdE92ZXJsYXA6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0cmV0dXJuIGV2ZW50LnJlbmRlcmluZyA9PT0gJ2JhY2tncm91bmQnO1xuXHR9LFxuXHR0aW1lRm9ybWF0OiAnICcsXG59O1xuXG4vL0NvbmZpZ3VyYXRpb24gZGF0YSBmb3IgZGF0ZXBpY2tlciBpbnN0YW5jZVxuZXhwb3J0cy5kYXRlUGlja2VyRGF0YSA9IHtcblx0XHRkYXlzT2ZXZWVrRGlzYWJsZWQ6IFswLCA2XSxcblx0XHRmb3JtYXQ6ICdMTEwnLFxuXHRcdHN0ZXBwaW5nOiAyMCxcblx0XHRlbmFibGVkSG91cnM6IFs4LCA5LCAxMCwgMTEsIDEyLCAxMywgMTQsIDE1LCAxNiwgMTddLFxuXHRcdG1heEhvdXI6IDE3LFxuXHRcdHNpZGVCeVNpZGU6IHRydWUsXG5cdFx0aWdub3JlUmVhZG9ubHk6IHRydWUsXG5cdFx0YWxsb3dJbnB1dFRvZ2dsZTogdHJ1ZVxufTtcblxuLy9Db25maWd1cmF0aW9uIGRhdGEgZm9yIGRhdGVwaWNrZXIgaW5zdGFuY2UgZGF5IG9ubHlcbmV4cG9ydHMuZGF0ZVBpY2tlckRhdGVPbmx5ID0ge1xuXHRcdGRheXNPZldlZWtEaXNhYmxlZDogWzAsIDZdLFxuXHRcdGZvcm1hdDogJ01NL0REL1lZWVknLFxuXHRcdGlnbm9yZVJlYWRvbmx5OiB0cnVlLFxuXHRcdGFsbG93SW5wdXRUb2dnbGU6IHRydWVcbn07XG5cbi8qKlxuICogSW5pdGlhbHphdGlvbiBmdW5jdGlvbiBmb3IgZnVsbGNhbGVuZGFyIGluc3RhbmNlXG4gKlxuICogQHBhcmFtIGFkdmlzb3IgLSBib29sZWFuIHRydWUgaWYgdGhlIHVzZXIgaXMgYW4gYWR2aXNvclxuICogQHBhcmFtIG5vYmluZCAtIGJvb2xlYW4gdHJ1ZSBpZiB0aGUgYnV0dG9ucyBzaG91bGQgbm90IGJlIGJvdW5kIChtYWtlIGNhbGVuZGFyIHJlYWQtb25seSlcbiAqL1xuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24oKXtcblxuXHQvL0NoZWNrIGZvciBtZXNzYWdlcyBpbiB0aGUgc2Vzc2lvbiBmcm9tIGEgcHJldmlvdXMgYWN0aW9uXG5cdHNpdGUuY2hlY2tNZXNzYWdlKCk7XG5cblx0Ly9pbml0YWxpemUgZWRpdGFibGUgZWxlbWVudHNcblx0ZWRpdGFibGUuaW5pdCgpO1xuXG5cdC8vdHdlYWsgcGFyYW1ldGVyc1xuXHR3aW5kb3cuYWR2aXNvciB8fCAod2luZG93LmFkdmlzb3IgPSBmYWxzZSk7XG5cdHdpbmRvdy5ub2JpbmQgfHwgKHdpbmRvdy5ub2JpbmQgPSBmYWxzZSk7XG5cblx0Ly9nZXQgdGhlIGN1cnJlbnQgYWR2aXNvcidzIElEXG5cdGV4cG9ydHMuY2FsZW5kYXJBZHZpc29ySUQgPSAkKCcjY2FsZW5kYXJBZHZpc29ySUQnKS52YWwoKS50cmltKCk7XG5cblx0Ly9TZXQgdGhlIGFkdmlzb3IgaW5mb3JtYXRpb24gZm9yIG1lZXRpbmcgZXZlbnQgc291cmNlXG5cdGV4cG9ydHMuY2FsZW5kYXJEYXRhLmV2ZW50U291cmNlc1swXS5kYXRhID0ge2lkOiBleHBvcnRzLmNhbGVuZGFyQWR2aXNvcklEfTtcblxuXHQvL1NldCB0aGUgYWR2c2lvciBpbmZvcmFtdGlvbiBmb3IgYmxhY2tvdXQgZXZlbnQgc291cmNlXG5cdGV4cG9ydHMuY2FsZW5kYXJEYXRhLmV2ZW50U291cmNlc1sxXS5kYXRhID0ge2lkOiBleHBvcnRzLmNhbGVuZGFyQWR2aXNvcklEfTtcblxuXHQvL2lmIHRoZSB3aW5kb3cgaXMgc21hbGwsIHNldCBkaWZmZXJlbnQgZGVmYXVsdCBmb3IgY2FsZW5kYXJcblx0aWYoJCh3aW5kb3cpLndpZHRoKCkgPCA2MDApe1xuXHRcdGV4cG9ydHMuY2FsZW5kYXJEYXRhLmRlZmF1bHRWaWV3ID0gJ2FnZW5kYURheSc7XG5cdH1cblxuXHQvL0lmIG5vYmluZCwgZG9uJ3QgYmluZCB0aGUgZm9ybXNcblx0aWYoIXdpbmRvdy5ub2JpbmQpe1xuXHRcdC8vSWYgdGhlIGN1cnJlbnQgdXNlciBpcyBhbiBhZHZpc29yLCBiaW5kIG1vcmUgZGF0YVxuXHRcdGlmKHdpbmRvdy5hZHZpc29yKXtcblxuXHRcdFx0Ly9XaGVuIHRoZSBjcmVhdGUgZXZlbnQgYnV0dG9uIGlzIGNsaWNrZWQsIHNob3cgdGhlIG1vZGFsIGZvcm1cblx0XHRcdCQoJyNjcmVhdGVFdmVudCcpLm9uKCdzaG93bi5icy5tb2RhbCcsIGZ1bmN0aW9uICgpIHtcblx0XHRcdCAgJCgnI3RpdGxlJykuZm9jdXMoKTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvL0VuYWJsZSBhbmQgZGlzYWJsZSBjZXJ0YWluIGZvcm0gZmllbGRzIGJhc2VkIG9uIHVzZXJcblx0XHRcdCQoJyN0aXRsZScpLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuXHRcdFx0JCgnI3N0YXJ0JykucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSk7XG5cdFx0XHQkKCcjc3R1ZGVudGlkJykucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSk7XG5cdFx0XHQkKCcjc3RhcnRfc3BhbicpLnJlbW92ZUNsYXNzKCdkYXRlcGlja2VyLWRpc2FibGVkJyk7XG5cdFx0XHQkKCcjZW5kJykucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSk7XG5cdFx0XHQkKCcjZW5kX3NwYW4nKS5yZW1vdmVDbGFzcygnZGF0ZXBpY2tlci1kaXNhYmxlZCcpO1xuXHRcdFx0JCgnI3N0dWRlbnRpZGRpdicpLnNob3coKTtcblx0XHRcdCQoJyNzdGF0dXNkaXYnKS5zaG93KCk7XG5cblx0XHRcdC8vYmluZCB0aGUgcmVzZXQgZm9ybSBtZXRob2Rcblx0XHRcdCQoJyNjcmVhdGVFdmVudCcpLm9uKCdoaWRkZW4uYnMubW9kYWwnLCByZXNldEZvcm0pO1xuXG5cdFx0XHQvL2JpbmQgbWV0aG9kcyBmb3IgYnV0dG9ucyBhbmQgZm9ybXNcblx0XHRcdCQoJyNuZXdTdHVkZW50QnV0dG9uJykuYmluZCgnY2xpY2snLCBuZXdTdHVkZW50KTtcblxuXHRcdFx0JCgnI2NyZWF0ZUJsYWNrb3V0Jykub24oJ3Nob3duLmJzLm1vZGFsJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0ICAkKCcjYnRpdGxlJykuZm9jdXMoKTtcblx0XHRcdH0pO1xuXG5cdFx0XHQkKCcjY3JlYXRlQmxhY2tvdXQnKS5vbignaGlkZGVuLmJzLm1vZGFsJywgZnVuY3Rpb24oKXtcblx0XHRcdFx0JCgnI3JlcGVhdGRhaWx5ZGl2JykuaGlkZSgpO1xuXHRcdFx0XHQkKCcjcmVwZWF0d2Vla2x5ZGl2JykuaGlkZSgpO1xuXHRcdFx0XHQkKCcjcmVwZWF0dW50aWxkaXYnKS5oaWRlKCk7XG5cdFx0XHRcdCQodGhpcykuZmluZCgnZm9ybScpWzBdLnJlc2V0KCk7XG5cdFx0XHQgICAgJCh0aGlzKS5maW5kKCcuaGFzLWVycm9yJykuZWFjaChmdW5jdGlvbigpe1xuXHRcdFx0XHRcdCQodGhpcykucmVtb3ZlQ2xhc3MoJ2hhcy1lcnJvcicpO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0JCh0aGlzKS5maW5kKCcuaGVscC1ibG9jaycpLmVhY2goZnVuY3Rpb24oKXtcblx0XHRcdFx0XHQkKHRoaXMpLnRleHQoJycpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXG5cdFx0XHQkKCcjY3JlYXRlRXZlbnQnKS5vbignaGlkZGVuLmJzLm1vZGFsJywgbG9hZENvbmZsaWN0cyk7XG5cblx0XHRcdCQoJyNyZXNvbHZlQ29uZmxpY3QnKS5vbignaGlkZGVuLmJzLm1vZGFsJywgbG9hZENvbmZsaWN0cyk7XG5cblx0XHRcdCQoJyNyZXNvbHZlQ29uZmxpY3QnKS5vbignaGlkZGVuLmJzLm1vZGFsJywgZnVuY3Rpb24oKXtcblx0XHRcdFx0JCgnI2NhbGVuZGFyJykuZnVsbENhbGVuZGFyKCdyZWZldGNoRXZlbnRzJyk7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly9iaW5kIGF1dG9jb21wbGV0ZSBmaWVsZFxuXHRcdFx0JCgnI3N0dWRlbnRpZCcpLmF1dG9jb21wbGV0ZSh7XG5cdFx0XHQgICAgc2VydmljZVVybDogJy9wcm9maWxlL3N0dWRlbnRmZWVkJyxcblx0XHRcdCAgICBhamF4U2V0dGluZ3M6IHtcblx0XHRcdCAgICBcdGRhdGFUeXBlOiBcImpzb25cIlxuXHRcdFx0ICAgIH0sXG5cdFx0XHQgICAgb25TZWxlY3Q6IGZ1bmN0aW9uIChzdWdnZXN0aW9uKSB7XG5cdFx0XHQgICAgICAgICQoJyNzdHVkZW50aWR2YWwnKS52YWwoc3VnZ2VzdGlvbi5kYXRhKTtcblx0XHRcdCAgICB9LFxuXHRcdFx0ICAgIHRyYW5zZm9ybVJlc3VsdDogZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdCAgICAgICAgcmV0dXJuIHtcblx0XHRcdCAgICAgICAgICAgIHN1Z2dlc3Rpb25zOiAkLm1hcChyZXNwb25zZS5kYXRhLCBmdW5jdGlvbihkYXRhSXRlbSkge1xuXHRcdFx0ICAgICAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiBkYXRhSXRlbS52YWx1ZSwgZGF0YTogZGF0YUl0ZW0uZGF0YSB9O1xuXHRcdFx0ICAgICAgICAgICAgfSlcblx0XHRcdCAgICAgICAgfTtcblx0XHRcdCAgICB9XG5cdFx0XHR9KTtcblxuXHRcdFx0JCgnI3N0YXJ0X2RhdGVwaWNrZXInKS5kYXRldGltZXBpY2tlcihleHBvcnRzLmRhdGVQaWNrZXJEYXRhKTtcblxuXHRcdCAgJCgnI2VuZF9kYXRlcGlja2VyJykuZGF0ZXRpbWVwaWNrZXIoZXhwb3J0cy5kYXRlUGlja2VyRGF0YSk7XG5cblx0XHQgXHRsaW5rRGF0ZVBpY2tlcnMoJyNzdGFydCcsICcjZW5kJywgJyNkdXJhdGlvbicpO1xuXG5cdFx0IFx0JCgnI2JzdGFydF9kYXRlcGlja2VyJykuZGF0ZXRpbWVwaWNrZXIoZXhwb3J0cy5kYXRlUGlja2VyRGF0YSk7XG5cblx0XHQgICQoJyNiZW5kX2RhdGVwaWNrZXInKS5kYXRldGltZXBpY2tlcihleHBvcnRzLmRhdGVQaWNrZXJEYXRhKTtcblxuXHRcdCBcdGxpbmtEYXRlUGlja2VycygnI2JzdGFydCcsICcjYmVuZCcsICcjYmR1cmF0aW9uJyk7XG5cblx0XHQgXHQkKCcjYnJlcGVhdHVudGlsX2RhdGVwaWNrZXInKS5kYXRldGltZXBpY2tlcihleHBvcnRzLmRhdGVQaWNrZXJEYXRlT25seSk7XG5cblx0XHRcdC8vY2hhbmdlIHJlbmRlcmluZyBvZiBldmVudHNcblx0XHRcdGV4cG9ydHMuY2FsZW5kYXJEYXRhLmV2ZW50UmVuZGVyID0gZnVuY3Rpb24oZXZlbnQsIGVsZW1lbnQpe1xuXHRcdFx0XHRlbGVtZW50LmFkZENsYXNzKFwiZmMtY2xpY2thYmxlXCIpO1xuXHRcdFx0fTtcblx0XHRcdGV4cG9ydHMuY2FsZW5kYXJEYXRhLmV2ZW50Q2xpY2sgPSBmdW5jdGlvbihldmVudCwgZWxlbWVudCwgdmlldyl7XG5cdFx0XHRcdGlmKGV2ZW50LnR5cGUgPT0gJ20nKXtcblx0XHRcdFx0XHQkKCcjc3R1ZGVudGlkJykudmFsKGV2ZW50LnN0dWRlbnRuYW1lKTtcblx0XHRcdFx0XHQkKCcjc3R1ZGVudGlkdmFsJykudmFsKGV2ZW50LnN0dWRlbnRfaWQpO1xuXHRcdFx0XHRcdHNob3dNZWV0aW5nRm9ybShldmVudCk7XG5cdFx0XHRcdH1lbHNlIGlmIChldmVudC50eXBlID09ICdiJyl7XG5cdFx0XHRcdFx0ZXhwb3J0cy5jYWxlbmRhclNlc3Npb24gPSB7XG5cdFx0XHRcdFx0XHRldmVudDogZXZlbnRcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdGlmKGV2ZW50LnJlcGVhdCA9PSAnMCcpe1xuXHRcdFx0XHRcdFx0YmxhY2tvdXRTZXJpZXMoKTtcblx0XHRcdFx0XHR9ZWxzZXtcblx0XHRcdFx0XHRcdCQoJyNibGFja291dE9wdGlvbicpLm1vZGFsKCdzaG93Jyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdFx0ZXhwb3J0cy5jYWxlbmRhckRhdGEuc2VsZWN0ID0gZnVuY3Rpb24oc3RhcnQsIGVuZCkge1xuXHRcdFx0XHRleHBvcnRzLmNhbGVuZGFyU2Vzc2lvbiA9IHtcblx0XHRcdFx0XHRzdGFydDogc3RhcnQsXG5cdFx0XHRcdFx0ZW5kOiBlbmRcblx0XHRcdFx0fTtcblx0XHRcdFx0JCgnI2JibGFja291dGlkJykudmFsKC0xKTtcblx0XHRcdFx0JCgnI2JibGFja291dGV2ZW50aWQnKS52YWwoLTEpO1xuXHRcdFx0XHQkKCcjbWVldGluZ0lEJykudmFsKC0xKTtcblx0XHRcdFx0JCgnI21lZXRpbmdPcHRpb24nKS5tb2RhbCgnc2hvdycpO1xuXHRcdFx0fTtcblxuXHRcdFx0Ly9iaW5kIG1vcmUgYnV0dG9uc1xuXHRcdFx0JCgnI2JyZXBlYXQnKS5jaGFuZ2UocmVwZWF0Q2hhbmdlKTtcblxuXHRcdFx0JCgnI3NhdmVCbGFja291dEJ1dHRvbicpLmJpbmQoJ2NsaWNrJywgc2F2ZUJsYWNrb3V0KTtcblxuXHRcdFx0JCgnI2RlbGV0ZUJsYWNrb3V0QnV0dG9uJykuYmluZCgnY2xpY2snLCBkZWxldGVCbGFja291dCk7XG5cblx0XHRcdCQoJyNibGFja291dFNlcmllcycpLmJpbmQoJ2NsaWNrJywgZnVuY3Rpb24oKXtcblx0XHRcdFx0JCgnI2JsYWNrb3V0T3B0aW9uJykubW9kYWwoJ2hpZGUnKTtcblx0XHRcdFx0YmxhY2tvdXRTZXJpZXMoKTtcblx0XHRcdH0pO1xuXG5cdFx0XHQkKCcjYmxhY2tvdXRPY2N1cnJlbmNlJykuYmluZCgnY2xpY2snLCBmdW5jdGlvbigpe1xuXHRcdFx0XHQkKCcjYmxhY2tvdXRPcHRpb24nKS5tb2RhbCgnaGlkZScpO1xuXHRcdFx0XHRibGFja291dE9jY3VycmVuY2UoKTtcblx0XHRcdH0pO1xuXG5cdFx0XHQkKCcjYWR2aXNpbmdCdXR0b24nKS5iaW5kKCdjbGljaycsIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdCQoJyNtZWV0aW5nT3B0aW9uJykub2ZmKCdoaWRkZW4uYnMubW9kYWwnKTtcblx0XHRcdFx0JCgnI21lZXRpbmdPcHRpb24nKS5vbignaGlkZGVuLmJzLm1vZGFsJywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0XHRjcmVhdGVNZWV0aW5nRm9ybSgpO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0JCgnI21lZXRpbmdPcHRpb24nKS5tb2RhbCgnaGlkZScpO1xuXHRcdFx0fSk7XG5cblx0XHRcdCQoJyNjcmVhdGVNZWV0aW5nQnRuJykuYmluZCgnY2xpY2snLCBmdW5jdGlvbigpe1xuXHRcdFx0XHRleHBvcnRzLmNhbGVuZGFyU2Vzc2lvbiA9IHt9O1xuXHRcdFx0XHRjcmVhdGVNZWV0aW5nRm9ybSgpO1xuXHRcdFx0fSk7XG5cblx0XHRcdCQoJyNibGFja291dEJ1dHRvbicpLmJpbmQoJ2NsaWNrJywgZnVuY3Rpb24oKXtcblx0XHRcdFx0JCgnI21lZXRpbmdPcHRpb24nKS5vZmYoJ2hpZGRlbi5icy5tb2RhbCcpO1xuXHRcdFx0XHQkKCcjbWVldGluZ09wdGlvbicpLm9uKCdoaWRkZW4uYnMubW9kYWwnLCBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdGNyZWF0ZUJsYWNrb3V0Rm9ybSgpO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0JCgnI21lZXRpbmdPcHRpb24nKS5tb2RhbCgnaGlkZScpO1xuXHRcdFx0fSk7XG5cblx0XHRcdCQoJyNjcmVhdGVCbGFja291dEJ0bicpLmJpbmQoJ2NsaWNrJywgZnVuY3Rpb24oKXtcblx0XHRcdFx0ZXhwb3J0cy5jYWxlbmRhclNlc3Npb24gPSB7fTtcblx0XHRcdFx0Y3JlYXRlQmxhY2tvdXRGb3JtKCk7XG5cdFx0XHR9KTtcblxuXG5cdFx0XHQkKCcjcmVzb2x2ZUJ1dHRvbicpLm9uKCdjbGljaycsIHJlc29sdmVDb25mbGljdHMpO1xuXG5cdFx0XHRsb2FkQ29uZmxpY3RzKCk7XG5cblx0XHQvL0lmIHRoZSBjdXJyZW50IHVzZXIgaXMgbm90IGFuIGFkdmlzb3IsIGJpbmQgbGVzcyBkYXRhXG5cdFx0fWVsc2V7XG5cblx0XHRcdC8vR2V0IHRoZSBjdXJyZW50IHN0dWRlbnQncyBuYW1lXG5cdFx0XHRleHBvcnRzLmNhbGVuZGFyU3R1ZGVudE5hbWUgPSAkKCcjY2FsZW5kYXJTdHVkZW50TmFtZScpLnZhbCgpLnRyaW0oKTtcblxuXHRcdCAgLy9SZW5kZXIgYmxhY2tvdXRzIHRvIGJhY2tncm91bmRcblx0XHQgIGV4cG9ydHMuY2FsZW5kYXJEYXRhLmV2ZW50U291cmNlc1sxXS5yZW5kZXJpbmcgPSAnYmFja2dyb3VuZCc7XG5cblx0XHQgIC8vV2hlbiByZW5kZXJpbmcsIHVzZSB0aGlzIGN1c3RvbSBmdW5jdGlvbiBmb3IgYmxhY2tvdXRzIGFuZCBzdHVkZW50IG1lZXRpbmdzXG5cdFx0ICBleHBvcnRzLmNhbGVuZGFyRGF0YS5ldmVudFJlbmRlciA9IGZ1bmN0aW9uKGV2ZW50LCBlbGVtZW50KXtcblx0XHQgICAgaWYoZXZlbnQudHlwZSA9PSAnYicpe1xuXHRcdCAgICAgICAgZWxlbWVudC5hcHBlbmQoXCI8ZGl2IHN0eWxlPVxcXCJjb2xvcjogIzAwMDAwMDsgei1pbmRleDogNTtcXFwiPlwiICsgZXZlbnQudGl0bGUgKyBcIjwvZGl2PlwiKTtcblx0XHQgICAgfVxuXHRcdCAgICBpZihldmVudC50eXBlID09ICdzJyl7XG5cdFx0ICAgIFx0ZWxlbWVudC5hZGRDbGFzcyhcImZjLWdyZWVuXCIpO1xuXHRcdCAgICB9XG5cdFx0XHR9O1xuXG5cdFx0ICAvL1VzZSB0aGlzIG1ldGhvZCBmb3IgY2xpY2tpbmcgb24gbWVldGluZ3Ncblx0XHRcdGV4cG9ydHMuY2FsZW5kYXJEYXRhLmV2ZW50Q2xpY2sgPSBmdW5jdGlvbihldmVudCwgZWxlbWVudCwgdmlldyl7XG5cdFx0XHRcdGlmKGV2ZW50LnR5cGUgPT0gJ3MnKXtcblx0XHRcdFx0XHRpZihldmVudC5zdGFydC5pc0FmdGVyKG1vbWVudCgpKSl7XG5cdFx0XHRcdFx0XHRzaG93TWVldGluZ0Zvcm0oZXZlbnQpO1xuXHRcdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdFx0YWxlcnQoXCJZb3UgY2Fubm90IGVkaXQgbWVldGluZ3MgaW4gdGhlIHBhc3RcIik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0ICAvL1doZW4gc2VsZWN0aW5nIG5ldyBhcmVhcywgdXNlIHRoZSBzdHVkZW50U2VsZWN0IG1ldGhvZCBpbiB0aGUgY2FsZW5kYXIgbGlicmFyeVxuXHRcdFx0ZXhwb3J0cy5jYWxlbmRhckRhdGEuc2VsZWN0ID0gc3R1ZGVudFNlbGVjdDtcblxuXHRcdFx0Ly9XaGVuIHRoZSBjcmVhdGUgZXZlbnQgYnV0dG9uIGlzIGNsaWNrZWQsIHNob3cgdGhlIG1vZGFsIGZvcm1cblx0XHRcdCQoJyNjcmVhdGVFdmVudCcpLm9uKCdzaG93bi5icy5tb2RhbCcsIGZ1bmN0aW9uICgpIHtcblx0XHRcdCAgJCgnI2Rlc2MnKS5mb2N1cygpO1xuXHRcdFx0fSk7XG5cblx0XHRcdC8vRW5hYmxlIGFuZCBkaXNhYmxlIGNlcnRhaW4gZm9ybSBmaWVsZHMgYmFzZWQgb24gdXNlclxuXHRcdFx0JCgnI3RpdGxlJykucHJvcCgnZGlzYWJsZWQnLCB0cnVlKTtcblx0XHRcdCQoXCIjc3RhcnRcIikucHJvcCgnZGlzYWJsZWQnLCB0cnVlKTtcblx0XHRcdCQoJyNzdHVkZW50aWQnKS5wcm9wKCdkaXNhYmxlZCcsIHRydWUpO1xuXHRcdFx0JChcIiNzdGFydF9zcGFuXCIpLmFkZENsYXNzKCdkYXRlcGlja2VyLWRpc2FibGVkJyk7XG5cdFx0XHQkKFwiI2VuZFwiKS5wcm9wKCdkaXNhYmxlZCcsIHRydWUpO1xuXHRcdFx0JChcIiNlbmRfc3BhblwiKS5hZGRDbGFzcygnZGF0ZXBpY2tlci1kaXNhYmxlZCcpO1xuXHRcdFx0JCgnI3N0dWRlbnRpZGRpdicpLmhpZGUoKTtcblx0XHRcdCQoJyNzdGF0dXNkaXYnKS5oaWRlKCk7XG5cdFx0XHQkKCcjc3R1ZGVudGlkdmFsJykudmFsKC0xKTtcblxuXHRcdFx0Ly9iaW5kIHRoZSByZXNldCBmb3JtIG1ldGhvZFxuXHRcdFx0JCgnLm1vZGFsJykub24oJ2hpZGRlbi5icy5tb2RhbCcsIHJlc2V0Rm9ybSk7XG5cdFx0fVxuXG5cdFx0Ly9CaW5kIGNsaWNrIGhhbmRsZXJzIG9uIHRoZSBmb3JtXG5cdFx0JCgnI3NhdmVCdXR0b24nKS5iaW5kKCdjbGljaycsIHNhdmVNZWV0aW5nKTtcblx0XHQkKCcjZGVsZXRlQnV0dG9uJykuYmluZCgnY2xpY2snLCBkZWxldGVNZWV0aW5nKTtcblx0XHQkKCcjZHVyYXRpb24nKS5vbignY2hhbmdlJywgY2hhbmdlRHVyYXRpb24pO1xuXG5cdC8vZm9yIHJlYWQtb25seSBjYWxlbmRhcnMgd2l0aCBubyBiaW5kaW5nXG5cdH1lbHNle1xuXHRcdC8vZm9yIHJlYWQtb25seSBjYWxlbmRhcnMsIHNldCByZW5kZXJpbmcgdG8gYmFja2dyb3VuZFxuXHRcdGV4cG9ydHMuY2FsZW5kYXJEYXRhLmV2ZW50U291cmNlc1sxXS5yZW5kZXJpbmcgPSAnYmFja2dyb3VuZCc7XG4gICAgZXhwb3J0cy5jYWxlbmRhckRhdGEuc2VsZWN0YWJsZSA9IGZhbHNlO1xuXG4gICAgZXhwb3J0cy5jYWxlbmRhckRhdGEuZXZlbnRSZW5kZXIgPSBmdW5jdGlvbihldmVudCwgZWxlbWVudCl7XG5cdCAgICBpZihldmVudC50eXBlID09ICdiJyl7XG5cdCAgICAgICAgZWxlbWVudC5hcHBlbmQoXCI8ZGl2IHN0eWxlPVxcXCJjb2xvcjogIzAwMDAwMDsgei1pbmRleDogNTtcXFwiPlwiICsgZXZlbnQudGl0bGUgKyBcIjwvZGl2PlwiKTtcblx0ICAgIH1cblx0ICAgIGlmKGV2ZW50LnR5cGUgPT0gJ3MnKXtcblx0ICAgIFx0ZWxlbWVudC5hZGRDbGFzcyhcImZjLWdyZWVuXCIpO1xuXHQgICAgfVxuXHRcdH07XG5cdH1cblxuXHQvL2luaXRhbGl6ZSB0aGUgY2FsZW5kYXIhXG5cdCQoJyNjYWxlbmRhcicpLmZ1bGxDYWxlbmRhcihleHBvcnRzLmNhbGVuZGFyRGF0YSk7XG59XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gcmVzZXQgY2FsZW5kYXIgYnkgY2xvc2luZyBtb2RhbHMgYW5kIHJlbG9hZGluZyBkYXRhXG4gKlxuICogQHBhcmFtIGVsZW1lbnQgLSB0aGUgalF1ZXJ5IGlkZW50aWZpZXIgb2YgdGhlIGZvcm0gdG8gaGlkZSAoYW5kIHRoZSBzcGluKVxuICogQHBhcmFtIHJlcG9uc2UgLSB0aGUgQXhpb3MgcmVwc29uc2Ugb2JqZWN0IHJlY2VpdmVkXG4gKi9cbnZhciByZXNldENhbGVuZGFyID0gZnVuY3Rpb24oZWxlbWVudCwgcmVzcG9uc2Upe1xuXHQvL2hpZGUgdGhlIGZvcm1cblx0JChlbGVtZW50KS5tb2RhbCgnaGlkZScpO1xuXG5cdC8vZGlzcGxheSB0aGUgbWVzc2FnZSB0byB0aGUgdXNlclxuXHRzaXRlLmRpc3BsYXlNZXNzYWdlKHJlc3BvbnNlLmRhdGEsIFwic3VjY2Vzc1wiKTtcblxuXHQvL3JlZnJlc2ggdGhlIGNhbGVuZGFyXG5cdCQoJyNjYWxlbmRhcicpLmZ1bGxDYWxlbmRhcigndW5zZWxlY3QnKTtcblx0JCgnI2NhbGVuZGFyJykuZnVsbENhbGVuZGFyKCdyZWZldGNoRXZlbnRzJyk7XG5cdCQoZWxlbWVudCArICdzcGluJykuYWRkQ2xhc3MoJ2hpZGUtc3BpbicpO1xuXG5cdGlmKHdpbmRvdy5hZHZpc29yKXtcblx0XHRsb2FkQ29uZmxpY3RzKCk7XG5cdH1cbn1cblxuLyoqXG4gKiBBSkFYIG1ldGhvZCB0byBzYXZlIGRhdGEgZnJvbSBhIGZvcm1cbiAqXG4gKiBAcGFyYW0gdXJsIC0gdGhlIFVSTCB0byBzZW5kIHRoZSBkYXRhIHRvXG4gKiBAcGFyYW0gZGF0YSAtIHRoZSBkYXRhIG9iamVjdCB0byBzZW5kXG4gKiBAcGFyYW0gZWxlbWVudCAtIHRoZSBzb3VyY2UgZWxlbWVudCBvZiB0aGUgZGF0YVxuICogQHBhcmFtIGFjdGlvbiAtIHRoZSBzdHJpbmcgZGVzY3JpcHRpb24gb2YgdGhlIGFjdGlvblxuICovXG52YXIgYWpheFNhdmUgPSBmdW5jdGlvbih1cmwsIGRhdGEsIGVsZW1lbnQsIGFjdGlvbil7XG5cdC8vQUpBWCBQT1NUIHRvIHNlcnZlclxuXHR3aW5kb3cuYXhpb3MucG9zdCh1cmwsIGRhdGEpXG5cdCAgLy9pZiByZXNwb25zZSBpcyAyeHhcblx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRyZXNldENhbGVuZGFyKGVsZW1lbnQsIHJlc3BvbnNlKTtcblx0XHR9KVxuXHRcdC8vaWYgcmVzcG9uc2UgaXMgbm90IDJ4eFxuXHRcdC5jYXRjaChmdW5jdGlvbihlcnJvcil7XG5cdFx0XHRzaXRlLmhhbmRsZUVycm9yKGFjdGlvbiwgZWxlbWVudCwgZXJyb3IpO1xuXHRcdH0pO1xufVxuXG52YXIgYWpheERlbGV0ZSA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgZWxlbWVudCwgYWN0aW9uLCBub1Jlc2V0LCBub0Nob2ljZSl7XG5cdC8vY2hlY2sgbm9SZXNldCB2YXJpYWJsZVxuXHRub1Jlc2V0IHx8IChub1Jlc2V0ID0gZmFsc2UpO1xuXHRub0Nob2ljZSB8fCAobm9DaG9pY2UgPSBmYWxzZSk7XG5cblx0Ly9wcm9tcHQgdGhlIHVzZXIgZm9yIGNvbmZpcm1hdGlvblxuXHRpZighbm9DaG9pY2Upe1xuXHRcdHZhciBjaG9pY2UgPSBjb25maXJtKFwiQXJlIHlvdSBzdXJlP1wiKTtcblx0fWVsc2V7XG5cdFx0dmFyIGNob2ljZSA9IHRydWU7XG5cdH1cblxuXHRpZihjaG9pY2UgPT09IHRydWUpe1xuXG5cdFx0Ly9pZiBjb25maXJtZWQsIHNob3cgc3Bpbm5pbmcgaWNvblxuXHRcdCQoZWxlbWVudCArICdzcGluJykucmVtb3ZlQ2xhc3MoJ2hpZGUtc3BpbicpO1xuXG5cdFx0Ly9tYWtlIEFKQVggcmVxdWVzdCB0byBkZWxldGVcblx0XHR3aW5kb3cuYXhpb3MucG9zdCh1cmwsIGRhdGEpXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdGlmKG5vUmVzZXQpe1xuXHRcdFx0XHRcdC8vaGlkZSBwYXJlbnQgZWxlbWVudCAtIFRPRE8gVEVTVE1FXG5cdFx0XHRcdFx0Ly9jYWxsZXIucGFyZW50KCkucGFyZW50KCkuYWRkQ2xhc3MoJ2hpZGRlbicpO1xuXHRcdFx0XHRcdCQoZWxlbWVudCArICdzcGluJykuYWRkQ2xhc3MoJ2hpZGUtc3BpbicpO1xuXHRcdFx0XHRcdCQoZWxlbWVudCkuYWRkQ2xhc3MoJ2hpZGRlbicpO1xuXHRcdFx0XHR9ZWxzZXtcblx0XHRcdFx0XHRyZXNldENhbGVuZGFyKGVsZW1lbnQsIHJlc3BvbnNlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC5jYXRjaChmdW5jdGlvbihlcnJvcil7XG5cdFx0XHRcdHNpdGUuaGFuZGxlRXJyb3IoYWN0aW9uLCBlbGVtZW50LCBlcnJvcik7XG5cdFx0XHR9KTtcblx0fVxufVxuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHNhdmUgYSBtZWV0aW5nXG4gKi9cbnZhciBzYXZlTWVldGluZyA9IGZ1bmN0aW9uKCl7XG5cblx0Ly9TaG93IHRoZSBzcGlubmluZyBzdGF0dXMgaWNvbiB3aGlsZSB3b3JraW5nXG5cdCQoJyNjcmVhdGVFdmVudHNwaW4nKS5yZW1vdmVDbGFzcygnaGlkZS1zcGluJyk7XG5cblx0Ly9idWlsZCB0aGUgZGF0YSBvYmplY3QgYW5kIFVSTFxuXHR2YXIgZGF0YSA9IHtcblx0XHRzdGFydDogbW9tZW50KCQoJyNzdGFydCcpLnZhbCgpLCBcIkxMTFwiKS5mb3JtYXQoKSxcblx0XHRlbmQ6IG1vbWVudCgkKCcjZW5kJykudmFsKCksIFwiTExMXCIpLmZvcm1hdCgpLFxuXHRcdHRpdGxlOiAkKCcjdGl0bGUnKS52YWwoKSxcblx0XHRkZXNjOiAkKCcjZGVzYycpLnZhbCgpLFxuXHRcdHN0YXR1czogJCgnI3N0YXR1cycpLnZhbCgpXG5cdH07XG5cdGRhdGEuaWQgPSBleHBvcnRzLmNhbGVuZGFyQWR2aXNvcklEO1xuXHRpZigkKCcjbWVldGluZ0lEJykudmFsKCkgPiAwKXtcblx0XHRkYXRhLm1lZXRpbmdpZCA9ICQoJyNtZWV0aW5nSUQnKS52YWwoKTtcblx0fVxuXHRpZigkKCcjc3R1ZGVudGlkdmFsJykudmFsKCkgPiAwKXtcblx0XHRkYXRhLnN0dWRlbnRpZCA9ICQoJyNzdHVkZW50aWR2YWwnKS52YWwoKTtcblx0fVxuXHR2YXIgdXJsID0gJy9hZHZpc2luZy9jcmVhdGVtZWV0aW5nJztcblxuXHQvL0FKQVggUE9TVCB0byBzZXJ2ZXJcblx0YWpheFNhdmUodXJsLCBkYXRhLCAnI2NyZWF0ZUV2ZW50JywgJ3NhdmUgbWVldGluZycpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBkZWxldGUgYSBtZWV0aW5nXG4gKi9cbnZhciBkZWxldGVNZWV0aW5nID0gZnVuY3Rpb24oKXtcblxuXHQvL2J1aWxkIGRhdGEgYW5kIHVybFxuXHR2YXIgZGF0YSA9IHtcblx0XHRtZWV0aW5naWQ6ICQoJyNtZWV0aW5nSUQnKS52YWwoKVxuXHR9XG5cdHZhciB1cmwgPSAnL2FkdmlzaW5nL2RlbGV0ZW1lZXRpbmcnO1xuXG5cdGFqYXhEZWxldGUodXJsLCBkYXRhLCAnI2NyZWF0ZUV2ZW50JywgJ2RlbGV0ZSBtZWV0aW5nJywgZmFsc2UpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBwb3B1bGF0ZSBhbmQgc2hvdyB0aGUgbWVldGluZyBmb3JtIGZvciBlZGl0aW5nXG4gKlxuICogQHBhcmFtIGV2ZW50IC0gVGhlIGV2ZW50IHRvIGVkaXRcbiAqL1xudmFyIHNob3dNZWV0aW5nRm9ybSA9IGZ1bmN0aW9uKGV2ZW50KXtcblx0JCgnI3RpdGxlJykudmFsKGV2ZW50LnRpdGxlKTtcblx0JCgnI3N0YXJ0JykudmFsKGV2ZW50LnN0YXJ0LmZvcm1hdChcIkxMTFwiKSk7XG5cdCQoJyNlbmQnKS52YWwoZXZlbnQuZW5kLmZvcm1hdChcIkxMTFwiKSk7XG5cdCQoJyNkZXNjJykudmFsKGV2ZW50LmRlc2MpO1xuXHRkdXJhdGlvbk9wdGlvbnMoZXZlbnQuc3RhcnQsIGV2ZW50LmVuZCk7XG5cdCQoJyNtZWV0aW5nSUQnKS52YWwoZXZlbnQuaWQpO1xuXHQkKCcjc3R1ZGVudGlkdmFsJykudmFsKGV2ZW50LnN0dWRlbnRfaWQpO1xuXHQkKCcjc3RhdHVzJykudmFsKGV2ZW50LnN0YXR1cyk7XG5cdCQoJyNkZWxldGVCdXR0b24nKS5zaG93KCk7XG5cdCQoJyNjcmVhdGVFdmVudCcpLm1vZGFsKCdzaG93Jyk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHJlc2V0IGFuZCBzaG93IHRoZSBtZWV0aW5nIGZvcm0gZm9yIGNyZWF0aW9uXG4gKlxuICogQHBhcmFtIGNhbGVuZGFyU3R1ZGVudE5hbWUgLSBzdHJpbmcgbmFtZSBvZiB0aGUgc3R1ZGVudFxuICovXG52YXIgY3JlYXRlTWVldGluZ0Zvcm0gPSBmdW5jdGlvbihjYWxlbmRhclN0dWRlbnROYW1lKXtcblxuXHQvL3BvcHVsYXRlIHRoZSB0aXRsZSBhdXRvbWF0aWNhbGx5IGZvciBhIHN0dWRlbnRcblx0aWYoY2FsZW5kYXJTdHVkZW50TmFtZSAhPT0gdW5kZWZpbmVkKXtcblx0XHQkKCcjdGl0bGUnKS52YWwoY2FsZW5kYXJTdHVkZW50TmFtZSk7XG5cdH1lbHNle1xuXHRcdCQoJyN0aXRsZScpLnZhbCgnJyk7XG5cdH1cblxuXHQvL1NldCBzdGFydCB0aW1lXG5cdGlmKGV4cG9ydHMuY2FsZW5kYXJTZXNzaW9uLnN0YXJ0ID09PSB1bmRlZmluZWQpe1xuXHRcdCQoJyNzdGFydCcpLnZhbChtb21lbnQoKS5ob3VyKDgpLm1pbnV0ZSgwKS5mb3JtYXQoJ0xMTCcpKTtcblx0fWVsc2V7XG5cdFx0JCgnI3N0YXJ0JykudmFsKGV4cG9ydHMuY2FsZW5kYXJTZXNzaW9uLnN0YXJ0LmZvcm1hdChcIkxMTFwiKSk7XG5cdH1cblxuXHQvL1NldCBlbmQgdGltZVxuXHRpZihleHBvcnRzLmNhbGVuZGFyU2Vzc2lvbi5lbmQgPT09IHVuZGVmaW5lZCl7XG5cdFx0JCgnI2VuZCcpLnZhbChtb21lbnQoKS5ob3VyKDgpLm1pbnV0ZSgyMCkuZm9ybWF0KCdMTEwnKSk7XG5cdH1lbHNle1xuXHRcdCQoJyNlbmQnKS52YWwoZXhwb3J0cy5jYWxlbmRhclNlc3Npb24uZW5kLmZvcm1hdChcIkxMTFwiKSk7XG5cdH1cblxuXHQvL1NldCBkdXJhdGlvbiBvcHRpb25zXG5cdGlmKGV4cG9ydHMuY2FsZW5kYXJTZXNzaW9uLnN0YXJ0ID09PSB1bmRlZmluZWQpe1xuXHRcdGR1cmF0aW9uT3B0aW9ucyhtb21lbnQoKS5ob3VyKDgpLm1pbnV0ZSgwKSwgbW9tZW50KCkuaG91cig4KS5taW51dGUoMjApKTtcblx0fWVsc2V7XG5cdFx0ZHVyYXRpb25PcHRpb25zKGV4cG9ydHMuY2FsZW5kYXJTZXNzaW9uLnN0YXJ0LCBleHBvcnRzLmNhbGVuZGFyU2Vzc2lvbi5lbmQpO1xuXHR9XG5cblx0Ly9SZXNldCBvdGhlciBvcHRpb25zXG5cdCQoJyNtZWV0aW5nSUQnKS52YWwoLTEpO1xuXHQkKCcjc3R1ZGVudGlkdmFsJykudmFsKC0xKTtcblxuXHQvL0hpZGUgZGVsZXRlIGJ1dHRvblxuXHQkKCcjZGVsZXRlQnV0dG9uJykuaGlkZSgpO1xuXG5cdC8vU2hvdyB0aGUgbW9kYWwgZm9ybVxuXHQkKCcjY3JlYXRlRXZlbnQnKS5tb2RhbCgnc2hvdycpO1xufTtcblxuLypcbiAqIEZ1bmN0aW9uIHRvIHJlc2V0IHRoZSBmb3JtIG9uIHRoaXMgcGFnZVxuICovXG52YXIgcmVzZXRGb3JtID0gZnVuY3Rpb24oKXtcbiAgJCh0aGlzKS5maW5kKCdmb3JtJylbMF0ucmVzZXQoKTtcblx0c2l0ZS5jbGVhckZvcm1FcnJvcnMoKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gc2V0IGR1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBtZWV0aW5nIGZvcm1cbiAqXG4gKiBAcGFyYW0gc3RhcnQgLSBhIG1vbWVudCBvYmplY3QgZm9yIHRoZSBzdGFydCB0aW1lXG4gKiBAcGFyYW0gZW5kIC0gYSBtb21lbnQgb2JqZWN0IGZvciB0aGUgZW5kaW5nIHRpbWVcbiAqL1xudmFyIGR1cmF0aW9uT3B0aW9ucyA9IGZ1bmN0aW9uKHN0YXJ0LCBlbmQpe1xuXHQvL2NsZWFyIHRoZSBsaXN0XG5cdCQoJyNkdXJhdGlvbicpLmVtcHR5KCk7XG5cblx0Ly9hc3N1bWUgYWxsIG1lZXRpbmdzIGhhdmUgcm9vbSBmb3IgMjAgbWludXRlc1xuXHQkKCcjZHVyYXRpb24nKS5hcHBlbmQoXCI8b3B0aW9uIHZhbHVlPScyMCc+MjAgbWludXRlczwvb3B0aW9uPlwiKTtcblxuXHQvL2lmIGl0IHN0YXJ0cyBvbiBvciBiZWZvcmUgNDoyMCwgYWxsb3cgNDAgbWludXRlcyBhcyBhbiBvcHRpb25cblx0aWYoc3RhcnQuaG91cigpIDwgMTYgfHwgKHN0YXJ0LmhvdXIoKSA9PSAxNiAmJiBzdGFydC5taW51dGVzKCkgPD0gMjApKXtcblx0XHQkKCcjZHVyYXRpb24nKS5hcHBlbmQoXCI8b3B0aW9uIHZhbHVlPSc0MCc+NDAgbWludXRlczwvb3B0aW9uPlwiKTtcblx0fVxuXG5cdC8vaWYgaXQgc3RhcnRzIG9uIG9yIGJlZm9yZSA0OjAwLCBhbGxvdyA2MCBtaW51dGVzIGFzIGFuIG9wdGlvblxuXHRpZihzdGFydC5ob3VyKCkgPCAxNiB8fCAoc3RhcnQuaG91cigpID09IDE2ICYmIHN0YXJ0Lm1pbnV0ZXMoKSA8PSAwKSl7XG5cdFx0JCgnI2R1cmF0aW9uJykuYXBwZW5kKFwiPG9wdGlvbiB2YWx1ZT0nNjAnPjYwIG1pbnV0ZXM8L29wdGlvbj5cIik7XG5cdH1cblxuXHQvL3NldCBkZWZhdWx0IHZhbHVlIGJhc2VkIG9uIGdpdmVuIHNwYW5cblx0JCgnI2R1cmF0aW9uJykudmFsKGVuZC5kaWZmKHN0YXJ0LCBcIm1pbnV0ZXNcIikpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBsaW5rIHRoZSBkYXRlcGlja2VycyB0b2dldGhlclxuICpcbiAqIEBwYXJhbSBlbGVtMSAtIGpRdWVyeSBvYmplY3QgZm9yIGZpcnN0IGRhdGVwaWNrZXJcbiAqIEBwYXJhbSBlbGVtMiAtIGpRdWVyeSBvYmplY3QgZm9yIHNlY29uZCBkYXRlcGlja2VyXG4gKiBAcGFyYW0gZHVyYXRpb24gLSBkdXJhdGlvbiBvZiB0aGUgbWVldGluZ1xuICovXG52YXIgbGlua0RhdGVQaWNrZXJzID0gZnVuY3Rpb24oZWxlbTEsIGVsZW0yLCBkdXJhdGlvbil7XG5cdC8vYmluZCB0byBjaGFuZ2UgYWN0aW9uIG9uIGZpcnN0IGRhdGFwaWNrZXJcblx0JChlbGVtMSArIFwiX2RhdGVwaWNrZXJcIikub24oXCJkcC5jaGFuZ2VcIiwgZnVuY3Rpb24gKGUpIHtcblx0XHR2YXIgZGF0ZTIgPSBtb21lbnQoJChlbGVtMikudmFsKCksICdMTEwnKTtcblx0XHRpZihlLmRhdGUuaXNBZnRlcihkYXRlMikgfHwgZS5kYXRlLmlzU2FtZShkYXRlMikpe1xuXHRcdFx0ZGF0ZTIgPSBlLmRhdGUuY2xvbmUoKTtcblx0XHRcdCQoZWxlbTIpLnZhbChkYXRlMi5mb3JtYXQoXCJMTExcIikpO1xuXHRcdH1cblx0fSk7XG5cblx0Ly9iaW5kIHRvIGNoYW5nZSBhY3Rpb24gb24gc2Vjb25kIGRhdGVwaWNrZXJcblx0JChlbGVtMiArIFwiX2RhdGVwaWNrZXJcIikub24oXCJkcC5jaGFuZ2VcIiwgZnVuY3Rpb24gKGUpIHtcblx0XHR2YXIgZGF0ZTEgPSBtb21lbnQoJChlbGVtMSkudmFsKCksICdMTEwnKTtcblx0XHRpZihlLmRhdGUuaXNCZWZvcmUoZGF0ZTEpIHx8IGUuZGF0ZS5pc1NhbWUoZGF0ZTEpKXtcblx0XHRcdGRhdGUxID0gZS5kYXRlLmNsb25lKCk7XG5cdFx0XHQkKGVsZW0xKS52YWwoZGF0ZTEuZm9ybWF0KFwiTExMXCIpKTtcblx0XHR9XG5cdH0pO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBjaGFuZ2UgdGhlIGR1cmF0aW9uIG9mIHRoZSBtZWV0aW5nXG4gKi9cbnZhciBjaGFuZ2VEdXJhdGlvbiA9IGZ1bmN0aW9uKCl7XG5cdHZhciBuZXdEYXRlID0gbW9tZW50KCQoJyNzdGFydCcpLnZhbCgpLCAnTExMJykuYWRkKCQodGhpcykudmFsKCksIFwibWludXRlc1wiKTtcblx0JCgnI2VuZCcpLnZhbChuZXdEYXRlLmZvcm1hdChcIkxMTFwiKSk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHZlcmlmeSB0aGF0IHRoZSBzdHVkZW50cyBhcmUgc2VsZWN0aW5nIG1lZXRpbmdzIHRoYXQgYXJlbid0IHRvbyBsb25nXG4gKlxuICogQHBhcmFtIHN0YXJ0IC0gbW9tZW50IG9iamVjdCBmb3IgdGhlIHN0YXJ0IG9mIHRoZSBtZWV0aW5nXG4gKiBAcGFyYW0gZW5kIC0gbW9tZW50IG9iamVjdCBmb3IgdGhlIGVuZCBvZiB0aGUgbWVldGluZ1xuICovXG52YXIgc3R1ZGVudFNlbGVjdCA9IGZ1bmN0aW9uKHN0YXJ0LCBlbmQpIHtcblxuXHQvL1doZW4gc3R1ZGVudHMgc2VsZWN0IGEgbWVldGluZywgZGlmZiB0aGUgc3RhcnQgYW5kIGVuZCB0aW1lc1xuXHRpZihlbmQuZGlmZihzdGFydCwgJ21pbnV0ZXMnKSA+IDYwKXtcblxuXHRcdC8vaWYgaW52YWxpZCwgdW5zZWxlY3QgYW5kIHNob3cgYW4gZXJyb3Jcblx0XHRhbGVydChcIk1lZXRpbmdzIGNhbm5vdCBsYXN0IGxvbmdlciB0aGFuIDEgaG91clwiKTtcblx0XHQkKCcjY2FsZW5kYXInKS5mdWxsQ2FsZW5kYXIoJ3Vuc2VsZWN0Jyk7XG5cdH1lbHNle1xuXG5cdFx0Ly9pZiB2YWxpZCwgc2V0IGRhdGEgaW4gdGhlIHNlc3Npb24gYW5kIHNob3cgdGhlIGZvcm1cblx0XHRleHBvcnRzLmNhbGVuZGFyU2Vzc2lvbiA9IHtcblx0XHRcdHN0YXJ0OiBzdGFydCxcblx0XHRcdGVuZDogZW5kXG5cdFx0fTtcblx0XHQkKCcjbWVldGluZ0lEJykudmFsKC0xKTtcblx0XHRjcmVhdGVNZWV0aW5nRm9ybShleHBvcnRzLmNhbGVuZGFyU3R1ZGVudE5hbWUpO1xuXHR9XG59O1xuXG4vKipcbiAqIExvYWQgY29uZmxpY3RpbmcgbWVldGluZ3MgZnJvbSB0aGUgc2VydmVyXG4gKi9cbnZhciBsb2FkQ29uZmxpY3RzID0gZnVuY3Rpb24oKXtcblxuXHQvL3JlcXVlc3QgY29uZmxpY3RzIHZpYSBBSkFYXG5cdHdpbmRvdy5heGlvcy5nZXQoJy9hZHZpc2luZy9jb25mbGljdHMnKVxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblxuXHRcdFx0Ly9kaXNhYmxlIGV4aXN0aW5nIGNsaWNrIGhhbmRsZXJzXG5cdFx0XHQkKGRvY3VtZW50KS5vZmYoJ2NsaWNrJywgJy5kZWxldGVDb25mbGljdCcsIGRlbGV0ZUNvbmZsaWN0KTtcblx0XHRcdCQoZG9jdW1lbnQpLm9mZignY2xpY2snLCAnLmVkaXRDb25mbGljdCcsIGVkaXRDb25mbGljdCk7XG5cdFx0XHQkKGRvY3VtZW50KS5vZmYoJ2NsaWNrJywgJy5yZXNvbHZlQ29uZmxpY3QnLCByZXNvbHZlQ29uZmxpY3QpO1xuXG5cdFx0XHQvL0lmIHJlc3BvbnNlIGlzIDIwMCwgZGF0YSB3YXMgcmVjZWl2ZWRcblx0XHRcdGlmKHJlc3BvbnNlLnN0YXR1cyA9PSAyMDApe1xuXG5cdFx0XHRcdC8vQXBwZW5kIEhUTUwgZm9yIGNvbmZsaWN0cyB0byBET01cblx0XHRcdFx0JCgnI3Jlc29sdmVDb25mbGljdE1lZXRpbmdzJykuZW1wdHkoKTtcblx0XHRcdFx0JC5lYWNoKHJlc3BvbnNlLmRhdGEsIGZ1bmN0aW9uKGluZGV4LCB2YWx1ZSl7XG5cdFx0XHRcdFx0JCgnPGRpdi8+Jywge1xuXHRcdFx0XHRcdFx0J2lkJyA6ICdyZXNvbHZlJyt2YWx1ZS5pZCxcblx0XHRcdFx0XHRcdCdjbGFzcyc6ICdtZWV0aW5nLWNvbmZsaWN0Jyxcblx0XHRcdFx0XHRcdCdodG1sJzogXHQnPHA+Jm5ic3A7PGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLWRhbmdlciBwdWxsLXJpZ2h0IGRlbGV0ZUNvbmZsaWN0XCIgZGF0YS1pZD0nK3ZhbHVlLmlkKyc+PGkgY2xhc3M9XCJmYSBmYS10cmFzaFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvaT4gRGVsZXRlPC9idXR0b24+JyArXG5cdFx0XHRcdFx0XHRcdFx0XHQnJm5ic3A7PGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLXByaW1hcnkgcHVsbC1yaWdodCBlZGl0Q29uZmxpY3RcIiBkYXRhLWlkPScrdmFsdWUuaWQrJz48aSBjbGFzcz1cImZhIGZhLXBlbmNpbFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvaT4gRWRpdDwvYnV0dG9uPiAnICtcblx0XHRcdFx0XHRcdFx0XHRcdCc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tc3VjY2VzcyBwdWxsLXJpZ2h0IHJlc29sdmVDb25mbGljdFwiIGRhdGEtaWQ9Jyt2YWx1ZS5pZCsnPjxpIGNsYXNzPVwiZmEgZmEtZmxvcHB5LW9cIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L2k+IEtlZXA8L2J1dHRvbj4nICtcblx0XHRcdFx0XHRcdFx0XHRcdCc8c3BhbiBpZD1cInJlc29sdmUnK3ZhbHVlLmlkKydzcGluXCIgY2xhc3M9XCJmYSBmYS1jb2cgZmEtc3BpbiBmYS1sZyBwdWxsLXJpZ2h0IGhpZGUtc3BpblwiPiZuYnNwOzwvc3Bhbj4nICtcblx0XHRcdFx0XHRcdFx0XHRcdFx0JzxiPicrdmFsdWUudGl0bGUrJzwvYj4gKCcrdmFsdWUuc3RhcnQrJyk8L3A+PGhyPidcblx0XHRcdFx0XHRcdH0pLmFwcGVuZFRvKCcjcmVzb2x2ZUNvbmZsaWN0TWVldGluZ3MnKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0Ly9SZS1yZWdpc3RlciBjbGljayBoYW5kbGVyc1xuXHRcdFx0XHQkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLmRlbGV0ZUNvbmZsaWN0JywgZGVsZXRlQ29uZmxpY3QpO1xuXHRcdFx0XHQkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLmVkaXRDb25mbGljdCcsIGVkaXRDb25mbGljdCk7XG5cdFx0XHRcdCQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcucmVzb2x2ZUNvbmZsaWN0JywgcmVzb2x2ZUNvbmZsaWN0KTtcblxuXHRcdFx0XHQvL1Nob3cgdGhlIDxkaXY+IGNvbnRhaW5pbmcgY29uZmxpY3RzXG5cdFx0XHRcdCQoJyNjb25mbGljdGluZ01lZXRpbmdzJykucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpO1xuXG5cdFx0ICAvL0lmIHJlc3BvbnNlIGlzIDIwNCwgbm8gY29uZmxpY3RzIGFyZSBwcmVzZW50XG5cdFx0XHR9ZWxzZSBpZihyZXNwb25zZS5zdGF0dXMgPT0gMjA0KXtcblxuXHRcdFx0XHQvL0hpZGUgdGhlIDxkaXY+IGNvbnRhaW5pbmcgY29uZmxpY3RzXG5cdFx0XHRcdCQoJyNjb25mbGljdGluZ01lZXRpbmdzJykuYWRkQ2xhc3MoJ2hpZGRlbicpO1xuXHRcdFx0fVxuXHRcdH0pXG5cdFx0LmNhdGNoKGZ1bmN0aW9uKGVycm9yKXtcblx0XHRcdGFsZXJ0KFwiVW5hYmxlIHRvIHJldHJpZXZlIGNvbmZsaWN0aW5nIG1lZXRpbmdzOiBcIiArIGVycm9yLnJlc3BvbnNlLmRhdGEpO1xuXHRcdH0pO1xufVxuXG4vKipcbiAqIFNhdmUgYmxhY2tvdXRzIGFuZCBibGFja291dCBldmVudHNcbiAqL1xudmFyIHNhdmVCbGFja291dCA9IGZ1bmN0aW9uKCl7XG5cblx0Ly9TaG93IHRoZSBzcGlubmluZyBzdGF0dXMgaWNvbiB3aGlsZSB3b3JraW5nXG5cdCQoJyNjcmVhdGVCbGFja291dHNwaW4nKS5yZW1vdmVDbGFzcygnaGlkZS1zcGluJyk7XG5cblx0Ly9idWlsZCB0aGUgZGF0YSBvYmplY3QgYW5kIHVybDtcblx0dmFyIGRhdGEgPSB7XG5cdFx0YnN0YXJ0OiBtb21lbnQoJCgnI2JzdGFydCcpLnZhbCgpLCAnTExMJykuZm9ybWF0KCksXG5cdFx0YmVuZDogbW9tZW50KCQoJyNiZW5kJykudmFsKCksICdMTEwnKS5mb3JtYXQoKSxcblx0XHRidGl0bGU6ICQoJyNidGl0bGUnKS52YWwoKVxuXHR9O1xuXHR2YXIgdXJsO1xuXHRpZigkKCcjYmJsYWNrb3V0ZXZlbnRpZCcpLnZhbCgpID4gMCl7XG5cdFx0dXJsID0gJy9hZHZpc2luZy9jcmVhdGVibGFja291dGV2ZW50Jztcblx0XHRkYXRhLmJibGFja291dGV2ZW50aWQgPSAkKCcjYmJsYWNrb3V0ZXZlbnRpZCcpLnZhbCgpO1xuXHR9ZWxzZXtcblx0XHR1cmwgPSAnL2FkdmlzaW5nL2NyZWF0ZWJsYWNrb3V0Jztcblx0XHRpZigkKCcjYmJsYWNrb3V0aWQnKS52YWwoKSA+IDApe1xuXHRcdFx0ZGF0YS5iYmxhY2tvdXRpZCA9ICQoJyNiYmxhY2tvdXRpZCcpLnZhbCgpO1xuXHRcdH1cblx0XHRkYXRhLmJyZXBlYXQgPSAkKCcjYnJlcGVhdCcpLnZhbCgpO1xuXHRcdGlmKCQoJyNicmVwZWF0JykudmFsKCkgPT0gMSl7XG5cdFx0XHRkYXRhLmJyZXBlYXRldmVyeT0gJCgnI2JyZXBlYXRkYWlseScpLnZhbCgpO1xuXHRcdFx0ZGF0YS5icmVwZWF0dW50aWwgPSBtb21lbnQoJCgnI2JyZXBlYXR1bnRpbCcpLnZhbCgpLCBcIk1NL0REL1lZWVlcIikuZm9ybWF0KCk7XG5cdFx0fVxuXHRcdGlmKCQoJyNicmVwZWF0JykudmFsKCkgPT0gMil7XG5cdFx0XHRkYXRhLmJyZXBlYXRldmVyeSA9ICQoJyNicmVwZWF0d2Vla2x5JykudmFsKCk7XG5cdFx0XHRkYXRhLmJyZXBlYXR3ZWVrZGF5c20gPSAkKCcjYnJlcGVhdHdlZWtkYXlzMScpLnByb3AoJ2NoZWNrZWQnKTtcblx0XHRcdGRhdGEuYnJlcGVhdHdlZWtkYXlzdCA9ICQoJyNicmVwZWF0d2Vla2RheXMyJykucHJvcCgnY2hlY2tlZCcpO1xuXHRcdFx0ZGF0YS5icmVwZWF0d2Vla2RheXN3ID0gJCgnI2JyZXBlYXR3ZWVrZGF5czMnKS5wcm9wKCdjaGVja2VkJyk7XG5cdFx0XHRkYXRhLmJyZXBlYXR3ZWVrZGF5c3UgPSAkKCcjYnJlcGVhdHdlZWtkYXlzNCcpLnByb3AoJ2NoZWNrZWQnKTtcblx0XHRcdGRhdGEuYnJlcGVhdHdlZWtkYXlzZiA9ICQoJyNicmVwZWF0d2Vla2RheXM1JykucHJvcCgnY2hlY2tlZCcpO1xuXHRcdFx0ZGF0YS5icmVwZWF0dW50aWwgPSBtb21lbnQoJCgnI2JyZXBlYXR1bnRpbCcpLnZhbCgpLCBcIk1NL0REL1lZWVlcIikuZm9ybWF0KCk7XG5cdFx0fVxuXHR9XG5cblx0Ly9zZW5kIEFKQVggcG9zdFxuXHRhamF4U2F2ZSh1cmwsIGRhdGEsICcjY3JlYXRlQmxhY2tvdXQnLCAnc2F2ZSBibGFja291dCcpO1xufTtcblxuLyoqXG4gKiBEZWxldGUgYmxhY2tvdXQgYW5kIGJsYWNrb3V0IGV2ZW50c1xuICovXG52YXIgZGVsZXRlQmxhY2tvdXQgPSBmdW5jdGlvbigpe1xuXG5cdC8vYnVpbGQgVVJMIGFuZCBkYXRhIG9iamVjdFxuXHR2YXIgdXJsLCBkYXRhO1xuXHRpZigkKCcjYmJsYWNrb3V0ZXZlbnRpZCcpLnZhbCgpID4gMCl7XG5cdFx0dXJsID0gJy9hZHZpc2luZy9kZWxldGVibGFja291dGV2ZW50Jztcblx0XHRkYXRhID0geyBiYmxhY2tvdXRldmVudGlkOiAkKCcjYmJsYWNrb3V0ZXZlbnRpZCcpLnZhbCgpIH07XG5cdH1lbHNle1xuXHRcdHVybCA9ICcvYWR2aXNpbmcvZGVsZXRlYmxhY2tvdXQnO1xuXHRcdGRhdGEgPSB7IGJibGFja291dGlkOiAkKCcjYmJsYWNrb3V0aWQnKS52YWwoKSB9O1xuXHR9XG5cblx0Ly9zZW5kIEFKQVggcG9zdFxuXHRhamF4RGVsZXRlKHVybCwgZGF0YSwgJyNjcmVhdGVCbGFja291dCcsICdkZWxldGUgYmxhY2tvdXQnLCBmYWxzZSk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIGZvciBoYW5kbGluZyB0aGUgY2hhbmdlIG9mIHJlcGVhdCBvcHRpb25zIG9uIHRoZSBibGFja291dCBmb3JtXG4gKi9cbnZhciByZXBlYXRDaGFuZ2UgPSBmdW5jdGlvbigpe1xuXHRpZigkKHRoaXMpLnZhbCgpID09IDApe1xuXHRcdCQoJyNyZXBlYXRkYWlseWRpdicpLmhpZGUoKTtcblx0XHQkKCcjcmVwZWF0d2Vla2x5ZGl2JykuaGlkZSgpO1xuXHRcdCQoJyNyZXBlYXR1bnRpbGRpdicpLmhpZGUoKTtcblx0fWVsc2UgaWYoJCh0aGlzKS52YWwoKSA9PSAxKXtcblx0XHQkKCcjcmVwZWF0ZGFpbHlkaXYnKS5zaG93KCk7XG5cdFx0JCgnI3JlcGVhdHdlZWtseWRpdicpLmhpZGUoKTtcblx0XHQkKCcjcmVwZWF0dW50aWxkaXYnKS5zaG93KCk7XG5cdH1lbHNlIGlmKCQodGhpcykudmFsKCkgPT0gMil7XG5cdFx0JCgnI3JlcGVhdGRhaWx5ZGl2JykuaGlkZSgpO1xuXHRcdCQoJyNyZXBlYXR3ZWVrbHlkaXYnKS5zaG93KCk7XG5cdFx0JCgnI3JlcGVhdHVudGlsZGl2Jykuc2hvdygpO1xuXHR9XG59O1xuXG4vKipcbiAqIFNob3cgdGhlIHJlc29sdmUgY29uZmxpY3RzIG1vZGFsIGZvcm1cbiAqL1xudmFyIHJlc29sdmVDb25mbGljdHMgPSBmdW5jdGlvbigpe1xuXHQkKCcjcmVzb2x2ZUNvbmZsaWN0JykubW9kYWwoJ3Nob3cnKTtcbn07XG5cbi8qKlxuICogRGVsZXRlIGNvbmZsaWN0aW5nIG1lZXRpbmdcbiAqL1xudmFyIGRlbGV0ZUNvbmZsaWN0ID0gZnVuY3Rpb24oKXtcblxuXHQvL2J1aWxkIGRhdGEgYW5kIFVSTFxuXHR2YXIgaWQgPSAkKHRoaXMpLmRhdGEoJ2lkJyk7XG5cdHZhciBkYXRhID0ge1xuXHRcdG1lZXRpbmdpZDogaWRcblx0fVxuXHR2YXIgdXJsID0gJy9hZHZpc2luZy9kZWxldGVtZWV0aW5nJztcblxuXHQvL3NlbmQgQUpBWCBkZWxldGVcblx0YWpheERlbGV0ZSh1cmwsIGRhdGEsICcjcmVzb2x2ZScgKyBpZCwgJ2RlbGV0ZSBtZWV0aW5nJywgdHJ1ZSk7XG5cbn07XG5cbi8qKlxuICogRWRpdCBjb25mbGljdGluZyBtZWV0aW5nXG4gKi9cbnZhciBlZGl0Q29uZmxpY3QgPSBmdW5jdGlvbigpe1xuXG5cdC8vYnVpbGQgZGF0YSBhbmQgVVJMXG5cdHZhciBpZCA9ICQodGhpcykuZGF0YSgnaWQnKTtcblx0dmFyIGRhdGEgPSB7XG5cdFx0bWVldGluZ2lkOiBpZFxuXHR9XG5cdHZhciB1cmwgPSAnL2FkdmlzaW5nL21lZXRpbmcnO1xuXG5cdC8vc2hvdyBzcGlubmVyIHRvIGxvYWQgbWVldGluZ1xuXHQkKCcjcmVzb2x2ZScrIGlkICsgJ3NwaW4nKS5yZW1vdmVDbGFzcygnaGlkZS1zcGluJyk7XG5cblx0Ly9sb2FkIG1lZXRpbmcgYW5kIGRpc3BsYXkgZm9ybVxuXHR3aW5kb3cuYXhpb3MuZ2V0KHVybCwge1xuXHRcdFx0cGFyYW1zOiBkYXRhXG5cdFx0fSlcblx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHQkKCcjcmVzb2x2ZScrIGlkICsgJ3NwaW4nKS5hZGRDbGFzcygnaGlkZS1zcGluJyk7XG5cdFx0XHQkKCcjcmVzb2x2ZUNvbmZsaWN0JykubW9kYWwoJ2hpZGUnKTtcblx0XHRcdGV2ZW50ID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdGV2ZW50LnN0YXJ0ID0gbW9tZW50KGV2ZW50LnN0YXJ0KTtcblx0XHRcdGV2ZW50LmVuZCA9IG1vbWVudChldmVudC5lbmQpO1xuXHRcdFx0c2hvd01lZXRpbmdGb3JtKGV2ZW50KTtcblx0XHR9KS5jYXRjaChmdW5jdGlvbihlcnJvcil7XG5cdFx0XHRzaXRlLmhhbmRsZUVycm9yKCdyZXRyaWV2ZSBtZWV0aW5nJywgJyNyZXNvbHZlJyArIGlkLCBlcnJvcik7XG5cdFx0fSk7XG59O1xuXG4vKipcbiAqIFJlc29sdmUgYSBjb25mbGljdGluZyBtZWV0aW5nXG4gKi9cbnZhciByZXNvbHZlQ29uZmxpY3QgPSBmdW5jdGlvbigpe1xuXG5cdC8vYnVpbGQgZGF0YSBhbmQgVVJMXG5cdHZhciBpZCA9ICQodGhpcykuZGF0YSgnaWQnKTtcblx0dmFyIGRhdGEgPSB7XG5cdFx0bWVldGluZ2lkOiBpZFxuXHR9XG5cdHZhciB1cmwgPSAnL2FkdmlzaW5nL3Jlc29sdmVjb25mbGljdCc7XG5cblx0YWpheERlbGV0ZSh1cmwsIGRhdGEsICcjcmVzb2x2ZScgKyBpZCwgJ3Jlc29sdmUgbWVldGluZycsIHRydWUsIHRydWUpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBjcmVhdGUgdGhlIGNyZWF0ZSBibGFja291dCBmb3JtXG4gKi9cbnZhciBjcmVhdGVCbGFja291dEZvcm0gPSBmdW5jdGlvbigpe1xuXHQkKCcjYnRpdGxlJykudmFsKFwiXCIpO1xuXHRpZihleHBvcnRzLmNhbGVuZGFyU2Vzc2lvbi5zdGFydCA9PT0gdW5kZWZpbmVkKXtcblx0XHQkKCcjYnN0YXJ0JykudmFsKG1vbWVudCgpLmhvdXIoOCkubWludXRlKDApLmZvcm1hdCgnTExMJykpO1xuXHR9ZWxzZXtcblx0XHQkKCcjYnN0YXJ0JykudmFsKGV4cG9ydHMuY2FsZW5kYXJTZXNzaW9uLnN0YXJ0LmZvcm1hdChcIkxMTFwiKSk7XG5cdH1cblx0aWYoZXhwb3J0cy5jYWxlbmRhclNlc3Npb24uZW5kID09PSB1bmRlZmluZWQpe1xuXHRcdCQoJyNiZW5kJykudmFsKG1vbWVudCgpLmhvdXIoOSkubWludXRlKDApLmZvcm1hdCgnTExMJykpO1xuXHR9ZWxzZXtcblx0XHQkKCcjYmVuZCcpLnZhbChleHBvcnRzLmNhbGVuZGFyU2Vzc2lvbi5lbmQuZm9ybWF0KFwiTExMXCIpKTtcblx0fVxuXHQkKCcjYmJsYWNrb3V0aWQnKS52YWwoLTEpO1xuXHQkKCcjcmVwZWF0ZGl2Jykuc2hvdygpO1xuXHQkKCcjYnJlcGVhdCcpLnZhbCgwKTtcblx0JCgnI2JyZXBlYXQnKS50cmlnZ2VyKCdjaGFuZ2UnKTtcblx0JCgnI2RlbGV0ZUJsYWNrb3V0QnV0dG9uJykuaGlkZSgpO1xuXHQkKCcjY3JlYXRlQmxhY2tvdXQnKS5tb2RhbCgnc2hvdycpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byByZXNldCB0aGUgZm9ybSB0byBhIHNpbmdsZSBvY2N1cnJlbmNlXG4gKi9cbnZhciBibGFja291dE9jY3VycmVuY2UgPSBmdW5jdGlvbigpe1xuXHQvL2hpZGUgdGhlIG1vZGFsIGZvcm1cblx0JCgnI2JsYWNrb3V0T3B0aW9uJykubW9kYWwoJ2hpZGUnKTtcblxuXHQvL3NldCBmb3JtIHZhbHVlcyBhbmQgaGlkZSB1bm5lZWRlZCBmaWVsZHNcblx0JCgnI2J0aXRsZScpLnZhbChleHBvcnRzLmNhbGVuZGFyU2Vzc2lvbi5ldmVudC50aXRsZSk7XG5cdCQoJyNic3RhcnQnKS52YWwoZXhwb3J0cy5jYWxlbmRhclNlc3Npb24uZXZlbnQuc3RhcnQuZm9ybWF0KFwiTExMXCIpKTtcblx0JCgnI2JlbmQnKS52YWwoZXhwb3J0cy5jYWxlbmRhclNlc3Npb24uZXZlbnQuZW5kLmZvcm1hdChcIkxMTFwiKSk7XG5cdCQoJyNyZXBlYXRkaXYnKS5oaWRlKCk7XG5cdCQoJyNyZXBlYXRkYWlseWRpdicpLmhpZGUoKTtcblx0JCgnI3JlcGVhdHdlZWtseWRpdicpLmhpZGUoKTtcblx0JCgnI3JlcGVhdHVudGlsZGl2JykuaGlkZSgpO1xuXHQkKCcjYmJsYWNrb3V0aWQnKS52YWwoZXhwb3J0cy5jYWxlbmRhclNlc3Npb24uZXZlbnQuYmxhY2tvdXRfaWQpO1xuXHQkKCcjYmJsYWNrb3V0ZXZlbnRpZCcpLnZhbChleHBvcnRzLmNhbGVuZGFyU2Vzc2lvbi5ldmVudC5pZCk7XG5cdCQoJyNkZWxldGVCbGFja291dEJ1dHRvbicpLnNob3coKTtcblxuXHQvL3Nob3cgdGhlIGZvcm1cblx0JCgnI2NyZWF0ZUJsYWNrb3V0JykubW9kYWwoJ3Nob3cnKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gbG9hZCBhIGJsYWNrb3V0IHNlcmllcyBlZGl0IGZvcm1cbiAqL1xudmFyIGJsYWNrb3V0U2VyaWVzID0gZnVuY3Rpb24oKXtcblx0Ly9oaWRlIHRoZSBtb2RhbCBmb3JtXG4gXHQkKCcjYmxhY2tvdXRPcHRpb24nKS5tb2RhbCgnaGlkZScpO1xuXG5cdC8vYnVpbGQgZGF0YSBhbmQgVVJMXG5cdHZhciBkYXRhID0ge1xuXHRcdGlkOiBleHBvcnRzLmNhbGVuZGFyU2Vzc2lvbi5ldmVudC5ibGFja291dF9pZFxuXHR9XG5cdHZhciB1cmwgPSAnL2FkdmlzaW5nL2JsYWNrb3V0JztcblxuXHR3aW5kb3cuYXhpb3MuZ2V0KHVybCwge1xuXHRcdFx0cGFyYW1zOiBkYXRhXG5cdFx0fSlcblx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHQkKCcjYnRpdGxlJykudmFsKHJlc3BvbnNlLmRhdGEudGl0bGUpXG5cdCBcdFx0JCgnI2JzdGFydCcpLnZhbChtb21lbnQocmVzcG9uc2UuZGF0YS5zdGFydCwgJ1lZWVktTU0tREQgSEg6bW06c3MnKS5mb3JtYXQoJ0xMTCcpKTtcblx0IFx0XHQkKCcjYmVuZCcpLnZhbChtb21lbnQocmVzcG9uc2UuZGF0YS5lbmQsICdZWVlZLU1NLUREIEhIOm1tOnNzJykuZm9ybWF0KCdMTEwnKSk7XG5cdCBcdFx0JCgnI2JibGFja291dGlkJykudmFsKHJlc3BvbnNlLmRhdGEuaWQpO1xuXHQgXHRcdCQoJyNiYmxhY2tvdXRldmVudGlkJykudmFsKC0xKTtcblx0IFx0XHQkKCcjcmVwZWF0ZGl2Jykuc2hvdygpO1xuXHQgXHRcdCQoJyNicmVwZWF0JykudmFsKHJlc3BvbnNlLmRhdGEucmVwZWF0X3R5cGUpO1xuXHQgXHRcdCQoJyNicmVwZWF0JykudHJpZ2dlcignY2hhbmdlJyk7XG5cdCBcdFx0aWYocmVzcG9uc2UuZGF0YS5yZXBlYXRfdHlwZSA9PSAxKXtcblx0IFx0XHRcdCQoJyNicmVwZWF0ZGFpbHknKS52YWwocmVzcG9uc2UuZGF0YS5yZXBlYXRfZXZlcnkpO1xuXHQgXHRcdFx0JCgnI2JyZXBlYXR1bnRpbCcpLnZhbChtb21lbnQocmVzcG9uc2UuZGF0YS5yZXBlYXRfdW50aWwsICdZWVlZLU1NLUREIEhIOm1tOnNzJykuZm9ybWF0KCdNTS9ERC9ZWVlZJykpO1xuXHQgXHRcdH1lbHNlIGlmIChyZXNwb25zZS5kYXRhLnJlcGVhdF90eXBlID09IDIpe1xuXHQgXHRcdFx0JCgnI2JyZXBlYXR3ZWVrbHknKS52YWwocmVzcG9uc2UuZGF0YS5yZXBlYXRfZXZlcnkpO1xuXHRcdFx0XHR2YXIgcmVwZWF0X2RldGFpbCA9IFN0cmluZyhyZXNwb25zZS5kYXRhLnJlcGVhdF9kZXRhaWwpO1xuXHQgXHRcdFx0JCgnI2JyZXBlYXR3ZWVrZGF5czEnKS5wcm9wKCdjaGVja2VkJywgKHJlcGVhdF9kZXRhaWwuaW5kZXhPZihcIjFcIikgPj0gMCkpO1xuXHQgXHRcdFx0JCgnI2JyZXBlYXR3ZWVrZGF5czInKS5wcm9wKCdjaGVja2VkJywgKHJlcGVhdF9kZXRhaWwuaW5kZXhPZihcIjJcIikgPj0gMCkpO1xuXHQgXHRcdFx0JCgnI2JyZXBlYXR3ZWVrZGF5czMnKS5wcm9wKCdjaGVja2VkJywgKHJlcGVhdF9kZXRhaWwuaW5kZXhPZihcIjNcIikgPj0gMCkpO1xuXHQgXHRcdFx0JCgnI2JyZXBlYXR3ZWVrZGF5czQnKS5wcm9wKCdjaGVja2VkJywgKHJlcGVhdF9kZXRhaWwuaW5kZXhPZihcIjRcIikgPj0gMCkpO1xuXHQgXHRcdFx0JCgnI2JyZXBlYXR3ZWVrZGF5czUnKS5wcm9wKCdjaGVja2VkJywgKHJlcGVhdF9kZXRhaWwuaW5kZXhPZihcIjVcIikgPj0gMCkpO1xuXHQgXHRcdFx0JCgnI2JyZXBlYXR1bnRpbCcpLnZhbChtb21lbnQocmVzcG9uc2UuZGF0YS5yZXBlYXRfdW50aWwsICdZWVlZLU1NLUREIEhIOm1tOnNzJykuZm9ybWF0KCdNTS9ERC9ZWVlZJykpO1xuXHQgXHRcdH1cblx0IFx0XHQkKCcjZGVsZXRlQmxhY2tvdXRCdXR0b24nKS5zaG93KCk7XG5cdCBcdFx0JCgnI2NyZWF0ZUJsYWNrb3V0JykubW9kYWwoJ3Nob3cnKTtcblx0XHR9KVxuXHRcdC5jYXRjaChmdW5jdGlvbihlcnJvcil7XG5cdFx0XHRzaXRlLmhhbmRsZUVycm9yKCdyZXRyaWV2ZSBibGFja291dCBzZXJpZXMnLCAnJywgZXJyb3IpO1xuXHRcdH0pO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBjcmVhdGUgYSBuZXcgc3R1ZGVudCBpbiB0aGUgZGF0YWJhc2VcbiAqL1xudmFyIG5ld1N0dWRlbnQgPSBmdW5jdGlvbigpe1xuXHQvL3Byb21wdCB0aGUgdXNlciBmb3IgYW4gZUlEIHRvIGFkZCB0byB0aGUgc3lzdGVtXG5cdHZhciBlaWQgPSBwcm9tcHQoXCJFbnRlciB0aGUgc3R1ZGVudCdzIGVJRFwiKTtcblxuXHQvL2J1aWxkIHRoZSBVUkwgYW5kIGRhdGFcblx0dmFyIGRhdGEgPSB7XG5cdFx0ZWlkOiBlaWQsXG5cdH07XG5cdHZhciB1cmwgPSAnL3Byb2ZpbGUvbmV3c3R1ZGVudCc7XG5cblx0Ly9zZW5kIEFKQVggcG9zdFxuXHR3aW5kb3cuYXhpb3MucG9zdCh1cmwsIGRhdGEpXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0YWxlcnQocmVzcG9uc2UuZGF0YSk7XG5cdFx0fSlcblx0XHQuY2F0Y2goZnVuY3Rpb24oZXJyb3Ipe1xuXHRcdFx0aWYoZXJyb3IucmVzcG9uc2Upe1xuXHRcdFx0XHQvL0lmIHJlc3BvbnNlIGlzIDQyMiwgZXJyb3JzIHdlcmUgcHJvdmlkZWRcblx0XHRcdFx0aWYoZXJyb3IucmVzcG9uc2Uuc3RhdHVzID09IDQyMil7XG5cdFx0XHRcdFx0YWxlcnQoXCJVbmFibGUgdG8gY3JlYXRlIHVzZXI6IFwiICsgZXJyb3IucmVzcG9uc2UuZGF0YVtcImVpZFwiXSk7XG5cdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdGFsZXJ0KFwiVW5hYmxlIHRvIGNyZWF0ZSB1c2VyOiBcIiArIGVycm9yLnJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG59O1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9jYWxlbmRhci5qcyIsIndpbmRvdy5WdWUgPSByZXF1aXJlKCd2dWUnKTtcbnZhciBzaXRlID0gcmVxdWlyZSgnLi4vdXRpbC9zaXRlJyk7XG52YXIgRWNobyA9IHJlcXVpcmUoJ2xhcmF2ZWwtZWNobycpLmRlZmF1bHQ7XG4vL2ltcG9ydCBFY2hvIGZyb20gJ2xhcmF2ZWwtZWNobydcbnJlcXVpcmUoJ2lvbi1zb3VuZCcpO1xuXG53aW5kb3cuUHVzaGVyID0gcmVxdWlyZSgncHVzaGVyLWpzJyk7XG4vKipcbiAqIEdyb3Vwc2Vzc2lvbiBpbml0IGZ1bmN0aW9uXG4gKiBtdXN0IGJlIGNhbGxlZCBleHBsaWNpdGx5IHRvIHN0YXJ0XG4gKi9cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uKCl7XG5cblx0Ly9sb2FkIGlvbi1zb3VuZCBsaWJyYXJ5XG5cdGlvbi5zb3VuZCh7XG4gICAgc291bmRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6IFwiZG9vcl9iZWxsXCJcbiAgICAgICAgfSxcbiAgICBdLFxuICAgIHZvbHVtZTogMS4wLFxuICAgIHBhdGg6IFwiL3NvdW5kcy9cIixcbiAgICBwcmVsb2FkOiB0cnVlXG5cdH0pO1xuXG5cdC8vZ2V0IHVzZXJJRCBhbmQgaXNBZHZpc29yIHZhcmlhYmxlc1xuXHR3aW5kb3cudXNlcklEID0gcGFyc2VJbnQoJCgnI3VzZXJJRCcpLnZhbCgpKTtcblxuXHQvL3JlZ2lzdGVyIGJ1dHRvbiBjbGlja1xuXHQkKCcjZ3JvdXBSZWdpc3RlckJ0bicpLm9uKCdjbGljaycsIGdyb3VwUmVnaXN0ZXJCdG4pO1xuXG5cdC8vZGlzYWJsZSBidXR0b24gY2xpY2tcblx0JCgnI2dyb3VwRGlzYWJsZUJ0bicpLm9uKCdjbGljaycsIGdyb3VwRGlzYWJsZUJ0bik7XG5cblx0Ly9yZW5kZXIgVnVlIEFwcFxuXHR3aW5kb3cudm0gPSBuZXcgVnVlKHtcblx0XHRlbDogJyNncm91cExpc3QnLFxuXHRcdGRhdGE6IHtcblx0XHRcdHF1ZXVlOiBbXSxcblx0XHRcdGFkdmlzb3I6IHBhcnNlSW50KCQoJyNpc0Fkdmlzb3InKS52YWwoKSkgPT0gMSxcblx0XHRcdHVzZXJJRDogcGFyc2VJbnQoJCgnI3VzZXJJRCcpLnZhbCgpKSxcblx0XHRcdG9ubGluZTogW10sXG5cdFx0fSxcblx0XHRtZXRob2RzOiB7XG5cdFx0XHQvL0Z1bmN0aW9uIHRvIGdldCBDU1MgY2xhc3NlcyBmb3IgYSBzdHVkZW50IG9iamVjdFxuXHRcdFx0Z2V0Q2xhc3M6IGZ1bmN0aW9uKHMpe1xuXHRcdFx0XHRyZXR1cm57XG5cdFx0XHRcdFx0J2FsZXJ0LWluZm8nOiBzLnN0YXR1cyA9PSAwIHx8IHMuc3RhdHVzID09IDEsXG5cdFx0XHRcdFx0J2FsZXJ0LXN1Y2Nlc3MnOiBzLnN0YXR1cyA9PSAyLFxuXHRcdFx0XHRcdCdncm91cHNlc3Npb24tbWUnOiBzLnVzZXJpZCA9PSB0aGlzLnVzZXJJRCxcblx0XHRcdFx0XHQnZ3JvdXBzZXNzaW9uLW9mZmxpbmUnOiAkLmluQXJyYXkocy51c2VyaWQsIHRoaXMub25saW5lKSA9PSAtMSxcblx0XHRcdFx0fTtcblx0XHRcdH0sXG5cdFx0XHQvL2Z1bmN0aW9uIHRvIHRha2UgYSBzdHVkZW50IGZyb20gdGhlIGxpc3Rcblx0XHRcdHRha2VTdHVkZW50OiBmdW5jdGlvbihldmVudCl7XG5cdFx0XHRcdHZhciBkYXRhID0geyBnaWQ6IGV2ZW50LmN1cnJlbnRUYXJnZXQuZGF0YXNldC5pZCB9O1xuXHRcdFx0XHR2YXIgdXJsID0gJy9ncm91cHNlc3Npb24vdGFrZSdcblx0XHRcdFx0YWpheFBvc3QodXJsLCBkYXRhLCAndGFrZScpO1xuXHRcdFx0fSxcblxuXHRcdFx0Ly9mdW5jdGlvbiB0byBwdXQgYSBzdHVkZW50IGJhY2sgYXQgdGhlIGVuZCBvZiB0aGUgbGlzdFxuXHRcdFx0cHV0U3R1ZGVudDogZnVuY3Rpb24oZXZlbnQpe1xuXHRcdFx0XHR2YXIgZGF0YSA9IHsgZ2lkOiBldmVudC5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuaWQgfTtcblx0XHRcdFx0dmFyIHVybCA9ICcvZ3JvdXBzZXNzaW9uL3B1dCdcblx0XHRcdFx0YWpheFBvc3QodXJsLCBkYXRhLCAncHV0Jyk7XG5cdFx0XHR9LFxuXG5cdFx0XHQvLyBmdW5jdGlvbiB0byBtYXJrIGEgc3R1ZGVudCBkb25lIG9uIHRoZSBsaXN0XG5cdFx0XHRkb25lU3R1ZGVudDogZnVuY3Rpb24oZXZlbnQpe1xuXHRcdFx0XHR2YXIgZGF0YSA9IHsgZ2lkOiBldmVudC5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuaWQgfTtcblx0XHRcdFx0dmFyIHVybCA9ICcvZ3JvdXBzZXNzaW9uL2RvbmUnXG5cdFx0XHRcdGFqYXhQb3N0KHVybCwgZGF0YSwgJ21hcmsgZG9uZScpO1xuXHRcdFx0fSxcblxuXHRcdFx0Ly9mdW5jdGlvbiB0byBkZWxldGUgYSBzdHVkZW50IGZyb20gdGhlIGxpc3Rcblx0XHRcdGRlbFN0dWRlbnQ6IGZ1bmN0aW9uKGV2ZW50KXtcblx0XHRcdFx0dmFyIGRhdGEgPSB7IGdpZDogZXZlbnQuY3VycmVudFRhcmdldC5kYXRhc2V0LmlkIH07XG5cdFx0XHRcdHZhciB1cmwgPSAnL2dyb3Vwc2Vzc2lvbi9kZWxldGUnXG5cdFx0XHRcdGFqYXhQb3N0KHVybCwgZGF0YSwgJ2RlbGV0ZScpO1xuXHRcdFx0fSxcblx0XHR9LFxuXHR9KVxuXG5cblx0Ly9FbmFibGUgUHVzaGVyIGxvZ2dpbmdcblx0aWYod2luZG93LmVudiA9PSBcImxvY2FsXCIgfHwgd2luZG93LmVudiA9PSBcInN0YWdpbmdcIil7XG5cdFx0Y29uc29sZS5sb2coXCJQdXNoZXIgbG9nZ2luZyBlbmFibGVkIVwiKTtcblx0XHRQdXNoZXIubG9nVG9Db25zb2xlID0gdHJ1ZTtcblx0fVxuXG5cdC8vTG9hZCB0aGUgRWNobyBpbnN0YW5jZSBvbiB0aGUgd2luZG93XG5cblx0d2luZG93LkVjaG8gPSBuZXcgRWNobyh7XG5cdFx0YnJvYWRjYXN0ZXI6ICdwdXNoZXInLFxuXHRcdGtleTogd2luZG93LnB1c2hlcktleSxcblx0XHRjbHVzdGVyOiB3aW5kb3cucHVzaGVyQ2x1c3Rlcixcblx0fSk7XG5cblx0Ly9CaW5kIHRvIHRoZSBjb25uZWN0ZWQgYWN0aW9uIG9uIFB1c2hlciAoY2FsbGVkIHdoZW4gY29ubmVjdGVkKVxuXHR3aW5kb3cuRWNoby5jb25uZWN0b3IucHVzaGVyLmNvbm5lY3Rpb24uYmluZCgnY29ubmVjdGVkJywgZnVuY3Rpb24oKXtcblx0XHQvL3doZW4gY29ubmVjdGVkLCBkaXNhYmxlIHRoZSBzcGlubmVyXG5cdFx0JCgnI2dyb3Vwc3BpbicpLmFkZENsYXNzKCdoaWRlLXNwaW4nKTtcblxuXHRcdC8vTG9hZCB0aGUgaW5pdGlhbCBzdHVkZW50IHF1ZXVlIHZpYSBBSkFYXG5cdFx0d2luZG93LmF4aW9zLmdldCgnL2dyb3Vwc2Vzc2lvbi9xdWV1ZS8nICsgd2luZG93LmdzaWQpXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdHdpbmRvdy52bS5xdWV1ZSA9IHdpbmRvdy52bS5xdWV1ZS5jb25jYXQocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdGNoZWNrQnV0dG9ucyh3aW5kb3cudm0ucXVldWUpO1xuXHRcdFx0XHRpbml0aWFsQ2hlY2tEaW5nKHdpbmRvdy52bS5xdWV1ZSk7XG5cdFx0XHRcdHdpbmRvdy52bS5xdWV1ZS5zb3J0KHNvcnRGdW5jdGlvbik7XG5cdFx0XHR9KVxuXHRcdFx0LmNhdGNoKGZ1bmN0aW9uKGVycm9yKXtcblx0XHRcdFx0c2l0ZS5oYW5kbGVFcnJvcignZ2V0IHF1ZXVlJywgJycsIGVycm9yKTtcblx0XHRcdH0pO1xuXHR9KVxuXG5cdC8vQ29ubmVjdCB0byB0aGUgZ3JvdXBzZXNzaW9uIGNoYW5uZWxcblx0Lypcblx0d2luZG93LkVjaG8uY2hhbm5lbCgnZ3JvdXBzZXNzaW9uJylcblx0XHQubGlzdGVuKCdHcm91cHNlc3Npb25SZWdpc3RlcicsIChkYXRhKSA9PiB7XG5cblx0XHR9KTtcbiAqL1xuXG5cdC8vQ29ubmVjdCB0byB0aGUgZ3JvdXBzZXNzaW9uZW5kIGNoYW5uZWxcblx0d2luZG93LkVjaG8uY2hhbm5lbCgnZ3JvdXBzZXNzaW9uZW5kJylcblx0XHQubGlzdGVuKCdHcm91cHNlc3Npb25FbmQnLCAoZSkgPT4ge1xuXHRcdFx0aWYoZS5nc2lkID09IHdpbmRvdy5nc2lkKXtcblx0XHRcdFx0Ly9pZiBlbmRpbmcsIHJlZGlyZWN0IGJhY2sgdG8gaG9tZSBwYWdlXG5cdFx0XHRcdHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gXCIvZ3JvdXBzZXNzaW9uL1wiICsgd2luZG93LmdzaWQ7XG5cdFx0XHR9XG5cdH0pO1xuXG5cdHdpbmRvdy5FY2hvLmpvaW4oJ3ByZXNlbmNlJylcblx0XHQuaGVyZSgodXNlcnMpID0+IHtcblx0XHRcdHZhciBsZW4gPSB1c2Vycy5sZW5ndGg7XG5cdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspe1xuXHRcdFx0XHR3aW5kb3cudm0ub25saW5lLnB1c2godXNlcnNbaV0uaWQpO1xuXHRcdFx0fVxuXHRcdH0pXG5cdFx0LmpvaW5pbmcoKHVzZXIpID0+IHtcblx0XHRcdHdpbmRvdy52bS5vbmxpbmUucHVzaCh1c2VyLmlkKTtcblx0XHR9KVxuXHRcdC5sZWF2aW5nKCh1c2VyKSA9PiB7XG5cdFx0XHR3aW5kb3cudm0ub25saW5lLnNwbGljZSggJC5pbkFycmF5KHVzZXIuaWQsIHdpbmRvdy52bS5vbmxpbmUpLCAxKTtcblx0XHR9KVxuXHRcdC5saXN0ZW4oJ0dyb3Vwc2Vzc2lvblJlZ2lzdGVyJywgKGRhdGEpID0+IHtcblx0XHRcdHZhciBxdWV1ZSA9IHdpbmRvdy52bS5xdWV1ZTtcblx0XHRcdHZhciBmb3VuZCA9IGZhbHNlO1xuXHRcdFx0dmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcblxuXHRcdFx0Ly91cGRhdGUgdGhlIHF1ZXVlIGJhc2VkIG9uIHJlc3BvbnNlXG5cdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspe1xuXHRcdFx0XHRpZihxdWV1ZVtpXS5pZCA9PT0gZGF0YS5pZCl7XG5cdFx0XHRcdFx0aWYoZGF0YS5zdGF0dXMgPCAzKXtcblx0XHRcdFx0XHRcdHF1ZXVlW2ldID0gZGF0YTtcblx0XHRcdFx0XHR9ZWxzZXtcblx0XHRcdFx0XHRcdHF1ZXVlLnNwbGljZShpLCAxKTtcblx0XHRcdFx0XHRcdGktLTtcblx0XHRcdFx0XHRcdGxlbi0tO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRmb3VuZCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly9pZiBlbGVtZW50IG5vdCBmb3VuZCBvbiBjdXJyZW50IHF1ZXVlLCBwdXNoIGl0IG9uIHRvIHRoZSBxdWV1ZVxuXHRcdFx0aWYoIWZvdW5kKXtcblx0XHRcdFx0cXVldWUucHVzaChkYXRhKTtcblx0XHRcdH1cblxuXHRcdFx0Ly9jaGVjayB0byBzZWUgaWYgY3VycmVudCB1c2VyIGlzIG9uIHF1ZXVlIGJlZm9yZSBlbmFibGluZyBidXR0b25cblx0XHRcdGNoZWNrQnV0dG9ucyhxdWV1ZSk7XG5cblx0XHRcdC8vaWYgY3VycmVudCB1c2VyIGlzIGZvdW5kLCBjaGVjayBmb3Igc3RhdHVzIHVwZGF0ZSB0byBwbGF5IHNvdW5kXG5cdFx0XHRpZihkYXRhLnVzZXJpZCA9PT0gdXNlcklEKXtcblx0XHRcdFx0Y2hlY2tEaW5nKGRhdGEpO1xuXHRcdFx0fVxuXG5cdFx0XHQvL3NvcnQgdGhlIHF1ZXVlIGNvcnJlY3RseVxuXHRcdFx0cXVldWUuc29ydChzb3J0RnVuY3Rpb24pO1xuXG5cdFx0XHQvL3VwZGF0ZSBWdWUgc3RhdGUsIG1pZ2h0IGJlIHVubmVjZXNzYXJ5XG5cdFx0XHR3aW5kb3cudm0ucXVldWUgPSBxdWV1ZTtcblx0XHR9KTtcblxufTtcblxuLyoqXG4gKiBWdWUgZmlsdGVyIGZvciBzdGF0dXMgdGV4dFxuICpcbiAqIEBwYXJhbSBkYXRhIC0gdGhlIHN0dWRlbnQgdG8gcmVuZGVyXG4gKi9cblZ1ZS5maWx0ZXIoJ3N0YXR1c3RleHQnLCBmdW5jdGlvbihkYXRhKXtcblx0aWYoZGF0YS5zdGF0dXMgPT09IDApIHJldHVybiBcIk5FV1wiO1xuXHRpZihkYXRhLnN0YXR1cyA9PT0gMSkgcmV0dXJuIFwiUVVFVUVEXCI7XG5cdGlmKGRhdGEuc3RhdHVzID09PSAyKSByZXR1cm4gXCJNRUVUIFdJVEggXCIgKyBkYXRhLmFkdmlzb3I7XG5cdGlmKGRhdGEuc3RhdHVzID09PSAzKSByZXR1cm4gXCJERUxBWVwiO1xuXHRpZihkYXRhLnN0YXR1cyA9PT0gNCkgcmV0dXJuIFwiQUJTRU5UXCI7XG5cdGlmKGRhdGEuc3RhdHVzID09PSA1KSByZXR1cm4gXCJET05FXCI7XG59KTtcblxuLyoqXG4gKiBGdW5jdGlvbiBmb3IgY2xpY2tpbmcgb24gdGhlIHJlZ2lzdGVyIGJ1dHRvblxuICovXG52YXIgZ3JvdXBSZWdpc3RlckJ0biA9IGZ1bmN0aW9uKCl7XG5cdCQoJyNncm91cHNwaW4nKS5yZW1vdmVDbGFzcygnaGlkZS1zcGluJyk7XG5cblx0dmFyIHVybCA9ICcvZ3JvdXBzZXNzaW9uL3JlZ2lzdGVyLycgKyB3aW5kb3cuZ3NpZDtcblx0d2luZG93LmF4aW9zLnBvc3QodXJsLCB7fSlcblx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRzaXRlLmRpc3BsYXlNZXNzYWdlKHJlc3BvbnNlLmRhdGEsIFwic3VjY2Vzc1wiKTtcblx0XHRcdGRpc2FibGVCdXR0b24oKTtcblx0XHRcdCQoJyNncm91cHNwaW4nKS5hZGRDbGFzcygnaGlkZS1zcGluJyk7XG5cdFx0fSlcblx0XHQuY2F0Y2goZnVuY3Rpb24oZXJyb3Ipe1xuXHRcdFx0c2l0ZS5oYW5kbGVFcnJvcigncmVnaXN0ZXInLCAnI2dyb3VwJywgZXJyb3IpO1xuXHRcdH0pO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiBmb3IgYWR2aXNvcnMgdG8gZGlzYWJsZSBncm91cHNlc3Npb25cbiAqL1xudmFyIGdyb3VwRGlzYWJsZUJ0biA9IGZ1bmN0aW9uKCl7XG5cdHZhciBjaG9pY2UgPSBjb25maXJtKFwiQXJlIHlvdSBzdXJlP1wiKTtcblx0aWYoY2hvaWNlID09PSB0cnVlKXtcblx0XHR2YXIgcmVhbGx5ID0gY29uZmlybShcIlNlcmlvdXNseSwgdGhpcyB3aWxsIGxvc2UgYWxsIGN1cnJlbnQgZGF0YS4gQXJlIHlvdSByZWFsbHkgc3VyZT9cIik7XG5cdFx0aWYocmVhbGx5ID09PSB0cnVlKXtcblx0XHRcdC8vdGhpcyBpcyBhIGJpdCBoYWNreSwgYnV0IGl0IHdvcmtzXG5cdFx0XHR2YXIgdG9rZW4gPSAkKCdtZXRhW25hbWU9XCJjc3JmLXRva2VuXCJdJykuYXR0cignY29udGVudCcpO1xuXHRcdFx0JCgnPGZvcm0gYWN0aW9uPVwiL2dyb3Vwc2Vzc2lvbi9kaXNhYmxlLycgKyB3aW5kb3cuZ3NpZCArICdcIiBtZXRob2Q9XCJQT1NUXCIvPicpXG5cdFx0XHRcdC5hcHBlbmQoJCgnPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwiaWRcIiB2YWx1ZT1cIicgKyB3aW5kb3cudXNlcklEICsgJ1wiPicpKVxuXHRcdFx0XHQuYXBwZW5kKCQoJzxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cIl90b2tlblwiIHZhbHVlPVwiJyArIHRva2VuICsgJ1wiPicpKVxuXHRcdFx0XHQuYXBwZW5kVG8oJChkb2N1bWVudC5ib2R5KSkgLy9pdCBoYXMgdG8gYmUgYWRkZWQgc29tZXdoZXJlIGludG8gdGhlIDxib2R5PlxuXHRcdFx0XHQuc3VibWl0KCk7XG5cdFx0fVxuXHR9XG59XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gZW5hYmxlIHJlZ2lzdHJhdGlvbiBidXR0b25cbiAqL1xudmFyIGVuYWJsZUJ1dHRvbiA9IGZ1bmN0aW9uKCl7XG5cdCQoJyNncm91cFJlZ2lzdGVyQnRuJykucmVtb3ZlQXR0cignZGlzYWJsZWQnKTtcbn1cblxuLyoqXG4gKiBGdW5jdGlvbiB0byBkaXNhYmxlIHJlZ2lzdHJhdGlvbiBidXR0b25cbiAqL1xudmFyIGRpc2FibGVCdXR0b24gPSBmdW5jdGlvbigpe1xuXHQkKCcjZ3JvdXBSZWdpc3RlckJ0bicpLmF0dHIoJ2Rpc2FibGVkJywgJ2Rpc2FibGVkJyk7XG59XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gY2hlY2sgYW5kIHNlZSBpZiB1c2VyIGlzIG9uIHRoZSBsaXN0IC0gaWYgbm90LCBkb24ndCBlbmFibGUgYnV0dG9uXG4gKi9cbnZhciBjaGVja0J1dHRvbnMgPSBmdW5jdGlvbihxdWV1ZSl7XG5cdHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG5cdHZhciBmb3VuZE1lID0gZmFsc2U7XG5cblx0Ly9pdGVyYXRlIHRocm91Z2ggdXNlcnMgb24gbGlzdCwgbG9va2luZyBmb3IgY3VycmVudCB1c2VyXG5cdGZvcih2YXIgaSA9IDA7IGkgPCBsZW47IGkrKyl7XG5cdFx0aWYocXVldWVbaV0udXNlcmlkID09PSB3aW5kb3cudXNlcklEKXtcblx0XHRcdGZvdW5kTWUgPSB0cnVlO1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9XG5cblx0Ly9pZiBmb3VuZCwgZGlzYWJsZSBidXR0b247IGlmIG5vdCwgZW5hYmxlIGJ1dHRvblxuXHRpZihmb3VuZE1lKXtcblx0XHRkaXNhYmxlQnV0dG9uKCk7XG5cdH1lbHNle1xuXHRcdGVuYWJsZUJ1dHRvbigpO1xuXHR9XG59XG5cbi8qKlxuICogQ2hlY2sgdG8gc2VlIGlmIHRoZSBjdXJyZW50IHVzZXIgaXMgYmVja29uZWQsIGlmIHNvLCBwbGF5IHNvdW5kIVxuICpcbiAqIEBwYXJhbSBwZXJzb24gLSB0aGUgY3VycmVudCB1c2VyIHRvIGNoZWNrXG4gKi9cbnZhciBjaGVja0RpbmcgPSBmdW5jdGlvbihwZXJzb24pe1xuXHRpZihwZXJzb24uc3RhdHVzID09IDIpe1xuXHRcdGlvbi5zb3VuZC5wbGF5KFwiZG9vcl9iZWxsXCIpO1xuXHR9XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIHBlcnNvbiBoYXMgYmVlbiBiZWNrb25lZCBvbiBsb2FkOyBpZiBzbywgcGxheSBzb3VuZCFcbiAqXG4gKiBAcGFyYW0gcXVldWUgLSB0aGUgaW5pdGlhbCBxdWV1ZSBvZiB1c2VycyBsb2FkZWRcbiAqL1xudmFyIGluaXRpYWxDaGVja0RpbmcgPSBmdW5jdGlvbihxdWV1ZSl7XG5cdHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG5cdGZvcih2YXIgaSA9IDA7IGkgPCBsZW47IGkrKyl7XG5cdFx0aWYocXVldWVbaV0udXNlcmlkID09PSB3aW5kb3cudXNlcklEKXtcblx0XHRcdGNoZWNrRGluZyhxdWV1ZVtpXSk7XG5cdFx0XHRicmVhaztcblx0XHR9XG5cdH1cbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gc29ydCBlbGVtZW50cyBiYXNlZCBvbiB0aGVpciBzdGF0dXNcbiAqXG4gKiBAcGFyYW0gYSAtIGZpcnN0IHBlcnNvblxuICogQHBhcmFtIGIgLSBzZWNvbmQgcGVyc29uXG4gKiBAcmV0dXJuIC0gc29ydGluZyB2YWx1ZSBpbmRpY2F0aW5nIHdobyBzaG91bGQgZ28gZmlyc3RfbmFtZVxuICovXG52YXIgc29ydEZ1bmN0aW9uID0gZnVuY3Rpb24oYSwgYil7XG5cdGlmKGEuc3RhdHVzID09IGIuc3RhdHVzKXtcblx0XHRyZXR1cm4gKGEuaWQgPCBiLmlkID8gLTEgOiAxKTtcblx0fVxuXHRyZXR1cm4gKGEuc3RhdHVzIDwgYi5zdGF0dXMgPyAxIDogLTEpO1xufVxuXG5cblxuLyoqXG4gKiBGdW5jdGlvbiBmb3IgbWFraW5nIEFKQVggUE9TVCByZXF1ZXN0c1xuICpcbiAqIEBwYXJhbSB1cmwgLSB0aGUgVVJMIHRvIHNlbmQgdG9cbiAqIEBwYXJhbSBkYXRhIC0gdGhlIGRhdGEgb2JqZWN0IHRvIHNlbmRcbiAqIEBwYXJhbSBhY3Rpb24gLSB0aGUgc3RyaW5nIGRlc2NyaWJpbmcgdGhlIGFjdGlvblxuICovXG52YXIgYWpheFBvc3QgPSBmdW5jdGlvbih1cmwsIGRhdGEsIGFjdGlvbil7XG5cdHdpbmRvdy5heGlvcy5wb3N0KHVybCwgZGF0YSlcblx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRzaXRlLmRpc3BsYXlNZXNzYWdlKHJlc3BvbnNlLmRhdGEsIFwic3VjY2Vzc1wiKTtcblx0XHR9KVxuXHRcdC5jYXRjaChmdW5jdGlvbihlcnJvcil7XG5cdFx0XHRzaXRlLmhhbmRsZUVycm9yKGFjdGlvbiwgJycsIGVycm9yKTtcblx0XHR9KTtcbn07XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2dyb3Vwc2Vzc2lvbi5qcyIsInZhciBzaXRlID0gcmVxdWlyZSgnLi4vdXRpbC9zaXRlJyk7XG5yZXF1aXJlKCdjb2RlbWlycm9yJyk7XG5yZXF1aXJlKCdjb2RlbWlycm9yL21vZGUveG1sL3htbC5qcycpO1xucmVxdWlyZSgnc3VtbWVybm90ZScpO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbigpe1xuXG5cdCQoJyNub3RlcycpLnN1bW1lcm5vdGUoe1xuXHRcdGZvY3VzOiB0cnVlLFxuXHRcdHRvb2xiYXI6IFtcblx0XHRcdC8vIFtncm91cE5hbWUsIFtsaXN0IG9mIGJ1dHRvbnNdXVxuXHRcdFx0WydzdHlsZScsIFsnc3R5bGUnLCAnYm9sZCcsICdpdGFsaWMnLCAndW5kZXJsaW5lJywgJ2NsZWFyJ11dLFxuXHRcdFx0Wydmb250JywgWydzdHJpa2V0aHJvdWdoJywgJ3N1cGVyc2NyaXB0JywgJ3N1YnNjcmlwdCcsICdsaW5rJ11dLFxuXHRcdFx0WydwYXJhJywgWyd1bCcsICdvbCcsICdwYXJhZ3JhcGgnXV0sXG5cdFx0XHRbJ21pc2MnLCBbJ2Z1bGxzY3JlZW4nLCAnY29kZXZpZXcnLCAnaGVscCddXSxcblx0XHRdLFxuXHRcdHRhYnNpemU6IDIsXG5cdFx0Y29kZW1pcnJvcjoge1xuXHRcdFx0bW9kZTogJ3RleHQvaHRtbCcsXG5cdFx0XHRodG1sTW9kZTogdHJ1ZSxcblx0XHRcdGxpbmVOdW1iZXJzOiB0cnVlLFxuXHRcdFx0dGhlbWU6ICdtb25va2FpJ1xuXHRcdH0sXG5cdH0pO1xuXG5cdC8vYmluZCBjbGljayBoYW5kbGVyIGZvciBzYXZlIGJ1dHRvblxuXHQkKCcjc2F2ZVByb2ZpbGUnKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuXG5cdFx0Ly9zaG93IHNwaW5uaW5nIGljb25cblx0XHQkKCcjcHJvZmlsZXNwaW4nKS5yZW1vdmVDbGFzcygnaGlkZS1zcGluJyk7XG5cblx0XHQvL2J1aWxkIGRhdGEgYW5kIFVSTFxuXHRcdHZhciBkYXRhID0ge1xuXHRcdFx0Zmlyc3RfbmFtZTogJCgnI2ZpcnN0X25hbWUnKS52YWwoKSxcblx0XHRcdGxhc3RfbmFtZTogJCgnI2xhc3RfbmFtZScpLnZhbCgpLFxuXHRcdH07XG5cdFx0dmFyIHVybCA9ICcvcHJvZmlsZS91cGRhdGUnO1xuXG5cdFx0Ly9zZW5kIEFKQVggcG9zdFxuXHRcdHdpbmRvdy5heGlvcy5wb3N0KHVybCwgZGF0YSlcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0c2l0ZS5kaXNwbGF5TWVzc2FnZShyZXNwb25zZS5kYXRhLCBcInN1Y2Nlc3NcIik7XG5cdFx0XHRcdHNpdGUuY2xlYXJGb3JtRXJyb3JzKCk7XG5cdFx0XHRcdCQoJyNwcm9maWxlc3BpbicpLmFkZENsYXNzKCdoaWRlLXNwaW4nKTtcblx0XHRcdFx0JCgnI3Byb2ZpbGVBZHZpc2luZ0J0bicpLnJlbW92ZUNsYXNzKCdoaWRlLXNwaW4nKTtcblx0XHRcdH0pXG5cdFx0XHQuY2F0Y2goZnVuY3Rpb24oZXJyb3Ipe1xuXHRcdFx0XHRzaXRlLmhhbmRsZUVycm9yKCdzYXZlIHByb2ZpbGUnLCAnI3Byb2ZpbGUnLCBlcnJvcik7XG5cdFx0XHR9KVxuXHR9KTtcblxuXHQvL2JpbmQgY2xpY2sgaGFuZGxlciBmb3IgYWR2aXNvciBzYXZlIGJ1dHRvblxuXHQkKCcjc2F2ZUFkdmlzb3JQcm9maWxlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcblxuXHRcdC8vc2hvdyBzcGlubmluZyBpY29uXG5cdFx0JCgnI3Byb2ZpbGVzcGluJykucmVtb3ZlQ2xhc3MoJ2hpZGUtc3BpbicpO1xuXG5cdFx0Ly9idWlsZCBkYXRhIGFuZCBVUkxcblx0XHQvL1RPRE8gVEVTVE1FXG5cdFx0dmFyIGRhdGEgPSBuZXcgRm9ybURhdGEoJCgnZm9ybScpWzBdKTtcblx0XHRkYXRhLmFwcGVuZChcIm5hbWVcIiwgJCgnI25hbWUnKS52YWwoKSk7XG5cdFx0ZGF0YS5hcHBlbmQoXCJlbWFpbFwiLCAkKCcjZW1haWwnKS52YWwoKSk7XG5cdFx0ZGF0YS5hcHBlbmQoXCJvZmZpY2VcIiwgJCgnI29mZmljZScpLnZhbCgpKTtcblx0XHRkYXRhLmFwcGVuZChcInBob25lXCIsICQoJyNwaG9uZScpLnZhbCgpKTtcblx0XHRkYXRhLmFwcGVuZChcIm5vdGVzXCIsICQoJyNub3RlcycpLnZhbCgpKTtcblx0XHRpZigkKCcjcGljJykudmFsKCkpe1xuXHRcdFx0ZGF0YS5hcHBlbmQoXCJwaWNcIiwgJCgnI3BpYycpWzBdLmZpbGVzWzBdKTtcblx0XHR9XG5cdFx0dmFyIHVybCA9ICcvcHJvZmlsZS91cGRhdGUnO1xuXG5cdFx0d2luZG93LmF4aW9zLnBvc3QodXJsLCBkYXRhKVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRzaXRlLmRpc3BsYXlNZXNzYWdlKHJlc3BvbnNlLmRhdGEsIFwic3VjY2Vzc1wiKTtcblx0XHRcdFx0c2l0ZS5jbGVhckZvcm1FcnJvcnMoKTtcblx0XHRcdFx0JCgnI3Byb2ZpbGVzcGluJykuYWRkQ2xhc3MoJ2hpZGUtc3BpbicpO1xuXHRcdFx0XHQkKCcjcHJvZmlsZUFkdmlzaW5nQnRuJykucmVtb3ZlQ2xhc3MoJ2hpZGUtc3BpbicpO1xuXHRcdFx0XHR3aW5kb3cuYXhpb3MuZ2V0KCcvcHJvZmlsZS9waWMnKVxuXHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0XHRcdCQoJyNwaWN0ZXh0JykudmFsKHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdFx0JCgnI3BpY2ltZycpLmF0dHIoJ3NyYycsIHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uKGVycm9yKXtcblx0XHRcdFx0XHRcdHNpdGUuaGFuZGxlRXJyb3IoJ3JldHJpZXZlIHBpY3R1cmUnLCAnJywgZXJyb3IpO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdFx0LmNhdGNoKGZ1bmN0aW9uKGVycm9yKXtcblx0XHRcdFx0c2l0ZS5oYW5kbGVFcnJvcignc2F2ZSBwcm9maWxlJywgJyNwcm9maWxlJywgZXJyb3IpO1xuXHRcdFx0fSk7XG5cdH0pO1xuXG5cdC8vaHR0cDovL3d3dy5hYmVhdXRpZnVsc2l0ZS5uZXQvd2hpcHBpbmctZmlsZS1pbnB1dHMtaW50by1zaGFwZS13aXRoLWJvb3RzdHJhcC0zL1xuXHQkKGRvY3VtZW50KS5vbignY2hhbmdlJywgJy5idG4tZmlsZSA6ZmlsZScsIGZ1bmN0aW9uKCkge1xuXHQgIHZhciBpbnB1dCA9ICQodGhpcyksXG5cdCAgICAgIG51bUZpbGVzID0gaW5wdXQuZ2V0KDApLmZpbGVzID8gaW5wdXQuZ2V0KDApLmZpbGVzLmxlbmd0aCA6IDEsXG5cdCAgICAgIGxhYmVsID0gaW5wdXQudmFsKCkucmVwbGFjZSgvXFxcXC9nLCAnLycpLnJlcGxhY2UoLy4qXFwvLywgJycpO1xuXHQgIGlucHV0LnRyaWdnZXIoJ2ZpbGVzZWxlY3QnLCBbbnVtRmlsZXMsIGxhYmVsXSk7XG5cdH0pO1xuXG5cdC8vYmluZCB0byBmaWxlc2VsZWN0IGJ1dHRvblxuICAkKCcuYnRuLWZpbGUgOmZpbGUnKS5vbignZmlsZXNlbGVjdCcsIGZ1bmN0aW9uKGV2ZW50LCBudW1GaWxlcywgbGFiZWwpIHtcblxuICAgICAgdmFyIGlucHV0ID0gJCh0aGlzKS5wYXJlbnRzKCcuaW5wdXQtZ3JvdXAnKS5maW5kKCc6dGV4dCcpO1xuXHRcdFx0dmFyIGxvZyA9IG51bUZpbGVzID4gMSA/IG51bUZpbGVzICsgJyBmaWxlcyBzZWxlY3RlZCcgOiBsYWJlbDtcblxuICAgICAgaWYoaW5wdXQubGVuZ3RoKSB7XG4gICAgICAgICAgaW5wdXQudmFsKGxvZyk7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgICBpZihsb2cpe1xuXHRcdFx0XHRcdFx0YWxlcnQobG9nKTtcblx0XHRcdFx0XHR9XG4gICAgICB9XG4gIH0pO1xufTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvcHJvZmlsZS5qcyIsInZhciBkYXNoYm9hcmQgPSByZXF1aXJlKCcuLi8uLi91dGlsL2Rhc2hib2FyZCcpO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbigpe1xuICB2YXIgb3B0aW9ucyA9IGRhc2hib2FyZC5kYXRhVGFibGVPcHRpb25zO1xuICBvcHRpb25zLmRvbSA9ICc8XCJuZXdidXR0b25cIj5mcnRpcCc7XG4gIGRhc2hib2FyZC5pbml0KG9wdGlvbnMpO1xuXG4gICQoJyNkZWxldGUnKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgIHZhciB1cmwgPSBcIi9hZG1pbi9kZWxldGVtZWV0aW5nXCI7XG4gICAgdmFyIHJldFVybCA9IFwiL2FkbWluL21lZXRpbmdzXCI7XG4gICAgdmFyIGRhdGEgPSB7XG4gICAgICBpZDogJCgnI2lkJykudmFsKCksXG4gICAgfTtcbiAgICBkYXNoYm9hcmQuYWpheGRlbGV0ZShkYXRhLCB1cmwsIHJldFVybCwgdHJ1ZSk7XG4gIH0pO1xuXG4gICQoJyNmb3JjZWRlbGV0ZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIHVybCA9IFwiL2FkbWluL2ZvcmNlZGVsZXRlbWVldGluZ1wiO1xuICAgIHZhciByZXRVcmwgPSBcIi9hZG1pbi9tZWV0aW5nc1wiO1xuICAgIHZhciBkYXRhID0ge1xuICAgICAgaWQ6ICQoJyNpZCcpLnZhbCgpLFxuICAgIH07XG4gICAgZGFzaGJvYXJkLmFqYXhkZWxldGUoZGF0YSwgdXJsLCByZXRVcmwpO1xuICB9KTtcblxufTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL21lZXRpbmdlZGl0LmpzIiwidmFyIGRhc2hib2FyZCA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvZGFzaGJvYXJkJyk7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uKCl7XG4gIHZhciBvcHRpb25zID0gZGFzaGJvYXJkLmRhdGFUYWJsZU9wdGlvbnM7XG4gIG9wdGlvbnMuZG9tID0gJzxcIm5ld2J1dHRvblwiPmZydGlwJztcbiAgZGFzaGJvYXJkLmluaXQob3B0aW9ucyk7XG5cbiAgJCgnI2RlbGV0ZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIHVybCA9IFwiL2FkbWluL2RlbGV0ZWJsYWNrb3V0XCI7XG4gICAgdmFyIHJldFVybCA9IFwiL2FkbWluL2JsYWNrb3V0c1wiO1xuICAgIHZhciBkYXRhID0ge1xuICAgICAgaWQ6ICQoJyNpZCcpLnZhbCgpLFxuICAgIH07XG4gICAgZGFzaGJvYXJkLmFqYXhkZWxldGUoZGF0YSwgdXJsLCByZXRVcmwpO1xuICB9KTtcblxufTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL2JsYWNrb3V0ZWRpdC5qcyIsInZhciBkYXNoYm9hcmQgPSByZXF1aXJlKCcuLi8uLi91dGlsL2Rhc2hib2FyZCcpO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbigpe1xuICB2YXIgb3B0aW9ucyA9IGRhc2hib2FyZC5kYXRhVGFibGVPcHRpb25zO1xuICBvcHRpb25zLmRvbSA9ICc8XCJuZXdidXR0b25cIj5mcnRpcCc7XG4gIGRhc2hib2FyZC5pbml0KG9wdGlvbnMpO1xuXG4gIC8vJChcImRpdi5uZXdidXR0b25cIikuaHRtbCgnPGEgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1zdWNjZXNzXCIgaHJlZj1cIi9hZG1pbi9uZXdzdHVkZW50XCI+TmV3IFN0dWRlbnQ8L2E+Jyk7XG5cbiAgJCgnI2RlbGV0ZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIHVybCA9IFwiL2FkbWluL2RlbGV0ZWdyb3Vwc2Vzc2lvblwiO1xuICAgIHZhciByZXRVcmwgPSBcIi9hZG1pbi9ncm91cHNlc3Npb25zXCI7XG4gICAgdmFyIGRhdGEgPSB7XG4gICAgICBpZDogJCgnI2lkJykudmFsKCksXG4gICAgfTtcbiAgICBkYXNoYm9hcmQuYWpheGRlbGV0ZShkYXRhLCB1cmwsIHJldFVybCk7XG4gIH0pO1xuXG59O1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvZ3JvdXBzZXNzaW9uZWRpdC5qcyIsInZhciBkYXNoYm9hcmQgPSByZXF1aXJlKCcuLi8uLi91dGlsL2Rhc2hib2FyZCcpO1xudmFyIHNpdGUgPSByZXF1aXJlKCcuLi8uLi91dGlsL3NpdGUnKTtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24oKXtcbiAgLy9sb2FkIGN1c3RvbSBidXR0b24gb24gdGhlIGRvbVxuICB2YXIgb3B0aW9ucyA9IGRhc2hib2FyZC5kYXRhVGFibGVPcHRpb25zO1xuICBvcHRpb25zLmRvbSA9ICc8XCJuZXdidXR0b25cIj5mcnRpcCc7XG4gIGRhc2hib2FyZC5pbml0KCk7XG5cbiAgLy9iaW5kIHNldHRpbmdzIGJ1dHRvbnNcbiAgJCgnLnNldHRpbmdzYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgZGF0YSA9IHtcbiAgICAgIGtleTogJCh0aGlzKS5hdHRyKCdpZCcpLFxuICAgIH07XG4gICAgdmFyIHVybCA9ICcvYWRtaW4vc2F2ZXNldHRpbmcnO1xuXG4gICAgd2luZG93LmF4aW9zLnBvc3QodXJsLCBkYXRhKVxuICAgICAgLnRoZW4oZnVuY3Rpb24obWVzc2FnZSl7XG4gICAgICAgICQobG9jYXRpb24pLmF0dHIoJ2hyZWYnLCAnL2FkbWluL3NldHRpbmdzJyk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycm9yKXtcbiAgICAgICAgc2l0ZS5oYW5kbGVFcnJvcignc2F2ZScsICcnLCBlcnJvcik7XG4gICAgICB9KTtcbiAgfSk7XG5cbiAgLy9iaW5kIG5ldyBzZXR0aW5nIGJ1dHRvblxuICAkKCcjbmV3c2V0dGluZycpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIGNob2ljZSA9IHByb21wdChcIkVudGVyIGEgbmFtZSBmb3IgdGhlIG5ldyBzZXR0aW5nOlwiKTtcbiAgICB2YXIgZGF0YSA9IHtcbiAgICAgIGtleTogY2hvaWNlLFxuICAgIH07XG4gICAgdmFyIHVybCA9IFwiL2FkbWluL25ld3NldHRpbmdcIlxuXG4gICAgd2luZG93LmF4aW9zLnBvc3QodXJsLCBkYXRhKVxuICAgICAgLnRoZW4oZnVuY3Rpb24obWVzc2FnZSl7XG4gICAgICAgICQobG9jYXRpb24pLmF0dHIoJ2hyZWYnLCAnL2FkbWluL3NldHRpbmdzJyk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycm9yKXtcbiAgICAgICAgc2l0ZS5oYW5kbGVFcnJvcignY3JlYXRlJywgJycsIGVycm9yKVxuICAgICAgfSk7XG4gIH0pO1xufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2V0dGluZ3MuanMiLCJ2YXIgZGFzaGJvYXJkID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9kYXNoYm9hcmQnKTtcbnZhciBzaXRlID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9zaXRlJyk7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uKCl7XG4gIHZhciBvcHRpb25zID0gZGFzaGJvYXJkLmRhdGFUYWJsZU9wdGlvbnM7XG4gIG9wdGlvbnMuZG9tID0gJzxcIm5ld2J1dHRvblwiPmZydGlwJztcbiAgdmFyIGlkID0gJCgnI2RlZ3JlZXByb2dyYW1faWQnKS52YWwoKTtcbiAgb3B0aW9ucy5hamF4ID0ge1xuICAgICAgdXJsOiAnL2FkbWluL2RlZ3JlZXByb2dyYW1yZXF1aXJlbWVudHMvJyArIGlkLFxuICAgICAgZGF0YVNyYzogJycsXG4gIH07XG4gIG9wdGlvbnMuY29sdW1ucyA9IFtcbiAgICB7J2RhdGEnOiAnaWQnfSxcbiAgICB7J2RhdGEnOiAnbmFtZSd9LFxuICAgIHsnZGF0YSc6ICdjcmVkaXRzJ30sXG4gICAgeydkYXRhJzogJ3NlbWVzdGVyJ30sXG4gICAgeydkYXRhJzogJ29yZGVyaW5nJ30sXG4gICAgeydkYXRhJzogJ25vdGVzJ30sXG4gICAgeydkYXRhJzogJ2lkJ30sXG4gIF07XG4gIG9wdGlvbnMuY29sdW1uRGVmcyA9IFt7XG4gICAgICAgICAgICBcInRhcmdldHNcIjogLTEsXG4gICAgICAgICAgICBcImRhdGFcIjogJ2lkJyxcbiAgICAgICAgICAgIFwicmVuZGVyXCI6IGZ1bmN0aW9uKGRhdGEsIHR5cGUsIHJvdywgbWV0YSkge1xuICAgICAgICAgICAgICByZXR1cm4gXCI8YSBjbGFzcz1cXFwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1zbSBlZGl0XFxcIiBocmVmPVxcXCIjXFxcIiBkYXRhLWlkPVxcXCJcIiArIGRhdGEgKyBcIlxcXCIgcm9sZT1cXFwiYnV0dG9uXFxcIj5FZGl0PC9hPlwiO1xuICAgICAgICAgICAgfVxuICB9XVxuICBvcHRpb25zLm9yZGVyID0gW1xuICAgIFszLCBcImFzY1wiXSxcbiAgICBbNCwgXCJhc2NcIl0sXG4gIF07XG4gIGRhc2hib2FyZC5pbml0KG9wdGlvbnMpO1xuXG4gICQoXCJkaXYubmV3YnV0dG9uXCIpLmh0bWwoJzxhIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tc3VjY2Vzc1wiIGhyZWY9XCIjXCIgaWQ9XCJuZXdcIj5OZXcgRGVncmVlIFJlcXVpcmVtZW50PC9hPicpO1xuXG4gICQoJyNzYXZlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgZGF0YSA9IHtcbiAgICAgIG5vdGVzOiAkKCcjbm90ZXMnKS52YWwoKSxcbiAgICAgIGRlZ3JlZXByb2dyYW1faWQ6ICQoJyNkZWdyZWVwcm9ncmFtX2lkJykudmFsKCksXG4gICAgICBzZW1lc3RlcjogJCgnI3NlbWVzdGVyJykudmFsKCksXG4gICAgICBvcmRlcmluZzogJCgnI29yZGVyaW5nJykudmFsKCksXG4gICAgICBjcmVkaXRzOiAkKCcjY3JlZGl0cycpLnZhbCgpLFxuICAgIH07XG4gICAgdmFyIHNlbGVjdGVkID0gJChcImlucHV0W25hbWU9J3JlcXVpcmVhYmxlJ106Y2hlY2tlZFwiKTtcbiAgICBpZiAoc2VsZWN0ZWQubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgc2VsZWN0ZWRWYWwgPSBzZWxlY3RlZC52YWwoKTtcbiAgICAgICAgaWYoc2VsZWN0ZWRWYWwgPT0gMSl7XG4gICAgICAgICAgZGF0YS5jb3Vyc2VfbmFtZSA9ICQoJyNjb3Vyc2VfbmFtZScpLnZhbCgpO1xuICAgICAgICB9ZWxzZSBpZihzZWxlY3RlZFZhbCA9PSAyKXtcbiAgICAgICAgICBpZigkKCcjZWxlY3RpdmVsaXN0X2lkJykudmFsKCkgPiAwKXtcbiAgICAgICAgICAgIGRhdGEuZWxlY3RpdmVsaXN0X2lkID0gJCgnI2VsZWN0aXZlbGlzdF9pZCcpLnZhbCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIgaWQgPSAkKCcjaWQnKS52YWwoKTtcbiAgICBpZihpZC5sZW5ndGggPT0gMCl7XG4gICAgICB2YXIgdXJsID0gJy9hZG1pbi9uZXdkZWdyZWVyZXF1aXJlbWVudCc7XG4gICAgfWVsc2V7XG4gICAgICB2YXIgdXJsID0gJy9hZG1pbi9kZWdyZWVyZXF1aXJlbWVudC8nICsgaWQ7XG4gICAgfVxuICAgIGRhc2hib2FyZC5hamF4bW9kYWxzYXZlKGRhdGEsIHVybCwgJyNkZWdyZWVyZXF1aXJlbWVudGZvcm0nKTtcbiAgfSk7XG5cbiAgJCgnI2RlbGV0ZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIHVybCA9IFwiL2FkbWluL2RlbGV0ZWRlZ3JlZXJlcXVpcmVtZW50XCI7XG4gICAgdmFyIGRhdGEgPSB7XG4gICAgICBpZDogJCgnI2lkJykudmFsKCksXG4gICAgfTtcbiAgICBkYXNoYm9hcmQuYWpheG1vZGFsZGVsZXRlKGRhdGEsIHVybCwgJyNkZWdyZWVyZXF1aXJlbWVudGZvcm0nKTtcbiAgfSk7XG5cbiAgJCgnI2RlZ3JlZXJlcXVpcmVtZW50Zm9ybScpLm9uKCdzaG93bi5icy5tb2RhbCcsIHNob3dzZWxlY3RlZCk7XG5cbiAgJCgnI2RlZ3JlZXJlcXVpcmVtZW50Zm9ybScpLm9uKCdoaWRkZW4uYnMubW9kYWwnLCByZXNldEZvcm0pO1xuXG4gIHJlc2V0Rm9ybSgpO1xuXG4gICQoJyNuZXcnKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgICQoJyNpZCcpLnZhbChcIlwiKTtcbiAgICAkKCcjZGVncmVlcHJvZ3JhbV9pZHZpZXcnKS52YWwoJCgnI2RlZ3JlZXByb2dyYW1faWR2aWV3JykuYXR0cigndmFsdWUnKSk7XG4gICAgJCgnI2RlbGV0ZScpLmhpZGUoKTtcbiAgICAkKCcjZGVncmVlcmVxdWlyZW1lbnRmb3JtJykubW9kYWwoJ3Nob3cnKTtcbiAgfSk7XG5cbiAgJCgnI3RhYmxlJykub24oJ2NsaWNrJywgJy5lZGl0JywgZnVuY3Rpb24oKXtcbiAgICB2YXIgaWQgPSAkKHRoaXMpLmRhdGEoJ2lkJyk7XG4gICAgdmFyIHVybCA9ICcvYWRtaW4vZGVncmVlcmVxdWlyZW1lbnQvJyArIGlkO1xuICAgIHdpbmRvdy5heGlvcy5nZXQodXJsKVxuICAgICAgLnRoZW4oZnVuY3Rpb24obWVzc2FnZSl7XG4gICAgICAgICQoJyNpZCcpLnZhbChtZXNzYWdlLmRhdGEuaWQpO1xuICAgICAgICAkKCcjc2VtZXN0ZXInKS52YWwobWVzc2FnZS5kYXRhLnNlbWVzdGVyKTtcbiAgICAgICAgJCgnI29yZGVyaW5nJykudmFsKG1lc3NhZ2UuZGF0YS5vcmRlcmluZyk7XG4gICAgICAgICQoJyNjcmVkaXRzJykudmFsKG1lc3NhZ2UuZGF0YS5jcmVkaXRzKTtcbiAgICAgICAgJCgnI25vdGVzJykudmFsKG1lc3NhZ2UuZGF0YS5ub3Rlcyk7XG4gICAgICAgICQoJyNkZWdyZWVwcm9ncmFtX2lkdmlldycpLnZhbCgkKCcjZGVncmVlcHJvZ3JhbV9pZHZpZXcnKS5hdHRyKCd2YWx1ZScpKTtcbiAgICAgICAgaWYobWVzc2FnZS5kYXRhLnR5cGUgPT0gXCJjb3Vyc2VcIil7XG4gICAgICAgICAgJCgnI2NvdXJzZV9uYW1lJykudmFsKG1lc3NhZ2UuZGF0YS5jb3Vyc2VfbmFtZSk7XG4gICAgICAgICAgJCgnI3JlcXVpcmVhYmxlMScpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKTtcbiAgICAgICAgICAkKCcjcmVxdWlyZWRjb3Vyc2UnKS5zaG93KCk7XG4gICAgICAgICAgJCgnI2VsZWN0aXZlY291cnNlJykuaGlkZSgpO1xuICAgICAgICB9ZWxzZSBpZiAobWVzc2FnZS5kYXRhLnR5cGUgPT0gXCJlbGVjdGl2ZWxpc3RcIil7XG4gICAgICAgICAgJCgnI2VsZWN0aXZlbGlzdF9pZCcpLnZhbChtZXNzYWdlLmRhdGEuZWxlY3RpdmVsaXN0X2lkKTtcbiAgICAgICAgICAkKCcjZWxlY3RpdmVsaXN0X2lkdGV4dCcpLmh0bWwoXCJTZWxlY3RlZDogKFwiICsgbWVzc2FnZS5kYXRhLmVsZWN0aXZlbGlzdF9pZCArIFwiKSBcIiArIG1lc3NhZ2UuZGF0YS5lbGVjdGl2ZWxpc3RfbmFtZSk7XG4gICAgICAgICAgJCgnI3JlcXVpcmVhYmxlMicpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKTtcbiAgICAgICAgICAkKCcjcmVxdWlyZWRjb3Vyc2UnKS5oaWRlKCk7XG4gICAgICAgICAgJCgnI2VsZWN0aXZlY291cnNlJykuc2hvdygpO1xuICAgICAgICB9XG4gICAgICAgICQoJyNkZWxldGUnKS5zaG93KCk7XG4gICAgICAgICQoJyNkZWdyZWVyZXF1aXJlbWVudGZvcm0nKS5tb2RhbCgnc2hvdycpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbihlcnJvcil7XG4gICAgICAgIHNpdGUuaGFuZGxlRXJyb3IoJ3JldHJpZXZlIHJlcXVpcmVtZW50JywgJycsIGVycm9yKTtcbiAgICAgIH0pO1xuXG4gIH0pO1xuXG4gICQoJ2lucHV0W25hbWU9cmVxdWlyZWFibGVdJykub24oJ2NoYW5nZScsIHNob3dzZWxlY3RlZCk7XG5cbiAgZGFzaGJvYXJkLmFqYXhhdXRvY29tcGxldGUoJ2VsZWN0aXZlbGlzdF9pZCcsICcvZWxlY3RpdmVsaXN0cy9lbGVjdGl2ZWxpc3RmZWVkJyk7XG59O1xuXG4vKipcbiAqIERldGVybWluZSB3aGljaCBkaXYgdG8gc2hvdyBpbiB0aGUgZm9ybVxuICovXG52YXIgc2hvd3NlbGVjdGVkID0gZnVuY3Rpb24oKXtcbiAgLy9odHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy84NjIyMzM2L2pxdWVyeS1nZXQtdmFsdWUtb2Ytc2VsZWN0ZWQtcmFkaW8tYnV0dG9uXG4gIHZhciBzZWxlY3RlZCA9ICQoXCJpbnB1dFtuYW1lPSdyZXF1aXJlYWJsZSddOmNoZWNrZWRcIik7XG4gIGlmIChzZWxlY3RlZC5sZW5ndGggPiAwKSB7XG4gICAgICB2YXIgc2VsZWN0ZWRWYWwgPSBzZWxlY3RlZC52YWwoKTtcbiAgICAgIGlmKHNlbGVjdGVkVmFsID09IDEpe1xuICAgICAgICAkKCcjcmVxdWlyZWRjb3Vyc2UnKS5zaG93KCk7XG4gICAgICAgICQoJyNlbGVjdGl2ZWNvdXJzZScpLmhpZGUoKTtcbiAgICAgIH1lbHNlIGlmKHNlbGVjdGVkVmFsID09IDIpe1xuICAgICAgICAkKCcjcmVxdWlyZWRjb3Vyc2UnKS5oaWRlKCk7XG4gICAgICAgICQoJyNlbGVjdGl2ZWNvdXJzZScpLnNob3coKTtcbiAgICAgIH1cbiAgfVxufVxuXG52YXIgcmVzZXRGb3JtID0gZnVuY3Rpb24oKXtcbiAgc2l0ZS5jbGVhckZvcm1FcnJvcnMoKTtcbiAgJCgnI2lkJykudmFsKFwiXCIpO1xuICAkKCcjc2VtZXN0ZXInKS52YWwoXCJcIik7XG4gICQoJyNvcmRlcmluZycpLnZhbChcIlwiKTtcbiAgJCgnI2NyZWRpdHMnKS52YWwoXCJcIik7XG4gICQoJyNub3RlcycpLnZhbChcIlwiKTtcbiAgJCgnI2RlZ3JlZXByb2dyYW1faWR2aWV3JykudmFsKCQoJyNkZWdyZWVwcm9ncmFtX2lkdmlldycpLmF0dHIoJ3ZhbHVlJykpO1xuICAkKCcjY291cnNlX25hbWUnKS52YWwoXCJcIik7XG4gICQoJyNlbGVjdGl2ZWxpc3RfaWQnKS52YWwoXCItMVwiKTtcbiAgJCgnI2VsZWN0aXZlbGlzdF9pZGF1dG8nKS52YWwoXCJcIik7XG4gICQoJyNlbGVjdGl2ZWxpc3RfaWR0ZXh0JykuaHRtbChcIlNlbGVjdGVkICgwKSBcIik7XG4gICQoJyNyZXF1aXJlYWJsZTEnKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XG4gICQoJyNyZXF1aXJlYWJsZTInKS5wcm9wKCdjaGVja2VkJywgZmFsc2UpO1xuICAkKCcjcmVxdWlyZWRjb3Vyc2UnKS5zaG93KCk7XG4gICQoJyNlbGVjdGl2ZWNvdXJzZScpLmhpZGUoKTtcbn1cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL2RlZ3JlZXByb2dyYW1kZXRhaWwuanMiLCJ2YXIgZGFzaGJvYXJkID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9kYXNoYm9hcmQnKTtcbnZhciBzaXRlID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9zaXRlJyk7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uKCl7XG4gIHZhciBvcHRpb25zID0gZGFzaGJvYXJkLmRhdGFUYWJsZU9wdGlvbnM7XG4gIG9wdGlvbnMuZG9tID0gJzxcIm5ld2J1dHRvblwiPmZydGlwJztcbiAgdmFyIGlkID0gJCgnI2VsZWN0aXZlbGlzdF9pZCcpLnZhbCgpO1xuICBvcHRpb25zLmFqYXggPSB7XG4gICAgICB1cmw6ICcvYWRtaW4vZWxlY3RpdmVsaXN0Y291cnNlcy8nICsgaWQsXG4gICAgICBkYXRhU3JjOiAnJyxcbiAgfTtcbiAgb3B0aW9ucy5jb2x1bW5zID0gW1xuICAgIHsnZGF0YSc6ICdpZCd9LFxuICAgIHsnZGF0YSc6ICduYW1lJ30sXG4gICAgeydkYXRhJzogJ2lkJ30sXG4gIF07XG4gIG9wdGlvbnMuY29sdW1uRGVmcyA9IFt7XG4gICAgICAgICAgICBcInRhcmdldHNcIjogLTEsXG4gICAgICAgICAgICBcImRhdGFcIjogJ2lkJyxcbiAgICAgICAgICAgIFwicmVuZGVyXCI6IGZ1bmN0aW9uKGRhdGEsIHR5cGUsIHJvdywgbWV0YSkge1xuICAgICAgICAgICAgICByZXR1cm4gXCI8YSBjbGFzcz1cXFwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1zbSBlZGl0XFxcIiBocmVmPVxcXCIjXFxcIiBkYXRhLWlkPVxcXCJcIiArIGRhdGEgKyBcIlxcXCIgcm9sZT1cXFwiYnV0dG9uXFxcIj5FZGl0PC9hPlwiO1xuICAgICAgICAgICAgfVxuICB9XVxuICBvcHRpb25zLm9yZGVyID0gW1xuICAgIFsxLCBcImFzY1wiXSxcbiAgXTtcbiAgZGFzaGJvYXJkLmluaXQob3B0aW9ucyk7XG5cbiAgJChcImRpdi5uZXdidXR0b25cIikuaHRtbCgnPGEgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1zdWNjZXNzXCIgaHJlZj1cIiNcIiBpZD1cIm5ld1wiPkFkZCBDb3Vyc2U8L2E+Jyk7XG5cbiAgJCgnI3NhdmUnKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgIHZhciBkYXRhID0ge1xuICAgICAgZWxlY3RpdmVsaXN0X2lkOiAkKCcjZWxlY3RpdmVsaXN0X2lkJykudmFsKCksXG4gICAgICBjb3Vyc2VfcHJlZml4OiAkKCcjY291cnNlX3ByZWZpeCcpLnZhbCgpLFxuICAgIH07XG4gICAgdmFyIHNlbGVjdGVkID0gJChcImlucHV0W25hbWU9J3JhbmdlJ106Y2hlY2tlZFwiKTtcbiAgICBpZiAoc2VsZWN0ZWQubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgc2VsZWN0ZWRWYWwgPSBzZWxlY3RlZC52YWwoKTtcbiAgICAgICAgaWYoc2VsZWN0ZWRWYWwgPT0gMSl7XG4gICAgICAgICAgZGF0YS5jb3Vyc2VfbWluX251bWJlciA9ICQoJyNjb3Vyc2VfbWluX251bWJlcicpLnZhbCgpO1xuICAgICAgICB9ZWxzZSBpZihzZWxlY3RlZFZhbCA9PSAyKXtcbiAgICAgICAgICBkYXRhLmNvdXJzZV9taW5fbnVtYmVyID0gJCgnI2NvdXJzZV9taW5fbnVtYmVyJykudmFsKCk7XG4gICAgICAgICAgZGF0YS5jb3Vyc2VfbWF4X251bWJlciA9ICQoJyNjb3Vyc2VfbWF4X251bWJlcicpLnZhbCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBpZCA9ICQoJyNpZCcpLnZhbCgpO1xuICAgIGlmKGlkLmxlbmd0aCA9PSAwKXtcbiAgICAgIHZhciB1cmwgPSAnL2FkbWluL25ld2VsZWN0aXZlbGlzdGNvdXJzZSc7XG4gICAgfWVsc2V7XG4gICAgICB2YXIgdXJsID0gJy9hZG1pbi9lbGVjdGl2ZWNvdXJzZS8nICsgaWQ7XG4gICAgfVxuICAgIGRhc2hib2FyZC5hamF4bW9kYWxzYXZlKGRhdGEsIHVybCwgJyNlbGVjdGl2ZWxpc3Rjb3Vyc2Vmb3JtJyk7XG4gIH0pO1xuXG4gICQoJyNkZWxldGUnKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgIHZhciB1cmwgPSBcIi9hZG1pbi9kZWxldGVlbGVjdGl2ZWNvdXJzZVwiO1xuICAgIHZhciBkYXRhID0ge1xuICAgICAgaWQ6ICQoJyNpZCcpLnZhbCgpLFxuICAgIH07XG4gICAgZGFzaGJvYXJkLmFqYXhtb2RhbGRlbGV0ZShkYXRhLCB1cmwsICcjZWxlY3RpdmVsaXN0Y291cnNlZm9ybScpO1xuICB9KTtcblxuICAkKCcjZWxlY3RpdmVsaXN0Y291cnNlZm9ybScpLm9uKCdzaG93bi5icy5tb2RhbCcsIHNob3dzZWxlY3RlZCk7XG5cbiAgJCgnI2VsZWN0aXZlbGlzdGNvdXJzZWZvcm0nKS5vbignaGlkZGVuLmJzLm1vZGFsJywgcmVzZXRGb3JtKTtcblxuICByZXNldEZvcm0oKTtcblxuICAkKCcjbmV3Jykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICAkKCcjaWQnKS52YWwoXCJcIik7XG4gICAgJCgnI2VsZWN0aXZlbGlzdF9pZHZpZXcnKS52YWwoJCgnI2VsZWN0aXZlbGlzdF9pZHZpZXcnKS5hdHRyKCd2YWx1ZScpKTtcbiAgICAkKCcjZGVsZXRlJykuaGlkZSgpO1xuICAgICQoJyNlbGVjdGl2ZWxpc3Rjb3Vyc2Vmb3JtJykubW9kYWwoJ3Nob3cnKTtcbiAgfSk7XG5cbiAgJCgnI3RhYmxlJykub24oJ2NsaWNrJywgJy5lZGl0JywgZnVuY3Rpb24oKXtcbiAgICB2YXIgaWQgPSAkKHRoaXMpLmRhdGEoJ2lkJyk7XG4gICAgdmFyIHVybCA9ICcvYWRtaW4vZWxlY3RpdmVjb3Vyc2UvJyArIGlkO1xuICAgIHdpbmRvdy5heGlvcy5nZXQodXJsKVxuICAgICAgLnRoZW4oZnVuY3Rpb24obWVzc2FnZSl7XG4gICAgICAgICQoJyNpZCcpLnZhbChtZXNzYWdlLmRhdGEuaWQpO1xuICAgICAgICAkKCcjY291cnNlX3ByZWZpeCcpLnZhbChtZXNzYWdlLmRhdGEuY291cnNlX3ByZWZpeCk7XG4gICAgICAgICQoJyNjb3Vyc2VfbWluX251bWJlcicpLnZhbChtZXNzYWdlLmRhdGEuY291cnNlX21pbl9udW1iZXIpO1xuICAgICAgICBpZihtZXNzYWdlLmRhdGEuY291cnNlX21heF9udW1iZXIpe1xuICAgICAgICAgICQoJyNjb3Vyc2VfbWF4X251bWJlcicpLnZhbChtZXNzYWdlLmRhdGEuY291cnNlX21heF9udW1iZXIpO1xuICAgICAgICAgICQoJyNyYW5nZTInKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XG4gICAgICAgICAgJCgnI2NvdXJzZXJhbmdlJykuc2hvdygpO1xuICAgICAgICAgICQoJyNzaW5nbGVjb3Vyc2UnKS5oaWRlKCk7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICQoJyNjb3Vyc2VfbWF4X251bWJlcicpLnZhbChcIlwiKTtcbiAgICAgICAgICAkKCcjcmFuZ2UxJykucHJvcCgnY2hlY2tlZCcsIHRydWUpO1xuICAgICAgICAgICQoJyNzaW5nbGVjb3Vyc2UnKS5zaG93KCk7XG4gICAgICAgICAgJCgnI2NvdXJzZXJhbmdlJykuaGlkZSgpO1xuICAgICAgICB9XG4gICAgICAgICQoJyNkZWxldGUnKS5zaG93KCk7XG4gICAgICAgICQoJyNlbGVjdGl2ZWxpc3Rjb3Vyc2Vmb3JtJykubW9kYWwoJ3Nob3cnKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyb3Ipe1xuICAgICAgICBzaXRlLmhhbmRsZUVycm9yKCdyZXRyaWV2ZSBlbGVjdGl2ZSBsaXN0IGNvdXJzZScsICcnLCBlcnJvcik7XG4gICAgICB9KTtcblxuICAgIH0pO1xuXG4gICAgJCgnaW5wdXRbbmFtZT1yYW5nZV0nKS5vbignY2hhbmdlJywgc2hvd3NlbGVjdGVkKTtcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lIHdoaWNoIGRpdiB0byBzaG93IGluIHRoZSBmb3JtXG4gKi9cbnZhciBzaG93c2VsZWN0ZWQgPSBmdW5jdGlvbigpe1xuICAvL2h0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzg2MjIzMzYvanF1ZXJ5LWdldC12YWx1ZS1vZi1zZWxlY3RlZC1yYWRpby1idXR0b25cbiAgdmFyIHNlbGVjdGVkID0gJChcImlucHV0W25hbWU9J3JhbmdlJ106Y2hlY2tlZFwiKTtcbiAgaWYgKHNlbGVjdGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIHZhciBzZWxlY3RlZFZhbCA9IHNlbGVjdGVkLnZhbCgpO1xuICAgICAgaWYoc2VsZWN0ZWRWYWwgPT0gMSl7XG4gICAgICAgICQoJyNzaW5nbGVjb3Vyc2UnKS5zaG93KCk7XG4gICAgICAgICQoJyNjb3Vyc2VyYW5nZScpLmhpZGUoKTtcbiAgICAgIH1lbHNlIGlmKHNlbGVjdGVkVmFsID09IDIpe1xuICAgICAgICAkKCcjc2luZ2xlY291cnNlJykuaGlkZSgpO1xuICAgICAgICAkKCcjY291cnNlcmFuZ2UnKS5zaG93KCk7XG4gICAgICB9XG4gIH1cbn1cblxudmFyIHJlc2V0Rm9ybSA9IGZ1bmN0aW9uKCl7XG4gIHNpdGUuY2xlYXJGb3JtRXJyb3JzKCk7XG4gICQoJyNpZCcpLnZhbChcIlwiKTtcbiAgJCgnI2NvdXJzZV9wcmVmaXgnKS52YWwoXCJcIik7XG4gICQoJyNjb3Vyc2VfbWluX251bWJlcicpLnZhbChcIlwiKTtcbiAgJCgnI2NvdXJzZV9tYXhfbnVtYmVyJykudmFsKFwiXCIpO1xuICAkKCcjcmFuZ2UxJykucHJvcCgnY2hlY2tlZCcsIHRydWUpO1xuICAkKCcjcmFuZ2UyJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcbiAgJCgnI3NpbmdsZWNvdXJzZScpLnNob3coKTtcbiAgJCgnI2NvdXJzZXJhbmdlJykuaGlkZSgpO1xufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvZWxlY3RpdmVsaXN0ZGV0YWlsLmpzIiwidmFyIGRhc2hib2FyZCA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvZGFzaGJvYXJkJyk7XG52YXIgc2l0ZSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvc2l0ZScpO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbigpe1xuICB2YXIgb3B0aW9ucyA9IGRhc2hib2FyZC5kYXRhVGFibGVPcHRpb25zO1xuICBvcHRpb25zLmRvbSA9ICc8XCJuZXdidXR0b25cIj5mcnRpcCc7XG4gIHZhciBpZCA9ICQoJyNwbGFuX2lkJykudmFsKCk7XG4gIG9wdGlvbnMuYWpheCA9IHtcbiAgICAgIHVybDogJy9hZG1pbi9wbGFucmVxdWlyZW1lbnRzLycgKyBpZCxcbiAgICAgIGRhdGFTcmM6ICcnLFxuICB9O1xuICBvcHRpb25zLmNvbHVtbnMgPSBbXG4gICAgeydkYXRhJzogJ2lkJ30sXG4gICAgeydkYXRhJzogJ25hbWUnfSxcbiAgICB7J2RhdGEnOiAnZWxlY3RpdmVsaXN0X2FiYnInfSxcbiAgICB7J2RhdGEnOiAnY3JlZGl0cyd9LFxuICAgIHsnZGF0YSc6ICdzZW1lc3Rlcid9LFxuICAgIHsnZGF0YSc6ICdvcmRlcmluZyd9LFxuICAgIHsnZGF0YSc6ICdub3Rlcyd9LFxuICAgIHsnZGF0YSc6ICdjYXRhbG9nX2NvdXJzZSd9LFxuICAgIHsnZGF0YSc6ICdjb21wbGV0ZWRfY291cnNlJ30sXG4gICAgeydkYXRhJzogJ2lkJ30sXG4gIF07XG4gIG9wdGlvbnMuY29sdW1uRGVmcyA9IFt7XG4gICAgICAgICAgICBcInRhcmdldHNcIjogLTEsXG4gICAgICAgICAgICBcImRhdGFcIjogJ2lkJyxcbiAgICAgICAgICAgIFwicmVuZGVyXCI6IGZ1bmN0aW9uKGRhdGEsIHR5cGUsIHJvdywgbWV0YSkge1xuICAgICAgICAgICAgICByZXR1cm4gXCI8YSBjbGFzcz1cXFwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1zbSBlZGl0XFxcIiBocmVmPVxcXCIjXFxcIiBkYXRhLWlkPVxcXCJcIiArIGRhdGEgKyBcIlxcXCIgcm9sZT1cXFwiYnV0dG9uXFxcIj5FZGl0PC9hPlwiO1xuICAgICAgICAgICAgfVxuICB9XTtcbiAgb3B0aW9ucy5vcmRlciA9IFtcbiAgICBbNCwgXCJhc2NcIl0sXG4gICAgWzUsIFwiYXNjXCJdLFxuICBdO1xuICBkYXNoYm9hcmQuaW5pdChvcHRpb25zKTtcblxuICAkKFwiZGl2Lm5ld2J1dHRvblwiKS5odG1sKCc8YSB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLXN1Y2Nlc3NcIiBocmVmPVwiI1wiIGlkPVwibmV3XCI+TmV3IFBsYW4gUmVxdWlyZW1lbnQ8L2E+Jyk7XG5cbiAgLy9hZGRlZCBmb3IgbmV3IHNlbWVzdGVycyB0YWJsZVxuICB2YXIgb3B0aW9uczIgPSB7XG4gICAgXCJwYWdlTGVuZ3RoXCI6IDUwLFxuICAgIFwibGVuZ3RoQ2hhbmdlXCI6IGZhbHNlLFxuICB9XG4gIG9wdGlvbnMyLmRvbSA9ICc8XCJuZXdidXR0b24yXCI+ZnJ0aXAnO1xuICBvcHRpb25zMi5hamF4ID0ge1xuICAgICAgdXJsOiAnL2FkbWluL3BsYW5zL3BsYW5zZW1lc3RlcnMvJyArIGlkLFxuICAgICAgZGF0YVNyYzogJycsXG4gIH07XG4gIG9wdGlvbnMyLmNvbHVtbnMgPSBbXG4gICAgeydkYXRhJzogJ2lkJ30sXG4gICAgeydkYXRhJzogJ25hbWUnfSxcbiAgICB7J2RhdGEnOiAnb3JkZXJpbmcnfSxcbiAgICB7J2RhdGEnOiAnaWQnfSxcbiAgXTtcbiAgb3B0aW9uczIuY29sdW1uRGVmcyA9IFt7XG4gICAgICAgICAgICBcInRhcmdldHNcIjogLTEsXG4gICAgICAgICAgICBcImRhdGFcIjogJ2lkJyxcbiAgICAgICAgICAgIFwicmVuZGVyXCI6IGZ1bmN0aW9uKGRhdGEsIHR5cGUsIHJvdywgbWV0YSkge1xuICAgICAgICAgICAgICByZXR1cm4gXCI8YSBjbGFzcz1cXFwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1zbSBlZGl0c2VtXFxcIiBocmVmPVxcXCIvYWRtaW4vcGxhbnMvcGxhbnNlbWVzdGVyL1wiICsgZGF0YSArIFwiXFxcIiByb2xlPVxcXCJidXR0b25cXFwiPkVkaXQ8L2E+XCI7XG4gICAgICAgICAgICB9XG4gIH1dO1xuICBvcHRpb25zMi5vcmRlciA9IFtcbiAgICBbMiwgXCJhc2NcIl0sXG4gIF07XG4gICQoJyN0YWJsZXNlbScpLkRhdGFUYWJsZShvcHRpb25zMik7XG5cbiAgJChcImRpdi5uZXdidXR0b24yXCIpLmh0bWwoJzxhIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tc3VjY2Vzc1wiIGhyZWY9XCIvYWRtaW4vcGxhbnMvbmV3cGxhbnNlbWVzdGVyLycgKyBpZCArICdcIiBpZD1cIm5ldzJcIj5OZXcgU2VtZXN0ZXI8L2E+Jyk7XG5cbiAgJCgnI3NhdmUnKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgIHZhciBkYXRhID0ge1xuICAgICAgbm90ZXM6ICQoJyNub3RlcycpLnZhbCgpLFxuICAgICAgcGxhbl9pZDogJCgnI3BsYW5faWQnKS52YWwoKSxcbiAgICAgIG9yZGVyaW5nOiAkKCcjb3JkZXJpbmcnKS52YWwoKSxcbiAgICAgIGNyZWRpdHM6ICQoJyNjcmVkaXRzJykudmFsKCksXG4gICAgICBzdHVkZW50X2lkOiAkKCcjc3R1ZGVudF9pZCcpLnZhbCgpLFxuICAgICAgY291cnNlX2lkX2xvY2s6ICQoJyNjb3Vyc2VfaWRsb2NrJykudmFsKCksXG4gICAgICBjb21wbGV0ZWRjb3Vyc2VfaWRfbG9jazogJCgnI2NvbXBsZXRlZGNvdXJzZV9pZGxvY2snKS52YWwoKSxcbiAgICB9O1xuICAgIGlmKCQoJyNzZW1lc3Rlcl9pZCcpLnZhbCgpID4gMCl7XG4gICAgICBkYXRhLnNlbWVzdGVyX2lkID0gJCgnI3NlbWVzdGVyX2lkJykudmFsKCk7XG4gICAgfVxuICAgIGRhdGEuY291cnNlX25hbWUgPSAkKCcjY291cnNlX25hbWUnKS52YWwoKTtcbiAgICBpZigkKCcjZWxlY3RpdmVsaXN0X2lkJykudmFsKCkgPiAwKXtcbiAgICAgIGRhdGEuZWxlY3RpdmVsaXN0X2lkID0gJCgnI2VsZWN0aXZlbGlzdF9pZCcpLnZhbCgpO1xuICAgIH1lbHNle1xuICAgICAgZGF0YS5lbGVjdGl2ZWxpc3RfaWQgPSAnJztcbiAgICB9XG4gICAgaWYoJCgnI2NvdXJzZV9pZCcpLnZhbCgpID4gMCl7XG4gICAgICBkYXRhLmNvdXJzZV9pZCA9ICQoJyNjb3Vyc2VfaWQnKS52YWwoKTtcbiAgICB9ZWxzZXtcbiAgICAgIGRhdGEuY291cnNlX2lkID0gJyc7XG4gICAgfVxuICAgIGlmKCQoJyNjb21wbGV0ZWRjb3Vyc2VfaWQnKS52YWwoKSA+IDApe1xuICAgICAgZGF0YS5jb21wbGV0ZWRjb3Vyc2VfaWQgPSAkKCcjY29tcGxldGVkY291cnNlX2lkJykudmFsKCk7XG4gICAgfWVsc2V7XG4gICAgICBkYXRhLmNvbXBsZXRlZGNvdXJzZV9pZCA9ICcnO1xuICAgIH1cbiAgICB2YXIgaWQgPSAkKCcjaWQnKS52YWwoKTtcbiAgICBpZihpZC5sZW5ndGggPT0gMCl7XG4gICAgICB2YXIgdXJsID0gJy9hZG1pbi9uZXdwbGFucmVxdWlyZW1lbnQnO1xuICAgIH1lbHNle1xuICAgICAgdmFyIHVybCA9ICcvYWRtaW4vcGxhbnJlcXVpcmVtZW50LycgKyBpZDtcbiAgICB9XG4gICAgZGFzaGJvYXJkLmFqYXhtb2RhbHNhdmUoZGF0YSwgdXJsLCAnI3BsYW5yZXF1aXJlbWVudGZvcm0nKTtcbiAgfSk7XG5cbiAgJCgnI2RlbGV0ZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIHVybCA9IFwiL2FkbWluL2RlbGV0ZXBsYW5yZXF1aXJlbWVudFwiO1xuICAgIHZhciBkYXRhID0ge1xuICAgICAgaWQ6ICQoJyNpZCcpLnZhbCgpLFxuICAgIH07XG4gICAgZGFzaGJvYXJkLmFqYXhtb2RhbGRlbGV0ZShkYXRhLCB1cmwsICcjcGxhbnJlcXVpcmVtZW50Zm9ybScpO1xuICB9KTtcblxuICAkKCcjcGxhbnJlcXVpcmVtZW50Zm9ybScpLm9uKCdoaWRkZW4uYnMubW9kYWwnLCByZXNldEZvcm0pO1xuXG4gIHJlc2V0Rm9ybSgpO1xuXG4gICQoJyNuZXcnKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgICQoJyNpZCcpLnZhbChcIlwiKTtcbiAgICAkKCcjcGxhbl9pZHZpZXcnKS52YWwoJCgnI3BsYW5faWR2aWV3JykuYXR0cigndmFsdWUnKSk7XG4gICAgJCgnI2RlbGV0ZScpLmhpZGUoKTtcbiAgICB2YXIgcGxhbmlkID0gJCgnI3BsYW5faWQnKS52YWwoKTtcbiAgICB3aW5kb3cuYXhpb3MuZ2V0KCcvYWRtaW4vcGxhbnMvcGxhbnNlbWVzdGVycy8nICsgcGxhbmlkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24obWVzc2FnZSl7XG4gICAgICAgIHZhciBsaXN0aXRlbXMgPSAnJztcbiAgICAgICAgJC5lYWNoKG1lc3NhZ2UuZGF0YSwgZnVuY3Rpb24oa2V5LCB2YWx1ZSl7XG4gICAgICAgICAgbGlzdGl0ZW1zICs9ICc8b3B0aW9uIHZhbHVlPScgKyB2YWx1ZS5pZCArICc+JyArIHZhbHVlLm5hbWUgKyc8L29wdGlvbj4nO1xuICAgICAgICB9KTtcbiAgICAgICAgJCgnI3NlbWVzdGVyX2lkJykuZmluZCgnb3B0aW9uJykucmVtb3ZlKCkuZW5kKCkuYXBwZW5kKGxpc3RpdGVtcyk7XG4gICAgICAgICQoJyNzZW1lc3Rlcl9pZCcpLnZhbChzZW1lc3Rlcl9pZCk7XG4gICAgICAgICQoJyNwbGFucmVxdWlyZW1lbnRmb3JtJykubW9kYWwoJ3Nob3cnKTtcbiAgICAgIH0pXG4gIH0pO1xuXG4gICQoJyN0YWJsZScpLm9uKCdjbGljaycsICcuZWRpdCcsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIGlkID0gJCh0aGlzKS5kYXRhKCdpZCcpO1xuICAgIHZhciB1cmwgPSAnL2FkbWluL3BsYW5yZXF1aXJlbWVudC8nICsgaWQ7XG4gICAgd2luZG93LmF4aW9zLmdldCh1cmwpXG4gICAgICAudGhlbihmdW5jdGlvbihtZXNzYWdlKXtcbiAgICAgICAgJCgnI2lkJykudmFsKG1lc3NhZ2UuZGF0YS5pZCk7XG4gICAgICAgICQoJyNvcmRlcmluZycpLnZhbChtZXNzYWdlLmRhdGEub3JkZXJpbmcpO1xuICAgICAgICAkKCcjY3JlZGl0cycpLnZhbChtZXNzYWdlLmRhdGEuY3JlZGl0cyk7XG4gICAgICAgICQoJyNub3RlcycpLnZhbChtZXNzYWdlLmRhdGEubm90ZXMpO1xuICAgICAgICAkKCcjZGVncmVlcmVxdWlyZW1lbnRfaWQnKS52YWwobWVzc2FnZS5kYXRhLmRlZ3JlZXJlcXVpcmVtZW50X2lkKTtcbiAgICAgICAgJCgnI3BsYW5faWR2aWV3JykudmFsKCQoJyNwbGFuX2lkdmlldycpLmF0dHIoJ3ZhbHVlJykpO1xuICAgICAgICAkKCcjY291cnNlX25hbWUnKS52YWwobWVzc2FnZS5kYXRhLmNvdXJzZV9uYW1lKTtcbiAgICAgICAgJCgnI2VsZWN0aXZlbGlzdF9pZCcpLnZhbChtZXNzYWdlLmRhdGEuZWxlY3RpdmVsaXN0X2lkKTtcbiAgICAgICAgJCgnI2VsZWN0aXZlbGlzdF9pZHRleHQnKS5odG1sKFwiU2VsZWN0ZWQ6IChcIiArIG1lc3NhZ2UuZGF0YS5lbGVjdGl2ZWxpc3RfaWQgKyBcIikgXCIgKyBzaXRlLnRydW5jYXRlVGV4dChtZXNzYWdlLmRhdGEuZWxlY3RpdmVsaXN0X25hbWUsIDMwKSk7XG4gICAgICAgICQoJyNjb3Vyc2VfaWQnKS52YWwobWVzc2FnZS5kYXRhLmNvdXJzZV9pZCk7XG4gICAgICAgICQoJyNjb3Vyc2VfaWR0ZXh0JykuaHRtbChcIlNlbGVjdGVkOiAoXCIgKyBtZXNzYWdlLmRhdGEuY291cnNlX2lkICsgXCIpIFwiICsgc2l0ZS50cnVuY2F0ZVRleHQobWVzc2FnZS5kYXRhLmNhdGFsb2dfY291cnNlLCAzMCkpO1xuICAgICAgICBkYXNoYm9hcmQuYWpheGF1dG9jb21wbGV0ZXNldCgnY291cnNlX2lkJywgbWVzc2FnZS5kYXRhLmNvdXJzZV9pZF9sb2NrKTtcbiAgICAgICAgJCgnI2NvbXBsZXRlZGNvdXJzZV9pZCcpLnZhbChtZXNzYWdlLmRhdGEuY29tcGxldGVkY291cnNlX2lkKTtcbiAgICAgICAgJCgnI2NvbXBsZXRlZGNvdXJzZV9pZHRleHQnKS5odG1sKFwiU2VsZWN0ZWQ6IChcIiArIG1lc3NhZ2UuZGF0YS5jb21wbGV0ZWRjb3Vyc2VfaWQgKyBcIikgXCIgKyBzaXRlLnRydW5jYXRlVGV4dChtZXNzYWdlLmRhdGEuY29tcGxldGVkX2NvdXJzZSwgMzApKTtcbiAgICAgICAgZGFzaGJvYXJkLmFqYXhhdXRvY29tcGxldGVzZXQoJ2NvbXBsZXRlZGNvdXJzZV9pZCcsIG1lc3NhZ2UuZGF0YS5jb21wbGV0ZWRjb3Vyc2VfaWRfbG9jayk7XG4gICAgICAgICQoJyNkZWxldGUnKS5zaG93KCk7XG5cbiAgICAgICAgdmFyIHNlbWVzdGVyX2lkID0gbWVzc2FnZS5kYXRhLnNlbWVzdGVyX2lkO1xuXG4gICAgICAgIC8vbG9hZCBzZW1lc3RlcnNcbiAgICAgICAgdmFyIHBsYW5pZCA9ICQoJyNwbGFuX2lkJykudmFsKCk7XG4gICAgICAgIHdpbmRvdy5heGlvcy5nZXQoJy9hZG1pbi9wbGFucy9wbGFuc2VtZXN0ZXJzLycgKyBwbGFuaWQpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24obWVzc2FnZSl7XG4gICAgICAgICAgICB2YXIgbGlzdGl0ZW1zID0gJyc7XG4gICAgICAgICAgICAkLmVhY2gobWVzc2FnZS5kYXRhLCBmdW5jdGlvbihrZXksIHZhbHVlKXtcbiAgICAgICAgICAgICAgbGlzdGl0ZW1zICs9ICc8b3B0aW9uIHZhbHVlPScgKyB2YWx1ZS5pZCArICc+JyArIHZhbHVlLm5hbWUgKyc8L29wdGlvbj4nO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkKCcjc2VtZXN0ZXJfaWQnKS5maW5kKCdvcHRpb24nKS5yZW1vdmUoKS5lbmQoKS5hcHBlbmQobGlzdGl0ZW1zKTtcbiAgICAgICAgICAgICQoJyNzZW1lc3Rlcl9pZCcpLnZhbChzZW1lc3Rlcl9pZCk7XG4gICAgICAgICAgICAkKCcjcGxhbnJlcXVpcmVtZW50Zm9ybScpLm1vZGFsKCdzaG93Jyk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyb3Ipe1xuICAgICAgICAgICAgc2l0ZS5oYW5kbGVFcnJvcigncmV0cmlldmUgc2VtZXN0ZXJzJywgJycsIGVycm9yKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyb3Ipe1xuICAgICAgICBzaXRlLmhhbmRsZUVycm9yKCdyZXRyaWV2ZSByZXF1aXJlbWVudCcsICcnLCBlcnJvcik7XG4gICAgICB9KTtcblxuICB9KTtcblxuICBkYXNoYm9hcmQuYWpheGF1dG9jb21wbGV0ZSgnZWxlY3RpdmVsaXN0X2lkJywgJy9lbGVjdGl2ZWxpc3RzL2VsZWN0aXZlbGlzdGZlZWQnKTtcblxuICBkYXNoYm9hcmQuYWpheGF1dG9jb21wbGV0ZWxvY2soJ2NvdXJzZV9pZCcsICcvY291cnNlcy9jb3Vyc2VmZWVkJyk7XG5cbiAgdmFyIHN0dWRlbnRfaWQgPSAkKCcjc3R1ZGVudF9pZCcpLnZhbCgpO1xuICBkYXNoYm9hcmQuYWpheGF1dG9jb21wbGV0ZWxvY2soJ2NvbXBsZXRlZGNvdXJzZV9pZCcsICcvY29tcGxldGVkY291cnNlcy9jb21wbGV0ZWRjb3Vyc2VmZWVkLycgKyBzdHVkZW50X2lkKTtcbn07XG5cbnZhciByZXNldEZvcm0gPSBmdW5jdGlvbigpe1xuICBzaXRlLmNsZWFyRm9ybUVycm9ycygpO1xuICAkKCcjaWQnKS52YWwoXCJcIik7XG4gICQoJyNzZW1lc3RlcicpLnZhbChcIlwiKTtcbiAgJCgnI29yZGVyaW5nJykudmFsKFwiXCIpO1xuICAkKCcjY3JlZGl0cycpLnZhbChcIlwiKTtcbiAgJCgnI25vdGVzJykudmFsKFwiXCIpO1xuICAkKCcjZGVncmVlcmVxdWlyZW1lbnRfaWQnKS52YWwoXCJcIik7XG4gICQoJyNwbGFuX2lkdmlldycpLnZhbCgkKCcjcGxhbl9pZHZpZXcnKS5hdHRyKCd2YWx1ZScpKTtcbiAgJCgnI2NvdXJzZV9uYW1lJykudmFsKFwiXCIpO1xuICAkKCcjZWxlY3RpdmVsaXN0X2lkJykudmFsKFwiLTFcIik7XG4gICQoJyNlbGVjdGl2ZWxpc3RfaWRhdXRvJykudmFsKFwiXCIpO1xuICAkKCcjZWxlY3RpdmVsaXN0X2lkdGV4dCcpLmh0bWwoXCJTZWxlY3RlZCAoMCkgXCIpO1xuICAkKCcjY291cnNlX2lkJykudmFsKFwiLTFcIik7XG4gICQoJyNjb3Vyc2VfaWRhdXRvJykudmFsKFwiXCIpO1xuICAkKCcjY291cnNlX2lkdGV4dCcpLmh0bWwoXCJTZWxlY3RlZCAoMCkgXCIpO1xuICAkKCcjY29tcGxldGVkY291cnNlX2lkJykudmFsKFwiLTFcIik7XG4gICQoJyNjb21wbGV0ZWRjb3Vyc2VfaWRhdXRvJykudmFsKFwiXCIpO1xuICAkKCcjY29tcGxldGVkY291cnNlX2lkdGV4dCcpLmh0bWwoXCJTZWxlY3RlZCAoMCkgXCIpO1xuICBkYXNoYm9hcmQuYWpheGF1dG9jb21wbGV0ZXNldCgnY291cnNlX2lkJywgMCk7XG4gIGRhc2hib2FyZC5hamF4YXV0b2NvbXBsZXRlc2V0KCdjb21wbGV0ZWRjb3Vyc2VfaWQnLCAwKTtcbn1cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3BsYW5kZXRhaWwuanMiLCJ2YXIgc2l0ZSA9IHJlcXVpcmUoJy4uL3V0aWwvc2l0ZScpO1xud2luZG93LlZ1ZSA9IHJlcXVpcmUoJ3Z1ZScpO1xudmFyIGRyYWdnYWJsZSA9IHJlcXVpcmUoJ3Z1ZWRyYWdnYWJsZScpO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbigpe1xuXG4gIHdpbmRvdy52bSA9IG5ldyBWdWUoe1xuXHRcdGVsOiAnI2Zsb3djaGFydCcsXG5cdFx0ZGF0YToge1xuICAgICAgc2VtZXN0ZXJzOiBbXSxcbiAgICAgIGNvdXJzZV9pZDogLTEsXG4gICAgICBwcmVyZXF1aXNpdGVzOiBbXSxcbiAgICAgIGZvbGxvd2VyczogW10sXG5cdFx0fSxcbiAgICBtZXRob2RzOiB7XG4gICAgICBlZGl0U2VtZXN0ZXI6IGVkaXRTZW1lc3RlcixcbiAgICAgIHNhdmVTZW1lc3Rlcjogc2F2ZVNlbWVzdGVyLFxuICAgICAgZGVsZXRlU2VtZXN0ZXI6IGRlbGV0ZVNlbWVzdGVyLFxuICAgICAgZHJvcFNlbWVzdGVyOiBkcm9wU2VtZXN0ZXIsXG4gICAgICBkcm9wQ291cnNlOiBkcm9wQ291cnNlLFxuICAgICAgZWRpdENvdXJzZTogZWRpdENvdXJzZSxcbiAgICAgIHNob3dQcmVyZXFzOiBzaG93UHJlcmVxcyxcbiAgICAgIHByZXJlcUNsYXNzOiBwcmVyZXFDbGFzcyxcbiAgICB9LFxuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgIGRyYWdnYWJsZSxcbiAgICB9LFxuICB9KTtcblxuICBsb2FkRGF0YSgpO1xuXG4gICQoJyNyZXNldCcpLm9uKCdjbGljaycsIGxvYWREYXRhKTtcbiAgJCgnI2FkZC1zZW0nKS5vbignY2xpY2snLCBhZGRTZW1lc3Rlcik7XG4gICQoJyNhZGQtY291cnNlJykub24oJ2NsaWNrJywgYWRkQ291cnNlKTtcblxuICAkKCcjc2F2ZUNvdXJzZScpLm9uKCdjbGljaycsIHNhdmVDb3Vyc2UpO1xuICAkKCcjZGVsZXRlQ291cnNlJykub24oJ2NsaWNrJywgZGVsZXRlQ291cnNlKTtcblxuICBzaXRlLmFqYXhhdXRvY29tcGxldGUoJ2VsZWN0aXZlbGlzdF9pZCcsICcvZWxlY3RpdmVsaXN0cy9lbGVjdGl2ZWxpc3RmZWVkJyk7XG5cbiAgc2l0ZS5hamF4YXV0b2NvbXBsZXRlbG9jaygnY291cnNlX2lkJywgJy9jb3Vyc2VzL2NvdXJzZWZlZWQnKTtcblxuICB2YXIgc3R1ZGVudF9pZCA9ICQoJyNzdHVkZW50X2lkJykudmFsKCk7XG4gIHNpdGUuYWpheGF1dG9jb21wbGV0ZWxvY2soJ2NvbXBsZXRlZGNvdXJzZV9pZCcsICcvY29tcGxldGVkY291cnNlcy9jb21wbGV0ZWRjb3Vyc2VmZWVkLycgKyBzdHVkZW50X2lkKTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gc29ydCBlbGVtZW50cyBiYXNlZCBvbiB0aGVpciBvcmRlcmluZ1xuICpcbiAqIEBwYXJhbSBhIC0gZmlyc3QgaXRlbVxuICogQHBhcmFtIGIgLSBzZWNvbmQgaXRlbVxuICogQHJldHVybiAtIHNvcnRpbmcgdmFsdWUgaW5kaWNhdGluZyB3aG8gc2hvdWxkIGdvIGZpcnN0XG4gKi9cbnZhciBzb3J0RnVuY3Rpb24gPSBmdW5jdGlvbihhLCBiKXtcblx0aWYoYS5vcmRlcmluZyA9PSBiLm9yZGVyaW5nKXtcblx0XHRyZXR1cm4gKGEuaWQgPCBiLmlkID8gLTEgOiAxKTtcblx0fVxuXHRyZXR1cm4gKGEub3JkZXJpbmcgPCBiLm9yZGVyaW5nID8gLTEgOiAxKTtcbn1cblxudmFyIGxvYWREYXRhID0gZnVuY3Rpb24oKXtcbiAgdmFyIGlkID0gJCgnI2lkJykudmFsKCk7XG4gIHdpbmRvdy5heGlvcy5nZXQoJy9mbG93Y2hhcnRzL3NlbWVzdGVycy8nICsgaWQpXG4gIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICB3aW5kb3cudm0uc2VtZXN0ZXJzID0gcmVzcG9uc2UuZGF0YTtcbiAgICB3aW5kb3cudm0uc2VtZXN0ZXJzLnNvcnQoc29ydEZ1bmN0aW9uKTtcbiAgICAkKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudClbMF0uc3R5bGUuc2V0UHJvcGVydHkoJy0tY29sTnVtJywgd2luZG93LnZtLnNlbWVzdGVycy5sZW5ndGgpO1xuICAgIHdpbmRvdy5heGlvcy5nZXQoJy9mbG93Y2hhcnRzL2RhdGEvJyArIGlkKVxuICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICQuZWFjaChyZXNwb25zZS5kYXRhLCBmdW5jdGlvbihpbmRleCwgdmFsdWUpe1xuICAgICAgICB2YXIgc2VtZXN0ZXIgPSB3aW5kb3cudm0uc2VtZXN0ZXJzLmZpbmQoZnVuY3Rpb24oZWxlbWVudCl7XG4gICAgICAgICAgcmV0dXJuIGVsZW1lbnQuaWQgPT0gdmFsdWUuc2VtZXN0ZXJfaWQ7XG4gICAgICAgIH0pXG4gICAgICAgIGlmKHZhbHVlLmRlZ3JlZXJlcXVpcmVtZW50X2lkIDw9IDApe1xuICAgICAgICAgIHZhbHVlLmN1c3RvbSA9IHRydWU7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgIHZhbHVlLmN1c3RvbSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmKHZhbHVlLmNvbXBsZXRlZGNvdXJzZV9pZCA8PSAwKXtcbiAgICAgICAgICB2YWx1ZS5jb21wbGV0ZSA9IGZhbHNlO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICB2YWx1ZS5jb21wbGV0ZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgc2VtZXN0ZXIuY291cnNlcy5wdXNoKHZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgJC5lYWNoKHdpbmRvdy52bS5zZW1lc3RlcnMsIGZ1bmN0aW9uKGluZGV4LCB2YWx1ZSl7XG4gICAgICAgIHZhbHVlLmNvdXJzZXMuc29ydChzb3J0RnVuY3Rpb24pO1xuICAgICAgfSk7XG4gICAgfSlcbiAgICAuY2F0Y2goZnVuY3Rpb24oZXJyb3Ipe1xuICAgICAgc2l0ZS5oYW5kbGVFcnJvcignZ2V0IGRhdGEnLCAnJywgZXJyb3IpO1xuICAgIH0pO1xuICB9KVxuICAuY2F0Y2goZnVuY3Rpb24oZXJyb3Ipe1xuICAgIHNpdGUuaGFuZGxlRXJyb3IoJ2dldCBkYXRhJywgJycsIGVycm9yKTtcbiAgfSk7XG59XG5cbnZhciBlZGl0U2VtZXN0ZXIgPSBmdW5jdGlvbihldmVudCl7XG4gIHZhciBzZW1pZCA9ICQoZXZlbnQuY3VycmVudFRhcmdldCkuZGF0YSgnaWQnKTtcbiAgJChcIiNzZW0tcGFuZWxlZGl0LVwiICsgc2VtaWQpLnNob3coKTtcbiAgJChcIiNzZW0tcGFuZWxoZWFkLVwiICsgc2VtaWQpLmhpZGUoKTtcbn1cblxudmFyIHNhdmVTZW1lc3RlciA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgdmFyIGlkID0gJCgnI2lkJykudmFsKCk7XG4gIHZhciBzZW1pZCA9ICQoZXZlbnQuY3VycmVudFRhcmdldCkuZGF0YSgnaWQnKTtcbiAgdmFyIGRhdGEgPSB7XG4gICAgaWQ6IHNlbWlkLFxuICAgIG5hbWU6ICQoXCIjc2VtLXRleHQtXCIgKyBzZW1pZCkudmFsKClcbiAgfVxuICB3aW5kb3cuYXhpb3MucG9zdCgnL2Zsb3djaGFydHMvc2VtZXN0ZXJzLycgKyBpZCArICcvc2F2ZScsIGRhdGEpXG4gICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgJChcIiNzZW0tcGFuZWxlZGl0LVwiICsgc2VtaWQpLmhpZGUoKTtcbiAgICAgICQoXCIjc2VtLXBhbmVsaGVhZC1cIiArIHNlbWlkKS5zaG93KCk7XG4gICAgICAvL3NpdGUuZGlzcGxheU1lc3NhZ2UocmVzcG9uc2UuZGF0YSwgXCJzdWNjZXNzXCIpO1xuICAgIH0pXG4gICAgLmNhdGNoKGZ1bmN0aW9uKGVycm9yKXtcbiAgICAgIHNpdGUuZGlzcGxheU1lc3NhZ2UoXCJBSkFYIEVycm9yXCIsIFwiZGFuZ2VyXCIpO1xuICAgIH0pXG59XG5cbnZhciBkZWxldGVTZW1lc3RlciA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgdmFyIGNob2ljZSA9IGNvbmZpcm0oXCJBcmUgeW91IHN1cmU/XCIpO1xuICAgIGlmKGNob2ljZSA9PT0gdHJ1ZSl7XG4gICAgdmFyIGlkID0gJCgnI2lkJykudmFsKCk7XG4gICAgdmFyIHNlbWlkID0gJChldmVudC5jdXJyZW50VGFyZ2V0KS5kYXRhKCdpZCcpO1xuICAgIHZhciBkYXRhID0ge1xuICAgICAgaWQ6IHNlbWlkLFxuICAgIH07XG4gICAgd2luZG93LmF4aW9zLnBvc3QoJy9mbG93Y2hhcnRzL3NlbWVzdGVycy8nICsgaWQgKyAnL2RlbGV0ZScsIGRhdGEpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB3aW5kb3cudm0uc2VtZXN0ZXJzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICBpZih3aW5kb3cudm0uc2VtZXN0ZXJzW2ldLmlkID09IHNlbWlkKXtcbiAgICAgICAgICAgIHdpbmRvdy52bS5zZW1lc3RlcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vc2l0ZS5kaXNwbGF5TWVzc2FnZShyZXNwb25zZS5kYXRhLCBcInN1Y2Nlc3NcIik7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycm9yKXtcbiAgICAgICAgc2l0ZS5kaXNwbGF5TWVzc2FnZShcIkFKQVggRXJyb3JcIiwgXCJkYW5nZXJcIik7XG4gICAgICB9KTtcbiAgfVxufVxuXG52YXIgYWRkU2VtZXN0ZXIgPSBmdW5jdGlvbigpe1xuICB2YXIgaWQgPSAkKCcjaWQnKS52YWwoKTtcbiAgdmFyIGRhdGEgPSB7XG4gIH07XG4gIHdpbmRvdy5heGlvcy5wb3N0KCcvZmxvd2NoYXJ0cy9zZW1lc3RlcnMvJyArIGlkICsgJy9hZGQnLCBkYXRhKVxuICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgIHdpbmRvdy52bS5zZW1lc3RlcnMucHVzaChyZXNwb25zZS5kYXRhKTtcbiAgICAgIC8vVnVlLnNldCh3aW5kb3cudm0uc2VtZXN0ZXJzW3dpbmRvdy52bS5zZW1lc3Rlci5sZW5ndGggLSAxXSwgJ2NvdXJzZXMnLCBuZXcgQXJyYXkoKSk7XG4gICAgICAkKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudClbMF0uc3R5bGUuc2V0UHJvcGVydHkoJy0tY29sTnVtJywgd2luZG93LnZtLnNlbWVzdGVycy5sZW5ndGgpO1xuICAgICAgLy9zaXRlLmRpc3BsYXlNZXNzYWdlKFwiSXRlbSBTYXZlZFwiLCBcInN1Y2Nlc3NcIik7XG4gICAgfSlcbiAgICAuY2F0Y2goZnVuY3Rpb24oZXJyb3Ipe1xuICAgICAgc2l0ZS5kaXNwbGF5TWVzc2FnZShcIkFKQVggRXJyb3JcIiwgXCJkYW5nZXJcIik7XG4gICAgfSlcbn1cblxudmFyIGRyb3BTZW1lc3RlciA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgdmFyIG9yZGVyaW5nID0gW107XG4gICQuZWFjaCh3aW5kb3cudm0uc2VtZXN0ZXJzLCBmdW5jdGlvbihpbmRleCwgdmFsdWUpe1xuICAgIG9yZGVyaW5nLnB1c2goe1xuICAgICAgaWQ6IHZhbHVlLmlkLFxuICAgIH0pO1xuICB9KTtcbiAgdmFyIGRhdGEgPSB7XG4gICAgb3JkZXJpbmc6IG9yZGVyaW5nLFxuICB9XG4gIHZhciBpZCA9ICQoJyNpZCcpLnZhbCgpO1xuICB3aW5kb3cuYXhpb3MucG9zdCgnL2Zsb3djaGFydHMvc2VtZXN0ZXJzLycgKyBpZCArICcvbW92ZScsIGRhdGEpXG4gICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgLy9zaXRlLmRpc3BsYXlNZXNzYWdlKHJlc3BvbnNlLmRhdGEsIFwic3VjY2Vzc1wiKTtcbiAgICB9KVxuICAgIC5jYXRjaChmdW5jdGlvbihlcnJvcil7XG4gICAgICBzaXRlLmRpc3BsYXlNZXNzYWdlKFwiQUpBWCBFcnJvclwiLCBcImRhbmdlclwiKTtcbiAgICB9KVxufVxuXG52YXIgZHJvcENvdXJzZSA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgdmFyIG9yZGVyaW5nID0gW107XG4gIHZhciB0b1NlbUluZGV4ID0gJChldmVudC50bykuZGF0YSgnaWQnKTtcbiAgJC5lYWNoKHdpbmRvdy52bS5zZW1lc3RlcnNbdG9TZW1JbmRleF0uY291cnNlcywgZnVuY3Rpb24oaW5kZXgsIHZhbHVlKXtcbiAgICBvcmRlcmluZy5wdXNoKHtcbiAgICAgIGlkOiB2YWx1ZS5pZCxcbiAgICB9KTtcbiAgfSk7XG4gIHZhciBkYXRhID0ge1xuICAgIHNlbWVzdGVyX2lkOiB3aW5kb3cudm0uc2VtZXN0ZXJzW3RvU2VtSW5kZXhdLmlkLFxuICAgIGNvdXJzZV9pZDogJChldmVudC5pdGVtKS5kYXRhKCdpZCcpLFxuICAgIG9yZGVyaW5nOiBvcmRlcmluZyxcbiAgfVxuICB2YXIgaWQgPSAkKCcjaWQnKS52YWwoKTtcbiAgd2luZG93LmF4aW9zLnBvc3QoJy9mbG93Y2hhcnRzL2RhdGEvJyArIGlkICsgJy9tb3ZlJywgZGF0YSlcbiAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAvL3NpdGUuZGlzcGxheU1lc3NhZ2UocmVzcG9uc2UuZGF0YSwgXCJzdWNjZXNzXCIpO1xuICAgIH0pXG4gICAgLmNhdGNoKGZ1bmN0aW9uKGVycm9yKXtcbiAgICAgIHNpdGUuZGlzcGxheU1lc3NhZ2UoXCJBSkFYIEVycm9yXCIsIFwiZGFuZ2VyXCIpO1xuICAgIH0pXG59XG5cbnZhciBlZGl0Q291cnNlID0gZnVuY3Rpb24oZXZlbnQpe1xuICBzaXRlLmNsZWFyRm9ybUVycm9ycygpO1xuICB2YXIgY291cnNlSW5kZXggPSAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLmRhdGEoJ2lkJyk7XG4gIHZhciBzZW1JbmRleCA9ICQoZXZlbnQuY3VycmVudFRhcmdldCkuZGF0YSgnc2VtJyk7XG4gIHZhciBjb3Vyc2UgPSB3aW5kb3cudm0uc2VtZXN0ZXJzW3NlbUluZGV4XS5jb3Vyc2VzW2NvdXJzZUluZGV4XTtcbiAgJCgnI2NvdXJzZV9uYW1lJykudmFsKGNvdXJzZS5uYW1lKTtcbiAgJCgnI2NyZWRpdHMnKS52YWwoY291cnNlLmNyZWRpdHMpO1xuICAkKCcjbm90ZXMnKS52YWwoY291cnNlLm5vdGVzKTtcbiAgJCgnI3BsYW5yZXF1aXJlbWVudF9pZCcpLnZhbChjb3Vyc2UuaWQpO1xuICAkKCcjZWxlY3RsaXZlbGlzdF9pZCcpLnZhbChjb3Vyc2UuZWxlY3RpdmVsaXN0X2lkKTtcbiAgJCgnI2VsZWN0aXZlbGlzdF9pZGF1dG8nKS52YWwoJycpO1xuICAkKCcjZWxlY3RpdmVsaXN0X2lkdGV4dCcpLmh0bWwoXCJTZWxlY3RlZDogKFwiICsgY291cnNlLmVsZWN0aXZlbGlzdF9pZCArIFwiKSBcIiArIHNpdGUudHJ1bmNhdGVUZXh0KGNvdXJzZS5lbGVjdGl2ZWxpc3RfbmFtZSwgMzApKTtcbiAgJCgnI2NvdXJzZV9pZCcpLnZhbChjb3Vyc2UuY291cnNlX2lkKTtcbiAgJCgnI2NvdXJzZV9pZGF1dG8nKS52YWwoJycpO1xuICAkKCcjY291cnNlX2lkdGV4dCcpLmh0bWwoXCJTZWxlY3RlZDogKFwiICsgY291cnNlLmNvdXJzZV9pZCArIFwiKSBcIiArIHNpdGUudHJ1bmNhdGVUZXh0KGNvdXJzZS5jb3Vyc2VfbmFtZSwgMzApKTtcbiAgc2l0ZS5hamF4YXV0b2NvbXBsZXRlc2V0KCdjb3Vyc2VfaWQnLCBjb3Vyc2UuY291cnNlX2lkX2xvY2spO1xuICAkKCcjY29tcGxldGVkY291cnNlX2lkJykudmFsKGNvdXJzZS5jb21wbGV0ZWRjb3Vyc2VfaWQpO1xuICAkKCcjY29tcGxldGVkY291cnNlX2lkYXV0bycpLnZhbCgnJyk7XG4gICQoJyNjb21wbGV0ZWRjb3Vyc2VfaWR0ZXh0JykuaHRtbChcIlNlbGVjdGVkOiAoXCIgKyBjb3Vyc2UuY29tcGxldGVkY291cnNlX2lkICsgXCIpIFwiICsgc2l0ZS50cnVuY2F0ZVRleHQoY291cnNlLmNvbXBsZXRlZGNvdXJzZV9uYW1lLCAzMCkpO1xuICBzaXRlLmFqYXhhdXRvY29tcGxldGVzZXQoJ2NvbXBsZXRlZGNvdXJzZV9pZCcsIGNvdXJzZS5jb21wbGV0ZWRjb3Vyc2VfaWRfbG9jayk7XG4gIGlmKGNvdXJzZS5kZWdyZWVyZXF1aXJlbWVudF9pZCA8PSAwKXtcbiAgICAkKCcjY291cnNlX25hbWUnKS5wcm9wKCdkaXNhYmxlZCcsIGZhbHNlKTtcbiAgICAkKCcjY3JlZGl0cycpLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuICAgICQoJyNlbGVjdGl2ZWxpc3RfaWRhdXRvJykucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSk7XG4gICAgJCgnI2RlbGV0ZUNvdXJzZScpLnNob3coKTtcbiAgfWVsc2V7XG4gICAgaWYoY291cnNlLmVsZWN0aXZlbGlzdF9pZCA8PSAwKXtcbiAgICAgICQoJyNjb3Vyc2VfbmFtZScpLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSk7XG4gICAgfWVsc2V7XG4gICAgICAkKCcjY291cnNlX25hbWUnKS5wcm9wKCdkaXNhYmxlZCcsIGZhbHNlKTtcbiAgICB9XG4gICAgJCgnI2NyZWRpdHMnKS5wcm9wKCdkaXNhYmxlZCcsIHRydWUpO1xuICAgICQoJyNlbGVjdGl2ZWxpc3RfaWRhdXRvJykucHJvcCgnZGlzYWJsZWQnLCB0cnVlKTtcbiAgICAkKCcjZGVsZXRlQ291cnNlJykuaGlkZSgpO1xuICB9XG5cbiAgJCgnI2VkaXRDb3Vyc2UnKS5tb2RhbCgnc2hvdycpO1xufVxuXG52YXIgc2F2ZUNvdXJzZSA9IGZ1bmN0aW9uKCl7XG4gICQoJyNzcGluJykucmVtb3ZlQ2xhc3MoJ2hpZGUtc3BpbicpO1xuICB2YXIgaWQgPSAkKCcjaWQnKS52YWwoKTtcbiAgdmFyIHBsYW5yZXF1aXJlbWVudF9pZCA9ICQoJyNwbGFucmVxdWlyZW1lbnRfaWQnKS52YWwoKTtcbiAgdmFyIGRhdGEgPSB7XG4gICAgbm90ZXM6ICQoJyNub3RlcycpLnZhbCgpLFxuICAgIGNvdXJzZV9pZF9sb2NrOiAkKCcjY291cnNlX2lkbG9jaycpLnZhbCgpLFxuICAgIGNvbXBsZXRlZGNvdXJzZV9pZF9sb2NrOiAkKCcjY29tcGxldGVkY291cnNlX2lkbG9jaycpLnZhbCgpLFxuICB9XG4gIGlmKCQoJyNjb3Vyc2VfaWQnKS52YWwoKSA+IDApe1xuICAgIGRhdGEuY291cnNlX2lkID0gJCgnI2NvdXJzZV9pZCcpLnZhbCgpO1xuICB9ZWxzZXtcbiAgICBkYXRhLmNvdXJzZV9pZCA9ICcnO1xuICB9XG4gIGlmKCQoJyNjb21wbGV0ZWRjb3Vyc2VfaWQnKS52YWwoKSA+IDApe1xuICAgIGRhdGEuY29tcGxldGVkY291cnNlX2lkID0gJCgnI2NvbXBsZXRlZGNvdXJzZV9pZCcpLnZhbCgpO1xuICB9ZWxzZXtcbiAgICBkYXRhLmNvbXBsZXRlZGNvdXJzZV9pZCA9ICcnO1xuICB9XG4gIGlmKCQoJyNwbGFucmVxdWlyZW1lbnRfaWQnKS52YWwoKS5sZW5ndGggPiAwKXtcbiAgICBkYXRhLnBsYW5yZXF1aXJlbWVudF9pZCA9ICQoJyNwbGFucmVxdWlyZW1lbnRfaWQnKS52YWwoKTtcbiAgfVxuICBpZighJCgnI2NvdXJzZV9uYW1lJykuaXMoJzpkaXNhYmxlZCcpKXtcbiAgICBkYXRhLmNvdXJzZV9uYW1lID0gJCgnI2NvdXJzZV9uYW1lJykudmFsKCk7XG4gIH1cbiAgaWYoISQoJyNjcmVkaXRzJykuaXMoJzpkaXNhYmxlZCcpKXtcbiAgICBkYXRhLmNyZWRpdHMgPSAkKCcjY3JlZGl0cycpLnZhbCgpO1xuICB9XG4gIGlmKCEkKCcjZWxlY3RpdmVsaXN0X2lkYXV0bycpLmlzKCc6ZGlzYWJsZWQnKSl7XG4gICAgaWYoJCgnI2VsZWN0aXZlbGlzdF9pZCcpLnZhbCgpID4gMCl7XG4gICAgICBkYXRhLmVsZWN0aXZlbGlzdF9pZCA9ICQoJyNlbGVjdGl2ZWxpc3RfaWQnKS52YWwoKTtcbiAgICB9ZWxzZXtcbiAgICAgIGRhdGEuZWxlY3RpdmVsaXN0X2lkID0gJyc7XG4gICAgfVxuICB9XG4gIHdpbmRvdy5heGlvcy5wb3N0KCcvZmxvd2NoYXJ0cy9kYXRhLycgKyBpZCArICcvc2F2ZScsIGRhdGEpXG4gICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgJCgnI2VkaXRDb3Vyc2UnKS5tb2RhbCgnaGlkZScpO1xuICAgICAgJCgnI3NwaW4nKS5hZGRDbGFzcygnaGlkZS1zcGluJyk7XG4gICAgICBzaXRlLmRpc3BsYXlNZXNzYWdlKHJlc3BvbnNlLmRhdGEsIFwic3VjY2Vzc1wiKTtcbiAgICAgIHNpdGUuY2xlYXJGb3JtRXJyb3JzKCk7XG4gICAgICBsb2FkRGF0YSgpO1xuICAgIH0pXG4gICAgLmNhdGNoKGZ1bmN0aW9uKGVycm9yKXtcbiAgICAgICQoJyNzcGluJykuYWRkQ2xhc3MoJ2hpZGUtc3BpbicpO1xuICAgICAgc2l0ZS5oYW5kbGVFcnJvcihcInNhdmUgY291cnNlXCIsIFwiI2VkaXRDb3Vyc2VcIiwgZXJyb3IpO1xuICAgIH0pO1xuXG59XG5cbnZhciBkZWxldGVDb3Vyc2UgPSBmdW5jdGlvbihldmVudCl7XG4gICQoJyNzcGluJykucmVtb3ZlQ2xhc3MoJ2hpZGUtc3BpbicpO1xuICB2YXIgaWQgPSAkKCcjaWQnKS52YWwoKTtcbiAgdmFyIHBsYW5yZXF1aXJlbWVudF9pZCA9ICQoJyNwbGFucmVxdWlyZW1lbnRfaWQnKS52YWwoKTtcbiAgdmFyIGRhdGEgPSB7XG4gICAgcGxhbnJlcXVpcmVtZW50X2lkOiBwbGFucmVxdWlyZW1lbnRfaWQsXG4gIH1cbiAgd2luZG93LmF4aW9zLnBvc3QoJy9mbG93Y2hhcnRzL2RhdGEvJyArIGlkICsgJy9kZWxldGUnLCBkYXRhKVxuICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICQoJyNlZGl0Q291cnNlJykubW9kYWwoJ2hpZGUnKTtcbiAgICAgICQoJyNzcGluJykuYWRkQ2xhc3MoJ2hpZGUtc3BpbicpO1xuICAgICAgc2l0ZS5kaXNwbGF5TWVzc2FnZShyZXNwb25zZS5kYXRhLCBcInN1Y2Nlc3NcIik7XG4gICAgICBzaXRlLmNsZWFyRm9ybUVycm9ycygpO1xuICAgICAgbG9hZERhdGEoKTtcbiAgICB9KVxuICAgIC5jYXRjaChmdW5jdGlvbihlcnJvcil7XG4gICAgICAkKCcjc3BpbicpLmFkZENsYXNzKCdoaWRlLXNwaW4nKTtcbiAgICAgIHNpdGUuaGFuZGxlRXJyb3IoXCJkZWxldGUgY291cnNlXCIsIFwiI2VkaXRDb3Vyc2VcIiwgZXJyb3IpO1xuICAgIH0pO1xuXG59XG5cbnZhciBzaG93UHJlcmVxcyA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgdmFyIGNvdXJzZUluZGV4ID0gJChldmVudC5jdXJyZW50VGFyZ2V0KS5kYXRhKCdpZCcpO1xuICB2YXIgc2VtSW5kZXggPSAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLmRhdGEoJ3NlbScpO1xuICB2YXIgY291cnNlID0gd2luZG93LnZtLnNlbWVzdGVyc1tzZW1JbmRleF0uY291cnNlc1tjb3Vyc2VJbmRleF07XG4gIGlmKGNvdXJzZS5jb3Vyc2VfaWQgPT0gd2luZG93LnZtLmNvdXJzZV9pZCl7XG4gICAgd2luZG93LnZtLmNvdXJzZV9pZCA9IC0xO1xuICAgIHdpbmRvdy52bS5wcmVyZXF1aXNpdGVzID0gW107XG4gICAgd2luZG93LnZtLmZvbGxvd2VycyA9IFtdO1xuICB9ZWxzZXtcbiAgICB3aW5kb3cuYXhpb3MuZ2V0KCcvY291cnNlcy9wcmVyZXFmZWVkLycgKyBjb3Vyc2UuY291cnNlX2lkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24obWVzc2FnZSl7XG4gICAgICAgIHdpbmRvdy52bS5jb3Vyc2VfaWQgPSBjb3Vyc2UuY291cnNlX2lkO1xuICAgICAgICB3aW5kb3cudm0ucHJlcmVxdWlzaXRlcyA9IG1lc3NhZ2UuZGF0YS5wcmVyZXF1aXNpdGVzO1xuICAgICAgICB3aW5kb3cudm0uZm9sbG93ZXJzID0gbWVzc2FnZS5kYXRhLmZvbGxvd2VycztcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyb3Ipe1xuICAgICAgICBzaXRlLmhhbmRsZUVycm9yKFwicmV0cmlldmUgcHJlcmVxdWlzaXRlc1wiLCBcIlwiLCBlcnJvcik7XG4gICAgICB9KTtcbiAgfVxufVxuXG52YXIgcHJlcmVxQ2xhc3MgPSBmdW5jdGlvbihpZCl7XG4gIHZhciBjdXIgPSBmYWxzZTtcbiAgdmFyIHByZSA9IGZhbHNlO1xuICB2YXIgcG9zdCA9IGZhbHNlO1xuICBpZihpZCA9PSB3aW5kb3cudm0uY291cnNlX2lkKXtcbiAgICBjdXIgPSB0cnVlO1xuICB9XG4gIGlmKHdpbmRvdy52bS5wcmVyZXF1aXNpdGVzLmluY2x1ZGVzKGlkKSl7XG4gICAgcHJlID0gdHJ1ZTtcbiAgfVxuICBpZih3aW5kb3cudm0uZm9sbG93ZXJzLmluY2x1ZGVzKGlkKSl7XG4gICAgcG9zdCA9IHRydWU7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICAnZmEnOiBjdXIgfHwgcHJlIHx8IHBvc3QsXG4gICAgJ2ZhLTN4JzogY3VyIHx8IHByZSB8fCBwb3N0LFxuICAgICdmYS1jaXJjbGUnOiBjdXIsXG4gICAgJ2ZhLWFycm93LWNpcmNsZS1yaWdodCc6IHByZSxcbiAgICAnZmEtYXJyb3ctY2lyY2xlLWxlZnQnOiBwb3N0LFxuICB9O1xufVxuXG52YXIgYWRkQ291cnNlID0gZnVuY3Rpb24oKXtcbiAgJCgnI2NvdXJzZV9uYW1lJykudmFsKCcnKTtcbiAgJCgnI2NyZWRpdHMnKS52YWwoJycpO1xuICAkKCcjbm90ZXMnKS52YWwoJycpO1xuICAkKCcjcGxhbnJlcXVpcmVtZW50X2lkJykudmFsKCcnKTtcbiAgJCgnI2VsZWN0bGl2ZWxpc3RfaWQnKS52YWwoMCk7XG4gICQoJyNlbGVjdGl2ZWxpc3RfaWRhdXRvJykudmFsKCcnKTtcbiAgJCgnI2VsZWN0aXZlbGlzdF9pZHRleHQnKS5odG1sKFwiU2VsZWN0ZWQ6IChcIiArIDAgKyBcIikgXCIpO1xuICAkKCcjY291cnNlX2lkJykudmFsKDApO1xuICAkKCcjY291cnNlX2lkYXV0bycpLnZhbCgnJyk7XG4gICQoJyNjb3Vyc2VfaWR0ZXh0JykuaHRtbChcIlNlbGVjdGVkOiAoXCIgKyAwICsgXCIpIFwiKTtcbiAgJCgnI2NvbXBsZXRlZGNvdXJzZV9pZCcpLnZhbCgwKTtcbiAgJCgnI2NvbXBsZXRlZGNvdXJzZV9pZGF1dG8nKS52YWwoJycpO1xuICAkKCcjY29tcGxldGVkY291cnNlX2lkdGV4dCcpLmh0bWwoXCJTZWxlY3RlZDogKFwiICsgMCArIFwiKSBcIik7XG4gICQoJyNjb3Vyc2VfbmFtZScpLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuICAkKCcjY3JlZGl0cycpLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuICAkKCcjZWxlY3RpdmVsaXN0X2lkYXV0bycpLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuICAkKCcjZGVsZXRlQ291cnNlJykuaGlkZSgpO1xuICAkKCcjZWRpdENvdXJzZScpLm1vZGFsKCdzaG93Jyk7XG4gIHNpdGUuYWpheGF1dG9jb21wbGV0ZXNldCgnY291cnNlX2lkJywgMCk7XG4gIHNpdGUuYWpheGF1dG9jb21wbGV0ZXNldCgnY29tcGxldGVkY291cnNlX2lkJywgMCk7XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Zsb3djaGFydC5qcyIsInZhciBkYXNoYm9hcmQgPSByZXF1aXJlKCcuLi91dGlsL2Rhc2hib2FyZCcpO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbigpe1xuICB2YXIgb3B0aW9ucyA9IGRhc2hib2FyZC5kYXRhVGFibGVPcHRpb25zO1xuICBkYXNoYm9hcmQuaW5pdChvcHRpb25zKTtcbn1cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZmxvd2NoYXJ0bGlzdC5qcyIsIi8vIHJlbW92ZWQgYnkgZXh0cmFjdC10ZXh0LXdlYnBhY2stcGx1Z2luXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL3Nhc3MvYXBwLnNjc3Ncbi8vIG1vZHVsZSBpZCA9IDIxOFxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCIvLyByZW1vdmVkIGJ5IGV4dHJhY3QtdGV4dC13ZWJwYWNrLXBsdWdpblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9zYXNzL2Zsb3djaGFydC5zY3NzXG4vLyBtb2R1bGUgaWQgPSAyMTlcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiLyoqXG4gKiBEaXNwbGF5cyBhIG1lc3NhZ2UgZnJvbSB0aGUgZmxhc2hlZCBzZXNzaW9uIGRhdGFcbiAqXG4gKiB1c2UgJHJlcXVlc3QtPnNlc3Npb24oKS0+cHV0KCdtZXNzYWdlJywgdHJhbnMoJ21lc3NhZ2VzLml0ZW1fc2F2ZWQnKSk7XG4gKiAgICAgJHJlcXVlc3QtPnNlc3Npb24oKS0+cHV0KCd0eXBlJywgJ3N1Y2Nlc3MnKTtcbiAqIHRvIHNldCBtZXNzYWdlIHRleHQgYW5kIHR5cGVcbiAqL1xuZXhwb3J0cy5kaXNwbGF5TWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UsIHR5cGUpe1xuXHR2YXIgaHRtbCA9ICc8ZGl2IGlkPVwiamF2YXNjcmlwdE1lc3NhZ2VcIiBjbGFzcz1cImFsZXJ0IGZhZGUgaW4gYWxlcnQtZGlzbWlzc2FibGUgYWxlcnQtJyArIHR5cGUgKyAnXCI+PGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJjbG9zZVwiIGRhdGEtZGlzbWlzcz1cImFsZXJ0XCIgYXJpYS1sYWJlbD1cIkNsb3NlXCI+PHNwYW4gYXJpYS1oaWRkZW49XCJ0cnVlXCI+JnRpbWVzOzwvc3Bhbj48L2J1dHRvbj48c3BhbiBjbGFzcz1cImg0XCI+JyArIG1lc3NhZ2UgKyAnPC9zcGFuPjwvZGl2Pic7XG5cdCQoJyNtZXNzYWdlJykuYXBwZW5kKGh0bWwpO1xuXHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdCQoXCIjamF2YXNjcmlwdE1lc3NhZ2VcIikuYWxlcnQoJ2Nsb3NlJyk7XG5cdH0sIDMwMDApO1xufTtcblxuLypcbmV4cG9ydHMuYWpheGNyc2YgPSBmdW5jdGlvbigpe1xuXHQkLmFqYXhTZXR1cCh7XG5cdFx0aGVhZGVyczoge1xuXHRcdFx0J1gtQ1NSRi1UT0tFTic6ICQoJ21ldGFbbmFtZT1cImNzcmYtdG9rZW5cIl0nKS5hdHRyKCdjb250ZW50Jylcblx0XHR9XG5cdH0pO1xufTtcbiovXG5cbi8qKlxuICogQ2xlYXJzIGVycm9ycyBvbiBmb3JtcyBieSByZW1vdmluZyBlcnJvciBjbGFzc2VzXG4gKi9cbmV4cG9ydHMuY2xlYXJGb3JtRXJyb3JzID0gZnVuY3Rpb24oKXtcblx0JCgnLmZvcm0tZ3JvdXAnKS5lYWNoKGZ1bmN0aW9uICgpe1xuXHRcdCQodGhpcykucmVtb3ZlQ2xhc3MoJ2hhcy1lcnJvcicpO1xuXHRcdCQodGhpcykuZmluZCgnLmhlbHAtYmxvY2snKS50ZXh0KCcnKTtcblx0fSk7XG59XG5cbi8qKlxuICogU2V0cyBlcnJvcnMgb24gZm9ybXMgYmFzZWQgb24gcmVzcG9uc2UgSlNPTlxuICovXG5leHBvcnRzLnNldEZvcm1FcnJvcnMgPSBmdW5jdGlvbihqc29uKXtcblx0ZXhwb3J0cy5jbGVhckZvcm1FcnJvcnMoKTtcblx0JC5lYWNoKGpzb24sIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG5cdFx0JCgnIycgKyBrZXkpLnBhcmVudHMoJy5mb3JtLWdyb3VwJykuYWRkQ2xhc3MoJ2hhcy1lcnJvcicpO1xuXHRcdCQoJyMnICsga2V5ICsgJ2hlbHAnKS50ZXh0KHZhbHVlLmpvaW4oJyAnKSk7XG5cdH0pO1xufVxuXG4vKipcbiAqIENoZWNrcyBmb3IgbWVzc2FnZXMgaW4gdGhlIGZsYXNoIGRhdGEuIE11c3QgYmUgY2FsbGVkIGV4cGxpY2l0bHkgYnkgdGhlIHBhZ2VcbiAqL1xuZXhwb3J0cy5jaGVja01lc3NhZ2UgPSBmdW5jdGlvbigpe1xuXHRpZigkKCcjbWVzc2FnZV9mbGFzaCcpLmxlbmd0aCl7XG5cdFx0dmFyIG1lc3NhZ2UgPSAkKCcjbWVzc2FnZV9mbGFzaCcpLnZhbCgpO1xuXHRcdHZhciB0eXBlID0gJCgnI21lc3NhZ2VfdHlwZV9mbGFzaCcpLnZhbCgpO1xuXHRcdGV4cG9ydHMuZGlzcGxheU1lc3NhZ2UobWVzc2FnZSwgdHlwZSk7XG5cdH1cbn1cblxuLyoqXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgZXJyb3JzIGZyb20gQUpBWFxuICpcbiAqIEBwYXJhbSBtZXNzYWdlIC0gdGhlIG1lc3NhZ2UgdG8gZGlzcGxheSB0byB0aGUgdXNlclxuICogQHBhcmFtIGVsZW1lbnQgLSB0aGUgalF1ZXJ5IGlkZW50aWZpZXIgb2YgdGhlIGVsZW1lbnRcbiAqIEBwYXJhbSBlcnJvciAtIHRoZSBBeGlvcyBlcnJvciByZWNlaXZlZFxuICovXG5leHBvcnRzLmhhbmRsZUVycm9yID0gZnVuY3Rpb24obWVzc2FnZSwgZWxlbWVudCwgZXJyb3Ipe1xuXHRpZihlcnJvci5yZXNwb25zZSl7XG5cdFx0Ly9JZiByZXNwb25zZSBpcyA0MjIsIGVycm9ycyB3ZXJlIHByb3ZpZGVkXG5cdFx0aWYoZXJyb3IucmVzcG9uc2Uuc3RhdHVzID09IDQyMil7XG5cdFx0XHRleHBvcnRzLnNldEZvcm1FcnJvcnMoZXJyb3IucmVzcG9uc2UuZGF0YSk7XG5cdFx0fWVsc2V7XG5cdFx0XHRhbGVydChcIlVuYWJsZSB0byBcIiArIG1lc3NhZ2UgKyBcIjogXCIgKyBlcnJvci5yZXNwb25zZS5kYXRhKTtcblx0XHR9XG5cdH1cblxuXHQvL2hpZGUgc3Bpbm5pbmcgaWNvblxuXHRpZihlbGVtZW50Lmxlbmd0aCA+IDApe1xuXHRcdCQoZWxlbWVudCArICdzcGluJykuYWRkQ2xhc3MoJ2hpZGUtc3BpbicpO1xuXHR9XG59XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gdHJ1bmNhdGUgdGV4dFxuICpcbiAqIEBwYXJhbSB0ZXh0IC0gdGhlIHRleHQgdG8gdHJ1bmNhdGVcbiAqIEBwYXJhbSBsZW5ndGggLSB0aGUgbWF4aW11bSBsZW5ndGhcbiAqXG4gKiBodHRwOi8vanNmaWRkbGUubmV0L3NjaGFkZWNrL0dwQ1pML1xuICovXG5leHBvcnRzLnRydW5jYXRlVGV4dCA9IGZ1bmN0aW9uKHRleHQsIGxlbmd0aCl7XG5cdGlmKHRleHQubGVuZ3RoID4gbGVuZ3RoKXtcblx0XHRyZXR1cm4gJC50cmltKHRleHQpLnN1YnN0cmluZygwLCBsZW5ndGgpLnNwbGl0KFwiIFwiKS5zbGljZSgwLCAtMSkuam9pbihcIiBcIikgKyBcIi4uLlwiO1xuXHR9ZWxzZXtcblx0XHRyZXR1cm4gdGV4dDtcblx0fVxufVxuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGF1dG9jb21wbGV0ZSBhIGZpZWxkXG4gKlxuICogQHBhcmFtIGlkIC0gdGhlIElEIG9mIHRoZSBmaWVsZFxuICogQHBhcmFtIHVybCAtIHRoZSBVUkwgdG8gcmVxdWVzdCBkYXRhIGZyb21cbiAqL1xuZXhwb3J0cy5hamF4YXV0b2NvbXBsZXRlID0gZnVuY3Rpb24oaWQsIHVybCl7XG4gICQoJyMnICsgaWQgKyAnYXV0bycpLmF1dG9jb21wbGV0ZSh7XG5cdCAgICBzZXJ2aWNlVXJsOiB1cmwsXG5cdCAgICBhamF4U2V0dGluZ3M6IHtcblx0ICAgIFx0ZGF0YVR5cGU6IFwianNvblwiXG5cdCAgICB9LFxuICAgICAgbWluQ2hhcnM6IDMsXG4gICAgICBhdXRvU2VsZWN0Rmlyc3Q6IHRydWUsXG5cdCAgICBvblNlbGVjdDogZnVuY3Rpb24gKHN1Z2dlc3Rpb24pIHtcblx0ICAgICAgICAkKCcjJyArIGlkKS52YWwoc3VnZ2VzdGlvbi5kYXRhKTtcbiAgICAgICAgICAkKCcjJyArIGlkICsgJ3RleHQnKS5odG1sKFwiU2VsZWN0ZWQ6IChcIiArIHN1Z2dlc3Rpb24uZGF0YSArIFwiKSBcIiArIGV4cG9ydHMudHJ1bmNhdGVUZXh0KHN1Z2dlc3Rpb24udmFsdWUsIDMwKSk7XG5cdFx0XHRcdFx0JCgnIycgKyBpZCArICdhdXRvJykudmFsKFwiXCIpO1xuXHQgICAgfSxcblx0ICAgIHRyYW5zZm9ybVJlc3VsdDogZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0ICAgICAgICByZXR1cm4ge1xuXHQgICAgICAgICAgICBzdWdnZXN0aW9uczogJC5tYXAocmVzcG9uc2UuZGF0YSwgZnVuY3Rpb24oZGF0YUl0ZW0pIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiBkYXRhSXRlbS52YWx1ZSwgZGF0YTogZGF0YUl0ZW0uZGF0YSB9O1xuXHQgICAgICAgICAgICB9KVxuXHQgICAgICAgIH07XG5cdCAgICB9XG5cdH0pO1xuXG4gICQoJyMnICsgaWQgKyAnY2xlYXInKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgICQoJyMnICsgaWQpLnZhbCgwKTtcbiAgICAkKCcjJyArIGlkICsgJ3RleHQnKS5odG1sKFwiU2VsZWN0ZWQ6IChcIiArIDAgKyBcIikgXCIpO1xuICAgICQoJyMnICsgaWQgKyAnYXV0bycpLnZhbChcIlwiKTtcbiAgfSk7XG59XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gYXV0b2NvbXBsZXRlIGEgZmllbGQgd2l0aCBhIGxvY2tcbiAqXG4gKiBAcGFyYW0gaWQgLSB0aGUgSUQgb2YgdGhlIGZpZWxkXG4gKiBAcGFyYW0gdXJsIC0gdGhlIFVSTCB0byByZXF1ZXN0IGRhdGEgZnJvbVxuICovXG5leHBvcnRzLmFqYXhhdXRvY29tcGxldGVsb2NrID0gZnVuY3Rpb24oaWQsIHVybCl7XG4gICQoJyMnICsgaWQgKyAnYXV0bycpLmF1dG9jb21wbGV0ZSh7XG5cdCAgICBzZXJ2aWNlVXJsOiB1cmwsXG5cdCAgICBhamF4U2V0dGluZ3M6IHtcblx0ICAgIFx0ZGF0YVR5cGU6IFwianNvblwiXG5cdCAgICB9LFxuICAgICAgbWluQ2hhcnM6IDMsXG4gICAgICBhdXRvU2VsZWN0Rmlyc3Q6IHRydWUsXG5cdCAgICBvblNlbGVjdDogZnVuY3Rpb24gKHN1Z2dlc3Rpb24pIHtcblx0ICAgICAgICAkKCcjJyArIGlkKS52YWwoc3VnZ2VzdGlvbi5kYXRhKTtcbiAgICAgICAgICAkKCcjJyArIGlkICsgJ3RleHQnKS5odG1sKFwiU2VsZWN0ZWQ6IChcIiArIHN1Z2dlc3Rpb24uZGF0YSArIFwiKSBcIiArIGV4cG9ydHMudHJ1bmNhdGVUZXh0KHN1Z2dlc3Rpb24udmFsdWUsIDMwKSk7XG5cdFx0XHRcdFx0JCgnIycgKyBpZCArICdhdXRvJykudmFsKFwiXCIpO1xuICAgICAgICAgIGV4cG9ydHMuYWpheGF1dG9jb21wbGV0ZXNldChpZCwgMSk7XG5cdCAgICB9LFxuXHQgICAgdHJhbnNmb3JtUmVzdWx0OiBmdW5jdGlvbihyZXNwb25zZSkge1xuXHQgICAgICAgIHJldHVybiB7XG5cdCAgICAgICAgICAgIHN1Z2dlc3Rpb25zOiAkLm1hcChyZXNwb25zZS5kYXRhLCBmdW5jdGlvbihkYXRhSXRlbSkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IGRhdGFJdGVtLnZhbHVlLCBkYXRhOiBkYXRhSXRlbS5kYXRhIH07XG5cdCAgICAgICAgICAgIH0pXG5cdCAgICAgICAgfTtcblx0ICAgIH1cblx0fSk7XG5cbiAgJCgnIycgKyBpZCArICdjbGVhcicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgJCgnIycgKyBpZCkudmFsKDApO1xuICAgICQoJyMnICsgaWQgKyAndGV4dCcpLmh0bWwoXCJTZWxlY3RlZDogKFwiICsgMCArIFwiKSBcIik7XG4gICAgJCgnIycgKyBpZCArICdhdXRvJykudmFsKFwiXCIpO1xuICAgIGV4cG9ydHMuYWpheGF1dG9jb21wbGV0ZXNldChpZCwgMCk7XG4gIH0pO1xuXG4gICQoJyMnICsgaWQgKyAnbG9ja0J0bicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgdmFsID0gcGFyc2VJbnQoJCgnIycgKyBpZCArICdsb2NrJykudmFsKCkpO1xuICAgIGV4cG9ydHMuYWpheGF1dG9jb21wbGV0ZXNldChpZCwgKHZhbCArIDEpICUgMik7XG4gIH0pO1xufVxuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHVwZGF0ZSBhIGxvY2tlZCBhdXRvY29tcGxldGUgYnV0dG9uXG4gKlxuICogQHBhcmFtIGlkIC0gdGhlIElEIG9mIHRoZSBmaWVsZFxuICogQHBhcmFtIHZhbHVlIC0gdGhlIHZhbHVlIHRvIHNldFxuICovXG5leHBvcnRzLmFqYXhhdXRvY29tcGxldGVzZXQgPSBmdW5jdGlvbihpZCwgdmFsdWUpe1xuICBpZih2YWx1ZSA9PSAxKXtcbiAgICAkKCcjJyArIGlkICsgJ2xvY2snKS52YWwoMSk7XG4gICAgJCgnIycgKyBpZCArICdsb2NrQnRuJykuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgJCgnIycgKyBpZCArICdsb2NrQnRuJykuaHRtbCgnPGkgY2xhc3M9XCJmYSBmYS1sb2NrXCI+PC9pPicpO1xuICB9ZWxzZXtcbiAgICAkKCcjJyArIGlkICsgJ2xvY2snKS52YWwoMCk7XG4gICAgJCgnIycgKyBpZCArICdsb2NrQnRuJykucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgJCgnIycgKyBpZCArICdsb2NrQnRuJykuaHRtbCgnPGkgY2xhc3M9XCJmYSBmYS11bmxvY2stYWx0XCI+PC9pPicpO1xuICB9XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3V0aWwvc2l0ZS5qcyIsIi8qKlxuICogSW5pdGlhbGl6YXRpb24gZnVuY3Rpb24gZm9yIGVkaXRhYmxlIHRleHQtYm94ZXMgb24gdGhlIHNpdGVcbiAqIE11c3QgYmUgY2FsbGVkIGV4cGxpY2l0bHlcbiAqL1xuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24oKXtcblxuICAvL0xvYWQgcmVxdWlyZWQgbGlicmFyaWVzXG4gIHJlcXVpcmUoJ2NvZGVtaXJyb3InKTtcbiAgcmVxdWlyZSgnY29kZW1pcnJvci9tb2RlL3htbC94bWwuanMnKTtcbiAgcmVxdWlyZSgnc3VtbWVybm90ZScpO1xuXG4gIC8vUmVnaXN0ZXIgY2xpY2sgaGFuZGxlcnMgZm9yIFtlZGl0XSBsaW5rc1xuICAkKCcuZWRpdGFibGUtbGluaycpLmVhY2goZnVuY3Rpb24oKXtcbiAgICAkKHRoaXMpLmNsaWNrKGZ1bmN0aW9uKGUpe1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgLy9nZXQgSUQgb2YgaXRlbSBjbGlja2VkXG4gICAgICB2YXIgaWQgPSAkKHRoaXMpLmRhdGEoJ2lkJyk7XG5cbiAgICAgIC8vaGlkZSB0aGUgW2VkaXRdIGxpbmtzLCBlbmFibGUgZWRpdG9yLCBhbmQgc2hvdyBTYXZlIGFuZCBDYW5jZWwgYnV0dG9uc1xuICAgICAgJCgnI2VkaXRhYmxlYnV0dG9uLScgKyBpZCkuYWRkQ2xhc3MoJ2hpZGRlbicpO1xuICAgICAgJCgnI2VkaXRhYmxlc2F2ZS0nICsgaWQpLnJlbW92ZUNsYXNzKCdoaWRkZW4nKTtcbiAgICAgICQoJyNlZGl0YWJsZS0nICsgaWQpLnN1bW1lcm5vdGUoe1xuICAgICAgICBmb2N1czogdHJ1ZSxcbiAgICAgICAgdG9vbGJhcjogW1xuICAgICAgICAgIC8vIFtncm91cE5hbWUsIFtsaXN0IG9mIGJ1dHRvbnNdXVxuICAgICAgICAgIFsnc3R5bGUnLCBbJ3N0eWxlJywgJ2JvbGQnLCAnaXRhbGljJywgJ3VuZGVybGluZScsICdjbGVhciddXSxcbiAgICAgICAgICBbJ2ZvbnQnLCBbJ3N0cmlrZXRocm91Z2gnLCAnc3VwZXJzY3JpcHQnLCAnc3Vic2NyaXB0JywgJ2xpbmsnXV0sXG4gICAgICAgICAgWydwYXJhJywgWyd1bCcsICdvbCcsICdwYXJhZ3JhcGgnXV0sXG4gICAgICAgICAgWydtaXNjJywgWydmdWxsc2NyZWVuJywgJ2NvZGV2aWV3JywgJ2hlbHAnXV0sXG4gICAgICAgIF0sXG4gICAgICAgIHRhYnNpemU6IDIsXG4gICAgICAgIGNvZGVtaXJyb3I6IHtcbiAgICAgICAgICBtb2RlOiAndGV4dC9odG1sJyxcbiAgICAgICAgICBodG1sTW9kZTogdHJ1ZSxcbiAgICAgICAgICBsaW5lTnVtYmVyczogdHJ1ZSxcbiAgICAgICAgICB0aGVtZTogJ21vbm9rYWknXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgLy9SZWdpc3RlciBjbGljayBoYW5kbGVycyBmb3IgU2F2ZSBidXR0b25zXG4gICQoJy5lZGl0YWJsZS1zYXZlJykuZWFjaChmdW5jdGlvbigpe1xuICAgICQodGhpcykuY2xpY2soZnVuY3Rpb24oZSl7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAvL2dldCBJRCBvZiBpdGVtIGNsaWNrZWRcbiAgICAgIHZhciBpZCA9ICQodGhpcykuZGF0YSgnaWQnKTtcblxuICAgICAgLy9EaXNwbGF5IHNwaW5uZXIgd2hpbGUgQUpBWCBjYWxsIGlzIHBlcmZvcm1lZFxuICAgICAgJCgnI2VkaXRhYmxlc3Bpbi0nICsgaWQpLnJlbW92ZUNsYXNzKCdoaWRlLXNwaW4nKTtcblxuICAgICAgLy9HZXQgY29udGVudHMgb2YgZWRpdG9yXG4gICAgICB2YXIgaHRtbFN0cmluZyA9ICQoJyNlZGl0YWJsZS0nICsgaWQpLnN1bW1lcm5vdGUoJ2NvZGUnKTtcblxuICAgICAgLy9Qb3N0IGNvbnRlbnRzIHRvIHNlcnZlciwgd2FpdCBmb3IgcmVzcG9uc2VcbiAgICAgIHdpbmRvdy5heGlvcy5wb3N0KCcvZWRpdGFibGUvc2F2ZS8nICsgaWQsIHtcbiAgICAgICAgY29udGVudHM6IGh0bWxTdHJpbmdcbiAgICAgIH0pXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgIC8vSWYgcmVzcG9uc2UgMjAwIHJlY2VpdmVkLCBhc3N1bWUgaXQgc2F2ZWQgYW5kIHJlbG9hZCBwYWdlXG4gICAgICAgIGxvY2F0aW9uLnJlbG9hZCh0cnVlKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyb3Ipe1xuICAgICAgICBhbGVydChcIlVuYWJsZSB0byBzYXZlIGNvbnRlbnQ6IFwiICsgZXJyb3IucmVzcG9uc2UuZGF0YSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgLy9SZWdpc3RlciBjbGljayBoYW5kbGVycyBmb3IgQ2FuY2VsIGJ1dHRvbnNcbiAgJCgnLmVkaXRhYmxlLWNhbmNlbCcpLmVhY2goZnVuY3Rpb24oKXtcbiAgICAkKHRoaXMpLmNsaWNrKGZ1bmN0aW9uKGUpe1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgLy9nZXQgSUQgb2YgaXRlbSBjbGlja2VkXG4gICAgICB2YXIgaWQgPSAkKHRoaXMpLmRhdGEoJ2lkJyk7XG5cbiAgICAgIC8vUmVzZXQgdGhlIGNvbnRlbnRzIG9mIHRoZSBlZGl0b3IgYW5kIGRlc3Ryb3kgaXRcbiAgICAgICQoJyNlZGl0YWJsZS0nICsgaWQpLnN1bW1lcm5vdGUoJ3Jlc2V0Jyk7XG4gICAgICAkKCcjZWRpdGFibGUtJyArIGlkKS5zdW1tZXJub3RlKCdkZXN0cm95Jyk7XG5cbiAgICAgIC8vSGlkZSBTYXZlIGFuZCBDYW5jZWwgYnV0dG9ucywgYW5kIHNob3cgW2VkaXRdIGxpbmtcbiAgICAgICQoJyNlZGl0YWJsZWJ1dHRvbi0nICsgaWQpLnJlbW92ZUNsYXNzKCdoaWRkZW4nKTtcbiAgICAgICQoJyNlZGl0YWJsZXNhdmUtJyArIGlkKS5hZGRDbGFzcygnaGlkZGVuJyk7XG4gICAgfSk7XG4gIH0pO1xufTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvdXRpbC9lZGl0YWJsZS5qcyJdLCJzb3VyY2VSb290IjoiIn0=
﻿prop.loader = {
    prefixPath: prop.domain + '/pages/',
    postfixPage: '.html',
    // {path,success  | [ prefix+path+postfix ] | exactly [ path ]  }
    xhr: function (op, th) {
        op = def(op, {});
        op.type = def(op.type, 'GET');
        op.prefix = def(op.prefix, prop.loader.prefixPath);
        op.postfix = def(op.postfix, prop.loader.postfixPage);

        if (def(op.exactly, false)) {
            op.postfix = '';
            op.prefix = '';
        }

        if (!def(op.path)) { ops("not found impelementaion for path.", 'warning'); return; }

        function processData(data) {
            // taking care of data
            if (def(op.success)) {
                th.content = data;
                th.options = op;
                op.success(th);
            }
            op.response = data;
            return op;
        }

        function handler() {
            if (this.readyState == this.DONE) {
                if (this.status == 200) {
                    // success!
                    processData(this.responseText);
                    return;
                }
                // something went wrong 
                ops("status is " + this.status, 'error', this);
            }
        }

        var client = new XMLHttpRequest();
        client.onreadystatechange = handler;
        client.open("GET", op.prefix + op.path + op.postfix);
        client.send();
    }
}

prop.html = {
    content: '',
    script: '',
    options: {},
    incode: function (cnt) {
        function de(cn) {
            return cn.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;')
                .replace(/"/g, '&quot;');
        }

        if (def(this.isInstance))
        { this.content = de(this.content); }
        else return de(cnt);
    },
    decode: function (cnt) {
        function de(cn) {
            return cn.replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#x27;/g, "'")
                .replace(/&#x2F;/g, '\/')
                .replace(/&quot;/g, '"');
        }

        if (def(this.isInstance))
        { this.content = de(this.content); }
        else return de(cnt);
    },
    setInner: function (obj, isText, insert, append) {
        if (def(this.isInstance)) {
            if (def(obj.value)) {
                obj.value = (def(append, false) ? obj.value : "") + this.content + (def(insert, false) ? obj.value : "");
            }
            else if (def(obj.text)) {
                obj.text = (def(append, false) ? obj.text : "") + this.content + (def(insert, false) ? obj.text : "");
            }
            else if (!def(isText, false) && def(obj.innerHTML)) {
                obj.innerHTML = (def(append, false) ? obj.innerHTML : "") + this.content + (def(insert, false) ? obj.innerHTML : "");
            }
            else if (this.isHtml && def(obj.innerText)) {
                obj.innerText = (def(append, false) ? obj.innerText : "") + this.content + (def(insert, false) ? obj.innerText : "");
            }
        }
        else throw 'can not use like singleton method';
        return this;
    },
    // term : default value ['<inner-body />']
    setOuter: function (obj, terms, sub) {
        if (def(this.isInstance)) {
            if (!def(terms) || !def(terms[0].length)) {
                obj.innerHTML = obj.innerHTML.replaceAll(def(terms, '<hd>inner-body</hd>'), this.content);
            }
            else {
                var elmt = document.createElement("div");
                this.setInner(elmt);
                var th = this;
                _for(terms, function (it, i) {
                    it = it.replace('#[', '').replace(']', '');
                    var elm = elmt.getElementsByTagName(it);
                    if (elm.length > 0) {
                        elm = elm[elm.length - 1];
                        if (def(sub)) {
                            sub(elm, obj, it);
                        }
                        else {
                            obj.innerHTML = obj.innerHTML.replaceAll('#[' + it + ']', elm.innerHTML);
                        }
                    }
                });
            }
        }
        else throw 'can not use like singleton method';

        return this;
    },
    replace: function (obj) {
        if (def(this.isInstance)) {

            var elmt = document.createElement(obj.tagName);

            _each(obj.attributes, function (xt, x) { elmt.setAttribute(x, xt); });

            this.setInner(elmt);

            obj.parentNode.replaceChild(obj, elmt);
        }
        else throw 'can not use like singleton method';

        return this;
    },
    getScript: function () {
        var elmt = document.createElement("div");
        this.setInner(elmt);
        var scripts = elmt.getElementsByTagName("script");
        var th = this;
        _for(scripts, function (it, i) {
            if (it.src) { /* !!! under construction */ }
            else {
                th.script += it.innerHTML;
            }
            elmt.removeChild(it);
        });

        this.content = elmt.innerHTML;

        return this;
    },
    runScript: function () {
        window.eval(def(this.script, ''));
        return this;
    },
    defaultSuccess: function (op) {
        this.getScript().setOuter(def(op.container, document.body), def(op.term, _null)).runScript();

        return this;
    }
}
//  'pages'+url+'.html'  , { container , term ,success:f(o), exactly}
prop.loader.get = function (url, op) {
    op = def(op, {});
    op.path = url;
    op.success = def(op.success, function (o) {
        o.defaultSuccess(op);
    });
    op.type = 'GET';
    this.isInstance = true;
    prop.loader.xhr(op, this);
},

prop.loader.get.prototype = prop.html;
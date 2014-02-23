(function (win) {
    win.onResize = function (element, attr) {
        return new Resize(element, attr);
    };

    var Util = {
        cbs: {},
        bind: function (element, event, cb) {
            Util.cbs[event] = Util.cbs[event] || [];
            Util.cbs[event].push(cb);
            if (element.addEventListener) {
                element.addEventListener(event, cb, false);
            } else {
                element.attachEvent(event, cb);
            }
        },
        off: function (element, event) {
            var cbs = Util.cbs[event];
            if (!cbs) {
                return;
            }

            for (var i = 0, l = cbs.length; i < l; i++) {
                var cb = cbs[i];
                if (element.removeEventListener) {
                    element.removeEventListener(event, cb, false);
                } else {
                    element.attachEvent(event, cb);
                }
            }
        }
    };

    var Interval = function () {
        this.resizes = [];
    };

    Interval.getInstance = function () {
        if (this.singleInstance) {
            return this.singleInstance;
        }

        return this.singleInstance = new Interval();
    };

    var start;
    var stop;
    var MutaionObserver = win.MutationObserver || win.webkitMutaionObserver;
    if (MutationObserver) {
        start = function () {
            var me = this;
            function callback() {
                console.log(arguments[0]);
                if (me.timeout) {
                    return;
                }

                me.timeout = win.setTimeout(function () {
                    for (var i = 0, l = me.resizes.length; i < l; i++) {
                        me.resizes[i].detect();
                    }
                    me.timeout = null;
                }, 250);
            }
            me.observer = new MutationObserver(callback);
            me.observer.observe(win.document.body, {
                childList: true,
                attributes: true,
                characterData: true,
                subtree: true
            });
        };
        stop = function () {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }

            if (this.timeout) {
                win.clearTimeout(this.timeout);
            }
        };
    } else {
        start = function () {
            var me = this;
            (function go() {
                me.timeout = win.setTimeout(function () {
                    for (var i = 0, l = me.resizes.length; i < l; i++) {
                        me.resizes[i].detect();
                    }

                    go();
                }, 250);
            })();
        };
        stop = function () {
            if (this.timeout) {
                win.clearTimeout(this.timeout);
                this.timeout = null;
            }
        };
    }

    Interval.prototype.start = function () {
        if (!this.started) {
            this.started = true;
            start.call(this);
        }
    };

    Interval.prototype.stop = function () {
        if (this.started) {
            this.started = false;
            stop.call(this);
        }
    };
    Interval.prototype.push = function (resize) {
        this.start();
        this.resizes.push(resize);
    };
    Interval.prototype.pop = function (resize) {
        for (var i = 0, l = this.resizes.length; i < l; i++) {
            if (this.resizes[i] === resize) {
                this.resizes.splice(i, 1);
            }
        }

        if (!this.resizes.length) {
            this.stop();
        }
    };

    var Resize = function (element, attr) {
        this.e = element;
        this.detectAttrs = attr
            ? [attr]
            : ['width', 'height'];
        this.v = {};
        this.oldV = {};

        for (var i = 0, l = this.detectAttrs.length; i < l; i++) {
            var a = this.detectAttrs[i];
            this.v[a] = this.e[this._toProp(a)];
        }

        Interval.getInstance().push(this);
    };

    Resize.prototype._toProp = function (attr) {
        return attr.replace(/^(\w)(\w+)$/, function ($1, $2, $3) {
            return 'offset' + $2.toUpperCase() + $3;
        });
    };

    Resize.prototype.isChanged = function () {
        var changed = false;
        for (var i = 0, l = this.detectAttrs.length; i < l; i++) {
            var a = this.detectAttrs[i];
            var propertyValue = this.e[this._toProp(a)];    // current value
            if (this.v[a] !== propertyValue) {
                this.oldV[a] = this.v[a];                   // save old value
                this.v[a] = propertyValue;                  // update value
                changed = true;
            }
        }
        return changed;
    };

    Resize.prototype.fire = function (data) {
        this.eventQueue = this.eventQueue || {};
        var queue = this.eventQueue,
            r = true;
        if (queue) {
            var arg = Array.prototype.slice.call(arguments);
            var value;
            for (var i = 0, l = queue.length; i < l; i++) {
                value = queue[i];
                if (value.callback.apply(value.context, arg) === false) {
                    r = false;
                }
            }
        }
        return r;
    };

    Resize.prototype.then = function (callback, context) {
        this.eventQueue = this.eventQueue || [];
        this.eventQueue.push({
            callback: callback,
            context: context
        });
        return this;
    };

    Resize.prototype.detect = function () {
        if (this.isChanged()) {
            this.fire(this.v, this.oldV);
        }
        return this;
    };

    Resize.prototype.dispose = function () {
        Interval.getInstance().pop(this);
        this.e = null;
    };

    /*
    var MutationObserver = win.MutationObserver || win.webkitMutationObserver;
    if (MutationObserver) {
        Resize.prototype.detect = function () {
            
        };
    } else {
    */
    //}
})(window);

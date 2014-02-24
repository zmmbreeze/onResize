(function (win) {
    /**
     * onResize($('div')[0])
     *     .then(function (v, oldV) {
     *         console.log(v.width, v.height);
     *     });
     * @param {Element} element watched element.
     * @param {Array=} attr watched attributes, like 'width' or 'height'.
     * @return {Resize} resize instance.
     */
    win.onResize = function (element, attr) {
        return new Resize(element, attr);
    };

    var Util = {
        events: {},
        /**
         * bind event.
         * @param {Element} element binded element.
         * @param {string} event event name.
         * @param {Function} cb callback.
         */
        on: function (element, event, cb) {
            Util.events[event] = Util.events[event] || [];
            Util.events[event].push({
                element: element,
                callback: cb
            });
            if (element.addEventListener) {
                element.addEventListener(event, cb, false);
            } else {
                element.attachEvent(event, cb);
            }
        },
        /**
         * unbind event.
         * @param {Element} element unbinded element.
         * @param {string} event event name.
         */
        off: function (element, event) {
            var events = Util.events[event];
            if (!events) {
                return;
            }

            for (var i = 0, l = events.length; i < l; i++) {
                var e = events[i];
                if (e.element !== element) {
                    continue;
                }

                if (element.removeEventListener) {
                    element.removeEventListener(event, e.callback, false);
                } else {
                    element.attachEvent(event, e.callback);
                }
            }
        }
    };

    /**
     * Interval class.
     * Using MutationObserver if supported, and using setTimeout as fallback.
     * @constructor
     */
    var Interval = function () {
        this.resizes = [];
    };

    /**
     * get or create single instance
     * @return {Interval} interval instance.
     */
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

            // observer
            me.observer = new MutationObserver(callback);
            me.observer.observe(win.document.body, {
                childList: true,
                attributes: true,
                characterData: true,
                subtree: true
            });

            // bind window resize event
            Util.on(win, 'resize', callback);
        };
        stop = function () {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }

            if (this.timeout) {
                win.clearTimeout(this.timeout);
            }

            // unbind resize event
            Util.off(win, 'resize');
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

    /**
     * start interval.
     */
    Interval.prototype.start = function () {
        if (!this.started) {
            this.started = true;
            start.call(this);
        }
    };

    /**
     * stop interval.
     */
    Interval.prototype.stop = function () {
        if (this.started) {
            this.started = false;
            stop.call(this);
        }
    };

    /**
     * push new resize instance.
     * @param {Resize} resize .
     */
    Interval.prototype.push = function (resize) {
        this.start();
        this.resizes.push(resize);
    };

    /**
     * remove resize instance.
     * @param {Resize} resize .
     */
    Interval.prototype.remove = function (resize) {
        for (var i = 0, l = this.resizes.length; i < l; i++) {
            if (this.resizes[i] === resize) {
                this.resizes.splice(i, 1);
            }
        }

        if (!this.resizes.length) {
            this.stop();
        }
    };

    /**
     * Resize class.
     * @constructor
     * @param {Element} element watched element.
     * @param {Array=} attr watched attributes, like 'width' or 'height'.
     */
    var Resize = function (element, attr) {
        this.e = element;
        this.detectAttrs = attr ? [attr] : ['width', 'height'];
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

    /**
     * test if size changed.
     * @return {boolean} changed.
     */
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

    /**
     * fire event.
     * @param {Object} data .
     * @return {Resize} this;
     */
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

    /**
     * bind change event callback.
     * @param {Function} callback .
     * @param {Object} context .
     * @return {Resize} this.
     */
    Resize.prototype.then = function (callback, context) {
        this.eventQueue = this.eventQueue || [];
        this.eventQueue.push({
            callback: callback,
            context: context
        });
        return this;
    };

    /**
     * detect size change.
     * @return {Resize} this.
     */
    Resize.prototype.detect = function () {
        if (this.isChanged()) {
            this.fire(this.v, this.oldV);
        }
        return this;
    };

    /**
     * dispose resize instance.
     */
    Resize.prototype.dispose = function () {
        Interval.getInstance().remove(this);
        this.e = null;
    };
})(window);

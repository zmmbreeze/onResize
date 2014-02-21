(function (win) {
    window.onResize = function (element, attr) {
        return new Resize(element, attr);
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
    Interval.prototype.start = function () {
        var me = this;
        if (me.started) {
            return;
        }

        me.started = true;
        (function go() {
            me.timeout = window.setTimeout(function () {
                for (var i = 0, l = me.resizes.length; i < l; i++) {
                    me.resizes[i].detect();
                }

                go();
            }, 250);
        })();
    };
    Interval.prototype.stop = function () {
        this.started = false;
        if (this.timeout) {
            window.clearTimeout(this.timeout);
            this.timeout = null;
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
            ? 'offset' + attr.charAt(0).toUpperCase() + attr.slice(1)
            : ['offsetWidth', 'offsetHeight'];
        this.v = {};
        this.oldV = {};

        for (var i = 0, l = this.detectAttrs.length; i < l; i++) {
            var a = this.detectAttrs[i];
            this.v[a] = this.e[a];
        }

        Interval.getInstance().push(this);
    };

    Resize.prototype.isChanged = function () {
        var changed = false;
        for (var i = 0, l = this.detectAttrs.length; i < l; i++) {
            var a = this.detectAttrs[i];
            var propertyValue = this.e[a];    // current value
            if (this.v[a] !== propertyValue) {
                this.oldV[a] = this.v[a];            // save old value
                this.v[a] = propertyValue;          // update value
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

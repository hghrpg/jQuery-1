/*!
 * jQuery JavaScript Library v2.0.3
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2005, 2013 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2013-07-03T13:30Z
 */

// Can't do this because several apps including ASP.NET trace
// the stack via arguments.caller.callee and Firefox dies if
// you try to trace through "use strict" call chains. (#13335)
// Support: Firefox 18+
//"use strict";
//以下注释说明绝大部分来自360code用户. jquery注释版本为1.8.?
var
// A central reference to the root jQuery(document) /// 框架内部通用的jQuery(document)的临时变量
rootjQuery,

// The deferred used on DOM ready ///1.8中DOM ready改成了deferred，这个是ready的执行列表
readyList,

// Support: IE9
// For `typeof xmlNode.method` instead of `xmlNode.method !== undefined`
core_strundefined = typeof undefined,

// Use the correct document accordingly with window argument (sandbox) /// 使用当前window下的document (沙箱机制)
// location = window.location,
document = window.document,
docElem = document.documentElement,

// Map over jQuery in case of overwrite /// 映射 jQuery 以便重写，主要是在noConflict中用到（1.8.0 line 342）
_jQuery = window.jQuery,
// Map over the $ in case of overwrite /// 映射 $ 以便重写，主要是在noConflict中用到（line 342）
_$ = window.$,

// [[Class]] -> type pairs
class2type = {},
// List of deleted data cache ids, so we can reuse them
core_deletedIds = [],
core_version = "2.0.3",

// Save a reference to some core methods
core_concat = core_deletedIds.concat, //旧版写法Array.prototype.concat. 因为core_deletedIds=[],所以是等价的
core_push = core_deletedIds.push,//同上
core_slice = core_deletedIds.slice,//同上
core_indexOf = core_deletedIds.indexOf,//同上
core_toString = class2type.toString,//旧版Object.prototype.toString. 因为class2type={},所以是等价的
core_hasOwn = class2type.hasOwnProperty,//同上
core_trim = core_version.trim, //旧版String.prototype.trim, ∵core_version = "2.0.3",∴等价

/* 1.8.?
// 一些核心方法的映射，1.8以后，核心变量的变量名也做了优化，前面加了core_前缀
	core_push = Array.prototype.push,
	core_slice = Array.prototype.slice,
	core_indexOf = Array.prototype.indexOf,
	core_toString = Object.prototype.toString,
	core_hasOwn = Object.prototype.hasOwnProperty,
	core_trim = String.prototype.trim,
*/

// Define a local copy of jQuery ///注点1，这个对象准备被window.jQuery外放为jQuery全局变量，同时便于其它功能在其上扩展（如DOM，Event等）
jQuery = function (selector, context) {
    // The jQuery object is actually just the init constructor 'enhanced'
    ///注点1中调用时，自动构造jQuery对象，而这个jQuery对象，是jQuery.fn.init的一个实例化
    ///故jQuery实例对象，前面都是没有new的，就是在这里框架内部自动完成了实例化
    return new jQuery.fn.init(selector, context, rootjQuery);
},

// Used for matching numbers
core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,

// Used for splitting on whitespace
core_rnotwhite = /\S+/g,

// A simple way to check for HTML strings
// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
// Strict HTML recognition (#11290: must start with <)
/// 捕获1、html字符串（不能以#为前导，防止通过location.has进行xss攻击）；2、#开头的id字符串
rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,

// Match a standalone tag
/// 匹配独立的html标签，标签闭合间没有文本，如<a>xxx</a>,中间有xxx不符合
rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,

// Matches dashed string for camelizing
/// 浏览器检测用正则表达式
rmsPrefix = /^-ms-/,
rdashAlpha = /-([\da-z])/gi,

// Used by jQuery.camelCase as callback to replace()
///驼峰方法jQuery.camelCase中使用
fcamelCase = function (all, letter) {
    return letter.toUpperCase();
},

// The ready event handler and self cleanup method ///旧版写法不一样
completed = function () {
    document.removeEventListener("DOMContentLoaded", completed, false);
    window.removeEventListener("load", completed, false);
    jQuery.ready();
};

/*
 * jQuery.fn相当于jQuery.prototype的别名，指向的是同一份内容
 * 第二个有趣的延伸知识点：js原型prototype
 * 
 * @知识索引：
 * 原型和继承：http://www.cnblogs.com/ljchow/archive/2010/06/08/1753526.html
 * prototype和constructor：http://blog.csdn.net/niuyongjie/article/details/4810835
 * 
 * @本处使用的作用
 * 主要是为了一些core方法的扩展准备（此处只做init核心方法的注释，其它方法请查看api结合源码了解）。
 * 注：按照prototype的概念，只有new jQuery的自身实例化能使用这里的方法，而jQuery对象，不是自身实例化，而是jQuery.fn.init的实例化，用不了这里的方法。
 *     有上面的问题，故有后面的原型链接续，使jQuery对象能使用这里的方法
 */
jQuery.fn = jQuery.prototype = {
    // The current version of jQuery being used
    jquery: core_version,
    ///构造器，便于内部使用this.constructor这种看起来超类继承的写法，更符合OOP思维
    constructor: jQuery,

    /*
	 * 
	 * 第三个有趣的延伸知识点：设计模式之工厂模式
	 * 
	 * @本处使用的作用
	 * 1）工厂模式的优点是一“家”工厂，解决各类生产需要，即一“个”jQuery对象，能分配各类调用需要
	 * 2）“单一”调用的写法，减少学习成本
	 * 3）jQuery不会因为不好预测使用者会给它传递什么参数，而导致自缚，便于后续扩展建立更多“子生产线”
	 * 4）使用者只需要关心在按照API要求使用情况下会得到期望结果，不需关心内部运作
	 * 
	 */
    init: function (selector, context, rootjQuery) {
        var match, elem;
        /// 根据selector不同，返回不同的值 //http://www.cnblogs.com/aaronjs/p/3281911.html 选择器支持9种方式的处理
        /// selector有以下7种(新版分9种)分支情况：
        /// 1、""、null、undefined、false
        /// 2、DOM元素
        /// 3、body（优化寻找）1.7中还有，1.8没有，归到了4中，故这里源码没有
        /// 4、字符串：HTML标签、HTML字符串、#id、选择器表达式
        /// 5、函数（作为ready回调函数）
        /// 6、jQuery对象（因为有selector值）
        /// 7、其它

        // HANDLE: $(""), $(null), $(undefined), $(false) ///分支1
        if (!selector) {
            return this;
        }

        // Handle HTML strings ///分支3,4
        // hgh:http://blog.csdn.net/dyllove98/article/details/8854877 http://www.cnblogs.com/aaronjs/p/3281911.html
        if (typeof selector === "string") {
            /// 前后<>匹配，根据html标签规律，<>开闭之间有个标签名，故长度至少是3，节省正则开销
            if (selector.charAt(0) === "<" && selector.charAt(selector.length - 1) === ">" && selector.length >= 3) {
                // Assume that strings that start and end with <> are HTML and skip the regex check
                match = [null, selector, null];

            } else {
                //正则表达式应用，匹配，子表达式1、html字符串（不能以#为前导，防止通过location.has进行xss攻击）；子表达式2、#开头的id字符串
                //用了exec，故匹配结果为[整体匹配结果，子表达式1匹配结果，子表达式2匹配结果]
                //如#id,匹配结果['#id',undefined,'id']，id字符串则第3个有值
                //如<div>,["<div>","<div>",undefined]，html字符串第2个有值，但这个结果会在上面分支中处理，不会进入这个分支
                //如a<div>,["a<div>","<div>",undefined]，html字符串第2个有值
                //如#id<div>，结果null，方式location.hash中的xss攻击？
                match = rquickExpr.exec(selector);
            }

            // Match html or make sure no context is specified for #id
            /// 分支: html标签字符串，$('<tag>')，这里排除了#id
            if (match && (match[1] || !context)) {

                // HANDLE: $(html) -> $(array)
                if (match[1]) {
                    context = context instanceof jQuery ? context[0] : context;

                    var aaa = jQuery.parseHTML(match[1], context && context.nodeType ? context.ownerDocument || context : document, true)

                    // scripts is true for back-compat
                    jQuery.merge(this, aaa);

                    // HANDLE: $(html, props)
                    if (rsingleTag.test(match[1]) && jQuery.isPlainObject(context)) {
                        for (match in context) {
                            // Properties of context are called as methods if possible
                            if (jQuery.isFunction(this[match])) {
                                this[match](context[match]);

                                // ...and otherwise set as attributes
                            } else {
                                this.attr(match, context[match]);
                            }
                        }
                    }

                    return this;

                    // HANDLE: $(#id)
                } else {
                    elem = document.getElementById(match[2]);

                    // Check parentNode to catch when Blackberry 4.6 returns
                    // nodes that are no longer in the document #6963
                    if (elem && elem.parentNode) {
                        // Inject the element directly into the jQuery object
                        this.length = 1;
                        this[0] = elem;
                    }

                    this.context = document;
                    this.selector = selector;
                    return this;
                }

                // HANDLE: $(expr, $(...))
            } else if (!context || context.jquery) {
                return (context || rootjQuery).find(selector);

                // HANDLE: $(expr, context)
                // (which is just equivalent to: $(context).find(expr)
            } else {
                return this.constructor(context).find(selector);
            }

            // HANDLE: $(DOMElement)
        } else if (selector.nodeType) {
            this.context = this[0] = selector;
            this.length = 1;
            return this;

            // HANDLE: $(function)
            // Shortcut for document ready
        } else if (jQuery.isFunction(selector)) {
            return rootjQuery.ready(selector);
        }
        ///如果内部是个jQuery对象，那么不用再次封装，直接简单加工下内部的jQuery对象
        if (selector.selector !== undefined) {
            this.selector = selector.selector;
            this.context = selector.context;
        }

        ///把一个像数组的对象（jQuery对象就是这种），处理成一个真实的数组  ///hgh:$.()返回结果为数组(类数组)
        return jQuery.makeArray(selector, this);
    },

    // Start with an empty selector /// jQuery会记录当前选择器，初始为空
    selector: "",

    // The default length of a jQuery object is 0 /// jQuery对象的长度属性
    length: 0,

    /* jQuery 1.8.?还定义了一个size方法
    // jQuery对象的长度方法
	size: function() {
		return this.length;
	},
    */

    toArray: function () {
        return core_slice.call(this);
    },

    // Get the Nth element in the matched element set OR
    // Get the whole matched element set as a clean array
    get: function (num) {
        return num == null ?

        // Return a 'clean' array
        this.toArray() :

        // Return just the object
        (num < 0 ? this[this.length + num] : this[num]);
    },

    // Take an array of elements and push it onto the stack
    // (returning the new matched element set)
    pushStack: function (elems) {

        // Build a new jQuery matched element set
        var ret = jQuery.merge(this.constructor(), elems);

        // Add the old object onto the stack (as a reference)
        ret.prevObject = this;
        ret.context = this.context;

        // Return the newly-formed element set
        return ret;
    },

    // Execute a callback for every element in the matched set.
    // (You can seed the arguments with an array of args, but this is
    // only used internally.)
    each: function (callback, args) {
        return jQuery.each(this, callback, args);
    },

    ready: function (fn) {
        // Add the callback
        jQuery.ready.promise().done(fn);

        return this;
    },

    slice: function () {
        return this.pushStack(core_slice.apply(this, arguments));
    },

    first: function () {
        return this.eq(0);
    },

    last: function () {
        return this.eq(-1);
    },

    eq: function (i) {
        var len = this.length,
        j = +i + (i < 0 ? len : 0);
        return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
    },

    map: function (callback) {
        return this.pushStack(jQuery.map(this,
        function (elem, i) {
            return callback.call(elem, i, elem);
        }));
    },

    end: function () {
        return this.prevObject || this.constructor(null);
    },

    // For internal use only.
    // Behaves like an Array's method, not like a jQuery method.
    push: core_push,
    sort: [].sort,
    splice: [].splice
};

// 将jQuery对象的fn(即prototype)赋给实例化用的init函数的prototype，使得最后返回的jQuery对象的值拥有init中的this以及fn中的值
// 这里是框架中非常重要的一环
// 此处进行了原型链接续，原本，jQuery实例对象，因为它是jQuery.fn.init的实例化，故只能拥有init中的this以及自己的原型链（没有接续前是空）
// 这里这个操作，把jQuery的原型链（fn是原型链别名）接给了jQuery.fn.init，故最后的jQuery实例对象，拥有了init中的this以及自己的原型链（这时候接上了jQuery的原型链）
// 注意，后续被扩展在jQuery原型链上的，也会被jQuery实例对象拥有（如jQuery.extend等）
// Give the init function the jQuery prototype for later instantiation ///jQuery.fn相当于jQuery.prototype,后面hgh自己的理解:让jQuery类的原型对象带上init方法,这个方法将作为jQuery实例对象的生成器
jQuery.fn.init.prototype = jQuery.fn;

//继承是面向对象中一种非常重要的概念，这里是jQuery的一个实现方案
//jQuery.extend为jQuery本体静态方法扩展入口，jQuery.fn.extend为jQuery实例扩展入口
//这里两种不能的继承基于同一个方法，但是却为后续框架两种扩展留下入口
jQuery.extend = jQuery.fn.extend = function () {
    var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {},///target是传入的第一个值，表示需要应用继承的目标对象
    i = 1,
    length = arguments.length,
    deep = false;

    // Handle a deep copy situation /// 如果target是boolean（那明显不是需要应用继承的目标对象）
    if (typeof target === "boolean") {
        ///deep用传入值
        deep = target;
        ///target用传入的第二个值，没有则空对象
        target = arguments[1] || {};
        // skip the boolean and the target
        i = 2;
    }

    // 如果target不是对象且不是函数，那么target是一个空对象{}
    // 可能是一个字符串或者其它(可能是一个深层拷贝)
    // Handle case when target is a string or something (possible in deep copy)
    if (typeof target !== "object" && !jQuery.isFunction(target)) {
        target = {};//这边为什么会给target赋值{}????
    }

    // 进入这个分支的只有1===1（第一个参数有值，且不是boolean）和2===2（第一个是boolean，第二个也有值）
    // 只有应用的目标对象，却无参考对象，奇怪？
    // 其实不奇怪，这里是jQuery自我继承用的
    // extend jQuery itself if only one argument is passed
    if (length === i) {
        //target等于this，即该方法调用者，适应后面jQuery.extend({})的用法，即this为jQuery
        target = this;
        //自减，这样后面能进一次循环
        --i;
    }

    //从参数有效target之后，开始循环（不包括有效target，jQuery自调用时，有效target变为jQuery，原来的target变为参考对象）
    //参考对象可能是多个，故要一个个进行循环，故后面的参考对象，会重新覆盖前面的参考对象同名值
    for (; i < length; i++) {
        // Only deal with non-null/undefined values /// 只处理非null和undefined
        if ((options = arguments[i]) != null) {
            // Extend the base object
            for (name in options) {
                src = target[name];
                copy = options[name];

                // Prevent never-ending loop /// 防止无限循环的死锁，即参考对象中的值又指向目标对象，等于目标对象不停拷贝自己
                if (target === copy) {
                    continue;
                }

                // 启用了deep深层拷贝，且copy非""、null、undefined、false且满足copy（数组或者纯对象）其中的一种情况
                // 深层拷贝数组、纯对象
                // Recurse if we're merging plain objects or arrays
                if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)))) {
                    ///如果是数组
                    if (copyIsArray) {
                        copyIsArray = false; ///重置，使得下次进入时，还能启用外层判断
                        clone = src && jQuery.isArray(src) ? src : []; //判断目标对象中的原值是否是数组，如果是，克隆目标对象是原值，如果不是，则变为空数组

                    } else {
                        clone = src && jQuery.isPlainObject(src) ? src : {}; ///判断目标对象中的原值是否是纯对象，如果是，克隆目标对象是原值，如果不是，则变为空的纯对象
                    }

                    // 递归调用，深层拷贝
                    // Never move original objects, clone them
                    target[name] = jQuery.extend(deep, clone, copy);

                    // 非数组、非纯对象，且非null和undefined的其它情况（包括""、false等），这里简单数据结构，不需做深层拷贝，故deep不需要
                    // Don't bring in undefined values
                } else if (copy !== undefined) {
                    target[name] = copy;///target中对象name的值更新为copy中的值
                }
            }
        }
    }

    // Return the modified object // 返回修改后的对象
    return target;
};
//对上面的另一个解释:
/*
文／龟仙老人（简书作者）
原文链接：http://www.jianshu.com/p/aafaaf32f371
著作权归作者所有，转载请联系作者获得授权，并标注“简书作者”。
jQuery.extend = jQuery.fn.extend = function (){...};
这里，jQuery.fn.extend扩展的是jQuery对象(hgh:实例对象?全局变量对象?)的方法和属性，而jQuery.extend扩展的是jQuery类的方法和属性。)
*/

jQuery.extend({
    // Unique for each copy of jQuery on the page
    // 版本号+随机数
    // 因为可能一个页面引入多个版本的jQueryx
    expando: "jQuery" + (core_version + Math.random()).replace(/\D/g, ""),

    ///防止和其它框架冲突的方法，使用见api
    noConflict: function (deep) {
        if (window.$ === jQuery) {
            window.$ = _$;
        }

        if (deep && window.jQuery === jQuery) {
            window.jQuery = _jQuery;
        }

        return jQuery;
    },

    // Is the DOM ready to be used? Set to true once it occurs. /// 判断DOM ready是否已经可用，如果已经ready，那么该值会变成true
    isReady: false,

    // A counter to track how many items to wait for before
    // the ready event fires. See #6781
    readyWait: 1,

    // Hold (or release) the ready event
    holdReady: function (hold) {
        if (hold) {
            jQuery.readyWait++;
        } else {
            jQuery.ready(true);
        }
    },

    // Handle when the DOM is ready /// DOM ready也是写在core里面的，1.8以后，这里改成了基于Deffered实现
    ready: function (wait) {

        // Abort if there are pending holds or we're already ready
        /// 如果已经ready 或者 等待状态，但不等于1（1自减1后等于0，即false，非1为true）
        if (wait === true ? --jQuery.readyWait : jQuery.isReady) {
            return;
        }

        // Remember that the DOM is ready
        jQuery.isReady = true;

        // If a normal DOM Ready event fired, decrement, and wait if need be
        if (wait !== true && --jQuery.readyWait > 0) {
            return;
        }

        // If there are functions bound, to execute
        readyList.resolveWith(document, [jQuery]);

        // Trigger any bound ready events
        if (jQuery.fn.trigger) {
            jQuery(document).trigger("ready").off("ready");
        }
    },

    // See test/unit/core.js for details concerning isFunction.
    // Since version 1.3, DOM methods and functions like alert
    // aren't supported. They return false on IE (#2968).
    isFunction: function (obj) {
        return jQuery.type(obj) === "function";
    },

    isArray: Array.isArray,

    isWindow: function (obj) {
        return obj != null && obj === obj.window;
    },

    isNumeric: function (obj) {
        return !isNaN(parseFloat(obj)) && isFinite(obj);
    },

    type: function (obj) {
        if (obj == null) {
            return String(obj);
        }
        // Support: Safari <= 5.1 (functionish RegExp)
        return typeof obj === "object" || typeof obj === "function" ? class2type[core_toString.call(obj)] || "object" : typeof obj;
    },

    isPlainObject: function (obj) {
        // Not plain objects:
        // - Any object or value whose internal [[Class]] property is not "[object Object]"
        // - DOM nodes
        // - window
        if (jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow(obj)) {
            return false;
        }

        // Support: Firefox <20
        // The try/catch suppresses exceptions thrown when attempting to access
        // the "constructor" property of certain host objects, ie. |window.location|
        // https://bugzilla.mozilla.org/show_bug.cgi?id=814622
        try {
            if (obj.constructor && !core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
                return false;
            }
        } catch (e) {
            return false;
        }

        // If the function hasn't returned already, we're confident that
        // |obj| is a plain object, created by {} or constructed with new Object
        return true;
    },

    isEmptyObject: function (obj) {
        var name;
        for (name in obj) {
            return false;
        }
        return true;
    },

    error: function (msg) {
        throw new Error(msg);
    },

    // data: string of html
    // context (optional): If specified, the fragment will be created in this context, defaults to document
    // keepScripts (optional): If true, will include scripts passed in the html string
    parseHTML: function (data, context, keepScripts) {
        if (!data || typeof data !== "string") {
            return null;
        }
        if (typeof context === "boolean") {
            keepScripts = context;
            context = false;
        }

        context = context || document;

        var parsed = rsingleTag.exec(data),
        scripts = !keepScripts && [];

        // Single tag
        if (parsed) {
            return [context.createElement(parsed[1])];
        }

        parsed = jQuery.buildFragment([data], context, scripts);

        if (scripts) {
            jQuery(scripts).remove();
        }

        return jQuery.merge([], parsed.childNodes);
    },

    parseJSON: JSON.parse,

    // Cross-browser xml parsing
    parseXML: function (data) {
        var xml, tmp;
        if (!data || typeof data !== "string") {
            return null;
        }

        // Support: IE9
        try {
            tmp = new DOMParser();
            xml = tmp.parseFromString(data, "text/xml");
        } catch (e) {
            xml = undefined;
        }

        if (!xml || xml.getElementsByTagName("parsererror").length) {
            jQuery.error("Invalid XML: " + data);
        }
        return xml;
    },

    noop: function () { },

    // Evaluates a script in a global context
    globalEval: function (code) {
        var script, indirect = eval;

        code = jQuery.trim(code);

        if (code) {
            // If the code includes a valid, prologue position
            // strict mode pragma, execute code by injecting a
            // script tag into the document.
            if (code.indexOf("use strict") === 1) {
                script = document.createElement("script");
                script.text = code;
                document.head.appendChild(script).parentNode.removeChild(script);
            } else {
                // Otherwise, avoid the DOM node creation, insertion
                // and removal by using an indirect global eval
                indirect(code);
            }
        }
    },

    // Convert dashed to camelCase; used by the css and data modules
    // Microsoft forgot to hump their vendor prefix (#9572)
    camelCase: function (string) {
        return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);
    },

    nodeName: function (elem, name) {
        return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
    },

    // args is for internal usage only
    each: function (obj, callback, args) {
        var value, i = 0,
        length = obj.length,
        isArray = isArraylike(obj);

        if (args) {
            if (isArray) {
                for (; i < length; i++) {
                    value = callback.apply(obj[i], args);

                    if (value === false) {
                        break;
                    }
                }
            } else {
                for (i in obj) {
                    value = callback.apply(obj[i], args);

                    if (value === false) {
                        break;
                    }
                }
            }

            // A special, fast, case for the most common use of each
        } else {
            if (isArray) {
                for (; i < length; i++) {
                    value = callback.call(obj[i], i, obj[i]);

                    if (value === false) {
                        break;
                    }
                }
            } else {
                for (i in obj) {
                    value = callback.call(obj[i], i, obj[i]);

                    if (value === false) {
                        break;
                    }
                }
            }
        }

        return obj;
    },

    trim: function (text) {
        return text == null ? "" : core_trim.call(text);
    },

    // results is for internal usage only
    makeArray: function (arr, results) {
        var ret = results || [];

        if (arr != null) {
            if (isArraylike(Object(arr))) {
                jQuery.merge(ret, typeof arr === "string" ? [arr] : arr);
            } else {
                core_push.call(ret, arr);
            }
        }

        return ret;
    },

    inArray: function (elem, arr, i) {
        return arr == null ? -1 : core_indexOf.call(arr, elem, i);
    },

    merge: function (first, second) {
        var l = second.length,
        i = first.length,
        j = 0;

        if (typeof l === "number") {
            for (; j < l; j++) {
                first[i++] = second[j];
            }
        } else {
            while (second[j] !== undefined) {
                first[i++] = second[j++];
            }
        }

        first.length = i;

        return first;
    },

    grep: function (elems, callback, inv) {
        var retVal, ret = [],
        i = 0,
        length = elems.length;
        inv = !!inv;

        // Go through the array, only saving the items
        // that pass the validator function
        for (; i < length; i++) {
            retVal = !!callback(elems[i], i);
            if (inv !== retVal) {
                ret.push(elems[i]);
            }
        }

        return ret;
    },

    // arg is for internal usage only
    map: function (elems, callback, arg) {
        var value, i = 0,
        length = elems.length,
        isArray = isArraylike(elems),
        ret = [];

        // Go through the array, translating each of the items to their
        if (isArray) {
            for (; i < length; i++) {
                value = callback(elems[i], i, arg);

                if (value != null) {
                    ret[ret.length] = value;
                }
            }

            // Go through every key on the object,
        } else {
            for (i in elems) {
                value = callback(elems[i], i, arg);

                if (value != null) {
                    ret[ret.length] = value;
                }
            }
        }

        // Flatten any nested arrays
        return core_concat.apply([], ret);
    },

    // A global GUID counter for objects
    guid: 1,

    // Bind a function to a context, optionally partially applying any
    // arguments.
    proxy: function (fn, context) {
        var tmp, args, proxy;

        if (typeof context === "string") {
            tmp = fn[context];
            context = fn;
            fn = tmp;
        }

        // Quick check to determine if target is callable, in the spec
        // this throws a TypeError, but we will just return undefined.
        if (!jQuery.isFunction(fn)) {
            return undefined;
        }

        // Simulated bind
        args = core_slice.call(arguments, 2);
        proxy = function () {
            return fn.apply(context || this, args.concat(core_slice.call(arguments)));
        };

        // Set the guid of unique handler to the same of original handler, so it can be removed
        proxy.guid = fn.guid = fn.guid || jQuery.guid++;

        return proxy;
    },

    // Multifunctional method to get and set values of a collection
    // The value/s can optionally be executed if it's a function
    access: function (elems, fn, key, value, chainable, emptyGet, raw) {
        var i = 0,
        length = elems.length,
        bulk = key == null;

        // Sets many values
        if (jQuery.type(key) === "object") {
            chainable = true;
            for (i in key) {
                jQuery.access(elems, fn, i, key[i], true, emptyGet, raw);
            }

            // Sets one value
        } else if (value !== undefined) {
            chainable = true;

            if (!jQuery.isFunction(value)) {
                raw = true;
            }

            if (bulk) {
                // Bulk operations run against the entire set
                if (raw) {
                    fn.call(elems, value);
                    fn = null;

                    // ...except when executing function values
                } else {
                    bulk = fn;
                    fn = function (elem, key, value) {
                        return bulk.call(jQuery(elem), value);
                    };
                }
            }

            if (fn) {
                for (; i < length; i++) {
                    fn(elems[i], key, raw ? value : value.call(elems[i], i, fn(elems[i], key)));
                }
            }
        }

        return chainable ? elems :

        // Gets
        bulk ? fn.call(elems) : length ? fn(elems[0], key) : emptyGet;
    },

    now: Date.now,

    // A method for quickly swapping in/out CSS properties to get correct calculations.
    // Note: this method belongs to the css module but it's needed here for the support module.
    // If support gets modularized, this method should be moved back to the css module.
    swap: function (elem, options, callback, args) {
        var ret, name, old = {};

        // Remember the old values, and insert the new ones
        for (name in options) {
            old[name] = elem.style[name];
            elem.style[name] = options[name];
        }

        ret = callback.apply(elem, args || []);

        // Revert the old values
        for (name in options) {
            elem.style[name] = old[name];
        }

        return ret;
    }
});

jQuery.ready.promise = function (obj) {
    if (!readyList) {

        readyList = jQuery.Deferred(); ///这个很好 http://www.ruanyifeng.com/blog/2011/08/a_detailed_explanation_of_jquery_deferred_object.html

        // Catch cases where $(document).ready() is called after the browser event has already occurred.
        // we once tried to use readyState "interactive" here, but it caused issues like the one
        // discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
        if (document.readyState === "complete") {
            // Handle it asynchronously to allow scripts the opportunity to delay ready
            setTimeout(jQuery.ready);

        } else {

            // Use the handy event callback
            document.addEventListener("DOMContentLoaded", completed, false);

            // A fallback to window.onload, that will always work
            window.addEventListener("load", completed, false);
        }
    }
    return readyList.promise(obj); ///参考 http://www.jianshu.com/p/aafaaf32f371 
};

// Populate the class2type map
jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),
function (i, name) {
    class2type["[object " + name + "]"] = name.toLowerCase();
});

function isArraylike(obj) {
    var length = obj.length,
    type = jQuery.type(obj);

    if (jQuery.isWindow(obj)) {
        return false;
    }

    if (obj.nodeType === 1 && length) {
        return true;
    }

    return type === "array" || type !== "function" && (length === 0 || typeof length === "number" && length > 0 && (length - 1) in obj);
}

// All jQuery objects should point back to these
rootjQuery = jQuery(document);
// 后续代码列表 下面的列表信息是基于1.8.2版本的.咱们现在这个源码是2.0.3版本
// 回调对象 Callback（line 985~1211)
// 延迟对象 Deferred（line 1214~1356) ///简单说，deferred对象就是jQuery的回调函数解决方案。
// 浏览器特性检测 Support（line 1359~1662)
// 数据缓存 Data（line 1665~2030)
// 队列 queue（line 2033~2211)
// 属性操作 Attribute（line 2214~2868)
// 事件处理 Event（line 2871~3937)
// 选择器 Sizzle（line 3937~5394)
// DOM遍历 Traversing（line 5395~5716)
// DOM操作 Manipulation（line 5719~6550)
// CSS操作 （line 6553~6967)
// 异步请求 Ajax（line 6970~8358)
// 动画 FX（line 8361~9269)
// 坐标和可视窗口（line 9270~9379)

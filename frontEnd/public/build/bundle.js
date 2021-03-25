
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    function create_animation(node, from, fn, params) {
        if (!from)
            return noop;
        const to = node.getBoundingClientRect();
        if (from.left === to.left && from.right === to.right && from.top === to.top && from.bottom === to.bottom)
            return noop;
        const { delay = 0, duration = 300, easing = identity, 
        // @ts-ignore todo: should this be separated from destructuring? Or start/end added to public api and documentation?
        start: start_time = now() + delay, 
        // @ts-ignore todo:
        end = start_time + duration, tick = noop, css } = fn(node, { from, to }, params);
        let running = true;
        let started = false;
        let name;
        function start() {
            if (css) {
                name = create_rule(node, 0, 1, duration, delay, easing, css);
            }
            if (!delay) {
                started = true;
            }
        }
        function stop() {
            if (css)
                delete_rule(node, name);
            running = false;
        }
        loop(now => {
            if (!started && now >= start_time) {
                started = true;
            }
            if (started && now >= end) {
                tick(1, 0);
                stop();
            }
            if (!running) {
                return false;
            }
            if (started) {
                const p = now - start_time;
                const t = 0 + 1 * easing(p / duration);
                tick(t, 1 - t);
            }
            return true;
        });
        start();
        tick(0, 1);
        return stop;
    }
    function fix_position(node) {
        const style = getComputedStyle(node);
        if (style.position !== 'absolute' && style.position !== 'fixed') {
            const { width, height } = style;
            const a = node.getBoundingClientRect();
            node.style.position = 'absolute';
            node.style.width = width;
            node.style.height = height;
            add_transform(node, a);
        }
    }
    function add_transform(node, a) {
        const b = node.getBoundingClientRect();
        if (a.left !== b.left || a.top !== b.top) {
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            node.style.transform = `${transform} translate(${a.left - b.left}px, ${a.top - b.top}px)`;
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function fix_and_outro_and_destroy_block(block, lookup) {
        block.f();
        outro_and_destroy_block(block, lookup);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.4' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function flip(node, animation, params) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;
        const scaleX = animation.from.width / node.clientWidth;
        const scaleY = animation.from.height / node.clientHeight;
        const dx = (animation.from.left - animation.to.left) / scaleX;
        const dy = (animation.from.top - animation.to.top) / scaleY;
        const d = Math.sqrt(dx * dx + dy * dy);
        const { delay = 0, duration = (d) => Math.sqrt(d) * 120, easing = cubicOut } = params;
        return {
            delay,
            duration: is_function(duration) ? duration(d) : duration,
            easing,
            css: (_t, u) => `transform: ${transform} translate(${u * dx}px, ${u * dy}px);`
        };
    }

    // external events
    const FINALIZE_EVENT_NAME = 'finalize';
    const CONSIDER_EVENT_NAME = 'consider';

    /**
     * @typedef {Object} Info
     * @property {string} trigger
     * @property {string} id
     * @property {string} source
     * @param {Node} el
     * @param {Array} items
     * @param {Info} info
     */
    function dispatchFinalizeEvent(el, items, info) {
        el.dispatchEvent(new CustomEvent(FINALIZE_EVENT_NAME, {
            detail: {items, info}
        }));
    }

    /**
     * Dispatches a consider event
     * @param {Node} el
     * @param {Array} items
     * @param {Info} info
     */
    function dispatchConsiderEvent(el, items, info) {
        el.dispatchEvent(new CustomEvent(CONSIDER_EVENT_NAME, {
            detail: {items, info}
        }));
    }

    // internal events
    const DRAGGED_ENTERED_EVENT_NAME = 'draggedEntered';
    const DRAGGED_LEFT_EVENT_NAME = 'draggedLeft';
    const DRAGGED_OVER_INDEX_EVENT_NAME = 'draggedOverIndex';
    const DRAGGED_LEFT_DOCUMENT_EVENT_NAME = 'draggedLeftDocument';
    function dispatchDraggedElementEnteredContainer(containerEl, indexObj, draggedEl) {
        containerEl.dispatchEvent(new CustomEvent(DRAGGED_ENTERED_EVENT_NAME, {
            detail: {indexObj, draggedEl}
        }));
    }
    function dispatchDraggedElementLeftContainer(containerEl, draggedEl) {
        containerEl.dispatchEvent(new CustomEvent(DRAGGED_LEFT_EVENT_NAME, {
            detail: {draggedEl}
        }));
    }
    function dispatchDraggedElementIsOverIndex(containerEl, indexObj, draggedEl) {
        containerEl.dispatchEvent(new CustomEvent(DRAGGED_OVER_INDEX_EVENT_NAME, {
            detail: {indexObj, draggedEl}
        }));
    }
    function dispatchDraggedLeftDocument(draggedEl) {
        window.dispatchEvent(new CustomEvent(DRAGGED_LEFT_DOCUMENT_EVENT_NAME, {
            detail: { draggedEl}
        }));
    }

    const TRIGGERS = {
        DRAG_STARTED: "dragStarted",
        DRAGGED_ENTERED: DRAGGED_ENTERED_EVENT_NAME,
        DRAGGED_OVER_INDEX: DRAGGED_OVER_INDEX_EVENT_NAME,
        DRAGGED_LEFT: DRAGGED_LEFT_EVENT_NAME,
        DROPPED_INTO_ZONE: "droppedIntoZone",
        DROPPED_INTO_ANOTHER: "droppedIntoAnother",
        DROPPED_OUTSIDE_OF_ANY: "droppedOutsideOfAny",
        DRAG_STOPPED: "dragStopped"
    };
    const SOURCES = {
        POINTER: "pointer",
        KEYBOARD: "keyboard"
    };

    const SHADOW_ITEM_MARKER_PROPERTY_NAME = 'isDndShadowItem';
    let ITEM_ID_KEY = "id";
    let activeDndZoneCount = 0;
    function incrementActiveDropZoneCount() {activeDndZoneCount++;}
    function decrementActiveDropZoneCount() {
        if (activeDndZoneCount === 0) {
            throw new Error("Bug! trying to decrement when there are no dropzones")
        }
        activeDndZoneCount--;
    }

    const isOnServer =  (typeof window === 'undefined');

    // This is based off https://stackoverflow.com/questions/27745438/how-to-compute-getboundingclientrect-without-considering-transforms/57876601#57876601
    // It removes the transforms that are potentially applied by the flip animations
    function adjustedBoundingRect(el) {
        let ta;
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        const tx = style.transform;

        if (tx) {
            let sx, sy, dx, dy;
            if (tx.startsWith('matrix3d(')) {
                ta = tx.slice(9,-1).split(/, /);
                sx = +ta[0];
                sy = +ta[5];
                dx = +ta[12];
                dy = +ta[13];
            } else if (tx.startsWith('matrix(')) {
                ta = tx.slice(7, -1).split(/, /);
                sx = +ta[0];
                sy = +ta[3];
                dx = +ta[4];
                dy = +ta[5];
            } else {
                return rect;
            }

            const to = style.transformOrigin;
            const x = rect.x - dx - (1 - sx) * parseFloat(to);
            const y = rect.y - dy - (1 - sy) * parseFloat(to.slice(to.indexOf(' ') + 1));
            const w = sx ? rect.width / sx : el.offsetWidth;
            const h = sy ? rect.height / sy : el.offsetHeight;
            return {
                x: x, y: y, width: w, height: h, top: y, right: x + w, bottom: y + h, left: x
            };
        } else {
            return rect;
        }
    }

    /**
     * Gets the absolute bounding rect (accounts for the window's scroll position and removes transforms)
     * @param {HTMLElement} el
     * @return {{top: number, left: number, bottom: number, right: number}}
     */
    function getAbsoluteRectNoTransforms(el) {
        const rect = adjustedBoundingRect(el);
        return ({
            top: rect.top + window.scrollY,
            bottom: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            right: rect.right + window.scrollX
        });
    }

    /**
     * Gets the absolute bounding rect (accounts for the window's scroll position)
     * @param {HTMLElement} el
     * @return {{top: number, left: number, bottom: number, right: number}}
     */
    function getAbsoluteRect(el) {
        const rect = el.getBoundingClientRect();
        return ({
            top: rect.top + window.scrollY,
            bottom: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            right: rect.right + window.scrollX
        });
    }

    /**
     * finds the center :)
     * @typedef {Object} Rect
     * @property {number} top
     * @property {number} bottom
     * @property {number} left
     * @property {number} right
     * @param {Rect} rect
     * @return {{x: number, y: number}}
     */
    function findCenter(rect) {
        return ({
            x: (rect.left + rect.right) /2,
            y: (rect.top + rect.bottom) /2
        });    
    }

    /**
     * @typedef {Object} Point
     * @property {number} x
     * @property {number} y
     * @param {Point} pointA
     * @param {Point} pointB
     * @return {number}
     */
    function calcDistance(pointA, pointB) {
        return Math.sqrt(Math.pow(pointA.x - pointB.x, 2) +  Math.pow(pointA.y - pointB.y, 2));
    }

    /**
     * @param {Point} point
     * @param {Rect} rect
     * @return {boolean|boolean}
     */
    function isPointInsideRect(point, rect) {
        return (
            (point.y <= rect.bottom && point.y >= rect.top)
            &&
            (point.x >= rect.left && point.x <= rect.right)
        );
    }

    /**
     * find the absolute coordinates of the center of a dom element
     * @param el {HTMLElement}
     * @returns {{x: number, y: number}}
     */
    function findCenterOfElement(el) {
        return findCenter( getAbsoluteRect(el));
    }

    /**
     * @param {HTMLElement} elA
     * @param {HTMLElement} elB
     * @return {boolean}
     */
    function isCenterOfAInsideB(elA, elB) {
        const centerOfA = findCenterOfElement(elA);
        const rectOfB = getAbsoluteRectNoTransforms(elB);
        return isPointInsideRect(centerOfA, rectOfB);
    }

    /**
     * @param {HTMLElement|ChildNode} elA
     * @param {HTMLElement|ChildNode} elB
     * @return {number}
     */
    function calcDistanceBetweenCenters(elA, elB) {
        const centerOfA = findCenterOfElement(elA);
        const centerOfB = findCenterOfElement(elB);
        return calcDistance(centerOfA, centerOfB);
    }

    /**
     * @param {HTMLElement} el - the element to check
     * @returns {boolean} - true if the element in its entirety is off screen including the scrollable area (the normal dom events look at the mouse rather than the element)
     */
    function isElementOffDocument(el) {
        const rect = getAbsoluteRect(el);
        return rect.right < 0 || rect.left > document.documentElement.scrollWidth || rect.bottom < 0 || rect.top > document.documentElement.scrollHeight;
    }

    /**
     * If the point is inside the element returns its distances from the sides, otherwise returns null
     * @param {Point} point
     * @param {HTMLElement} el
     * @return {null|{top: number, left: number, bottom: number, right: number}}
     */
    function calcInnerDistancesBetweenPointAndSidesOfElement(point, el) {
        const rect = getAbsoluteRect(el);
        if (!isPointInsideRect(point, rect)) {
            return null;
        }
        return {
            top: point.y - rect.top,
            bottom: rect.bottom - point.y,
            left: point.x - rect.left,
            // TODO - figure out what is so special about right (why the rect is too big)
            right: Math.min(rect.right, document.documentElement.clientWidth) - point.x
        }
    }

    /**
     * @typedef {Object} Index
     * @property {number} index - the would be index
     * @property {boolean} isProximityBased - false if the element is actually over the index, true if it is not over it but this index is the closest
     */
    /**
     * Find the index for the dragged element in the list it is dragged over
     * @param {HTMLElement} floatingAboveEl 
     * @param {HTMLElement} collectionBelowEl 
     * @returns {Index|null} -  if the element is over the container the Index object otherwise null
     */
    function findWouldBeIndex(floatingAboveEl, collectionBelowEl) {
        if (!isCenterOfAInsideB(floatingAboveEl, collectionBelowEl)) {
            return null;
        }
        const children = collectionBelowEl.children;
        // the container is empty, floating element should be the first 
        if (children.length === 0) {
            return {index: 0, isProximityBased: true};
        }
        // the search could be more efficient but keeping it simple for now
        // a possible improvement: pass in the lastIndex it was found in and check there first, then expand from there
        for (let i=0; i< children.length; i++) {
            if (isCenterOfAInsideB(floatingAboveEl, children[i])) {
                return {index: i, isProximityBased: false};
            }
        }
        // this can happen if there is space around the children so the floating element has 
        //entered the container but not any of the children, in this case we will find the nearest child
        let minDistanceSoFar = Number.MAX_VALUE;
        let indexOfMin = undefined;
        // we are checking all of them because we don't know whether we are dealing with a horizontal or vertical container and where the floating element entered from
        for (let i=0; i< children.length; i++) {
            const distance = calcDistanceBetweenCenters(floatingAboveEl, children[i]);
            if (distance < minDistanceSoFar) {
                minDistanceSoFar = distance;
                indexOfMin = i;
            }
        }
        return {index: indexOfMin, isProximityBased: true};
    }

    const SCROLL_ZONE_PX = 25;

    function makeScroller() {
        let scrollingInfo;
        function resetScrolling() {
            scrollingInfo = {directionObj: undefined, stepPx: 0};
        }
        resetScrolling();
        // directionObj {x: 0|1|-1, y:0|1|-1} - 1 means down in y and right in x
        function scrollContainer(containerEl) {
            const {directionObj, stepPx} = scrollingInfo;
            if(directionObj) {
                containerEl.scrollBy(directionObj.x * stepPx, directionObj.y * stepPx);
                window.requestAnimationFrame(() => scrollContainer(containerEl));
            }
        }
        function calcScrollStepPx(distancePx) {
            return SCROLL_ZONE_PX - distancePx;
        }

        /**
         * If the pointer is next to the sides of the element to scroll, will trigger scrolling
         * Can be called repeatedly with updated pointer and elementToScroll values without issues
         * @return {boolean} - true if scrolling was needed
         */
        function scrollIfNeeded(pointer, elementToScroll) {
            if (!elementToScroll) {
                return false;
            }
            const distances = calcInnerDistancesBetweenPointAndSidesOfElement(pointer, elementToScroll);
            if (distances === null) {
                resetScrolling();
                return false;
            }
            const isAlreadyScrolling = !!scrollingInfo.directionObj;
            let [scrollingVertically, scrollingHorizontally] = [false, false];
            // vertical
            if (elementToScroll.scrollHeight > elementToScroll.clientHeight) {
                if (distances.bottom < SCROLL_ZONE_PX) {
                    scrollingVertically = true;
                    scrollingInfo.directionObj = {x:0, y:1};
                    scrollingInfo.stepPx = calcScrollStepPx(distances.bottom);
                } else if (distances.top < SCROLL_ZONE_PX) {
                    scrollingVertically = true;
                    scrollingInfo.directionObj = {x:0, y:-1};
                    scrollingInfo.stepPx = calcScrollStepPx(distances.top);
                }
                if (!isAlreadyScrolling && scrollingVertically) {
                    scrollContainer(elementToScroll);
                    return true;
                }
            }
            // horizontal
            if (elementToScroll.scrollWidth > elementToScroll.clientWidth) {
                if (distances.right < SCROLL_ZONE_PX) {
                    scrollingHorizontally = true;
                    scrollingInfo.directionObj = {x:1, y:0};
                    scrollingInfo.stepPx = calcScrollStepPx(distances.right);
                } else if (distances.left < SCROLL_ZONE_PX) {
                    scrollingHorizontally = true;
                    scrollingInfo.directionObj = {x:-1, y:0};
                    scrollingInfo.stepPx = calcScrollStepPx(distances.left);
                }
                if (!isAlreadyScrolling && scrollingHorizontally){
                    scrollContainer(elementToScroll);
                    return true;
                }
            }
            resetScrolling();
            return false;
        }

        return ({
            scrollIfNeeded,
            resetScrolling
        });
    }

    /**
     * @param {Object} object
     * @return {string}
     */
    function toString(object) {
        return JSON.stringify(object, null, 2);
    }

    /**
     * Finds the depth of the given node in the DOM tree
     * @param {HTMLElement} node
     * @return {number} - the depth of the node
     */
    function getDepth(node){
        if (!node) {
            throw new Error("cannot get depth of a falsy node");
        }
        return _getDepth(node, 0);
    }
    function _getDepth(node, countSoFar = 0) {
        if (!node.parentElement) {
            return countSoFar - 1;
        }
        return _getDepth(node.parentElement, countSoFar + 1);
    }

    /**
     * A simple util to shallow compare objects quickly, it doesn't validate the arguments so pass objects in
     * @param {Object} objA
     * @param {Object} objB
     * @return {boolean} - true if objA and objB are shallow equal
     */
    function areObjectsShallowEqual(objA, objB) {
        if (Object.keys(objA).length !== Object.keys(objB).length) {
            return false;
        }
        for (const keyA in objA) {
            if(!{}.hasOwnProperty.call(objB, keyA) || objB[keyA] !== objA[keyA]) {
                return false;
            }
        }
        return true;
    }

    const INTERVAL_MS = 200;
    const TOLERANCE_PX = 10;
    const {scrollIfNeeded, resetScrolling} = makeScroller();
    let next;


    /**
     * Tracks the dragged elements and performs the side effects when it is dragged over a drop zone (basically dispatching custom-events scrolling)
     * @param {Set<HTMLElement>} dropZones 
     * @param {HTMLElement} draggedEl 
     * @param {number} [intervalMs = INTERVAL_MS]
     */
    function observe(draggedEl, dropZones, intervalMs = INTERVAL_MS) {
        // initialization
        let lastDropZoneFound;
        let lastIndexFound;
        let lastIsDraggedInADropZone = false;
        let lastCentrePositionOfDragged;
        // We are sorting to make sure that in case of nested zones of the same type the one "on top" is considered first
        const dropZonesFromDeepToShallow = Array.from(dropZones).sort((dz1, dz2) => getDepth(dz2) - getDepth(dz1));

        /**
         * The main function in this module. Tracks where everything is/ should be a take the actions
         */
        function andNow() {
            const currentCenterOfDragged = findCenterOfElement(draggedEl);
            const scrolled = scrollIfNeeded(currentCenterOfDragged, lastDropZoneFound);
            // we only want to make a new decision after the element was moved a bit to prevent flickering
            if (!scrolled && lastCentrePositionOfDragged &&
                Math.abs(lastCentrePositionOfDragged.x - currentCenterOfDragged.x) < TOLERANCE_PX &&
                Math.abs(lastCentrePositionOfDragged.y - currentCenterOfDragged.y) < TOLERANCE_PX ) {
                next = window.setTimeout(andNow, intervalMs);
                return;
            }
            if (isElementOffDocument(draggedEl)) {
                console.debug("off document");
                dispatchDraggedLeftDocument(draggedEl);
                return;
            }

            lastCentrePositionOfDragged = currentCenterOfDragged;
            // this is a simple algorithm, potential improvement: first look at lastDropZoneFound
            let isDraggedInADropZone = false;
            for (const dz of dropZonesFromDeepToShallow) {
                const indexObj = findWouldBeIndex(draggedEl, dz);
                if (indexObj === null) {
                   // it is not inside
                   continue;     
                }
                const {index} = indexObj;
                isDraggedInADropZone = true;
                // the element is over a container
                if (dz !== lastDropZoneFound) {
                    lastDropZoneFound && dispatchDraggedElementLeftContainer(lastDropZoneFound, draggedEl);
                    dispatchDraggedElementEnteredContainer(dz, indexObj, draggedEl);
                    lastDropZoneFound = dz;
                    lastIndexFound = index;
                }
                else if (index !== lastIndexFound) {
                    dispatchDraggedElementIsOverIndex(dz, indexObj, draggedEl);
                    lastIndexFound = index;
                }
                // we handle looping with the 'continue' statement above
                break;
            }
            // the first time the dragged element is not in any dropzone we need to notify the last dropzone it was in
            if (!isDraggedInADropZone && lastIsDraggedInADropZone && lastDropZoneFound) {
                dispatchDraggedElementLeftContainer(lastDropZoneFound, draggedEl);
                lastDropZoneFound = undefined;
                lastIndexFound = undefined;
                lastIsDraggedInADropZone = false;
            } else {
                lastIsDraggedInADropZone = true;
            }
            next = window.setTimeout(andNow, intervalMs);
        }
        andNow();
    }

    // assumption - we can only observe one dragged element at a time, this could be changed in the future
    function unobserve() {
        console.debug("unobserving");
        clearTimeout(next);
        resetScrolling();
    }

    const INTERVAL_MS$1 = 300;
    let mousePosition;

    /**
     * Do not use this! it is visible for testing only until we get over the issue Cypress not triggering the mousemove listeners
     * // TODO - make private (remove export)
     * @param {{clientX: number, clientY: number}} e
     */
    function updateMousePosition(e) {
        const c = e.touches? e.touches[0] : e;
        mousePosition = {x: c.clientX, y: c.clientY};
    }
    const {scrollIfNeeded: scrollIfNeeded$1, resetScrolling: resetScrolling$1} = makeScroller();
    let next$1;

    function loop$1() {
        if (mousePosition) {
            scrollIfNeeded$1(mousePosition, document.documentElement);
        }
        next$1 = window.setTimeout(loop$1, INTERVAL_MS$1);
    }

    /**
     * will start watching the mouse pointer and scroll the window if it goes next to the edges
     */
    function armWindowScroller() {
        console.debug('arming window scroller');
        window.addEventListener('mousemove', updateMousePosition);
        window.addEventListener('touchmove', updateMousePosition);
        loop$1();
    }

    /**
     * will stop watching the mouse pointer and won't scroll the window anymore
     */
    function disarmWindowScroller() {
        console.debug('disarming window scroller');
        window.removeEventListener('mousemove', updateMousePosition);
        window.removeEventListener('touchmove', updateMousePosition);
        mousePosition = undefined;
        window.clearTimeout(next$1);
        resetScrolling$1();
    }

    const TRANSITION_DURATION_SECONDS = 0.2;

    /**
     * private helper function - creates a transition string for a property
     * @param {string} property
     * @return {string} - the transition string
     */
    function trs(property) {
        return `${property} ${TRANSITION_DURATION_SECONDS}s ease`;
    }
    /**
     * clones the given element and applies proper styles and transitions to the dragged element
     * @param {HTMLElement} originalElement
     * @return {Node} - the cloned, styled element
     */
    function createDraggedElementFrom(originalElement) {
        const rect = originalElement.getBoundingClientRect();
        const draggedEl = originalElement.cloneNode(true);
        copyStylesFromTo(originalElement, draggedEl);
        draggedEl.id = `dnd-action-dragged-el`;
        draggedEl.style.position = "fixed";
        draggedEl.style.top = `${rect.top}px`;
        draggedEl.style.left = `${rect.left}px`;
        draggedEl.style.margin = '0';
        // we can't have relative or automatic height and width or it will break the illusion
        draggedEl.style.boxSizing = 'border-box';
        draggedEl.style.height = `${rect.height}px`;
        draggedEl.style.width = `${rect.width}px`;
        draggedEl.style.transition = `${trs('width')}, ${trs('height')}, ${trs('background-color')}, ${trs('opacity')}, ${trs('color')} `;
        // this is a workaround for a strange browser bug that causes the right border to disappear when all the transitions are added at the same time
        window.setTimeout(() => draggedEl.style.transition +=`, ${trs('top')}, ${trs('left')}`,0);
        draggedEl.style.zIndex = '9999';
        draggedEl.style.cursor = 'grabbing';

        return draggedEl;
    }

    /**
     * styles the dragged element to a 'dropped' state
     * @param {HTMLElement} draggedEl
     */
    function moveDraggedElementToWasDroppedState(draggedEl) {
        draggedEl.style.cursor = 'grab';
    }

    /**
     * Morphs the dragged element style, maintains the mouse pointer within the element
     * @param {HTMLElement} draggedEl
     * @param {HTMLElement} copyFromEl - the element the dragged element should look like, typically the shadow element
     * @param {number} currentMouseX
     * @param {number} currentMouseY
     * @param {function} transformDraggedElement - function to transform the dragged element, does nothing by default.
     */
    function morphDraggedElementToBeLike(draggedEl, copyFromEl, currentMouseX, currentMouseY, transformDraggedElement) {
        const newRect = copyFromEl.getBoundingClientRect();
        const draggedElRect = draggedEl.getBoundingClientRect();
        const widthChange = newRect.width - draggedElRect.width;
        const heightChange = newRect.height - draggedElRect.height;
        if (widthChange || heightChange) {
            const relativeDistanceOfMousePointerFromDraggedSides = {
                left: (currentMouseX - draggedElRect.left) / draggedElRect.width,
                top: (currentMouseY - draggedElRect.top) / draggedElRect.height
            };
            draggedEl.style.height = `${newRect.height}px`;
            draggedEl.style.width = `${newRect.width}px`;
            draggedEl.style.left = `${parseFloat(draggedEl.style.left) - relativeDistanceOfMousePointerFromDraggedSides.left * widthChange}px`;
            draggedEl.style.top = `${parseFloat(draggedEl.style.top) - relativeDistanceOfMousePointerFromDraggedSides.top * heightChange}px`;
        }

        /// other properties
        copyStylesFromTo(copyFromEl, draggedEl);
        transformDraggedElement();
    }

    /**
     *
     * @param {HTMLElement} copyFromEl
     * @param {HTMLElement} copyToEl
     */
    function copyStylesFromTo(copyFromEl, copyToEl) {
        const computedStyle = window.getComputedStyle(copyFromEl);
        Array.from(computedStyle)
            .filter(s => s.startsWith('background') || s.startsWith('padding') || s.startsWith('font') || s.startsWith('text') || s.startsWith('align') ||
                s.startsWith('justify') || s.startsWith('display') || s.startsWith('flex') || s.startsWith('border') || s === 'opacity' || s === 'color' || s === 'list-style-type')
            .forEach(s =>
                copyToEl.style.setProperty(s, computedStyle.getPropertyValue(s), computedStyle.getPropertyPriority(s))
            );
    }

    /**
     * makes the element compatible with being draggable
     * @param {HTMLElement} draggableEl
     * @param {boolean} dragDisabled
     */
    function styleDraggable(draggableEl, dragDisabled) {
        draggableEl.draggable = false;
        draggableEl.ondragstart = () => false;
        if (!dragDisabled) {
            draggableEl.style.userSelect = 'none';
            draggableEl.style.cursor = 'grab';
        }
        else {
            draggableEl.style.userSelect = '';
            draggableEl.style.cursor = '';
        }
    }

    /**
     * Hides the provided element so that it can stay in the dom without interrupting
     * @param {HTMLElement} dragTarget
     */
    function hideOriginalDragTarget(dragTarget) {
        dragTarget.style.display = 'none';
        dragTarget.style.position = 'fixed';
        dragTarget.style.zIndex = '-5';
    }

    /**
     * styles the shadow element
     * @param {HTMLElement} shadowEl
     */
    function styleShadowEl(shadowEl) {
        shadowEl.style.visibility = "hidden";
    }

    /**
     * will mark the given dropzones as visually active
     * @param {Array<HTMLElement>} dropZones
     * @param {Function} getStyles - maps a dropzone to a styles object (so the styles can be removed)
     */
    function styleActiveDropZones(dropZones, getStyles = () => {}) {
        dropZones.forEach(dz => {
            const styles = getStyles(dz);
            Object.keys(styles).forEach(style => {
                dz.style[style] = styles[style];
            });
        });
    }

    /**
     * will remove the 'active' styling from given dropzones
     * @param {Array<HTMLElement>} dropZones
     * @param {Function} getStyles - maps a dropzone to a styles object
     */
    function styleInactiveDropZones(dropZones, getStyles = () => {}) {
        dropZones.forEach(dz => {
            const styles = getStyles(dz);
            Object.keys(styles).forEach(style => {
                dz.style[style] = '';
            });
        });
    }

    const DEFAULT_DROP_ZONE_TYPE = '--any--';
    const MIN_OBSERVATION_INTERVAL_MS = 100;
    const MIN_MOVEMENT_BEFORE_DRAG_START_PX = 3;
    const DEFAULT_DROP_TARGET_STYLE = {
        outline: 'rgba(255, 255, 102, 0.7) solid 2px',
    };

    let originalDragTarget;
    let draggedEl;
    let draggedElData;
    let draggedElType;
    let originDropZone;
    let originIndex;
    let shadowElData;
    let shadowElDropZone;
    let dragStartMousePosition;
    let currentMousePosition;
    let isWorkingOnPreviousDrag = false;
    let finalizingPreviousDrag = false;

    // a map from type to a set of drop-zones
    const typeToDropZones = new Map();
    // important - this is needed because otherwise the config that would be used for everyone is the config of the element that created the event listeners
    const dzToConfig = new Map();
    // this is needed in order to be able to cleanup old listeners and avoid stale closures issues (as the listener is defined within each zone)
    const elToMouseDownListener = new WeakMap();

    /* drop-zones registration management */
    function registerDropZone(dropZoneEl, type) {
        console.debug('registering drop-zone if absent');
        if (!typeToDropZones.has(type)) {
            typeToDropZones.set(type, new Set());
        }
        if (!typeToDropZones.get(type).has(dropZoneEl)) {
            typeToDropZones.get(type).add(dropZoneEl);
            incrementActiveDropZoneCount();
        }
    }
    function unregisterDropZone(dropZoneEl, type) {
        typeToDropZones.get(type).delete(dropZoneEl);
        decrementActiveDropZoneCount();
        if (typeToDropZones.get(type).size === 0) {
            typeToDropZones.delete(type);
        }
    }

    /* functions to manage observing the dragged element and trigger custom drag-events */
    function watchDraggedElement() {
        console.debug('watching dragged element');
        armWindowScroller();
        const dropZones = typeToDropZones.get(draggedElType);
        for (const dz of dropZones) {
            dz.addEventListener(DRAGGED_ENTERED_EVENT_NAME, handleDraggedEntered);
            dz.addEventListener(DRAGGED_LEFT_EVENT_NAME, handleDraggedLeft);
            dz.addEventListener(DRAGGED_OVER_INDEX_EVENT_NAME, handleDraggedIsOverIndex);
        }
        window.addEventListener(DRAGGED_LEFT_DOCUMENT_EVENT_NAME, handleDrop);
        // it is important that we don't have an interval that is faster than the flip duration because it can cause elements to jump bach and forth
        const observationIntervalMs = Math.max(MIN_OBSERVATION_INTERVAL_MS, ...Array.from(dropZones.keys()).map(dz => dzToConfig.get(dz).dropAnimationDurationMs));
        observe(draggedEl, dropZones, observationIntervalMs * 1.07);
    }
    function unWatchDraggedElement() {
        console.debug('unwatching dragged element');
        disarmWindowScroller();
        const dropZones = typeToDropZones.get(draggedElType);
        for (const dz of dropZones) {
            dz.removeEventListener(DRAGGED_ENTERED_EVENT_NAME, handleDraggedEntered);
            dz.removeEventListener(DRAGGED_LEFT_EVENT_NAME, handleDraggedLeft);
            dz.removeEventListener(DRAGGED_OVER_INDEX_EVENT_NAME, handleDraggedIsOverIndex);
        }
        window.removeEventListener(DRAGGED_LEFT_DOCUMENT_EVENT_NAME, handleDrop);
        unobserve();
    }

    /* custom drag-events handlers */
    function handleDraggedEntered(e) {
        console.debug('dragged entered', e.currentTarget, e.detail);
        let {items, dropFromOthersDisabled} = dzToConfig.get(e.currentTarget);
        if (dropFromOthersDisabled && e.currentTarget !== originDropZone) {
            console.debug('drop is currently disabled');
            return;
        }
        // this deals with another race condition. in rare occasions (super rapid operations) the list hasn't updated yet
        items = items.filter(i => i[ITEM_ID_KEY] !== shadowElData[ITEM_ID_KEY]);
        console.debug(`dragged entered items ${toString(items)}`);
        const {index, isProximityBased} = e.detail.indexObj;
        const shadowElIdx = (isProximityBased && index === e.currentTarget.children.length - 1)? index + 1 : index;
        shadowElDropZone = e.currentTarget;
        items.splice( shadowElIdx, 0, shadowElData);
        dispatchConsiderEvent(e.currentTarget, items, {trigger: TRIGGERS.DRAGGED_ENTERED, id: draggedElData[ITEM_ID_KEY], source: SOURCES.POINTER});
    }
    function handleDraggedLeft(e) {
        console.debug('dragged left', e.currentTarget, e.detail);
        const {items, dropFromOthersDisabled} = dzToConfig.get(e.currentTarget);
        if (dropFromOthersDisabled && e.currentTarget !== originDropZone) {
            console.debug('drop is currently disabled');
            return;
        }
        const shadowElIdx = items.findIndex(item => !!item[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
        items.splice(shadowElIdx, 1);
        shadowElDropZone = undefined;
        dispatchConsiderEvent(e.currentTarget, items, {trigger: TRIGGERS.DRAGGED_LEFT, id: draggedElData[ITEM_ID_KEY], source: SOURCES.POINTER});
    }
    function handleDraggedIsOverIndex(e) {
        console.debug('dragged is over index', e.currentTarget, e.detail);
        const {items, dropFromOthersDisabled} = dzToConfig.get(e.currentTarget);
        if (dropFromOthersDisabled && e.currentTarget !== originDropZone) {
            console.debug('drop is currently disabled');
            return;
        }
        const {index} = e.detail.indexObj;
        const shadowElIdx = items.findIndex(item => !!item[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
        items.splice(shadowElIdx, 1);
        items.splice( index, 0, shadowElData);
        dispatchConsiderEvent(e.currentTarget, items, {trigger: TRIGGERS.DRAGGED_OVER_INDEX, id: draggedElData[ITEM_ID_KEY], source: SOURCES.POINTER});
    }

    // Global mouse/touch-events handlers
    function handleMouseMove(e) {
        e.preventDefault();
        const c = e.touches? e.touches[0] : e;
        currentMousePosition = {x: c.clientX, y: c.clientY};
        draggedEl.style.transform = `translate3d(${currentMousePosition.x - dragStartMousePosition.x}px, ${currentMousePosition.y - dragStartMousePosition.y}px, 0)`;
    }

    function handleDrop() {
        console.debug('dropped');
        finalizingPreviousDrag = true;
        // cleanup
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleMouseMove);
        window.removeEventListener('mouseup', handleDrop);
        window.removeEventListener('touchend', handleDrop);
        unWatchDraggedElement();
        moveDraggedElementToWasDroppedState(draggedEl);
        let finalizeFunction;
        if (shadowElDropZone) { // it was dropped in a drop-zone
            console.debug('dropped in dz', shadowElDropZone);
            let {items, type} = dzToConfig.get(shadowElDropZone);
            styleInactiveDropZones(typeToDropZones.get(type), dz => dzToConfig.get(dz).dropTargetStyle);
            let shadowElIdx = items.findIndex(item => !!item[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
            // the handler might remove the shadow element, ex: dragula like copy on drag
            if (shadowElIdx === -1) shadowElIdx = originIndex;
            items = items.map(item => item[SHADOW_ITEM_MARKER_PROPERTY_NAME]? draggedElData : item);
            finalizeFunction = function finalizeWithinZone() {
                dispatchFinalizeEvent(shadowElDropZone, items, {trigger: TRIGGERS.DROPPED_INTO_ZONE, id: draggedElData[ITEM_ID_KEY], source: SOURCES.POINTER});
                if (shadowElDropZone !== originDropZone) {
                    // letting the origin drop zone know the element was permanently taken away
                    dispatchFinalizeEvent(originDropZone, dzToConfig.get(originDropZone).items, {trigger: TRIGGERS.DROPPED_INTO_ANOTHER, id: draggedElData[ITEM_ID_KEY], source: SOURCES.POINTER});
                }
                shadowElDropZone.children[shadowElIdx].style.visibility = '';
                cleanupPostDrop();
            };
            animateDraggedToFinalPosition(shadowElIdx, finalizeFunction);
        }
        else { // it needs to return to its place
            console.debug('no dz available');
            let {items, type} = dzToConfig.get(originDropZone);
            styleInactiveDropZones(typeToDropZones.get(type), dz => dzToConfig.get(dz).dropTargetStyle);
            items.splice(originIndex, 0, shadowElData);
            shadowElDropZone = originDropZone;
            dispatchConsiderEvent(originDropZone, items, {trigger: TRIGGERS.DROPPED_OUTSIDE_OF_ANY, id: draggedElData[ITEM_ID_KEY], source: SOURCES.POINTER});
            finalizeFunction = function finalizeBackToOrigin() {
                const finalItems = [...items];
                finalItems.splice(originIndex, 1, draggedElData);
                dispatchFinalizeEvent(originDropZone, finalItems, {trigger: TRIGGERS.DROPPED_OUTSIDE_OF_ANY, id: draggedElData[ITEM_ID_KEY], source: SOURCES.POINTER});
                shadowElDropZone.children[originIndex].style.visibility = '';
                cleanupPostDrop();
            };
            window.setTimeout(() => animateDraggedToFinalPosition(originIndex, finalizeFunction), 0);
        }
    }

    // helper function for handleDrop
    function animateDraggedToFinalPosition(shadowElIdx, callback) {
        const shadowElRect = shadowElDropZone.children[shadowElIdx].getBoundingClientRect();
        const newTransform = {
            x: shadowElRect.left - parseFloat(draggedEl.style.left),
            y: shadowElRect.top - parseFloat(draggedEl.style.top)
        };
        const {dropAnimationDurationMs} = dzToConfig.get(shadowElDropZone);
        const transition = `transform ${dropAnimationDurationMs}ms ease`;
        draggedEl.style.transition = draggedEl.style.transition? draggedEl.style.transition + "," + transition : transition;
        draggedEl.style.transform = `translate3d(${newTransform.x}px, ${newTransform.y}px, 0)`;
        window.setTimeout(callback, dropAnimationDurationMs);
    }

    /* cleanup */
    function cleanupPostDrop() {
        draggedEl.remove();
        originalDragTarget.remove();
        draggedEl = undefined;
        originalDragTarget = undefined;
        draggedElData = undefined;
        draggedElType = undefined;
        originDropZone = undefined;
        originIndex = undefined;
        shadowElData = undefined;
        shadowElDropZone = undefined;
        dragStartMousePosition = undefined;
        currentMousePosition = undefined;
        isWorkingOnPreviousDrag = false;
        finalizingPreviousDrag = false;
    }

    function dndzone(node, options) {
        const config =  {
            items: undefined,
            type: undefined,
            flipDurationMs: 0,
            dragDisabled: false,
            dropFromOthersDisabled: false,
            dropTargetStyle: DEFAULT_DROP_TARGET_STYLE,
            transformDraggedElement : () => {}
        };
        console.debug(`dndzone good to go options: ${toString(options)}, config: ${toString(config)}`, {node});
        let elToIdx = new Map();

        function addMaybeListeners() {
            window.addEventListener('mousemove', handleMouseMoveMaybeDragStart, {passive: false});
            window.addEventListener('touchmove', handleMouseMoveMaybeDragStart, {passive: false, capture: false});
            window.addEventListener('mouseup', handleFalseAlarm, {passive: false});
            window.addEventListener('touchend', handleFalseAlarm, {passive: false});
        }
        function removeMaybeListeners() {
            window.removeEventListener('mousemove', handleMouseMoveMaybeDragStart);
            window.removeEventListener('touchmove', handleMouseMoveMaybeDragStart);
            window.removeEventListener('mouseup', handleFalseAlarm);
            window.removeEventListener('touchend', handleFalseAlarm);
        }
        function handleFalseAlarm() {
            removeMaybeListeners();
            originalDragTarget = undefined;
            dragStartMousePosition = undefined;
            currentMousePosition = undefined;
        }

        function handleMouseMoveMaybeDragStart(e) {
            e.preventDefault();
            const c = e.touches? e.touches[0] : e;
            currentMousePosition = {x: c.clientX, y: c.clientY};
            if (Math.abs(currentMousePosition.x - dragStartMousePosition.x) >= MIN_MOVEMENT_BEFORE_DRAG_START_PX || Math.abs(currentMousePosition.y - dragStartMousePosition.y) >= MIN_MOVEMENT_BEFORE_DRAG_START_PX) {
                removeMaybeListeners();
                handleDragStart();
            }
        }
        function handleMouseDown(e) {
            // prevents responding to any button but left click which equals 0 (which is falsy)
            if (e.button) {
                console.debug(`ignoring none left click button: ${e.button}`);
                return;
            }
            if (isWorkingOnPreviousDrag) {
                console.debug('cannot start a new drag before finalizing previous one');
                return;
            }
            e.stopPropagation();
            const c = e.touches? e.touches[0] : e;
            dragStartMousePosition = {x: c.clientX, y:c.clientY};
            currentMousePosition = {...dragStartMousePosition};
            originalDragTarget = e.currentTarget;
            addMaybeListeners();
        }

        function handleDragStart() {
            console.debug(`drag start config: ${toString(config)}`, originalDragTarget);
            isWorkingOnPreviousDrag = true;

            // initialising globals
            const currentIdx = elToIdx.get(originalDragTarget);
            originIndex = currentIdx;
            originDropZone = originalDragTarget.parentElement;
            const {items, type} = config;
            draggedElData = {...items[currentIdx]};
            draggedElType = type;
            shadowElData = {...draggedElData, [SHADOW_ITEM_MARKER_PROPERTY_NAME]: true};

            // creating the draggable element
            draggedEl = createDraggedElementFrom(originalDragTarget);
            // We will keep the original dom node in the dom because touch events keep firing on it, we want to re-add it after the framework removes it
            function keepOriginalElementInDom() {
                const {items: itemsNow} = config;
                if (!draggedEl.parentElement && (!itemsNow[originIndex] || draggedElData[ITEM_ID_KEY] !== itemsNow[originIndex][ITEM_ID_KEY])) {
                    document.body.appendChild(draggedEl);
                    // to prevent the outline from disappearing
                    draggedEl.focus();
                    watchDraggedElement();
                    hideOriginalDragTarget(originalDragTarget);
                    document.body.appendChild(originalDragTarget);
                } else {
                    window.requestAnimationFrame(keepOriginalElementInDom);
                }
            }
            window.requestAnimationFrame(keepOriginalElementInDom);

            styleActiveDropZones(
                Array.from(typeToDropZones.get(config.type))
                    .filter(dz => dz === originDropZone || !dzToConfig.get(dz).dropFromOthersDisabled),
                dz => dzToConfig.get(dz).dropTargetStyle,
            );

            // removing the original element by removing its data entry
            items.splice(currentIdx, 1);
            dispatchConsiderEvent(originDropZone, items, {trigger: TRIGGERS.DRAG_STARTED, id: draggedElData[ITEM_ID_KEY], source: SOURCES.POINTER});

            // handing over to global handlers - starting to watch the element
            window.addEventListener('mousemove', handleMouseMove, {passive: false});
            window.addEventListener('touchmove', handleMouseMove, {passive: false, capture: false});
            window.addEventListener('mouseup', handleDrop, {passive: false});
            window.addEventListener('touchend', handleDrop, {passive: false});
        }

        function configure({
                               items = undefined,
                               flipDurationMs:dropAnimationDurationMs = 0,
                               type: newType = DEFAULT_DROP_ZONE_TYPE,
                               dragDisabled = false,
                               dropFromOthersDisabled = false,
                               dropTargetStyle = DEFAULT_DROP_TARGET_STYLE,
                               transformDraggedElement = () => {},
                           }) {
            config.dropAnimationDurationMs = dropAnimationDurationMs;
            if (config.type && newType !== config.type) {
                unregisterDropZone(node, config.type);
            }
            config.type = newType;
            registerDropZone(node, newType);

            config.items = [...items];
            config.dragDisabled = dragDisabled;
            config.transformDraggedElement = transformDraggedElement;

            // realtime update for dropTargetStyle
            if (isWorkingOnPreviousDrag && !finalizingPreviousDrag && !areObjectsShallowEqual(dropTargetStyle, config.dropTargetStyle)) {
                styleInactiveDropZones([node], () => config.dropTargetStyle);
                styleActiveDropZones([node], () => dropTargetStyle);
            }
            config.dropTargetStyle = dropTargetStyle;

            // realtime update for dropFromOthersDisabled
            if (isWorkingOnPreviousDrag && config.dropFromOthersDisabled !== dropFromOthersDisabled) {
                if (dropFromOthersDisabled) {
                    styleInactiveDropZones([node], dz => dzToConfig.get(dz).dropTargetStyle);
                } else {
                    styleActiveDropZones([node], dz => dzToConfig.get(dz).dropTargetStyle);
                }
            }
            config.dropFromOthersDisabled = dropFromOthersDisabled;

            dzToConfig.set(node, config);
            for (let idx = 0; idx < node.children.length; idx++) {
                const draggableEl = node.children[idx];
                styleDraggable(draggableEl, dragDisabled);
                if (config.items[idx][SHADOW_ITEM_MARKER_PROPERTY_NAME]) {
                    morphDraggedElementToBeLike(draggedEl, draggableEl, currentMousePosition.x, currentMousePosition.y, () => config.transformDraggedElement(draggedEl, draggedElData, idx));
                    styleShadowEl(draggableEl);
                    continue;
                }
                draggableEl.removeEventListener('mousedown', elToMouseDownListener.get(draggableEl));
                draggableEl.removeEventListener('touchstart', elToMouseDownListener.get(draggableEl));
                if (!dragDisabled) {
                    draggableEl.addEventListener('mousedown', handleMouseDown);
                    draggableEl.addEventListener('touchstart', handleMouseDown);
                    elToMouseDownListener.set(draggableEl, handleMouseDown);
                }
                // updating the idx
                elToIdx.set(draggableEl, idx);
            }
        }
        configure(options);

        return ({
            update: (newOptions) => {
                console.debug(`pointer dndzone will update newOptions: ${toString(newOptions)}`);
                configure(newOptions);
            },
            destroy: () => {
                console.debug("pointer dndzone will destroy");
                unregisterDropZone(node, config.type);
                dzToConfig.delete(node);
            }
        });
    }

    const INSTRUCTION_IDs = {
        DND_ZONE_ACTIVE: 'dnd-zone-active',
        DND_ZONE_DRAG_DISABLED: 'dnd-zone-drag-disabled'
    };
    const ID_TO_INSTRUCTION = {
        [INSTRUCTION_IDs.DND_ZONE_ACTIVE]: "Tab to one the items and press space-bar or enter to start dragging it",
        [INSTRUCTION_IDs.DND_ZONE_DRAG_DISABLED]: "This is a disabled drag and drop list"
    };

    const ALERT_DIV_ID = 'dnd-action-aria-alert';
    let alertsDiv;
    /**
     * Initializes the static aria instructions so they can be attached to zones
     * @return {{DND_ZONE_ACTIVE: string, DND_ZONE_DRAG_DISABLED: string} | null} - the IDs for static aria instruction (to be used via aria-describedby) or null on the server
     */
    function initAria() {
        if (isOnServer) return null;

        // setting the dynamic alerts
        alertsDiv = document.createElement('div');
        (function initAlertsDiv() {
            alertsDiv.id = ALERT_DIV_ID;
            // tab index -1 makes the alert be read twice on chrome for some reason
            //alertsDiv.tabIndex = -1;
            alertsDiv.style.position = 'fixed';
            alertsDiv.style.bottom = '0';
            alertsDiv.style.left = '0';
            alertsDiv.style.zIndex = '-5';
            alertsDiv.style.opacity = '0';
            alertsDiv.style.height = '0';
            alertsDiv.style.width = '0';
            alertsDiv.setAttribute("role", "alert");
        })();
        document.body.prepend(alertsDiv);

        // setting the instructions
        Object.entries(ID_TO_INSTRUCTION).forEach(([id, txt]) =>  document.body.prepend(instructionToHiddenDiv(id, txt)));
        return {...INSTRUCTION_IDs};
    }
    function instructionToHiddenDiv(id, txt) {
        const div = document.createElement('div');
        div.id = id;
        div.innerHTML = `<p>${txt}</p>`;
        div.style.display = 'none';
        div.style.position = 'fixed';
        div.style.zIndex = '-5';
        return div;
    }

    /**
     * Will make the screen reader alert the provided text to the user
     * @param {string} txt
     */
    function alertToScreenReader(txt) {
        alertsDiv.innerHTML = '';
        const alertText = document.createTextNode(txt);
        alertsDiv.appendChild(alertText);
        // this is needed for Safari
        alertsDiv.style.display = 'none';
        alertsDiv.style.display = 'inline';
    }

    const DEFAULT_DROP_ZONE_TYPE$1 = '--any--';
    const DEFAULT_DROP_TARGET_STYLE$1 = {
        outline: 'rgba(255, 255, 102, 0.7) solid 2px',
    };

    let isDragging = false;
    let draggedItemType;
    let focusedDz;
    let focusedDzLabel = "";
    let focusedItem;
    let focusedItemId;
    let focusedItemLabel = "";
    const allDragTargets = new WeakSet();
    const elToKeyDownListeners = new WeakMap();
    const elToFocusListeners = new WeakMap();
    const dzToHandles = new Map();
    const dzToConfig$1 = new Map();
    const typeToDropZones$1 = new Map();

    /* TODO (potentially)
    * what's the deal with the black border of voice-reader not following focus?
    * maybe keep focus on the last dragged item upon drop?
     */

    const INSTRUCTION_IDs$1 = initAria();

    /* drop-zones registration management */
    function registerDropZone$1(dropZoneEl, type) {
        console.debug('registering drop-zone if absent');
        if (typeToDropZones$1.size === 0) {
          console.debug("adding global keydown and click handlers");
          window.addEventListener("keydown", globalKeyDownHandler);
          window.addEventListener('click', globalClickHandler);
        }
        if (!typeToDropZones$1.has(type)) {
            typeToDropZones$1.set(type, new Set());
        }
        if (!typeToDropZones$1.get(type).has(dropZoneEl)) {
            typeToDropZones$1.get(type).add(dropZoneEl);
            incrementActiveDropZoneCount();
        }
    }
    function unregisterDropZone$1(dropZoneEl, type) {
        console.debug('unregistering drop-zone');
        typeToDropZones$1.get(type).delete(dropZoneEl);
        decrementActiveDropZoneCount();
        if (typeToDropZones$1.get(type).size === 0) {
            typeToDropZones$1.delete(type);
        }
        if (typeToDropZones$1.size === 0) {
            console.debug("removing global keydown and click handlers");
            window.removeEventListener("keydown", globalKeyDownHandler);
            window.removeEventListener('click', globalClickHandler);
        }
    }

    function globalKeyDownHandler(e) {
        if (!isDragging) return;
        switch(e.key) {
            case("Escape"): {
                handleDrop$1();
                break;
            }
        }
    }

    function globalClickHandler() {
        if (!isDragging) return ;
        if (!allDragTargets.has(document.activeElement)) {
            console.debug("clicked outside of any draggable");
            handleDrop$1();
        }
    }

    function handleZoneFocus(e) {
        console.debug("zone focus");
        if (!isDragging) return;
        const newlyFocusedDz = e.currentTarget;
        if (newlyFocusedDz === focusedDz) return;

        focusedDzLabel = newlyFocusedDz.getAttribute('aria-label') || '';
        const {items:originItems} = dzToConfig$1.get(focusedDz);
        const originItem = originItems.find(item => item[ITEM_ID_KEY] === focusedItemId);
        const originIdx = originItems.indexOf(originItem);
        const itemToMove = originItems.splice(originIdx, 1)[0];
        const {items:targetItems, autoAriaDisabled} = dzToConfig$1.get(newlyFocusedDz);
        if (newlyFocusedDz.getBoundingClientRect().top < focusedDz.getBoundingClientRect().top || newlyFocusedDz.getBoundingClientRect().left < focusedDz.getBoundingClientRect().left) {
            targetItems.push(itemToMove);
            if (!autoAriaDisabled) {
                alertToScreenReader(`Moved item ${focusedItemLabel} to the end of the list ${focusedDzLabel}`);
            }
        } else {
            targetItems.unshift(itemToMove);
            if (!autoAriaDisabled) {
                alertToScreenReader(`Moved item ${focusedItemLabel} to the beginning of the list ${focusedDzLabel}`);
            }
        }
        const dzFrom = focusedDz;
        dispatchFinalizeEvent(dzFrom, originItems, {trigger: TRIGGERS.DROPPED_INTO_ANOTHER, id: focusedItemId, source: SOURCES.KEYBOARD});
        dispatchFinalizeEvent(newlyFocusedDz, targetItems, {trigger: TRIGGERS.DROPPED_INTO_ZONE, id: focusedItemId, source: SOURCES.KEYBOARD});
        focusedDz = newlyFocusedDz;
    }

    function triggerAllDzsUpdate() {
        dzToHandles.forEach(({update}, dz) => update(dzToConfig$1.get(dz)));
    }

    function handleDrop$1(dispatchConsider = true) {
        console.debug("drop");
        if (!dzToConfig$1.get(focusedDz).autoAriaDisabled) {
            alertToScreenReader(`Stopped dragging item ${focusedItemLabel}`);
        }
        if (allDragTargets.has(document.activeElement)) {
            document.activeElement.blur();
        }
        if (dispatchConsider) {
            dispatchConsiderEvent(focusedDz, dzToConfig$1.get(focusedDz).items, {trigger: TRIGGERS.DRAG_STOPPED, id: focusedItemId, source: SOURCES.KEYBOARD});
        }
        styleInactiveDropZones(typeToDropZones$1.get(draggedItemType), dz => dzToConfig$1.get(dz).dropTargetStyle);
        focusedItem = null;
        focusedItemId = null;
        focusedItemLabel = '';
        draggedItemType = null;
        focusedDz = null;
        focusedDzLabel = '';
        isDragging = false;
        triggerAllDzsUpdate();
    }
    //////
    function dndzone$1(node, options) {
        const config =  {
            items: undefined,
            type: undefined,
            dragDisabled: false,
            dropFromOthersDisabled: false,
            dropTargetStyle: DEFAULT_DROP_TARGET_STYLE$1,
            autoAriaDisabled: false
        };

        function swap (arr, i, j) {
            if (arr.length <= 1) return;
            arr.splice(j, 1, arr.splice(i, 1, arr[j])[0]);
        }

        function handleKeyDown(e) {
            console.debug("handling key down", e.key);
            switch(e.key) {
                case("Enter"):
                case(" "): {
                    // we don't want to affect nested input elements
                    if ((e.target.value !== undefined || e.target.isContentEditable) && !allDragTargets.has(e.target)) {
                        return;
                    }
                    e.preventDefault(); // preventing scrolling on spacebar
                    e.stopPropagation();
                    if (isDragging) {
                        // TODO - should this trigger a drop? only here or in general (as in when hitting space or enter outside of any zone)?
                        handleDrop$1();
                    } else {
                        // drag start
                        handleDragStart(e);
                    }
                    break;
                }
                case("ArrowDown"):
                case("ArrowRight"):{
                    if (!isDragging) return;
                    e.preventDefault(); // prevent scrolling
                    e.stopPropagation();
                    const {items} = dzToConfig$1.get(node);
                    const children = Array.from(node.children);
                    const idx = children.indexOf(e.currentTarget);
                    console.debug("arrow down", idx);
                    if (idx < children.length - 1) {
                        if (!config.autoAriaDisabled) {
                            alertToScreenReader(`Moved item ${focusedItemLabel} to position ${idx + 2} in the list ${focusedDzLabel}`);
                        }
                        swap(items, idx, idx + 1);
                        dispatchFinalizeEvent(node, items, {trigger: TRIGGERS.DROPPED_INTO_ZONE, id: focusedItemId, source: SOURCES.KEYBOARD});
                    }
                    break;
                }
                case("ArrowUp"):
                case("ArrowLeft"):{
                    if (!isDragging) return;
                    e.preventDefault(); // prevent scrolling
                    e.stopPropagation();
                    const {items} = dzToConfig$1.get(node);
                    const children = Array.from(node.children);
                    const idx = children.indexOf(e.currentTarget);
                    console.debug("arrow up", idx);
                    if (idx > 0) {
                        if (!config.autoAriaDisabled) {
                            alertToScreenReader(`Moved item ${focusedItemLabel} to position ${idx} in the list ${focusedDzLabel}`);
                        }
                        swap(items, idx, idx - 1);
                        dispatchFinalizeEvent(node, items, {trigger: TRIGGERS.DROPPED_INTO_ZONE, id: focusedItemId, source: SOURCES.KEYBOARD});
                    }
                    break;
                }
            }
        }
        function handleDragStart(e) {
            console.debug("drag start");
            if (!config.autoAriaDisabled) {
                alertToScreenReader(`Started dragging item ${focusedItemLabel}. Use the arrow keys to move it within its list ${focusedDzLabel}, or tab to another list in order to move the item into it`);
            }
            setCurrentFocusedItem(e.currentTarget);
            focusedDz = node;
            draggedItemType = config.type;
            isDragging = true;
            styleActiveDropZones(
                Array.from(typeToDropZones$1.get(config.type))
                    .filter(dz => dz === focusedDz || !dzToConfig$1.get(dz).dropFromOthersDisabled),
                dz => dzToConfig$1.get(dz).dropTargetStyle,
            );
            dispatchConsiderEvent(node, dzToConfig$1.get(node).items, {trigger: TRIGGERS.DRAG_STARTED, id: focusedItemId, source: SOURCES.KEYBOARD});
            triggerAllDzsUpdate();
        }

        function handleClick(e) {
            if(!isDragging) return;
            if (e.currentTarget === focusedItem) return;
            e.stopPropagation();
            handleDrop$1(false);
            handleDragStart(e);
        }
        function setCurrentFocusedItem(draggableEl) {
            const {items} = dzToConfig$1.get(node);
            const children = Array.from(node.children);
            const focusedItemIdx = children.indexOf(draggableEl);
            focusedItem = draggableEl;
            focusedItemId = items[focusedItemIdx][ITEM_ID_KEY];
            focusedItemLabel = children[focusedItemIdx].getAttribute('aria-label') || '';
        }

        function configure({
                            items = [],
                            type: newType = DEFAULT_DROP_ZONE_TYPE$1,
                            dragDisabled = false,
                            dropFromOthersDisabled = false,
                            dropTargetStyle = DEFAULT_DROP_TARGET_STYLE$1,
                            autoAriaDisabled = false
                        }) {
            config.items = [...items];
            config.dragDisabled = dragDisabled;
            config.dropFromOthersDisabled = dropFromOthersDisabled;
            config.dropTargetStyle = dropTargetStyle;
            config.autoAriaDisabled = autoAriaDisabled;
            if (!autoAriaDisabled) {
                node.setAttribute("aria-disabled", dragDisabled);
                node.setAttribute("role", "list");
                node.setAttribute("aria-describedby", dragDisabled? INSTRUCTION_IDs$1.DND_ZONE_DRAG_DISABLED : INSTRUCTION_IDs$1.DND_ZONE_ACTIVE);
            }
            if (config.type && newType !== config.type) {
                unregisterDropZone$1(node, config.type);
            }
            config.type = newType;
            registerDropZone$1(node, newType);
            dzToConfig$1.set(node, config);

            node.tabIndex = isDragging && (node === focusedDz || focusedItem.contains(node) || config.dropFromOthersDisabled || (focusedDz && config.type !== dzToConfig$1.get(focusedDz).type)) ? -1 : 0;
            node.addEventListener('focus', handleZoneFocus);

            for (let i = 0; i < node.children.length ; i++) {
                const draggableEl = node.children[i];
                allDragTargets.add(draggableEl);
                draggableEl.tabIndex = (isDragging) ? -1 : 0;
                if (!autoAriaDisabled) {
                    draggableEl.setAttribute("role", "listitem");
                }
                draggableEl.removeEventListener("keydown", elToKeyDownListeners.get(draggableEl));
                draggableEl.removeEventListener("click", elToFocusListeners.get(draggableEl));
                if (!dragDisabled) {
                    draggableEl.addEventListener("keydown", handleKeyDown);
                    elToKeyDownListeners.set(draggableEl, handleKeyDown);
                    draggableEl.addEventListener("click", handleClick);
                    elToFocusListeners.set(draggableEl, handleClick);
                }
                if (isDragging && config.items[i][ITEM_ID_KEY] === focusedItemId) {
                    console.debug("focusing on", {i, focusedItemId});
                    // if it is a nested dropzone, it was re-rendered and we need to refresh our pointer
                    focusedItem = draggableEl;
                    // without this the element loses focus if it moves backwards in the list
                    draggableEl.focus();
                }
            }
        }
        configure(options);

        const handles = {
            update: (newOptions) => {
                console.debug(`keyboard dndzone will update newOptions: ${toString(newOptions)}`);
                configure(newOptions);
            },
            destroy: () => {
                console.debug("keyboard dndzone will destroy");
                unregisterDropZone$1(node, config.type);
                dzToConfig$1.delete(node);
                dzToHandles.delete(node);
            }
        };
        dzToHandles.set(node, handles);
        return handles;
    }

    /**
     * A custom action to turn any container to a dnd zone and all of its direct children to draggables
     * Supports mouse, touch and keyboard interactions.
     * Dispatches two events that the container is expected to react to by modifying its list of items,
     * which will then feed back in to this action via the update function
     *
     * @typedef {Object} Options
     * @property {Array} items - the list of items that was used to generate the children of the given node (the list used in the #each block
     * @property {string} [type] - the type of the dnd zone. children dragged from here can only be dropped in other zones of the same type, default to a base type
     * @property {number} [flipDurationMs] - if the list animated using flip (recommended), specifies the flip duration such that everything syncs with it without conflict, defaults to zero
     * @property {boolean} [dragDisabled]
     * @property {boolean} [dropFromOthersDisabled]
     * @property {Object} [dropTargetStyle]
     * @property {Function} [transformDraggedElement]
     * @param {HTMLElement} node - the element to enhance
     * @param {Options} options
     * @return {{update: function, destroy: function}}
     */
    function dndzone$2(node, options) {
        validateOptions(options);
        const pointerZone = dndzone(node, options);
        const keyboardZone = dndzone$1(node, options);
        return {
            update: newOptions => {
                validateOptions(newOptions);
                pointerZone.update(newOptions);
                keyboardZone.update(newOptions);
            },
            destroy: () => {
                pointerZone.destroy();
                keyboardZone.destroy();
            }
        }
    }

    function validateOptions(options) {
        /*eslint-disable*/
        const {
            items,
            flipDurationMs,
            type,
            dragDisabled,
            dropFromOthersDisabled,
            dropTargetStyle,
            transformDraggedElement,
            autoAriaDisabled,
            ...rest
        } = options;
        /*eslint-enable*/
        if (Object.keys(rest).length > 0) {
            console.warn(`dndzone will ignore unknown options`, rest);
        }
        if (!items) {
            throw new Error("no 'items' key provided to dndzone");
        }
        const itemWithMissingId = items.find(item => !{}.hasOwnProperty.call(item, ITEM_ID_KEY));
        if (itemWithMissingId) {
            throw new Error(`missing '${ITEM_ID_KEY}' property for item ${toString(itemWithMissingId)}`);
        }
    }

    /* src\components\Card\Card.svelte generated by Svelte v3.29.4 */

    const file = "src\\components\\Card\\Card.svelte";

    // (264:0) {:else}
    function create_else_block_1(ctx) {
    	let div;
    	let div_class_value;
    	let div_cardid_value;
    	let mounted;
    	let dispose;

    	function select_block_type_2(ctx, dirty) {
    		if (/*cardPapa*/ ctx[1] !== "hand2") return create_if_block_3;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", div_class_value = "spell card papa-" + /*cardPapa*/ ctx[1] + " high-light" + " svelte-6tdjsw");
    			attr_dev(div, "cardid", div_cardid_value = /*card*/ ctx[0].id);
    			add_location(div, file, 264, 1, 4812);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);

    			if (!mounted) {
    				dispose = listen_dev(div, "mousedown", downHandler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}

    			if (dirty & /*cardPapa*/ 2 && div_class_value !== (div_class_value = "spell card papa-" + /*cardPapa*/ ctx[1] + " high-light" + " svelte-6tdjsw")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty & /*card*/ 1 && div_cardid_value !== (div_cardid_value = /*card*/ ctx[0].id)) {
    				attr_dev(div, "cardid", div_cardid_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(264:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (229:0) {#if card.type === 'minion'}
    function create_if_block(ctx) {
    	let div;
    	let div_class_value;
    	let div_cardid_value;
    	let mounted;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (/*cardPapa*/ ctx[1] !== "hand2") return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", div_class_value = "card papa-" + /*cardPapa*/ ctx[1] + " high-light" + " svelte-6tdjsw");
    			attr_dev(div, "cardid", div_cardid_value = /*card*/ ctx[0].id);
    			set_style(div, "background-color", /*card*/ ctx[0].imgPath);
    			add_location(div, file, 229, 1, 3879);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);

    			if (!mounted) {
    				dispose = listen_dev(div, "mousedown", downHandler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}

    			if (dirty & /*cardPapa*/ 2 && div_class_value !== (div_class_value = "card papa-" + /*cardPapa*/ ctx[1] + " high-light" + " svelte-6tdjsw")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty & /*card*/ 1 && div_cardid_value !== (div_cardid_value = /*card*/ ctx[0].id)) {
    				attr_dev(div, "cardid", div_cardid_value);
    			}

    			if (dirty & /*card*/ 1) {
    				set_style(div, "background-color", /*card*/ ctx[0].imgPath);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(229:0) {#if card.type === 'minion'}",
    		ctx
    	});

    	return block;
    }

    // (281:2) {:else}
    function create_else_block_2(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "cardBack svelte-6tdjsw");
    			add_location(div0, file, 282, 4, 5327);
    			attr_dev(div1, "class", "cardBack-container");
    			add_location(div1, file, 281, 3, 5289);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(281:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (269:2) {#if cardPapa !== 'hand2'}
    function create_if_block_3(ctx) {
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			div1.textContent = "lorem ipsum dolem forum marius saurisus.";
    			attr_dev(img, "class", "cardImg svelte-6tdjsw");
    			if (img.src !== (img_src_value = "./images/nethergrasp.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "a eeeviiil card");
    			add_location(img, file, 273, 4, 5091);
    			attr_dev(div0, "class", "imgContainer svelte-6tdjsw");
    			set_style(div0, "background-color", /*card*/ ctx[0].imgPath);
    			add_location(div0, file, 269, 3, 4951);
    			attr_dev(div1, "class", "cardText svelte-6tdjsw");
    			add_location(div1, file, 279, 3, 5205);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, img);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*card*/ 1) {
    				set_style(div0, "background-color", /*card*/ ctx[0].imgPath);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(269:2) {#if cardPapa !== 'hand2'}",
    		ctx
    	});

    	return block;
    }

    // (258:2) {:else}
    function create_else_block(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "cardBack svelte-6tdjsw");
    			add_location(div0, file, 259, 4, 4747);
    			attr_dev(div1, "class", "cardBack-container");
    			add_location(div1, file, 258, 3, 4709);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(258:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (235:2) {#if cardPapa !== 'hand2'}
    function create_if_block_1(ctx) {
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div4;
    	let div3;
    	let div1;
    	let p0;
    	let t1_value = /*card*/ ctx[0].tempStats.atk + "";
    	let t1;
    	let t2;
    	let div2;
    	let p1;
    	let t3_value = /*card*/ ctx[0].tempStats.health + "";
    	let t3;
    	let t4;
    	let if_block = /*cardPapa*/ ctx[1] !== "board" && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			p0 = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			div2 = element("div");
    			p1 = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			if (if_block) if_block.c();
    			attr_dev(img, "class", "cardImg svelte-6tdjsw");
    			if (img.src !== (img_src_value = /*card*/ ctx[0].imgPath)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "a eeeviiil card");
    			add_location(img, file, 239, 4, 4195);
    			attr_dev(div0, "class", "imgContainer svelte-6tdjsw");
    			set_style(div0, "background-color", /*card*/ ctx[0].imgPath);
    			add_location(div0, file, 235, 3, 4055);
    			attr_dev(p0, "class", "statItem svelte-6tdjsw");
    			add_location(p0, file, 245, 6, 4372);
    			attr_dev(div1, "class", "atk stat svelte-6tdjsw");
    			add_location(div1, file, 244, 5, 4342);
    			attr_dev(p1, "class", "statItem svelte-6tdjsw");
    			add_location(p1, file, 248, 6, 4466);
    			attr_dev(div2, "class", "def stat svelte-6tdjsw");
    			add_location(div2, file, 247, 5, 4436);
    			attr_dev(div3, "class", "info__stats svelte-6tdjsw");
    			add_location(div3, file, 243, 4, 4310);
    			attr_dev(div4, "class", "infoContainer svelte-6tdjsw");
    			add_location(div4, file, 242, 3, 4277);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, img);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, p0);
    			append_dev(p0, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, p1);
    			append_dev(p1, t3);
    			append_dev(div3, t4);
    			if (if_block) if_block.m(div3, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*card*/ 1 && img.src !== (img_src_value = /*card*/ ctx[0].imgPath)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*card*/ 1) {
    				set_style(div0, "background-color", /*card*/ ctx[0].imgPath);
    			}

    			if (dirty & /*card*/ 1 && t1_value !== (t1_value = /*card*/ ctx[0].tempStats.atk + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*card*/ 1 && t3_value !== (t3_value = /*card*/ ctx[0].tempStats.health + "")) set_data_dev(t3, t3_value);

    			if (/*cardPapa*/ ctx[1] !== "board") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(div3, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div4);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(235:2) {#if cardPapa !== 'hand2'}",
    		ctx
    	});

    	return block;
    }

    // (251:5) {#if cardPapa !== 'board'}
    function create_if_block_2(ctx) {
    	let div;
    	let p;
    	let t_value = /*card*/ ctx[0].tempStats.cost + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "statItem svelte-6tdjsw");
    			add_location(p, file, 252, 7, 4599);
    			attr_dev(div, "class", "cost stat svelte-6tdjsw");
    			add_location(div, file, 251, 6, 4567);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*card*/ 1 && t_value !== (t_value = /*card*/ ctx[0].tempStats.cost + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(251:5) {#if cardPapa !== 'board'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*card*/ ctx[0].type === "minion") return create_if_block;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function downHandler(e) {
    	e.preventDefault();
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Card", slots, []);
    	let { card } = $$props;
    	let { cardPapa } = $$props;
    	const writable_props = ["card", "cardPapa"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("card" in $$props) $$invalidate(0, card = $$props.card);
    		if ("cardPapa" in $$props) $$invalidate(1, cardPapa = $$props.cardPapa);
    	};

    	$$self.$capture_state = () => ({ card, cardPapa, downHandler });

    	$$self.$inject_state = $$props => {
    		if ("card" in $$props) $$invalidate(0, card = $$props.card);
    		if ("cardPapa" in $$props) $$invalidate(1, cardPapa = $$props.cardPapa);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [card, cardPapa];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { card: 0, cardPapa: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*card*/ ctx[0] === undefined && !("card" in props)) {
    			console.warn("<Card> was created without expected prop 'card'");
    		}

    		if (/*cardPapa*/ ctx[1] === undefined && !("cardPapa" in props)) {
    			console.warn("<Card> was created without expected prop 'cardPapa'");
    		}
    	}

    	get card() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set card(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cardPapa() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cardPapa(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const userGraveyard = writable([]);
    const opponentGraveyard = writable([]);

    const addCardToUserGraveyard = (card) => {
        userGraveyard.update(grave => [...grave, card]);
    };

    const addCardToOpponentGraveyard = (card) => {
        opponentGraveyard.update(grave => [...grave, card]);
    };

    const setUserGraveyard = (newGrave) => {
        userGraveyard.update(grave => [...newGrave]);
    };
    const setOpponentGraveyard = (newGrave) => {
        opponentGraveyard.update(grave => [...newGrave]);
    };

    const userBoard = writable([]);
    const opponentBoard = writable([]);

    const getMinionFromBoard = (id) => {
        let board = get_store_value(userBoard);
        let minion = board.find(card => card.id === id);
        return { ...minion };
    };

    const setUserBoard = (cards) => {
        userBoard.update(board => {
            board = [...cards];
            board.forEach((card, i) => card.index = i);
            return board;
        });
    };

    const setOpponentBoard = (newBoard) => {
        opponentBoard.update(board => [...newBoard]);
    };


    const checkUserBoardForDeadMinions = () => {
        userBoard.update(board => {
            board.forEach((card, i, arr) => {
                if (card.tempStats.health <= 0) {
                    addCardToUserGraveyard(card);
                    arr.splice(i, 1);
                }
            });
            return board;
        });
    };

    const checkOpponentBoardForDeadMinions = () => {
        opponentBoard.update(board => {
            board.forEach((card, i, arr) => {
                if (card.tempStats.health <= 0) {
                    addCardToOpponentGraveyard(card);
                    arr.splice(i, 1);
                }
            });
            return board;
        });
    };


    const updateUserMinionOnBoard = (minion) => {
        userBoard.update(board => {
            board.forEach(card => {
                if (card.id === minion.id) card = { ...minion };
            });
            return board;
        });
    };

    const updateOpponentMinionOnBoard = (minion) => {
        opponentBoard.update(board => {
            board.forEach(card => {
                if (card.id === minion.id) card = { ...minion };
            });
            return board;
        });
    };


    const resetAtkPoints = () => {
        userBoard.update(board => {
            board.forEach(card => card.tempStats.atkPoints = card.atkPoints);
            return board;
        });
    };

    const reduceUserMinionAtkPoints = (id, amount) => {
        userBoard.update(board => {
            board.forEach(card => {
                console.log('heree', card);
                if (card.id === id) {
                    card.tempStats.atkPoints -= amount;
                }
            });
            return board;
        });
    };

    const gameState = writable({
        usersTurn: null,
        turnEnding: false,
        gameOn: false,
        gameOver: false,
        myTurn: true,

        attackingMinion: {
            clickActive: false,
            selectedMinionID: '',
        },

        showUserGraveyard: false,
        userWins: false,

        userHealth: 30,
        userMana: 0,
        userTempStats: {
            mana: 0,
            health: 30,
        },

        opponentTempStats: {
            mana: 0,
            health: 30,
        },

        opponentHealth: 30,
        opponentMana: 0,

        attacked: false,
        disableUserBoard: false,

        minionCostsToMuch: false,
    });

    const setUsersTurn = (state) => {
        gameState.update(game => ({ ...game, usersTurn: state }));
    };

    const setTurnEnding = (state) => {
        gameState.update(game => ({ ...game, turnEnding: state }));
    };

    const setAttackingMinion = (id, clickActive) => {
        gameState.update(game => ({ ...game, attackingMinion: { clickActive: clickActive, selectedMinionID: id } }));
    };

    const dealDamageToOpponentHero = (damage) => {
        gameState.update(game => {
            game.opponentTempStats.health -= damage;
            if (game.opponentTempStats.health <= 0) {
                game.gameOver = true;
                game.userWins = true;
            }
            return game;
        });
    };

    /* export const dealDamageToUserHero = (damage) => {
        gameState.update(game => ({ ...game, userHealth: game.userHealth -= damage }));
    } */

    const setUserHeroHealth = (newHealth) => {
        gameState.update(game => {
            game.userTempStats.health = newHealth;
            return game;
        });
    };

    const incrementUserMana = () => {
        gameState.update(game => {
            if (game.userMana === 10) return game;
            game.userMana += 1;
            game.userTempStats.mana += 1;
            return game;
        });
    };
    const incrementOpponentMana = () => {

        gameState.update(game => {
            if (game.opponentMana === 10) return game;
            game.opponentMana += 1;
            game.opponentTempStats.mana += 1;
            return game;
        });
    };

    const reduceUserTempMana = (reduction) => {
        gameState.update(game => ({ ...game, userTempStats: { mana: game.userTempStats.mana -= reduction, ...game.userTempStats } }));
    };

    const reduceOpponentTempMana = (reduction) => {
        gameState.update(game => ({ ...game, opponentTempStats: { ...game.opponentTempStats, mana: game.opponentTempStats.mana -= reduction } }));
    };

    const resetUserMana = () => {
        gameState.update(game => ({ ...game, userTempStats: { ...game.userTempStats, mana: game.userMana } }));
    };
    const resetOpponentMana = () => {
        gameState.update(game => ({ ...game, opponentTempStats: { ...game.opponentTempStats, mana: game.opponentMana } }));
    };

    const setDisableUserBoard = (disableUserBoard) => {
        gameState.update(game => ({ ...game, disableUserBoard }));
    };

    const userHand = writable([]);
    const opponentHand = writable([]);

    /* SETTERS */
    const setOpponentHand = (newHand) => {
        opponentHand.update(hand => [...newHand]);
    };

    const setUserHand = (newHand) => {
        userHand.update(hand => [...newHand]);
    };

    /* ADD ONE */
    const addCardToUserHand = (card) => {
        userHand.update(hand => [...hand, card]);
    };
    /* ADD MULTIPLE */
    const addCardsToUserHand = (cards) => {
        userHand.update(hand => [...hand, ...cards]);
    };

    const addCardsToOpponentHand = (cards) => {
        opponentHand.update(hand => [...hand, ...cards]);
    };

    const getMinionFromUserHand = (id) => {
        let hand = get_store_value(userHand);
        let card = hand.find(card => card.id === id);
        console.log(id, hand);
        return card;
    };

    const removeCardInUserHand = (id) => {
        let card = get_store_value(userHand).find(card => card.id === id);
        userHand.update(hand => hand.filter(card => card.id !== id));
        return card;
    };

    const removeCardInOpponentHand = (cardID) => {
        let card = get_store_value(opponentHand).find(card => card.id === cardID);
        opponentHand.update(hand => hand.filter(card => card.id !== cardID));
        return card;
    };


    const buffUserHand = (buffData) => {
        userHand.update(hand => {
            hand.forEach(card => {
                if (card.type === 'minion') {
                    card.tempStats.atk += buffData.atkBuff;
                    card.tempStats.health += buffData.healthBuff;
                }
            });
            return hand;
        });
    };

    // Unique ID creation requires a high quality random # generator. In the browser we therefore
    // require the crypto API and do not support built-in fallback to lower quality random number
    // generators (like Math.random()).
    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
    // find the complete implementation of crypto (msCrypto) on IE11.
    var getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== 'undefined' && typeof msCrypto.getRandomValues === 'function' && msCrypto.getRandomValues.bind(msCrypto);
    var rnds8 = new Uint8Array(16);
    function rng() {
      if (!getRandomValues) {
        throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
      }

      return getRandomValues(rnds8);
    }

    var REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

    function validate(uuid) {
      return typeof uuid === 'string' && REGEX.test(uuid);
    }

    /**
     * Convert array of 16 byte values to UUID string format of the form:
     * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
     */

    var byteToHex = [];

    for (var i = 0; i < 256; ++i) {
      byteToHex.push((i + 0x100).toString(16).substr(1));
    }

    function stringify(arr) {
      var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      // Note: Be careful editing this code!  It's been tuned for performance
      // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
      var uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
      // of the following:
      // - One or more input array values don't map to a hex octet (leading to
      // "undefined" in the uuid)
      // - Invalid input values for the RFC `version` or `variant` fields

      if (!validate(uuid)) {
        throw TypeError('Stringified UUID is invalid');
      }

      return uuid;
    }

    function v4(options, buf, offset) {
      options = options || {};
      var rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

      rnds[6] = rnds[6] & 0x0f | 0x40;
      rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

      if (buf) {
        offset = offset || 0;

        for (var i = 0; i < 16; ++i) {
          buf[offset + i] = rnds[i];
        }

        return buf;
      }

      return stringify(rnds);
    }

    const userDeck = writable([]);

    const setUserDeck = (newDeck) => {
        userDeck.update(deck => [...newDeck]);
    };

    const drawCardsFromDeck = (amount) => {
        let cards = [];

        userDeck.update(deck => {
            for (let i = 0; i < amount; i++) {
                let card = deck.pop();
                cards.push(card);
            }
            return deck;
        });
        return cards;
    };

    /* DRAW CARDS FROM DECK */
    const drawCard = () => {
        let card;
        userDeck.update(deck => {
            card = deck.pop();

            return deck;
        });
        addCardToUserHand(card);
        console.log(get_store_value(userHand), 'draw card');
        return card;
    };

    const drawCards = (amount) => {
        let cards = [];
        userDeck.update(deck => {
            for (let i = 0; i < amount; i++) {
                let card = deck.pop();
                cards.push(card);
            }
            return deck;
        });
        console.log(cards, 'drawiing');
        addCardsToUserHand(cards);
        return cards;
    };


    /* BATTLE BETWEEN MINIONS */
    const resolveBattle = (atkID, defID) => {
        let user = get_store_value(userBoard);
        let opponent = get_store_value(opponentBoard);
        let cardUser = user.find(card => card.id === atkID);
        let cardOpp = opponent.find(card => card.id === defID);
        console.log(typeof cardOpp.tempStats.atk, typeof cardUser.tempStats.health);

        if (cardUser.tempStats.atkPoints < 1) return;
        cardUser.tempStats.health = cardUser.tempStats.health - cardOpp.tempStats.atk;
        cardUser.tempStats.atkPoints -= 1;
        cardOpp.tempStats.health -= cardUser.tempStats.atk;

        updateOpponentMinionOnBoard(cardOpp);
        updateUserMinionOnBoard(cardUser);


        checkUserBoardForDeadMinions();
        checkOpponentBoardForDeadMinions();

    };


    /* HAND TO GRAVE */

    const sendOpponentCardFromHandToGrave = (cardID) => {
        let card = removeCardInOpponentHand(cardID);
        addCardToOpponentGraveyard(card);
        return card;
    };

    const sendUserCardFromHandToGrave = (cardID) => {
        let card = removeCardInUserHand(cardID);
        addCardToUserGraveyard(card);
        return card;
    };


    /* ATTACK OPPONENT HERO FUNCTIONS*/
    const handleAttackHero = (damage, id, atkPoints) => {
        dealDamageToOpponentHero(damage);
        reduceUserMinionAtkPoints(id, atkPoints);
    };



    /* TEST/EXPERIMENTAL */
    const calcPositions = (rectUser, rectOpponent) => {
        let x = rectOpponent.x - rectUser.x;
        let y = rectUser.y - rectOpponent.y;

        gameState.update(game => ({ ...game, atkMoveCoordinates: { x, y } }));

        return { x, y };
    };

    const evalBattlecry = (card) => {
        let stateToUpdate = '';
        if (card.effect.primary.draw) {

            stateToUpdate = 'hand';

            if (card.effect.draw.buff) ; else if (card.effect.draw.duplicate) {
                duplicateOnDraw(card.effect.drawData.drawAmount);

            } else if (card.effect.draw.duplicateAndBuff) ; else {
                drawCards(card.effect.drawData.drawAmount);
            }
        }
        return stateToUpdate;
    };


    const duplicateOnDraw = (drawAmount) => {
        let cards = drawCardsFromDeck(drawAmount);
        let dupCards = [];
        cards.forEach(card => {
            let dupCard = { ...card, id: v4() };
            dupCards.push(dupCard);
        });

        addCardsToUserHand([...cards, ...dupCards]);

    };

    /* src\components\BoardSection\User\UserBoardSection.svelte generated by Svelte v3.29.4 */

    const { console: console_1 } = globals;
    const file$1 = "src\\components\\BoardSection\\User\\UserBoardSection.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (114:1) {#if items}
    function create_if_block$1(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*items*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*card*/ ctx[9].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$gameState, items, handleClick*/ 69) {
    				const each_value = /*items*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, fix_and_outro_and_destroy_block, create_each_block, each_1_anchor, get_each_context);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(114:1) {#if items}",
    		ctx
    	});

    	return block;
    }

    // (115:2) {#each items as card (card.id)}
    function create_each_block(key_1, ctx) {
    	let div;
    	let card;
    	let t;
    	let div_class_value;
    	let rect;
    	let stop_animation = noop;
    	let current;
    	let mounted;
    	let dispose;

    	card = new Card({
    			props: { card: /*card*/ ctx[9], cardPapa: "board" },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			create_component(card.$$.fragment);
    			t = space();

    			attr_dev(div, "class", div_class_value = "card " + (/*$gameState*/ ctx[2].attackingMinion.selectedMinionID === /*card*/ ctx[9].id
    			? "attacking"
    			: "") + " svelte-8p8epl");

    			attr_dev(div, "draggable", "true");
    			add_location(div, file$1, 115, 3, 2658);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(card, div, null);
    			append_dev(div, t);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*handleClick*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const card_changes = {};
    			if (dirty & /*items*/ 1) card_changes.card = /*card*/ ctx[9];
    			card.$set(card_changes);

    			if (!current || dirty & /*$gameState, items*/ 5 && div_class_value !== (div_class_value = "card " + (/*$gameState*/ ctx[2].attackingMinion.selectedMinionID === /*card*/ ctx[9].id
    			? "attacking"
    			: "") + " svelte-8p8epl")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		r: function measure() {
    			rect = div.getBoundingClientRect();
    		},
    		f: function fix() {
    			fix_position(div);
    			stop_animation();
    		},
    		a: function animate() {
    			stop_animation();
    			stop_animation = create_animation(div, rect, flip, { duration: flipDurationMs });
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(card);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(115:2) {#each items as card (card.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let dndzone_action;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*items*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "boardSection svelte-8p8epl");
    			add_location(div, file$1, 108, 0, 2413);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(dndzone_action = dndzone$2.call(null, div, {
    						items: /*items*/ ctx[0],
    						flipDurationMs,
    						transformDraggedElement,
    						dropFromOthersDisabled: /*dropFromOthersDisabled*/ ctx[1],
    						dragDisabled: /*dragDisabled*/ ctx[3]
    					})),
    					listen_dev(div, "consider", /*handleSort*/ ctx[4], false, false, false),
    					listen_dev(div, "finalize", /*handleFinalize*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*items*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*items*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dndzone_action && is_function(dndzone_action.update) && dirty & /*items, dropFromOthersDisabled*/ 3) dndzone_action.update.call(null, {
    				items: /*items*/ ctx[0],
    				flipDurationMs,
    				transformDraggedElement,
    				dropFromOthersDisabled: /*dropFromOthersDisabled*/ ctx[1],
    				dragDisabled: /*dragDisabled*/ ctx[3]
    			});
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const flipDurationMs = 400;

    function transformDraggedElement(draggedEl, data, i) {
    	
    }

    function handleDragEnd(e) {
    	e.preventDefault();
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $gameState;
    	validate_store(gameState, "gameState");
    	component_subscribe($$self, gameState, $$value => $$invalidate(2, $gameState = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("UserBoardSection", slots, []);
    	let { emitPlayedMinion } = $$props;
    	let items = [];
    	let dropFromOthersDisabled = false;
    	let dragDisabled = true;
    	let target;
    	dropFromOthersDisabled = false;
    	userBoard.subscribe(board => $$invalidate(0, items = board));

    	function handleSort(e) {
    		e.preventDefault();
    		setUserBoard(e.detail.items);
    	}

    	function handleFinalize(e) {
    		e.preventDefault();
    		let item = e.detail.items.find(item => item.id === e.detail.info.id);
    		setUserBoard(e.detail.items);

    		//only triggers if dropped
    		if (e.detail.info.trigger === TRIGGERS.DROPPED_INTO_ZONE) {
    			emitPlayedMinion(e.detail.info.id);

    			userHand.update(hand => {
    				hand.pop();
    				return hand;
    			});

    			//decrease user mana here
    			console.log(item.tempStats, "item");

    			reduceUserTempMana(item.tempStats.cost);
    		}
    	}

    	function handleClick(e) {
    		// e.preventDefault();
    		//if (dropFromOthersDisabled) return;
    		let id = e.currentTarget.firstChild.getAttribute("cardID");

    		e.currentTarget;
    		if ($gameState.usersTurn) setAttackingMinion(id, true);
    	}

    	const writable_props = ["emitPlayedMinion"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<UserBoardSection> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("emitPlayedMinion" in $$props) $$invalidate(7, emitPlayedMinion = $$props.emitPlayedMinion);
    	};

    	$$self.$capture_state = () => ({
    		flip,
    		dndzone: dndzone$2,
    		TRIGGERS,
    		Card,
    		userBoard,
    		setUserBoard,
    		gameState,
    		setAttackingMinion,
    		reduceUserTempMana,
    		userHand,
    		evalBattlecry,
    		drawCard,
    		get: get_store_value,
    		emitPlayedMinion,
    		flipDurationMs,
    		items,
    		dropFromOthersDisabled,
    		dragDisabled,
    		target,
    		transformDraggedElement,
    		handleSort,
    		handleFinalize,
    		handleClick,
    		handleDragEnd,
    		$gameState
    	});

    	$$self.$inject_state = $$props => {
    		if ("emitPlayedMinion" in $$props) $$invalidate(7, emitPlayedMinion = $$props.emitPlayedMinion);
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("dropFromOthersDisabled" in $$props) $$invalidate(1, dropFromOthersDisabled = $$props.dropFromOthersDisabled);
    		if ("dragDisabled" in $$props) $$invalidate(3, dragDisabled = $$props.dragDisabled);
    		if ("target" in $$props) target = $$props.target;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$gameState*/ 4) {
    			 if ($gameState.usersTurn && !$gameState.disableUserBoard && !$gameState.minionCostsToMuch) {
    				$$invalidate(1, dropFromOthersDisabled = false);
    			} else {
    				$$invalidate(1, dropFromOthersDisabled = true);
    			}
    		}
    	};

    	return [
    		items,
    		dropFromOthersDisabled,
    		$gameState,
    		dragDisabled,
    		handleSort,
    		handleFinalize,
    		handleClick,
    		emitPlayedMinion
    	];
    }

    class UserBoardSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { emitPlayedMinion: 7 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UserBoardSection",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*emitPlayedMinion*/ ctx[7] === undefined && !("emitPlayedMinion" in props)) {
    			console_1.warn("<UserBoardSection> was created without expected prop 'emitPlayedMinion'");
    		}
    	}

    	get emitPlayedMinion() {
    		throw new Error("<UserBoardSection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set emitPlayedMinion(value) {
    		throw new Error("<UserBoardSection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\BoardSection\Opponent\OpponentBoardSection.svelte generated by Svelte v3.29.4 */

    const { console: console_1$1 } = globals;
    const file$2 = "src\\components\\BoardSection\\Opponent\\OpponentBoardSection.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (87:1) {#if items}
    function create_if_block$2(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*items*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*card*/ ctx[10].id;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items, handleClick*/ 17) {
    				const each_value = /*items*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, fix_and_outro_and_destroy_block, create_each_block$1, each_1_anchor, get_each_context$1);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(87:1) {#if items}",
    		ctx
    	});

    	return block;
    }

    // (88:2) {#each items as card (card.id)}
    function create_each_block$1(key_1, ctx) {
    	let div;
    	let card;
    	let t;
    	let div_class_value;
    	let rect;
    	let stop_animation = noop;
    	let current;
    	let mounted;
    	let dispose;

    	card = new Card({
    			props: {
    				card: /*card*/ ctx[10],
    				cardPapa: "board"
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			create_component(card.$$.fragment);
    			t = space();
    			attr_dev(div, "class", div_class_value = "card " + (/*card*/ ctx[10].in ? "in" : "") + " svelte-372flm");
    			add_location(div, file$2, 88, 3, 2083);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(card, div, null);
    			append_dev(div, t);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*handleClick*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const card_changes = {};
    			if (dirty & /*items*/ 1) card_changes.card = /*card*/ ctx[10];
    			card.$set(card_changes);

    			if (!current || dirty & /*items*/ 1 && div_class_value !== (div_class_value = "card " + (/*card*/ ctx[10].in ? "in" : "") + " svelte-372flm")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		r: function measure() {
    			rect = div.getBoundingClientRect();
    		},
    		f: function fix() {
    			fix_position(div);
    			stop_animation();
    		},
    		a: function animate() {
    			stop_animation();
    			stop_animation = create_animation(div, rect, flip, { duration: flipDurationMs$1 });
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(card);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(88:2) {#each items as card (card.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let dndzone_action;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*items*/ ctx[0] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "boardSection svelte-372flm");
    			add_location(div, file$2, 80, 0, 1806);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(dndzone_action = dndzone$2.call(null, div, {
    						items: /*items*/ ctx[0],
    						flipDurationMs: flipDurationMs$1,
    						transformDraggedElement: transformDraggedElement$1,
    						dragDisabled: /*dragDisabled*/ ctx[3],
    						type: /*type*/ ctx[1],
    						dropFromOthersDisabled: /*dropFromOthersDisabled*/ ctx[2]
    					})),
    					listen_dev(div, "consider", /*handleSort*/ ctx[6], false, false, false),
    					listen_dev(div, "finalize", /*handleFinalize*/ ctx[7], false, false, false),
    					listen_dev(div, "click", /*onClickBoard*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*items*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*items*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dndzone_action && is_function(dndzone_action.update) && dirty & /*items*/ 1) dndzone_action.update.call(null, {
    				items: /*items*/ ctx[0],
    				flipDurationMs: flipDurationMs$1,
    				transformDraggedElement: transformDraggedElement$1,
    				dragDisabled: /*dragDisabled*/ ctx[3],
    				type: /*type*/ ctx[1],
    				dropFromOthersDisabled: /*dropFromOthersDisabled*/ ctx[2]
    			});
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const flipDurationMs$1 = 400;

    function transformDraggedElement$1(draggedEl, data, index) {
    	const msg = `My index is ${index}`;
    	draggedEl.innerHTML = msg;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $gameState;
    	validate_store(gameState, "gameState");
    	component_subscribe($$self, gameState, $$value => $$invalidate(9, $gameState = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("OpponentBoardSection", slots, []);
    	let { emitBattleResult } = $$props;
    	let type = "user";
    	let dropFromOthersDisabled = true;
    	let items = [];
    	let dragDisabled = true;
    	opponentBoard.subscribe(board => $$invalidate(0, items = board));

    	function handleClick(e) {
    		console.log(e.currentTarget.getBoundingClientRect());

    		if ($gameState.attackingMinion.clickActive && $gameState.usersTurn) {
    			let defID = e.currentTarget.firstChild.getAttribute("cardID");
    			let atkID = $gameState.attackingMinion.selectedMinionID;
    			resolveBattle(atkID, defID);
    			emitBattleResult();
    		}

    		setAttackingMinion("", false);
    	}

    	function onClickBoard() {
    		$$invalidate(0, items = [...items]);
    	}

    	function handleSort(e) {
    		$$invalidate(0, items = e.detail.items);
    	}

    	function handleFinalize(e) {
    		$$invalidate(0, items = e.detail.items);
    	}

    	const writable_props = ["emitBattleResult"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<OpponentBoardSection> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("emitBattleResult" in $$props) $$invalidate(8, emitBattleResult = $$props.emitBattleResult);
    	};

    	$$self.$capture_state = () => ({
    		flip,
    		dndzone: dndzone$2,
    		TRIGGERS,
    		Card,
    		opponentBoard,
    		gameState,
    		setAttackingMinion,
    		resolveBattle,
    		calcPositions,
    		userGraveyard,
    		emitBattleResult,
    		flipDurationMs: flipDurationMs$1,
    		type,
    		dropFromOthersDisabled,
    		items,
    		dragDisabled,
    		handleClick,
    		onClickBoard,
    		handleSort,
    		handleFinalize,
    		transformDraggedElement: transformDraggedElement$1,
    		$gameState
    	});

    	$$self.$inject_state = $$props => {
    		if ("emitBattleResult" in $$props) $$invalidate(8, emitBattleResult = $$props.emitBattleResult);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("dropFromOthersDisabled" in $$props) $$invalidate(2, dropFromOthersDisabled = $$props.dropFromOthersDisabled);
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("dragDisabled" in $$props) $$invalidate(3, dragDisabled = $$props.dragDisabled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		items,
    		type,
    		dropFromOthersDisabled,
    		dragDisabled,
    		handleClick,
    		onClickBoard,
    		handleSort,
    		handleFinalize,
    		emitBattleResult
    	];
    }

    class OpponentBoardSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { emitBattleResult: 8 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OpponentBoardSection",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*emitBattleResult*/ ctx[8] === undefined && !("emitBattleResult" in props)) {
    			console_1$1.warn("<OpponentBoardSection> was created without expected prop 'emitBattleResult'");
    		}
    	}

    	get emitBattleResult() {
    		throw new Error("<OpponentBoardSection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set emitBattleResult(value) {
    		throw new Error("<OpponentBoardSection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\HandSection\User\Hand\Hand.svelte generated by Svelte v3.29.4 */

    const { console: console_1$2 } = globals;
    const file$3 = "src\\components\\HandSection\\User\\Hand\\Hand.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (177:1) {#if items}
    function create_if_block$3(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*items*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*card*/ ctx[4].id;
    	validate_each_keys(ctx, each_value, get_each_context$2, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$2(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$2(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*castSpellId, items, try1*/ 265) {
    				const each_value = /*items*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				validate_each_keys(ctx, each_value, get_each_context$2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, fix_and_outro_and_destroy_block, create_each_block$2, each_1_anchor, get_each_context$2);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(177:1) {#if items}",
    		ctx
    	});

    	return block;
    }

    // (178:2) {#each items as card (card.id)}
    function create_each_block$2(key_1, ctx) {
    	let div;
    	let card_1;
    	let t;
    	let rect;
    	let stop_animation = noop;
    	let current;
    	let mounted;
    	let dispose;

    	card_1 = new Card({
    			props: { card: /*card*/ ctx[4], cardPapa: "hand1" },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			create_component(card_1.$$.fragment);
    			t = space();
    			attr_dev(div, "class", "card svelte-qzwhfd");
    			toggle_class(div, "spellActivation", /*castSpellId*/ ctx[3] === /*card*/ ctx[4].id);
    			add_location(div, file$3, 178, 3, 4323);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(card_1, div, null);
    			append_dev(div, t);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "mousedown", /*try1*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const card_1_changes = {};
    			if (dirty & /*items*/ 1) card_1_changes.card = /*card*/ ctx[4];
    			card_1.$set(card_1_changes);

    			if (dirty & /*castSpellId, items*/ 9) {
    				toggle_class(div, "spellActivation", /*castSpellId*/ ctx[3] === /*card*/ ctx[4].id);
    			}
    		},
    		r: function measure() {
    			rect = div.getBoundingClientRect();
    		},
    		f: function fix() {
    			fix_position(div);
    			stop_animation();
    		},
    		a: function animate() {
    			stop_animation();
    			stop_animation = create_animation(div, rect, flip, { duration: /*flipDurationMs*/ ctx[1] });
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(card_1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(178:2) {#each items as card (card.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let dndzone_action;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*items*/ ctx[0] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "hand svelte-qzwhfd");
    			add_location(div, file$3, 171, 0, 4107);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(dndzone_action = dndzone$2.call(null, div, {
    						items: /*items*/ ctx[0],
    						flipDurationMs: /*flipDurationMs*/ ctx[1],
    						dropFromOthersDisabled: /*dropFromOthersDisabled*/ ctx[5],
    						dragDisabled: /*dragDisabled*/ ctx[2]
    					})),
    					listen_dev(div, "consider", /*handleConsider*/ ctx[6], false, false, false),
    					listen_dev(div, "finalize", /*handleFinalize*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*items*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*items*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dndzone_action && is_function(dndzone_action.update) && dirty & /*items, flipDurationMs, dragDisabled*/ 7) dndzone_action.update.call(null, {
    				items: /*items*/ ctx[0],
    				flipDurationMs: /*flipDurationMs*/ ctx[1],
    				dropFromOthersDisabled: /*dropFromOthersDisabled*/ ctx[5],
    				dragDisabled: /*dragDisabled*/ ctx[2]
    			});
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $userHand;
    	let $gameState;
    	validate_store(userHand, "userHand");
    	component_subscribe($$self, userHand, $$value => $$invalidate(12, $userHand = $$value));
    	validate_store(gameState, "gameState");
    	component_subscribe($$self, gameState, $$value => $$invalidate(13, $gameState = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Hand", slots, []);
    	let { emitPlayedSpell } = $$props;
    	let { emitUpdateHand } = $$props;
    	let items = [];
    	let itemsCopy = [];
    	let flipDurationMs = 200;
    	let dropFromOthersDisabled = true;
    	let dragDisabled = false;
    	let card;
    	let castSpellId = "";

    	userHand.subscribe(hand => {
    		$$invalidate(0, items = hand);
    		console.log(hand, "from subscirbe");

    		hand.forEach(card => {
    			if (card.type === "spell" && !itemsCopy.find(c => c.id === card.id)) itemsCopy = [...itemsCopy, card];
    		});
    	});

    	function handleConsider(e) {
    		e.preventDefault();
    		const item = e.detail.items.find(item => item.id === e.detail.info.id);
    		setUserHand(e.detail.items);

    		if (e.detail.info.trigger === TRIGGERS.DRAG_STARTED) ;

    		if (e.detail.info.trigger === TRIGGERS.DRAGGED_LEFT) ;

    		if (e.detail.info.trigger === TRIGGERS.DROPPED_OUTSIDE_OF_ANY) {
    			e.preventDefault();
    		}

    		if (e.detail.info.trigger === TRIGGERS.DROPPED_INTO_ANOTHER) if (e.detail.info.trigger === TRIGGERS.DRAG_STOPPED) ;
    	}

    	function handleFinalize(e) {
    		setUserHand(e.detail.items);
    		if (e.detail.info.trigger === TRIGGERS.DRAGGED_LEFT) console.log("drag left");

    		if (e.detail.info.trigger === TRIGGERS.DROPPED_OUTSIDE_OF_ANY) {
    			console.log("outside of any", items);

    			if (card.type === "spell") {
    				if (card.tempStats.cost > $gameState.userTempStats.mana) return;

    				if (card.effect === "handBuff") {
    					buffUserHand(card.effectData);
    				}

    				$$invalidate(3, castSpellId = e.detail.info.id);

    				//continue here
    				reduceUserTempMana(card.tempStats.cost);

    				emitPlayedSpell(e.detail.info.id);
    				sendUserCardFromHandToGrave(e.detail.info.id);
    			}
    		}

    		if (e.detail.info.trigger === TRIGGERS.DROPPED_INTO_ANOTHER) {
    			let card = get_store_value(userBoard).find(card => card.id === e.detail.info.id);

    			if (card.type === "minion") {
    				if (card.battlecry) {
    					const stateToUpdate = evalBattlecry(card);

    					if (stateToUpdate === "hand") {
    						emitUpdateHand();
    					}
    				}
    			}

    			console.log("dropped into another");
    		}

    		if (e.detail.info.trigger === TRIGGERS.DRAG_STOPPED) console.log("stopped");
    	}

    	function try1(e) {
    		$$invalidate(4, card = getMinionFromUserHand(e.currentTarget.firstChild.getAttribute("cardID")));

    		//HERE you can check for all kinds of things before drag starts
    		if (card.type === "spell") $$invalidate(1, flipDurationMs = 0);

    		if (card.type === "spell" || card.tempStats.cost > $gameState.userTempStats.mana) {
    			setDisableUserBoard(true);
    		} else {
    			setDisableUserBoard(false);
    			$$invalidate(1, flipDurationMs = 200);
    		}
    	}

    	const writable_props = ["emitPlayedSpell", "emitUpdateHand"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Hand> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("emitPlayedSpell" in $$props) $$invalidate(9, emitPlayedSpell = $$props.emitPlayedSpell);
    		if ("emitUpdateHand" in $$props) $$invalidate(10, emitUpdateHand = $$props.emitUpdateHand);
    	};

    	$$self.$capture_state = () => ({
    		Card,
    		flip,
    		dndzone: dndzone$2,
    		TRIGGERS,
    		userHand,
    		setUserHand,
    		getMinionFromUserHand,
    		removeCardInUserHand,
    		buffUserHand,
    		gameState,
    		setDisableUserBoard,
    		reduceUserTempMana,
    		sendUserCardFromHandToGrave,
    		evalBattlecry,
    		userBoard,
    		drawCard,
    		get: get_store_value,
    		emitPlayedSpell,
    		emitUpdateHand,
    		items,
    		itemsCopy,
    		flipDurationMs,
    		dropFromOthersDisabled,
    		dragDisabled,
    		card,
    		castSpellId,
    		handleConsider,
    		handleFinalize,
    		try1,
    		$userHand,
    		$gameState
    	});

    	$$self.$inject_state = $$props => {
    		if ("emitPlayedSpell" in $$props) $$invalidate(9, emitPlayedSpell = $$props.emitPlayedSpell);
    		if ("emitUpdateHand" in $$props) $$invalidate(10, emitUpdateHand = $$props.emitUpdateHand);
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("itemsCopy" in $$props) itemsCopy = $$props.itemsCopy;
    		if ("flipDurationMs" in $$props) $$invalidate(1, flipDurationMs = $$props.flipDurationMs);
    		if ("dropFromOthersDisabled" in $$props) $$invalidate(5, dropFromOthersDisabled = $$props.dropFromOthersDisabled);
    		if ("dragDisabled" in $$props) $$invalidate(2, dragDisabled = $$props.dragDisabled);
    		if ("card" in $$props) $$invalidate(4, card = $$props.card);
    		if ("castSpellId" in $$props) $$invalidate(3, castSpellId = $$props.castSpellId);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$userHand*/ 4096) {
    			 if ($userHand) {
    				console.log($userHand);
    			}
    		}

    		if ($$self.$$.dirty & /*$gameState*/ 8192) {
    			 if ($gameState.usersTurn) {
    				$$invalidate(2, dragDisabled = false);
    			} else {
    				$$invalidate(2, dragDisabled = true);
    			}
    		}
    	};

    	return [
    		items,
    		flipDurationMs,
    		dragDisabled,
    		castSpellId,
    		card,
    		dropFromOthersDisabled,
    		handleConsider,
    		handleFinalize,
    		try1,
    		emitPlayedSpell,
    		emitUpdateHand
    	];
    }

    class Hand extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { emitPlayedSpell: 9, emitUpdateHand: 10 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hand",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*emitPlayedSpell*/ ctx[9] === undefined && !("emitPlayedSpell" in props)) {
    			console_1$2.warn("<Hand> was created without expected prop 'emitPlayedSpell'");
    		}

    		if (/*emitUpdateHand*/ ctx[10] === undefined && !("emitUpdateHand" in props)) {
    			console_1$2.warn("<Hand> was created without expected prop 'emitUpdateHand'");
    		}
    	}

    	get emitPlayedSpell() {
    		throw new Error("<Hand>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set emitPlayedSpell(value) {
    		throw new Error("<Hand>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get emitUpdateHand() {
    		throw new Error("<Hand>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set emitUpdateHand(value) {
    		throw new Error("<Hand>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\HandSection\User\UserHandSection.svelte generated by Svelte v3.29.4 */
    const file$4 = "src\\components\\HandSection\\User\\UserHandSection.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let hand;
    	let current;

    	hand = new Hand({
    			props: {
    				emitPlayedSpell: /*emitPlayedSpell*/ ctx[0],
    				emitUpdateHand: /*emitUpdateHand*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(hand.$$.fragment);
    			attr_dev(div, "class", "handSection svelte-h769fd");
    			add_location(div, file$4, 19, 0, 315);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(hand, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const hand_changes = {};
    			if (dirty & /*emitPlayedSpell*/ 1) hand_changes.emitPlayedSpell = /*emitPlayedSpell*/ ctx[0];
    			if (dirty & /*emitUpdateHand*/ 2) hand_changes.emitUpdateHand = /*emitUpdateHand*/ ctx[1];
    			hand.$set(hand_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hand.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hand.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(hand);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("UserHandSection", slots, []);
    	let { emitPlayedSpell } = $$props;
    	let { emitUpdateHand } = $$props;
    	const writable_props = ["emitPlayedSpell", "emitUpdateHand"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<UserHandSection> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("emitPlayedSpell" in $$props) $$invalidate(0, emitPlayedSpell = $$props.emitPlayedSpell);
    		if ("emitUpdateHand" in $$props) $$invalidate(1, emitUpdateHand = $$props.emitUpdateHand);
    	};

    	$$self.$capture_state = () => ({ Hand, emitPlayedSpell, emitUpdateHand });

    	$$self.$inject_state = $$props => {
    		if ("emitPlayedSpell" in $$props) $$invalidate(0, emitPlayedSpell = $$props.emitPlayedSpell);
    		if ("emitUpdateHand" in $$props) $$invalidate(1, emitUpdateHand = $$props.emitUpdateHand);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [emitPlayedSpell, emitUpdateHand];
    }

    class UserHandSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { emitPlayedSpell: 0, emitUpdateHand: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UserHandSection",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*emitPlayedSpell*/ ctx[0] === undefined && !("emitPlayedSpell" in props)) {
    			console.warn("<UserHandSection> was created without expected prop 'emitPlayedSpell'");
    		}

    		if (/*emitUpdateHand*/ ctx[1] === undefined && !("emitUpdateHand" in props)) {
    			console.warn("<UserHandSection> was created without expected prop 'emitUpdateHand'");
    		}
    	}

    	get emitPlayedSpell() {
    		throw new Error("<UserHandSection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set emitPlayedSpell(value) {
    		throw new Error("<UserHandSection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get emitUpdateHand() {
    		throw new Error("<UserHandSection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set emitUpdateHand(value) {
    		throw new Error("<UserHandSection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\HandSection\Opponent\Hand\Hand.svelte generated by Svelte v3.29.4 */

    const file$5 = "src\\components\\HandSection\\Opponent\\Hand\\Hand.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (47:1) {#if items}
    function create_if_block$4(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*items*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*card*/ ctx[6].id;
    	validate_each_keys(ctx, each_value, get_each_context$3, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$3(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$3(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items, castSpellId*/ 9) {
    				const each_value = /*items*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				validate_each_keys(ctx, each_value, get_each_context$3, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, fix_and_outro_and_destroy_block, create_each_block$3, each_1_anchor, get_each_context$3);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(47:1) {#if items}",
    		ctx
    	});

    	return block;
    }

    // (48:2) {#each items as card (card.id)}
    function create_each_block$3(key_1, ctx) {
    	let div;
    	let card;
    	let t;
    	let rect;
    	let stop_animation = noop;
    	let current;

    	card = new Card({
    			props: {
    				card: /*card*/ ctx[6],
    				cardPapa: "hand2",
    				castSpellId: /*castSpellId*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			create_component(card.$$.fragment);
    			t = space();
    			add_location(div, file$5, 48, 3, 1000);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(card, div, null);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const card_changes = {};
    			if (dirty & /*items*/ 1) card_changes.card = /*card*/ ctx[6];
    			card.$set(card_changes);
    		},
    		r: function measure() {
    			rect = div.getBoundingClientRect();
    		},
    		f: function fix() {
    			fix_position(div);
    			stop_animation();
    		},
    		a: function animate() {
    			stop_animation();
    			stop_animation = create_animation(div, rect, flip, { duration: flipDurationMs$2 });
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(card);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(48:2) {#each items as card (card.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let dndzone_action;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*items*/ ctx[0] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "hand svelte-15ws64m");
    			add_location(div, file$5, 41, 0, 784);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(dndzone_action = dndzone$2.call(null, div, {
    						items: /*items*/ ctx[0],
    						flipDurationMs: flipDurationMs$2,
    						dropFromOthersDisabled: /*dropFromOthersDisabled*/ ctx[1],
    						dragDisabled: /*dragDisabled*/ ctx[2]
    					})),
    					listen_dev(div, "consider", /*handleConsider*/ ctx[4], false, false, false),
    					listen_dev(div, "finalize", /*handleFinalize*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*items*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*items*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dndzone_action && is_function(dndzone_action.update) && dirty & /*items*/ 1) dndzone_action.update.call(null, {
    				items: /*items*/ ctx[0],
    				flipDurationMs: flipDurationMs$2,
    				dropFromOthersDisabled: /*dropFromOthersDisabled*/ ctx[1],
    				dragDisabled: /*dragDisabled*/ ctx[2]
    			});
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const flipDurationMs$2 = 200;

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Hand", slots, []);
    	let items = [];
    	let dropFromOthersDisabled = true;
    	let dragDisabled = true;
    	let castSpellId = "";

    	opponentHand.subscribe(hand => {
    		$$invalidate(0, items = [...hand]);
    	});

    	function handleConsider(e) {
    		setOpponentHand(e.detail.items);
    	}

    	function handleFinalize(e) {
    		setOpponentHand(e.detail.items);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Hand> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Card,
    		flip,
    		dndzone: dndzone$2,
    		get: get_store_value,
    		opponentHand,
    		setOpponentHand,
    		items,
    		flipDurationMs: flipDurationMs$2,
    		dropFromOthersDisabled,
    		dragDisabled,
    		castSpellId,
    		handleConsider,
    		handleFinalize
    	});

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("dropFromOthersDisabled" in $$props) $$invalidate(1, dropFromOthersDisabled = $$props.dropFromOthersDisabled);
    		if ("dragDisabled" in $$props) $$invalidate(2, dragDisabled = $$props.dragDisabled);
    		if ("castSpellId" in $$props) $$invalidate(3, castSpellId = $$props.castSpellId);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		items,
    		dropFromOthersDisabled,
    		dragDisabled,
    		castSpellId,
    		handleConsider,
    		handleFinalize
    	];
    }

    class Hand$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hand",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\components\HandSection\Opponent\OpponentHandSection.svelte generated by Svelte v3.29.4 */
    const file$6 = "src\\components\\HandSection\\Opponent\\OpponentHandSection.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let hand;
    	let current;
    	hand = new Hand$1({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(hand.$$.fragment);
    			attr_dev(div, "class", "handSection svelte-1gp95dj");
    			add_location(div, file$6, 19, 0, 312);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(hand, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hand.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hand.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(hand);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("OpponentHandSection", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<OpponentHandSection> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Hand: Hand$1 });
    	return [];
    }

    class OpponentHandSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OpponentHandSection",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\components\HeroSection\User\Hero\Hero.svelte generated by Svelte v3.29.4 */
    const file$7 = "src\\components\\HeroSection\\User\\Hero\\Hero.svelte";

    function create_fragment$7(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let p;
    	let t1_value = /*$gameState*/ ctx[0].userTempStats.health + "";
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			p = element("p");
    			t1 = text(t1_value);
    			attr_dev(div0, "class", "img");
    			add_location(div0, file$7, 72, 1, 1457);
    			attr_dev(p, "class", "health svelte-t55gdx");
    			add_location(p, file$7, 76, 2, 1588);
    			attr_dev(div1, "class", "healthContainer svelte-t55gdx");
    			add_location(div1, file$7, 75, 1, 1555);
    			attr_dev(div2, "class", "hero svelte-t55gdx");
    			add_location(div2, file$7, 71, 0, 1413);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, p);
    			append_dev(p, t1);

    			if (!mounted) {
    				dispose = listen_dev(div2, "click", onHeroClick, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$gameState*/ 1 && t1_value !== (t1_value = /*$gameState*/ ctx[0].userTempStats.health + "")) set_data_dev(t1, t1_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const flipDurationMs$3 = 200;

    function onHeroClick() {
    	
    }

    function handleSort(e) {
    	
    }

    function handleFinalize(e) {
    	
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $gameState;
    	validate_store(gameState, "gameState");
    	component_subscribe($$self, gameState, $$value => $$invalidate(0, $gameState = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Hero", slots, []);
    	let items = [];
    	let health = 30;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Hero> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		gameState,
    		flipDurationMs: flipDurationMs$3,
    		items,
    		health,
    		onHeroClick,
    		handleSort,
    		handleFinalize,
    		$gameState
    	});

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) items = $$props.items;
    		if ("health" in $$props) health = $$props.health;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$gameState];
    }

    class Hero extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hero",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\components\HeroSection\Graveyard\Graveyard.svelte generated by Svelte v3.29.4 */
    const file$8 = "src\\components\\HeroSection\\Graveyard\\Graveyard.svelte";

    function create_fragment$8(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Grave";
    			attr_dev(div, "class", "graveyard svelte-1t25f7e");
    			add_location(div, file$8, 21, 0, 450);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*openGraveyard*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Graveyard", slots, []);

    	const openGraveyard = () => {
    		gameState.update(game => ({ ...game, showUserGraveyard: true }));
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Graveyard> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ gameState, openGraveyard });
    	return [openGraveyard];
    }

    class Graveyard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Graveyard",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\components\HeroSection\ManaDisplay\ManaDisplay.svelte generated by Svelte v3.29.4 */
    const file$9 = "src\\components\\HeroSection\\ManaDisplay\\ManaDisplay.svelte";

    // (53:8) {:else}
    function create_else_block$1(ctx) {
    	let t_value = /*$gameState*/ ctx[1].opponentTempStats.mana + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$gameState*/ 2 && t_value !== (t_value = /*$gameState*/ ctx[1].opponentTempStats.mana + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(53:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (51:8) {#if user === 'user'}
    function create_if_block$5(ctx) {
    	let t_value = /*$gameState*/ ctx[1].userTempStats.mana + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$gameState*/ 2 && t_value !== (t_value = /*$gameState*/ ctx[1].userTempStats.mana + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(51:8) {#if user === 'user'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t;
    	let p;

    	function select_block_type(ctx, dirty) {
    		if (/*user*/ ctx[0] === "user") return create_if_block$5;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t = space();
    			p = element("p");
    			if_block.c();
    			attr_dev(img, "class", "coin svelte-grnit");
    			if (img.src !== (img_src_value = "images/nuevo-sol.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "nuevo sol");
    			add_location(img, file$9, 48, 4, 1212);
    			attr_dev(p, "class", "glow svelte-grnit");
    			add_location(p, file$9, 49, 4, 1279);
    			attr_dev(div, "class", "manaDisplay svelte-grnit");
    			add_location(div, file$9, 47, 0, 1182);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t);
    			append_dev(div, p);
    			if_block.m(p, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(p, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $gameState;
    	validate_store(gameState, "gameState");
    	component_subscribe($$self, gameState, $$value => $$invalidate(1, $gameState = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ManaDisplay", slots, []);
    	let { user } = $$props;
    	const writable_props = ["user"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ManaDisplay> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("user" in $$props) $$invalidate(0, user = $$props.user);
    	};

    	$$self.$capture_state = () => ({ gameState, user, $gameState });

    	$$self.$inject_state = $$props => {
    		if ("user" in $$props) $$invalidate(0, user = $$props.user);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [user, $gameState];
    }

    class ManaDisplay extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { user: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ManaDisplay",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*user*/ ctx[0] === undefined && !("user" in props)) {
    			console.warn("<ManaDisplay> was created without expected prop 'user'");
    		}
    	}

    	get user() {
    		throw new Error("<ManaDisplay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set user(value) {
    		throw new Error("<ManaDisplay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\HeroSection\User\UserHeroSection.svelte generated by Svelte v3.29.4 */
    const file$a = "src\\components\\HeroSection\\User\\UserHeroSection.svelte";

    function create_fragment$a(ctx) {
    	let div;
    	let hero;
    	let t0;
    	let manadisplay;
    	let t1;
    	let graveyard;
    	let current;
    	hero = new Hero({ $$inline: true });
    	manadisplay = new ManaDisplay({ props: { user: "user" }, $$inline: true });
    	graveyard = new Graveyard({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(hero.$$.fragment);
    			t0 = space();
    			create_component(manadisplay.$$.fragment);
    			t1 = space();
    			create_component(graveyard.$$.fragment);
    			attr_dev(div, "class", "sectionContainer svelte-tz2cb4");
    			add_location(div, file$a, 21, 0, 422);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(hero, div, null);
    			append_dev(div, t0);
    			mount_component(manadisplay, div, null);
    			append_dev(div, t1);
    			mount_component(graveyard, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hero.$$.fragment, local);
    			transition_in(manadisplay.$$.fragment, local);
    			transition_in(graveyard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hero.$$.fragment, local);
    			transition_out(manadisplay.$$.fragment, local);
    			transition_out(graveyard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(hero);
    			destroy_component(manadisplay);
    			destroy_component(graveyard);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("UserHeroSection", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<UserHeroSection> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Hero, Graveyard, ManaDisplay });
    	return [];
    }

    class UserHeroSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UserHeroSection",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\components\HeroSection\Opponent\Hero\Hero.svelte generated by Svelte v3.29.4 */
    const file$b = "src\\components\\HeroSection\\Opponent\\Hero\\Hero.svelte";

    function create_fragment$b(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let p;
    	let t1_value = /*$gameState*/ ctx[0].opponentTempStats.health + "";
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			p = element("p");
    			t1 = text(t1_value);
    			attr_dev(div0, "class", "img");
    			add_location(div0, file$b, 91, 1, 2000);
    			attr_dev(p, "class", "health svelte-13xu5i8");
    			add_location(p, file$b, 95, 2, 2128);
    			attr_dev(div1, "class", "healthContainer svelte-13xu5i8");
    			add_location(div1, file$b, 94, 1, 2095);
    			attr_dev(div2, "class", "hero svelte-13xu5i8");
    			add_location(div2, file$b, 90, 0, 1956);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, p);
    			append_dev(p, t1);

    			if (!mounted) {
    				dispose = listen_dev(div2, "click", /*onHeroClick*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$gameState*/ 1 && t1_value !== (t1_value = /*$gameState*/ ctx[0].opponentTempStats.health + "")) set_data_dev(t1, t1_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $gameState;
    	validate_store(gameState, "gameState");
    	component_subscribe($$self, gameState, $$value => $$invalidate(0, $gameState = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Hero", slots, []);
    	let { emitHeroDamaged } = $$props;
    	let { emitGameOver } = $$props;

    	function onHeroClick() {
    		if ($gameState.usersTurn && $gameState.attackingMinion.clickActive) {
    			let card = getMinionFromBoard($gameState.attackingMinion.selectedMinionID);
    			if (card.tempStats.atkPoints < 1) return;
    			handleAttackHero(card.tempStats.atk, card.id, 1);

    			if ($gameState.gameOver) {
    				emitHeroDamaged();
    				emitGameOver(false);
    			} else {
    				emitHeroDamaged();
    			}
    		}

    		setAttackingMinion("", false);
    	}

    	const writable_props = ["emitHeroDamaged", "emitGameOver"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Hero> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("emitHeroDamaged" in $$props) $$invalidate(2, emitHeroDamaged = $$props.emitHeroDamaged);
    		if ("emitGameOver" in $$props) $$invalidate(3, emitGameOver = $$props.emitGameOver);
    	};

    	$$self.$capture_state = () => ({
    		gameState,
    		setAttackingMinion,
    		getMinionFromBoard,
    		handleAttackHero,
    		emitHeroDamaged,
    		emitGameOver,
    		onHeroClick,
    		$gameState
    	});

    	$$self.$inject_state = $$props => {
    		if ("emitHeroDamaged" in $$props) $$invalidate(2, emitHeroDamaged = $$props.emitHeroDamaged);
    		if ("emitGameOver" in $$props) $$invalidate(3, emitGameOver = $$props.emitGameOver);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$gameState, onHeroClick, emitHeroDamaged, emitGameOver];
    }

    class Hero$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { emitHeroDamaged: 2, emitGameOver: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hero",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*emitHeroDamaged*/ ctx[2] === undefined && !("emitHeroDamaged" in props)) {
    			console.warn("<Hero> was created without expected prop 'emitHeroDamaged'");
    		}

    		if (/*emitGameOver*/ ctx[3] === undefined && !("emitGameOver" in props)) {
    			console.warn("<Hero> was created without expected prop 'emitGameOver'");
    		}
    	}

    	get emitHeroDamaged() {
    		throw new Error("<Hero>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set emitHeroDamaged(value) {
    		throw new Error("<Hero>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get emitGameOver() {
    		throw new Error("<Hero>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set emitGameOver(value) {
    		throw new Error("<Hero>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\HeroSection\Opponent\OpponentHeroSection.svelte generated by Svelte v3.29.4 */
    const file$c = "src\\components\\HeroSection\\Opponent\\OpponentHeroSection.svelte";

    function create_fragment$c(ctx) {
    	let div;
    	let hero;
    	let t;
    	let manadisplay;
    	let current;

    	hero = new Hero$1({
    			props: {
    				emitHeroDamaged: /*emitHeroDamaged*/ ctx[0],
    				emitGameOver: /*emitGameOver*/ ctx[1]
    			},
    			$$inline: true
    		});

    	manadisplay = new ManaDisplay({
    			props: { user: "opponent" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(hero.$$.fragment);
    			t = space();
    			create_component(manadisplay.$$.fragment);
    			attr_dev(div, "class", "sectionContainer svelte-573p8j");
    			add_location(div, file$c, 21, 0, 440);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(hero, div, null);
    			append_dev(div, t);
    			mount_component(manadisplay, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const hero_changes = {};
    			if (dirty & /*emitHeroDamaged*/ 1) hero_changes.emitHeroDamaged = /*emitHeroDamaged*/ ctx[0];
    			if (dirty & /*emitGameOver*/ 2) hero_changes.emitGameOver = /*emitGameOver*/ ctx[1];
    			hero.$set(hero_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hero.$$.fragment, local);
    			transition_in(manadisplay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hero.$$.fragment, local);
    			transition_out(manadisplay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(hero);
    			destroy_component(manadisplay);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("OpponentHeroSection", slots, []);
    	let { emitHeroDamaged } = $$props;
    	let { emitGameOver } = $$props;
    	const writable_props = ["emitHeroDamaged", "emitGameOver"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<OpponentHeroSection> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("emitHeroDamaged" in $$props) $$invalidate(0, emitHeroDamaged = $$props.emitHeroDamaged);
    		if ("emitGameOver" in $$props) $$invalidate(1, emitGameOver = $$props.emitGameOver);
    	};

    	$$self.$capture_state = () => ({
    		Hero: Hero$1,
    		ManaDisplay,
    		emitHeroDamaged,
    		emitGameOver
    	});

    	$$self.$inject_state = $$props => {
    		if ("emitHeroDamaged" in $$props) $$invalidate(0, emitHeroDamaged = $$props.emitHeroDamaged);
    		if ("emitGameOver" in $$props) $$invalidate(1, emitGameOver = $$props.emitGameOver);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [emitHeroDamaged, emitGameOver];
    }

    class OpponentHeroSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { emitHeroDamaged: 0, emitGameOver: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OpponentHeroSection",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*emitHeroDamaged*/ ctx[0] === undefined && !("emitHeroDamaged" in props)) {
    			console.warn("<OpponentHeroSection> was created without expected prop 'emitHeroDamaged'");
    		}

    		if (/*emitGameOver*/ ctx[1] === undefined && !("emitGameOver" in props)) {
    			console.warn("<OpponentHeroSection> was created without expected prop 'emitGameOver'");
    		}
    	}

    	get emitHeroDamaged() {
    		throw new Error("<OpponentHeroSection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set emitHeroDamaged(value) {
    		throw new Error("<OpponentHeroSection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get emitGameOver() {
    		throw new Error("<OpponentHeroSection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set emitGameOver(value) {
    		throw new Error("<OpponentHeroSection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\MidboardSeperator\Seperator.svelte generated by Svelte v3.29.4 */
    const file$d = "src\\components\\MidboardSeperator\\Seperator.svelte";

    function create_fragment$d(ctx) {
    	let div;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", div_class_value = "separator " + (/*$gameState*/ ctx[0].turnEnding ? "endTurn" : "") + " svelte-16ezs55");
    			add_location(div, file$d, 95, 0, 2261);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$gameState*/ 1 && div_class_value !== (div_class_value = "separator " + (/*$gameState*/ ctx[0].turnEnding ? "endTurn" : "") + " svelte-16ezs55")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $gameState;
    	validate_store(gameState, "gameState");
    	component_subscribe($$self, gameState, $$value => $$invalidate(0, $gameState = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Seperator", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Seperator> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ gameState, $gameState });
    	return [$gameState];
    }

    class Seperator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Seperator",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src\components\EndTurnButton\EndTurnButton.svelte generated by Svelte v3.29.4 */
    const file$e = "src\\components\\EndTurnButton\\EndTurnButton.svelte";

    // (208:8) {:else}
    function create_else_block_1$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Opponents Turn";
    			attr_dev(p, "class", "buttonText svelte-8zphe2");
    			add_location(p, file$e, 208, 12, 4311);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(208:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (206:8) {#if $gameState.usersTurn}
    function create_if_block_1$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "End Turn";
    			attr_dev(p, "class", "buttonText svelte-8zphe2");
    			add_location(p, file$e, 206, 12, 4246);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(206:8) {#if $gameState.usersTurn}",
    		ctx
    	});

    	return block;
    }

    // (221:8) {:else}
    function create_else_block$2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Opponents Turn";
    			attr_dev(p, "class", "buttonText svelte-8zphe2");
    			add_location(p, file$e, 221, 12, 4646);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(221:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (219:8) {#if $gameState.usersTurn}
    function create_if_block$6(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "End Turn";
    			attr_dev(p, "class", "buttonText svelte-8zphe2");
    			add_location(p, file$e, 219, 12, 4581);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(219:8) {#if $gameState.usersTurn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let div0;
    	let button0;
    	let t0;
    	let span0;
    	let t1;
    	let span1;
    	let div0_class_value;
    	let t2;
    	let div1;
    	let button1;
    	let t3;
    	let span2;
    	let t4;
    	let span3;
    	let div1_class_value;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*$gameState*/ ctx[1].usersTurn) return create_if_block_1$1;
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*$gameState*/ ctx[1].usersTurn) return create_if_block$6;
    		return create_else_block$2;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			button0 = element("button");
    			if_block0.c();
    			t0 = space();
    			span0 = element("span");
    			t1 = space();
    			span1 = element("span");
    			t2 = space();
    			div1 = element("div");
    			button1 = element("button");
    			if_block1.c();
    			t3 = space();
    			span2 = element("span");
    			t4 = space();
    			span3 = element("span");
    			attr_dev(button0, "class", "svelte-8zphe2");
    			add_location(button0, file$e, 204, 4, 4188);
    			attr_dev(span0, "class", "svelte-8zphe2");
    			add_location(span0, file$e, 211, 4, 4387);
    			attr_dev(span1, "class", "svelte-8zphe2");
    			add_location(span1, file$e, 212, 4, 4401);
    			attr_dev(div0, "class", div0_class_value = "outer button " + (/*$gameState*/ ctx[1].usersTurn ? "myTurn" : "") + " svelte-8zphe2");
    			add_location(div0, file$e, 201, 0, 4084);
    			attr_dev(button1, "class", "svelte-8zphe2");
    			add_location(button1, file$e, 217, 4, 4523);
    			attr_dev(span2, "class", "svelte-8zphe2");
    			add_location(span2, file$e, 224, 4, 4722);
    			attr_dev(span3, "class", "svelte-8zphe2");
    			add_location(span3, file$e, 225, 4, 4736);
    			attr_dev(div1, "class", div1_class_value = "outer button " + (/*$gameState*/ ctx[1].usersTurn ? "myTurn" : "") + " svelte-8zphe2");
    			add_location(div1, file$e, 214, 0, 4419);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, button0);
    			if_block0.m(button0, null);
    			append_dev(div0, t0);
    			append_dev(div0, span0);
    			append_dev(div0, t1);
    			append_dev(div0, span1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button1);
    			if_block1.m(button1, null);
    			append_dev(div1, t3);
    			append_dev(div1, span2);
    			append_dev(div1, t4);
    			append_dev(div1, span3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						div0,
    						"click",
    						function () {
    							if (is_function(/*emitEndTurn*/ ctx[0])) /*emitEndTurn*/ ctx[0].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						div1,
    						"click",
    						function () {
    							if (is_function(/*emitEndTurn*/ ctx[0])) /*emitEndTurn*/ ctx[0].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(button0, null);
    				}
    			}

    			if (dirty & /*$gameState*/ 2 && div0_class_value !== (div0_class_value = "outer button " + (/*$gameState*/ ctx[1].usersTurn ? "myTurn" : "") + " svelte-8zphe2")) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (current_block_type_1 !== (current_block_type_1 = select_block_type_1(ctx))) {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(button1, null);
    				}
    			}

    			if (dirty & /*$gameState*/ 2 && div1_class_value !== (div1_class_value = "outer button " + (/*$gameState*/ ctx[1].usersTurn ? "myTurn" : "") + " svelte-8zphe2")) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if_block0.d();
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let $gameState;
    	validate_store(gameState, "gameState");
    	component_subscribe($$self, gameState, $$value => $$invalidate(1, $gameState = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("EndTurnButton", slots, []);
    	let { emitEndTurn } = $$props;
    	let usersTurn = false;
    	gameState.subscribe(game => usersTurn = game.usersTurn);
    	const writable_props = ["emitEndTurn"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<EndTurnButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("emitEndTurn" in $$props) $$invalidate(0, emitEndTurn = $$props.emitEndTurn);
    	};

    	$$self.$capture_state = () => ({
    		gameState,
    		emitEndTurn,
    		usersTurn,
    		$gameState
    	});

    	$$self.$inject_state = $$props => {
    		if ("emitEndTurn" in $$props) $$invalidate(0, emitEndTurn = $$props.emitEndTurn);
    		if ("usersTurn" in $$props) usersTurn = $$props.usersTurn;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [emitEndTurn, $gameState];
    }

    class EndTurnButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { emitEndTurn: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EndTurnButton",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*emitEndTurn*/ ctx[0] === undefined && !("emitEndTurn" in props)) {
    			console.warn("<EndTurnButton> was created without expected prop 'emitEndTurn'");
    		}
    	}

    	get emitEndTurn() {
    		throw new Error("<EndTurnButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set emitEndTurn(value) {
    		throw new Error("<EndTurnButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\GraveyardSelector\RingOfDoom\RingOfDoom.svelte generated by Svelte v3.29.4 */

    const file$f = "src\\components\\GraveyardSelector\\RingOfDoom\\RingOfDoom.svelte";

    function create_fragment$f(ctx) {
    	let div1;
    	let div0;
    	let div0_class_value;
    	let t;
    	let svg;
    	let filter;
    	let feTurbulence;
    	let animate;
    	let feDisplacementMap;
    	let div1_class_value;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = space();
    			svg = svg_element("svg");
    			filter = svg_element("filter");
    			feTurbulence = svg_element("feTurbulence");
    			animate = svg_element("animate");
    			feDisplacementMap = svg_element("feDisplacementMap");
    			attr_dev(div0, "class", div0_class_value = "circle " + (/*closing*/ ctx[0] ? "closing" : "") + " svelte-fsb9cv");
    			add_location(div0, file$f, 195, 4, 4435);
    			attr_dev(animate, "attributeName", "baseFrequency");
    			attr_dev(animate, "dur", "60s");
    			attr_dev(animate, "values", "0.02;0.005;0.02");
    			attr_dev(animate, "repeatCount", "indefinite");
    			add_location(animate, file$f, 204, 16, 4703);
    			attr_dev(feTurbulence, "x", "0");
    			attr_dev(feTurbulence, "y", "0");
    			attr_dev(feTurbulence, "baseFrequency", "0.009");
    			attr_dev(feTurbulence, "numOctaves", "5");
    			attr_dev(feTurbulence, "seed", "2");
    			add_location(feTurbulence, file$f, 198, 12, 4534);
    			attr_dev(feDisplacementMap, "in", "SourceGraphic");
    			attr_dev(feDisplacementMap, "scale", "30");
    			add_location(feDisplacementMap, file$f, 210, 12, 4925);
    			attr_dev(filter, "id", "wavy");
    			add_location(filter, file$f, 197, 8, 4503);
    			attr_dev(svg, "class", "svelte-fsb9cv");
    			add_location(svg, file$f, 196, 4, 4489);
    			attr_dev(div1, "class", div1_class_value = "container " + (/*closing*/ ctx[0] ? "closing" : "") + " svelte-fsb9cv");
    			add_location(div1, file$f, 194, 0, 4380);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t);
    			append_dev(div1, svg);
    			append_dev(svg, filter);
    			append_dev(filter, feTurbulence);
    			append_dev(feTurbulence, animate);
    			append_dev(filter, feDisplacementMap);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*closing*/ 1 && div0_class_value !== (div0_class_value = "circle " + (/*closing*/ ctx[0] ? "closing" : "") + " svelte-fsb9cv")) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (dirty & /*closing*/ 1 && div1_class_value !== (div1_class_value = "container " + (/*closing*/ ctx[0] ? "closing" : "") + " svelte-fsb9cv")) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("RingOfDoom", slots, []);
    	let { closing } = $$props;
    	const writable_props = ["closing"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<RingOfDoom> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("closing" in $$props) $$invalidate(0, closing = $$props.closing);
    	};

    	$$self.$capture_state = () => ({ closing });

    	$$self.$inject_state = $$props => {
    		if ("closing" in $$props) $$invalidate(0, closing = $$props.closing);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [closing];
    }

    class RingOfDoom extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { closing: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RingOfDoom",
    			options,
    			id: create_fragment$f.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*closing*/ ctx[0] === undefined && !("closing" in props)) {
    			console.warn("<RingOfDoom> was created without expected prop 'closing'");
    		}
    	}

    	get closing() {
    		throw new Error("<RingOfDoom>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closing(value) {
    		throw new Error("<RingOfDoom>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\GraveyardSelector\GraveyardList\GraveyardList.svelte generated by Svelte v3.29.4 */
    const file$g = "src\\components\\GraveyardSelector\\GraveyardList\\GraveyardList.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    // (90:4) {#each $userGraveyard as card, i}
    function create_each_block$4(ctx) {
    	let div;
    	let card;
    	let t;
    	let current;

    	card = new Card({
    			props: { card: /*card*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(card.$$.fragment);
    			t = space();
    			attr_dev(div, "class", "cardContainer svelte-1bjlz5n");
    			add_location(div, file$g, 90, 8, 1823);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(card, div, null);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const card_changes = {};
    			if (dirty & /*$userGraveyard*/ 1) card_changes.card = /*card*/ ctx[1];
    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(card);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(90:4) {#each $userGraveyard as card, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let div;
    	let current;
    	let each_value = /*$userGraveyard*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "graveyardList svelte-1bjlz5n");
    			add_location(div, file$g, 88, 0, 1749);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$userGraveyard*/ 1) {
    				each_value = /*$userGraveyard*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let $userGraveyard;
    	validate_store(userGraveyard, "userGraveyard");
    	component_subscribe($$self, userGraveyard, $$value => $$invalidate(0, $userGraveyard = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("GraveyardList", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GraveyardList> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ userGraveyard, Card, $userGraveyard });
    	return [$userGraveyard];
    }

    class GraveyardList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GraveyardList",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src\components\GraveyardSelector\GraveyardSelector.svelte generated by Svelte v3.29.4 */
    const file$h = "src\\components\\GraveyardSelector\\GraveyardSelector.svelte";

    function create_fragment$h(ctx) {
    	let div1;
    	let graveyardlist;
    	let t0;
    	let ringoffire;
    	let t1;
    	let div0;
    	let div1_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	graveyardlist = new GraveyardList({ $$inline: true });

    	ringoffire = new RingOfDoom({
    			props: { closing: /*closing*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			create_component(graveyardlist.$$.fragment);
    			t0 = space();
    			create_component(ringoffire.$$.fragment);
    			t1 = space();
    			div0 = element("div");
    			div0.textContent = "Close";
    			attr_dev(div0, "class", "closeButton svelte-1hhk58d");
    			add_location(div0, file$h, 150, 4, 2913);

    			attr_dev(div1, "class", div1_class_value = "graveyard " + (/*closing*/ ctx[0] ? "closing" : "") + " " + (/*$gameState*/ ctx[1].showUserGraveyard
    			? "show__graveyard"
    			: "") + " " + " svelte-1hhk58d");

    			add_location(div1, file$h, 146, 0, 2746);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			mount_component(graveyardlist, div1, null);
    			append_dev(div1, t0);
    			mount_component(ringoffire, div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*close*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const ringoffire_changes = {};
    			if (dirty & /*closing*/ 1) ringoffire_changes.closing = /*closing*/ ctx[0];
    			ringoffire.$set(ringoffire_changes);

    			if (!current || dirty & /*closing, $gameState*/ 3 && div1_class_value !== (div1_class_value = "graveyard " + (/*closing*/ ctx[0] ? "closing" : "") + " " + (/*$gameState*/ ctx[1].showUserGraveyard
    			? "show__graveyard"
    			: "") + " " + " svelte-1hhk58d")) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(graveyardlist.$$.fragment, local);
    			transition_in(ringoffire.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(graveyardlist.$$.fragment, local);
    			transition_out(ringoffire.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(graveyardlist);
    			destroy_component(ringoffire);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let $gameState;
    	validate_store(gameState, "gameState");
    	component_subscribe($$self, gameState, $$value => $$invalidate(1, $gameState = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("GraveyardSelector", slots, []);
    	let closing = false;

    	const close = () => {
    		$$invalidate(0, closing = true);

    		setTimeout(
    			() => {
    				$$invalidate(0, closing = false);
    				gameState.update(game => ({ ...game, showUserGraveyard: false }));
    			},
    			1800
    		);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GraveyardSelector> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		gameState,
    		RingOfFire: RingOfDoom,
    		GraveyardList,
    		closing,
    		close,
    		$gameState
    	});

    	$$self.$inject_state = $$props => {
    		if ("closing" in $$props) $$invalidate(0, closing = $$props.closing);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [closing, $gameState, close];
    }

    class GraveyardSelector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GraveyardSelector",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* src\components\GameOverModal\GameOver.svelte generated by Svelte v3.29.4 */
    const file$i = "src\\components\\GameOverModal\\GameOver.svelte";

    // (132:4) {:else}
    function create_else_block$3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "You Lose!";
    			attr_dev(p, "class", "svelte-19e68a1");
    			add_location(p, file$i, 132, 8, 3376);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(132:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (130:4) {#if $gameState.userWins}
    function create_if_block$7(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "You Win!";
    			attr_dev(p, "class", "svelte-19e68a1");
    			add_location(p, file$i, 130, 8, 3340);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(130:4) {#if $gameState.userWins}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let div;
    	let div_class_value;

    	function select_block_type(ctx, dirty) {
    		if (/*$gameState*/ ctx[0].userWins) return create_if_block$7;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", div_class_value = "gameOverModal " + (/*$gameState*/ ctx[0].gameOver ? "gameover" : "") + " " + " svelte-19e68a1");
    			add_location(div, file$i, 128, 0, 3233);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}

    			if (dirty & /*$gameState*/ 1 && div_class_value !== (div_class_value = "gameOverModal " + (/*$gameState*/ ctx[0].gameOver ? "gameover" : "") + " " + " svelte-19e68a1")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let $gameState;
    	validate_store(gameState, "gameState");
    	component_subscribe($$self, gameState, $$value => $$invalidate(0, $gameState = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("GameOver", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GameOver> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ gameState, $gameState });
    	return [$gameState];
    }

    class GameOver extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GameOver",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }

    /* src\components\Card\CastSpell.svelte generated by Svelte v3.29.4 */

    const { console: console_1$3 } = globals;
    const file$j = "src\\components\\Card\\CastSpell.svelte";

    function create_fragment$j(ctx) {
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			div1.textContent = "lorem ipsum dolem forum marius saurisus.";
    			attr_dev(img, "class", "cardImg svelte-14ppu89");
    			if (img.src !== (img_src_value = "./images/nethergrasp.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "a eeeviiil card");
    			add_location(img, file$j, 121, 4, 2436);
    			attr_dev(div0, "class", "imgContainer svelte-14ppu89");
    			set_style(div0, "background-color", /*card*/ ctx[0].imgPath);
    			add_location(div0, file$j, 117, 3, 2300);
    			attr_dev(div1, "class", "cardText svelte-14ppu89");
    			add_location(div1, file$j, 127, 3, 2544);
    			attr_dev(div2, "class", "spell card papa-hand1 high-light svelte-14ppu89");
    			add_location(div2, file$j, 113, 1, 2211);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);

    			if (!mounted) {
    				dispose = listen_dev(div2, "mousedown", downHandler$1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*card*/ 1) {
    				set_style(div0, "background-color", /*card*/ ctx[0].imgPath);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function downHandler$1(e) {
    	e.preventDefault();
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("CastSpell", slots, []);
    	let { spellPlayedID } = $$props;
    	let card;
    	const writable_props = ["spellPlayedID"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<CastSpell> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("spellPlayedID" in $$props) $$invalidate(1, spellPlayedID = $$props.spellPlayedID);
    	};

    	$$self.$capture_state = () => ({
    		spellPlayedID,
    		get: get_store_value,
    		opponentHand,
    		opponentGraveyard,
    		card,
    		downHandler: downHandler$1
    	});

    	$$self.$inject_state = $$props => {
    		if ("spellPlayedID" in $$props) $$invalidate(1, spellPlayedID = $$props.spellPlayedID);
    		if ("card" in $$props) $$invalidate(0, card = $$props.card);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*spellPlayedID, card*/ 3) {
    			 if (spellPlayedID) {
    				console.log(spellPlayedID, "spell played");
    				$$invalidate(0, card = get_store_value(opponentHand).find(card => card.id === spellPlayedID));

    				if (!card) {
    					$$invalidate(0, card = get_store_value(opponentGraveyard).find(card => card.id === spellPlayedID));
    				}

    				console.log(card);
    			}
    		}
    	};

    	return [card, spellPlayedID];
    }

    class CastSpell extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, { spellPlayedID: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CastSpell",
    			options,
    			id: create_fragment$j.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*spellPlayedID*/ ctx[1] === undefined && !("spellPlayedID" in props)) {
    			console_1$3.warn("<CastSpell> was created without expected prop 'spellPlayedID'");
    		}
    	}

    	get spellPlayedID() {
    		throw new Error("<CastSpell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set spellPlayedID(value) {
    		throw new Error("<CastSpell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    	  path: basedir,
    	  exports: {},
    	  require: function (path, base) {
          return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
        }
    	}, fn(module, module.exports), module.exports;
    }

    function getCjsExportFromNamespace (n) {
    	return n && n['default'] || n;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    /**
     * Parses an URI
     *
     * @author Steven Levithan <stevenlevithan.com> (MIT license)
     * @api private
     */

    var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

    var parts = [
        'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
    ];

    var parseuri = function parseuri(str) {
        var src = str,
            b = str.indexOf('['),
            e = str.indexOf(']');

        if (b != -1 && e != -1) {
            str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
        }

        var m = re.exec(str || ''),
            uri = {},
            i = 14;

        while (i--) {
            uri[parts[i]] = m[i] || '';
        }

        if (b != -1 && e != -1) {
            uri.source = src;
            uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
            uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
            uri.ipv6uri = true;
        }

        uri.pathNames = pathNames(uri, uri['path']);
        uri.queryKey = queryKey(uri, uri['query']);

        return uri;
    };

    function pathNames(obj, path) {
        var regx = /\/{2,9}/g,
            names = path.replace(regx, "/").split("/");

        if (path.substr(0, 1) == '/' || path.length === 0) {
            names.splice(0, 1);
        }
        if (path.substr(path.length - 1, 1) == '/') {
            names.splice(names.length - 1, 1);
        }

        return names;
    }

    function queryKey(uri, query) {
        var data = {};

        query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, $1, $2) {
            if ($1) {
                data[$1] = $2;
            }
        });

        return data;
    }

    /**
     * Helpers.
     */

    var s = 1000;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var y = d * 365.25;

    /**
     * Parse or format the given `val`.
     *
     * Options:
     *
     *  - `long` verbose formatting [false]
     *
     * @param {String|Number} val
     * @param {Object} [options]
     * @throws {Error} throw an error if val is not a non-empty string or a number
     * @return {String|Number}
     * @api public
     */

    var ms = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === 'string' && val.length > 0) {
        return parse(val);
      } else if (type === 'number' && isNaN(val) === false) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        'val is not a non-empty string or a valid number. val=' +
          JSON.stringify(val)
      );
    };

    /**
     * Parse the given `str` and return milliseconds.
     *
     * @param {String} str
     * @return {Number}
     * @api private
     */

    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || 'ms').toLowerCase();
      switch (type) {
        case 'years':
        case 'year':
        case 'yrs':
        case 'yr':
        case 'y':
          return n * y;
        case 'days':
        case 'day':
        case 'd':
          return n * d;
        case 'hours':
        case 'hour':
        case 'hrs':
        case 'hr':
        case 'h':
          return n * h;
        case 'minutes':
        case 'minute':
        case 'mins':
        case 'min':
        case 'm':
          return n * m;
        case 'seconds':
        case 'second':
        case 'secs':
        case 'sec':
        case 's':
          return n * s;
        case 'milliseconds':
        case 'millisecond':
        case 'msecs':
        case 'msec':
        case 'ms':
          return n;
        default:
          return undefined;
      }
    }

    /**
     * Short format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

    function fmtShort(ms) {
      if (ms >= d) {
        return Math.round(ms / d) + 'd';
      }
      if (ms >= h) {
        return Math.round(ms / h) + 'h';
      }
      if (ms >= m) {
        return Math.round(ms / m) + 'm';
      }
      if (ms >= s) {
        return Math.round(ms / s) + 's';
      }
      return ms + 'ms';
    }

    /**
     * Long format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

    function fmtLong(ms) {
      return plural(ms, d, 'day') ||
        plural(ms, h, 'hour') ||
        plural(ms, m, 'minute') ||
        plural(ms, s, 'second') ||
        ms + ' ms';
    }

    /**
     * Pluralization helper.
     */

    function plural(ms, n, name) {
      if (ms < n) {
        return;
      }
      if (ms < n * 1.5) {
        return Math.floor(ms / n) + ' ' + name;
      }
      return Math.ceil(ms / n) + ' ' + name + 's';
    }

    var debug = createCommonjsModule(function (module, exports) {
    /**
     * This is the common logic for both the Node.js and web browser
     * implementations of `debug()`.
     *
     * Expose `debug()` as the module.
     */

    exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
    exports.coerce = coerce;
    exports.disable = disable;
    exports.enable = enable;
    exports.enabled = enabled;
    exports.humanize = ms;

    /**
     * Active `debug` instances.
     */
    exports.instances = [];

    /**
     * The currently active debug mode names, and names to skip.
     */

    exports.names = [];
    exports.skips = [];

    /**
     * Map of special "%n" handling functions, for the debug "format" argument.
     *
     * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
     */

    exports.formatters = {};

    /**
     * Select a color.
     * @param {String} namespace
     * @return {Number}
     * @api private
     */

    function selectColor(namespace) {
      var hash = 0, i;

      for (i in namespace) {
        hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }

      return exports.colors[Math.abs(hash) % exports.colors.length];
    }

    /**
     * Create a debugger with the given `namespace`.
     *
     * @param {String} namespace
     * @return {Function}
     * @api public
     */

    function createDebug(namespace) {

      var prevTime;

      function debug() {
        // disabled?
        if (!debug.enabled) return;

        var self = debug;

        // set `diff` timestamp
        var curr = +new Date();
        var ms = curr - (prevTime || curr);
        self.diff = ms;
        self.prev = prevTime;
        self.curr = curr;
        prevTime = curr;

        // turn the `arguments` into a proper Array
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }

        args[0] = exports.coerce(args[0]);

        if ('string' !== typeof args[0]) {
          // anything else let's inspect with %O
          args.unshift('%O');
        }

        // apply any `formatters` transformations
        var index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
          // if we encounter an escaped % then don't increase the array index
          if (match === '%%') return match;
          index++;
          var formatter = exports.formatters[format];
          if ('function' === typeof formatter) {
            var val = args[index];
            match = formatter.call(self, val);

            // now we need to remove `args[index]` since it's inlined in the `format`
            args.splice(index, 1);
            index--;
          }
          return match;
        });

        // apply env-specific formatting (colors, etc.)
        exports.formatArgs.call(self, args);

        var logFn = debug.log || exports.log || console.log.bind(console);
        logFn.apply(self, args);
      }

      debug.namespace = namespace;
      debug.enabled = exports.enabled(namespace);
      debug.useColors = exports.useColors();
      debug.color = selectColor(namespace);
      debug.destroy = destroy;

      // env-specific initialization logic for debug instances
      if ('function' === typeof exports.init) {
        exports.init(debug);
      }

      exports.instances.push(debug);

      return debug;
    }

    function destroy () {
      var index = exports.instances.indexOf(this);
      if (index !== -1) {
        exports.instances.splice(index, 1);
        return true;
      } else {
        return false;
      }
    }

    /**
     * Enables a debug mode by namespaces. This can include modes
     * separated by a colon and wildcards.
     *
     * @param {String} namespaces
     * @api public
     */

    function enable(namespaces) {
      exports.save(namespaces);

      exports.names = [];
      exports.skips = [];

      var i;
      var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
      var len = split.length;

      for (i = 0; i < len; i++) {
        if (!split[i]) continue; // ignore empty strings
        namespaces = split[i].replace(/\*/g, '.*?');
        if (namespaces[0] === '-') {
          exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
        } else {
          exports.names.push(new RegExp('^' + namespaces + '$'));
        }
      }

      for (i = 0; i < exports.instances.length; i++) {
        var instance = exports.instances[i];
        instance.enabled = exports.enabled(instance.namespace);
      }
    }

    /**
     * Disable debug output.
     *
     * @api public
     */

    function disable() {
      exports.enable('');
    }

    /**
     * Returns true if the given mode name is enabled, false otherwise.
     *
     * @param {String} name
     * @return {Boolean}
     * @api public
     */

    function enabled(name) {
      if (name[name.length - 1] === '*') {
        return true;
      }
      var i, len;
      for (i = 0, len = exports.skips.length; i < len; i++) {
        if (exports.skips[i].test(name)) {
          return false;
        }
      }
      for (i = 0, len = exports.names.length; i < len; i++) {
        if (exports.names[i].test(name)) {
          return true;
        }
      }
      return false;
    }

    /**
     * Coerce `val`.
     *
     * @param {Mixed} val
     * @return {Mixed}
     * @api private
     */

    function coerce(val) {
      if (val instanceof Error) return val.stack || val.message;
      return val;
    }
    });

    var browser = createCommonjsModule(function (module, exports) {
    /**
     * This is the web browser implementation of `debug()`.
     *
     * Expose `debug()` as the module.
     */

    exports = module.exports = debug;
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = 'undefined' != typeof chrome
                   && 'undefined' != typeof chrome.storage
                      ? chrome.storage.local
                      : localstorage();

    /**
     * Colors.
     */

    exports.colors = [
      '#0000CC', '#0000FF', '#0033CC', '#0033FF', '#0066CC', '#0066FF', '#0099CC',
      '#0099FF', '#00CC00', '#00CC33', '#00CC66', '#00CC99', '#00CCCC', '#00CCFF',
      '#3300CC', '#3300FF', '#3333CC', '#3333FF', '#3366CC', '#3366FF', '#3399CC',
      '#3399FF', '#33CC00', '#33CC33', '#33CC66', '#33CC99', '#33CCCC', '#33CCFF',
      '#6600CC', '#6600FF', '#6633CC', '#6633FF', '#66CC00', '#66CC33', '#9900CC',
      '#9900FF', '#9933CC', '#9933FF', '#99CC00', '#99CC33', '#CC0000', '#CC0033',
      '#CC0066', '#CC0099', '#CC00CC', '#CC00FF', '#CC3300', '#CC3333', '#CC3366',
      '#CC3399', '#CC33CC', '#CC33FF', '#CC6600', '#CC6633', '#CC9900', '#CC9933',
      '#CCCC00', '#CCCC33', '#FF0000', '#FF0033', '#FF0066', '#FF0099', '#FF00CC',
      '#FF00FF', '#FF3300', '#FF3333', '#FF3366', '#FF3399', '#FF33CC', '#FF33FF',
      '#FF6600', '#FF6633', '#FF9900', '#FF9933', '#FFCC00', '#FFCC33'
    ];

    /**
     * Currently only WebKit-based Web Inspectors, Firefox >= v31,
     * and the Firebug extension (any Firefox version) are known
     * to support "%c" CSS customizations.
     *
     * TODO: add a `localStorage` variable to explicitly enable/disable colors
     */

    function useColors() {
      // NB: In an Electron preload script, document will be defined but not fully
      // initialized. Since we know we're in Chrome, we'll just detect this case
      // explicitly
      if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
        return true;
      }

      // Internet Explorer and Edge do not support colors.
      if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      }

      // is webkit? http://stackoverflow.com/a/16459606/376773
      // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
      return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
        // is firebug? http://stackoverflow.com/a/398120/376773
        (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
        // is firefox >= v31?
        // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
        (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
        // double check webkit in userAgent just in case we are in a worker
        (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
    }

    /**
     * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
     */

    exports.formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (err) {
        return '[UnexpectedJSONParseError]: ' + err.message;
      }
    };


    /**
     * Colorize log arguments if enabled.
     *
     * @api public
     */

    function formatArgs(args) {
      var useColors = this.useColors;

      args[0] = (useColors ? '%c' : '')
        + this.namespace
        + (useColors ? ' %c' : ' ')
        + args[0]
        + (useColors ? '%c ' : ' ')
        + '+' + exports.humanize(this.diff);

      if (!useColors) return;

      var c = 'color: ' + this.color;
      args.splice(1, 0, c, 'color: inherit');

      // the final "%c" is somewhat tricky, because there could be other
      // arguments passed either before or after the %c, so we need to
      // figure out the correct index to insert the CSS into
      var index = 0;
      var lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, function(match) {
        if ('%%' === match) return;
        index++;
        if ('%c' === match) {
          // we only are interested in the *last* %c
          // (the user may have provided their own)
          lastC = index;
        }
      });

      args.splice(lastC, 0, c);
    }

    /**
     * Invokes `console.log()` when available.
     * No-op when `console.log` is not a "function".
     *
     * @api public
     */

    function log() {
      // this hackery is required for IE8/9, where
      // the `console.log` function doesn't have 'apply'
      return 'object' === typeof console
        && console.log
        && Function.prototype.apply.call(console.log, console, arguments);
    }

    /**
     * Save `namespaces`.
     *
     * @param {String} namespaces
     * @api private
     */

    function save(namespaces) {
      try {
        if (null == namespaces) {
          exports.storage.removeItem('debug');
        } else {
          exports.storage.debug = namespaces;
        }
      } catch(e) {}
    }

    /**
     * Load `namespaces`.
     *
     * @return {String} returns the previously persisted debug modes
     * @api private
     */

    function load() {
      var r;
      try {
        r = exports.storage.debug;
      } catch(e) {}

      // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
      if (!r && typeof process !== 'undefined' && 'env' in process) {
        r = process.env.DEBUG;
      }

      return r;
    }

    /**
     * Enable namespaces listed in `localStorage.debug` initially.
     */

    exports.enable(load());

    /**
     * Localstorage attempts to return the localstorage.
     *
     * This is necessary because safari throws
     * when a user disables cookies/localstorage
     * and you attempt to access it.
     *
     * @return {LocalStorage}
     * @api private
     */

    function localstorage() {
      try {
        return window.localStorage;
      } catch (e) {}
    }
    });

    /**
     * Module dependencies.
     */


    var debug$1 = browser('socket.io-client:url');

    /**
     * Module exports.
     */

    var url_1 = url;

    /**
     * URL parser.
     *
     * @param {String} url
     * @param {Object} An object meant to mimic window.location.
     *                 Defaults to window.location.
     * @api public
     */

    function url (uri, loc) {
      var obj = uri;

      // default to window.location
      loc = loc || (typeof location !== 'undefined' && location);
      if (null == uri) uri = loc.protocol + '//' + loc.host;

      // relative path support
      if ('string' === typeof uri) {
        if ('/' === uri.charAt(0)) {
          if ('/' === uri.charAt(1)) {
            uri = loc.protocol + uri;
          } else {
            uri = loc.host + uri;
          }
        }

        if (!/^(https?|wss?):\/\//.test(uri)) {
          debug$1('protocol-less url %s', uri);
          if ('undefined' !== typeof loc) {
            uri = loc.protocol + '//' + uri;
          } else {
            uri = 'https://' + uri;
          }
        }

        // parse
        debug$1('parse %s', uri);
        obj = parseuri(uri);
      }

      // make sure we treat `localhost:80` and `localhost` equally
      if (!obj.port) {
        if (/^(http|ws)$/.test(obj.protocol)) {
          obj.port = '80';
        } else if (/^(http|ws)s$/.test(obj.protocol)) {
          obj.port = '443';
        }
      }

      obj.path = obj.path || '/';

      var ipv6 = obj.host.indexOf(':') !== -1;
      var host = ipv6 ? '[' + obj.host + ']' : obj.host;

      // define unique id
      obj.id = obj.protocol + '://' + host + ':' + obj.port;
      // define href
      obj.href = obj.protocol + '://' + host + (loc && loc.port === obj.port ? '' : (':' + obj.port));

      return obj;
    }

    var componentEmitter = createCommonjsModule(function (module) {
    /**
     * Expose `Emitter`.
     */

    {
      module.exports = Emitter;
    }

    /**
     * Initialize a new `Emitter`.
     *
     * @api public
     */

    function Emitter(obj) {
      if (obj) return mixin(obj);
    }
    /**
     * Mixin the emitter properties.
     *
     * @param {Object} obj
     * @return {Object}
     * @api private
     */

    function mixin(obj) {
      for (var key in Emitter.prototype) {
        obj[key] = Emitter.prototype[key];
      }
      return obj;
    }

    /**
     * Listen on the given `event` with `fn`.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.on =
    Emitter.prototype.addEventListener = function(event, fn){
      this._callbacks = this._callbacks || {};
      (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
        .push(fn);
      return this;
    };

    /**
     * Adds an `event` listener that will be invoked a single
     * time then automatically removed.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.once = function(event, fn){
      function on() {
        this.off(event, on);
        fn.apply(this, arguments);
      }

      on.fn = fn;
      this.on(event, on);
      return this;
    };

    /**
     * Remove the given callback for `event` or all
     * registered callbacks.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.off =
    Emitter.prototype.removeListener =
    Emitter.prototype.removeAllListeners =
    Emitter.prototype.removeEventListener = function(event, fn){
      this._callbacks = this._callbacks || {};

      // all
      if (0 == arguments.length) {
        this._callbacks = {};
        return this;
      }

      // specific event
      var callbacks = this._callbacks['$' + event];
      if (!callbacks) return this;

      // remove all handlers
      if (1 == arguments.length) {
        delete this._callbacks['$' + event];
        return this;
      }

      // remove specific handler
      var cb;
      for (var i = 0; i < callbacks.length; i++) {
        cb = callbacks[i];
        if (cb === fn || cb.fn === fn) {
          callbacks.splice(i, 1);
          break;
        }
      }

      // Remove event specific arrays for event types that no
      // one is subscribed for to avoid memory leak.
      if (callbacks.length === 0) {
        delete this._callbacks['$' + event];
      }

      return this;
    };

    /**
     * Emit `event` with the given args.
     *
     * @param {String} event
     * @param {Mixed} ...
     * @return {Emitter}
     */

    Emitter.prototype.emit = function(event){
      this._callbacks = this._callbacks || {};

      var args = new Array(arguments.length - 1)
        , callbacks = this._callbacks['$' + event];

      for (var i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i];
      }

      if (callbacks) {
        callbacks = callbacks.slice(0);
        for (var i = 0, len = callbacks.length; i < len; ++i) {
          callbacks[i].apply(this, args);
        }
      }

      return this;
    };

    /**
     * Return array of callbacks for `event`.
     *
     * @param {String} event
     * @return {Array}
     * @api public
     */

    Emitter.prototype.listeners = function(event){
      this._callbacks = this._callbacks || {};
      return this._callbacks['$' + event] || [];
    };

    /**
     * Check if this emitter has `event` handlers.
     *
     * @param {String} event
     * @return {Boolean}
     * @api public
     */

    Emitter.prototype.hasListeners = function(event){
      return !! this.listeners(event).length;
    };
    });

    var toString$1 = {}.toString;

    var isarray = Array.isArray || function (arr) {
      return toString$1.call(arr) == '[object Array]';
    };

    var isBuffer = isBuf;

    var withNativeBuffer = typeof Buffer === 'function' && typeof Buffer.isBuffer === 'function';
    var withNativeArrayBuffer = typeof ArrayBuffer === 'function';

    var isView = function (obj) {
      return typeof ArrayBuffer.isView === 'function' ? ArrayBuffer.isView(obj) : (obj.buffer instanceof ArrayBuffer);
    };

    /**
     * Returns true if obj is a buffer or an arraybuffer.
     *
     * @api private
     */

    function isBuf(obj) {
      return (withNativeBuffer && Buffer.isBuffer(obj)) ||
              (withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj)));
    }

    /*global Blob,File*/

    /**
     * Module requirements
     */



    var toString$2 = Object.prototype.toString;
    var withNativeBlob = typeof Blob === 'function' || (typeof Blob !== 'undefined' && toString$2.call(Blob) === '[object BlobConstructor]');
    var withNativeFile = typeof File === 'function' || (typeof File !== 'undefined' && toString$2.call(File) === '[object FileConstructor]');

    /**
     * Replaces every Buffer | ArrayBuffer in packet with a numbered placeholder.
     * Anything with blobs or files should be fed through removeBlobs before coming
     * here.
     *
     * @param {Object} packet - socket.io event packet
     * @return {Object} with deconstructed packet and list of buffers
     * @api public
     */

    var deconstructPacket = function(packet) {
      var buffers = [];
      var packetData = packet.data;
      var pack = packet;
      pack.data = _deconstructPacket(packetData, buffers);
      pack.attachments = buffers.length; // number of binary 'attachments'
      return {packet: pack, buffers: buffers};
    };

    function _deconstructPacket(data, buffers) {
      if (!data) return data;

      if (isBuffer(data)) {
        var placeholder = { _placeholder: true, num: buffers.length };
        buffers.push(data);
        return placeholder;
      } else if (isarray(data)) {
        var newData = new Array(data.length);
        for (var i = 0; i < data.length; i++) {
          newData[i] = _deconstructPacket(data[i], buffers);
        }
        return newData;
      } else if (typeof data === 'object' && !(data instanceof Date)) {
        var newData = {};
        for (var key in data) {
          newData[key] = _deconstructPacket(data[key], buffers);
        }
        return newData;
      }
      return data;
    }

    /**
     * Reconstructs a binary packet from its placeholder packet and buffers
     *
     * @param {Object} packet - event packet with placeholders
     * @param {Array} buffers - binary buffers to put in placeholder positions
     * @return {Object} reconstructed packet
     * @api public
     */

    var reconstructPacket = function(packet, buffers) {
      packet.data = _reconstructPacket(packet.data, buffers);
      packet.attachments = undefined; // no longer useful
      return packet;
    };

    function _reconstructPacket(data, buffers) {
      if (!data) return data;

      if (data && data._placeholder) {
        return buffers[data.num]; // appropriate buffer (should be natural order anyway)
      } else if (isarray(data)) {
        for (var i = 0; i < data.length; i++) {
          data[i] = _reconstructPacket(data[i], buffers);
        }
      } else if (typeof data === 'object') {
        for (var key in data) {
          data[key] = _reconstructPacket(data[key], buffers);
        }
      }

      return data;
    }

    /**
     * Asynchronously removes Blobs or Files from data via
     * FileReader's readAsArrayBuffer method. Used before encoding
     * data as msgpack. Calls callback with the blobless data.
     *
     * @param {Object} data
     * @param {Function} callback
     * @api private
     */

    var removeBlobs = function(data, callback) {
      function _removeBlobs(obj, curKey, containingObject) {
        if (!obj) return obj;

        // convert any blob
        if ((withNativeBlob && obj instanceof Blob) ||
            (withNativeFile && obj instanceof File)) {
          pendingBlobs++;

          // async filereader
          var fileReader = new FileReader();
          fileReader.onload = function() { // this.result == arraybuffer
            if (containingObject) {
              containingObject[curKey] = this.result;
            }
            else {
              bloblessData = this.result;
            }

            // if nothing pending its callback time
            if(! --pendingBlobs) {
              callback(bloblessData);
            }
          };

          fileReader.readAsArrayBuffer(obj); // blob -> arraybuffer
        } else if (isarray(obj)) { // handle array
          for (var i = 0; i < obj.length; i++) {
            _removeBlobs(obj[i], i, obj);
          }
        } else if (typeof obj === 'object' && !isBuffer(obj)) { // and object
          for (var key in obj) {
            _removeBlobs(obj[key], key, obj);
          }
        }
      }

      var pendingBlobs = 0;
      var bloblessData = data;
      _removeBlobs(bloblessData);
      if (!pendingBlobs) {
        callback(bloblessData);
      }
    };

    var binary = {
    	deconstructPacket: deconstructPacket,
    	reconstructPacket: reconstructPacket,
    	removeBlobs: removeBlobs
    };

    var socket_ioParser = createCommonjsModule(function (module, exports) {
    /**
     * Module dependencies.
     */

    var debug = browser('socket.io-parser');





    /**
     * Protocol version.
     *
     * @api public
     */

    exports.protocol = 4;

    /**
     * Packet types.
     *
     * @api public
     */

    exports.types = [
      'CONNECT',
      'DISCONNECT',
      'EVENT',
      'ACK',
      'ERROR',
      'BINARY_EVENT',
      'BINARY_ACK'
    ];

    /**
     * Packet type `connect`.
     *
     * @api public
     */

    exports.CONNECT = 0;

    /**
     * Packet type `disconnect`.
     *
     * @api public
     */

    exports.DISCONNECT = 1;

    /**
     * Packet type `event`.
     *
     * @api public
     */

    exports.EVENT = 2;

    /**
     * Packet type `ack`.
     *
     * @api public
     */

    exports.ACK = 3;

    /**
     * Packet type `error`.
     *
     * @api public
     */

    exports.ERROR = 4;

    /**
     * Packet type 'binary event'
     *
     * @api public
     */

    exports.BINARY_EVENT = 5;

    /**
     * Packet type `binary ack`. For acks with binary arguments.
     *
     * @api public
     */

    exports.BINARY_ACK = 6;

    /**
     * Encoder constructor.
     *
     * @api public
     */

    exports.Encoder = Encoder;

    /**
     * Decoder constructor.
     *
     * @api public
     */

    exports.Decoder = Decoder;

    /**
     * A socket.io Encoder instance
     *
     * @api public
     */

    function Encoder() {}

    var ERROR_PACKET = exports.ERROR + '"encode error"';

    /**
     * Encode a packet as a single string if non-binary, or as a
     * buffer sequence, depending on packet type.
     *
     * @param {Object} obj - packet object
     * @param {Function} callback - function to handle encodings (likely engine.write)
     * @return Calls callback with Array of encodings
     * @api public
     */

    Encoder.prototype.encode = function(obj, callback){
      debug('encoding packet %j', obj);

      if (exports.BINARY_EVENT === obj.type || exports.BINARY_ACK === obj.type) {
        encodeAsBinary(obj, callback);
      } else {
        var encoding = encodeAsString(obj);
        callback([encoding]);
      }
    };

    /**
     * Encode packet as string.
     *
     * @param {Object} packet
     * @return {String} encoded
     * @api private
     */

    function encodeAsString(obj) {

      // first is type
      var str = '' + obj.type;

      // attachments if we have them
      if (exports.BINARY_EVENT === obj.type || exports.BINARY_ACK === obj.type) {
        str += obj.attachments + '-';
      }

      // if we have a namespace other than `/`
      // we append it followed by a comma `,`
      if (obj.nsp && '/' !== obj.nsp) {
        str += obj.nsp + ',';
      }

      // immediately followed by the id
      if (null != obj.id) {
        str += obj.id;
      }

      // json data
      if (null != obj.data) {
        var payload = tryStringify(obj.data);
        if (payload !== false) {
          str += payload;
        } else {
          return ERROR_PACKET;
        }
      }

      debug('encoded %j as %s', obj, str);
      return str;
    }

    function tryStringify(str) {
      try {
        return JSON.stringify(str);
      } catch(e){
        return false;
      }
    }

    /**
     * Encode packet as 'buffer sequence' by removing blobs, and
     * deconstructing packet into object with placeholders and
     * a list of buffers.
     *
     * @param {Object} packet
     * @return {Buffer} encoded
     * @api private
     */

    function encodeAsBinary(obj, callback) {

      function writeEncoding(bloblessData) {
        var deconstruction = binary.deconstructPacket(bloblessData);
        var pack = encodeAsString(deconstruction.packet);
        var buffers = deconstruction.buffers;

        buffers.unshift(pack); // add packet info to beginning of data list
        callback(buffers); // write all the buffers
      }

      binary.removeBlobs(obj, writeEncoding);
    }

    /**
     * A socket.io Decoder instance
     *
     * @return {Object} decoder
     * @api public
     */

    function Decoder() {
      this.reconstructor = null;
    }

    /**
     * Mix in `Emitter` with Decoder.
     */

    componentEmitter(Decoder.prototype);

    /**
     * Decodes an encoded packet string into packet JSON.
     *
     * @param {String} obj - encoded packet
     * @return {Object} packet
     * @api public
     */

    Decoder.prototype.add = function(obj) {
      var packet;
      if (typeof obj === 'string') {
        packet = decodeString(obj);
        if (exports.BINARY_EVENT === packet.type || exports.BINARY_ACK === packet.type) { // binary packet's json
          this.reconstructor = new BinaryReconstructor(packet);

          // no attachments, labeled binary but no binary data to follow
          if (this.reconstructor.reconPack.attachments === 0) {
            this.emit('decoded', packet);
          }
        } else { // non-binary full packet
          this.emit('decoded', packet);
        }
      } else if (isBuffer(obj) || obj.base64) { // raw binary data
        if (!this.reconstructor) {
          throw new Error('got binary data when not reconstructing a packet');
        } else {
          packet = this.reconstructor.takeBinaryData(obj);
          if (packet) { // received final buffer
            this.reconstructor = null;
            this.emit('decoded', packet);
          }
        }
      } else {
        throw new Error('Unknown type: ' + obj);
      }
    };

    /**
     * Decode a packet String (JSON data)
     *
     * @param {String} str
     * @return {Object} packet
     * @api private
     */

    function decodeString(str) {
      var i = 0;
      // look up type
      var p = {
        type: Number(str.charAt(0))
      };

      if (null == exports.types[p.type]) {
        return error('unknown packet type ' + p.type);
      }

      // look up attachments if type binary
      if (exports.BINARY_EVENT === p.type || exports.BINARY_ACK === p.type) {
        var buf = '';
        while (str.charAt(++i) !== '-') {
          buf += str.charAt(i);
          if (i == str.length) break;
        }
        if (buf != Number(buf) || str.charAt(i) !== '-') {
          throw new Error('Illegal attachments');
        }
        p.attachments = Number(buf);
      }

      // look up namespace (if any)
      if ('/' === str.charAt(i + 1)) {
        p.nsp = '';
        while (++i) {
          var c = str.charAt(i);
          if (',' === c) break;
          p.nsp += c;
          if (i === str.length) break;
        }
      } else {
        p.nsp = '/';
      }

      // look up id
      var next = str.charAt(i + 1);
      if ('' !== next && Number(next) == next) {
        p.id = '';
        while (++i) {
          var c = str.charAt(i);
          if (null == c || Number(c) != c) {
            --i;
            break;
          }
          p.id += str.charAt(i);
          if (i === str.length) break;
        }
        p.id = Number(p.id);
      }

      // look up json data
      if (str.charAt(++i)) {
        var payload = tryParse(str.substr(i));
        var isPayloadValid = payload !== false && (p.type === exports.ERROR || isarray(payload));
        if (isPayloadValid) {
          p.data = payload;
        } else {
          return error('invalid payload');
        }
      }

      debug('decoded %s as %j', str, p);
      return p;
    }

    function tryParse(str) {
      try {
        return JSON.parse(str);
      } catch(e){
        return false;
      }
    }

    /**
     * Deallocates a parser's resources
     *
     * @api public
     */

    Decoder.prototype.destroy = function() {
      if (this.reconstructor) {
        this.reconstructor.finishedReconstruction();
      }
    };

    /**
     * A manager of a binary event's 'buffer sequence'. Should
     * be constructed whenever a packet of type BINARY_EVENT is
     * decoded.
     *
     * @param {Object} packet
     * @return {BinaryReconstructor} initialized reconstructor
     * @api private
     */

    function BinaryReconstructor(packet) {
      this.reconPack = packet;
      this.buffers = [];
    }

    /**
     * Method to be called when binary data received from connection
     * after a BINARY_EVENT packet.
     *
     * @param {Buffer | ArrayBuffer} binData - the raw binary data received
     * @return {null | Object} returns null if more binary data is expected or
     *   a reconstructed packet object if all buffers have been received.
     * @api private
     */

    BinaryReconstructor.prototype.takeBinaryData = function(binData) {
      this.buffers.push(binData);
      if (this.buffers.length === this.reconPack.attachments) { // done with buffer list
        var packet = binary.reconstructPacket(this.reconPack, this.buffers);
        this.finishedReconstruction();
        return packet;
      }
      return null;
    };

    /**
     * Cleans up binary packet reconstruction variables.
     *
     * @api private
     */

    BinaryReconstructor.prototype.finishedReconstruction = function() {
      this.reconPack = null;
      this.buffers = [];
    };

    function error(msg) {
      return {
        type: exports.ERROR,
        data: 'parser error: ' + msg
      };
    }
    });

    var hasCors = createCommonjsModule(function (module) {
    /**
     * Module exports.
     *
     * Logic borrowed from Modernizr:
     *
     *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
     */

    try {
      module.exports = typeof XMLHttpRequest !== 'undefined' &&
        'withCredentials' in new XMLHttpRequest();
    } catch (err) {
      // if XMLHttp support is disabled in IE then it will throw
      // when trying to create
      module.exports = false;
    }
    });

    var globalThis_browser = (function () {
      if (typeof self !== 'undefined') {
        return self;
      } else if (typeof window !== 'undefined') {
        return window;
      } else {
        return Function('return this')(); // eslint-disable-line no-new-func
      }
    })();

    // browser shim for xmlhttprequest module




    var xmlhttprequest = function (opts) {
      var xdomain = opts.xdomain;

      // scheme must be same when usign XDomainRequest
      // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
      var xscheme = opts.xscheme;

      // XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
      // https://github.com/Automattic/engine.io-client/pull/217
      var enablesXDR = opts.enablesXDR;

      // XMLHttpRequest can be disabled on IE
      try {
        if ('undefined' !== typeof XMLHttpRequest && (!xdomain || hasCors)) {
          return new XMLHttpRequest();
        }
      } catch (e) { }

      // Use XDomainRequest for IE8 if enablesXDR is true
      // because loading bar keeps flashing when using jsonp-polling
      // https://github.com/yujiosaka/socke.io-ie8-loading-example
      try {
        if ('undefined' !== typeof XDomainRequest && !xscheme && enablesXDR) {
          return new XDomainRequest();
        }
      } catch (e) { }

      if (!xdomain) {
        try {
          return new globalThis_browser[['Active'].concat('Object').join('X')]('Microsoft.XMLHTTP');
        } catch (e) { }
      }
    };

    /**
     * Gets the keys for an object.
     *
     * @return {Array} keys
     * @api private
     */

    var keys = Object.keys || function keys (obj){
      var arr = [];
      var has = Object.prototype.hasOwnProperty;

      for (var i in obj) {
        if (has.call(obj, i)) {
          arr.push(i);
        }
      }
      return arr;
    };

    /* global Blob File */

    /*
     * Module requirements.
     */



    var toString$3 = Object.prototype.toString;
    var withNativeBlob$1 = typeof Blob === 'function' ||
                            typeof Blob !== 'undefined' && toString$3.call(Blob) === '[object BlobConstructor]';
    var withNativeFile$1 = typeof File === 'function' ||
                            typeof File !== 'undefined' && toString$3.call(File) === '[object FileConstructor]';

    /**
     * Module exports.
     */

    var hasBinary2 = hasBinary;

    /**
     * Checks for binary data.
     *
     * Supports Buffer, ArrayBuffer, Blob and File.
     *
     * @param {Object} anything
     * @api public
     */

    function hasBinary (obj) {
      if (!obj || typeof obj !== 'object') {
        return false;
      }

      if (isarray(obj)) {
        for (var i = 0, l = obj.length; i < l; i++) {
          if (hasBinary(obj[i])) {
            return true;
          }
        }
        return false;
      }

      if ((typeof Buffer === 'function' && Buffer.isBuffer && Buffer.isBuffer(obj)) ||
        (typeof ArrayBuffer === 'function' && obj instanceof ArrayBuffer) ||
        (withNativeBlob$1 && obj instanceof Blob) ||
        (withNativeFile$1 && obj instanceof File)
      ) {
        return true;
      }

      // see: https://github.com/Automattic/has-binary/pull/4
      if (obj.toJSON && typeof obj.toJSON === 'function' && arguments.length === 1) {
        return hasBinary(obj.toJSON(), true);
      }

      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
          return true;
        }
      }

      return false;
    }

    /**
     * An abstraction for slicing an arraybuffer even when
     * ArrayBuffer.prototype.slice is not supported
     *
     * @api public
     */

    var arraybuffer_slice = function(arraybuffer, start, end) {
      var bytes = arraybuffer.byteLength;
      start = start || 0;
      end = end || bytes;

      if (arraybuffer.slice) { return arraybuffer.slice(start, end); }

      if (start < 0) { start += bytes; }
      if (end < 0) { end += bytes; }
      if (end > bytes) { end = bytes; }

      if (start >= bytes || start >= end || bytes === 0) {
        return new ArrayBuffer(0);
      }

      var abv = new Uint8Array(arraybuffer);
      var result = new Uint8Array(end - start);
      for (var i = start, ii = 0; i < end; i++, ii++) {
        result[ii] = abv[i];
      }
      return result.buffer;
    };

    var after_1 = after;

    function after(count, callback, err_cb) {
        var bail = false;
        err_cb = err_cb || noop$1;
        proxy.count = count;

        return (count === 0) ? callback() : proxy

        function proxy(err, result) {
            if (proxy.count <= 0) {
                throw new Error('after called too many times')
            }
            --proxy.count;

            // after first error, rest are passed to err_cb
            if (err) {
                bail = true;
                callback(err);
                // future error callbacks will go to error handler
                callback = err_cb;
            } else if (proxy.count === 0 && !bail) {
                callback(null, result);
            }
        }
    }

    function noop$1() {}

    /*! https://mths.be/utf8js v2.1.2 by @mathias */

    var stringFromCharCode = String.fromCharCode;

    // Taken from https://mths.be/punycode
    function ucs2decode(string) {
    	var output = [];
    	var counter = 0;
    	var length = string.length;
    	var value;
    	var extra;
    	while (counter < length) {
    		value = string.charCodeAt(counter++);
    		if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
    			// high surrogate, and there is a next character
    			extra = string.charCodeAt(counter++);
    			if ((extra & 0xFC00) == 0xDC00) { // low surrogate
    				output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
    			} else {
    				// unmatched surrogate; only append this code unit, in case the next
    				// code unit is the high surrogate of a surrogate pair
    				output.push(value);
    				counter--;
    			}
    		} else {
    			output.push(value);
    		}
    	}
    	return output;
    }

    // Taken from https://mths.be/punycode
    function ucs2encode(array) {
    	var length = array.length;
    	var index = -1;
    	var value;
    	var output = '';
    	while (++index < length) {
    		value = array[index];
    		if (value > 0xFFFF) {
    			value -= 0x10000;
    			output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
    			value = 0xDC00 | value & 0x3FF;
    		}
    		output += stringFromCharCode(value);
    	}
    	return output;
    }

    function checkScalarValue(codePoint, strict) {
    	if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
    		if (strict) {
    			throw Error(
    				'Lone surrogate U+' + codePoint.toString(16).toUpperCase() +
    				' is not a scalar value'
    			);
    		}
    		return false;
    	}
    	return true;
    }
    /*--------------------------------------------------------------------------*/

    function createByte(codePoint, shift) {
    	return stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
    }

    function encodeCodePoint(codePoint, strict) {
    	if ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence
    		return stringFromCharCode(codePoint);
    	}
    	var symbol = '';
    	if ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence
    		symbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
    	}
    	else if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence
    		if (!checkScalarValue(codePoint, strict)) {
    			codePoint = 0xFFFD;
    		}
    		symbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
    		symbol += createByte(codePoint, 6);
    	}
    	else if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence
    		symbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
    		symbol += createByte(codePoint, 12);
    		symbol += createByte(codePoint, 6);
    	}
    	symbol += stringFromCharCode((codePoint & 0x3F) | 0x80);
    	return symbol;
    }

    function utf8encode(string, opts) {
    	opts = opts || {};
    	var strict = false !== opts.strict;

    	var codePoints = ucs2decode(string);
    	var length = codePoints.length;
    	var index = -1;
    	var codePoint;
    	var byteString = '';
    	while (++index < length) {
    		codePoint = codePoints[index];
    		byteString += encodeCodePoint(codePoint, strict);
    	}
    	return byteString;
    }

    /*--------------------------------------------------------------------------*/

    function readContinuationByte() {
    	if (byteIndex >= byteCount) {
    		throw Error('Invalid byte index');
    	}

    	var continuationByte = byteArray[byteIndex] & 0xFF;
    	byteIndex++;

    	if ((continuationByte & 0xC0) == 0x80) {
    		return continuationByte & 0x3F;
    	}

    	// If we end up here, it’s not a continuation byte
    	throw Error('Invalid continuation byte');
    }

    function decodeSymbol(strict) {
    	var byte1;
    	var byte2;
    	var byte3;
    	var byte4;
    	var codePoint;

    	if (byteIndex > byteCount) {
    		throw Error('Invalid byte index');
    	}

    	if (byteIndex == byteCount) {
    		return false;
    	}

    	// Read first byte
    	byte1 = byteArray[byteIndex] & 0xFF;
    	byteIndex++;

    	// 1-byte sequence (no continuation bytes)
    	if ((byte1 & 0x80) == 0) {
    		return byte1;
    	}

    	// 2-byte sequence
    	if ((byte1 & 0xE0) == 0xC0) {
    		byte2 = readContinuationByte();
    		codePoint = ((byte1 & 0x1F) << 6) | byte2;
    		if (codePoint >= 0x80) {
    			return codePoint;
    		} else {
    			throw Error('Invalid continuation byte');
    		}
    	}

    	// 3-byte sequence (may include unpaired surrogates)
    	if ((byte1 & 0xF0) == 0xE0) {
    		byte2 = readContinuationByte();
    		byte3 = readContinuationByte();
    		codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
    		if (codePoint >= 0x0800) {
    			return checkScalarValue(codePoint, strict) ? codePoint : 0xFFFD;
    		} else {
    			throw Error('Invalid continuation byte');
    		}
    	}

    	// 4-byte sequence
    	if ((byte1 & 0xF8) == 0xF0) {
    		byte2 = readContinuationByte();
    		byte3 = readContinuationByte();
    		byte4 = readContinuationByte();
    		codePoint = ((byte1 & 0x07) << 0x12) | (byte2 << 0x0C) |
    			(byte3 << 0x06) | byte4;
    		if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
    			return codePoint;
    		}
    	}

    	throw Error('Invalid UTF-8 detected');
    }

    var byteArray;
    var byteCount;
    var byteIndex;
    function utf8decode(byteString, opts) {
    	opts = opts || {};
    	var strict = false !== opts.strict;

    	byteArray = ucs2decode(byteString);
    	byteCount = byteArray.length;
    	byteIndex = 0;
    	var codePoints = [];
    	var tmp;
    	while ((tmp = decodeSymbol(strict)) !== false) {
    		codePoints.push(tmp);
    	}
    	return ucs2encode(codePoints);
    }

    var utf8 = {
    	version: '2.1.2',
    	encode: utf8encode,
    	decode: utf8decode
    };

    var base64Arraybuffer = createCommonjsModule(function (module, exports) {
    /*
     * base64-arraybuffer
     * https://github.com/niklasvh/base64-arraybuffer
     *
     * Copyright (c) 2012 Niklas von Hertzen
     * Licensed under the MIT license.
     */
    (function(chars){

      exports.encode = function(arraybuffer) {
        var bytes = new Uint8Array(arraybuffer),
        i, len = bytes.length, base64 = "";

        for (i = 0; i < len; i+=3) {
          base64 += chars[bytes[i] >> 2];
          base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
          base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
          base64 += chars[bytes[i + 2] & 63];
        }

        if ((len % 3) === 2) {
          base64 = base64.substring(0, base64.length - 1) + "=";
        } else if (len % 3 === 1) {
          base64 = base64.substring(0, base64.length - 2) + "==";
        }

        return base64;
      };

      exports.decode =  function(base64) {
        var bufferLength = base64.length * 0.75,
        len = base64.length, i, p = 0,
        encoded1, encoded2, encoded3, encoded4;

        if (base64[base64.length - 1] === "=") {
          bufferLength--;
          if (base64[base64.length - 2] === "=") {
            bufferLength--;
          }
        }

        var arraybuffer = new ArrayBuffer(bufferLength),
        bytes = new Uint8Array(arraybuffer);

        for (i = 0; i < len; i+=4) {
          encoded1 = chars.indexOf(base64[i]);
          encoded2 = chars.indexOf(base64[i+1]);
          encoded3 = chars.indexOf(base64[i+2]);
          encoded4 = chars.indexOf(base64[i+3]);

          bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
          bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
          bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
        }

        return arraybuffer;
      };
    })("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
    });

    /**
     * Create a blob builder even when vendor prefixes exist
     */

    var BlobBuilder = typeof BlobBuilder !== 'undefined' ? BlobBuilder :
      typeof WebKitBlobBuilder !== 'undefined' ? WebKitBlobBuilder :
      typeof MSBlobBuilder !== 'undefined' ? MSBlobBuilder :
      typeof MozBlobBuilder !== 'undefined' ? MozBlobBuilder : 
      false;

    /**
     * Check if Blob constructor is supported
     */

    var blobSupported = (function() {
      try {
        var a = new Blob(['hi']);
        return a.size === 2;
      } catch(e) {
        return false;
      }
    })();

    /**
     * Check if Blob constructor supports ArrayBufferViews
     * Fails in Safari 6, so we need to map to ArrayBuffers there.
     */

    var blobSupportsArrayBufferView = blobSupported && (function() {
      try {
        var b = new Blob([new Uint8Array([1,2])]);
        return b.size === 2;
      } catch(e) {
        return false;
      }
    })();

    /**
     * Check if BlobBuilder is supported
     */

    var blobBuilderSupported = BlobBuilder
      && BlobBuilder.prototype.append
      && BlobBuilder.prototype.getBlob;

    /**
     * Helper function that maps ArrayBufferViews to ArrayBuffers
     * Used by BlobBuilder constructor and old browsers that didn't
     * support it in the Blob constructor.
     */

    function mapArrayBufferViews(ary) {
      return ary.map(function(chunk) {
        if (chunk.buffer instanceof ArrayBuffer) {
          var buf = chunk.buffer;

          // if this is a subarray, make a copy so we only
          // include the subarray region from the underlying buffer
          if (chunk.byteLength !== buf.byteLength) {
            var copy = new Uint8Array(chunk.byteLength);
            copy.set(new Uint8Array(buf, chunk.byteOffset, chunk.byteLength));
            buf = copy.buffer;
          }

          return buf;
        }

        return chunk;
      });
    }

    function BlobBuilderConstructor(ary, options) {
      options = options || {};

      var bb = new BlobBuilder();
      mapArrayBufferViews(ary).forEach(function(part) {
        bb.append(part);
      });

      return (options.type) ? bb.getBlob(options.type) : bb.getBlob();
    }
    function BlobConstructor(ary, options) {
      return new Blob(mapArrayBufferViews(ary), options || {});
    }
    if (typeof Blob !== 'undefined') {
      BlobBuilderConstructor.prototype = Blob.prototype;
      BlobConstructor.prototype = Blob.prototype;
    }

    var blob = (function() {
      if (blobSupported) {
        return blobSupportsArrayBufferView ? Blob : BlobConstructor;
      } else if (blobBuilderSupported) {
        return BlobBuilderConstructor;
      } else {
        return undefined;
      }
    })();

    var browser$1 = createCommonjsModule(function (module, exports) {
    /**
     * Module dependencies.
     */







    var base64encoder;
    if (typeof ArrayBuffer !== 'undefined') {
      base64encoder = base64Arraybuffer;
    }

    /**
     * Check if we are running an android browser. That requires us to use
     * ArrayBuffer with polling transports...
     *
     * http://ghinda.net/jpeg-blob-ajax-android/
     */

    var isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

    /**
     * Check if we are running in PhantomJS.
     * Uploading a Blob with PhantomJS does not work correctly, as reported here:
     * https://github.com/ariya/phantomjs/issues/11395
     * @type boolean
     */
    var isPhantomJS = typeof navigator !== 'undefined' && /PhantomJS/i.test(navigator.userAgent);

    /**
     * When true, avoids using Blobs to encode payloads.
     * @type boolean
     */
    var dontSendBlobs = isAndroid || isPhantomJS;

    /**
     * Current protocol version.
     */

    exports.protocol = 3;

    /**
     * Packet types.
     */

    var packets = exports.packets = {
        open:     0    // non-ws
      , close:    1    // non-ws
      , ping:     2
      , pong:     3
      , message:  4
      , upgrade:  5
      , noop:     6
    };

    var packetslist = keys(packets);

    /**
     * Premade error packet.
     */

    var err = { type: 'error', data: 'parser error' };

    /**
     * Create a blob api even for blob builder when vendor prefixes exist
     */



    /**
     * Encodes a packet.
     *
     *     <packet type id> [ <data> ]
     *
     * Example:
     *
     *     5hello world
     *     3
     *     4
     *
     * Binary is encoded in an identical principle
     *
     * @api private
     */

    exports.encodePacket = function (packet, supportsBinary, utf8encode, callback) {
      if (typeof supportsBinary === 'function') {
        callback = supportsBinary;
        supportsBinary = false;
      }

      if (typeof utf8encode === 'function') {
        callback = utf8encode;
        utf8encode = null;
      }

      var data = (packet.data === undefined)
        ? undefined
        : packet.data.buffer || packet.data;

      if (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) {
        return encodeArrayBuffer(packet, supportsBinary, callback);
      } else if (typeof blob !== 'undefined' && data instanceof blob) {
        return encodeBlob(packet, supportsBinary, callback);
      }

      // might be an object with { base64: true, data: dataAsBase64String }
      if (data && data.base64) {
        return encodeBase64Object(packet, callback);
      }

      // Sending data as a utf-8 string
      var encoded = packets[packet.type];

      // data fragment is optional
      if (undefined !== packet.data) {
        encoded += utf8encode ? utf8.encode(String(packet.data), { strict: false }) : String(packet.data);
      }

      return callback('' + encoded);

    };

    function encodeBase64Object(packet, callback) {
      // packet data is an object { base64: true, data: dataAsBase64String }
      var message = 'b' + exports.packets[packet.type] + packet.data.data;
      return callback(message);
    }

    /**
     * Encode packet helpers for binary types
     */

    function encodeArrayBuffer(packet, supportsBinary, callback) {
      if (!supportsBinary) {
        return exports.encodeBase64Packet(packet, callback);
      }

      var data = packet.data;
      var contentArray = new Uint8Array(data);
      var resultBuffer = new Uint8Array(1 + data.byteLength);

      resultBuffer[0] = packets[packet.type];
      for (var i = 0; i < contentArray.length; i++) {
        resultBuffer[i+1] = contentArray[i];
      }

      return callback(resultBuffer.buffer);
    }

    function encodeBlobAsArrayBuffer(packet, supportsBinary, callback) {
      if (!supportsBinary) {
        return exports.encodeBase64Packet(packet, callback);
      }

      var fr = new FileReader();
      fr.onload = function() {
        exports.encodePacket({ type: packet.type, data: fr.result }, supportsBinary, true, callback);
      };
      return fr.readAsArrayBuffer(packet.data);
    }

    function encodeBlob(packet, supportsBinary, callback) {
      if (!supportsBinary) {
        return exports.encodeBase64Packet(packet, callback);
      }

      if (dontSendBlobs) {
        return encodeBlobAsArrayBuffer(packet, supportsBinary, callback);
      }

      var length = new Uint8Array(1);
      length[0] = packets[packet.type];
      var blob$1 = new blob([length.buffer, packet.data]);

      return callback(blob$1);
    }

    /**
     * Encodes a packet with binary data in a base64 string
     *
     * @param {Object} packet, has `type` and `data`
     * @return {String} base64 encoded message
     */

    exports.encodeBase64Packet = function(packet, callback) {
      var message = 'b' + exports.packets[packet.type];
      if (typeof blob !== 'undefined' && packet.data instanceof blob) {
        var fr = new FileReader();
        fr.onload = function() {
          var b64 = fr.result.split(',')[1];
          callback(message + b64);
        };
        return fr.readAsDataURL(packet.data);
      }

      var b64data;
      try {
        b64data = String.fromCharCode.apply(null, new Uint8Array(packet.data));
      } catch (e) {
        // iPhone Safari doesn't let you apply with typed arrays
        var typed = new Uint8Array(packet.data);
        var basic = new Array(typed.length);
        for (var i = 0; i < typed.length; i++) {
          basic[i] = typed[i];
        }
        b64data = String.fromCharCode.apply(null, basic);
      }
      message += btoa(b64data);
      return callback(message);
    };

    /**
     * Decodes a packet. Changes format to Blob if requested.
     *
     * @return {Object} with `type` and `data` (if any)
     * @api private
     */

    exports.decodePacket = function (data, binaryType, utf8decode) {
      if (data === undefined) {
        return err;
      }
      // String data
      if (typeof data === 'string') {
        if (data.charAt(0) === 'b') {
          return exports.decodeBase64Packet(data.substr(1), binaryType);
        }

        if (utf8decode) {
          data = tryDecode(data);
          if (data === false) {
            return err;
          }
        }
        var type = data.charAt(0);

        if (Number(type) != type || !packetslist[type]) {
          return err;
        }

        if (data.length > 1) {
          return { type: packetslist[type], data: data.substring(1) };
        } else {
          return { type: packetslist[type] };
        }
      }

      var asArray = new Uint8Array(data);
      var type = asArray[0];
      var rest = arraybuffer_slice(data, 1);
      if (blob && binaryType === 'blob') {
        rest = new blob([rest]);
      }
      return { type: packetslist[type], data: rest };
    };

    function tryDecode(data) {
      try {
        data = utf8.decode(data, { strict: false });
      } catch (e) {
        return false;
      }
      return data;
    }

    /**
     * Decodes a packet encoded in a base64 string
     *
     * @param {String} base64 encoded message
     * @return {Object} with `type` and `data` (if any)
     */

    exports.decodeBase64Packet = function(msg, binaryType) {
      var type = packetslist[msg.charAt(0)];
      if (!base64encoder) {
        return { type: type, data: { base64: true, data: msg.substr(1) } };
      }

      var data = base64encoder.decode(msg.substr(1));

      if (binaryType === 'blob' && blob) {
        data = new blob([data]);
      }

      return { type: type, data: data };
    };

    /**
     * Encodes multiple messages (payload).
     *
     *     <length>:data
     *
     * Example:
     *
     *     11:hello world2:hi
     *
     * If any contents are binary, they will be encoded as base64 strings. Base64
     * encoded strings are marked with a b before the length specifier
     *
     * @param {Array} packets
     * @api private
     */

    exports.encodePayload = function (packets, supportsBinary, callback) {
      if (typeof supportsBinary === 'function') {
        callback = supportsBinary;
        supportsBinary = null;
      }

      var isBinary = hasBinary2(packets);

      if (supportsBinary && isBinary) {
        if (blob && !dontSendBlobs) {
          return exports.encodePayloadAsBlob(packets, callback);
        }

        return exports.encodePayloadAsArrayBuffer(packets, callback);
      }

      if (!packets.length) {
        return callback('0:');
      }

      function setLengthHeader(message) {
        return message.length + ':' + message;
      }

      function encodeOne(packet, doneCallback) {
        exports.encodePacket(packet, !isBinary ? false : supportsBinary, false, function(message) {
          doneCallback(null, setLengthHeader(message));
        });
      }

      map(packets, encodeOne, function(err, results) {
        return callback(results.join(''));
      });
    };

    /**
     * Async array map using after
     */

    function map(ary, each, done) {
      var result = new Array(ary.length);
      var next = after_1(ary.length, done);

      var eachWithIndex = function(i, el, cb) {
        each(el, function(error, msg) {
          result[i] = msg;
          cb(error, result);
        });
      };

      for (var i = 0; i < ary.length; i++) {
        eachWithIndex(i, ary[i], next);
      }
    }

    /*
     * Decodes data when a payload is maybe expected. Possible binary contents are
     * decoded from their base64 representation
     *
     * @param {String} data, callback method
     * @api public
     */

    exports.decodePayload = function (data, binaryType, callback) {
      if (typeof data !== 'string') {
        return exports.decodePayloadAsBinary(data, binaryType, callback);
      }

      if (typeof binaryType === 'function') {
        callback = binaryType;
        binaryType = null;
      }

      var packet;
      if (data === '') {
        // parser error - ignoring payload
        return callback(err, 0, 1);
      }

      var length = '', n, msg;

      for (var i = 0, l = data.length; i < l; i++) {
        var chr = data.charAt(i);

        if (chr !== ':') {
          length += chr;
          continue;
        }

        if (length === '' || (length != (n = Number(length)))) {
          // parser error - ignoring payload
          return callback(err, 0, 1);
        }

        msg = data.substr(i + 1, n);

        if (length != msg.length) {
          // parser error - ignoring payload
          return callback(err, 0, 1);
        }

        if (msg.length) {
          packet = exports.decodePacket(msg, binaryType, false);

          if (err.type === packet.type && err.data === packet.data) {
            // parser error in individual packet - ignoring payload
            return callback(err, 0, 1);
          }

          var ret = callback(packet, i + n, l);
          if (false === ret) return;
        }

        // advance cursor
        i += n;
        length = '';
      }

      if (length !== '') {
        // parser error - ignoring payload
        return callback(err, 0, 1);
      }

    };

    /**
     * Encodes multiple messages (payload) as binary.
     *
     * <1 = binary, 0 = string><number from 0-9><number from 0-9>[...]<number
     * 255><data>
     *
     * Example:
     * 1 3 255 1 2 3, if the binary contents are interpreted as 8 bit integers
     *
     * @param {Array} packets
     * @return {ArrayBuffer} encoded payload
     * @api private
     */

    exports.encodePayloadAsArrayBuffer = function(packets, callback) {
      if (!packets.length) {
        return callback(new ArrayBuffer(0));
      }

      function encodeOne(packet, doneCallback) {
        exports.encodePacket(packet, true, true, function(data) {
          return doneCallback(null, data);
        });
      }

      map(packets, encodeOne, function(err, encodedPackets) {
        var totalLength = encodedPackets.reduce(function(acc, p) {
          var len;
          if (typeof p === 'string'){
            len = p.length;
          } else {
            len = p.byteLength;
          }
          return acc + len.toString().length + len + 2; // string/binary identifier + separator = 2
        }, 0);

        var resultArray = new Uint8Array(totalLength);

        var bufferIndex = 0;
        encodedPackets.forEach(function(p) {
          var isString = typeof p === 'string';
          var ab = p;
          if (isString) {
            var view = new Uint8Array(p.length);
            for (var i = 0; i < p.length; i++) {
              view[i] = p.charCodeAt(i);
            }
            ab = view.buffer;
          }

          if (isString) { // not true binary
            resultArray[bufferIndex++] = 0;
          } else { // true binary
            resultArray[bufferIndex++] = 1;
          }

          var lenStr = ab.byteLength.toString();
          for (var i = 0; i < lenStr.length; i++) {
            resultArray[bufferIndex++] = parseInt(lenStr[i]);
          }
          resultArray[bufferIndex++] = 255;

          var view = new Uint8Array(ab);
          for (var i = 0; i < view.length; i++) {
            resultArray[bufferIndex++] = view[i];
          }
        });

        return callback(resultArray.buffer);
      });
    };

    /**
     * Encode as Blob
     */

    exports.encodePayloadAsBlob = function(packets, callback) {
      function encodeOne(packet, doneCallback) {
        exports.encodePacket(packet, true, true, function(encoded) {
          var binaryIdentifier = new Uint8Array(1);
          binaryIdentifier[0] = 1;
          if (typeof encoded === 'string') {
            var view = new Uint8Array(encoded.length);
            for (var i = 0; i < encoded.length; i++) {
              view[i] = encoded.charCodeAt(i);
            }
            encoded = view.buffer;
            binaryIdentifier[0] = 0;
          }

          var len = (encoded instanceof ArrayBuffer)
            ? encoded.byteLength
            : encoded.size;

          var lenStr = len.toString();
          var lengthAry = new Uint8Array(lenStr.length + 1);
          for (var i = 0; i < lenStr.length; i++) {
            lengthAry[i] = parseInt(lenStr[i]);
          }
          lengthAry[lenStr.length] = 255;

          if (blob) {
            var blob$1 = new blob([binaryIdentifier.buffer, lengthAry.buffer, encoded]);
            doneCallback(null, blob$1);
          }
        });
      }

      map(packets, encodeOne, function(err, results) {
        return callback(new blob(results));
      });
    };

    /*
     * Decodes data when a payload is maybe expected. Strings are decoded by
     * interpreting each byte as a key code for entries marked to start with 0. See
     * description of encodePayloadAsBinary
     *
     * @param {ArrayBuffer} data, callback method
     * @api public
     */

    exports.decodePayloadAsBinary = function (data, binaryType, callback) {
      if (typeof binaryType === 'function') {
        callback = binaryType;
        binaryType = null;
      }

      var bufferTail = data;
      var buffers = [];

      while (bufferTail.byteLength > 0) {
        var tailArray = new Uint8Array(bufferTail);
        var isString = tailArray[0] === 0;
        var msgLength = '';

        for (var i = 1; ; i++) {
          if (tailArray[i] === 255) break;

          // 310 = char length of Number.MAX_VALUE
          if (msgLength.length > 310) {
            return callback(err, 0, 1);
          }

          msgLength += tailArray[i];
        }

        bufferTail = arraybuffer_slice(bufferTail, 2 + msgLength.length);
        msgLength = parseInt(msgLength);

        var msg = arraybuffer_slice(bufferTail, 0, msgLength);
        if (isString) {
          try {
            msg = String.fromCharCode.apply(null, new Uint8Array(msg));
          } catch (e) {
            // iPhone Safari doesn't let you apply to typed arrays
            var typed = new Uint8Array(msg);
            msg = '';
            for (var i = 0; i < typed.length; i++) {
              msg += String.fromCharCode(typed[i]);
            }
          }
        }

        buffers.push(msg);
        bufferTail = arraybuffer_slice(bufferTail, msgLength);
      }

      var total = buffers.length;
      buffers.forEach(function(buffer, i) {
        callback(exports.decodePacket(buffer, binaryType, true), i, total);
      });
    };
    });

    /**
     * Module dependencies.
     */




    /**
     * Module exports.
     */

    var transport = Transport;

    /**
     * Transport abstract constructor.
     *
     * @param {Object} options.
     * @api private
     */

    function Transport (opts) {
      this.path = opts.path;
      this.hostname = opts.hostname;
      this.port = opts.port;
      this.secure = opts.secure;
      this.query = opts.query;
      this.timestampParam = opts.timestampParam;
      this.timestampRequests = opts.timestampRequests;
      this.readyState = '';
      this.agent = opts.agent || false;
      this.socket = opts.socket;
      this.enablesXDR = opts.enablesXDR;
      this.withCredentials = opts.withCredentials;

      // SSL options for Node.js client
      this.pfx = opts.pfx;
      this.key = opts.key;
      this.passphrase = opts.passphrase;
      this.cert = opts.cert;
      this.ca = opts.ca;
      this.ciphers = opts.ciphers;
      this.rejectUnauthorized = opts.rejectUnauthorized;
      this.forceNode = opts.forceNode;

      // results of ReactNative environment detection
      this.isReactNative = opts.isReactNative;

      // other options for Node.js client
      this.extraHeaders = opts.extraHeaders;
      this.localAddress = opts.localAddress;
    }

    /**
     * Mix in `Emitter`.
     */

    componentEmitter(Transport.prototype);

    /**
     * Emits an error.
     *
     * @param {String} str
     * @return {Transport} for chaining
     * @api public
     */

    Transport.prototype.onError = function (msg, desc) {
      var err = new Error(msg);
      err.type = 'TransportError';
      err.description = desc;
      this.emit('error', err);
      return this;
    };

    /**
     * Opens the transport.
     *
     * @api public
     */

    Transport.prototype.open = function () {
      if ('closed' === this.readyState || '' === this.readyState) {
        this.readyState = 'opening';
        this.doOpen();
      }

      return this;
    };

    /**
     * Closes the transport.
     *
     * @api private
     */

    Transport.prototype.close = function () {
      if ('opening' === this.readyState || 'open' === this.readyState) {
        this.doClose();
        this.onClose();
      }

      return this;
    };

    /**
     * Sends multiple packets.
     *
     * @param {Array} packets
     * @api private
     */

    Transport.prototype.send = function (packets) {
      if ('open' === this.readyState) {
        this.write(packets);
      } else {
        throw new Error('Transport not open');
      }
    };

    /**
     * Called upon open
     *
     * @api private
     */

    Transport.prototype.onOpen = function () {
      this.readyState = 'open';
      this.writable = true;
      this.emit('open');
    };

    /**
     * Called with data.
     *
     * @param {String} data
     * @api private
     */

    Transport.prototype.onData = function (data) {
      var packet = browser$1.decodePacket(data, this.socket.binaryType);
      this.onPacket(packet);
    };

    /**
     * Called with a decoded packet.
     */

    Transport.prototype.onPacket = function (packet) {
      this.emit('packet', packet);
    };

    /**
     * Called upon close.
     *
     * @api private
     */

    Transport.prototype.onClose = function () {
      this.readyState = 'closed';
      this.emit('close');
    };

    /**
     * Compiles a querystring
     * Returns string representation of the object
     *
     * @param {Object}
     * @api private
     */

    var encode = function (obj) {
      var str = '';

      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          if (str.length) str += '&';
          str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
        }
      }

      return str;
    };

    /**
     * Parses a simple querystring into an object
     *
     * @param {String} qs
     * @api private
     */

    var decode = function(qs){
      var qry = {};
      var pairs = qs.split('&');
      for (var i = 0, l = pairs.length; i < l; i++) {
        var pair = pairs[i].split('=');
        qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      }
      return qry;
    };

    var parseqs = {
    	encode: encode,
    	decode: decode
    };

    var componentInherit = function(a, b){
      var fn = function(){};
      fn.prototype = b.prototype;
      a.prototype = new fn;
      a.prototype.constructor = a;
    };

    var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split('')
      , length = 64
      , map = {}
      , seed = 0
      , i$1 = 0
      , prev;

    /**
     * Return a string representing the specified number.
     *
     * @param {Number} num The number to convert.
     * @returns {String} The string representation of the number.
     * @api public
     */
    function encode$1(num) {
      var encoded = '';

      do {
        encoded = alphabet[num % length] + encoded;
        num = Math.floor(num / length);
      } while (num > 0);

      return encoded;
    }

    /**
     * Return the integer value specified by the given string.
     *
     * @param {String} str The string to convert.
     * @returns {Number} The integer value represented by the string.
     * @api public
     */
    function decode$1(str) {
      var decoded = 0;

      for (i$1 = 0; i$1 < str.length; i$1++) {
        decoded = decoded * length + map[str.charAt(i$1)];
      }

      return decoded;
    }

    /**
     * Yeast: A tiny growing id generator.
     *
     * @returns {String} A unique id.
     * @api public
     */
    function yeast() {
      var now = encode$1(+new Date());

      if (now !== prev) return seed = 0, prev = now;
      return now +'.'+ encode$1(seed++);
    }

    //
    // Map each character to its index.
    //
    for (; i$1 < length; i$1++) map[alphabet[i$1]] = i$1;

    //
    // Expose the `yeast`, `encode` and `decode` functions.
    //
    yeast.encode = encode$1;
    yeast.decode = decode$1;
    var yeast_1 = yeast;

    /**
     * Module dependencies.
     */






    var debug$2 = browser('engine.io-client:polling');

    /**
     * Module exports.
     */

    var polling = Polling;

    /**
     * Is XHR2 supported?
     */

    var hasXHR2 = (function () {
      var XMLHttpRequest = xmlhttprequest;
      var xhr = new XMLHttpRequest({ xdomain: false });
      return null != xhr.responseType;
    })();

    /**
     * Polling interface.
     *
     * @param {Object} opts
     * @api private
     */

    function Polling (opts) {
      var forceBase64 = (opts && opts.forceBase64);
      if (!hasXHR2 || forceBase64) {
        this.supportsBinary = false;
      }
      transport.call(this, opts);
    }

    /**
     * Inherits from Transport.
     */

    componentInherit(Polling, transport);

    /**
     * Transport name.
     */

    Polling.prototype.name = 'polling';

    /**
     * Opens the socket (triggers polling). We write a PING message to determine
     * when the transport is open.
     *
     * @api private
     */

    Polling.prototype.doOpen = function () {
      this.poll();
    };

    /**
     * Pauses polling.
     *
     * @param {Function} callback upon buffers are flushed and transport is paused
     * @api private
     */

    Polling.prototype.pause = function (onPause) {
      var self = this;

      this.readyState = 'pausing';

      function pause () {
        debug$2('paused');
        self.readyState = 'paused';
        onPause();
      }

      if (this.polling || !this.writable) {
        var total = 0;

        if (this.polling) {
          debug$2('we are currently polling - waiting to pause');
          total++;
          this.once('pollComplete', function () {
            debug$2('pre-pause polling complete');
            --total || pause();
          });
        }

        if (!this.writable) {
          debug$2('we are currently writing - waiting to pause');
          total++;
          this.once('drain', function () {
            debug$2('pre-pause writing complete');
            --total || pause();
          });
        }
      } else {
        pause();
      }
    };

    /**
     * Starts polling cycle.
     *
     * @api public
     */

    Polling.prototype.poll = function () {
      debug$2('polling');
      this.polling = true;
      this.doPoll();
      this.emit('poll');
    };

    /**
     * Overloads onData to detect payloads.
     *
     * @api private
     */

    Polling.prototype.onData = function (data) {
      var self = this;
      debug$2('polling got data %s', data);
      var callback = function (packet, index, total) {
        // if its the first message we consider the transport open
        if ('opening' === self.readyState) {
          self.onOpen();
        }

        // if its a close packet, we close the ongoing requests
        if ('close' === packet.type) {
          self.onClose();
          return false;
        }

        // otherwise bypass onData and handle the message
        self.onPacket(packet);
      };

      // decode payload
      browser$1.decodePayload(data, this.socket.binaryType, callback);

      // if an event did not trigger closing
      if ('closed' !== this.readyState) {
        // if we got data we're not polling
        this.polling = false;
        this.emit('pollComplete');

        if ('open' === this.readyState) {
          this.poll();
        } else {
          debug$2('ignoring poll - transport state "%s"', this.readyState);
        }
      }
    };

    /**
     * For polling, send a close packet.
     *
     * @api private
     */

    Polling.prototype.doClose = function () {
      var self = this;

      function close () {
        debug$2('writing close packet');
        self.write([{ type: 'close' }]);
      }

      if ('open' === this.readyState) {
        debug$2('transport open - closing');
        close();
      } else {
        // in case we're trying to close while
        // handshaking is in progress (GH-164)
        debug$2('transport not open - deferring close');
        this.once('open', close);
      }
    };

    /**
     * Writes a packets payload.
     *
     * @param {Array} data packets
     * @param {Function} drain callback
     * @api private
     */

    Polling.prototype.write = function (packets) {
      var self = this;
      this.writable = false;
      var callbackfn = function () {
        self.writable = true;
        self.emit('drain');
      };

      browser$1.encodePayload(packets, this.supportsBinary, function (data) {
        self.doWrite(data, callbackfn);
      });
    };

    /**
     * Generates uri for connection.
     *
     * @api private
     */

    Polling.prototype.uri = function () {
      var query = this.query || {};
      var schema = this.secure ? 'https' : 'http';
      var port = '';

      // cache busting is forced
      if (false !== this.timestampRequests) {
        query[this.timestampParam] = yeast_1();
      }

      if (!this.supportsBinary && !query.sid) {
        query.b64 = 1;
      }

      query = parseqs.encode(query);

      // avoid port if default for schema
      if (this.port && (('https' === schema && Number(this.port) !== 443) ||
         ('http' === schema && Number(this.port) !== 80))) {
        port = ':' + this.port;
      }

      // prepend ? to query
      if (query.length) {
        query = '?' + query;
      }

      var ipv6 = this.hostname.indexOf(':') !== -1;
      return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
    };

    /* global attachEvent */

    /**
     * Module requirements.
     */





    var debug$3 = browser('engine.io-client:polling-xhr');


    /**
     * Module exports.
     */

    var pollingXhr = XHR;
    var Request_1 = Request;

    /**
     * Empty function
     */

    function empty$1 () {}

    /**
     * XHR Polling constructor.
     *
     * @param {Object} opts
     * @api public
     */

    function XHR (opts) {
      polling.call(this, opts);
      this.requestTimeout = opts.requestTimeout;
      this.extraHeaders = opts.extraHeaders;

      if (typeof location !== 'undefined') {
        var isSSL = 'https:' === location.protocol;
        var port = location.port;

        // some user agents have empty `location.port`
        if (!port) {
          port = isSSL ? 443 : 80;
        }

        this.xd = (typeof location !== 'undefined' && opts.hostname !== location.hostname) ||
          port !== opts.port;
        this.xs = opts.secure !== isSSL;
      }
    }

    /**
     * Inherits from Polling.
     */

    componentInherit(XHR, polling);

    /**
     * XHR supports binary
     */

    XHR.prototype.supportsBinary = true;

    /**
     * Creates a request.
     *
     * @param {String} method
     * @api private
     */

    XHR.prototype.request = function (opts) {
      opts = opts || {};
      opts.uri = this.uri();
      opts.xd = this.xd;
      opts.xs = this.xs;
      opts.agent = this.agent || false;
      opts.supportsBinary = this.supportsBinary;
      opts.enablesXDR = this.enablesXDR;
      opts.withCredentials = this.withCredentials;

      // SSL options for Node.js client
      opts.pfx = this.pfx;
      opts.key = this.key;
      opts.passphrase = this.passphrase;
      opts.cert = this.cert;
      opts.ca = this.ca;
      opts.ciphers = this.ciphers;
      opts.rejectUnauthorized = this.rejectUnauthorized;
      opts.requestTimeout = this.requestTimeout;

      // other options for Node.js client
      opts.extraHeaders = this.extraHeaders;

      return new Request(opts);
    };

    /**
     * Sends data.
     *
     * @param {String} data to send.
     * @param {Function} called upon flush.
     * @api private
     */

    XHR.prototype.doWrite = function (data, fn) {
      var isBinary = typeof data !== 'string' && data !== undefined;
      var req = this.request({ method: 'POST', data: data, isBinary: isBinary });
      var self = this;
      req.on('success', fn);
      req.on('error', function (err) {
        self.onError('xhr post error', err);
      });
      this.sendXhr = req;
    };

    /**
     * Starts a poll cycle.
     *
     * @api private
     */

    XHR.prototype.doPoll = function () {
      debug$3('xhr poll');
      var req = this.request();
      var self = this;
      req.on('data', function (data) {
        self.onData(data);
      });
      req.on('error', function (err) {
        self.onError('xhr poll error', err);
      });
      this.pollXhr = req;
    };

    /**
     * Request constructor
     *
     * @param {Object} options
     * @api public
     */

    function Request (opts) {
      this.method = opts.method || 'GET';
      this.uri = opts.uri;
      this.xd = !!opts.xd;
      this.xs = !!opts.xs;
      this.async = false !== opts.async;
      this.data = undefined !== opts.data ? opts.data : null;
      this.agent = opts.agent;
      this.isBinary = opts.isBinary;
      this.supportsBinary = opts.supportsBinary;
      this.enablesXDR = opts.enablesXDR;
      this.withCredentials = opts.withCredentials;
      this.requestTimeout = opts.requestTimeout;

      // SSL options for Node.js client
      this.pfx = opts.pfx;
      this.key = opts.key;
      this.passphrase = opts.passphrase;
      this.cert = opts.cert;
      this.ca = opts.ca;
      this.ciphers = opts.ciphers;
      this.rejectUnauthorized = opts.rejectUnauthorized;

      // other options for Node.js client
      this.extraHeaders = opts.extraHeaders;

      this.create();
    }

    /**
     * Mix in `Emitter`.
     */

    componentEmitter(Request.prototype);

    /**
     * Creates the XHR object and sends the request.
     *
     * @api private
     */

    Request.prototype.create = function () {
      var opts = { agent: this.agent, xdomain: this.xd, xscheme: this.xs, enablesXDR: this.enablesXDR };

      // SSL options for Node.js client
      opts.pfx = this.pfx;
      opts.key = this.key;
      opts.passphrase = this.passphrase;
      opts.cert = this.cert;
      opts.ca = this.ca;
      opts.ciphers = this.ciphers;
      opts.rejectUnauthorized = this.rejectUnauthorized;

      var xhr = this.xhr = new xmlhttprequest(opts);
      var self = this;

      try {
        debug$3('xhr open %s: %s', this.method, this.uri);
        xhr.open(this.method, this.uri, this.async);
        try {
          if (this.extraHeaders) {
            xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
            for (var i in this.extraHeaders) {
              if (this.extraHeaders.hasOwnProperty(i)) {
                xhr.setRequestHeader(i, this.extraHeaders[i]);
              }
            }
          }
        } catch (e) {}

        if ('POST' === this.method) {
          try {
            if (this.isBinary) {
              xhr.setRequestHeader('Content-type', 'application/octet-stream');
            } else {
              xhr.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
            }
          } catch (e) {}
        }

        try {
          xhr.setRequestHeader('Accept', '*/*');
        } catch (e) {}

        // ie6 check
        if ('withCredentials' in xhr) {
          xhr.withCredentials = this.withCredentials;
        }

        if (this.requestTimeout) {
          xhr.timeout = this.requestTimeout;
        }

        if (this.hasXDR()) {
          xhr.onload = function () {
            self.onLoad();
          };
          xhr.onerror = function () {
            self.onError(xhr.responseText);
          };
        } else {
          xhr.onreadystatechange = function () {
            if (xhr.readyState === 2) {
              try {
                var contentType = xhr.getResponseHeader('Content-Type');
                if (self.supportsBinary && contentType === 'application/octet-stream' || contentType === 'application/octet-stream; charset=UTF-8') {
                  xhr.responseType = 'arraybuffer';
                }
              } catch (e) {}
            }
            if (4 !== xhr.readyState) return;
            if (200 === xhr.status || 1223 === xhr.status) {
              self.onLoad();
            } else {
              // make sure the `error` event handler that's user-set
              // does not throw in the same tick and gets caught here
              setTimeout(function () {
                self.onError(typeof xhr.status === 'number' ? xhr.status : 0);
              }, 0);
            }
          };
        }

        debug$3('xhr data %s', this.data);
        xhr.send(this.data);
      } catch (e) {
        // Need to defer since .create() is called directly fhrom the constructor
        // and thus the 'error' event can only be only bound *after* this exception
        // occurs.  Therefore, also, we cannot throw here at all.
        setTimeout(function () {
          self.onError(e);
        }, 0);
        return;
      }

      if (typeof document !== 'undefined') {
        this.index = Request.requestsCount++;
        Request.requests[this.index] = this;
      }
    };

    /**
     * Called upon successful response.
     *
     * @api private
     */

    Request.prototype.onSuccess = function () {
      this.emit('success');
      this.cleanup();
    };

    /**
     * Called if we have data.
     *
     * @api private
     */

    Request.prototype.onData = function (data) {
      this.emit('data', data);
      this.onSuccess();
    };

    /**
     * Called upon error.
     *
     * @api private
     */

    Request.prototype.onError = function (err) {
      this.emit('error', err);
      this.cleanup(true);
    };

    /**
     * Cleans up house.
     *
     * @api private
     */

    Request.prototype.cleanup = function (fromError) {
      if ('undefined' === typeof this.xhr || null === this.xhr) {
        return;
      }
      // xmlhttprequest
      if (this.hasXDR()) {
        this.xhr.onload = this.xhr.onerror = empty$1;
      } else {
        this.xhr.onreadystatechange = empty$1;
      }

      if (fromError) {
        try {
          this.xhr.abort();
        } catch (e) {}
      }

      if (typeof document !== 'undefined') {
        delete Request.requests[this.index];
      }

      this.xhr = null;
    };

    /**
     * Called upon load.
     *
     * @api private
     */

    Request.prototype.onLoad = function () {
      var data;
      try {
        var contentType;
        try {
          contentType = this.xhr.getResponseHeader('Content-Type');
        } catch (e) {}
        if (contentType === 'application/octet-stream' || contentType === 'application/octet-stream; charset=UTF-8') {
          data = this.xhr.response || this.xhr.responseText;
        } else {
          data = this.xhr.responseText;
        }
      } catch (e) {
        this.onError(e);
      }
      if (null != data) {
        this.onData(data);
      }
    };

    /**
     * Check if it has XDomainRequest.
     *
     * @api private
     */

    Request.prototype.hasXDR = function () {
      return typeof XDomainRequest !== 'undefined' && !this.xs && this.enablesXDR;
    };

    /**
     * Aborts the request.
     *
     * @api public
     */

    Request.prototype.abort = function () {
      this.cleanup();
    };

    /**
     * Aborts pending requests when unloading the window. This is needed to prevent
     * memory leaks (e.g. when using IE) and to ensure that no spurious error is
     * emitted.
     */

    Request.requestsCount = 0;
    Request.requests = {};

    if (typeof document !== 'undefined') {
      if (typeof attachEvent === 'function') {
        attachEvent('onunload', unloadHandler);
      } else if (typeof addEventListener === 'function') {
        var terminationEvent = 'onpagehide' in globalThis_browser ? 'pagehide' : 'unload';
        addEventListener(terminationEvent, unloadHandler, false);
      }
    }

    function unloadHandler () {
      for (var i in Request.requests) {
        if (Request.requests.hasOwnProperty(i)) {
          Request.requests[i].abort();
        }
      }
    }
    pollingXhr.Request = Request_1;

    /**
     * Module requirements.
     */





    /**
     * Module exports.
     */

    var pollingJsonp = JSONPPolling;

    /**
     * Cached regular expressions.
     */

    var rNewline = /\n/g;
    var rEscapedNewline = /\\n/g;

    /**
     * Global JSONP callbacks.
     */

    var callbacks;

    /**
     * Noop.
     */

    function empty$2 () { }

    /**
     * JSONP Polling constructor.
     *
     * @param {Object} opts.
     * @api public
     */

    function JSONPPolling (opts) {
      polling.call(this, opts);

      this.query = this.query || {};

      // define global callbacks array if not present
      // we do this here (lazily) to avoid unneeded global pollution
      if (!callbacks) {
        // we need to consider multiple engines in the same page
        callbacks = globalThis_browser.___eio = (globalThis_browser.___eio || []);
      }

      // callback identifier
      this.index = callbacks.length;

      // add callback to jsonp global
      var self = this;
      callbacks.push(function (msg) {
        self.onData(msg);
      });

      // append to query string
      this.query.j = this.index;

      // prevent spurious errors from being emitted when the window is unloaded
      if (typeof addEventListener === 'function') {
        addEventListener('beforeunload', function () {
          if (self.script) self.script.onerror = empty$2;
        }, false);
      }
    }

    /**
     * Inherits from Polling.
     */

    componentInherit(JSONPPolling, polling);

    /*
     * JSONP only supports binary as base64 encoded strings
     */

    JSONPPolling.prototype.supportsBinary = false;

    /**
     * Closes the socket.
     *
     * @api private
     */

    JSONPPolling.prototype.doClose = function () {
      if (this.script) {
        this.script.parentNode.removeChild(this.script);
        this.script = null;
      }

      if (this.form) {
        this.form.parentNode.removeChild(this.form);
        this.form = null;
        this.iframe = null;
      }

      polling.prototype.doClose.call(this);
    };

    /**
     * Starts a poll cycle.
     *
     * @api private
     */

    JSONPPolling.prototype.doPoll = function () {
      var self = this;
      var script = document.createElement('script');

      if (this.script) {
        this.script.parentNode.removeChild(this.script);
        this.script = null;
      }

      script.async = true;
      script.src = this.uri();
      script.onerror = function (e) {
        self.onError('jsonp poll error', e);
      };

      var insertAt = document.getElementsByTagName('script')[0];
      if (insertAt) {
        insertAt.parentNode.insertBefore(script, insertAt);
      } else {
        (document.head || document.body).appendChild(script);
      }
      this.script = script;

      var isUAgecko = 'undefined' !== typeof navigator && /gecko/i.test(navigator.userAgent);

      if (isUAgecko) {
        setTimeout(function () {
          var iframe = document.createElement('iframe');
          document.body.appendChild(iframe);
          document.body.removeChild(iframe);
        }, 100);
      }
    };

    /**
     * Writes with a hidden iframe.
     *
     * @param {String} data to send
     * @param {Function} called upon flush.
     * @api private
     */

    JSONPPolling.prototype.doWrite = function (data, fn) {
      var self = this;

      if (!this.form) {
        var form = document.createElement('form');
        var area = document.createElement('textarea');
        var id = this.iframeId = 'eio_iframe_' + this.index;
        var iframe;

        form.className = 'socketio';
        form.style.position = 'absolute';
        form.style.top = '-1000px';
        form.style.left = '-1000px';
        form.target = id;
        form.method = 'POST';
        form.setAttribute('accept-charset', 'utf-8');
        area.name = 'd';
        form.appendChild(area);
        document.body.appendChild(form);

        this.form = form;
        this.area = area;
      }

      this.form.action = this.uri();

      function complete () {
        initIframe();
        fn();
      }

      function initIframe () {
        if (self.iframe) {
          try {
            self.form.removeChild(self.iframe);
          } catch (e) {
            self.onError('jsonp polling iframe removal error', e);
          }
        }

        try {
          // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
          var html = '<iframe src="javascript:0" name="' + self.iframeId + '">';
          iframe = document.createElement(html);
        } catch (e) {
          iframe = document.createElement('iframe');
          iframe.name = self.iframeId;
          iframe.src = 'javascript:0';
        }

        iframe.id = self.iframeId;

        self.form.appendChild(iframe);
        self.iframe = iframe;
      }

      initIframe();

      // escape \n to prevent it from being converted into \r\n by some UAs
      // double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side
      data = data.replace(rEscapedNewline, '\\\n');
      this.area.value = data.replace(rNewline, '\\n');

      try {
        this.form.submit();
      } catch (e) {}

      if (this.iframe.attachEvent) {
        this.iframe.onreadystatechange = function () {
          if (self.iframe.readyState === 'complete') {
            complete();
          }
        };
      } else {
        this.iframe.onload = complete;
      }
    };

    var _nodeResolve_empty = {};

    var _nodeResolve_empty$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': _nodeResolve_empty
    });

    var require$$1 = getCjsExportFromNamespace(_nodeResolve_empty$1);

    /**
     * Module dependencies.
     */






    var debug$4 = browser('engine.io-client:websocket');

    var BrowserWebSocket, NodeWebSocket;

    if (typeof WebSocket !== 'undefined') {
      BrowserWebSocket = WebSocket;
    } else if (typeof self !== 'undefined') {
      BrowserWebSocket = self.WebSocket || self.MozWebSocket;
    }

    if (typeof window === 'undefined') {
      try {
        NodeWebSocket = require$$1;
      } catch (e) { }
    }

    /**
     * Get either the `WebSocket` or `MozWebSocket` globals
     * in the browser or try to resolve WebSocket-compatible
     * interface exposed by `ws` for Node-like environment.
     */

    var WebSocketImpl = BrowserWebSocket || NodeWebSocket;

    /**
     * Module exports.
     */

    var websocket = WS;

    /**
     * WebSocket transport constructor.
     *
     * @api {Object} connection options
     * @api public
     */

    function WS (opts) {
      var forceBase64 = (opts && opts.forceBase64);
      if (forceBase64) {
        this.supportsBinary = false;
      }
      this.perMessageDeflate = opts.perMessageDeflate;
      this.usingBrowserWebSocket = BrowserWebSocket && !opts.forceNode;
      this.protocols = opts.protocols;
      if (!this.usingBrowserWebSocket) {
        WebSocketImpl = NodeWebSocket;
      }
      transport.call(this, opts);
    }

    /**
     * Inherits from Transport.
     */

    componentInherit(WS, transport);

    /**
     * Transport name.
     *
     * @api public
     */

    WS.prototype.name = 'websocket';

    /*
     * WebSockets support binary
     */

    WS.prototype.supportsBinary = true;

    /**
     * Opens socket.
     *
     * @api private
     */

    WS.prototype.doOpen = function () {
      if (!this.check()) {
        // let probe timeout
        return;
      }

      var uri = this.uri();
      var protocols = this.protocols;

      var opts = {};

      if (!this.isReactNative) {
        opts.agent = this.agent;
        opts.perMessageDeflate = this.perMessageDeflate;

        // SSL options for Node.js client
        opts.pfx = this.pfx;
        opts.key = this.key;
        opts.passphrase = this.passphrase;
        opts.cert = this.cert;
        opts.ca = this.ca;
        opts.ciphers = this.ciphers;
        opts.rejectUnauthorized = this.rejectUnauthorized;
      }

      if (this.extraHeaders) {
        opts.headers = this.extraHeaders;
      }
      if (this.localAddress) {
        opts.localAddress = this.localAddress;
      }

      try {
        this.ws =
          this.usingBrowserWebSocket && !this.isReactNative
            ? protocols
              ? new WebSocketImpl(uri, protocols)
              : new WebSocketImpl(uri)
            : new WebSocketImpl(uri, protocols, opts);
      } catch (err) {
        return this.emit('error', err);
      }

      if (this.ws.binaryType === undefined) {
        this.supportsBinary = false;
      }

      if (this.ws.supports && this.ws.supports.binary) {
        this.supportsBinary = true;
        this.ws.binaryType = 'nodebuffer';
      } else {
        this.ws.binaryType = 'arraybuffer';
      }

      this.addEventListeners();
    };

    /**
     * Adds event listeners to the socket
     *
     * @api private
     */

    WS.prototype.addEventListeners = function () {
      var self = this;

      this.ws.onopen = function () {
        self.onOpen();
      };
      this.ws.onclose = function () {
        self.onClose();
      };
      this.ws.onmessage = function (ev) {
        self.onData(ev.data);
      };
      this.ws.onerror = function (e) {
        self.onError('websocket error', e);
      };
    };

    /**
     * Writes data to socket.
     *
     * @param {Array} array of packets.
     * @api private
     */

    WS.prototype.write = function (packets) {
      var self = this;
      this.writable = false;

      // encodePacket efficient as it uses WS framing
      // no need for encodePayload
      var total = packets.length;
      for (var i = 0, l = total; i < l; i++) {
        (function (packet) {
          browser$1.encodePacket(packet, self.supportsBinary, function (data) {
            if (!self.usingBrowserWebSocket) {
              // always create a new object (GH-437)
              var opts = {};
              if (packet.options) {
                opts.compress = packet.options.compress;
              }

              if (self.perMessageDeflate) {
                var len = 'string' === typeof data ? Buffer.byteLength(data) : data.length;
                if (len < self.perMessageDeflate.threshold) {
                  opts.compress = false;
                }
              }
            }

            // Sometimes the websocket has already been closed but the browser didn't
            // have a chance of informing us about it yet, in that case send will
            // throw an error
            try {
              if (self.usingBrowserWebSocket) {
                // TypeError is thrown when passing the second argument on Safari
                self.ws.send(data);
              } else {
                self.ws.send(data, opts);
              }
            } catch (e) {
              debug$4('websocket closed before onclose event');
            }

            --total || done();
          });
        })(packets[i]);
      }

      function done () {
        self.emit('flush');

        // fake drain
        // defer to next tick to allow Socket to clear writeBuffer
        setTimeout(function () {
          self.writable = true;
          self.emit('drain');
        }, 0);
      }
    };

    /**
     * Called upon close
     *
     * @api private
     */

    WS.prototype.onClose = function () {
      transport.prototype.onClose.call(this);
    };

    /**
     * Closes socket.
     *
     * @api private
     */

    WS.prototype.doClose = function () {
      if (typeof this.ws !== 'undefined') {
        this.ws.close();
      }
    };

    /**
     * Generates uri for connection.
     *
     * @api private
     */

    WS.prototype.uri = function () {
      var query = this.query || {};
      var schema = this.secure ? 'wss' : 'ws';
      var port = '';

      // avoid port if default for schema
      if (this.port && (('wss' === schema && Number(this.port) !== 443) ||
        ('ws' === schema && Number(this.port) !== 80))) {
        port = ':' + this.port;
      }

      // append timestamp to URI
      if (this.timestampRequests) {
        query[this.timestampParam] = yeast_1();
      }

      // communicate binary support capabilities
      if (!this.supportsBinary) {
        query.b64 = 1;
      }

      query = parseqs.encode(query);

      // prepend ? to query
      if (query.length) {
        query = '?' + query;
      }

      var ipv6 = this.hostname.indexOf(':') !== -1;
      return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
    };

    /**
     * Feature detection for WebSocket.
     *
     * @return {Boolean} whether this transport is available.
     * @api public
     */

    WS.prototype.check = function () {
      return !!WebSocketImpl && !('__initialize' in WebSocketImpl && this.name === WS.prototype.name);
    };

    /**
     * Module dependencies
     */






    /**
     * Export transports.
     */

    var polling_1 = polling$1;
    var websocket_1 = websocket;

    /**
     * Polling transport polymorphic constructor.
     * Decides on xhr vs jsonp based on feature detection.
     *
     * @api private
     */

    function polling$1 (opts) {
      var xhr;
      var xd = false;
      var xs = false;
      var jsonp = false !== opts.jsonp;

      if (typeof location !== 'undefined') {
        var isSSL = 'https:' === location.protocol;
        var port = location.port;

        // some user agents have empty `location.port`
        if (!port) {
          port = isSSL ? 443 : 80;
        }

        xd = opts.hostname !== location.hostname || port !== opts.port;
        xs = opts.secure !== isSSL;
      }

      opts.xdomain = xd;
      opts.xscheme = xs;
      xhr = new xmlhttprequest(opts);

      if ('open' in xhr && !opts.forceJSONP) {
        return new pollingXhr(opts);
      } else {
        if (!jsonp) throw new Error('JSONP disabled');
        return new pollingJsonp(opts);
      }
    }

    var transports = {
    	polling: polling_1,
    	websocket: websocket_1
    };

    var indexOf = [].indexOf;

    var indexof = function(arr, obj){
      if (indexOf) return arr.indexOf(obj);
      for (var i = 0; i < arr.length; ++i) {
        if (arr[i] === obj) return i;
      }
      return -1;
    };

    /**
     * Module dependencies.
     */



    var debug$5 = browser('engine.io-client:socket');





    /**
     * Module exports.
     */

    var socket = Socket;

    /**
     * Socket constructor.
     *
     * @param {String|Object} uri or options
     * @param {Object} options
     * @api public
     */

    function Socket (uri, opts) {
      if (!(this instanceof Socket)) return new Socket(uri, opts);

      opts = opts || {};

      if (uri && 'object' === typeof uri) {
        opts = uri;
        uri = null;
      }

      if (uri) {
        uri = parseuri(uri);
        opts.hostname = uri.host;
        opts.secure = uri.protocol === 'https' || uri.protocol === 'wss';
        opts.port = uri.port;
        if (uri.query) opts.query = uri.query;
      } else if (opts.host) {
        opts.hostname = parseuri(opts.host).host;
      }

      this.secure = null != opts.secure ? opts.secure
        : (typeof location !== 'undefined' && 'https:' === location.protocol);

      if (opts.hostname && !opts.port) {
        // if no port is specified manually, use the protocol default
        opts.port = this.secure ? '443' : '80';
      }

      this.agent = opts.agent || false;
      this.hostname = opts.hostname ||
        (typeof location !== 'undefined' ? location.hostname : 'localhost');
      this.port = opts.port || (typeof location !== 'undefined' && location.port
          ? location.port
          : (this.secure ? 443 : 80));
      this.query = opts.query || {};
      if ('string' === typeof this.query) this.query = parseqs.decode(this.query);
      this.upgrade = false !== opts.upgrade;
      this.path = (opts.path || '/engine.io').replace(/\/$/, '') + '/';
      this.forceJSONP = !!opts.forceJSONP;
      this.jsonp = false !== opts.jsonp;
      this.forceBase64 = !!opts.forceBase64;
      this.enablesXDR = !!opts.enablesXDR;
      this.withCredentials = false !== opts.withCredentials;
      this.timestampParam = opts.timestampParam || 't';
      this.timestampRequests = opts.timestampRequests;
      this.transports = opts.transports || ['polling', 'websocket'];
      this.transportOptions = opts.transportOptions || {};
      this.readyState = '';
      this.writeBuffer = [];
      this.prevBufferLen = 0;
      this.policyPort = opts.policyPort || 843;
      this.rememberUpgrade = opts.rememberUpgrade || false;
      this.binaryType = null;
      this.onlyBinaryUpgrades = opts.onlyBinaryUpgrades;
      this.perMessageDeflate = false !== opts.perMessageDeflate ? (opts.perMessageDeflate || {}) : false;

      if (true === this.perMessageDeflate) this.perMessageDeflate = {};
      if (this.perMessageDeflate && null == this.perMessageDeflate.threshold) {
        this.perMessageDeflate.threshold = 1024;
      }

      // SSL options for Node.js client
      this.pfx = opts.pfx || null;
      this.key = opts.key || null;
      this.passphrase = opts.passphrase || null;
      this.cert = opts.cert || null;
      this.ca = opts.ca || null;
      this.ciphers = opts.ciphers || null;
      this.rejectUnauthorized = opts.rejectUnauthorized === undefined ? true : opts.rejectUnauthorized;
      this.forceNode = !!opts.forceNode;

      // detect ReactNative environment
      this.isReactNative = (typeof navigator !== 'undefined' && typeof navigator.product === 'string' && navigator.product.toLowerCase() === 'reactnative');

      // other options for Node.js or ReactNative client
      if (typeof self === 'undefined' || this.isReactNative) {
        if (opts.extraHeaders && Object.keys(opts.extraHeaders).length > 0) {
          this.extraHeaders = opts.extraHeaders;
        }

        if (opts.localAddress) {
          this.localAddress = opts.localAddress;
        }
      }

      // set on handshake
      this.id = null;
      this.upgrades = null;
      this.pingInterval = null;
      this.pingTimeout = null;

      // set on heartbeat
      this.pingIntervalTimer = null;
      this.pingTimeoutTimer = null;

      this.open();
    }

    Socket.priorWebsocketSuccess = false;

    /**
     * Mix in `Emitter`.
     */

    componentEmitter(Socket.prototype);

    /**
     * Protocol version.
     *
     * @api public
     */

    Socket.protocol = browser$1.protocol; // this is an int

    /**
     * Expose deps for legacy compatibility
     * and standalone browser access.
     */

    Socket.Socket = Socket;
    Socket.Transport = transport;
    Socket.transports = transports;
    Socket.parser = browser$1;

    /**
     * Creates transport of the given type.
     *
     * @param {String} transport name
     * @return {Transport}
     * @api private
     */

    Socket.prototype.createTransport = function (name) {
      debug$5('creating transport "%s"', name);
      var query = clone(this.query);

      // append engine.io protocol identifier
      query.EIO = browser$1.protocol;

      // transport name
      query.transport = name;

      // per-transport options
      var options = this.transportOptions[name] || {};

      // session id if we already have one
      if (this.id) query.sid = this.id;

      var transport = new transports[name]({
        query: query,
        socket: this,
        agent: options.agent || this.agent,
        hostname: options.hostname || this.hostname,
        port: options.port || this.port,
        secure: options.secure || this.secure,
        path: options.path || this.path,
        forceJSONP: options.forceJSONP || this.forceJSONP,
        jsonp: options.jsonp || this.jsonp,
        forceBase64: options.forceBase64 || this.forceBase64,
        enablesXDR: options.enablesXDR || this.enablesXDR,
        withCredentials: options.withCredentials || this.withCredentials,
        timestampRequests: options.timestampRequests || this.timestampRequests,
        timestampParam: options.timestampParam || this.timestampParam,
        policyPort: options.policyPort || this.policyPort,
        pfx: options.pfx || this.pfx,
        key: options.key || this.key,
        passphrase: options.passphrase || this.passphrase,
        cert: options.cert || this.cert,
        ca: options.ca || this.ca,
        ciphers: options.ciphers || this.ciphers,
        rejectUnauthorized: options.rejectUnauthorized || this.rejectUnauthorized,
        perMessageDeflate: options.perMessageDeflate || this.perMessageDeflate,
        extraHeaders: options.extraHeaders || this.extraHeaders,
        forceNode: options.forceNode || this.forceNode,
        localAddress: options.localAddress || this.localAddress,
        requestTimeout: options.requestTimeout || this.requestTimeout,
        protocols: options.protocols || void (0),
        isReactNative: this.isReactNative
      });

      return transport;
    };

    function clone (obj) {
      var o = {};
      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          o[i] = obj[i];
        }
      }
      return o;
    }

    /**
     * Initializes transport to use and starts probe.
     *
     * @api private
     */
    Socket.prototype.open = function () {
      var transport;
      if (this.rememberUpgrade && Socket.priorWebsocketSuccess && this.transports.indexOf('websocket') !== -1) {
        transport = 'websocket';
      } else if (0 === this.transports.length) {
        // Emit error on next tick so it can be listened to
        var self = this;
        setTimeout(function () {
          self.emit('error', 'No transports available');
        }, 0);
        return;
      } else {
        transport = this.transports[0];
      }
      this.readyState = 'opening';

      // Retry with the next transport if the transport is disabled (jsonp: false)
      try {
        transport = this.createTransport(transport);
      } catch (e) {
        this.transports.shift();
        this.open();
        return;
      }

      transport.open();
      this.setTransport(transport);
    };

    /**
     * Sets the current transport. Disables the existing one (if any).
     *
     * @api private
     */

    Socket.prototype.setTransport = function (transport) {
      debug$5('setting transport %s', transport.name);
      var self = this;

      if (this.transport) {
        debug$5('clearing existing transport %s', this.transport.name);
        this.transport.removeAllListeners();
      }

      // set up transport
      this.transport = transport;

      // set up transport listeners
      transport
      .on('drain', function () {
        self.onDrain();
      })
      .on('packet', function (packet) {
        self.onPacket(packet);
      })
      .on('error', function (e) {
        self.onError(e);
      })
      .on('close', function () {
        self.onClose('transport close');
      });
    };

    /**
     * Probes a transport.
     *
     * @param {String} transport name
     * @api private
     */

    Socket.prototype.probe = function (name) {
      debug$5('probing transport "%s"', name);
      var transport = this.createTransport(name, { probe: 1 });
      var failed = false;
      var self = this;

      Socket.priorWebsocketSuccess = false;

      function onTransportOpen () {
        if (self.onlyBinaryUpgrades) {
          var upgradeLosesBinary = !this.supportsBinary && self.transport.supportsBinary;
          failed = failed || upgradeLosesBinary;
        }
        if (failed) return;

        debug$5('probe transport "%s" opened', name);
        transport.send([{ type: 'ping', data: 'probe' }]);
        transport.once('packet', function (msg) {
          if (failed) return;
          if ('pong' === msg.type && 'probe' === msg.data) {
            debug$5('probe transport "%s" pong', name);
            self.upgrading = true;
            self.emit('upgrading', transport);
            if (!transport) return;
            Socket.priorWebsocketSuccess = 'websocket' === transport.name;

            debug$5('pausing current transport "%s"', self.transport.name);
            self.transport.pause(function () {
              if (failed) return;
              if ('closed' === self.readyState) return;
              debug$5('changing transport and sending upgrade packet');

              cleanup();

              self.setTransport(transport);
              transport.send([{ type: 'upgrade' }]);
              self.emit('upgrade', transport);
              transport = null;
              self.upgrading = false;
              self.flush();
            });
          } else {
            debug$5('probe transport "%s" failed', name);
            var err = new Error('probe error');
            err.transport = transport.name;
            self.emit('upgradeError', err);
          }
        });
      }

      function freezeTransport () {
        if (failed) return;

        // Any callback called by transport should be ignored since now
        failed = true;

        cleanup();

        transport.close();
        transport = null;
      }

      // Handle any error that happens while probing
      function onerror (err) {
        var error = new Error('probe error: ' + err);
        error.transport = transport.name;

        freezeTransport();

        debug$5('probe transport "%s" failed because of error: %s', name, err);

        self.emit('upgradeError', error);
      }

      function onTransportClose () {
        onerror('transport closed');
      }

      // When the socket is closed while we're probing
      function onclose () {
        onerror('socket closed');
      }

      // When the socket is upgraded while we're probing
      function onupgrade (to) {
        if (transport && to.name !== transport.name) {
          debug$5('"%s" works - aborting "%s"', to.name, transport.name);
          freezeTransport();
        }
      }

      // Remove all listeners on the transport and on self
      function cleanup () {
        transport.removeListener('open', onTransportOpen);
        transport.removeListener('error', onerror);
        transport.removeListener('close', onTransportClose);
        self.removeListener('close', onclose);
        self.removeListener('upgrading', onupgrade);
      }

      transport.once('open', onTransportOpen);
      transport.once('error', onerror);
      transport.once('close', onTransportClose);

      this.once('close', onclose);
      this.once('upgrading', onupgrade);

      transport.open();
    };

    /**
     * Called when connection is deemed open.
     *
     * @api public
     */

    Socket.prototype.onOpen = function () {
      debug$5('socket open');
      this.readyState = 'open';
      Socket.priorWebsocketSuccess = 'websocket' === this.transport.name;
      this.emit('open');
      this.flush();

      // we check for `readyState` in case an `open`
      // listener already closed the socket
      if ('open' === this.readyState && this.upgrade && this.transport.pause) {
        debug$5('starting upgrade probes');
        for (var i = 0, l = this.upgrades.length; i < l; i++) {
          this.probe(this.upgrades[i]);
        }
      }
    };

    /**
     * Handles a packet.
     *
     * @api private
     */

    Socket.prototype.onPacket = function (packet) {
      if ('opening' === this.readyState || 'open' === this.readyState ||
          'closing' === this.readyState) {
        debug$5('socket receive: type "%s", data "%s"', packet.type, packet.data);

        this.emit('packet', packet);

        // Socket is live - any packet counts
        this.emit('heartbeat');

        switch (packet.type) {
          case 'open':
            this.onHandshake(JSON.parse(packet.data));
            break;

          case 'pong':
            this.setPing();
            this.emit('pong');
            break;

          case 'error':
            var err = new Error('server error');
            err.code = packet.data;
            this.onError(err);
            break;

          case 'message':
            this.emit('data', packet.data);
            this.emit('message', packet.data);
            break;
        }
      } else {
        debug$5('packet received with socket readyState "%s"', this.readyState);
      }
    };

    /**
     * Called upon handshake completion.
     *
     * @param {Object} handshake obj
     * @api private
     */

    Socket.prototype.onHandshake = function (data) {
      this.emit('handshake', data);
      this.id = data.sid;
      this.transport.query.sid = data.sid;
      this.upgrades = this.filterUpgrades(data.upgrades);
      this.pingInterval = data.pingInterval;
      this.pingTimeout = data.pingTimeout;
      this.onOpen();
      // In case open handler closes socket
      if ('closed' === this.readyState) return;
      this.setPing();

      // Prolong liveness of socket on heartbeat
      this.removeListener('heartbeat', this.onHeartbeat);
      this.on('heartbeat', this.onHeartbeat);
    };

    /**
     * Resets ping timeout.
     *
     * @api private
     */

    Socket.prototype.onHeartbeat = function (timeout) {
      clearTimeout(this.pingTimeoutTimer);
      var self = this;
      self.pingTimeoutTimer = setTimeout(function () {
        if ('closed' === self.readyState) return;
        self.onClose('ping timeout');
      }, timeout || (self.pingInterval + self.pingTimeout));
    };

    /**
     * Pings server every `this.pingInterval` and expects response
     * within `this.pingTimeout` or closes connection.
     *
     * @api private
     */

    Socket.prototype.setPing = function () {
      var self = this;
      clearTimeout(self.pingIntervalTimer);
      self.pingIntervalTimer = setTimeout(function () {
        debug$5('writing ping packet - expecting pong within %sms', self.pingTimeout);
        self.ping();
        self.onHeartbeat(self.pingTimeout);
      }, self.pingInterval);
    };

    /**
    * Sends a ping packet.
    *
    * @api private
    */

    Socket.prototype.ping = function () {
      var self = this;
      this.sendPacket('ping', function () {
        self.emit('ping');
      });
    };

    /**
     * Called on `drain` event
     *
     * @api private
     */

    Socket.prototype.onDrain = function () {
      this.writeBuffer.splice(0, this.prevBufferLen);

      // setting prevBufferLen = 0 is very important
      // for example, when upgrading, upgrade packet is sent over,
      // and a nonzero prevBufferLen could cause problems on `drain`
      this.prevBufferLen = 0;

      if (0 === this.writeBuffer.length) {
        this.emit('drain');
      } else {
        this.flush();
      }
    };

    /**
     * Flush write buffers.
     *
     * @api private
     */

    Socket.prototype.flush = function () {
      if ('closed' !== this.readyState && this.transport.writable &&
        !this.upgrading && this.writeBuffer.length) {
        debug$5('flushing %d packets in socket', this.writeBuffer.length);
        this.transport.send(this.writeBuffer);
        // keep track of current length of writeBuffer
        // splice writeBuffer and callbackBuffer on `drain`
        this.prevBufferLen = this.writeBuffer.length;
        this.emit('flush');
      }
    };

    /**
     * Sends a message.
     *
     * @param {String} message.
     * @param {Function} callback function.
     * @param {Object} options.
     * @return {Socket} for chaining.
     * @api public
     */

    Socket.prototype.write =
    Socket.prototype.send = function (msg, options, fn) {
      this.sendPacket('message', msg, options, fn);
      return this;
    };

    /**
     * Sends a packet.
     *
     * @param {String} packet type.
     * @param {String} data.
     * @param {Object} options.
     * @param {Function} callback function.
     * @api private
     */

    Socket.prototype.sendPacket = function (type, data, options, fn) {
      if ('function' === typeof data) {
        fn = data;
        data = undefined;
      }

      if ('function' === typeof options) {
        fn = options;
        options = null;
      }

      if ('closing' === this.readyState || 'closed' === this.readyState) {
        return;
      }

      options = options || {};
      options.compress = false !== options.compress;

      var packet = {
        type: type,
        data: data,
        options: options
      };
      this.emit('packetCreate', packet);
      this.writeBuffer.push(packet);
      if (fn) this.once('flush', fn);
      this.flush();
    };

    /**
     * Closes the connection.
     *
     * @api private
     */

    Socket.prototype.close = function () {
      if ('opening' === this.readyState || 'open' === this.readyState) {
        this.readyState = 'closing';

        var self = this;

        if (this.writeBuffer.length) {
          this.once('drain', function () {
            if (this.upgrading) {
              waitForUpgrade();
            } else {
              close();
            }
          });
        } else if (this.upgrading) {
          waitForUpgrade();
        } else {
          close();
        }
      }

      function close () {
        self.onClose('forced close');
        debug$5('socket closing - telling transport to close');
        self.transport.close();
      }

      function cleanupAndClose () {
        self.removeListener('upgrade', cleanupAndClose);
        self.removeListener('upgradeError', cleanupAndClose);
        close();
      }

      function waitForUpgrade () {
        // wait for upgrade to finish since we can't send packets while pausing a transport
        self.once('upgrade', cleanupAndClose);
        self.once('upgradeError', cleanupAndClose);
      }

      return this;
    };

    /**
     * Called upon transport error
     *
     * @api private
     */

    Socket.prototype.onError = function (err) {
      debug$5('socket error %j', err);
      Socket.priorWebsocketSuccess = false;
      this.emit('error', err);
      this.onClose('transport error', err);
    };

    /**
     * Called upon transport close.
     *
     * @api private
     */

    Socket.prototype.onClose = function (reason, desc) {
      if ('opening' === this.readyState || 'open' === this.readyState || 'closing' === this.readyState) {
        debug$5('socket close with reason: "%s"', reason);
        var self = this;

        // clear timers
        clearTimeout(this.pingIntervalTimer);
        clearTimeout(this.pingTimeoutTimer);

        // stop event from firing again for transport
        this.transport.removeAllListeners('close');

        // ensure transport won't stay open
        this.transport.close();

        // ignore further transport communication
        this.transport.removeAllListeners();

        // set ready state
        this.readyState = 'closed';

        // clear session id
        this.id = null;

        // emit close event
        this.emit('close', reason, desc);

        // clean buffers after, so users can still
        // grab the buffers on `close` event
        self.writeBuffer = [];
        self.prevBufferLen = 0;
      }
    };

    /**
     * Filters upgrades, returning only those matching client transports.
     *
     * @param {Array} server upgrades
     * @api private
     *
     */

    Socket.prototype.filterUpgrades = function (upgrades) {
      var filteredUpgrades = [];
      for (var i = 0, j = upgrades.length; i < j; i++) {
        if (~indexof(this.transports, upgrades[i])) filteredUpgrades.push(upgrades[i]);
      }
      return filteredUpgrades;
    };

    var lib = socket;

    /**
     * Exports parser
     *
     * @api public
     *
     */
    var parser = browser$1;
    lib.parser = parser;

    var toArray_1 = toArray;

    function toArray(list, index) {
        var array = [];

        index = index || 0;

        for (var i = index || 0; i < list.length; i++) {
            array[i - index] = list[i];
        }

        return array
    }

    /**
     * Module exports.
     */

    var on_1 = on;

    /**
     * Helper for subscriptions.
     *
     * @param {Object|EventEmitter} obj with `Emitter` mixin or `EventEmitter`
     * @param {String} event name
     * @param {Function} callback
     * @api public
     */

    function on (obj, ev, fn) {
      obj.on(ev, fn);
      return {
        destroy: function () {
          obj.removeListener(ev, fn);
        }
      };
    }

    /**
     * Slice reference.
     */

    var slice = [].slice;

    /**
     * Bind `obj` to `fn`.
     *
     * @param {Object} obj
     * @param {Function|String} fn or string
     * @return {Function}
     * @api public
     */

    var componentBind = function(obj, fn){
      if ('string' == typeof fn) fn = obj[fn];
      if ('function' != typeof fn) throw new Error('bind() requires a function');
      var args = slice.call(arguments, 2);
      return function(){
        return fn.apply(obj, args.concat(slice.call(arguments)));
      }
    };

    var socket$1 = createCommonjsModule(function (module, exports) {
    /**
     * Module dependencies.
     */






    var debug = browser('socket.io-client:socket');



    /**
     * Module exports.
     */

    module.exports = exports = Socket;

    /**
     * Internal events (blacklisted).
     * These events can't be emitted by the user.
     *
     * @api private
     */

    var events = {
      connect: 1,
      connect_error: 1,
      connect_timeout: 1,
      connecting: 1,
      disconnect: 1,
      error: 1,
      reconnect: 1,
      reconnect_attempt: 1,
      reconnect_failed: 1,
      reconnect_error: 1,
      reconnecting: 1,
      ping: 1,
      pong: 1
    };

    /**
     * Shortcut to `Emitter#emit`.
     */

    var emit = componentEmitter.prototype.emit;

    /**
     * `Socket` constructor.
     *
     * @api public
     */

    function Socket (io, nsp, opts) {
      this.io = io;
      this.nsp = nsp;
      this.json = this; // compat
      this.ids = 0;
      this.acks = {};
      this.receiveBuffer = [];
      this.sendBuffer = [];
      this.connected = false;
      this.disconnected = true;
      this.flags = {};
      if (opts && opts.query) {
        this.query = opts.query;
      }
      if (this.io.autoConnect) this.open();
    }

    /**
     * Mix in `Emitter`.
     */

    componentEmitter(Socket.prototype);

    /**
     * Subscribe to open, close and packet events
     *
     * @api private
     */

    Socket.prototype.subEvents = function () {
      if (this.subs) return;

      var io = this.io;
      this.subs = [
        on_1(io, 'open', componentBind(this, 'onopen')),
        on_1(io, 'packet', componentBind(this, 'onpacket')),
        on_1(io, 'close', componentBind(this, 'onclose'))
      ];
    };

    /**
     * "Opens" the socket.
     *
     * @api public
     */

    Socket.prototype.open =
    Socket.prototype.connect = function () {
      if (this.connected) return this;

      this.subEvents();
      if (!this.io.reconnecting) this.io.open(); // ensure open
      if ('open' === this.io.readyState) this.onopen();
      this.emit('connecting');
      return this;
    };

    /**
     * Sends a `message` event.
     *
     * @return {Socket} self
     * @api public
     */

    Socket.prototype.send = function () {
      var args = toArray_1(arguments);
      args.unshift('message');
      this.emit.apply(this, args);
      return this;
    };

    /**
     * Override `emit`.
     * If the event is in `events`, it's emitted normally.
     *
     * @param {String} event name
     * @return {Socket} self
     * @api public
     */

    Socket.prototype.emit = function (ev) {
      if (events.hasOwnProperty(ev)) {
        emit.apply(this, arguments);
        return this;
      }

      var args = toArray_1(arguments);
      var packet = {
        type: (this.flags.binary !== undefined ? this.flags.binary : hasBinary2(args)) ? socket_ioParser.BINARY_EVENT : socket_ioParser.EVENT,
        data: args
      };

      packet.options = {};
      packet.options.compress = !this.flags || false !== this.flags.compress;

      // event ack callback
      if ('function' === typeof args[args.length - 1]) {
        debug('emitting packet with ack id %d', this.ids);
        this.acks[this.ids] = args.pop();
        packet.id = this.ids++;
      }

      if (this.connected) {
        this.packet(packet);
      } else {
        this.sendBuffer.push(packet);
      }

      this.flags = {};

      return this;
    };

    /**
     * Sends a packet.
     *
     * @param {Object} packet
     * @api private
     */

    Socket.prototype.packet = function (packet) {
      packet.nsp = this.nsp;
      this.io.packet(packet);
    };

    /**
     * Called upon engine `open`.
     *
     * @api private
     */

    Socket.prototype.onopen = function () {
      debug('transport is open - connecting');

      // write connect packet if necessary
      if ('/' !== this.nsp) {
        if (this.query) {
          var query = typeof this.query === 'object' ? parseqs.encode(this.query) : this.query;
          debug('sending connect packet with query %s', query);
          this.packet({type: socket_ioParser.CONNECT, query: query});
        } else {
          this.packet({type: socket_ioParser.CONNECT});
        }
      }
    };

    /**
     * Called upon engine `close`.
     *
     * @param {String} reason
     * @api private
     */

    Socket.prototype.onclose = function (reason) {
      debug('close (%s)', reason);
      this.connected = false;
      this.disconnected = true;
      delete this.id;
      this.emit('disconnect', reason);
    };

    /**
     * Called with socket packet.
     *
     * @param {Object} packet
     * @api private
     */

    Socket.prototype.onpacket = function (packet) {
      var sameNamespace = packet.nsp === this.nsp;
      var rootNamespaceError = packet.type === socket_ioParser.ERROR && packet.nsp === '/';

      if (!sameNamespace && !rootNamespaceError) return;

      switch (packet.type) {
        case socket_ioParser.CONNECT:
          this.onconnect();
          break;

        case socket_ioParser.EVENT:
          this.onevent(packet);
          break;

        case socket_ioParser.BINARY_EVENT:
          this.onevent(packet);
          break;

        case socket_ioParser.ACK:
          this.onack(packet);
          break;

        case socket_ioParser.BINARY_ACK:
          this.onack(packet);
          break;

        case socket_ioParser.DISCONNECT:
          this.ondisconnect();
          break;

        case socket_ioParser.ERROR:
          this.emit('error', packet.data);
          break;
      }
    };

    /**
     * Called upon a server event.
     *
     * @param {Object} packet
     * @api private
     */

    Socket.prototype.onevent = function (packet) {
      var args = packet.data || [];
      debug('emitting event %j', args);

      if (null != packet.id) {
        debug('attaching ack callback to event');
        args.push(this.ack(packet.id));
      }

      if (this.connected) {
        emit.apply(this, args);
      } else {
        this.receiveBuffer.push(args);
      }
    };

    /**
     * Produces an ack callback to emit with an event.
     *
     * @api private
     */

    Socket.prototype.ack = function (id) {
      var self = this;
      var sent = false;
      return function () {
        // prevent double callbacks
        if (sent) return;
        sent = true;
        var args = toArray_1(arguments);
        debug('sending ack %j', args);

        self.packet({
          type: hasBinary2(args) ? socket_ioParser.BINARY_ACK : socket_ioParser.ACK,
          id: id,
          data: args
        });
      };
    };

    /**
     * Called upon a server acknowlegement.
     *
     * @param {Object} packet
     * @api private
     */

    Socket.prototype.onack = function (packet) {
      var ack = this.acks[packet.id];
      if ('function' === typeof ack) {
        debug('calling ack %s with %j', packet.id, packet.data);
        ack.apply(this, packet.data);
        delete this.acks[packet.id];
      } else {
        debug('bad ack %s', packet.id);
      }
    };

    /**
     * Called upon server connect.
     *
     * @api private
     */

    Socket.prototype.onconnect = function () {
      this.connected = true;
      this.disconnected = false;
      this.emit('connect');
      this.emitBuffered();
    };

    /**
     * Emit buffered events (received and emitted).
     *
     * @api private
     */

    Socket.prototype.emitBuffered = function () {
      var i;
      for (i = 0; i < this.receiveBuffer.length; i++) {
        emit.apply(this, this.receiveBuffer[i]);
      }
      this.receiveBuffer = [];

      for (i = 0; i < this.sendBuffer.length; i++) {
        this.packet(this.sendBuffer[i]);
      }
      this.sendBuffer = [];
    };

    /**
     * Called upon server disconnect.
     *
     * @api private
     */

    Socket.prototype.ondisconnect = function () {
      debug('server disconnect (%s)', this.nsp);
      this.destroy();
      this.onclose('io server disconnect');
    };

    /**
     * Called upon forced client/server side disconnections,
     * this method ensures the manager stops tracking us and
     * that reconnections don't get triggered for this.
     *
     * @api private.
     */

    Socket.prototype.destroy = function () {
      if (this.subs) {
        // clean subscriptions to avoid reconnections
        for (var i = 0; i < this.subs.length; i++) {
          this.subs[i].destroy();
        }
        this.subs = null;
      }

      this.io.destroy(this);
    };

    /**
     * Disconnects the socket manually.
     *
     * @return {Socket} self
     * @api public
     */

    Socket.prototype.close =
    Socket.prototype.disconnect = function () {
      if (this.connected) {
        debug('performing disconnect (%s)', this.nsp);
        this.packet({ type: socket_ioParser.DISCONNECT });
      }

      // remove socket from pool
      this.destroy();

      if (this.connected) {
        // fire events
        this.onclose('io client disconnect');
      }
      return this;
    };

    /**
     * Sets the compress flag.
     *
     * @param {Boolean} if `true`, compresses the sending data
     * @return {Socket} self
     * @api public
     */

    Socket.prototype.compress = function (compress) {
      this.flags.compress = compress;
      return this;
    };

    /**
     * Sets the binary flag
     *
     * @param {Boolean} whether the emitted data contains binary
     * @return {Socket} self
     * @api public
     */

    Socket.prototype.binary = function (binary) {
      this.flags.binary = binary;
      return this;
    };
    });

    /**
     * Expose `Backoff`.
     */

    var backo2 = Backoff;

    /**
     * Initialize backoff timer with `opts`.
     *
     * - `min` initial timeout in milliseconds [100]
     * - `max` max timeout [10000]
     * - `jitter` [0]
     * - `factor` [2]
     *
     * @param {Object} opts
     * @api public
     */

    function Backoff(opts) {
      opts = opts || {};
      this.ms = opts.min || 100;
      this.max = opts.max || 10000;
      this.factor = opts.factor || 2;
      this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
      this.attempts = 0;
    }

    /**
     * Return the backoff duration.
     *
     * @return {Number}
     * @api public
     */

    Backoff.prototype.duration = function(){
      var ms = this.ms * Math.pow(this.factor, this.attempts++);
      if (this.jitter) {
        var rand =  Math.random();
        var deviation = Math.floor(rand * this.jitter * ms);
        ms = (Math.floor(rand * 10) & 1) == 0  ? ms - deviation : ms + deviation;
      }
      return Math.min(ms, this.max) | 0;
    };

    /**
     * Reset the number of attempts.
     *
     * @api public
     */

    Backoff.prototype.reset = function(){
      this.attempts = 0;
    };

    /**
     * Set the minimum duration
     *
     * @api public
     */

    Backoff.prototype.setMin = function(min){
      this.ms = min;
    };

    /**
     * Set the maximum duration
     *
     * @api public
     */

    Backoff.prototype.setMax = function(max){
      this.max = max;
    };

    /**
     * Set the jitter
     *
     * @api public
     */

    Backoff.prototype.setJitter = function(jitter){
      this.jitter = jitter;
    };

    /**
     * Module dependencies.
     */







    var debug$6 = browser('socket.io-client:manager');



    /**
     * IE6+ hasOwnProperty
     */

    var has = Object.prototype.hasOwnProperty;

    /**
     * Module exports
     */

    var manager = Manager;

    /**
     * `Manager` constructor.
     *
     * @param {String} engine instance or engine uri/opts
     * @param {Object} options
     * @api public
     */

    function Manager (uri, opts) {
      if (!(this instanceof Manager)) return new Manager(uri, opts);
      if (uri && ('object' === typeof uri)) {
        opts = uri;
        uri = undefined;
      }
      opts = opts || {};

      opts.path = opts.path || '/socket.io';
      this.nsps = {};
      this.subs = [];
      this.opts = opts;
      this.reconnection(opts.reconnection !== false);
      this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
      this.reconnectionDelay(opts.reconnectionDelay || 1000);
      this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
      this.randomizationFactor(opts.randomizationFactor || 0.5);
      this.backoff = new backo2({
        min: this.reconnectionDelay(),
        max: this.reconnectionDelayMax(),
        jitter: this.randomizationFactor()
      });
      this.timeout(null == opts.timeout ? 20000 : opts.timeout);
      this.readyState = 'closed';
      this.uri = uri;
      this.connecting = [];
      this.lastPing = null;
      this.encoding = false;
      this.packetBuffer = [];
      var _parser = opts.parser || socket_ioParser;
      this.encoder = new _parser.Encoder();
      this.decoder = new _parser.Decoder();
      this.autoConnect = opts.autoConnect !== false;
      if (this.autoConnect) this.open();
    }

    /**
     * Propagate given event to sockets and emit on `this`
     *
     * @api private
     */

    Manager.prototype.emitAll = function () {
      this.emit.apply(this, arguments);
      for (var nsp in this.nsps) {
        if (has.call(this.nsps, nsp)) {
          this.nsps[nsp].emit.apply(this.nsps[nsp], arguments);
        }
      }
    };

    /**
     * Update `socket.id` of all sockets
     *
     * @api private
     */

    Manager.prototype.updateSocketIds = function () {
      for (var nsp in this.nsps) {
        if (has.call(this.nsps, nsp)) {
          this.nsps[nsp].id = this.generateId(nsp);
        }
      }
    };

    /**
     * generate `socket.id` for the given `nsp`
     *
     * @param {String} nsp
     * @return {String}
     * @api private
     */

    Manager.prototype.generateId = function (nsp) {
      return (nsp === '/' ? '' : (nsp + '#')) + this.engine.id;
    };

    /**
     * Mix in `Emitter`.
     */

    componentEmitter(Manager.prototype);

    /**
     * Sets the `reconnection` config.
     *
     * @param {Boolean} true/false if it should automatically reconnect
     * @return {Manager} self or value
     * @api public
     */

    Manager.prototype.reconnection = function (v) {
      if (!arguments.length) return this._reconnection;
      this._reconnection = !!v;
      return this;
    };

    /**
     * Sets the reconnection attempts config.
     *
     * @param {Number} max reconnection attempts before giving up
     * @return {Manager} self or value
     * @api public
     */

    Manager.prototype.reconnectionAttempts = function (v) {
      if (!arguments.length) return this._reconnectionAttempts;
      this._reconnectionAttempts = v;
      return this;
    };

    /**
     * Sets the delay between reconnections.
     *
     * @param {Number} delay
     * @return {Manager} self or value
     * @api public
     */

    Manager.prototype.reconnectionDelay = function (v) {
      if (!arguments.length) return this._reconnectionDelay;
      this._reconnectionDelay = v;
      this.backoff && this.backoff.setMin(v);
      return this;
    };

    Manager.prototype.randomizationFactor = function (v) {
      if (!arguments.length) return this._randomizationFactor;
      this._randomizationFactor = v;
      this.backoff && this.backoff.setJitter(v);
      return this;
    };

    /**
     * Sets the maximum delay between reconnections.
     *
     * @param {Number} delay
     * @return {Manager} self or value
     * @api public
     */

    Manager.prototype.reconnectionDelayMax = function (v) {
      if (!arguments.length) return this._reconnectionDelayMax;
      this._reconnectionDelayMax = v;
      this.backoff && this.backoff.setMax(v);
      return this;
    };

    /**
     * Sets the connection timeout. `false` to disable
     *
     * @return {Manager} self or value
     * @api public
     */

    Manager.prototype.timeout = function (v) {
      if (!arguments.length) return this._timeout;
      this._timeout = v;
      return this;
    };

    /**
     * Starts trying to reconnect if reconnection is enabled and we have not
     * started reconnecting yet
     *
     * @api private
     */

    Manager.prototype.maybeReconnectOnOpen = function () {
      // Only try to reconnect if it's the first time we're connecting
      if (!this.reconnecting && this._reconnection && this.backoff.attempts === 0) {
        // keeps reconnection from firing twice for the same reconnection loop
        this.reconnect();
      }
    };

    /**
     * Sets the current transport `socket`.
     *
     * @param {Function} optional, callback
     * @return {Manager} self
     * @api public
     */

    Manager.prototype.open =
    Manager.prototype.connect = function (fn, opts) {
      debug$6('readyState %s', this.readyState);
      if (~this.readyState.indexOf('open')) return this;

      debug$6('opening %s', this.uri);
      this.engine = lib(this.uri, this.opts);
      var socket = this.engine;
      var self = this;
      this.readyState = 'opening';
      this.skipReconnect = false;

      // emit `open`
      var openSub = on_1(socket, 'open', function () {
        self.onopen();
        fn && fn();
      });

      // emit `connect_error`
      var errorSub = on_1(socket, 'error', function (data) {
        debug$6('connect_error');
        self.cleanup();
        self.readyState = 'closed';
        self.emitAll('connect_error', data);
        if (fn) {
          var err = new Error('Connection error');
          err.data = data;
          fn(err);
        } else {
          // Only do this if there is no fn to handle the error
          self.maybeReconnectOnOpen();
        }
      });

      // emit `connect_timeout`
      if (false !== this._timeout) {
        var timeout = this._timeout;
        debug$6('connect attempt will timeout after %d', timeout);

        if (timeout === 0) {
          openSub.destroy(); // prevents a race condition with the 'open' event
        }

        // set timer
        var timer = setTimeout(function () {
          debug$6('connect attempt timed out after %d', timeout);
          openSub.destroy();
          socket.close();
          socket.emit('error', 'timeout');
          self.emitAll('connect_timeout', timeout);
        }, timeout);

        this.subs.push({
          destroy: function () {
            clearTimeout(timer);
          }
        });
      }

      this.subs.push(openSub);
      this.subs.push(errorSub);

      return this;
    };

    /**
     * Called upon transport open.
     *
     * @api private
     */

    Manager.prototype.onopen = function () {
      debug$6('open');

      // clear old subs
      this.cleanup();

      // mark as open
      this.readyState = 'open';
      this.emit('open');

      // add new subs
      var socket = this.engine;
      this.subs.push(on_1(socket, 'data', componentBind(this, 'ondata')));
      this.subs.push(on_1(socket, 'ping', componentBind(this, 'onping')));
      this.subs.push(on_1(socket, 'pong', componentBind(this, 'onpong')));
      this.subs.push(on_1(socket, 'error', componentBind(this, 'onerror')));
      this.subs.push(on_1(socket, 'close', componentBind(this, 'onclose')));
      this.subs.push(on_1(this.decoder, 'decoded', componentBind(this, 'ondecoded')));
    };

    /**
     * Called upon a ping.
     *
     * @api private
     */

    Manager.prototype.onping = function () {
      this.lastPing = new Date();
      this.emitAll('ping');
    };

    /**
     * Called upon a packet.
     *
     * @api private
     */

    Manager.prototype.onpong = function () {
      this.emitAll('pong', new Date() - this.lastPing);
    };

    /**
     * Called with data.
     *
     * @api private
     */

    Manager.prototype.ondata = function (data) {
      this.decoder.add(data);
    };

    /**
     * Called when parser fully decodes a packet.
     *
     * @api private
     */

    Manager.prototype.ondecoded = function (packet) {
      this.emit('packet', packet);
    };

    /**
     * Called upon socket error.
     *
     * @api private
     */

    Manager.prototype.onerror = function (err) {
      debug$6('error', err);
      this.emitAll('error', err);
    };

    /**
     * Creates a new socket for the given `nsp`.
     *
     * @return {Socket}
     * @api public
     */

    Manager.prototype.socket = function (nsp, opts) {
      var socket = this.nsps[nsp];
      if (!socket) {
        socket = new socket$1(this, nsp, opts);
        this.nsps[nsp] = socket;
        var self = this;
        socket.on('connecting', onConnecting);
        socket.on('connect', function () {
          socket.id = self.generateId(nsp);
        });

        if (this.autoConnect) {
          // manually call here since connecting event is fired before listening
          onConnecting();
        }
      }

      function onConnecting () {
        if (!~indexof(self.connecting, socket)) {
          self.connecting.push(socket);
        }
      }

      return socket;
    };

    /**
     * Called upon a socket close.
     *
     * @param {Socket} socket
     */

    Manager.prototype.destroy = function (socket) {
      var index = indexof(this.connecting, socket);
      if (~index) this.connecting.splice(index, 1);
      if (this.connecting.length) return;

      this.close();
    };

    /**
     * Writes a packet.
     *
     * @param {Object} packet
     * @api private
     */

    Manager.prototype.packet = function (packet) {
      debug$6('writing packet %j', packet);
      var self = this;
      if (packet.query && packet.type === 0) packet.nsp += '?' + packet.query;

      if (!self.encoding) {
        // encode, then write to engine with result
        self.encoding = true;
        this.encoder.encode(packet, function (encodedPackets) {
          for (var i = 0; i < encodedPackets.length; i++) {
            self.engine.write(encodedPackets[i], packet.options);
          }
          self.encoding = false;
          self.processPacketQueue();
        });
      } else { // add packet to the queue
        self.packetBuffer.push(packet);
      }
    };

    /**
     * If packet buffer is non-empty, begins encoding the
     * next packet in line.
     *
     * @api private
     */

    Manager.prototype.processPacketQueue = function () {
      if (this.packetBuffer.length > 0 && !this.encoding) {
        var pack = this.packetBuffer.shift();
        this.packet(pack);
      }
    };

    /**
     * Clean up transport subscriptions and packet buffer.
     *
     * @api private
     */

    Manager.prototype.cleanup = function () {
      debug$6('cleanup');

      var subsLength = this.subs.length;
      for (var i = 0; i < subsLength; i++) {
        var sub = this.subs.shift();
        sub.destroy();
      }

      this.packetBuffer = [];
      this.encoding = false;
      this.lastPing = null;

      this.decoder.destroy();
    };

    /**
     * Close the current socket.
     *
     * @api private
     */

    Manager.prototype.close =
    Manager.prototype.disconnect = function () {
      debug$6('disconnect');
      this.skipReconnect = true;
      this.reconnecting = false;
      if ('opening' === this.readyState) {
        // `onclose` will not fire because
        // an open event never happened
        this.cleanup();
      }
      this.backoff.reset();
      this.readyState = 'closed';
      if (this.engine) this.engine.close();
    };

    /**
     * Called upon engine close.
     *
     * @api private
     */

    Manager.prototype.onclose = function (reason) {
      debug$6('onclose');

      this.cleanup();
      this.backoff.reset();
      this.readyState = 'closed';
      this.emit('close', reason);

      if (this._reconnection && !this.skipReconnect) {
        this.reconnect();
      }
    };

    /**
     * Attempt a reconnection.
     *
     * @api private
     */

    Manager.prototype.reconnect = function () {
      if (this.reconnecting || this.skipReconnect) return this;

      var self = this;

      if (this.backoff.attempts >= this._reconnectionAttempts) {
        debug$6('reconnect failed');
        this.backoff.reset();
        this.emitAll('reconnect_failed');
        this.reconnecting = false;
      } else {
        var delay = this.backoff.duration();
        debug$6('will wait %dms before reconnect attempt', delay);

        this.reconnecting = true;
        var timer = setTimeout(function () {
          if (self.skipReconnect) return;

          debug$6('attempting reconnect');
          self.emitAll('reconnect_attempt', self.backoff.attempts);
          self.emitAll('reconnecting', self.backoff.attempts);

          // check again for the case socket closed in above events
          if (self.skipReconnect) return;

          self.open(function (err) {
            if (err) {
              debug$6('reconnect attempt error');
              self.reconnecting = false;
              self.reconnect();
              self.emitAll('reconnect_error', err.data);
            } else {
              debug$6('reconnect success');
              self.onreconnect();
            }
          });
        }, delay);

        this.subs.push({
          destroy: function () {
            clearTimeout(timer);
          }
        });
      }
    };

    /**
     * Called upon successful reconnect.
     *
     * @api private
     */

    Manager.prototype.onreconnect = function () {
      var attempt = this.backoff.attempts;
      this.reconnecting = false;
      this.backoff.reset();
      this.updateSocketIds();
      this.emitAll('reconnect', attempt);
    };

    var lib$1 = createCommonjsModule(function (module, exports) {
    /**
     * Module dependencies.
     */




    var debug = browser('socket.io-client');

    /**
     * Module exports.
     */

    module.exports = exports = lookup;

    /**
     * Managers cache.
     */

    var cache = exports.managers = {};

    /**
     * Looks up an existing `Manager` for multiplexing.
     * If the user summons:
     *
     *   `io('http://localhost/a');`
     *   `io('http://localhost/b');`
     *
     * We reuse the existing instance based on same scheme/port/host,
     * and we initialize sockets for each namespace.
     *
     * @api public
     */

    function lookup (uri, opts) {
      if (typeof uri === 'object') {
        opts = uri;
        uri = undefined;
      }

      opts = opts || {};

      var parsed = url_1(uri);
      var source = parsed.source;
      var id = parsed.id;
      var path = parsed.path;
      var sameNamespace = cache[id] && path in cache[id].nsps;
      var newConnection = opts.forceNew || opts['force new connection'] ||
                          false === opts.multiplex || sameNamespace;

      var io;

      if (newConnection) {
        debug('ignoring socket cache for %s', source);
        io = manager(source, opts);
      } else {
        if (!cache[id]) {
          debug('new io instance for %s', source);
          cache[id] = manager(source, opts);
        }
        io = cache[id];
      }
      if (parsed.query && !opts.query) {
        opts.query = parsed.query;
      }
      return io.socket(parsed.path, opts);
    }

    /**
     * Protocol version.
     *
     * @api public
     */

    exports.protocol = socket_ioParser.protocol;

    /**
     * `connect`.
     *
     * @param {String} uri
     * @api public
     */

    exports.connect = lookup;

    /**
     * Expose constructors for standalone build.
     *
     * @api public
     */

    exports.Manager = manager;
    exports.Socket = socket$1;
    });

    /* src\App.svelte generated by Svelte v3.29.4 */

    const { console: console_1$4 } = globals;
    const file$k = "src\\App.svelte";

    // (293:1) {#if spellPlayedID}
    function create_if_block$8(ctx) {
    	let castspell;
    	let current;

    	castspell = new CastSpell({
    			props: { spellPlayedID: /*spellPlayedID*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(castspell.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(castspell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const castspell_changes = {};
    			if (dirty & /*spellPlayedID*/ 2) castspell_changes.spellPlayedID = /*spellPlayedID*/ ctx[1];
    			castspell.$set(castspell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(castspell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(castspell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(castspell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(293:1) {#if spellPlayedID}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let main;
    	let gameovermodal;
    	let t0;
    	let graveyardselector;
    	let t1;
    	let t2;
    	let endturnbutton;
    	let t3;
    	let div0;
    	let div0_class_value;
    	let t4;
    	let div3;
    	let opponenthandsection;
    	let t5;
    	let div2;
    	let div1;
    	let opponentherosection;
    	let t6;
    	let opponentboardsection;
    	let t7;
    	let seperator;
    	let t8;
    	let userboardsection;
    	let t9;
    	let userherosection;
    	let t10;
    	let userhandsection;
    	let current;
    	let mounted;
    	let dispose;
    	gameovermodal = new GameOver({ $$inline: true });
    	graveyardselector = new GraveyardSelector({ $$inline: true });
    	let if_block = /*spellPlayedID*/ ctx[1] && create_if_block$8(ctx);

    	endturnbutton = new EndTurnButton({
    			props: { emitEndTurn: /*emitEndTurn*/ ctx[3] },
    			$$inline: true
    		});

    	opponenthandsection = new OpponentHandSection({ $$inline: true });

    	opponentherosection = new OpponentHeroSection({
    			props: {
    				emitHeroDamaged: /*emitHeroDamaged*/ ctx[7],
    				emitGameOver: /*emitGameOver*/ ctx[0]
    			},
    			$$inline: true
    		});

    	opponentboardsection = new OpponentBoardSection({
    			props: {
    				emitBattleResult: /*emitBattleResult*/ ctx[6]
    			},
    			$$inline: true
    		});

    	seperator = new Seperator({ $$inline: true });

    	userboardsection = new UserBoardSection({
    			props: {
    				emitPlayedMinion: /*emitPlayedMinion*/ ctx[4]
    			},
    			$$inline: true
    		});

    	userherosection = new UserHeroSection({ $$inline: true });

    	userhandsection = new UserHandSection({
    			props: {
    				emitPlayedSpell: /*emitPlayedSpell*/ ctx[5],
    				emitUpdateHand: /*emitUpdateHand*/ ctx[8]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(gameovermodal.$$.fragment);
    			t0 = space();
    			create_component(graveyardselector.$$.fragment);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			create_component(endturnbutton.$$.fragment);
    			t3 = space();
    			div0 = element("div");
    			t4 = space();
    			div3 = element("div");
    			create_component(opponenthandsection.$$.fragment);
    			t5 = space();
    			div2 = element("div");
    			div1 = element("div");
    			create_component(opponentherosection.$$.fragment);
    			t6 = space();
    			create_component(opponentboardsection.$$.fragment);
    			t7 = space();
    			create_component(seperator.$$.fragment);
    			t8 = space();
    			create_component(userboardsection.$$.fragment);
    			t9 = space();
    			create_component(userherosection.$$.fragment);
    			t10 = space();
    			create_component(userhandsection.$$.fragment);

    			attr_dev(div0, "class", div0_class_value = "backdrop " + (/*$gameState*/ ctx[2].attackingMinion.clickActive
    			? "displayBackdrop"
    			: "") + " " + (/*$gameState*/ ctx[2].usersTurn ? "" : "disableGameplay") + " svelte-sjt56i");

    			add_location(div0, file$k, 296, 1, 6959);
    			attr_dev(div1, "class", "wrapper svelte-sjt56i");
    			add_location(div1, file$k, 302, 3, 7212);
    			attr_dev(div2, "class", "gameArena svelte-sjt56i");
    			add_location(div2, file$k, 301, 2, 7185);
    			attr_dev(div3, "class", "gameContainer svelte-sjt56i");
    			add_location(div3, file$k, 299, 1, 7129);
    			attr_dev(main, "class", "mainContainer svelte-sjt56i");
    			add_location(main, file$k, 289, 0, 6795);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(gameovermodal, main, null);
    			append_dev(main, t0);
    			mount_component(graveyardselector, main, null);
    			append_dev(main, t1);
    			if (if_block) if_block.m(main, null);
    			append_dev(main, t2);
    			mount_component(endturnbutton, main, null);
    			append_dev(main, t3);
    			append_dev(main, div0);
    			append_dev(main, t4);
    			append_dev(main, div3);
    			mount_component(opponenthandsection, div3, null);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			mount_component(opponentherosection, div1, null);
    			append_dev(div1, t6);
    			mount_component(opponentboardsection, div1, null);
    			append_dev(div1, t7);
    			mount_component(seperator, div1, null);
    			append_dev(div1, t8);
    			mount_component(userboardsection, div1, null);
    			append_dev(div1, t9);
    			mount_component(userherosection, div1, null);
    			append_dev(div3, t10);
    			mount_component(userhandsection, div3, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*removeBackdrop*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*spellPlayedID*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*spellPlayedID*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$8(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(main, t2);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*$gameState*/ 4 && div0_class_value !== (div0_class_value = "backdrop " + (/*$gameState*/ ctx[2].attackingMinion.clickActive
    			? "displayBackdrop"
    			: "") + " " + (/*$gameState*/ ctx[2].usersTurn ? "" : "disableGameplay") + " svelte-sjt56i")) {
    				attr_dev(div0, "class", div0_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gameovermodal.$$.fragment, local);
    			transition_in(graveyardselector.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(endturnbutton.$$.fragment, local);
    			transition_in(opponenthandsection.$$.fragment, local);
    			transition_in(opponentherosection.$$.fragment, local);
    			transition_in(opponentboardsection.$$.fragment, local);
    			transition_in(seperator.$$.fragment, local);
    			transition_in(userboardsection.$$.fragment, local);
    			transition_in(userherosection.$$.fragment, local);
    			transition_in(userhandsection.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gameovermodal.$$.fragment, local);
    			transition_out(graveyardselector.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(endturnbutton.$$.fragment, local);
    			transition_out(opponenthandsection.$$.fragment, local);
    			transition_out(opponentherosection.$$.fragment, local);
    			transition_out(opponentboardsection.$$.fragment, local);
    			transition_out(seperator.$$.fragment, local);
    			transition_out(userboardsection.$$.fragment, local);
    			transition_out(userherosection.$$.fragment, local);
    			transition_out(userhandsection.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(gameovermodal);
    			destroy_component(graveyardselector);
    			if (if_block) if_block.d();
    			destroy_component(endturnbutton);
    			destroy_component(opponenthandsection);
    			destroy_component(opponentherosection);
    			destroy_component(opponentboardsection);
    			destroy_component(seperator);
    			destroy_component(userboardsection);
    			destroy_component(userherosection);
    			destroy_component(userhandsection);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let $gameState;
    	validate_store(gameState, "gameState");
    	component_subscribe($$self, gameState, $$value => $$invalidate(2, $gameState = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let spellPlayedID;

    	//https://cardgamev1.herokuapp.com/
    	let socket = lib$1("localhost:5002");

    	onMount(async () => {
    		socket.emit("join");

    		socket.on("gameOver", ({ winner }) => {
    			gameState.update(game => ({
    				...game,
    				gameOver: true,
    				userWins: winner
    			}));
    		});

    		socket.on("startGame", ({ start, user, opponentHand }) => {
    			setOpponentHand(opponentHand);
    			setUserHand(user.hand);
    			setUserDeck(user.deck);
    			console.log("game start", user.hand);

    			//refactor
    			if (start === "yes") {
    				gameState.update(game => ({ ...game, usersTurn: true }));
    				incrementUserMana();
    			} else {
    				gameState.update(game => ({ ...game, usersTurn: false }));
    				incrementOpponentMana();
    			}
    		});

    		socket.on("startTurn", () => {
    			console.log("turn start");
    			let card = drawCard();
    			socket.emit("cardDraw", { cards: [card] });
    			resetAtkPoints();
    			resetUserMana();
    			setUsersTurn(true);
    			incrementUserMana();
    		});

    		socket.on("turnEnding", () => {
    			setTurnEnding(true);
    		});

    		socket.on("endTurn", () => {
    			setTurnEnding(false);
    			setUsersTurn(false);

    			//make master for opponent mana handling
    			incrementOpponentMana();

    			resetOpponentMana();
    		});

    		socket.on("opponentPlaysMinion", ({ board, hand, cardID }) => {
    			setOpponentHand(hand);
    			setOpponentBoard(board);
    			let playedCard = get_store_value(opponentBoard).find(card => card.id === cardID);
    			console.log(playedCard, "played card");
    			reduceOpponentTempMana(playedCard.tempStats.cost);
    			console.log(hand, board, "opponent played card");
    		});

    		socket.on("opponentPlaysSpell", ({ cardID }) => {
    			//do something here
    			console.log("spell played", cardID);

    			$$invalidate(1, spellPlayedID = cardID);

    			setTimeout(
    				() => {
    					$$invalidate(1, spellPlayedID = undefined);
    				},
    				1060
    			);

    			let card = sendOpponentCardFromHandToGrave(cardID);
    			reduceOpponentTempMana(card.tempStats.cost);
    		});

    		socket.on("cardDraw", ({ cards }) => {
    			console.log(cards, "card draw");
    			addCardsToOpponentHand(cards);
    		});

    		socket.on("battleResult", ({ atkBoard, defBoard, atkGrave, defGrave }) => {
    			setOpponentBoard(atkBoard);
    			setUserBoard(defBoard);
    			setUserGraveyard(defGrave);
    			setOpponentGraveyard(atkGrave);
    		});

    		socket.on("heroDamaged", ({ newHeroHealth }) => {
    			console.log(newHeroHealth);
    			setUserHeroHealth(newHeroHealth);
    			console.log($gameState.userTempStats.health);
    		});

    		socket.on("updateOpponentHand", ({ hand }) => {
    			setOpponentHand(hand);
    		});
    	});

    	/*ON DESTROY  */
    	onDestroy(() => {
    		socket.disconnect();
    		socket.off();
    	});

    	/* EMITS */
    	const emitEndTurn = () => {
    		if ($gameState.usersTurn) {
    			socket.emit("endTurn");
    			setUsersTurn(false);
    			setTurnEnding(false);

    			//maybe make a master function for handling opponent mana
    			incrementOpponentMana();

    			resetOpponentMana();
    		}
    	};

    	const emitPlayedMinion = cardID => {
    		let hand = get_store_value(userHand);
    		let board = get_store_value(userBoard);
    		socket.emit("minionPlayed", { board, hand, cardID });
    	};

    	const emitPlayedSpell = cardID => {
    		socket.emit("spellPlayed", { cardID });
    	};

    	const emitBattleResult = () => {
    		let atkBoard = get_store_value(userBoard);
    		let defBoard = get_store_value(opponentBoard);
    		let atkGrave = get_store_value(userGraveyard);
    		let defGrave = get_store_value(opponentGraveyard);
    		socket.emit("battleResult", { atkBoard, defBoard, atkGrave, defGrave });
    	};

    	const emitHeroDamaged = () => {
    		let newHeroHealth = get_store_value(gameState).opponentTempStats.health;
    		socket.emit("heroDamaged", { newHeroHealth });
    	};

    	const emitUpdateHand = () => {
    		let hand = get_store_value(userHand);
    		socket.emit("updateHand", { hand });
    	};

    	const emitGameOver = opponentWon => {
    		socket.emit("gameOver", { opponentWon });
    	};

    	/* BACKDROP */
    	const removeBackdrop = () => {
    		gameState.update(game => ({
    			...game,
    			attackingMinion: { clickActive: false, selectedMinionID: "" }
    		}));
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$4.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		UserBoardSection,
    		OpponentBoardSection,
    		UserHandSection,
    		OpponentHandSection,
    		UserHeroSection,
    		OpponentHeroSection,
    		Seperator,
    		EndTurnButton,
    		GraveyardSelector,
    		GameOverModal: GameOver,
    		CastSpell,
    		get: get_store_value,
    		gameState,
    		setUsersTurn,
    		setTurnEnding,
    		setUserHeroHealth,
    		incrementUserMana,
    		resetUserMana,
    		incrementOpponentMana,
    		reduceOpponentTempMana,
    		resetOpponentMana,
    		setOpponentHand,
    		setUserHand,
    		userHand,
    		addCardsToOpponentHand,
    		setUserDeck,
    		setOpponentBoard,
    		userBoard,
    		opponentBoard,
    		setUserBoard,
    		resetAtkPoints,
    		drawCard,
    		sendOpponentCardFromHandToGrave,
    		userGraveyard,
    		opponentGraveyard,
    		setOpponentGraveyard,
    		setUserGraveyard,
    		io: lib$1,
    		onMount,
    		onDestroy,
    		Graveyard,
    		spellPlayedID,
    		socket,
    		emitEndTurn,
    		emitPlayedMinion,
    		emitPlayedSpell,
    		emitBattleResult,
    		emitHeroDamaged,
    		emitUpdateHand,
    		emitGameOver,
    		removeBackdrop,
    		$gameState
    	});

    	$$self.$inject_state = $$props => {
    		if ("spellPlayedID" in $$props) $$invalidate(1, spellPlayedID = $$props.spellPlayedID);
    		if ("socket" in $$props) socket = $$props.socket;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		emitGameOver,
    		spellPlayedID,
    		$gameState,
    		emitEndTurn,
    		emitPlayedMinion,
    		emitPlayedSpell,
    		emitBattleResult,
    		emitHeroDamaged,
    		emitUpdateHand,
    		removeBackdrop
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, { emitGameOver: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$k.name
    		});
    	}

    	get emitGameOver() {
    		return this.$$.ctx[0];
    	}

    	set emitGameOver(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

import spark from "@candlefw/spark";
import * as css from "@candlefw/css";

import common_methods from "./common_methods.js";
import { GlowAnimation } from "./types.js";



const
    CSS_Length = css.types.length,
    CSS_Percentage = css.types.percentage,
    CSS_Color = css.types.color,
    CSS_Transform2D = css.types.transform2D,
    CSS_Path = css.types.path,
    CSS_Bezier = css.types.cubic_bezier,

    Animation = <GlowAnimation><unknown>(function anim() {

        var USE_TRANSFORM = false;

        const
            CSS_STYLE = 0,
            JS_OBJECT = 1,
            SVG = 3;

        function setType(obj) {
            if (obj instanceof HTMLElement) {
                if (obj.tagName == "SVG")
                    return SVG;
                return CSS_STYLE;
            }
            return JS_OBJECT;
        }

        const Linear = { getYatX: x => x, toString: () => "linear" };


        // Class to linearly interpolate number.
        class lerpNumber extends Number { lerp(to, t, from = 0) { return this + (to - this) * t; } copy(val) { return new lerpNumber(val); } }

        class lerpNonNumeric {
            constructor(v) { this.v = v; } lerp(to, t, from) {
                return from.v;
            }
            copy(val) { return new lerpNonNumeric(val); }
        }


        // Store animation data for a single property on a single object. Hosts methods that can create CSS based interpolation and regular JS property animations. 
        class AnimProp {

            duration: number;
            end: boolean;
            keys: Array<any>;
            current_val: any;
            type: any;

            constructor(keys, obj, prop_name, type) {
                this.duration = 0;
                this.end = false;
                this.keys = [];
                this.current_val = null;

                const
                    IS_ARRAY = Array.isArray(keys),
                    k0 = IS_ARRAY ? keys[0] : keys,
                    k0_val = typeof (k0.value) !== "undefined" ? k0.value : k0.v;

                if (prop_name == "transform")
                    this.type = CSS_Transform2D;
                else
                    this.type = this.getType(k0_val);

                this.getValue(obj, prop_name, type, k0_val);

                let p = this.current_val;

                if (IS_ARRAY)
                    keys.forEach(k => p = this.addKey(k, p));
                else
                    this.addKey(keys, p);
            }

            destroy() {
                this.keys = null;
                this.type = null;
                this.current_val = null;
            }

            getValue(obj, prop_name, type, k0_val) {

                if (type == CSS_STYLE) {
                    let name = prop_name.replace(/[A-Z]/g, (match) => "-" + match.toLowerCase());
                    let cs = window.getComputedStyle(obj);

                    //Try to get computed value. If it does not exist, then get value from the style attribtute.
                    let value = parseFloat(cs.getPropertyValue(name));

                    if (!value)
                        value = parseFloat(obj.style[prop_name]);

                    if (this.type == CSS_Percentage) {
                        if (obj.parentElement) {

                            const
                                pcs = window.getComputedStyle(obj.parentElement),
                                pvalue = parseFloat(pcs.getPropertyValue(name)),
                                ratio = value / parseFloat(pvalue);

                            value = (ratio * 100);
                        }
                    }
                    this.current_val = (new this.type(value));

                } else {
                    this.current_val = new this.type(obj[prop_name]);
                }
            }

            getType(value) {

                switch (typeof (value)) {
                    case "number":
                        return lerpNumber;
                        break;
                    case "string":
                        if (CSS_Length._verify_(value))
                            return CSS_Length;
                        if (CSS_Percentage._verify_(value))
                            return CSS_Percentage;
                        if (CSS_Color._verify_(value))
                            return CSS_Color;
                    //intentional
                    case "object":
                        return lerpNonNumeric;
                }
            }

            addKey(key, prev) {
                let
                    l = this.keys.length,
                    pkey = this.keys[l - 1],
                    v = (key.value !== undefined) ? key.value : key.v,
                    own_key = {
                        val: (prev) ? prev.copy(v) : new this.type(v) || 0,
                        dur: key.duration || key.dur || 0,
                        del: key.delay || key.del || 0,
                        ease: key.easing || key.e || ((pkey) ? pkey.ease : Linear),
                        len: 0
                    };

                own_key.len = own_key.dur + own_key.del;

                this.keys.push(own_key);

                this.duration += own_key.len;

                return own_key.val;
            }

            getValueAtTime(time = 0) {
                let val_start = this.current_val,
                    val_end = this.current_val,
                    key, val_out = val_start;


                for (let i = 0; i < this.keys.length; i++) {
                    key = this.keys[i];
                    val_end = key.val;
                    if (time < key.len) {
                        break;
                    } else
                        time -= key.len;
                    val_start = key.val;
                }


                if (key) {
                    if (time < key.len) {
                        if (time < key.del) {
                            val_out = val_start;
                        } else {
                            let x = (time - key.del) / key.dur;
                            let s = key.ease.getYatX(x);
                            val_out = val_start.lerp(val_end, s, val_start);
                        }
                    } else {
                        val_out = val_end;
                    }
                }

                return val_out;
            }

            run(obj, prop_name, time, type) {
                const val_out = this.getValueAtTime(time);
                this.setProp(obj, prop_name, val_out, type);
                return time < this.duration;
            }

            setProp(obj, prop_name, value, type) {
                if (type == CSS_STYLE) {
                    obj.style[prop_name] = value;
                } else
                    obj[prop_name] = value;
            }

            unsetProp(obj, prop_name) {
                this.setProp(obj, prop_name, "", CSS_STYLE);
            }

            toCSSString(time = 0, prop_name = "") {
                const value = this.getValueAtTime(time);
                return `${prop_name}:${value.toString()}`;
            }
        }

        // Stores animation data for a group of properties. Defines delay and repeat.
        class AnimSequence {
            duration: number;
            CSS_ANIMATING: boolean;
            props: any;
            obj: any;
            type: any;
            style: any;

            constructor(obj, props) {

                //@ts-ignore
                this.constructCommon();
                this.obj = null;
                this.type = setType(obj);
                this.CSS_ANIMATING = false;

                switch (this.type) {
                    case CSS_STYLE:
                        this.obj = obj;
                        break;
                    case SVG:
                    case JS_OBJECT:
                        this.obj = obj;
                        break;
                }

                this.props = {};
                this.setProps(props);
            }

            destroy() {
                for (let name in this.props)
                    if (this.props[name])
                        this.props[name].destroy();
                this.obj = null;
                this.props = null;

                //@ts-ignore
                this.destroyCommon();
            }

            // Removes AnimProps based on object of keys that should be removed from this sequence.
            removeProps(props) {
                if (props instanceof AnimSequence)
                    props = props.props;

                for (let name in props) {
                    if (this.props[name])
                        this.props[name] = null;
                }
            }

            unsetProps(props) {
                for (let name in this.props)
                    this.props[name].unsetProp(this.obj, name);
            }

            setProps(props) {
                for (let name in this.props)
                    this.props[name].destroy();

                this.props = {};

                for (let name in props)
                    this.configureProp(name, props[name]);
            }

            configureProp(name, keys) {
                let prop;
                if (prop = this.props[name]) {
                    this.duration = Math.max(prop.duration || prop.dur, this.duration);
                } else {
                    prop = new AnimProp(keys, this.obj, name, this.type);
                    this.props[name] = prop;
                    this.duration = Math.max(prop.duration || prop.dur, this.duration);
                }
            }

            run(i) {

                for (let n in this.props) {
                    let prop = this.props[n];
                    if (prop)
                        prop.run(this.obj, n, i, this.type);
                }

                return (i <= this.duration && i >= 0);
            }


            toCSSString(keyfram_id) {

                const easing = "linear";

                const strings = [`.${keyfram_id}{animation:${keyfram_id} ${this.duration}ms ${Animation.ease_out.toString()}}`, `@keyframes ${keyfram_id}{`];

                // TODO: Use some function to determine the number of steps that should be taken
                // This should reflect the different keyframe variations that can occure between
                // properties.
                // For now, just us an arbitrary number

                const
                    len = 2,
                    len_m_1 = len - 1;

                for (let i = 0; i < len; i++) {

                    strings.push(`${Math.round((i / len_m_1) * 100)}%{`);

                    for (let name in this.props)
                        strings.push(this.props[name]
                            .toCSSString(
                                (i / len_m_1) * this.duration,
                                name.replace(/([A-Z])/g, (match, p1) => "-" + match.toLowerCase()
                                )
                            ) + ";");

                    strings.push("}");
                }

                strings.push("}");

                return strings.join("\n");
            }

            beginCSSAnimation() {

                if (!this.CSS_ANIMATING) {

                    const anim_class = "class" + ((Math.random() * 10000) | 0);

                    this.CSS_ANIMATING = !!anim_class;

                    this.obj.classList.add(anim_class);

                    let style = document.createElement("style");

                    style.innerHTML = this.toCSSString(anim_class);

                    document.head.appendChild(style);

                    this.style = style;

                    setTimeout(this.endCSSAnimation.bind(this), this.duration);
                }
            }

            endCSSAnimation() {

                if (this.CSS_ANIMATING) {

                    this.obj.classList.remove(this.CSS_ANIMATING);

                    this.CSS_ANIMATING = !!"";

                    this.style.parentElement.removeChild(this.style);

                    this.style = null;
                }
            }
        }


        class AnimGroup {
            seq: Array<any>;

            duration: number;

            constructor(sequences: AnimSequence[]) {

                //@ts-ignore
                this.constructCommon();

                this.seq = [];

                for (const seq of sequences)
                    this.add(seq);
            }

            destroy() {
                this.seq.forEach(seq => seq.destroy());
                this.seq = null;

                //@ts-ignore
                this.destroyCommon();
            }

            add(seq) {

                this.seq.push(seq);

                this.duration = Math.max(this.duration, seq.duration);
            }

            run(t) {

                for (let i = 0, l = this.seq.length; i < l; i++) {
                    let seq = this.seq[i];
                    seq.run(t);
                }


                return (t < this.duration);
            }
        }

        Object.assign(AnimGroup.prototype, common_methods);
        Object.assign(AnimSequence.prototype, common_methods);

        /** END SHARED METHODS **/

        const GlowFunction = function (...args) {

            const output = [];

            for (let i = 0; i < args.length; i++) {

                let data = args[i];

                let obj = data.obj;

                if (obj) {

                    let props = {};

                    Object.keys(data).forEach(k => { if (!(({ obj: true, match: true, delay: true })[k])) props[k] = data[k]; });

                    output.push(new AnimSequence(obj, props));
                } else console.error(`Glow animation was passed an undefined object.`);
            }

            if (args.length > 1)
                return (new AnimGroup(output));

            return output.pop();
        };

        Object.assign(GlowFunction, {

            createSequence: GlowFunction,

            createGroup: (...rest: AnimSequence[]) => new AnimGroup(rest),

            set USE_TRANSFORM(v) { USE_TRANSFORM = !!v; },

            get USE_TRANSFORM() { return USE_TRANSFORM; },

            linear: Linear,

            ease: new CSS_Bezier(0.25, 0.1, 0.25, 1),
            ease_in: new CSS_Bezier(0.42, 0, 1, 1),
            ease_out: new CSS_Bezier(0.2, 0.8, 0.3, 0.99),
            ease_in_out: new CSS_Bezier(0.42, 0, 0.58, 1),
            overshoot: new CSS_Bezier(0.2, 1.5, 0.2, 0.8),
            anticipate: new CSS_Bezier(0.5, -0.5, 0.5, 0.8),

            custom: (x1, y1, x2, y2) => new CSS_Bezier(x1, y1, x2, y2)
        });

        return GlowFunction;
    })();

export { Animation };
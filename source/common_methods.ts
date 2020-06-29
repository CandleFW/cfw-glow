import spark from "@candlefw/spark";

import { AnimationMethods } from "./types";

export default <AnimationMethods>{

    await: async function () {
        return this.observeStop();
    },

    shuttle(SHUTTLE = true) {
        this.SHUTTLE = !!SHUTTLE;
        return this;
    },

    set(i) {

        if (i >= 0)
            this.run(i * this.duration);
        else
            this.run(this.duration - i * this.duration);

        return this;
    },

    step(i) { return this.set(i); },

    play(scale = 1, from = 0) {
        this.PLAY = true;
        this.SCALE = scale;
        this.time = from;
        spark.queueUpdate(this);
        this.issueEvent("started");
        return this;
    },

    async asyncPlay(scale, from) {

        this.play(scale, from);

        return this.observeStop();
    },

    stop() {
        //There may be a need to kill any existing CSS based animations
        this.PLAY = false;
        return this;
    },

    repeat(count = 1) {
        this.REPEAT = Math.max(0, parseFloat(count));
        return this;
    },

    addEventListener(event, listener) {
        if (typeof (listener) === "function") {
            if (!this.events[event])
                this.events[event] = [];
            this.events[event].push(listener);
        }
    },

    removeEventListener(event, listener) {
        if (typeof (listener) === "function") {
            const events = this.events[event];
            if (events)
                for (let i = 0; i < events.length; i++)
                    if (events[i] === listener)
                        return (events.splice(i, 1), true);
        }
        return false;
    },

    issueEvent(event) {
        if (this.events[event])
            this.events[event] = this.events[event].filter(e => e(this) !== false);
    },

    async observeStop() {
        return (new Promise(res => {

            if (this.duration > 0)
                this.scheduledUpdate(0, 0);

            if (this.duration < 1)
                return res();

            this.addEventListener("stopped", () => (res(), false));
        }));
    },

    scheduledUpdate(a, t) {

        if (!this.PLAY) return;

        this.time += t * this.SCALE;

        if (this.run(this.time)) {
            spark.queueUpdate(this);
        } else if (this.REPEAT) {
            let scale = this.SCALE;

            this.REPEAT--;

            if (this.SHUTTLE)
                scale = -scale;

            let from = (scale > 0) ? 0 : this.duration;

            this.play(scale, from);
        } else
            this.issueEvent("stopped");
    },

    constructCommon() {
        this.time = 0;
        this.duration = 0;
        this.REPEAT = 0;
        this.PLAY = true;
        this.DESTROYED = false;
        this.FINISHED = false;
        this.SHUTTLE = false;
        this.SCALE = 1;
        this.events = {};
    },

    destroyCommon() {
        this.DESTROYED = true;
        this.events = null;
    },
};
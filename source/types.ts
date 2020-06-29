const enum AnimationEvent {
    STOPPED = "stopped",
    STATED = "started"
}

/**
 * Chainable methods that are common to Glow animation 
 * objects.
 */
export interface AnimationMethods {


    /**
     * Pass `true` as first argument to cause
     * repeated animations to reverse direction
     * for each repeat.
     * @param SHUTTLE defaults to `true`.
     */
    shuttle(SHUTTLE?: boolean);

    set(i);

    /**
     * 
     * @param i 
     */
    step(i);

    /**
     * Play the animation. 
     * 
     * @param scale Speed ratio at which to play back the animation. Default is 1.
     * Negative ration plays animation backwards. 
     * 
     * @param from Offset ratio to start the animation, default is 0.
     */
    play(scale?: number, from?: number): void;

    /**
     * Play the animation and return promise that resolves after animation
     * playback is complete.  
     * 
     * @param scale Speed ratio at which to play back the animation. Default is 1.
     * Negative ration plays animation backwards. 
     * 
     * @param from Offset ratio to start the animation, default is 0.
     */
    asyncPlay(scale?: number, from?: number): Promise<void>;

    /**
     * Stops animation
     */
    stop();

    /**
     * Repeteadly play the animation for `count` times.
     * @param count number of times to repeat the animation.
     */
    repeat(count: number);

    /**
     * Remove object from the 
     * @param event - The event type to remove the listener from. Available
     * events are:
     *      - stopped
     *      - started
     * @param listener - The listening function that should be removed.
     */
    addEventListener(event: AnimationEvent, listener: () => void): void;

    /**
     * Remove object from the 
     * @param event - The event type to remove the listener from. Available
     * events are:
     *      - stopped
     *      - started
     * @param listener - The listening function that should be removed.
     */
    removeEventListener(event: AnimationEvent, listener: () => void): void;

    /**
     * For internal use. 
     */
    issueEvent(event: AnimationEvent);

    /**
     * For internal use. 
     */
    constructCommon();
    /**
     * For internal use. 
     */
    destroyCommon();
    /**
     * For internal use. 
     */
    scheduledUpdate(a, t);

    /**
     * For internal use. 
     */
    observeStop();
}

type AnimSequence = AnimationMethods;

type AnimGroup = AnimationMethods;

type AnimationInterpolation = {
    getYatX: (number) => number,
    lerp: (arg1: number, arg2: number, arg3?: number) => number;
    copy?: () => AnimationInterpolation;
};

export interface GlowAnimation {
    createSequence: AnimSequence,
    createGroup: (...rest: AnimSequence[]) => AnimGroup,
    linear: AnimationInterpolation,
    ease: AnimationInterpolation,
    ease_in: AnimationInterpolation,
    ease_out: AnimationInterpolation,
    ease_in_out: AnimationInterpolation,
    overshoot: AnimationInterpolation,
    anticipate: AnimationInterpolation,
    custom: (x1: number, y1: number, x2: number, y2: number) => AnimationInterpolation;
}


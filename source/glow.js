import { Animation } from "./animation.js";
import { Transitioneer } from "./transitioneer.js";
import { TransformTo } from "./transformto.js";

Object.assign(Animation, {
	createTransition:(...args) => Transitioneer.createTransition(...args),
	transformTo:(...args) => TransformTo(...args)
});

export default Animation;

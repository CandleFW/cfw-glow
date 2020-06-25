'use strict';

function _interopNamespace(e) {
    if (e && e.__esModule) { return e; } else {
        var n = {};
        if (e) {
            Object.keys(e).forEach(function (k) {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () {
                        return e[k];
                    }
                });
            });
        }
        n['default'] = e;
        return n;
    }
}

const global_object = (typeof global !== "undefined") ? global : window, cfw = global_object.cfw || {};
function addModuleToCFW(module, name) {
    if (global_object) {
        //@ts-ignore
        if (typeof global_object.cfw == "undefined") {
            //@ts-ignore
            global_object.cfw = cfw;
            //@ts-ignore
        }
        Object.defineProperty(global_object.cfw, name, { value: module, writable: false, configurable: false });
    }
}

/**
 * Used to call the Scheduler after a JavaScript runtime tick.
 *
 * Depending on the platform, caller will either map to requestAnimationFrame or it will be a setTimout.
 */
 
const caller = (typeof(window) == "object" && window.requestAnimationFrame) ? window.requestAnimationFrame : (f) => {
    setTimeout(f, 1);
};

const perf = (typeof(performance) == "undefined") ? { now: () => Date.now() } : performance;


/**
 * Handles updating objects. It does this by splitting up update cycles, to respect the browser event model. 
 *    
 * If any object is scheduled to be updated, it will be blocked from scheduling more updates until the next ES VM tick.
 */
class Spark {
    /**
     * Constructs the object.
     */
    constructor() {

        this.update_queue_a = [];
        this.update_queue_b = [];

        this.update_queue = this.update_queue_a;

        this.queue_switch = 0;

        this.callback = ()=>{};


        if(typeof(window) !== "undefined"){
            window.addEventListener("load",()=>{
                this.callback = () => this.update();
                caller(this.callback);
            });
        }else{
            this.callback = () => this.update();
        }


        this.frame_time = perf.now();

        this.SCHEDULE_PENDING = false;
    }

    /**
     * Given an object that has a _SCHD_ Boolean property, the Scheduler will queue the object and call its .update function 
     * the following tick. If the object does not have a _SCHD_ property, the Scheduler will persuade the object to have such a property.
     * 
     * If there are currently no queued objects when this is called, then the Scheduler will user caller to schedule an update.
     */
    queueUpdate(object, timestart = 1, timeend = 0) {

        if (object._SCHD_ || object._SCHD_ > 0) {
            if (this.SCHEDULE_PENDING)
                return;
            else
                return caller(this.callback);
        }

        object._SCHD_ = ((timestart & 0xFFFF) | ((timeend) << 16));

        this.update_queue.push(object);

        if (this._SCHD_)
            return;

        this.frame_time = perf.now() | 0;


        if(!this.SCHEDULE_PENDING){
            this.SCHEDULE_PENDING = true;
            caller(this.callback);
        }
    }

    removeFromQueue(object){

        if(object._SCHD_)
            for(let i = 0, l = this.update_queue.length; i < l; i++)
                if(this.update_queue[i] === object){
                    this.update_queue.splice(i,1);
                    object._SCHD_ = 0;

                    if(l == 1)
                        this.SCHEDULE_PENDING = false;

                    return;
                }
    }

    /**
     * Called by the caller function every tick. Calls .update on any object queued for an update. 
     */
    update() {

        this.SCHEDULE_PENDING = false;

        const uq = this.update_queue;
        const time = perf.now() | 0;
        const diff = Math.ceil(time - this.frame_time) | 1;
        const step_ratio = (diff * 0.06); //  step_ratio of 1 = 16.66666666 or 1000 / 60 for 60 FPS

        this.frame_time = time;
        
        if (this.queue_switch == 0)
            (this.update_queue = this.update_queue_b, this.queue_switch = 1);
        else
            (this.update_queue = this.update_queue_a, this.queue_switch = 0);

        for (let i = 0, l = uq.length, o = uq[0]; i < l; o = uq[++i]) {
            let timestart = ((o._SCHD_ & 0xFFFF)) - diff;
            let timeend = ((o._SCHD_ >> 16) & 0xFFFF);

            o._SCHD_ = 0;
            
            if (timestart > 0) {
                this.queueUpdate(o, timestart, timeend);
                continue;
            }

            timestart = 0;

            if (timeend > 0) 
                this.queueUpdate(o, timestart, timeend - diff);

            /** 
                To ensure on code path doesn't block any others, 
                scheduledUpdate methods are called within a try catch block. 
                Errors by default are printed to console. 
            **/
            try {
                o.scheduledUpdate(step_ratio, diff);
            } catch (e) {
                console.error(e);
            }
        }

        uq.length = 0;
    }
}

const spark = new Spark();

const uni_id_start = [170, 181, 186, 748, 750, 895, 902, 908, 1369, 1749, 1791, 1808, 1969, 2042, 2074, 2084, 2088, 2365, 2384, 2482, 2493, 2510, 2556, 2654, 2749, 2768, 2809, 2877, 2929, 2947, 2972, 3024, 3133, 3200, 3261, 3294, 3389, 3406, 3517, 3716, 3749, 3773, 3782, 3840, 4159, 4193, 4238, 4295, 4301, 4696, 4800, 6103, 6108, 6314, 6823, 7418, 8025, 8027, 8029, 8126, 8305, 8319, 8450, 8455, 8469, 8484, 8486, 8488, 8526, 11559, 11565, 11631, 11823, 13312, 19893, 19968, 40943, 43259, 43471, 43642, 43697, 43712, 43714, 44032, 55203, 64285, 64318, 67592, 67644, 68096, 69415, 69956, 70006, 70106, 70108, 70280, 70461, 70480, 70751, 70855, 71236, 71352, 71935, 72161, 72163, 72192, 72250, 72272, 72349, 72768, 73030, 73112, 94032, 94179, 94208, 100343, 119970, 119995, 120134, 123214, 125259, 126500, 126503, 126521, 126523, 126530, 126535, 126537, 126539, 126548, 126551, 126553, 126555, 126557, 126559, 126564, 126590, 131072, 173782, 173824, 177972, 177984, 178205, 178208, 183969, 183984, 191456];
const uni_id_start_r = [65, 90, 97, 122, 192, 214, 216, 246, 248, 705, 710, 721, 736, 740, 880, 884, 886, 887, 890, 893, 904, 906, 910, 929, 931, 1013, 1015, 1153, 1162, 1327, 1329, 1366, 1376, 1416, 1488, 1514, 1519, 1522, 1568, 1610, 1646, 1647, 1649, 1747, 1765, 1766, 1774, 1775, 1786, 1788, 1810, 1839, 1869, 1957, 1994, 2026, 2036, 2037, 2048, 2069, 2112, 2136, 2144, 2154, 2208, 2228, 2230, 2237, 2308, 2361, 2392, 2401, 2417, 2432, 2437, 2444, 2447, 2448, 2451, 2472, 2474, 2480, 2486, 2489, 2524, 2525, 2527, 2529, 2544, 2545, 2565, 2570, 2575, 2576, 2579, 2600, 2602, 2608, 2610, 2611, 2613, 2614, 2616, 2617, 2649, 2652, 2674, 2676, 2693, 2701, 2703, 2705, 2707, 2728, 2730, 2736, 2738, 2739, 2741, 2745, 2784, 2785, 2821, 2828, 2831, 2832, 2835, 2856, 2858, 2864, 2866, 2867, 2869, 2873, 2908, 2909, 2911, 2913, 2949, 2954, 2958, 2960, 2962, 2965, 2969, 2970, 2974, 2975, 2979, 2980, 2984, 2986, 2990, 3001, 3077, 3084, 3086, 3088, 3090, 3112, 3114, 3129, 3160, 3162, 3168, 3169, 3205, 3212, 3214, 3216, 3218, 3240, 3242, 3251, 3253, 3257, 3296, 3297, 3313, 3314, 3333, 3340, 3342, 3344, 3346, 3386, 3412, 3414, 3423, 3425, 3450, 3455, 3461, 3478, 3482, 3505, 3507, 3515, 3520, 3526, 3585, 3632, 3634, 3635, 3648, 3654, 3713, 3714, 3718, 3722, 3724, 3747, 3751, 3760, 3762, 3763, 3776, 3780, 3804, 3807, 3904, 3911, 3913, 3948, 3976, 3980, 4096, 4138, 4176, 4181, 4186, 4189, 4197, 4198, 4206, 4208, 4213, 4225, 4256, 4293, 4304, 4346, 4348, 4680, 4682, 4685, 4688, 4694, 4698, 4701, 4704, 4744, 4746, 4749, 4752, 4784, 4786, 4789, 4792, 4798, 4802, 4805, 4808, 4822, 4824, 4880, 4882, 4885, 4888, 4954, 4992, 5007, 5024, 5109, 5112, 5117, 5121, 5740, 5743, 5759, 5761, 5786, 5792, 5866, 5870, 5880, 5888, 5900, 5902, 5905, 5920, 5937, 5952, 5969, 5984, 5996, 5998, 6000, 6016, 6067, 6176, 6264, 6272, 6276, 6279, 6312, 6320, 6389, 6400, 6430, 6480, 6509, 6512, 6516, 6528, 6571, 6576, 6601, 6656, 6678, 6688, 6740, 6917, 6963, 6981, 6987, 7043, 7072, 7086, 7087, 7098, 7141, 7168, 7203, 7245, 7247, 7258, 7293, 7296, 7304, 7312, 7354, 7357, 7359, 7401, 7404, 7406, 7411, 7413, 7414, 7424, 7615, 7680, 7957, 7960, 7965, 7968, 8005, 8008, 8013, 8016, 8023, 8031, 8061, 8064, 8116, 8118, 8124, 8130, 8132, 8134, 8140, 8144, 8147, 8150, 8155, 8160, 8172, 8178, 8180, 8182, 8188, 8336, 8348, 8458, 8467, 8473, 8477, 8490, 8493, 8495, 8505, 8508, 8511, 8517, 8521, 8544, 8584, 11264, 11310, 11312, 11358, 11360, 11492, 11499, 11502, 11506, 11507, 11520, 11557, 11568, 11623, 11648, 11670, 11680, 11686, 11688, 11694, 11696, 11702, 11704, 11710, 11712, 11718, 11720, 11726, 11728, 11734, 11736, 11742, 12293, 12295, 12321, 12329, 12337, 12341, 12344, 12348, 12353, 12438, 12445, 12447, 12449, 12538, 12540, 12543, 12549, 12591, 12593, 12686, 12704, 12730, 12784, 12799, 40960, 42124, 42192, 42237, 42240, 42508, 42512, 42527, 42538, 42539, 42560, 42606, 42623, 42653, 42656, 42735, 42775, 42783, 42786, 42888, 42891, 42943, 42946, 42950, 42999, 43009, 43011, 43013, 43015, 43018, 43020, 43042, 43072, 43123, 43138, 43187, 43250, 43255, 43261, 43262, 43274, 43301, 43312, 43334, 43360, 43388, 43396, 43442, 43488, 43492, 43494, 43503, 43514, 43518, 43520, 43560, 43584, 43586, 43588, 43595, 43616, 43638, 43646, 43695, 43701, 43702, 43705, 43709, 43739, 43741, 43744, 43754, 43762, 43764, 43777, 43782, 43785, 43790, 43793, 43798, 43808, 43814, 43816, 43822, 43824, 43866, 43868, 43879, 43888, 44002, 55216, 55238, 55243, 55291, 63744, 64109, 64112, 64217, 64256, 64262, 64275, 64279, 64287, 64296, 64298, 64310, 64312, 64316, 64320, 64321, 64323, 64324, 64326, 64433, 64467, 64829, 64848, 64911, 64914, 64967, 65008, 65019, 65136, 65140, 65142, 65276, 65313, 65338, 65345, 65370, 65382, 65470, 65474, 65479, 65482, 65487, 65490, 65495, 65498, 65500, 65536, 65547, 65549, 65574, 65576, 65594, 65596, 65597, 65599, 65613, 65616, 65629, 65664, 65786, 65856, 65908, 66176, 66204, 66208, 66256, 66304, 66335, 66349, 66378, 66384, 66421, 66432, 66461, 66464, 66499, 66504, 66511, 66513, 66517, 66560, 66717, 66736, 66771, 66776, 66811, 66816, 66855, 66864, 66915, 67072, 67382, 67392, 67413, 67424, 67431, 67584, 67589, 67594, 67637, 67639, 67640, 67647, 67669, 67680, 67702, 67712, 67742, 67808, 67826, 67828, 67829, 67840, 67861, 67872, 67897, 67968, 68023, 68030, 68031, 68112, 68115, 68117, 68119, 68121, 68149, 68192, 68220, 68224, 68252, 68288, 68295, 68297, 68324, 68352, 68405, 68416, 68437, 68448, 68466, 68480, 68497, 68608, 68680, 68736, 68786, 68800, 68850, 68864, 68899, 69376, 69404, 69424, 69445, 69600, 69622, 69635, 69687, 69763, 69807, 69840, 69864, 69891, 69926, 69968, 70002, 70019, 70066, 70081, 70084, 70144, 70161, 70163, 70187, 70272, 70278, 70282, 70285, 70287, 70301, 70303, 70312, 70320, 70366, 70405, 70412, 70415, 70416, 70419, 70440, 70442, 70448, 70450, 70451, 70453, 70457, 70493, 70497, 70656, 70708, 70727, 70730, 70784, 70831, 70852, 70853, 71040, 71086, 71128, 71131, 71168, 71215, 71296, 71338, 71424, 71450, 71680, 71723, 71840, 71903, 72096, 72103, 72106, 72144, 72203, 72242, 72284, 72329, 72384, 72440, 72704, 72712, 72714, 72750, 72818, 72847, 72960, 72966, 72968, 72969, 72971, 73008, 73056, 73061, 73063, 73064, 73066, 73097, 73440, 73458, 73728, 74649, 74752, 74862, 74880, 75075, 77824, 78894, 82944, 83526, 92160, 92728, 92736, 92766, 92880, 92909, 92928, 92975, 92992, 92995, 93027, 93047, 93053, 93071, 93760, 93823, 93952, 94026, 94099, 94111, 94176, 94177, 100352, 101106, 110592, 110878, 110928, 110930, 110948, 110951, 110960, 111355, 113664, 113770, 113776, 113788, 113792, 113800, 113808, 113817, 119808, 119892, 119894, 119964, 119966, 119967, 119973, 119974, 119977, 119980, 119982, 119993, 119997, 120003, 120005, 120069, 120071, 120074, 120077, 120084, 120086, 120092, 120094, 120121, 120123, 120126, 120128, 120132, 120138, 120144, 120146, 120485, 120488, 120512, 120514, 120538, 120540, 120570, 120572, 120596, 120598, 120628, 120630, 120654, 120656, 120686, 120688, 120712, 120714, 120744, 120746, 120770, 120772, 120779, 123136, 123180, 123191, 123197, 123584, 123627, 124928, 125124, 125184, 125251, 126464, 126467, 126469, 126495, 126497, 126498, 126505, 126514, 126516, 126519, 126541, 126543, 126545, 126546, 126561, 126562, 126567, 126570, 126572, 126578, 126580, 126583, 126585, 126588, 126592, 126601, 126603, 126619, 126625, 126627, 126629, 126633, 126635, 126651];
const uni_id_cont = [95, 1471, 1479, 1648, 1809, 2045, 2492, 2519, 2558, 2620, 2641, 2677, 2748, 2876, 2946, 3031, 3260, 3415, 3530, 3542, 3633, 3761, 3893, 3895, 3897, 4038, 6109, 6313, 7405, 7412, 8276, 8417, 11647, 42607, 43010, 43014, 43019, 43493, 43587, 43696, 43713, 64286, 65343, 66045, 66272, 68159, 70003, 70206, 70487, 70750, 72164, 72263, 73018, 73031, 94031, 121461, 121476];
const uni_id_cont_r = [48, 57, 768, 879, 1155, 1159, 1425, 1469, 1473, 1474, 1476, 1477, 1552, 1562, 1611, 1641, 1750, 1756, 1759, 1764, 1767, 1768, 1770, 1773, 1776, 1785, 1840, 1866, 1958, 1968, 1984, 1993, 2027, 2035, 2070, 2073, 2075, 2083, 2085, 2087, 2089, 2093, 2137, 2139, 2259, 2273, 2275, 2307, 2362, 2364, 2366, 2383, 2385, 2391, 2402, 2403, 2406, 2415, 2433, 2435, 2494, 2500, 2503, 2504, 2507, 2509, 2530, 2531, 2534, 2543, 2561, 2563, 2622, 2626, 2631, 2632, 2635, 2637, 2662, 2673, 2689, 2691, 2750, 2757, 2759, 2761, 2763, 2765, 2786, 2787, 2790, 2799, 2810, 2815, 2817, 2819, 2878, 2884, 2887, 2888, 2891, 2893, 2902, 2903, 2914, 2915, 2918, 2927, 3006, 3010, 3014, 3016, 3018, 3021, 3046, 3055, 3072, 3076, 3134, 3140, 3142, 3144, 3146, 3149, 3157, 3158, 3170, 3171, 3174, 3183, 3201, 3203, 3262, 3268, 3270, 3272, 3274, 3277, 3285, 3286, 3298, 3299, 3302, 3311, 3328, 3331, 3387, 3388, 3390, 3396, 3398, 3400, 3402, 3405, 3426, 3427, 3430, 3439, 3458, 3459, 3535, 3540, 3544, 3551, 3558, 3567, 3570, 3571, 3636, 3642, 3655, 3662, 3664, 3673, 3764, 3772, 3784, 3789, 3792, 3801, 3864, 3865, 3872, 3881, 3902, 3903, 3953, 3972, 3974, 3975, 3981, 3991, 3993, 4028, 4139, 4158, 4160, 4169, 4182, 4185, 4190, 4192, 4194, 4196, 4199, 4205, 4209, 4212, 4226, 4237, 4239, 4253, 4957, 4959, 5906, 5908, 5938, 5940, 5970, 5971, 6002, 6003, 6068, 6099, 6112, 6121, 6155, 6157, 6160, 6169, 6277, 6278, 6432, 6443, 6448, 6459, 6470, 6479, 6608, 6617, 6679, 6683, 6741, 6750, 6752, 6780, 6783, 6793, 6800, 6809, 6832, 6845, 6912, 6916, 6964, 6980, 6992, 7001, 7019, 7027, 7040, 7042, 7073, 7085, 7088, 7097, 7142, 7155, 7204, 7223, 7232, 7241, 7248, 7257, 7376, 7378, 7380, 7400, 7415, 7417, 7616, 7673, 7675, 7679, 8255, 8256, 8400, 8412, 8421, 8432, 11503, 11505, 11744, 11775, 12330, 12335, 12441, 12442, 42528, 42537, 42612, 42621, 42654, 42655, 42736, 42737, 43043, 43047, 43136, 43137, 43188, 43205, 43216, 43225, 43232, 43249, 43263, 43273, 43302, 43309, 43335, 43347, 43392, 43395, 43443, 43456, 43472, 43481, 43504, 43513, 43561, 43574, 43596, 43597, 43600, 43609, 43643, 43645, 43698, 43700, 43703, 43704, 43710, 43711, 43755, 43759, 43765, 43766, 44003, 44010, 44012, 44013, 44016, 44025, 65024, 65039, 65056, 65071, 65075, 65076, 65101, 65103, 65296, 65305, 66422, 66426, 66720, 66729, 68097, 68099, 68101, 68102, 68108, 68111, 68152, 68154, 68325, 68326, 68900, 68903, 68912, 68921, 69446, 69456, 69632, 69634, 69688, 69702, 69734, 69743, 69759, 69762, 69808, 69818, 69872, 69881, 69888, 69890, 69927, 69940, 69942, 69951, 69957, 69958, 70016, 70018, 70067, 70080, 70089, 70092, 70096, 70105, 70188, 70199, 70367, 70378, 70384, 70393, 70400, 70403, 70459, 70460, 70462, 70468, 70471, 70472, 70475, 70477, 70498, 70499, 70502, 70508, 70512, 70516, 70709, 70726, 70736, 70745, 70832, 70851, 70864, 70873, 71087, 71093, 71096, 71104, 71132, 71133, 71216, 71232, 71248, 71257, 71339, 71351, 71360, 71369, 71453, 71467, 71472, 71481, 71724, 71738, 71904, 71913, 72145, 72151, 72154, 72160, 72193, 72202, 72243, 72249, 72251, 72254, 72273, 72283, 72330, 72345, 72751, 72758, 72760, 72767, 72784, 72793, 72850, 72871, 72873, 72886, 73009, 73014, 73020, 73021, 73023, 73029, 73040, 73049, 73098, 73102, 73104, 73105, 73107, 73111, 73120, 73129, 73459, 73462, 92768, 92777, 92912, 92916, 92976, 92982, 93008, 93017, 94033, 94087, 94095, 94098, 113821, 113822, 119141, 119145, 119149, 119154, 119163, 119170, 119173, 119179, 119210, 119213, 119362, 119364, 120782, 120831, 121344, 121398, 121403, 121452, 121499, 121503, 121505, 121519, 122880, 122886, 122888, 122904, 122907, 122913, 122915, 122916, 122918, 122922, 123184, 123190, 123200, 123209, 123628, 123641, 125136, 125142, 125252, 125258, 125264, 125273];
///*
const j = new Uint16Array(100000);
j.fill(0);
//Add value to individual indexes
function aii(table, value, ...indices) {
    for (const i of indices)
        table[i] |= value;
}
//Add value to index ranges
function air(t, v, ...i_r) {
    for (const r of i_r.reduce((r, v, i) => (((i % 2) ? (r[r.length - 1].push(v)) : r.push([v])), r), [])) {
        const size = r[1] + 1 - r[0], a = [];
        for (let i = 0; i < size; i++)
            a[i] = r[0] + i;
        aii(t, v, ...a);
    }
}
//7. Symbol
// Default Value
//1. Identifier
air(j, 1, ...uni_id_start_r);
aii(j, 1, ...uni_id_start);
//2. QUOTE STRING
aii(j, 2, 34, 39, 96);
//3. SPACE SET
aii(j, 3, 32, 0xA0, 0x2002, 0x2003, 0x2004, 0x3000);
//4. TAB SET
aii(j, 4, 9);
//5. CARIAGE RETURN 
aii(j, 5, 13);
//6. CARIAGE RETURN 
aii(j, 6, 10);
//7. Number
air(j, 7, 48, 57);
//8. Operator
aii(j, 8, 33, 37, 38, 42, 43, 58, 60, 61, 62);
//9. Open Bracket
aii(j, 9, 40, 91, 123);
//10. Close Bracket
aii(j, 10, 41, 93, 125);
//10. Close Bracket
aii(j, 11, 16);
/**
 * Lexer Number and Identifier jump table reference
 * Number are masked by 12(4|8) and Identifiers are masked by 10(2|8)
 * entries marked as `0` are not evaluated as either being in the number set or the identifier set.
 * entries marked as `2` are in the identifier set but not the number set
 * entries marked as `4` are in the number set but not the identifier set
 * entries marked as `8` are in both number and identifier sets
 * entries marked as `8` are in number, identifier, hex, bin, and oct sets;
 */
const id = 2, num = 4, hex = 16, oct = 32, bin = 64;
/**
 * LExer Number and Identifier jump table reference
 * Number are masked by [ 4 ] and Identifiers are masked by 6 [ 2 | 4 ]
 */
// entries marked as `2` are in the identifier set but not the number set
air(j, id << 8, 65, 90, 97, 122);
air(j, id << 8, ...uni_id_start_r);
aii(j, id << 8, ...uni_id_start);
air(j, id << 8, ...uni_id_cont_r);
aii(j, id << 8, ...uni_id_cont);
//For hex numbers [AF] and [af]
air(j, hex << 8, 65, 70, 97, 122);
//For bin numbers [01]
air(j, bin << 8, 48, 49);
//For oct numbers [07]
air(j, oct << 8, 48, 55);
//For the whole natural digit range
air(j, (num | hex) << 8, 48, 57);

/**
 * Error Object produced by wind.errorMessage
 */
class WindSyntaxError extends SyntaxError {
    constructor(message = "", lex) {
        super();
        this.name = "WindSyntaxError";
        this.lex = lex;
        this.file = "";
        this.line = lex.column;
        this.column = lex.line;
        this.post_peek_lines = 1;
        this.pre_peek_lines = 1;
        this.window = 50;
    }
    get message() {
        const lex = this.lex, tab_size = 4, window_size = 400, message = "test message";
        // Get the text from the proceeding and the following lines; 
        // If current line is at index 0 then there will be no proceeding line;
        // Likewise for the following line if current line is the last one in the string.
        const line_start = lex.off - lex.char, char = lex.char, l = lex.line, str = lex.str, len = str.length, sp = " ";
        let prev_start = 0, next_start = 0, next_end = 0, i = 0;
        //get the start of the proceeding line
        for (i = line_start; --i > 0 && j[str.codePointAt(i)] !== 6;)
            ;
        prev_start = i;
        //get the end of the current line...
        for (i = lex.off + lex.tl; i++ < len && j[str.codePointAt(i)] !== 6;)
            ;
        next_start = i;
        //and the next line
        for (; i++ < len && j[str.codePointAt(i)] !== 6;)
            ;
        next_end = i;
        let pointer_pos = char - (line_start > 0 ? 1 : 0);
        for (i = line_start; ++i < lex.off;)
            if (str.codePointAt(i) == HORIZONTAL_TAB)
                pointer_pos += tab_size - 1;
        //find the location of the offending symbol
        const prev_line = str.slice(prev_start + (prev_start > 0 ? 1 : 0), line_start).replace(/\t/g, sp.repeat(tab_size)), curr_line = str.slice(line_start + (line_start > 0 ? 1 : 0), next_start).replace(/\t/g, sp.repeat(tab_size)), next_line = str.slice(next_start + (next_start > 0 ? 1 : 0), next_end).replace(/\t/g, " "), 
        //get the max line length;
        max_length = Math.max(prev_line.length, curr_line.length, next_line.length), min_length = Math.min(prev_line.length, curr_line.length, next_line.length), length_diff = max_length - min_length, 
        //Get the window size;
        w_size = window_size, w_start = Math.max(0, Math.min(pointer_pos - w_size / 2, max_length)), w_end = Math.max(0, Math.min(pointer_pos + w_size / 2, max_length)), w_pointer_pos = Math.max(0, Math.min(pointer_pos, max_length)) - w_start, 
        //append the difference of line lengths to the end of the lines as space characters;
        prev_line_o = (prev_line + sp.repeat(length_diff)).slice(w_start, w_end), curr_line_o = (curr_line + sp.repeat(length_diff)).slice(w_start, w_end), next_line_o = (next_line + sp.repeat(length_diff)).slice(w_start, w_end), trunc = w_start !== 0 ? "... " : "", line_number = n => ` ${(sp.repeat(3) + (n + 1)).slice(-(l + 1 + "").length)}: `, error_border = thick_line.repeat(curr_line_o.length + line_number.length + 8 + trunc.length);
        return [
            `${message} at ${ ""}${l + 1}:${char + 1 - ((l > 0) ? 1 : 0)}`,
            `${error_border}`,
            `${l - 1 > -1 ? line_number(l - 1) + trunc + prev_line_o + (prev_line_o.length < prev_line.length ? " ..." : "") : ""}`,
            `${ line_number(l) + trunc + curr_line_o + (curr_line_o.length < curr_line.length ? " ..." : "") }`,
            `${line.repeat(w_pointer_pos + trunc.length + line_number(l + 1).length) + arrow}`,
            `${next_start < str.length ? line_number(l + 1) + trunc + next_line_o + (next_line_o.length < next_line.length ? " ..." : "") : ""}`,
            `${error_border}`
        ]
            .filter(e => !!e)
            .join("\n");
    }
}

var TokenType;
(function (TokenType) {
    TokenType[TokenType["number"] = 1] = "number";
    TokenType[TokenType["num"] = 1] = "num";
    TokenType[TokenType["identifier"] = 2] = "identifier";
    TokenType[TokenType["string"] = 4] = "string";
    TokenType[TokenType["white_space"] = 8] = "white_space";
    TokenType[TokenType["open_bracket"] = 16] = "open_bracket";
    TokenType[TokenType["close_bracket"] = 32] = "close_bracket";
    TokenType[TokenType["operator"] = 64] = "operator";
    TokenType[TokenType["symbol"] = 128] = "symbol";
    TokenType[TokenType["new_line"] = 256] = "new_line";
    TokenType[TokenType["data_link"] = 512] = "data_link";
    TokenType[TokenType["number_bin"] = 1025] = "number_bin";
    TokenType[TokenType["number_oct"] = 2049] = "number_oct";
    TokenType[TokenType["number_hex"] = 4097] = "number_hex";
    TokenType[TokenType["number_int"] = 8193] = "number_int";
    TokenType[TokenType["number_sci"] = 16385] = "number_sci";
    TokenType[TokenType["number_flt"] = 32769] = "number_flt";
    TokenType[TokenType["alpha_numeric"] = 3] = "alpha_numeric";
    TokenType[TokenType["white_space_new_line"] = 264] = "white_space_new_line";
    TokenType[TokenType["id"] = 2] = "id";
    TokenType[TokenType["str"] = 4] = "str";
    TokenType[TokenType["ws"] = 8] = "ws";
    TokenType[TokenType["ob"] = 16] = "ob";
    TokenType[TokenType["cb"] = 32] = "cb";
    TokenType[TokenType["op"] = 64] = "op";
    TokenType[TokenType["sym"] = 128] = "sym";
    TokenType[TokenType["nl"] = 256] = "nl";
    TokenType[TokenType["dl"] = 512] = "dl";
    TokenType[TokenType["int"] = 8193] = "int";
    TokenType[TokenType["integer"] = 8193] = "integer";
    TokenType[TokenType["bin"] = 1025] = "bin";
    TokenType[TokenType["binary"] = 1025] = "binary";
    TokenType[TokenType["oct"] = 2049] = "oct";
    TokenType[TokenType["octal"] = 2049] = "octal";
    TokenType[TokenType["hex"] = 4097] = "hex";
    TokenType[TokenType["hexadecimal"] = 4097] = "hexadecimal";
    TokenType[TokenType["flt"] = 32769] = "flt";
    TokenType[TokenType["float"] = 32769] = "float";
    TokenType[TokenType["sci"] = 16385] = "sci";
    TokenType[TokenType["scientific"] = 16385] = "scientific";
})(TokenType || (TokenType = {}));
var Masks;
(function (Masks) {
    Masks[Masks["TYPE_MASK"] = 15] = "TYPE_MASK";
    Masks[Masks["PARSE_STRING_MASK"] = 16] = "PARSE_STRING_MASK";
    Masks[Masks["USE_EXTENDED_NUMBER_TYPES_MASK"] = 4] = "USE_EXTENDED_NUMBER_TYPES_MASK";
    Masks[Masks["IGNORE_WHITESPACE_MASK"] = 32] = "IGNORE_WHITESPACE_MASK";
    Masks[Masks["CHARACTERS_ONLY_MASK"] = 64] = "CHARACTERS_ONLY_MASK";
    Masks[Masks["USE_EXTENDED_ID_MASK"] = 128] = "USE_EXTENDED_ID_MASK";
    Masks[Masks["TOKEN_LENGTH_MASK"] = 4294967040] = "TOKEN_LENGTH_MASK";
})(Masks || (Masks = {}));
//De Bruijn Sequence for finding index of right most bit set.
//http://supertech.csail.mit.edu/papers/debruijn.pdf
const arrow = String.fromCharCode(0x2b89), line = String.fromCharCode(0x2500), thick_line = String.fromCharCode(0x2501), HORIZONTAL_TAB = 9, SPACE = 32, extended_jump_table = j.slice();
extended_jump_table[45] |= 2 << 8;
extended_jump_table[95] |= 2 << 8;
/**
 * Token Producing Lexer.
 */
class Lexer {
    /**
     *
     * @param string
     * @param INCLUDE_WHITE_SPACE_TOKENS
     * @param PEEKING
     */
    constructor(string = "", INCLUDE_WHITE_SPACE_TOKENS = false, PEEKING = false) {
        if (typeof (string) !== "string")
            throw new Error(`String value must be passed to Lexer. A ${typeof (string)} was passed as the 'string' argument.`);
        Object.defineProperties(this, {
            symbol_map: {
                writable: true,
                value: null
            },
            // Reference to the peeking Lexer.
            p: {
                writable: true,
                value: null
            },
            /**
             * Stores values accessed through binary operations
             */
            masked_values: {
                writable: true,
                value: 0
            },
            //  The length of the string being parsed. Can be adjusted to virtually shorten the screen. 
            sl: {
                writable: true,
                enumerable: true,
                value: string.length
            },
            //  The string that the Lexer will tokenize.
            str: {
                writable: false,
                value: string
            }
        });
        this.type = 262144; //Default "non-value" for types is 1<<18;
        this.off = 0;
        this.column = 0;
        this.line = 0;
        this.tl = 0;
        /**
         * Flag to ignore white spaced.
         */
        this.IWS = !INCLUDE_WHITE_SPACE_TOKENS;
        this.USE_EXTENDED_ID = false;
        /**
         * Flag to force the lexer to parse string contents
         * instead of producing a token that is a substring matched
         * by /["''].*["'']/
         */
        this.PARSE_STRING = false;
        if (!PEEKING)
            this.next();
    }
    /**
     * Restore the Lexer back to it's initial state.
     * @public
     */
    reset() {
        this.resetHead();
        this.next();
        return this;
    }
    resetHead() {
        this.off = 0;
        this.tl = 0;
        this.column = 0;
        this.line = 0;
        this.p = null;
        this.type = 32768;
    }
    ;
    /**
     * Copies the data to a new Lexer object.
     * @return {Lexer}  Returns a new Lexer instance with the same property values.
     */
    copy(destination = new Lexer(this.str, false, true)) {
        destination.off = this.off;
        destination.column = this.column;
        destination.line = this.line;
        destination.sl = this.sl;
        destination.tl = this.tl;
        destination.type = this.type;
        destination.symbol_map = this.symbol_map;
        destination.masked_values = this.masked_values;
        return destination;
    }
    /**
     * Given another Lexer with the same `str` property value, it will copy the state of that Lexer.
     * @param      {Lexer}  [marker=this.peek]  The Lexer to clone the state from.
     * @throws     {Error} Throws an error if the Lexers reference different strings.
     * @public
     */
    sync(marker = this.p) {
        if (marker instanceof Lexer) {
            if (marker.str !== this.str)
                throw new Error("Cannot sync Lexers with different strings!");
            this.off = marker.off;
            this.column = marker.column;
            this.line = marker.line;
            this.tl = marker.tl;
            this.type = marker.type;
            this.masked_values = marker.masked_values;
        }
        return this;
    }
    /**
     * Sets the internal state to point to the next token. Sets Lexer.prototype.END to `true` if the end of the string is hit.
     * @public
     * @param {Lexer} [marker=this] - If another Lexer is passed into this method, it will advance the token state of that Lexer.
     */
    next(marker = this, USE_CUSTOM_SYMBOLS = !!this.symbol_map) {
        if (marker.sl < 1) {
            marker.off = 0;
            marker.type = 32768;
            marker.tl = 0;
            marker.line = 0;
            marker.column = 0;
            return marker;
        }
        //Token builder
        const l = marker.sl, str = marker.str, jump_table = this.id_lu, IWS = marker.IWS;
        let length = marker.tl, off = marker.off + length, type = TokenType.symbol, line = marker.line, base = off, char = marker.column, root = marker.off;
        if (off >= l) {
            length = 0;
            base = l;
            //char -= base - off;
            marker.column = char + (base - marker.off);
            marker.type = type;
            marker.off = base;
            marker.tl = 0;
            marker.line = line;
            return marker;
        }
        let NORMAL_PARSE = true;
        if (USE_CUSTOM_SYMBOLS) {
            let code = str.charCodeAt(off);
            let off2 = off;
            let map = this.symbol_map, m;
            while (code == 32 && IWS)
                (code = str.charCodeAt(++off2), off++);
            while ((m = map.get(code))) {
                map = m;
                off2 += 1;
                code = str.charCodeAt(off2);
            }
            if (map.IS_SYM) {
                NORMAL_PARSE = false;
                base = off;
                length = off2 - off;
            }
        }
        while (NORMAL_PARSE) {
            base = off;
            length = 1;
            const code = str.codePointAt(off);
            switch (jump_table[code] & 255) {
                case 0: //SYMBOL
                    type = TokenType.symbol;
                    break;
                case 1: //IDENTIFIER
                    while (++off < l && (((id | num) & (jump_table[str.codePointAt(off)] >> 8))))
                        ;
                    type = TokenType.identifier;
                    length = off - base;
                    break;
                case 2: //QUOTED STRING
                    if (this.PARSE_STRING) {
                        type = TokenType.symbol;
                    }
                    else {
                        while (++off < l && str.codePointAt(off) !== code)
                            ;
                        type = TokenType.string;
                        length = off - base + 1;
                    }
                    break;
                case 3: //SPACE SET
                    while (++off < l && str.codePointAt(off) === SPACE)
                        ;
                    type = TokenType.white_space;
                    length = off - base;
                    break;
                case 4: //TAB SET
                    while (++off < l && str[off] === "\t")
                        ;
                    type = TokenType.white_space;
                    length = off - base;
                    break;
                case 5: //CARRIAGE RETURN
                    length = 2;
                //intentional
                case 6: //LINEFEED
                    type = TokenType.new_line;
                    line++;
                    base = off;
                    root = off;
                    off += length;
                    char = 0;
                    break;
                case 7: //NUMBER
                    type = TokenType.number;
                    //Check for binary, hexadecimal, and octal representation
                    if (code == 48) { // 0 - ZERO
                        off++;
                        if (("oxbOXB").includes(str[off])) {
                            const lups = {
                                b: { lu: bin, ty: TokenType.number_bin },
                                o: { lu: oct, ty: TokenType.number_oct },
                                x: { lu: hex, ty: TokenType.number_hex }
                            };
                            const { lu, ty } = lups[str[off].toLowerCase()];
                            //Code of first char after the letter should
                            // be within the range of the respective lu type : hex, oct, or bin
                            if ((lu & (jump_table[str.codePointAt(off + 1)] >> 8))) {
                                while (++off < l && (lu & (jump_table[str.codePointAt(off)] >> 8)))
                                    ;
                                type = ty;
                                if (!this.USE_EXTENDED_NUMBER_TYPES)
                                    type = TokenType.number;
                                //harness.inspect(this.USE_EXTENDED_NUMBER_TYPES))
                                length = off - base;
                                break;
                            }
                        }
                        //The number is just 0. Do not allow 0221, 00007, etc. 
                        //But need to allow 0.1, 0.12 etc
                        //and also detect .12354
                    }
                    else {
                        while (++off < l && (num & (jump_table[str.codePointAt(off)] >> 8)))
                            ;
                    }
                    //type = number_int;
                    if (str[off] == ".") {
                        while (++off < l && (num & (jump_table[str.codePointAt(off)] >> 8)))
                            ;
                        //float
                        type = TokenType.number_flt;
                    }
                    if (("Ee").includes(str[off])) {
                        const ori_off = off;
                        //Add e to the number string
                        off++;
                        if (("-+").includes(str[off]))
                            off++;
                        if (!(num & (jump_table[str.codePointAt(off)] >> 8))) {
                            off = ori_off;
                        }
                        else {
                            while (++off < l && (num & (jump_table[str.codePointAt(off)] >> 8)))
                                ;
                            type = TokenType.number_sci;
                        }
                        //scientific 
                    }
                    if (!this.USE_EXTENDED_NUMBER_TYPES)
                        type = TokenType.number;
                    length = off - base;
                    break;
                case 8: //OPERATOR
                    type = TokenType.operator;
                    break;
                case 9: //OPEN BRACKET
                    type = TokenType.open_bracket;
                    break;
                case 10: //CLOSE BRACKET
                    type = TokenType.close_bracket;
                    break;
                case 11: //Data Link Escape
                    type = TokenType.data_link;
                    length = 4; //Stores two UTF16 values and a data link sentinel
                    break;
            }
            if (IWS && (type & TokenType.white_space_new_line)) {
                if (off < l) {
                    type = TokenType.symbol;
                    //off += length;
                    continue;
                }
                else {
                    //Trim white space from end of string
                    base = l - off;
                    marker.sl -= off;
                    length = 0;
                }
            }
            break;
        }
        marker.type = type;
        marker.off = base;
        marker.tl = (this.masked_values & Masks.CHARACTERS_ONLY_MASK) ? Math.min(1, length) : length;
        marker.column = char + base - root;
        marker.line = line;
        return marker;
    }
    /**
     * Restricts max parse distance to the other Lexer's current position.
     * @param      {Lexer}  Lexer   The Lexer to limit parse distance by.
     */
    fence(marker = this) {
        if (marker.str !== this.str)
            return;
        this.sl = marker.off;
        return this;
    }
    /**
        Looks for the string within the text and returns a new lexer at the location of the first occurrence of the token or
    */
    find(string) {
        const cp = this.pk, match = new Lexer(string);
        match.resetHead();
        cp.tl = 0;
        const char_cache = cp.CHARACTERS_ONLY;
        match.CHARACTERS_ONLY = true;
        cp.CHARACTERS_ONLY = true;
        while (!cp.END) {
            const mpk = match.pk, cpk = cp.pk;
            while (!mpk.END && !cpk.END && cpk.tx == mpk.tx) {
                cpk.next();
                mpk.next();
            }
            if (mpk.END) {
                cp.CHARACTERS_ONLY = char_cache;
                return cp.next();
            }
            cp.next();
        }
        return cp;
    }
    createWindSyntaxError(message) {
        return new WindSyntaxError(message, this);
    }
    /**
     * Creates an error message with a diagram illustrating the location of the error.
     */
    errorMessage(message = "", file = "", window_size = 120, tab_size = 2) {
        window_size = 20;
        // Get the text from the proceeding and the following lines; 
        // If current line is at index 0 then there will be no proceeeding line;
        // Likewise for the following line if current line is the last one in the string.
        const line_start = this.off - this.column, char = this.column, l = this.line, str = this.str, len = str.length, sp = " ";
        let prev_start = 0, next_start = 0, next_end = 0, i = 0;
        //get the start of the proceeding line
        for (i = line_start; --i > 0 && j[str.codePointAt(i)] !== 6;)
            ;
        prev_start = i;
        //get the end of the current line...
        for (i = this.off + this.tl; i++ < len && j[str.codePointAt(i)] !== 6;)
            ;
        next_start = i;
        //and the next line
        for (; i++ < len && j[str.codePointAt(i)] !== 6;)
            ;
        next_end = i;
        let pointer_pos = char - (line_start > 0 ? 1 : 0);
        for (i = line_start; ++i < this.off;)
            if (str.codePointAt(i) == HORIZONTAL_TAB)
                pointer_pos += tab_size - 1;
        //find the location of the offending symbol
        const prev_line = str.slice(prev_start + (prev_start > 0 ? 1 : 0), line_start).replace(/\t/g, sp.repeat(tab_size)), curr_line = str.slice(line_start + (line_start > 0 ? 1 : 0), next_start).replace(/\t/g, sp.repeat(tab_size)), next_line = str.slice(next_start + (next_start > 0 ? 1 : 0), next_end).replace(/\t/g, " "), 
        //get the max line length;
        max_length = Math.max(prev_line.length, curr_line.length, next_line.length), min_length = Math.min(prev_line.length, curr_line.length, next_line.length), length_diff = max_length - min_length, 
        //Get the window size;
        w_size = window_size, w_start = Math.max(0, Math.min(pointer_pos - w_size / 0.75, max_length)), w_end = Math.max(0, Math.min(pointer_pos + w_size / 0.25, max_length)), w_pointer_pos = Math.max(0, Math.min(pointer_pos, max_length)) - w_start, 
        //append the difference of line lengths to the end of the lines as space characters;
        prev_line_o = (prev_line + sp.repeat(length_diff)).slice(w_start, w_end), curr_line_o = (curr_line + sp.repeat(length_diff)).slice(w_start, w_end), next_line_o = (next_line + sp.repeat(length_diff)).slice(w_start, w_end), trunc = w_start !== 0 ? "... " : "", line_number = n => ` ${(sp.repeat(3) + (n + 1)).slice(-(l + 1 + "").length)}: `, error_border = thick_line.repeat(curr_line_o.length + line_number.length + 8 + trunc.length);
        return [
            `${message} at ${file ? file + ":" : ""}${l + 1}:${char + 1 - ((l > 0) ? 1 : 0)}`,
            `${error_border}`,
            `${l - 1 > -1 ? line_number(l - 1) + trunc + prev_line_o + (prev_line_o.length < prev_line.length ? " ..." : "") : ""}`,
            `${ line_number(l) + trunc + curr_line_o + (curr_line_o.length < curr_line.length ? " ..." : "") }`,
            `${line.repeat(w_pointer_pos + trunc.length + line_number(l + 1).length) + arrow}`,
            `${next_start < str.length ? line_number(l + 1) + trunc + next_line_o + (next_line_o.length < next_line.length ? " ..." : "") : ""}`,
            `${error_border}`
        ]
            .filter(e => !!e)
            .join("\n");
    }
    errorMessageWithIWS(...v) {
        return this.errorMessage(...v) + "\n" + (!this.IWS) ? "\n The Lexer produced whitespace tokens" : "";
    }
    /**
     * Will throw a new Error, appending the parsed string line and position information to the the error message passed into the function.
     * @instance
     * @public
     * @param {String} message - The error message.
     */
    throw(message) {
        throw new Error(this.errorMessage(message));
    }
    ;
    /**
     * Proxy for Lexer.prototype.reset
     * @public
     */
    r() { return this.reset(); }
    /**
     * Proxy for Lexer.prototype.assert
     * @public
     */
    a(text) {
        return this.assert(text);
    }
    /**
     * Compares the string value of the current token to the value passed in. Advances to next token if the two are equal.
     * @public
     * @throws {Error} - `Expecting "${text}" got "${this.text}"`
     * @param {String} text - The string to compare.
     */
    assert(text) {
        if (this.off < 0 || this.END)
            this.throw(`Expecting [${text}] but encountered end of string.`);
        if (this.text == text)
            this.next();
        else
            this.throw(`Expecting [${text}] but encountered [${this.text}]`);
        return this;
    }
    /**
     * Proxy for Lexer.prototype.assertCharacter
     * @public
     */
    aC(char) { return this.assertCharacter(char); }
    /**
     * Compares the character value of the current token to the value passed in. Advances to next token if the two are equal.
     * @public
     * @throws {Error} - `Expecting "${text}" got "${this.text}"`
     * @param {String} text - The string to compare.
     */
    assertCharacter(char) {
        if (this.off < 0 || this.END)
            this.throw(`Expecting [${char[0]}] but encountered end of string.`);
        if (this.ch == char[0])
            this.next();
        else
            this.throw(`Expecting [${char[0]}] but encountered [${this.ch}]`);
        return this;
    }
    /**
     * Returns the Lexer bound to Lexer.prototype.p, or creates and binds a new Lexer to Lexer.prototype.p. Advences the other Lexer to the token ahead of the calling Lexer.
     * @public
     * @type {Lexer}
     * @param {Lexer} [marker=this] - The marker to originate the peek from.
     * @param {Lexer} [peeking_marker=this.p] - The Lexer to set to the next token state.
     * @return {Lexer} - The Lexer that contains the peeked at token.
     */
    peek(marker = this, peeking_marker = this.p) {
        if (!peeking_marker) {
            if (!marker)
                return null;
            if (!this.p) {
                this.p = new Lexer(this.str, false, true);
                peeking_marker = this.p;
            }
        }
        peeking_marker.masked_values = marker.masked_values;
        peeking_marker.type = marker.type;
        peeking_marker.off = marker.off;
        peeking_marker.tl = marker.tl;
        peeking_marker.column = marker.column;
        peeking_marker.line = marker.line;
        this.next(peeking_marker);
        return peeking_marker;
    }
    /**
     * Proxy for Lexer.prototype.slice
     * @public
     */
    s(start) { return this.slice(start); }
    /**
     * Returns a slice of the parsed string beginning at `start` and ending at the current token.
     * @param {Number | LexerBeta} start - The offset in this.str to begin the slice. If this value is a LexerBeta, sets the start point to the value of start.off.
     * @return {String} A substring of the parsed string.
     * @public
     */
    slice(start = this.off) {
        if (start instanceof Lexer)
            start = start.off;
        return this.str.slice(start, (this.off <= start) ? this.sl : this.off);
    }
    /**
     * Skips to the end of a comment section.
     * @param {boolean} ASSERT - If set to true, will through an error if there is not a comment line or block to skip.
     * @param {Lexer} [marker=this] - If another Lexer is passed into this method, it will advance the token state of that Lexer.
     */
    comment(ASSERT = false, marker = this) {
        if (!(marker instanceof Lexer))
            return marker;
        if (marker.ch == "/") {
            if (marker.pk.ch == "*") {
                marker.sync();
                //@ts-ignore
                while (!marker.END && (marker.next().ch !== "*" || marker.pk.ch !== "/")) { /** NO OP */ }
                marker.sync().assert("/");
            }
            else if (marker.pk.ch == "/") {
                const IWS = marker.IWS;
                while (marker.next().ty != TokenType.new_line && !marker.END) { /** NO OP */ }
                marker.IWS = IWS;
                marker.next();
            }
            else if (ASSERT)
                marker.throw("Expecting the start of a comment");
        }
        return marker;
    }
    /**
     * Replaces the string the Lexer is tokenizing.
     * @param string - New string to replace the existing one with.
     * @param RESET - Flag that if set true will reset the Lexers position to the start of the string
     */
    setString(string, RESET = true) {
        this.str = string;
        this.sl = string.length;
        if (RESET)
            this.resetHead();
    }
    ;
    toString() {
        return this.slice();
    }
    /**
     * Returns new Whind Lexer that has leading and trailing whitespace characters removed from input.
     * @param leave_leading_amount - Maximum amount of leading space caracters to leave behind. Default is zero
     * @param leave_trailing_amount - Maximum amount of trailing space caracters to leave behind. Default is zero
     */
    trim(leave_leading_amount = 0, leave_trailing_amount = leave_leading_amount) {
        const lex = this.copy();
        let space_count = 0, off = lex.off;
        for (; lex.off < lex.sl; lex.off++) {
            const c = j[lex.string.charCodeAt(lex.off)];
            if (c > 2 && c < 7) {
                if (space_count >= leave_leading_amount) {
                    off++;
                }
                else {
                    space_count++;
                }
                continue;
            }
            break;
        }
        lex.off = off;
        space_count = 0;
        off = lex.sl;
        for (; lex.sl > lex.off; lex.sl--) {
            const c = j[lex.string.charCodeAt(lex.sl - 1)];
            if (c > 2 && c < 7) {
                if (space_count >= leave_trailing_amount) {
                    off--;
                }
                else {
                    space_count++;
                }
                continue;
            }
            break;
        }
        lex.sl = off;
        if (leave_leading_amount > 0)
            lex.IWS = false;
        lex.tl = 0;
        lex.next();
        return lex;
    }
    /**
     * Alias for lexer.column
     */
    get char() {
        return this.column;
    }
    /**
     * Adds symbol to symbol_map. This allows custom symbols to be defined and tokenized by parser.
    */
    addSymbol(sym) {
        if (!this.symbol_map)
            this.symbol_map = new Map;
        let map = this.symbol_map;
        for (let i = 0; i < sym.length; i++) {
            let code = sym.charCodeAt(i);
            let m = map.get(code);
            if (!m) {
                m = map.set(code, new Map).get(code);
            }
            map = m;
        }
        map.IS_SYM = true;
    }
    /** Getters and Setters ***/
    get string() {
        return this.str;
    }
    get string_length() {
        return this.sl - this.off;
    }
    set string_length(s) { }
    /**
     * The current token in the form of a new Lexer with the current state.
     * Proxy property for Lexer.prototype.copy
     * @type {Lexer}
     * @public
     * @readonly
     */
    get token() {
        return this.copy();
    }
    get ch() {
        return this.str[this.off];
    }
    /**
     * Proxy for Lexer.prototype.text
     * @public
     * @type {String}
     * @readonly
     */
    get tx() { return this.text; }
    /**
     * The string value of the current token.
     * @type {string}
     * @public
     * @readonly
     */
    get text() {
        return (this.off < 0) ? "" : this.str.slice(this.off, this.off + this.tl);
    }
    /**
     * The type id of the current token.
     * @type {TokenType}
     * @public
     * @readonly
     */
    get ty() { return this.type; }
    ;
    /**
     * The current token's offset position from the start of the string.
     * @type {Number}
     * @public
     * @readonly
     */
    get pos() {
        return this.off;
    }
    /**
     * Proxy for Lexer.prototype.peek
     * @public
     * @readonly
     * @type {Lexer}
     */
    get pk() { return this.peek(); }
    /**
     * Proxy for Lexer.prototype.next
     * @public
     */
    get n() { return this.next(); }
    /**
     * Boolean value set to true if position of Lexer is at the end of the string.
     */
    get END() { return this.off >= this.sl; }
    set END(v) { }
    get IGNORE_WHITE_SPACE() {
        return this.IWS;
    }
    set IGNORE_WHITE_SPACE(bool) {
        this.IWS = !!bool;
    }
    get CHARACTERS_ONLY() {
        return !!(this.masked_values & Masks.CHARACTERS_ONLY_MASK);
    }
    set CHARACTERS_ONLY(boolean) {
        this.masked_values = (this.masked_values & ~Masks.CHARACTERS_ONLY_MASK) | ((+boolean | 0) << 6);
    }
    get IWS() {
        return !!(this.masked_values & Masks.IGNORE_WHITESPACE_MASK);
    }
    set IWS(boolean) {
        this.masked_values = (this.masked_values & ~Masks.IGNORE_WHITESPACE_MASK) | ((+boolean | 0) << 5);
    }
    get PARSE_STRING() {
        return !!(this.masked_values & Masks.PARSE_STRING_MASK);
    }
    set PARSE_STRING(boolean) {
        this.masked_values = (this.masked_values & ~Masks.PARSE_STRING_MASK) | ((+boolean | 0) << 4);
    }
    get USE_EXTENDED_ID() {
        return !!(this.masked_values & Masks.USE_EXTENDED_ID_MASK);
    }
    set USE_EXTENDED_ID(boolean) {
        this.masked_values = (this.masked_values & ~Masks.USE_EXTENDED_ID_MASK) | ((+boolean | 0) << 8);
    }
    get USE_EXTENDED_NUMBER_TYPES() {
        return !!(this.masked_values & Masks.USE_EXTENDED_NUMBER_TYPES_MASK);
    }
    set USE_EXTENDED_NUMBER_TYPES(boolean) {
        this.masked_values = (this.masked_values & ~Masks.USE_EXTENDED_NUMBER_TYPES_MASK) | ((+boolean | 0) << 2);
    }
    /**
     * Reference to token id types.
     */
    get types() {
        return TokenType;
    }
}
Lexer.prototype.id_lu = j;
Lexer.prototype.addCharacter = Lexer.prototype.addSymbol;
function whind(string, INCLUDE_WHITE_SPACE_TOKENS = false) { return new Lexer(string, INCLUDE_WHITE_SPACE_TOKENS); }
whind.constructor = Lexer;
Lexer.types = TokenType;
whind.types = TokenType;

class Color extends Float64Array {

    constructor(r, g, b, a = 0) {
        super(4);

        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.a = 1;

        if (typeof(r) === "number") {
            this.r = r; //Math.max(Math.min(Math.round(r),255),-255);
            this.g = g; //Math.max(Math.min(Math.round(g),255),-255);
            this.b = b; //Math.max(Math.min(Math.round(b),255),-255);
            this.a = a; //Math.max(Math.min(a,1),-1);
        }
    }

    get r() {
        return this[0];
    }

    set r(r) {
        this[0] = r;
    }

    get g() {
        return this[1];
    }

    set g(g) {
        this[1] = g;
    }

    get b() {
        return this[2];
    }

    set b(b) {
        this[2] = b;
    }

    get a() {
        return this[3];
    }

    set a(a) {
        this[3] = a;
    }

    set(color) {
        this.r = color.r;
        this.g = color.g;
        this.b = color.b;
        this.a = (color.a != undefined) ? color.a : this.a;
    }

    add(color) {
        return new Color(
            color.r + this.r,
            color.g + this.g,
            color.b + this.b,
            color.a + this.a
        );
    }

    mult(color) {
        if (typeof(color) == "number") {
            return new Color(
                this.r * color,
                this.g * color,
                this.b * color,
                this.a * color
            );
        } else {
            return new Color(
                this.r * color.r,
                this.g * color.g,
                this.b * color.b,
                this.a * color.a
            );
        }
    }

    sub(color) {
        return new Color(
            this.r - color.r,
            this.g - color.g,
            this.b - color.b,
            this.a - color.a
        );
    }

    lerp(to, t){
        return this.add(to.sub(this).mult(t));
    }

    toString() {
        return `rgba(${this.r|0},${this.g|0},${this.b|0},${this.a})`;
    }

    toJSON() {
        return `rgba(${this.r|0},${this.g|0},${this.b|0},${this.a})`;
    }

    copy(other){
        let out = new Color(other);
        return out;
    }
}

/*
    BODY {color: black; background: white }
    H1 { color: maroon }
    H2 { color: olive }
    EM { color: #f00 }              // #rgb //
    EM { color: #ff0000 }           // #rrggbb //
    EM { color: rgb(255,0,0) }      // integer range 0 - 255 //
    EM { color: rgb(100%, 0%, 0%) } // float range 0.0% - 100.0% //
*/
class CSS_Color extends Color {
    static parse(l) {
        let c = CSS_Color._fs_(l);
        if (c) {
            let color = new CSS_Color();
            color.set(c);
            return color;
        }
        return null;
    }
    static _verify_(l) {
        let c = CSS_Color._fs_(l, true);
        if (c)
            return true;
        return false;
    }
    /**
        Creates a new Color from a string or a Lexer.
    */
    static _fs_(l, v = false) {
        let c;
        if (typeof (l) == "string")
            l = whind(l);
        let out = { r: 0, g: 0, b: 0, a: 1 };
        switch (l.ch) {
            case "#":
                l.next();
                let pk = l.copy();
                let type = l.types;
                pk.IWS = false;
                while (!(pk.ty & (type.newline | type.ws)) && !pk.END && pk.ch !== ";") {
                    pk.next();
                }
                var value = pk.slice(l);
                l.sync(pk);
                l.tl = 0;
                l.next();
                let num = parseInt(value, 16);
                if (value.length == 3 || value.length == 4) {
                    if (value.length == 4) {
                        const a = (num >> 8) & 0xF;
                        out.a = a | a << 4;
                        num >>= 4;
                    }
                    const r = (num >> 8) & 0xF;
                    out.r = r | r << 4;
                    const g = (num >> 4) & 0xF;
                    out.g = g | g << 4;
                    const b = (num) & 0xF;
                    out.b = b | b << 4;
                }
                else {
                    if (value.length == 8) {
                        out.a = num & 0xFF;
                        num >>= 8;
                    }
                    out.r = (num >> 16) & 0xFF;
                    out.g = (num >> 8) & 0xFF;
                    out.b = (num) & 0xFF;
                }
                l.next();
                break;
            case "r":
                let tx = l.tx;
                const RGB_TYPE = tx === "rgba" ? 1 : tx === "rgb" ? 2 : 0;
                if (RGB_TYPE > 0) {
                    l.next(); // (
                    out.r = parseInt(l.next().tx);
                    l.next(); // , or  %
                    if (l.ch == "%") {
                        l.next();
                        out.r = out.r * 255 / 100;
                    }
                    out.g = parseInt(l.next().tx);
                    l.next(); // , or  %
                    if (l.ch == "%") {
                        l.next();
                        out.g = out.g * 255 / 100;
                    }
                    out.b = parseInt(l.next().tx);
                    l.next(); // , or ) or %
                    if (l.ch == "%")
                        l.next(), out.b = out.b * 255 / 100;
                    if (RGB_TYPE < 2) {
                        out.a = parseFloat(l.next().tx);
                        l.next();
                        if (l.ch == "%")
                            l.next(), out.a = out.a * 255 / 100;
                    }
                    l.a(")");
                    c = new CSS_Color();
                    c.set(out);
                    return c;
                } // intentional
            default:
                let string = l.tx;
                if (l.ty == l.types.str) {
                    string = string.slice(1, -1);
                }
                out = CSS_Color.colors[string.toLowerCase()];
                if (out)
                    l.next();
        }
        return out;
    }
    constructor(r, g, b, a) {
        super(r, g, b, a);
        if (typeof (r) == "string")
            this.set(CSS_Color._fs_(r) || { r: 255, g: 255, b: 255, a: 0 });
    }
    toString() {
        if (this.a !== 1)
            return this.toRGBString();
        return `#${("0" + this.r.toString(16)).slice(-2)}${("0" + this.g.toString(16)).slice(-2)}${("0" + this.b.toString(16)).slice(-2)}`;
    }
    toRGBString() {
        return `rgba(${this.r.toString()},${this.g.toString()},${this.b.toString()},${this.a.toString()})`;
    }
}
{
    let _$ = (r = 0, g = 0, b = 0, a = 1) => ({ r, g, b, a });
    let c = _$(0, 255, 25);
    CSS_Color.colors = {
        "alice blue": _$(240, 248, 255),
        "antique white": _$(250, 235, 215),
        "aqua marine": _$(127, 255, 212),
        "aqua": c,
        "azure": _$(240, 255, 255),
        "beige": _$(245, 245, 220),
        "bisque": _$(255, 228, 196),
        "black": _$(),
        "blanched almond": _$(255, 235, 205),
        "blue violet": _$(138, 43, 226),
        "blue": _$(0, 0, 255),
        "brown": _$(165, 42, 42),
        "burly wood": _$(222, 184, 135),
        "cadet blue": _$(95, 158, 160),
        "chart reuse": _$(127, 255),
        "chocolate": _$(210, 105, 30),
        "clear": _$(255, 255, 255),
        "coral": _$(255, 127, 80),
        "corn flower blue": _$(100, 149, 237),
        "corn silk": _$(255, 248, 220),
        "crimson": _$(220, 20, 60),
        "cyan": c,
        "dark blue": _$(0, 0, 139),
        "dark cyan": _$(0, 139, 139),
        "dark golden rod": _$(184, 134, 11),
        "dark gray": _$(169, 169, 169),
        "dark green": _$(0, 100),
        "dark khaki": _$(189, 183, 107),
        "dark magenta": _$(139, 0, 139),
        "dark olive green": _$(85, 107, 47),
        "dark orange": _$(255, 140),
        "dark orchid": _$(153, 50, 204),
        "dark red": _$(139),
        "dark salmon": _$(233, 150, 122),
        "dark sea green": _$(143, 188, 143),
        "dark slate blue": _$(72, 61, 139),
        "dark slate gray": _$(47, 79, 79),
        "dark turquoise": _$(0, 206, 209),
        "dark violet": _$(148, 0, 211),
        "deep pink": _$(255, 20, 147),
        "deep sky blue": _$(0, 191, 255),
        "dim gray": _$(105, 105, 105),
        "dodger blue": _$(30, 144, 255),
        "firebrick": _$(178, 34, 34),
        "floral white": _$(255, 250, 240),
        "forest green": _$(34, 139, 34),
        "fuchsia": _$(255, 0, 255),
        "gainsboro": _$(220, 220, 220),
        "ghost white": _$(248, 248, 255),
        "gold": _$(255, 215),
        "golden rod": _$(218, 165, 32),
        "gray": _$(128, 128, 128),
        "green yellow": _$(173, 255, 47),
        "green": _$(0, 128),
        "honeydew": _$(240, 255, 240),
        "hot pink": _$(255, 105, 180),
        "indian red": _$(205, 92, 92),
        "indigo": _$(75, 0, 130),
        "ivory": _$(255, 255, 240),
        "khaki": _$(240, 230, 140),
        "lavender blush": _$(255, 240, 245),
        "lavender": _$(230, 230, 250),
        "lawn green": _$(124, 252),
        "lemon chiffon": _$(255, 250, 205),
        "light blue": _$(173, 216, 230),
        "light coral": _$(240, 128, 128),
        "light cyan": _$(224, 255, 255),
        "light golden rod yellow": _$(250, 250, 210),
        "light gray": _$(211, 211, 211),
        "light green": _$(144, 238, 144),
        "light pink": _$(255, 182, 193),
        "light salmon": _$(255, 160, 122),
        "light sea green": _$(32, 178, 170),
        "light sky blue": _$(135, 206, 250),
        "light slate gray": _$(119, 136, 153),
        "light steel blue": _$(176, 196, 222),
        "light yellow": _$(255, 255, 224),
        "lime green": _$(50, 205, 50),
        "lime": _$(0, 255),
        "lime": _$(0, 255),
        "linen": _$(250, 240, 230),
        "magenta": _$(255, 0, 255),
        "maroon": _$(128),
        "medium aqua marine": _$(102, 205, 170),
        "medium blue": _$(0, 0, 205),
        "medium orchid": _$(186, 85, 211),
        "medium purple": _$(147, 112, 219),
        "medium sea green": _$(60, 179, 113),
        "medium slate blue": _$(123, 104, 238),
        "medium spring green": _$(0, 250, 154),
        "medium turquoise": _$(72, 209, 204),
        "medium violet red": _$(199, 21, 133),
        "midnight blue": _$(25, 25, 112),
        "mint cream": _$(245, 255, 250),
        "misty rose": _$(255, 228, 225),
        "moccasin": _$(255, 228, 181),
        "navajo white": _$(255, 222, 173),
        "navy": _$(0, 0, 128),
        "old lace": _$(253, 245, 230),
        "olive drab": _$(107, 142, 35),
        "olive": _$(128, 128),
        "orange red": _$(255, 69),
        "orange": _$(255, 165),
        "orchid": _$(218, 112, 214),
        "pale golden rod": _$(238, 232, 170),
        "pale green": _$(152, 251, 152),
        "pale turquoise": _$(175, 238, 238),
        "pale violet red": _$(219, 112, 147),
        "papaya whip": _$(255, 239, 213),
        "peach puff": _$(255, 218, 185),
        "peru": _$(205, 133, 63),
        "pink": _$(255, 192, 203),
        "plum": _$(221, 160, 221),
        "powder blue": _$(176, 224, 230),
        "purple": _$(128, 0, 128),
        "red": _$(255),
        "rosy brown": _$(188, 143, 143),
        "royal blue": _$(65, 105, 225),
        "saddle brown": _$(139, 69, 19),
        "salmon": _$(250, 128, 114),
        "sandy brown": _$(244, 164, 96),
        "sea green": _$(46, 139, 87),
        "sea shell": _$(255, 245, 238),
        "sienna": _$(160, 82, 45),
        "silver": _$(192, 192, 192),
        "sky blue": _$(135, 206, 235),
        "slate blue": _$(106, 90, 205),
        "slate gray": _$(112, 128, 144),
        "snow": _$(255, 250, 250),
        "spring green": _$(0, 255, 127),
        "steel blue": _$(70, 130, 180),
        "tan": _$(210, 180, 140),
        "teal": _$(0, 128, 128),
        "thistle": _$(216, 191, 216),
        "tomato": _$(255, 99, 71),
        "transparent": _$(0, 0, 0, 0),
        "turquoise": _$(64, 224, 208),
        "violet": _$(238, 130, 238),
        "wheat": _$(245, 222, 179),
        "white smoke": _$(245, 245, 245),
        "white": _$(255, 255, 255),
        "yellow green": _$(154, 205, 50),
        "yellow": _$(255, 255)
    };
}

class CSS_Percentage extends Number {
    static parse(l, rule, r) {
        let tx = l.tx, pky = l.pk.ty;
        if (l.ty == l.types.num || tx == "-" && pky == l.types.num) {
            let mult = 1;
            if (l.ch == "-") {
                mult = -1;
                tx = l.p.tx;
                l.p.next();
            }
            if (l.p.ch == "%") {
                l.sync().next();
                return new CSS_Percentage(parseFloat(tx) * mult);
            }
        }
        return null;
    }
    static _verify_(l) {
        if (typeof (l) == "string" && !isNaN(parseInt(l)) && l.includes("%"))
            return true;
        return false;
    }
    constructor(v) {
        if (typeof (v) == "string") {
            let lex = whind(v);
            let val = CSS_Percentage.parse(lex);
            if (val)
                return val;
        }
        super(v);
    }
    toJSON() {
        return super.toString() + "%";
    }
    toString(radix) {
        return super.toString(radix) + "%";
    }
    get str() {
        return this.toString();
    }
    lerp(to, t) {
        return new CSS_Percentage(this + (to - this) * t);
    }
    copy(other) {
        return new CSS_Percentage(other);
    }
    get type() {
        return "%";
    }
}
CSS_Percentage.label_name = "Percentage";

class CSS_Length extends Number {
    static parse(l) {
        let tx = l.tx, pky = l.pk.ty;
        if (l.ty == l.types.num || tx == "-" && pky == l.types.num) {
            let sign = 1;
            if (l.ch == "-") {
                sign = -1;
                tx = l.p.tx;
                l.p.next();
            }
            if (l.p.ty == l.types.id) {
                let id = l.sync().tx;
                l.next();
                return new CSS_Length(parseFloat(tx) * sign, id);
            }
        }
        return null;
    }
    static _verify_(l) {
        if (typeof (l) == "string" && !isNaN(parseInt(l)) && !l.includes("%"))
            return true;
        return false;
    }
    constructor(v, u = "") {
        if (typeof (v) == "string") {
            let lex = whind(v);
            let val = CSS_Length.parse(lex);
            if (val)
                return val;
        }
        if (u) {
            switch (u) {
                //Absolute
                case "px": return new PXLength(v);
                case "mm": return new MMLength(v);
                case "cm": return new CMLength(v);
                case "in": return new INLength(v);
                case "pc": return new PCLength(v);
                case "pt": return new PTLength(v);
                //Relative
                case "ch": return new CHLength(v);
                case "em": return new EMLength(v);
                case "ex": return new EXLength(v);
                case "rem": return new REMLength(v);
                //View Port
                case "vh": return new VHLength(v);
                case "vw": return new VWLength(v);
                case "vmin": return new VMINLength(v);
                case "vmax": return new VMAXLength(v);
                //Deg
                case "deg": return new DEGLength(v);
                case "%": return new CSS_Percentage(v);
            }
        }
        super(v);
    }
    get milliseconds() {
        switch (this.unit) {
            case ("s"):
                return parseFloat(this) * 1000;
        }
        return parseFloat(this);
    }
    toString(radix) {
        return super.toString(radix) + "" + this.unit;
    }
    toJSON() {
        return super.toString() + "" + this.unit;
    }
    get str() {
        return this.toString();
    }
    lerp(to, t) {
        return new CSS_Length(this + (to - this) * t, this.unit);
    }
    copy(other) {
        return new CSS_Length(other, this.unit);
    }
    set unit(t) { }
    get unit() { return ""; }
}
class PXLength extends CSS_Length {
    get unit() { return "px"; }
}
class MMLength extends CSS_Length {
    get unit() { return "mm"; }
}
class CMLength extends CSS_Length {
    get unit() { return "cm"; }
}
class INLength extends CSS_Length {
    get unit() { return "in"; }
}
class PTLength extends CSS_Length {
    get unit() { return "pt"; }
}
class PCLength extends CSS_Length {
    get unit() { return "pc"; }
}
class CHLength extends CSS_Length {
    get unit() { return "ch"; }
}
class EMLength extends CSS_Length {
    get unit() { return "em"; }
}
class EXLength extends CSS_Length {
    get unit() { return "ex"; }
}
class REMLength extends CSS_Length {
    get unit() { return "rem"; }
}
class VHLength extends CSS_Length {
    get unit() { return "vh"; }
}
class VWLength extends CSS_Length {
    get unit() { return "vw"; }
}
class VMINLength extends CSS_Length {
    get unit() { return "vmin"; }
}
class VMAXLength extends CSS_Length {
    get unit() { return "vmax"; }
}
class DEGLength extends CSS_Length {
    get unit() { return "deg"; }
}

let fetch = (typeof window !== "undefined") ? window.fetch : null;
const uri_reg_ex = /(?:([a-zA-Z][\dA-Za-z\+\.\-]*)(?:\:\/\/))?(?:([a-zA-Z][\dA-Za-z\+\.\-]*)(?:\:([^\<\>\:\?\[\]\@\/\#\b\s]*)?)?\@)?(?:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|((?:\[[0-9a-f]{1,4})+(?:\:[0-9a-f]{0,4}){2,7}\])|([^\<\>\:\?\[\]\@\/\#\b\s\.]{2,}(?:\.[^\<\>\:\?\[\]\@\/\#\b\s]*)*))?(?:\:(\d+))?((?:[^\?\[\]\#\s\b]*)+)?(?:\?([^\[\]\#\s\b]*))?(?:\#([^\#\s\b]*))?/i;
const STOCK_LOCATION = {
    protocol: "",
    host: "",
    port: "",
    path: "",
    hash: "",
    query: "",
    search: "",
    hostname: "",
    pathname: ""
};
function getCORSModes(url) {
    const IS_CORS = (URL.GLOBAL.host !== url.host && !!url.host);
    return {
        IS_CORS,
        mode: IS_CORS ? "cors" : "same-origin",
        credentials: IS_CORS ? "omit" : "include",
    };
}
function fetchLocalText(url, m = "cors") {
    return new Promise((res, rej) => {
        fetch(url + "", Object.assign({
            method: "GET"
        }, getCORSModes(url))).then(r => {
            if (r.status < 200 || r.status > 299)
                r.text().then(rej);
            else
                r.text().then(res);
        }).catch(e => rej(e));
    });
}
function fetchLocalJSON(url, m = "cors") {
    return new Promise((res, rej) => {
        fetch(url + "", Object.assign({
            method: "GET"
        }, getCORSModes(url))).then(r => {
            if (r.status < 200 || r.status > 299)
                r.json().then(rej);
            else
                r.json().then(res).catch(rej);
        }).catch(e => rej(e));
    });
}
function submitForm(url, form_data, m = "same-origin") {
    return new Promise((res, rej) => {
        var form;
        if (form_data instanceof FormData)
            form = form_data;
        else {
            form = new FormData();
            for (let name in form_data)
                form.append(name, form_data[name] + "");
        }
        fetch(url + "", Object.assign({
            method: "POST",
            body: form
        }, getCORSModes(url))).then(r => {
            if (r.status < 200 || r.status > 299)
                r.text().then(rej);
            else
                r.json().then(res);
        }).catch(e => e.text().then(rej));
    });
}
function submitJSON(url, json_data, m = "same-origin") {
    return new Promise((res, rej) => {
        fetch(url + "", Object.assign({
            method: "POST",
            body: JSON.stringify(json_data),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        }, getCORSModes(url))).then(r => {
            if (r.status < 200 || r.status > 299)
                r.json().then(rej);
            else
                r.json().then(res);
        }).catch(e => e.text().then(rej));
    });
}
/**
 *  Used for processing URLs, handling `document.location`, and fetching data.
 */
class URL {
    constructor(url = "", USE_LOCATION = false) {
        let IS_STRING = true, IS_LOCATION = false, location = (typeof (document) !== "undefined") ? document.location : STOCK_LOCATION;
        if (typeof (Location) !== "undefined" && url instanceof Location) {
            location = url;
            url = "";
            IS_LOCATION = true;
        }
        if (!url || typeof (url) != "string") {
            IS_STRING = false;
            IS_LOCATION = true;
            if (URL.GLOBAL && USE_LOCATION)
                return URL.GLOBAL;
        }
        /**
         * URL protocol
         */
        this.protocol = "";
        /**
         * Username string
         */
        this.user = "";
        /**
         * Password string
         */
        this.pwd = "";
        /**
         * URL hostname
         */
        this.host = "";
        /**
         * URL network port number.
         */
        this.port = 0;
        /**
         * URL resource path
         */
        this.path = "";
        /**
         * URL query string.
         */
        this.query = "";
        /**
         * Hashtag string
         */
        this.hash = "";
        /**
         * Map of the query data
         */
        this.map = null;
        if (url instanceof URL) {
            this.protocol = url.protocol;
            this.user = url.user;
            this.pwd = url.pwd;
            this.host = url.host;
            this.port = url.port;
            this.path = url.path;
            this.query = url.query;
            this.hash = url.hash;
        }
        else if (IS_STRING) {
            let part = url.match(uri_reg_ex);
            //If the complete string is not matched than we are dealing with something other 
            //than a pure URL. Thus, no object is returned. 
            if (part[0] !== url)
                return null;
            this.protocol = part[1] || ((USE_LOCATION) ? location.protocol : "");
            this.user = part[2] || "";
            this.pwd = part[3] || "";
            this.host = part[4] || part[5] || part[6] || ((USE_LOCATION) ? location.hostname : "");
            this.port = parseInt(part[7]) || ((USE_LOCATION) ? parseInt(location.port) : 0);
            this.path = part[8] || ((USE_LOCATION) ? location.pathname : "");
            this.query = part[9] || ((USE_LOCATION) ? location.search.slice(1) : "");
            this.hash = part[10] || ((USE_LOCATION) ? location.hash.slice(1) : "");
        }
        else if (IS_LOCATION && location) {
            this.protocol = location.protocol.replace(/\:/g, "");
            this.host = location.hostname;
            this.port = parseInt(location.port);
            this.path = location.pathname;
            this.hash = location.hash.slice(1);
            this.query = location.search.slice(1);
            this._getQuery_();
            if (USE_LOCATION) {
                URL.GLOBAL = this;
                return URL.GLOBAL;
            }
        }
        this._getQuery_();
    }
    /**
     * Resolves a URL relative to an original url. If the environment is NodeJS,
     * then node_module resolution may be used if the relative path
     * does not begin with a ./ or ../.
     * @param URL_or_url_new
     * @param URL_or_url_original
     */
    static resolveRelative(URL_or_url_new, URL_or_url_original = (URL.GLOBAL)
        ? URL.GLOBAL
        : (typeof document != "undefined" && typeof document.location != "undefined")
            ? document.location.toString()
            : null) {
        const URL_old = new URL(URL_or_url_original), URL_new = new URL(URL_or_url_new);
        if (!(URL_old + "") || !(URL_new + ""))
            return null;
        if (URL_new.path[0] != "/") {
            let a = URL_old.path.split("/");
            let b = URL_new.path.split("/");
            if (b[0] == "..")
                a.splice(a.length - 1, 1);
            for (let i = 0; i < b.length; i++) {
                switch (b[i]) {
                    case ".": a.splice(a.length - 1, 0);
                    case "..":
                        a.splice(a.length - 1, 1);
                        break;
                    default:
                        a.push(b[i]);
                }
            }
            URL_new.path = a.join("/");
        }
        return URL_new;
    }
    /**
    URL Query Syntax
 
    root => [root_class] [& [class_list]]
         => [class_list]
 
    root_class = key_list
 
    class_list [class [& key_list] [& class_list]]
 
    class => name & key_list
 
    key_list => [key_val [& key_list]]
 
    key_val => name = val
 
    name => ALPHANUMERIC_ID
 
    val => NUMBER
        => ALPHANUMERIC_ID
    */
    /**
     * Pulls query string info into this.map
     * @private
     */
    _getQuery_() {
        let map = (this.map) ? this.map : (this.map = new Map());
        let lex = new Lexer(this.query);
        const get_map = (k, m) => (m.has(k)) ? m.get(k) : m.set(k, new Map).get(k);
        let key = 0, key_val = "", class_map = get_map(key_val, map), lfv = 0;
        while (!lex.END) {
            switch (lex.tx) {
                case "&": //At new class or value
                    if (lfv > 0)
                        key = (class_map.set(key_val, lex.s(lfv)), lfv = 0, lex.n.pos);
                    else {
                        key_val = lex.s(key);
                        key = (class_map = get_map(key_val, map), lex.n.pos);
                    }
                    continue;
                case "=":
                    //looking for a value now
                    key_val = lex.s(key);
                    lfv = lex.n.pos;
                    continue;
            }
        }
        if (lfv > 0)
            class_map.set(key_val, lex.s(lfv));
    }
    setPath(path) {
        this.path = path;
        return new URL(this);
    }
    setLocation() {
        history.replaceState({}, "replaced state", `${this}`);
        //window.onpopstate();
    }
    toString() {
        let str = [];
        if (this.host) {
            if (this.protocol)
                str.push(`${this.protocol}://`);
            str.push(`${this.host}`);
        }
        if (this.port)
            str.push(`:${this.port}`);
        if (this.path)
            str.push(`${this.path[0] == "/" || this.path[0] == "." ? "" : "/"}${this.path}`);
        if (this.query)
            str.push(((this.query[0] == "?" ? "" : "?") + this.query));
        if (this.hash)
            str.push("#" + this.hash);
        return str.join("");
    }
    /**
     * Pulls data stored in query string into an object an returns that.
     * @param      {string}  class_name  The class name
     * @return     {object}  The data.
     */
    getData(class_name = "") {
        if (this.map) {
            let out = {};
            let _c = this.map.get(class_name);
            if (_c) {
                for (let [key, val] of _c.entries())
                    out[key] = val;
                return out;
            }
        }
        return null;
    }
    /**
     * Sets the data in the query string. Wick data is added after a second `?` character in the query field,
     * and appended to the end of any existing data.
     * @param     {object | Model | AnyModel}  data The data
     * @param     {string}  class_name  Class name to use in query string. Defaults to root, no class
     */
    setData(data = null, class_name = "") {
        if (data) {
            let map = this.map = new Map();
            let store = (map.has(class_name)) ? map.get(class_name) : (map.set(class_name, new Map()).get(class_name));
            //If the data is a falsy value, delete the association.
            for (let n in data) {
                if (data[n] !== undefined && typeof data[n] !== "object")
                    store.set(n, data[n]);
                else
                    store.delete(n);
            }
            //set query
            let null_class, str = "";
            if ((null_class = map.get(""))) {
                if (null_class.size > 0) {
                    for (let [key, val] of null_class.entries())
                        str += `&${key}=${val}`;
                }
            }
            for (let [key, class_] of map.entries()) {
                if (key === "")
                    continue;
                if (class_.size > 0) {
                    str += `&${key}`;
                    for (let [key, val] of class_.entries())
                        str += `&${key}=${val}`;
                }
            }
            str = str.slice(1);
            this.query = this.query.split("?")[0] + "?" + str;
            if (URL.GLOBAL == this)
                this.goto();
        }
        else {
            this.query = "";
        }
        return this;
    }
    /**
     * Fetch a string value of the remote resource.
     * Just uses path component of URL. Must be from the same origin.
     * @param      {boolean}  [ALLOW_CACHE=true]  If `true`, the return string will be cached.
     * If it is already cached, that will be returned instead. If `false`, a network fetch will always occur , and the result will not be cached.
     * @return     {Promise}  A promise object that resolves to a string of the fetched value.
     */
    fetchText(ALLOW_CACHE = false) {
        if (ALLOW_CACHE) {
            let resource = URL.RC.get(this.path);
            if (resource)
                return new Promise((res) => {
                    res(resource);
                });
        }
        return fetchLocalText(this).then(res => (URL.RC.set(this.path, res), res));
    }
    /**
     * Fetch a JSON value of the remote resource.
     * Just uses path component of URL. Must be from the same origin.
     * @param      {boolean}  [ALLOW_CACHE=true]  If `true`, the return string will be cached. If it is already cached,
     * that will be returned instead. If `false`, a network fetch will always occur , and the result will not be cached.
     * @return     {Promise}  A promise object that resolves to a string of the fetched value.
     */
    fetchJSON(ALLOW_CACHE = false) {
        if (ALLOW_CACHE) {
            let resource = URL.RC.get(this.path);
            if (resource)
                return new Promise((res) => {
                    res(resource);
                });
        }
        return fetchLocalJSON(this).then(res => (URL.RC.set(this.path, res), res));
    }
    /**
     * Cache a local resource at the value
     * @param    {object}  resource  The resource to store at this URL path value.
     * @returns {boolean} `true` if a resource was already cached for this URL, false otherwise.
     */
    cacheResource(resource) {
        let occupied = URL.RC.has(this.path);
        URL.RC.set(this.path, resource);
        return occupied;
    }
    submitForm(form_data) {
        return submitForm(this, form_data);
    }
    submitJSON(json_data, mode) {
        return submitJSON(this, json_data, mode);
    }
    /**
     * Goes to the current URL.
     */
    goto() {
        return;
        //let url = this.toString();
        //history.pushState({}, "ignored title", url);
        //window.onpopstate();
        //URL.GLOBAL = this;
    }
    //Returns the last segment of the path
    get file() {
        return this.path.split("/").pop();
    }
    //returns the name of the file less the extension
    get filename() {
        return this.file.split(".").shift();
    }
    //Returns the all but the last segment of the path
    get dir() {
        return this.path.split("/").slice(0, -1).join("/") || "/";
    }
    get pathname() {
        return this.path;
    }
    get href() {
        return this.toString();
    }
    get ext() {
        const m = this.path.match(/\.([^\.]*)$/);
        return m ? m[1] : "";
    }
    get search() {
        return this.query;
    }
    /**
     * True if the path is a relative path.
     *
     * Path must begin with `../` or `./` to be
     * considered relative.
     */
    get IS_RELATIVE() {
        return this.path.slice(0, 3) == "../" || this.path.slice(0, 2) == "./" || this.path.slice(0, 1) != "/";
    }
}
/**
 * The fetched resource cache.
 */
URL.RC = new Map();
/**
 * The Default Global URL object.
 */
URL.GLOBAL = (typeof location != "undefined") ? new URL(location) : new URL;
let SIMDATA = null;
/** Replaces the fetch actions with functions that simulate network fetches. Resources are added by the user to a Map object. */
URL.simulate = function () {
    SIMDATA = new Map;
    URL.prototype.fetchText = async (d) => ((d = this.toString()), SIMDATA.get(d)) ? SIMDATA.get(d) : "";
    URL.prototype.fetchJSON = async (d) => ((d = this.toString()), SIMDATA.get(d)) ? JSON.parse(SIMDATA.get(d).toString()) : {};
};
URL.addResource = (n, v) => (n && v && (SIMDATA || (SIMDATA = new Map())) && SIMDATA.set(n.toString(), v.toString));
let POLLYFILLED = false;
URL.polyfill = async function () {
    if (typeof (global) !== "undefined" && !POLLYFILLED) {
        POLLYFILLED = true;
        const fsr = (await new Promise(function (resolve) { resolve(_interopNamespace(require('fs'))); })), fs = fsr.promises, path = (await new Promise(function (resolve) { resolve(_interopNamespace(require('path'))); })), http = (await new Promise(function (resolve) { resolve(_interopNamespace(require('http'))); })), 
        //@ts-ignore
        g = global;
        URL.GLOBAL = new URL(process.cwd() + "/");
        g.document = g.document || {};
        g.document.location = URL.GLOBAL;
        g.location = URL.GLOBAL;
        const cached = URL.resolveRelative;
        URL.resolveRelative = function (new_url, old_url) {
            let URL_old = new URL(old_url), URL_new = new URL(new_url);
            const first_char = URL_new.path[0];
            if (first_char == "/") {
                //Prevent traversal outside the CWD for security purposes.
                URL_new.path = path.join(process.cwd(), URL_new.path);
                return URL_new;
            }
            else if (!URL_new.IS_RELATIVE) {
                //Attempt to resolve the file from the node_modules directories.
                /**
                 * TODO handle resolution of modules with a more general method.
                 * See yarn Plug'n'Play: https://yarnpkg.com/features/pnp
                 */
                const base_path = URL_old.path.split("/").filter(s => s !== ".."), new_path = URL_new.path;
                let i = base_path.length;
                while (i-- >= 0) {
                    try {
                        let search_path = "";
                        if (base_path[i] == "node_modules")
                            search_path = path.join(base_path.slice(0, i + 1).join("/"), new_path);
                        else
                            search_path = path.join(base_path.slice(0, i + 1).join("/"), "node_modules", new_path);
                        const stats = fsr.statSync(search_path);
                        if (stats)
                            return new URL(search_path);
                    }
                    catch (e) {
                        //Suppress errors - Don't really care if there is no file found. That can be handled by the consumer.
                    }
                }
            }
            return cached(URL_new, URL_old);
        };
        /**
         * Global `fetch` polyfill - basic support
         */
        fetch = g.fetch = async (url, data) => {
            if (data.IS_CORS) { // HTTP Fetch
                return new Promise((res, rej) => {
                    try {
                        http.get(url, data, req => {
                            let body = "";
                            req.setEncoding('utf8');
                            req.on("data", d => {
                                body += d;
                            });
                            req.on("end", () => {
                                res({
                                    status: 200,
                                    text: () => {
                                        return {
                                            then: (f) => f(body)
                                        };
                                    },
                                    json: () => {
                                        return {
                                            then: (f) => f(JSON.stringify(body))
                                        };
                                    }
                                });
                            });
                        });
                    }
                    catch (e) {
                        rej(e);
                    }
                });
            }
            else { //FileSystem Fetch
                let p = path.resolve(process.cwd(), "" + url), d = await fs.readFile(p, "utf8");
                try {
                    return {
                        status: 200,
                        text: () => {
                            return {
                                then: (f) => f(d)
                            };
                        },
                        json: () => {
                            return {
                                then: (f) => f(JSON.parse(d))
                            };
                        }
                    };
                }
                catch (err) {
                    throw err;
                }
            }
        };
    }
};
Object.freeze(URL.RC);
Object.seal(URL);

class CSS_URL extends URL {
    static parse(l) {
        if (l.tx == "url" || l.tx == "uri") {
            l.next().a("(");
            let v = "";
            if (l.ty == l.types.str) {
                v = l.tx.slice(1, -1);
                l.next().a(")");
            }
            else {
                const p = l.peek();
                while (!p.END && p.next().tx !== ")") { /* NO OP */ }
                v = p.slice(l);
                l.sync().a(")");
            }
            return new CSS_URL(v);
        }
        if (l.ty == l.types.str) {
            let v = l.tx.slice(1, -1);
            l.next();
            return new CSS_URL(v);
        }
        return null;
    }
}

class CSS_String extends String {
    static parse(l) {
        if (l.ty == l.types.str) {
            let tx = l.tx;
            l.next();
            return new CSS_String(tx);
        }
        return null;
    }
    constructor(string) {
        //if(string[0] == "\"" || string[0] == "\'" || string[0] == "\'")
        //    string = string.slice(1,-1);
        super(string);
    }
}

class CSS_Id extends String {
    static parse(l) {
        if (l.ty == l.types.id) {
            let tx = l.tx;
            l.next();
            return new CSS_Id(tx);
        }
        return null;
    }
}

/* https://www.w3.org/TR/css-shapes-1/#typedef-basic-shape */
class CSS_Shape extends Array {
    static parse(l) {
        if (l.tx == "inset" || l.tx == "circle" || l.tx == "ellipse" || l.tx == "polygon" || l.tx == "rect") {
            l.next().a("(");
            let v = "";
            if (l.ty == l.types.str) {
                v = l.tx.slice(1, -1);
                l.next().a(")");
            }
            else {
                let p = l.pk;
                while (!p.END && p.next().tx !== ")") { /* NO OP */ }
                v = p.slice(l);
                l.sync().a(")");
            }
            return new CSS_Shape(v);
        }
        return null;
    }
}

class CSS_Number extends Number {
    static parse(l) {
        let sign = 1;
        if (l.ch == "-" && l.pk.ty == l.types.num) {
            l.sync();
            sign = -1;
        }
        if (l.ty == l.types.num) {
            let tx = l.tx;
            l.next();
            return new CSS_Number(sign * (new Number(tx)));
        }
        return null;
    }
}

class Point2D extends Float64Array{
	
	constructor(x, y) {
		super(2);

		if (typeof(x) == "number") {
			this[0] = x;
			this[1] = y;
			return;
		}

		if (x instanceof Array) {
			this[0] = x[0];
			this[1] = x[1];
		}
	}

	draw(ctx, s = 1){
		ctx.beginPath();
		ctx.moveTo(this.x*s,this.y*s);
		ctx.arc(this.x*s, this.y*s, s*0.01, 0, 2*Math.PI);
		ctx.stroke();
	}

	get x (){ return this[0]}
	set x (v){if(typeof(v) !== "number") return; this[0] = v;}

	get y (){ return this[1]}
	set y (v){if(typeof(v) !== "number") return; this[1] = v;}
}

const sqrt = Math.sqrt;
const cos = Math.cos;
const acos = Math.acos;
const PI = Math.PI; 
const pow = Math.pow;

// A real-cuberoots-only function:
function cuberoot(v) {
  if(v<0) return -pow(-v,1/3);
  return pow(v,1/3);
}

function point(t, p1, p2, p3, p4) {
	var ti = 1 - t;
	var ti2 = ti * ti;
	var t2 = t * t;
	return ti * ti2 * p1 + 3 * ti2 * t * p2 + t2 * 3 * ti * p3 + t2 * t * p4;
}


class CBezier extends Float64Array{
	constructor(x1, y1, x2, y2, x3, y3, x4, y4) {
		super(8);

		//Map P1 and P2 to {0,0,1,1} if only four arguments are provided; for use with animations
		if(arguments.length == 4){
			this[0] = 0;
			this[1] = 0;
			this[2] = x1;
			this[3] = y1;
			this[4] = x2;
			this[5] = y2;
			this[6] = 1;
			this[7] = 1;
			return;
		}
		
		if (typeof(x1) == "number") {
			this[0] = x1;
			this[1] = y1;
			this[2] = x2;
			this[3] = y2;
			this[4] = x3;
			this[5] = y3;
			this[6] = x4;
			this[7] = y4;
			return;
		}

		if (x1 instanceof Array) {
			this[0] = x1[0];
			this[1] = x1[1];
			this[2] = x1[2];
			this[3] = x1[3];
			this[4] = x1[4];
			this[5] = x1[5];
			this[6] = x1[6];
			this[7] = x1[4];
			return;
		}
	}

	get x1 (){ return this[0]}
	set x1 (v){this[0] = v;}
	get x2 (){ return this[2]}
	set x2 (v){this[2] = v;}
	get x3 (){ return this[4]}
	set x3 (v){this[4] = v;}
	get x4 (){ return this[6]}
	set x4 (v){this[6] = v;}
	get y1 (){ return this[1]}
	set y1 (v){this[1] = v;}
	get y2 (){ return this[3]}
	set y2 (v){this[3] = v;}
	get y3 (){ return this[5]}
	set y3 (v){this[5] = v;}
	get y4 (){ return this[7]}
	set y4 (v){this[7] = v;}

	add(x,y = 0){
		return new CCurve(
			this[0] + x,
			this[1] + y,
			this[2] + x,
			this[3] + y,
			this[4] + x,
			this[5] + y,
			this[6] + x,
			this[7] + y
		)
	}

	valY(t){
		return point(t, this[1], this[3], this[5], this[7]);
	}

	valX(t){
		return point(t, this[0], this[2], this[4], this[6]);
	}

	point(t) {
		return new Point2D(
			point(t, this[0], this[2], this[4], this[6]),
			point(t, this[1], this[3], this[5], this[7])
		)
	}
	
	/** 
		Acquired from : https://pomax.github.io/bezierinfo/
		Author:  Mike "Pomax" Kamermans
		GitHub: https://github.com/Pomax/
	*/

	roots(p1,p2,p3,p4) {
		var d = (-p1 + 3 * p2 - 3 * p3 + p4),
			a = (3 * p1 - 6 * p2 + 3 * p3) / d,
			b = (-3 * p1 + 3 * p2) / d,
			c = p1 / d;

		var p = (3 * b - a * a) / 3,
			p3 = p / 3,
			q = (2 * a * a * a - 9 * a * b + 27 * c) / 27,
			q2 = q / 2,
			discriminant = q2 * q2 + p3 * p3 * p3;

		// and some variables we're going to use later on:
		var u1, v1, root1, root2, root3;

		// three possible real roots:
		if (discriminant < 0) {
			var mp3 = -p / 3,
				mp33 = mp3 * mp3 * mp3,
				r = sqrt(mp33),
				t = -q / (2 * r),
				cosphi = t < -1 ? -1 : t > 1 ? 1 : t,
				phi = acos(cosphi),
				crtr = cuberoot(r),
				t1 = 2 * crtr;
			root1 = t1 * cos(phi / 3) - a / 3;
			root2 = t1 * cos((phi + 2 * PI) / 3) - a / 3;
			root3 = t1 * cos((phi + 4 * PI) / 3) - a / 3;
			return [root3, root1, root2]
		}

		// three real roots, but two of them are equal:
		if (discriminant === 0) {
			u1 = q2 < 0 ? cuberoot(-q2) : -cuberoot(q2);
			root1 = 2 * u1 - a / 3;
			root2 = -u1 - a / 3;
			return [root2, root1];
		}

		// one real root, two complex roots
		var sd = sqrt(discriminant);
		u1 = cuberoot(sd - q2);
		v1 = cuberoot(sd + q2);
		root1 = u1 - v1 - a / 3;
		return [root1];
	}

	rootsY() {
		return this.roots(this[1],this[3],this[5],this[7]);
	}

	rootsX() {
		return this.roots(this[0],this[2],this[4],this[6]);
	}
	
	getYatX(x){
		var x1 = this[0] - x, x2 = this[2] - x, x3 = this[4] - x, x4 = this[6] - x,
			x2_3 = x2 * 3, x1_3 = x1 *3, x3_3 = x3 * 3,
			d = (-x1 + x2_3 - x3_3 + x4), di = 1/d, i3 = 1/3,
			a = (x1_3 - 6 * x2 + x3_3) * di,
			b = (-x1_3 + x2_3) * di,
			c = x1 * di,
			p = (3 * b - a * a) * i3,
			p3 = p * i3,
			q = (2 * a * a * a - 9 * a * b + 27 * c) * (1/27),
			q2 = q * 0.5,
			discriminant = q2 * q2 + p3 * p3 * p3;

		// and some variables we're going to use later on:
		var u1, v1, root;

		//Three real roots can never happen if p1(0,0) and p4(1,1);

		// three real roots, but two of them are equal:
		if (discriminant < 0) {
			var mp3 = -p / 3,
				mp33 = mp3 * mp3 * mp3,
				r = sqrt(mp33),
				t = -q / (2 * r),
				cosphi = t < -1 ? -1 : t > 1 ? 1 : t,
				phi = acos(cosphi),
				crtr = cuberoot(r),
				t1 = 2 * crtr;
			root = t1 * cos((phi + 4 * PI) / 3) - a / 3;
		}else if (discriminant === 0) {
			u1 = q2 < 0 ? cuberoot(-q2) : -cuberoot(q2);
			root = -u1 - a * i3;
		}else{
			var sd = sqrt(discriminant);
			// one real root, two complex roots
			u1 = cuberoot(sd - q2);
			v1 = cuberoot(sd + q2);
			root = u1 - v1 - a * i3;	
		}

		return point(root, this[1], this[3], this[5], this[7]);
	}
	/**
		Given a Canvas 2D context object and scale value, strokes a cubic bezier curve.
	*/
	draw(ctx, s = 1){
		ctx.beginPath();
		ctx.moveTo(this[0]*s, this[1]*s);
		ctx.bezierCurveTo(
			this[2]*s, this[3]*s,
			this[4]*s, this[5]*s,
			this[6]*s, this[7]*s
			);
		ctx.stroke();
	}
}

class CSS_Bezier extends CBezier {
    static parse(l) {
        let out = null;
        switch (l.tx) {
            case "cubic":
                l.next().a("(");
                let v1 = parseFloat(l.tx);
                let v2 = parseFloat(l.next().a(",").tx);
                let v3 = parseFloat(l.next().a(",").tx);
                let v4 = parseFloat(l.next().a(",").tx);
                l.a(")");
                out = new CSS_Bezier(v1, v2, v3, v4);
                break;
            case "ease":
                l.next();
                out = new CSS_Bezier(0.25, 0.1, 0.25, 1);
                break;
            case "ease-in":
                l.next();
                out = new CSS_Bezier(0.42, 0, 1, 1);
                break;
            case "ease-out":
                l.next();
                out = new CSS_Bezier(0, 0, 0.58, 1);
                break;
            case "ease-in-out":
                l.next();
                out = new CSS_Bezier(0.42, 0, 0.58, 1);
                break;
        }
        return out;
    }
    toString() {
        return `cubic-bezier(${this[2]},${this[3]},${this[4]},${this[5]})`;
    }
}

class Stop {
    constructor(color, percentage) {
        this.color = color;
        this.percentage = percentage || null;
    }
    toString() {
        return `${this.color}${(this.percentage) ? " " + this.percentage : ""}`;
    }
}
class CSS_Gradient {
    static parse(l) {
        let tx = l.tx, pky = l.pk.ty;
        if (l.ty == l.types.id) {
            switch (l.tx) {
                case "linear-gradient":
                    l.next().a("(");
                    let num, type = "deg";
                    if (l.tx == "to") ;
                    else if (l.ty == l.types.num) {
                        num = parseFloat(l.ty);
                        type = l.next().tx;
                        l.next().a(',');
                    }
                    let stops = [];
                    while (!l.END && l.ch != ")") {
                        let v = CSS_Color.parse(l, rule, r);
                        let len = null;
                        if (l.ch == ")") {
                            stops.push(new Stop(v, len));
                            break;
                        }
                        if (l.ch != ",") {
                            if (!(len = CSS_Length.parse(l)))
                                len = CSS_Percentage.parse(l);
                        }
                        else
                            l.next();
                        stops.push(new Stop(v, len));
                    }
                    l.a(")");
                    let grad = new CSS_Gradient();
                    grad.stops = stops;
                    return grad;
            }
        }
        return null;
    }
    constructor(type = 0) {
        this.type = type; //linear gradient
        this.direction = new CSS_Length(0, "deg");
        this.stops = [];
    }
    toString() {
        let str = [];
        switch (this.type) {
            case 0:
                str.push("linear-gradient(");
                if (this.direction !== 0)
                    str.push(this.direction.toString() + ",");
                break;
        }
        for (let i = 0; i < this.stops.length; i++)
            str.push(this.stops[i].toString() + ((i < this.stops.length - 1) ? "," : ""));
        str.push(")");
        return str.join(" ");
    }
}

const $medh = (prefix) => ({
    parse: (l, r, a, n = 0) => (n = CSS_Length.parse(l, r, a), (prefix > 0) ? ((prefix > 1) ? (win) => win.innerHeight <= n : (win) => win.innerHeight >= n) : (win) => win.screen.height == n)
});
const $medw = (prefix) => ({
    parse: (l, r, a, n = 0) => (n = CSS_Length.parse(l, r, a), (prefix > 0) ? ((prefix > 1) ? (win) => win.innerWidth >= n : (win) => win.innerWidth <= n) : (win) => win.screen.width == n)
});
function CSS_Media_handle(type, prefix) {
    switch (type) {
        case "h":
            return $medh(prefix);
        case "w":
            return $medw(prefix);
    }
    return {
        parse: function (a) {
            debugger;
        }
    };
}

function getValue(lex, attribute) {
    let v = lex.tx, mult = 1;
    if (v == "-")
        v = lex.n.tx, mult = -1;
    if (lex.pk.tx == ".")
        lex.next(), (v += lex.tx);
    if (lex.pk.ty == lex.types.number)
        lex.next(), (v += lex.tx);
    if (lex.pk.tx == "e")
        lex.next(), (v += lex.tx);
    if (lex.pk.tx == "-")
        lex.next(), (v += lex.tx);
    if (lex.pk.ty == lex.types.number)
        lex.next(), (v += lex.tx);
    let n = parseFloat(v) * mult;
    lex.next();
    if (lex.ch !== ")" && lex.ch !== ",") {
        switch (lex.tx) {
            case "%":
                break;
            /* Rotational Values */
            case "grad":
                n *= Math.PI / 200;
                break;
            case "deg":
                n *= Math.PI / 180;
                break;
            case "turn":
                n *= Math.PI * 2;
                break;
        }
        lex.next();
    }
    return n;
}
function ParseString(string, transform) {
    let lex = null;
    lex = string;
    if (typeof (string) == "string")
        lex = whind(string);
    while (!lex.END) {
        let tx = lex.tx;
        lex.next();
        switch (tx) {
            case "matrix":
                let a = getValue(lex.a("(")), b = getValue(lex.a(",")), c = getValue(lex.a(",")), d = getValue(lex.a(",")), r = -Math.atan2(b, a), sx1 = (a / Math.cos(r)) || 0, sx2 = (b / -Math.sin(r)) || 0, sy1 = (c / Math.sin(r)) || 0, sy2 = (d / Math.cos(r)) || 0;
                if (sx2 !== 0)
                    transform.sx = (sx1 + sx2) * 0.5;
                else
                    transform.sx = sx1;
                if (sy1 !== 0)
                    transform.sy = (sy1 + sy2) * 0.5;
                else
                    transform.sy = sy2;
                transform.px = getValue(lex.a(","));
                transform.py = getValue(lex.a(","));
                transform.r = r;
                lex.a(")");
                break;
            case "matrix3d":
                break;
            case "translate":
                transform.px = getValue(lex.a("("));
                lex.a(",");
                transform.py = getValue(lex);
                lex.a(")");
                continue;
            case "translateX":
                transform.px = getValue(lex.a("("));
                lex.a(")");
                continue;
            case "translateY":
                transform.py = getValue(lex.a("("));
                lex.a(")");
                continue;
            case "scale":
                transform.sx = getValue(lex.a("("));
                if (lex.ch == ",") {
                    lex.a(",");
                    transform.sy = getValue(lex);
                }
                else
                    transform.sy = transform.sx;
                lex.a(")");
                continue;
            case "scaleX":
                transform.sx = getValue(lex.a("("));
                lex.a(")");
                continue;
            case "scaleY":
                transform.sy = getValue(lex.a("("));
                lex.a(")");
                continue;
            case "scaleZ":
                break;
            case "rotate":
                transform.r = getValue(lex.a("("));
                lex.a(")");
                continue;
        }
        lex.next();
    }
}
// A 2D transform composition of 2D position, 2D scale, and 1D rotation.
class CSS_Transform2D extends Float64Array {
    static ToString(pos = [0, 0], scl = [1, 1], rot = 0) {
        var px = 0, py = 0, sx = 1, sy = 1, r = 0, cos = 1, sin = 0;
        if (pos.length == 5) {
            px = pos[0];
            py = pos[1];
            sx = pos[2];
            sy = pos[3];
            r = pos[4];
        }
        else {
            px = pos[0];
            py = pos[1];
            sx = scl[0];
            sy = scl[1];
            r = rot;
        }
        if (r !== 0) {
            cos = Math.cos(r);
            sin = Math.sin(r);
        }
        return `matrix(${cos * sx}, ${-sin * sx}, ${sy * sin}, ${sy * cos}, ${px}, ${py})`;
    }
    constructor(px, py, sx, sy, r) {
        super(5);
        this.sx = 1;
        this.sy = 1;
        if (px !== undefined) {
            if (px instanceof CSS_Transform2D) {
                this[0] = px[0];
                this[1] = px[1];
                this[2] = px[2];
                this[3] = px[3];
                this[4] = px[4];
            }
            else if (typeof (px) == "string")
                ParseString(px, this);
            else {
                this[0] = px;
                this[1] = py;
                this[2] = sx;
                this[3] = sy;
                this[4] = r;
            }
        }
    }
    get px() {
        return this[0];
    }
    set px(v) {
        this[0] = v;
    }
    get py() {
        return this[1];
    }
    set py(v) {
        this[1] = v;
    }
    get sx() {
        return this[2];
    }
    set sx(v) {
        this[2] = v;
    }
    get sy() {
        return this[3];
    }
    set sy(v) {
        this[3] = v;
    }
    get r() {
        return this[4];
    }
    set r(v) {
        this[4] = v;
    }
    set scale(s) {
        this.sx = s;
        this.sy = s;
    }
    get scale() {
        return this.sx;
    }
    lerp(to, t) {
        let out = new CSS_Transform2D();
        for (let i = 0; i < 5; i++)
            out[i] = this[i] + (to[i] - this[i]) * t;
        return out;
    }
    toString() {
        return CSS_Transform2D.ToString(this);
    }
    copy(v) {
        let copy = new CSS_Transform2D(this);
        if (typeof (v) == "string")
            ParseString(v, copy);
        return copy;
    }
    /**
     * Sets the transform value of a canvas 2D context;
     */
    setCTX(ctx) {
        let cos = 1, sin = 0;
        if (this[4] != 0) {
            cos = Math.cos(this[4]);
            sin = Math.sin(this[4]);
        }
        ctx.transform(cos * this[2], -sin * this[2], this[3] * sin, this[3] * cos, this[0], this[1]);
    }
    getLocalX(X) {
        return (X - this.px) / this.sx;
    }
    getLocalY(Y) {
        return (Y - this.py) / this.sy;
    }
}

/**
 * @brief Path Info
 * @details Path syntax information for reference
 *
 * MoveTo: M, m
 * LineTo: L, l, H, h, V, v
 * Cubic Bézier Curve: C, c, S, s
 * Quadratic Bézier Curve: Q, q, T, t
 * Elliptical Arc Curve: A, a
 * ClosePath: Z, z
 *
 * Capital symbols represent absolute positioning, lowercase is relative
 */
const PathSym = {
    M: 0,
    m: 1,
    L: 2,
    l: 3,
    h: 4,
    H: 5,
    V: 6,
    v: 7,
    C: 8,
    c: 9,
    S: 10,
    s: 11,
    Q: 12,
    q: 13,
    T: 14,
    t: 15,
    A: 16,
    a: 17,
    Z: 18,
    z: 19,
    pairs: 20
};
function getSignedNumber(lex) {
    let mult = 1, tx = lex.tx;
    if (tx == "-") {
        mult = -1;
        tx = lex.n.tx;
    }
    lex.next();
    return parseFloat(tx) * mult;
}
function getNumberPair(lex, array) {
    let x = getSignedNumber(lex);
    if (lex.ch == ',')
        lex.next();
    let y = getSignedNumber(lex);
    array.push(x, y);
}
function parseNumberPairs(lex, array) {
    while ((lex.ty == lex.types.num || lex.ch == "-") && !lex.END) {
        array.push(PathSym.pairs);
        getNumberPair(lex, array);
    }
}
/**
 * @brief An array store of path data in numerical form
 */
class CSS_Path extends Array {
    static FromString(string, array) {
        let lex = whind(string);
        while (!lex.END) {
            let relative = false, x = 0, y = 0;
            switch (lex.ch) {
                //Move to
                case "m":
                    relative = true;
                case "M":
                    lex.next(); //
                    array.push((relative) ? PathSym.m : PathSym.M);
                    getNumberPair(lex, array);
                    parseNumberPairs(lex, array);
                    continue;
                //Line to
                case "h":
                    relative = true;
                case "H":
                    lex.next();
                    x = getSignedNumber(lex);
                    array.push((relative) ? PathSym.h : PathSym.H, x);
                    continue;
                case "v":
                    relative = true;
                case "V":
                    lex.next();
                    y = getSignedNumber(lex);
                    array.push((relative) ? PathSym.v : PathSym.V, y);
                    continue;
                case "l":
                    relative = true;
                case "L":
                    lex.next();
                    array.push((relative) ? PathSym.l : PathSym.L);
                    getNumberPair(lex, array);
                    parseNumberPairs(lex, array);
                    continue;
                //Cubic Curve
                case "c":
                    relative = true;
                case "C":
                    array.push((relative) ? PathSym.c : PathSym.C);
                    getNumberPair(lex, array);
                    getNumberPair(lex, array);
                    getNumberPair(lex, array);
                    parseNumberPairs(lex, array);
                    continue;
                case "s":
                    relative = true;
                case "S":
                    array.push((relative) ? PathSym.s : PathSym.S);
                    getNumberPair(lex, array);
                    getNumberPair(lex, array);
                    parseNumberPairs(lex, array);
                    continue;
                //Quadratic Curve0
                case "q":
                    relative = true;
                case "Q":
                    array.push((relative) ? PathSym.q : PathSym.Q);
                    getNumberPair(lex, array);
                    getNumberPair(lex, array);
                    parseNumberPairs(lex, array);
                    continue;
                case "t":
                    relative = true;
                case "T":
                    array.push((relative) ? PathSym.t : PathSym.T);
                    getNumberPair(lex, array);
                    parseNumberPairs(lex, array);
                    continue;
                //Elliptical Arc
                //Close path:
                case "z":
                    relative = true;
                case "Z":
                    array.push((relative) ? PathSym.z : PathSym.Z);
            }
            lex.next();
        }
    }
    static ToString(array) {
        let string = [], l = array.length, i = 0;
        while (i < l) {
            switch (array[i++]) {
                case PathSym.M:
                    string.push("M", array[i++], array[i++]);
                    break;
                case PathSym.m:
                    string.push("m", array[i++], array[i++]);
                    break;
                case PathSym.L:
                    string.push("L", array[i++], array[i++]);
                    break;
                case PathSym.l:
                    string.push("l", array[i++], array[i++]);
                    break;
                case PathSym.h:
                    string.push("h", array[i++]);
                    break;
                case PathSym.H:
                    string.push("H", array[i++]);
                    break;
                case PathSym.V:
                    string.push("V", array[i++]);
                    break;
                case PathSym.v:
                    string.push("v", array[i++]);
                    break;
                case PathSym.C:
                    string.push("C", array[i++], array[i++], array[i++], array[i++], array[i++], array[i++]);
                    break;
                case PathSym.c:
                    string.push("c", array[i++], array[i++], array[i++], array[i++], array[i++], array[i++]);
                    break;
                case PathSym.S:
                    string.push("S", array[i++], array[i++], array[i++], array[i++]);
                    break;
                case PathSym.s:
                    string.push("s", array[i++], array[i++], array[i++], array[i++]);
                    break;
                case PathSym.Q:
                    string.push("Q", array[i++], array[i++], array[i++], array[i++]);
                    break;
                case PathSym.q:
                    string.push("q", array[i++], array[i++], array[i++], array[i++]);
                    break;
                case PathSym.T:
                    string.push("T", array[i++], array[i++]);
                    break;
                case PathSym.t:
                    string.push("t", array[i++], array[i++]);
                    break;
                case PathSym.Z:
                    string.push("Z");
                    break;
                case PathSym.z:
                    string.push("z");
                    break;
                case PathSym.pairs:
                    string.push(array[i++], array[i++]);
                    break;
                case PathSym.A:
                case PathSym.a:
                default:
                    i++;
            }
        }
        return string.join(" ");
    }
    constructor(data) {
        super();
        if (typeof (data) == "string") {
            Path.FromString(data, this);
        }
        else if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                this.push(parseFloat(data[i]));
            }
        }
    }
    toString() {
        return Path.ToString(this);
    }
    lerp(to, t, array = new Path) {
        let l = Math.min(this.length, to.length);
        for (let i = 0; i < l; i++)
            array[i] = this[i] + (to[i] - this[i]) * t;
        return array;
    }
}

class CSS_FontName extends String {
    static parse(l) {
        if (l.ty == l.types.str) {
            let tx = l.tx;
            l.next();
            return new CSS_String(tx);
        }
        if (l.ty == l.types.id) {
            let pk = l.peek();
            while (pk.type == l.types.id && !pk.END) {
                pk.next();
            }
            let str = pk.slice(l);
            l.sync();
            return new CSS_String(str);
        }
        return null;
    }
}

/**
 * CSS Type constructors
 */
const types = {
    color: CSS_Color,
    length: CSS_Length,
    time: CSS_Length,
    flex: CSS_Length,
    angle: CSS_Length,
    frequency: CSS_Length,
    resolution: CSS_Length,
    percentage: CSS_Percentage,
    url: CSS_URL,
    uri: CSS_URL,
    number: CSS_Number,
    id: CSS_Id,
    string: CSS_String,
    shape: CSS_Shape,
    cubic_bezier: CSS_Bezier,
    integer: CSS_Number,
    gradient: CSS_Gradient,
    transform2D: CSS_Transform2D,
    path: CSS_Path,
    fontname: CSS_FontName,
    /* Media parsers */
    m_width: CSS_Media_handle("w", 0),
    m_min_width: CSS_Media_handle("w", 1),
    m_max_width: CSS_Media_handle("w", 2),
    m_height: CSS_Media_handle("h", 0),
    m_min_height: CSS_Media_handle("h", 1),
    m_max_height: CSS_Media_handle("h", 2),
    m_device_width: CSS_Media_handle("dw", 0),
    m_min_device_width: CSS_Media_handle("dw", 1),
    m_max_device_width: CSS_Media_handle("dw", 2),
    m_device_height: CSS_Media_handle("dh", 0),
    m_min_device_height: CSS_Media_handle("dh", 1),
    m_max_device_height: CSS_Media_handle("dh", 2)
};
/**
 * CSS Property Definitions https://www.w3.org/TR/css3-values/#value-defs
 */
const property_definitions = {
    /* https://drafts.csswg.org/css-writing-modes-3/ */
    direction: "ltr|rtl",
    unicode_bidi: "normal|embed|isolate|bidi-override|isolate-override|plaintext",
    writing_mode: "horizontal-tb|vertical-rl|vertical-lr",
    text_orientation: "mixed|upright|sideways",
    glyph_orientation_vertical: `auto|0deg|90deg|"0"|"90"`,
    text_combine_upright: "none|all",
    /* https://www.w3.org/TR/css-position-3 */
    position: "static|relative|absolute|sticky|fixed",
    top: `<length>|<number>|<percentage>|auto`,
    left: `<length>|<number>|<percentage>|auto`,
    bottom: `<length>|<number>|<percentage>|auto`,
    right: `<length>|<number>|<percentage>|auto`,
    offset_before: `<length>|<percentage>|auto`,
    offset_after: `<length>|<percentage>|auto`,
    offset_start: `<length>|<percentage>|auto`,
    offset_end: `<length>|<percentage>|auto`,
    z_index: "auto|<integer>",
    /* https://www.w3.org/TR/css-display-3/ */
    display: `[ <display_outside> || <display_inside> ] | <display_listitem> | <display_internal> | <display_box> | <display_legacy>`,
    /* https://www.w3.org/TR/css-box-3 */
    margin: `[<length>|<percentage>|0|auto]{1,4}`,
    margin_top: `<length>|<percentage>|0|auto`,
    margin_right: `<length>|<percentage>|0|auto`,
    margin_bottom: `<length>|<percentage>|0|auto`,
    margin_left: `<length>|<percentage>|0|auto`,
    margin_trim: "none|in-flow|all",
    padding: `[<length>|<percentage>|0|auto]{1,4}`,
    padding_top: `<length>|<percentage>|0|auto`,
    padding_right: `<length>|<percentage>|0|auto`,
    padding_bottom: `<length>|<percentage>|0|auto`,
    padding_left: `<length>|<percentage>|0|auto`,
    /* https://www.w3.org/TR/CSS2/visuren.html */
    float: `left|right|none`,
    clear: `left|right|both|none`,
    /* https://drafts.csswg.org/css-sizing-3 todo:implement fit-content(%) function */
    box_sizing: `content-box | border-box`,
    width: `<length>|<percentage>|min-content|max-content|fit-content|auto`,
    height: `<length>|<percentage>|min-content|max-content|fit-content|auto`,
    min_width: `<length>|<percentage>|min-content|max-content|fit-content|auto`,
    max_width: `<length>|<percentage>|min-content|max-content|fit-content|auto|none`,
    min_height: `<length>|<percentage>|min-content|max-content|fit-content|auto`,
    max_height: `<length>|<percentage>|min-content|max-content|fit-content|auto|none`,
    /* https://www.w3.org/TR/2018/REC-css-color-3-20180619 */
    color: `<color>`,
    opacity: `<alphavalue>`,
    /* https://www.w3.org/TR/css-backgrounds-3/ */
    background_color: `<color>|red`,
    background_image: `<bg_image>#`,
    background_repeat: `<repeat_style>#`,
    background_attachment: `scroll|fixed|local`,
    background_position: `[<percentage>|<length>]{1,2}|[top|center|bottom]||[left|center|right]`,
    background_clip: `<box>#`,
    background_origin: `<box>#`,
    background_size: `<bg_size>#`,
    background: `[<bg_layer>#,]?<final_bg_layer>`,
    border_color: `<color>{1,4}`,
    border_top_color: `<color>`,
    border_right_color: `<color>`,
    border_bottom_color: `<color>`,
    border_left_color: `<color>`,
    border_top_width: `<line_width>`,
    border_right_width: `<line_width>`,
    border_bottom_width: `<line_width>`,
    border_left_width: `<line_width>`,
    border_width: `<line_width>{1,4}`,
    border_style: `<line_style>{1,4}`,
    border_top_style: `<line_style>`,
    border_right_style: `<line_style>`,
    border_bottom_style: `<line_style>`,
    border_left_style: `<line_style>`,
    border_top: `<line_width>||<line_style>||<color>`,
    border_right: `<line_width>||<line_style>||<color>`,
    border_bottom: `<line_width>||<line_style>||<color>`,
    border_left: `<line_width>||<line_style>||<color>`,
    border_radius: `<length_percentage>{1,4}[ / <length_percentage>{1,4}]?`,
    border_top_left_radius: `<length_percentage>{1,2}`,
    border_top_right_radius: `<length_percentage>{1,2}`,
    border_bottom_right_radius: `<length_percentage>{1,2}`,
    border_bottom_left_radius: `<length_percentage>{1,2}`,
    border: `<line_width>||<line_style>||<color>`,
    border_image: `<border_image_source>||<border_image_slice>[/<border_image_width>|/<border_image_width>?/<border_image_outset>]?||<border_image_repeat>`,
    border_image_source: `none|<image>`,
    border_image_slice: `[<number>|<percentage>]{1,4}&&fill?`,
    border_image_width: `[<length_percentage>|<number>|auto]{1,4}`,
    border_image_outset: `[<length>|<number>]{1,4}`,
    border_image_repeat: `[stretch|repeat|round|space]{1,2}`,
    box_shadow: `none|<shadow>#`,
    line_height: `normal|<percentage>|<length>|<number>`,
    overflow: 'visible|hidden|scroll|auto',
    /* https://www.w3.org/TR/css-fonts-4 */
    font_display: "auto|block|swap|fallback|optional",
    font_family: `[<generic_family>|<family_name>]#`,
    font_language_override: "normal|<string>",
    font: `[[<font_style>||<font_variant>||<font_weight>]?<font_size>[/<line_height>]?<font_family>]|caption|icon|menu|message-box|small-caption|status-bar`,
    font_max_size: `<absolute_size>|<relative_size>|<length>|<percentage>|infinity`,
    font_min_size: `<absolute_size>|<relative_size>|<length>|<percentage>`,
    font_optical_sizing: `auto|none`,
    font_pallette: `normal|light|dark|<identifier>`,
    font_size: `<absolute_size>|<relative_size>|<length>|<percentage>`,
    font_stretch: "<percentage>|normal|ultra-condensed|extra-condensed|condensed|semi-condensed|semi-expanded|expanded|extra-expanded|ultra-expanded",
    font_style: `normal|italic|oblique<angle>?`,
    font_synthesis: "none|[weight||style]",
    font_synthesis_small_caps: "auto|none",
    font_synthesis_style: "auto|none",
    font_synthesis_weight: "auto|none",
    font_variant_alternates: "normal|[stylistic(<feature-value-name>)||historical-forms||styleset(<feature-value-name>#)||character-variant(<feature-value-name>#)||swash(<feature-value-name>)||ornaments(<feature-value-name>)||annotation(<feature-value-name>)]",
    font_variant_emoji: "auto|text|emoji|unicode",
    font_variation_settings: " normal|[<string><number>]#",
    font_size_adjust: `<number>|none`,
    font_weight: `normal|bold|bolder|lighter|100|200|300|400|500|600|700|800|900`,
    /* https://www.w3.org/TR/css-fonts-3/ */
    font_kerning: ` auto | normal | none`,
    font_variant: `normal|none|[<common-lig-values>||<discretionary-lig-values>||<historical-lig-values>||<contextual-alt-values>||[small-caps|all-small-caps|petite-caps|all-petite-caps|unicase|titling-caps]||<numeric-figure-values>||<numeric-spacing-values>||<numeric-fraction-values>||ordinal||slashed-zero||<east-asian-variant-values>||<east-asian-width-values>||ruby||[sub|super]]`,
    font_variant_ligatures: `normal|none|[<common-lig-values>||<discretionary-lig-values>||<historical-lig-values>||<contextual-alt-values> ]`,
    font_variant_position: `normal|sub|super`,
    font_variant_caps: `normal|small-caps|all-small-caps|petite-caps|all-petite-caps|unicase|titling-caps`,
    font_variant_numeric: "normal | [ <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero ]",
    font_variant_east_asian: " normal | [ <east-asian-variant-values> || <east-asian-width-values> || ruby ]",
    /* https://drafts.csswg.org/css-text-3 */
    hanging_punctuation: "none|[first||[force-end|allow-end]||last]",
    hyphens: "none|manual|auto",
    letter_spacing: `normal|<length>`,
    line_break: "auto|loose|normal|strict|anywhere",
    overflow_wrap: "normal|break-word|anywhere",
    tab_size: "<length>|<number>",
    text_align: "start|end|left|right|center|justify|match-parent|justify-all",
    text_align_all: "start|end|left|right|center|justify|match-parent",
    text_align_last: "auto|start|end|left|right|center|justify|match-parent",
    text_indent: "[[<length>|<percentage>]&&hanging?&&each-line?]",
    text_justify: "auto|none|inter-word|inter-character",
    text_transform: "none|[capitalize|uppercase|lowercase]||full-width||full-size-kana",
    white_space: "normal|pre|nowrap|pre-wrap|break-spaces|pre-line",
    word_break: " normal|keep-all|break-all|break-word",
    word_spacing: "normal|<length>",
    word_wrap: "  normal | break-word | anywhere",
    /* https://drafts.csswg.org/css-text-decor-3 */
    text_decoration: "<text-decoration-line>||<text-decoration-style>||<color>",
    text_decoration_color: "<color>",
    text_decoration_line: "none|[underline||overline||line-through||blink]",
    text_decoration_style: "solid|double|dotted|dashed|wavy",
    text_emphasis: "<text-emphasis-style>||<text-emphasis-color>",
    text_emphasis_color: "<color>",
    text_emphasis_position: "[over|under]&&[right|left]?",
    text_emphasis_style: "none|[[filled|open]||[dot|circle|double-circle|triangle|sesame]]|<string>",
    text_shadow: "none|[<color>?&&<length>{2,3}]#",
    text_underline_position: "auto|[under||[left|right]]",
    /* Flex Box https://www.w3.org/TR/css-flexbox-1/ */
    align_content: `flex-start | flex-end | center | space-between | space-around | stretch`,
    align_items: `flex-start | flex-end | center | baseline | stretch`,
    align_self: `auto | flex-start | flex-end | center | baseline | stretch`,
    flex: `none|[<flex-grow> <flex-shrink>?||<flex-basis>]`,
    flex_basis: `content|<width>`,
    flex_direction: `row | row-reverse | column | column-reverse`,
    flex_flow: `<flex-direction>||<flex-wrap>`,
    flex_grow: `<number>`,
    flex_shrink: `<number>`,
    flex_wrap: `nowrap|wrap|wrap-reverse`,
    justify_content: "flex-start | flex-end | center | space-between | space-around",
    order: `<integer>`,
    /* https://drafts.csswg.org/css-transitions-1/ */
    transition: `<single_transition>#`,
    transition_delay: `<time>#`,
    transition_duration: `<time>#`,
    transition_property: `none|<single_transition_property>#`,
    transition_timing_function: `<timing_function>#`,
    /* CSS3 Animation https://drafts.csswg.org/css-animations-1/ */
    animation: `<single_animation>#`,
    animation_name: `[none|<keyframes_name>]#`,
    animation_duration: `<time>#`,
    animation_timing_function: `<timing_function>#`,
    animation_iteration_count: `<single_animation_iteration_count>#`,
    animation_direction: `<single_animation_direction>#`,
    animation_play_state: `<single_animation_play_state>#`,
    animation_delayed: `<time>#`,
    animation_fill_mode: `<single_animation_fill_mode>#`,
    /* https://svgwg.org/svg2-draft/interact.html#PointerEventsProperty */
    pointer_events: `visiblePainted|visibleFill|visibleStroke|visible|painted|fill|stroke|all|none|auto`,
    /* https://drafts.csswg.org/css-ui-3 */
    caret_color: "auto|<color>",
    cursor: "[[<url> [<number><number>]?,]*[auto|default|none|context-menu|help|pointer|progress|wait|cell|crosshair|text|vertical-text|alias|copy|move|no-drop|not-allowed|grab|grabbing|e-resize|n-resize|ne-resize|nw-resize|s-resize|se-resize|sw-resize|w-resize|ew-resize|ns-resize|nesw-resize|nwse-resize|col-resize|row-resize|all-scroll|zoom-in|zoom-out]]",
    outline: "[<outline-color>||<outline-style>||<outline-width>]",
    outline_color: "<color>|invert",
    outline_offset: "<length>",
    outline_style: "auto|<border-style>",
    outline_width: "<line-width>",
    resize: "none|both|horizontal|vertical",
    text_overflow: "clip|ellipsis",
    /* https://drafts.csswg.org/css-content-3/ */
    bookmark_label: "<content-list>",
    bookmark_level: "none|<integer>",
    bookmark_state: "open|closed",
    content: "normal|none|[<content-replacement>|<content-list>][/<string>]?",
    quotes: "none|[<string><string>]+",
    string_set: "none|[<custom-ident><string>+]#",
    /*https://www.w3.org/TR/CSS22/tables.html*/
    caption_side: "top|bottom",
    table_layout: "auto|fixed",
    border_collapse: "collapse|separate",
    border_spacing: "<length><length>?",
    empty_cells: "show|hide",
    /* https://www.w3.org/TR/CSS2/page.html */
    page_break_before: "auto|always|avoid|left|right",
    page_break_after: "auto|always|avoid|left|right",
    page_break_inside: "auto|avoid|left|right",
    orphans: "<integer>",
    widows: "<integer>",
    /* https://drafts.csswg.org/css-lists-3 */
    counter_increment: "[<custom-ident> <integer>?]+ | none",
    counter_reset: "[<custom-ident> <integer>?]+|none",
    counter_set: "[<custom-ident> <integer>?]+|none",
    list_style: "<list-style-type>||<list-style-position>||<list-style-image>",
    list_style_image: "<url>|none",
    list_style_position: "inside|outside",
    list_style_type: "<counter-style>|<string>|none",
    marker_side: "list-item|list-container",
    vertical_align: `baseline|sub|super|top|text-top|middle|bottom|text-bottom|<percentage>|<length>`,
    /* Visual Effects */
    clip: '<shape>|auto',
    visibility: `visible|hidden|collapse`,
    content: `normal|none|[<string>|<uri>|<counter>|attr(<identifier>)|open-quote|close-quote|no-open-quote|no-close-quote]+`,
    quotas: `[<string><string>]+|none`,
    counter_reset: `[<identifier><integer>?]+|none`,
    counter_increment: `[<identifier><integer>?]+|none`,
};
/* Properties that are not directly accessible by CSS prop creator */
const virtual_property_definitions = {
    /* https://drafts.csswg.org/css-counter-styles-3 */
    /*system:`cyclic|numeric|alphabetic|symbolic|additive|[fixed<integer>?]|[extends<counter-style-name>]`,
    negative:`<symbol><symbol>?`,
    prefix:`<symbol>`,
    suffix:`<symbol>`,
    range:`[[<integer>|infinite]{2}]#|auto`,
    pad:`<integer>&&<symbol>`,
    fallback:`<counter-style-name>`
    symbols:`<symbol>+`,*/
    counter_style: `<numeric_counter_style>|<alphabetic_counter_style>|<symbolic_counter_style>|<japanese_counter_style>|<korean_counter_style>|<chinese_counter_style>|ethiopic-numeric`,
    numeric_counter_style: `decimal|decimal-leading-zero|arabic-indic|armenian|upper-armenian|lower-armenian|bengali|cambodian|khmer|cjk-decimal|devanagari|georgian|gujarati|gurmukhi|hebrew|kannada|lao|malayalam|mongolian|myanmar|oriya|persian|lower-roman|upper-roman|tamil|telugu|thai|tibetan`,
    symbolic_counter_style: `disc|circle|square|disclosure-open|disclosure-closed`,
    alphabetic_counter_style: `lower-alpha|lower-latin|upper-alpha|upper-latin|cjk-earthly-branch|cjk-heavenly-stem|lower-greek|hiragana|hiragana-iroha|katakana|katakana-iroha`,
    japanese_counter_style: `japanese-informal|japanese-formal`,
    korean_counter_style: `korean-hangul-formal|korean-hanja-informal|and korean-hanja-formal`,
    chinese_counter_style: `simp-chinese-informal|simp-chinese-formal|trad-chinese-informal|and trad-chinese-formal`,
    /* https://drafts.csswg.org/css-conte-3/ */
    content_list: "[<string>|contents|<image>|<quote>|<target>|<leader()>]+",
    content_replacement: "<image>",
    /* https://drafts.csswg.org/css-values-4 */
    custom_ident: "<identifier>",
    position: "[[left|center|right]||[top|center|bottom]|[left|center|right|<length-percentage>][top|center|bottom|<length-percentage>]?|[[left|right]<length-percentage>]&&[[top|bottom]<length-percentage>]]",
    /* https://drafts.csswg.org/css-lists-3 */
    east_asian_variant_values: "[jis78|jis83|jis90|jis04|simplified|traditional]",
    alphavalue: '<number>',
    box: `border-box|padding-box|content-box`,
    /*Font-Size: www.w3.org/TR/CSS2/fonts.html#propdef-font-size */
    absolute_size: `xx-small|x-small|small|medium|large|x-large|xx-large`,
    relative_size: `larger|smaller`,
    /*https://www.w3.org/TR/css-backgrounds-3/#property-index*/
    bg_layer: `<bg_image>||<bg_position>[/<bg_size>]?||<repeat_style>||<attachment>||<box>||<box>`,
    final_bg_layer: `<background_color>||<bg_image>||<bg_position>[/<bg_size>]?||<repeat_style>||<attachment>||<box>||<box>`,
    bg_image: `<url>|<gradient>|none`,
    repeat_style: `repeat-x|repeat-y|[repeat|space|round|no-repeat]{1,2}`,
    background_attachment: `<attachment>#`,
    bg_size: `[<length_percentage>|auto]{1,2}|cover|contain`,
    bg_position: `[[left|center|right|top|bottom|<length_percentage>]|[left|center|right|<length_percentage>][top|center|bottom|<length_percentage>]|[center|[left|right]<length_percentage>?]&&[center|[top|bottom]<length_percentage>?]]`,
    attachment: `scroll|fixed|local`,
    line_style: `none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset`,
    line_width: `thin|medium|thick|<length>`,
    shadow: `inset?&&<length>{2,4}&&<color>?`,
    /* Font https://www.w3.org/TR/css-fonts-4/#family-name-value */
    family_name: `<fontname>`,
    generic_family: `serif|sans-serif|cursive|fantasy|monospace`,
    /* Identifier https://drafts.csswg.org/css-values-4/ */
    identifier: `<id>`,
    custom_ident: `<id>`,
    /* https://drafts.csswg.org/css-timing-1/#typedef-timing-function */
    timing_function: `linear|<cubic_bezier_timing_function>|<step_timing_function>|<frames_timing_function>`,
    cubic_bezier_timing_function: `<cubic_bezier>`,
    step_timing_function: `step-start|step-end|'steps()'`,
    frames_timing_function: `'frames()'`,
    /* https://drafts.csswg.org/css-transitions-1/ */
    single_animation_fill_mode: `none|forwards|backwards|both`,
    single_animation_play_state: `running|paused`,
    single_animation_direction: `normal|reverse|alternate|alternate-reverse`,
    single_animation_iteration_count: `infinite|<number>`,
    single_transition_property: `all|<custom_ident>`,
    single_transition: `[none|<single_transition_property>]||<time>||<timing_function>||<time>`,
    /* CSS3 Animation https://drafts.csswg.org/css-animations-1/ */
    single_animation: `<time>||<timing_function>||<time>||<single_animation_iteration_count>||<single_animation_direction>||<single_animation_fill_mode>||<single_animation_play_state>||[none|<keyframes_name>]`,
    keyframes_name: `<string>`,
    /* CSS3 Stuff */
    length_percentage: `<length>|<percentage>`,
    frequency_percentage: `<frequency>|<percentage>`,
    angle_percentage: `<angle>|<percentage>`,
    time_percentage: `<time>|<percentage>`,
    number_percentage: `<number>|<percentage>`,
    /*CSS Clipping https://www.w3.org/TR/css-masking-1/#clipping */
    clip_path: `<clip_source>|[<basic_shape>||<geometry_box>]|none`,
    clip_source: `<url>`,
    shape_box: `<box>|margin-box`,
    geometry_box: `<shape_box>|fill-box|stroke-box|view-box`,
    basic_shape: `<CSS_Shape>`,
    ratio: `<integer>/<integer>`,
    /* https://www.w3.org/TR/css-fonts-3/*/
    common_lig_values: `[ common-ligatures | no-common-ligatures ]`,
    discretionary_lig_values: `[ discretionary-ligatures | no-discretionary-ligatures ]`,
    historical_lig_values: `[ historical-ligatures | no-historical-ligatures ]`,
    contextual_alt_values: `[ contextual | no-contextual ]`,
    //Display
    display_outside: `block | inline | run-in`,
    display_inside: `flow | flow-root | table | flex | grid | ruby`,
    display_listitem: `<display_outside>? && [ flow | flow-root ]? && list-item`,
    display_internal: `table-row-group | table-header-group | table-footer-group | table-row | table-cell | table-column-group | table-column | table-caption | ruby-base | ruby-text | ruby-base-container | ruby-text-container`,
    display_box: `contents | none`,
    display_legacy: `inline-block | inline-table | inline-flex | inline-grid`,
};

function checkDefaults(lx) {
    const tx = lx.tx;
    /* https://drafts.csswg.org/css-cascade/#inherited-property */
    switch (lx.tx) {
        case "initial": //intentional
        case "inherit": //intentional
        case "unset": //intentional
        case "revert": //intentional
            if (!lx.pk.pk.END) // These values should be the only ones present. Failure otherwise.
                return 0; // Default value present among other values. Invalid
            return 1; // Default value present only. Valid
    }
    return 2; // Default value not present. Ignore
}
class JUX {
    get type() {
        return "jux";
    }
    constructor() {
        this.id = JUX.step++;
        this.r = [NaN, NaN];
        this.terms = [];
        this.HAS_PROP = false;
        this.name = "";
        this.virtual = false;
        this.REQUIRE_COMMA = false;
    }
    mergeValues(existing_v, new_v) {
        if (existing_v)
            if (existing_v.v) {
                if (Array.isArray(existing_v.v))
                    existing_v.v.push(new_v.v);
                else {
                    existing_v.v = [existing_v.v, new_v.v];
                }
            }
            else
                existing_v.v = new_v.v;
    }
    seal() {
    }
    sp(value, out_val) {
        if (this.HAS_PROP) {
            if (value)
                if (Array.isArray(value) && value.length === 1 && Array.isArray(value[0]))
                    out_val[0] = value[0];
                else
                    out_val[0] = value;
        }
    }
    isRepeating() {
        return !(isNaN(this.r[0]) && isNaN(this.r[1]));
    }
    parse(data) {
        const prop_data = [];
        this.parseLVL1(data instanceof whind.constructor ? data : whind(data + ""), prop_data);
        return prop_data;
    }
    parseLVL1(lx, out_val = [], ROOT = true) {
        if (typeof (lx) == "string")
            lx = whind(lx);
        let bool = false;
        if (ROOT) {
            switch (checkDefaults(lx)) {
                case 1:
                    this.sp(lx.tx, out_val);
                    return true;
                case 0:
                    return false;
            }
            bool = this.parseLVL2(lx, out_val, this.start, this.end);
        }
        else
            bool = this.parseLVL2(lx, out_val, this.start, this.end);
        return bool;
    }
    checkForComma(lx, out_val, temp_val = [], j = 0) {
        if (this.REQUIRE_COMMA) {
            if (out_val) {
                if (j > 0)
                    out_val.push(",", ...temp_val);
                else
                    out_val.push(...temp_val);
            }
            if (lx.ch !== ",")
                return false;
            lx.next();
        }
        else if (out_val)
            out_val.push(...temp_val);
        return true;
    }
    parseLVL2(lx, out_val, start, end) {
        let bool = false, copy = lx.copy(), temp_val = [];
        repeat: for (let j = 0; j < end && !lx.END; j++) {
            //const copy = lx.copy();
            const temp = [];
            for (let i = 0, l = this.terms.length; i < l; i++) {
                const term = this.terms[i];
                if (!term.parseLVL1(copy, temp, false)) {
                    if (!term.OPTIONAL) {
                        break repeat;
                    }
                }
            }
            temp_val.push(...temp);
            lx.sync(copy);
            bool = true;
            if (!this.checkForComma(copy, out_val, temp_val, j))
                break;
        }
        return bool;
    }
    get start() {
        return isNaN(this.r[0]) ? 1 : this.r[0];
    }
    set start(e) { }
    get end() {
        return isNaN(this.r[1]) ? 1 : this.r[1];
    }
    set end(e) { }
    get OPTIONAL() { return this.r[0] === 0; }
    set OPTIONAL(a) { }
}
JUX.step = 0;
class AND extends JUX {
    get type() {
        return "and";
    }
    parseLVL2(lx, out_val, start, end) {
        const PROTO = new Array(this.terms.length), l = this.terms.length;
        let bool = false, temp_val = [], copy = lx.copy();
        repeat: for (let j = 0; j < end && !lx.END; j++) {
            const HIT = PROTO.fill(0);
            //temp_r = [];
            and: while (!copy.END) {
                for (let i = 0; i < l; i++) {
                    if (HIT[i] === 2)
                        continue;
                    let term = this.terms[i];
                    const temp = [];
                    if (!term.parseLVL1(copy, temp, false)) {
                        if (term.OPTIONAL)
                            HIT[i] = 1;
                    }
                    else {
                        temp_val.push(...temp);
                        HIT[i] = 2;
                        continue and;
                    }
                }
                if (HIT.reduce((a, v) => a * v, 1) === 0)
                    break repeat;
                break;
            }
            lx.sync(copy);
            bool = true;
            if (!this.checkForComma(copy, out_val, temp_val, j))
                break;
        }
        return bool;
    }
}
class OR extends JUX {
    get type() {
        return "or";
    }
    parseLVL2(lx, out_val, start, end) {
        const PROTO = new Array(this.terms.length), l = this.terms.length;
        let bool = false, NO_HIT = true, copy = lx.copy(), temp_val = [];
        repeat: for (let j = 0; j < end && !lx.END; j++) {
            const HIT = PROTO.fill(0);
            or: while (!copy.END) {
                for (let i = 0; i < l; i++) {
                    if (HIT[i] === 2)
                        continue;
                    let term = this.terms[i];
                    if (term.parseLVL1(copy, temp_val, false)) {
                        NO_HIT = false;
                        HIT[i] = 2;
                        continue or;
                    }
                }
                if (NO_HIT)
                    break repeat;
                break;
            }
            lx.sync(copy);
            //if (temp_r.v)
            //    this.mergeValues(r, temp_r)
            bool = true;
            if (!this.checkForComma(copy, out_val, temp_val, j))
                break;
        }
        return bool;
    }
}
OR.step = 0;
class ONE_OF extends JUX {
    get type() {
        return "one_of";
    }
    parseLVL2(lx, out_val, start, end) {
        let BOOL = false;
        const copy = lx.copy(), temp_val = [];
        for (let j = 0; j < end && !lx.END; j++) {
            let bool = false;
            for (let i = 0, l = this.terms.length; i < l; i++) {
                if (this.terms[i].parseLVL1(copy, temp_val, false)) {
                    bool = true;
                    break;
                }
            }
            if (!bool)
                break;
            lx.sync(copy);
            BOOL = true;
            if (!this.checkForComma(copy, out_val, temp_val, j))
                break;
        }
        return BOOL;
    }
}
ONE_OF.step = 0;

class LiteralTerm {
    get type() {
        return "term";
    }
    constructor(value, type) {
        if (type == whind.types.string)
            value = value.slice(1, -1);
        this.value = value;
        this.HAS_PROP = false;
    }
    seal() { }
    parse(data) {
        const prop_data = [];
        this.parseLVL1(data instanceof whind.constructor ? data : whind(data + ""), prop_data);
        return prop_data;
    }
    parseLVL1(l, r, root = true) {
        if (typeof (l) == "string")
            l = whind(l);
        if (root) {
            switch (checkDefaults(l)) {
                case 1:
                    rule.push(l.tx);
                    return true;
                case 0:
                    return false;
            }
        }
        let v = l.tx;
        if (v == this.value) {
            l.next();
            r.push(v);
            //if (this.HAS_PROP  && !this.virtual && root)
            //    rule[0] = v;
            return true;
        }
        return false;
    }
    get OPTIONAL() { return false; }
    set OPTIONAL(a) { }
}
class ValueTerm extends LiteralTerm {
    constructor(value, getPropertyParser, definitions, productions) {
        super(value);
        if (value instanceof JUX)
            return value;
        this.value = null;
        const IS_VIRTUAL = { is: false };
        if (typeof (value) == "string")
            var u_value = value.replace(/\-/g, "_");
        if (!(this.value = types[u_value]))
            this.value = getPropertyParser(u_value, IS_VIRTUAL, definitions, productions);
        if (!this.value)
            return new LiteralTerm(value);
        if (this.value instanceof JUX) {
            if (IS_VIRTUAL.is)
                this.value.virtual = true;
            return this.value;
        }
    }
    parseLVL1(l, r, ROOT = true) {
        if (typeof (l) == "string")
            l = whind(l);
        if (ROOT) {
            switch (checkDefaults(l)) {
                case 1:
                    r.push(l.tx);
                    return true;
                case 0:
                    return false;
            }
        }
        //const rn = [];
        const v = this.value.parse(l);
        /*if (rn.length > 0) {
            
           // r.push(...rn);

            // if (this.HAS_PROP && !this.virtual)
            //     rule[0] = rn.v;

            return true;

        } else */ if (v) {
            r.push(v);
            //if (this.HAS_PROP && !this.virtual && ROOT)
            //    rule[0] = v;
            return true;
        }
        else
            return false;
    }
}
class SymbolTerm extends LiteralTerm {
    parseLVL1(l, rule, r) {
        if (typeof (l) == "string")
            l = whind(l);
        if (l.tx == this.value) {
            l.next();
            rule.push(this.value);
            return true;
        }
        return false;
    }
}

//import util from "util"
const standard_productions = {
    JUX,
    AND,
    OR,
    ONE_OF,
    LiteralTerm,
    ValueTerm,
    SymbolTerm
};
function getExtendedIdentifier(l) {
    let pk = l.pk;
    let id = "";
    while (!pk.END && (pk.ty & (whind.types.id | whind.types.num)) || pk.tx == "-" || pk.tx == "_") {
        pk.next();
    }
    id = pk.slice(l);
    l.sync();
    l.tl = 0;
    return id;
}
function getPropertyParser(property_name, IS_VIRTUAL = { is: false }, definitions = null, productions = standard_productions) {
    let parser_val = definitions[property_name];
    if (parser_val) {
        if (typeof (parser_val) == "string") {
            parser_val = definitions[property_name] = CreatePropertyParser(parser_val, property_name, definitions, productions);
        }
        parser_val.name = property_name;
        return parser_val;
    }
    if (!definitions.__virtual)
        definitions.__virtual = Object.assign({}, virtual_property_definitions);
    parser_val = definitions.__virtual[property_name];
    if (parser_val) {
        IS_VIRTUAL.is = true;
        if (typeof (parser_val) == "string") {
            parser_val = definitions.__virtual[property_name] = CreatePropertyParser(parser_val, "", definitions, productions);
            parser_val.virtual = true;
            parser_val.name = property_name;
        }
        return parser_val;
    }
    return null;
}
function CreatePropertyParser(notation, name, definitions, productions) {
    const l = whind(notation);
    //l.useExtendedId();
    const important = { is: false };
    let n = d(l, definitions, productions);
    n.seal();
    //if (n instanceof productions.JUX && n.terms.length == 1 && n.r[1] < 2)
    //    n = n.terms[0];
    n.HAS_PROP = true;
    n.IMP = important.is;
    /*//******** DEV
    console.log("")
    console.log("")
    console.log(util.inspect(n, { showHidden: false, depth: null }))
    //********** END Dev*/
    return n;
}
function d(l, definitions, productions, super_term = false, oneof_group = false, or_group = false, and_group = false, important = null) {
    let term, nt, v;
    const { JUX, AND, OR, ONE_OF, LiteralTerm, ValueTerm, SymbolTerm } = productions;
    while (!l.END) {
        switch (l.ch) {
            case "]":
                return term;
            case "[":
                v = d(l.next(), definitions, productions, true);
                l.assert("]");
                v = checkExtensions(l, v, productions);
                if (term) {
                    if (term instanceof JUX && term.isRepeating())
                        term = foldIntoProduction(productions, new JUX, term);
                    term = foldIntoProduction(productions, term, v);
                }
                else
                    term = v;
                break;
            case "<":
                let id = getExtendedIdentifier(l.next());
                v = new ValueTerm(id, getPropertyParser, definitions, productions);
                l.next().assert(">");
                v = checkExtensions(l, v, productions);
                if (term) {
                    if (term instanceof JUX /*&& term.isRepeating()*/)
                        term = foldIntoProduction(productions, new JUX, term);
                    term = foldIntoProduction(productions, term, v);
                }
                else {
                    term = v;
                }
                break;
            case "&":
                if (l.pk.ch == "&") {
                    if (and_group)
                        return term;
                    nt = new AND();
                    if (!term)
                        throw new Error("missing term!");
                    nt.terms.push(term);
                    l.sync().next();
                    while (!l.END) {
                        nt.terms.push(d(l, definitions, productions, super_term, oneof_group, or_group, true, important));
                        if (l.ch !== "&" || l.pk.ch !== "&")
                            break;
                        l.a("&").a("&");
                    }
                    return nt;
                }
                break;
            case "|":
                {
                    if (l.pk.ch == "|") {
                        if (or_group || and_group)
                            return term;
                        nt = new OR();
                        nt.terms.push(term);
                        l.sync().next();
                        while (!l.END) {
                            nt.terms.push(d(l, definitions, productions, super_term, oneof_group, true, and_group, important));
                            if (l.ch !== "|" || l.pk.ch !== "|")
                                break;
                            l.a("|").a("|");
                        }
                        return nt;
                    }
                    else {
                        if (oneof_group || or_group || and_group)
                            return term;
                        nt = new ONE_OF();
                        nt.terms.push(term);
                        l.next();
                        while (!l.END) {
                            nt.terms.push(d(l, definitions, productions, super_term, true, or_group, and_group, important));
                            if (l.ch !== "|")
                                break;
                            l.a("|");
                        }
                        return nt;
                    }
                }
            default:
                v = (l.ty == l.types.symbol) ? new SymbolTerm(l.tx) : new LiteralTerm(l.tx, l.ty);
                l.next();
                v = checkExtensions(l, v, productions);
                if (term) {
                    if (term instanceof JUX /*&& (term.isRepeating() || term instanceof ONE_OF)*/)
                        term = foldIntoProduction(productions, new JUX, term);
                    term = foldIntoProduction(productions, term, v);
                }
                else {
                    term = v;
                }
        }
    }
    return term;
}
function checkExtensions(l, term, productions) {
    outer: while (true) {
        switch (l.ch) {
            case "!":
                /* https://www.w3.org/TR/CSS21/cascade.html#important-rules */
                term.IMPORTANT = true;
                l.next();
                continue outer;
            case "{":
                term = foldIntoProduction(productions, term);
                term.r[0] = parseInt(l.next().tx);
                if (l.next().ch == ",") {
                    l.next();
                    if (l.pk.ch == "}") {
                        term.r[1] = parseInt(l.tx);
                        l.next();
                    }
                    else {
                        term.r[1] = Infinity;
                    }
                }
                else
                    term.r[1] = term.r[0];
                l.a("}");
                break;
            case "*":
                term = foldIntoProduction(productions, term);
                term.r[0] = 0;
                term.r[1] = Infinity;
                l.next();
                break;
            case "+":
                term = foldIntoProduction(productions, term);
                term.r[0] = 1;
                term.r[1] = Infinity;
                l.next();
                break;
            case "?":
                term = foldIntoProduction(productions, term);
                term.r[0] = 0;
                term.r[1] = 1;
                l.next();
                break;
            case "#":
                let nr = new productions.JUX();
                //nr.terms.push(new SymbolTerm(","));
                nr.terms.push(term);
                term = nr;
                //term = foldIntoProduction(productions, term);
                term.r[0] = 1;
                term.r[1] = Infinity;
                term.REQUIRE_COMMA = true;
                l.next();
                if (l.ch == "{") {
                    term.r[0] = parseInt(l.next().tx);
                    term.r[1] = parseInt(l.next().a(",").tx);
                    l.next().a("}");
                }
                break;
        }
        break;
    }
    return term;
}
function foldIntoProduction(productions, term, new_term = null) {
    if (term) {
        if (!(term instanceof productions.JUX)) {
            let nr = new productions.JUX();
            nr.terms.push(term);
            term = nr;
        }
        if (new_term) {
            term.seal();
            term.terms.push(new_term);
        }
        return term;
    }
    return new_term;
}

const observer_mixin_symbol = Symbol("observer_mixin_symbol");

const observer_mixin = function(calling_name, prototype) {

    const observer_identifier = Symbol("observer_array_reference");

    prototype[observer_mixin_symbol] = observer_identifier;

    //Adds an observer to the object instance. Applies a property to the observer that references the object instance.
    //Creates new observers array if one does not already exist.
    prototype.addObserver = function(...observer_list) {
        let observers = this[observer_identifier];

        if (!observers)
            observers = this[observer_identifier] = [];

        for (const observer of observer_list) {

            if (observer[observer_identifier] == this)
                return

            if (observer[observer_identifier])
                observer[observer_identifier].removeObserver(observer);

            observers.push(observer);

            observer[observer_identifier] = this;
        }
    };

    //Removes an observer from the object instance. 
    prototype.removeObserver = function(...observer_list) {

        const observers = this[observer_identifier];

        for (const observer of observer_list)
            for (let i = 0, l = observers.length; i < l; i++)
                if (observers[i] == observer) return (observer[observer_identifier] = null, observers.splice(i, 1));

    };


    prototype.updateObservers = function() {
        const observers = this[observer_identifier];

        if (observers)
            observers.forEach(obj => obj[calling_name](this));
    };
};

//Properly destructs this observers object on the object instance.
observer_mixin.destroy = function(observer_mixin_instance) {

    const symbol = observer_mixin_instance.constructor.prototype[observer_mixin_symbol];

    if (symbol) {
        if (observer_mixin_instance[symbol])
            observer_mixin_instance[symbol].forEach(observer=>observer[symbol] = null);

        observer_mixin_instance[symbol].length = 0;
        
        observer_mixin_instance[symbol] = null;
    }
};

observer_mixin.mixin_symbol = observer_mixin_symbol;

Object.freeze(observer_mixin);

/*
    Parses a string value of a css property. Returns result of parse or null.

    Arg - Array - An array with values:
        0 :  string name of css rule that should be used to parse the value string.
        1 :  string value of the css rule.
        2 :  BOOL value for the presence of the "important" value in the original string.

    Returns object containing:
        rule_name : the string name of the rule used to parse the value.
        body_string : the original string value
        prop : An array of CSS type instances that are the parsed values.
        important : boolean value indicating the presence of "important" value.
*/
function parseDeclaration(sym) {
    if (sym.length == 0)
        return null;
    let prop = null;
    const rule_name = sym[0], body_string = sym[2], important = sym[3] ? true : false, IS_VIRTUAL = { is: false }, parser = getPropertyParser(rule_name.replace(/\-/g, "_"), IS_VIRTUAL, property_definitions);
    if (parser && !IS_VIRTUAL.is)
        prop = parser.parse(whind(body_string));
    else
        //Need to know what properties have not been defined
        console.warn(`Unable to get parser for CSS property ${rule_name}`);
    return { name: rule_name, body_string, prop, important };
}

class styleprop {
    constructor(name, original_value, val) {
        this.val = val;
        this.name = name.replace(/\-/g, "_");
        this.original_value = original_value;
        this.rule = null;
        this.ver = 0;
    }
    destroy() {
        this.val = null;
        this.name = "";
        this.original_value = "";
        this.rule = null;
        observer_mixin.destroy(this);
    }
    get css_type() {
        return "styleprop";
    }
    updated() {
        this.updateObservers();
        if (this.parent)
            this.parent.update();
    }
    get value() {
        return this.val.length > 1 ? this.val : this.val[0];
    }
    get value_string() {
        return this.val.join(" ");
    }
    toString(offset = 0) {
        const off = ("    ").repeat(offset);
        return `${off + this.name.replace(/\_/g, "-")}:${this.value_string}`;
    }
    setValueFromString(value) {
        const result = parseDeclaration([this.name, null, value]);
        if (result)
            this.setValue(...result.prop);
    }
    setValue(...values) {
        let i = 0;
        for (const value of values) {
            const own_val = this.val[i];
            if (own_val && value instanceof own_val.constructor)
                this.val[i] = value;
            else
                this.val[i] = value;
            i++;
        }
        this.val.length = values.length;
        this.ver++;
        this.updated();
    }
}
observer_mixin("updatedCSSStyleProperty", styleprop.prototype);

/* 	Wraps parseDeclaration with a function that returns a styleprop object or null.
    Uses same args as parseDeclaration */
function parseDeclaration$1 (...v) {
    const result = parseDeclaration(...v);
    if (result)
        return new styleprop(result.name, result.body_string, result.prop);
    return null;
}

function setParent(array, parent) {
    for (const prop of array)
        prop.parent = parent;
}
/*
 * Holds a set of css style properties.
 */
class stylerule {
    constructor(selectors = [], props = []) {
        this.selectors = selectors;
        this.properties = new Map;
        this.addProp(props);
        //Versioning
        this.ver = 0;
        this.parent = null;
        setParent(this.selectors, this);
        setParent(this.properties.values(), this);
        this.props = new Proxy(this, this);
        this.addProperty = this.addProp;
        this.addProps = this.addProp;
        this.UPDATE_LOOP_GAURD = false;
    }
    get css_type() {
        return "stylerule";
    }
    destroy() {
        for (const prop of this.properties.values())
            prop.destroy();
        for (const selector of this.selectors)
            selector.destroy();
        this.parent = null;
        this.selectors = null;
        this.properties = null;
        observer_mixin.destroy(this);
    }
    /* sends an update signal up the hiearchy to allow style sheets to alert observers of new changes. */
    update() {
        this.ver++;
        //if(this.UPDATE_LOOP_GAURD) return;
        if (this.parent)
            this.parent.update();
        this.updateObservers();
    }
    get type() {
        return "stylerule";
    }
    get(obj, name) {
        let prop = obj.properties.get(name);
        //if (prop)
        //    prop.parent = this;
        return prop;
    }
    /*
        Adds properties to the stylerule
        arg1 string - accepts a string of semicolon seperated css style rules.
    */
    addProp(props) {
        if (typeof props == "string") {
            return this.addProps(props.split(";")
                .filter(e => e !== "")
                .map((e, a) => (a = e.split(":"), a.splice(1, 0, null), a))
                .map(parseDeclaration$1));
        }
        if (props.type == "stylerule")
            props = props.properties.values();
        else if (!Array.isArray(props))
            props = [props];
        // this.UPDATE_LOOP_GAURD = true;
        for (const prop of props)
            if (prop) {
                if (this.properties.has(prop.name))
                    this.properties.get(prop.name).setValue(...prop.val);
                else
                    this.properties.set(prop.name, prop);
                prop.parent = this;
            }
        //this.UPDATE_LOOP_GAURD = false;
        this.ver++;
        this.update();
        return props;
    }
    match(element, window) {
        for (const selector of this.selectors)
            if (selector.match(element, window))
                return true;
        return false;
    }
    *getApplicableSelectors(element, window) {
        for (const selector of this.selectors)
            if (selector.match(element, window))
                yield selector;
    }
    *getApplicableRules(element, window) {
        if (this.match(element, window))
            yield this;
    }
    *iterateProps() {
        for (const prop of this.properties.values())
            yield prop;
    }
    toString(off = 0, rule = "") {
        let str = [];
        for (const prop of this.properties.values())
            str.push(prop.toString(off));
        return `${this.selectors.join("")}{${str.join(";")}}`;
    }
    merge(rule) {
        if (!rule)
            return;
        if (rule.type == "stylerule") {
            for (const prop of rule.properties.values()) {
                if (prop) {
                    this.properties.set(prop.name, prop);
                }
            }
        }
    }
    get _wick_type_() { return 0; }
    set _wick_type_(v) { }
}
observer_mixin("updatedCSSStyleRule", stylerule.prototype);

class ruleset {
    constructor(asts, rules = []) {
        this.rules = rules;
        rules.forEach(r => r.parent = this);
        this.parent = null;
    }
    destroy() {
        for (const rule of this.rules)
            rule.destroy();
        this.rules = null;
        this.parent = null;
    }
    *getApplicableSelectors(element, win = window) {
        for (const rule of this.rules)
            yield* rule.getApplicableSelectors(element, win);
    }
    *getApplicableRules(element, win = window) {
        for (const rule of this.rules)
            yield* rule.getApplicableRules(element, window);
    }
    /* sends an update signal up the hiearchy to allow style sheets to alert observers of new changes. */
    update() {
        if (this.parent)
            this.parent.updated();
    }
    getRule(string) {
        let r = null;
        for (let node = this.fch; node; node = this.getNextChild(node))
            r = node.getRule(string, r);
        return r;
    }
    toString() {
        return this.rules.join("\n");
    }
}

class stylesheet {
    constructor(sym) {
        this.ruleset = null;
        if (sym) {
            this.ruleset = sym[0];
        }
        else {
            this.ruleset = new ruleset();
        }
        this.ruleset.parent = this;
        this.parent = null;
        this.READY = true;
    }
    destroy() {
        this.ruleset.destroy();
        this.parent = null;
        this.READY = false;
        observer_mixin.destroy(this);
    }
    get css_type() {
        return "stylesheet";
    }
    /**
     * Creates a new instance of the object with same properties as the original.
     * @return     {CSSRootNode}  Copy of this object.
     * @public
     */
    clone() {
        let rn = new this.constructor();
        rn._selectors_ = this._selectors_;
        rn._sel_a_ = this._sel_a_;
        rn._media_ = this._media_;
        return rn;
    }
    merge(in_stylesheet) {
        if (in_stylesheet instanceof stylesheet) {
            let ruleset = in_stylesheet.ruleset;
            outer: for (let i = 0; i < children.length; i++) {
                //determine if this child matches any existing selectors
                let child = children[i];
                for (let i = 0; i < this.children.length; i++) {
                    let own_child = this.children[i];
                    if (own_child.isSame(child)) {
                        own_child.merge(child);
                        continue outer;
                    }
                }
                this.children.push(child);
            }
        }
    }
    _resolveReady_(res, rej) {
        if (this.pending_build > 0)
            this.resolves.push(res);
        res(this);
    }
    _setREADY_() {
        if (this.pending_build < 1) {
            for (let i = 0, l = this.resolves; i < l; i++)
                this.resolves[i](this);
            this.resolves.length = 0;
            this.res = null;
        }
    }
    updated() {
        this.updateObservers();
    }
    *getApplicableSelectors(element, win = window) {
        yield* this.ruleset.getApplicableSelectors(element, window);
    }
    getApplicableRules(element, win = window, RETURN_ITERATOR = false, new_rule = new stylerule) {
        if (!(element instanceof HTMLElement))
            return new_rule;
        const iter = this.ruleset.getApplicableRules(element, win);
        if (RETURN_ITERATOR) {
            return iter;
        }
        else
            for (const rule of iter) {
                new_rule.merge(rule);
            }
        return new_rule;
    }
    *getApplicableProperties(element, win = window) {
        for (const rule of this.getApplicableRules(element, win, true))
            yield* rule.iterateProps();
    }
    getRule(string) {
        let r = null;
        for (let node = this.fch; node; node = this.getNextChild(node))
            r = node.getRule(string, r);
        return r;
    }
    toString() {
        return this.ruleset + "";
    }
}
observer_mixin("updatedCSS", stylesheet.prototype);

const types$1 = {
    color: CSS_Color,
    length: CSS_Length,
    time: CSS_Length,
    flex: CSS_Length,
    angle: CSS_Length,
    frequency: CSS_Length,
    resolution: CSS_Length,
    percentage: CSS_Percentage,
    url: CSS_URL,
    uri: CSS_URL,
    number: CSS_Number,
    id: CSS_Id,
    string: CSS_String,
    shape: CSS_Shape,
    cubic_bezier: CSS_Bezier,
    integer: CSS_Number,
    gradient: CSS_Gradient,
    transform2D: CSS_Transform2D,
    path: CSS_Path,
    fontname: CSS_FontName
};

/** SHARED METHODS **/

var common_methods = {

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

    await: async function() {
        return this.observeStop()
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

    step(i) { return this.set(i) },

    play(scale = 1, from = 0) {
        this.PLAY = true;
        this.SCALE = scale;
        this.time = from;
        spark.queueUpdate(this);
        this.issueEvent("started");
        return this;
    },

    async asyncPlay(scale, from, fn) {

        this.play(scale, from);

        return this.observeStop(fn);
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

    issueEvent(event) {
        if (this.events[event])
            this.events[event] = this.events[event].filter(e => e(this) !== false);
    },

    addEventListener(event, listener) {
        if (typeof(listener) === "function") {
            if (!this.events[event])
                this.events[event] = [];
            this.events[event].push(listener);
        }
    },

    removeEventListener(event, listener) {
        if (typeof(listener) === "function") {
            const events = this.events[event];
            if (events)
                for (let i = 0; i < events.length; i++)
                    if (events[i] === listener)
                        return (events.splice(i, 1), true);
        }
        return false;
    }
};

const 
    CSS_Length$1 = types$1.length,
    CSS_Percentage$1 = types$1.percentage,
    CSS_Color$1 = types$1.color,
    CSS_Transform2D$1 = types$1.transform2D,
    CSS_Bezier$1 = types$1.cubic_bezier,
    Animation = (function anim() {

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
                return from.v
            }
            copy(val) { return new lerpNonNumeric(val) }
        }


        // Store animation data for a single property on a single object. Hosts methods that can create CSS based interpolation and regular JS property animations. 
        class AnimProp {

            constructor(keys, obj, prop_name, type) {
                this.duration = 0;
                this.end = false;
                this.keys = [];
                this.current_val = null;

                const
                    IS_ARRAY = Array.isArray(keys),
                    k0 = IS_ARRAY ? keys[0] : keys,
                    k0_val = typeof(k0.value) !== "undefined" ? k0.value : k0.v;

                if (prop_name == "transform")
                    this.type = CSS_Transform2D$1;
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
                    let value = cs.getPropertyValue(name);

                    if (!value)
                        value = obj.style[prop_name];


                    if (this.type == CSS_Percentage$1) {
                        if (obj.parentElement) {
                            let pcs = window.getComputedStyle(obj.parentElement);
                            let pvalue = pcs.getPropertyValue(name);
                            let ratio = parseFloat(value) / parseFloat(pvalue);
                            value = (ratio * 100);
                        }
                    }
                    this.current_val = (new this.type(value));

                } else {
                    this.current_val = new this.type(obj[prop_name]);
                }
            }

            getType(value) {

                switch (typeof(value)) {
                    case "number":
                        return lerpNumber;
                    case "string":
                        if (CSS_Length$1._verify_(value))
                            return CSS_Length$1;
                        if (CSS_Percentage$1._verify_(value))
                            return CSS_Percentage$1;
                        if (CSS_Color$1._verify_(value))
                            return CSS_Color$1;
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

            constructor(obj, props) {
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

                const strings = [`.${keyfram_id}{animation:${keyfram_id} ${this.duration}ms ${Animation.ease_out.toString()}}`, `@keyframes ${keyfram_id}{`];

                // TODO: Use some function to determine the number of steps that should be taken
                // This should reflect the different keyframe variations that can occure between
                // properties.
                // For now, just us an arbitrary number

                const len = 2;
                const len_m_1 = len - 1;
                for (let i = 0; i < len; i++) {

                    strings.push(`${Math.round((i/len_m_1)*100)}%{`);

                    for (let name in this.props)
                        strings.push(this.props[name].toCSSString((i / len_m_1) * this.duration, name.replace(/([A-Z])/g, (match, p1) => "-" + match.toLowerCase())) + ";");

                    strings.push("}");
                }

                strings.push("}");

                return strings.join("\n");
            }

            beginCSSAnimation() {
                if (!this.CSS_ANIMATING) {

                    const anim_class = "class" + ((Math.random() * 10000) | 0);
                    this.CSS_ANIMATING = anim_class;

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
                    this.CSS_ANIMATING = "";
                    this.style.parentElement.removeChild(this.style);
                    this.style = null;
                }
            }
        }


        class AnimGroup {

            constructor(sequences) {

                this.constructCommon();
                this.seq = [];
                for (const seq of sequences)
                    this.add(seq);
            }

            destroy() {
                this.seq.forEach(seq => seq.destroy());
                this.seq = null;
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

        const GlowFunction = function(...args) {

            const output = [];

            for (let i = 0; i < args.length; i++) {
                let data = args[i];

                let obj = data.obj;

                if (obj) {


                    let props = {};

                    Object.keys(data).forEach(k => { if (!(({ obj: true, match: true, delay: true })[k])) props[k] = data[k]; });

                    output.push(new AnimSequence(obj, props));
                }else console.error(`Glow animation was passed an undefined object.`);
            }

            if (args.length > 1)
                return (new AnimGroup(output));

            return output.pop();
        };

        Object.assign(GlowFunction, {

            createSequence: GlowFunction,

            createGroup: function(...rest) {
                let group = new AnimGroup;
                rest.forEach(seq => group.add(seq));
                return group;
            },

            set USE_TRANSFORM(v) { USE_TRANSFORM = !!v; },
            get USE_TRANSFORM() { return USE_TRANSFORM; },

            linear: Linear,
            ease: new CSS_Bezier$1(0.25, 0.1, 0.25, 1),
            ease_in: new CSS_Bezier$1(0.42, 0, 1, 1),
            ease_out: new CSS_Bezier$1(0.2, 0.8, 0.3, 0.99),
            ease_in_out: new CSS_Bezier$1(0.42, 0, 0.58, 1),
            overshoot: new CSS_Bezier$1(0.2, 1.5, 0.2, 0.8),
            anticipate: new CSS_Bezier$1(0.5, -0.5, 0.5, 0.8),
            custom: (x1, y1, x2, y2) => new CSS_Bezier$1(x1, y1, x2, y2)
        });

        return GlowFunction;
    })();

function setTo(to, seq, duration, easing, from){

    const cs = window.getComputedStyle(to, null);
    const rect = to.getBoundingClientRect();
    const from_rect = from.getBoundingClientRect();

    let to_width = cs.getPropertyValue("width");
    let to_height = cs.getPropertyValue("height");
    let margin_left = parseFloat(cs.getPropertyValue("margin-left"));
    let to_bgc = cs.getPropertyValue("background-color");
    let to_c = cs.getPropertyValue("color");
    const pos = cs.getPropertyValue("position");

    /* USING TRANSFORM */

    //Use width and height a per

    {
        ////////////////////// LEFT ////////////////////// 

        const left = seq.props.left;
        let start_left = 0, final_left = 0, abs_diff = 0;

        abs_diff = (left.keys[0].val - rect.left);

        if(pos== "relative"){
            //get existing offset 
            const left = parseFloat(cs.getPropertyValue("left")) || 0;

            start_left = abs_diff +left;
            final_left = left;
        }else{
            start_left = to.offsetLeft + abs_diff;
            final_left = to.offsetLeft;
        }

        left.keys[0].val = new left.type(start_left, "px");
        left.keys[1].val = new left.type(final_left,"px");
        left.keys[1].dur = duration;
        left.keys[1].len = duration;
        left.keys[1].ease = easing;
        left.duration = duration;

        ////////////////////// TOP ////////////////////// 
        const top = seq.props.top;
        let start_top = 0, final_top = 0;

        abs_diff = (top.keys[0].val - rect.top);

        if(pos== "relative"){
             const top = parseFloat(cs.getPropertyValue("top")) || 0;
            start_top = abs_diff + top;
            final_top = top;
        }else{
            start_top = to.offsetTop + abs_diff;
            final_top = to.offsetTop;
        }

        top.keys[0].val = new top.type(start_top, "px");
        top.keys[1].val = new top.type(final_top,"px");
        top.keys[1].dur = duration;
        top.keys[1].len = duration;
        top.keys[1].ease = easing;
        top.duration = duration;

        ////////////////////// WIDTH ////////////////////// 

        seq.props.width.keys[0].val = new seq.props.width.type(to_width);
        seq.props.width.keys[0].dur = duration;
        seq.props.width.keys[0].len = duration;
        seq.props.width.keys[0].ease = easing;
        seq.props.width.duration = duration;

        ////////////////////// HEIGHT ////////////////////// 

        seq.props.height.keys[0].val = new seq.props.height.type(to_height);
        seq.props.height.keys[0].dur = duration;
        seq.props.height.keys[0].len = duration; 
        seq.props.height.keys[0].ease = easing; 
        seq.props.height.duration = duration;

    }
        to.style.transformOrigin = "top left";

    ////////////////////// BG COLOR ////////////////////// 

    seq.props.backgroundColor.keys[0].val = new seq.props.backgroundColor.type(to_bgc);
    seq.props.backgroundColor.keys[0].dur = duration; 
    seq.props.backgroundColor.keys[0].len = duration; 
    seq.props.backgroundColor.keys[0].ease = easing; 
    seq.props.backgroundColor.duration = duration;

    ////////////////////// COLOR ////////////////////// 

    seq.props.color.keys[0].val = new seq.props.color.type(to_c);
    seq.props.color.keys[0].dur = duration; 
    seq.props.color.keys[0].len = duration; 
    seq.props.color.keys[0].ease = easing; 
    seq.props.color.duration = duration;

    seq.obj = to;



    seq.addEventListener("stopped", ()=>{
        seq.unsetProps();
    });
}

/**
    Transform one element from another back to itself
    @alias module:wick~internals.TransformTo
*/
function TransformTo(element_from, element_to, duration = 500, easing = Animation.linear, HIDE_OTHER = false) {
    let rect = element_from.getBoundingClientRect();
    let cs = window.getComputedStyle(element_from, null);
    let margin_left = parseFloat(cs.getPropertyValue("margin"));

    let seq = Animation.createSequence({
        obj: element_from,
        // /transform: [{value:"translate(0,0)"},{value:"translate(0,0)"}],
        width: { value: "0px"},
        height: { value: "0px"},
        backgroundColor: { value: "rgb(1,1,1)"},
        color: { value: "rgb(1,1,1)"},
        left: [{value:rect.left+"px"},{ value: "0px"}],
        top: [{value:rect.top+"px"},{ value: "0px"}]
    });

    if (!element_to) {

        let a = (seq) => (element_to, duration = 500, easing = Animation.linear,  HIDE_OTHER = false) => {
            setTo(element_to, seq, duration, easing, element_from);
            seq.duration = duration;
        console.log(seq.toCSSString("MumboJumbo"));
            return seq;
        };

        return a(seq);
    }

    setTo(element_to, duration, easing, element_from);
    seq.duration = duration;
    return seq;
}

const Transitioneer = (function () {

    let obj_map = new Map();

    function $in(...data) {

        let
            seq = null,
            length = data.length,
            delay = 0;

        if (typeof (data[length - 1]) == "number")
            delay = data[length - 1], length--;

        for (let i = 0; i < length; i++) {
            let anim_data = data[i];

            if (typeof (anim_data) == "object") {

                if (anim_data.match && this.TT[anim_data.match]) {
                    let
                        duration = anim_data.duration,
                        easing = anim_data.easing;
                    seq = this.TT[anim_data.match](anim_data.obj, duration, easing);
                } else
                    seq = Animation.createSequence(anim_data);

                //Parse the object and convert into animation props. 
                if (seq) {
                    this.in_seq.push(seq);
                    this.in_duration = Math.max(this.in_duration, seq.duration);
                    if (this.OVERRIDE) {

                        if (obj_map.get(seq.obj)) {
                            let other_seq = obj_map.get(seq.obj);
                            other_seq.removeProps(seq);
                        }

                        obj_map.set(seq.obj, seq);
                    }
                }
            }
        }

        this.in_duration = Math.max(this.in_duration, parseInt(delay));

        return this.in;
    }


    function $out(...data) {
        //Every time an animating component is added to the Animation stack delay and duration need to be calculated.
        //The highest in_delay value will determine how much time is afforded before the animations for the in portion are started.
        let
            length = data.length,
            delay = 0;

        if (typeof (data[length - 1]) == "number") {
            if (typeof (data[length - 2]) == "number") {
                in_delay = data[length - 2];
                delay = data[length - 1];
                length -= 2;
            } else
                delay = data[length - 1], length--;
        }

        for (let i = 0; i < length; i++) {
            let anim_data = data[i];

            if (typeof (anim_data) == "object") {

                if (anim_data.match) {
                    this.TT[anim_data.match] = TransformTo(anim_data.obj);
                } else {
                    let seq = Animation.createSequence(anim_data);
                    if (seq) {
                        this.out_seq.push(seq);
                        this.out_duration = Math.max(this.out_duration, seq.duration);
                        if (this.OVERRIDE) {

                            if (obj_map.get(seq.obj)) {
                                let other_seq = obj_map.get(seq.obj);
                                other_seq.removeProps(seq);
                            }

                            obj_map.set(seq.obj, seq);
                        }
                    }

                    this.in_delay = Math.max(this.in_delay, parseInt(delay));
                }
            }
        }
    }



    class Transition {
        constructor(override = true) {
            this.constructCommon();
            this.in_duration = 0;
            this.out_duration = 0;
            // If set to zero transitions for out and in will happen simultaneously.
            this.in_delay = 0;

            this.in_seq = [];
            this.out_seq = [];

            this.TT = {};

            this.out = $out.bind(this);
            this.out.addEventListener = this.addEventListener.bind(this);
            this.out.removeEventListener = this.removeEventListener.bind(this);

            this.in = $in.bind(this);
            this.in.addEventListener = this.addEventListener.bind(this);
            this.in.removeEventListener = this.removeEventListener.bind(this);

            Object.defineProperty(this.out, "out_duration", {
                get: () => this.out_duration
            });

            this.OVERRIDE = override;
        }

        destroy() {
            let removeProps = function (seq) {
                if (!seq.DESTROYED) {
                    if (obj_map.get(seq.obj) == seq)
                        obj_map.delete(seq.obj);
                }

                seq.destroy();
            };
            this.in_seq.forEach(removeProps);
            this.out_seq.forEach(removeProps);
            this.in_seq.length = 0;
            this.out_seq.length = 0;
            this.out = null;
            this.in = null;
            this.destroyCommon();
        }

        get duration() {
            return Math.max(this.in_duration + this.in_delay, this.out_duration);
        }

        set duration(e) { };

        run(t) {

            for (let i = 0; i < this.out_seq.length; i++) {
                let seq = this.out_seq[i];
                if (!seq.run(t) && !seq.FINISHED) {
                    seq.issueEvent("stopped");
                    seq.FINISHED = true;
                }
            }

            const in_t = Math.max(t - this.in_delay, 0);

            for (let i = 0; i < this.in_seq.length; i++) {
                let seq = this.in_seq[i];
                if (!seq.run(t) && !seq.FINISHED) {
                    seq.issueEvent("stopped");
                    seq.FINISHED = true;
                }
            }

            return (t <= this.duration && t >= 0);
        }
    }

    Object.assign(Transition.prototype, common_methods);


    return { createTransition: (OVERRIDE) => new Transition(OVERRIDE) };
})();

Object.assign(Animation, {
	createTransition: (...args) => Transitioneer.createTransition(...args),
	transformTo: (...args) => TransformTo(...args)
});

addModuleToCFW(Animation, "glow");

module.exports = Animation;

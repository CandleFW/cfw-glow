import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';

export default {
    input: "./build/library/glow.js",
    treeshake: true,
    output: [{
        name: "glow",
        file: "./build/glow.node.js",
        format: "cjs",
        exports: "default"
    }, {
        name: "glow",
        file: "./build/glow.js",
        format: "iife",
        exports: "default"
    }],
    plugins: [commonjs({ include: ['./node_modules/*.*'] }), resolve()]
};

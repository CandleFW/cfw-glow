import resolve from 'rollup-plugin-node-resolve';

export default {
    input: "./build/library/glow.js",
    treeshake: { unknownGlobalSideEffects: true },
    output: [{
        name: "glow",
        file: "./build/glow.js",
        format: "iife",
        exports: "default",
        globals: { "worker_threads": "null", "os": "null" },
    }],
    plugins: [resolve({ jail: "", modulesOnly: true })],
    shimMissingExports: true
};

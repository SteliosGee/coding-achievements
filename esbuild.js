// @ts-check
const esbuild = require('esbuild');
const path = require('path');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const ctx = {
    entryPoints: ['src/extension.ts'],
    bundle: true,
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    outdir: path.resolve('dist'),
    sourcemap: !production,
    minify: production,
    logLevel: 'info',
};

async function main() {
    if (watch) {
        const buildContext = await esbuild.context(ctx);
        await buildContext.watch();
        console.log('Watching for changes...');
    } else {
        await esbuild.build(ctx);
        console.log('Build complete');
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});

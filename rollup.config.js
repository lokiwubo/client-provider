import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
export default [
    {
        input: 'src/index.ts',
        output: [
            {
                file: 'dist/index.js',
                format: 'cjs',
            },
            {
                file: 'dist/index.esm.js',
                format: 'esm',
            },
        ],
        plugins: [
            peerDepsExternal(),
            resolve({
                // 确保解析模块
                preferBuiltins: true, // 确保 lodash 不被解析为内置模块
            }),
            commonjs({
                // 将 CommonJS 模块转换为 ES6 模块
                include: /node_modules/, // 确保 node_modules 中的模块也被处理
            }),
            typescript({
                tsconfig: './tsconfig.json',
                outputToFilesystem: true, // 将编译结果输出到文件系统，以便于后续的类型检查
            }),
            terser({
                compress: true, // 启用压缩
                mangle: true, // 启用混淆
            }),
        ],
        external: ['axios'],
    },
    {
        input: 'src/index.ts',
        output: [{ file: 'dist/index.d.ts', format: 'es' }],
        plugins: [dts()],
    },
];

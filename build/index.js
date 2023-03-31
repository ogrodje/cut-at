"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs/yargs"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = __importDefault(require("child_process"));
;
// Parse arguments
const args = (0, yargs_1.default)(process.argv.slice(2))
    .options({
    videoFile: { type: 'string', demandOption: true, describe: 'Source video file' },
    outputDir: { type: 'string', demandOption: true, describe: 'Output folder for videos' },
    timestampsFile: { type: 'string', describe: 'The *.stamps file containing timestamps' },
    timestamps: { type: 'array', default: [], describe: 'Timestamps defined as an array' },
    dryRun: { type: 'boolean', default: false, describe: 'Pretend to execute the command' }
}).argv;
const validate = (args) => {
    const validatePath = (path) => {
        if (fs_1.default.existsSync(path))
            return path;
        else
            throw new Error(`Path ${path} does not exists.`);
    };
    const isDir = (path) => {
        if (fs_1.default.lstatSync(path).isDirectory())
            return path;
        else
            throw new Error(`The path - ${path} - is not a directory.`);
    };
    const validateTimestamp = (raw) => {
        if (raw.startsWith("#") || raw == "")
            return undefined;
        const matches = [...raw.matchAll(/(\d+:\d+\:?\d+).\-.(\d+:\d+\:?\d+).\-.(.*)/g)] || [];
        if (!matches[0])
            return undefined;
        let [, from, to, text] = matches[0].map(t => t.trim());
        return { from, to, text };
    };
    return {
        videoFile: validatePath(args.videoFile),
        outputDir: isDir(validatePath(args.outputDir)),
        timestamps: (args.timestamps.length !== 0 ? args.timestamps : fs_1.default.readFileSync(args.timestampsFile).toString().split('\n'))
            .map(validateTimestamp)
            .filter((t) => t !== undefined)
    };
};
const adjustTimestamp = (input) => input.match(/\d+:\d+/gm) ? "00:" + input : input;
const buildCommand = (input) => input
    .timestamps
    .map(ts => (Object.assign(Object.assign({}, ts), { from: adjustTimestamp(ts.from), to: adjustTimestamp(ts.to) })))
    .map(ts => (Object.assign(Object.assign({}, ts), { outputVideoFile: path_1.default.join(input.outputDir, [
        ts.from.replace(/\:/g, '_'),
        path_1.default.basename(input.videoFile)
    ].join('-')) })))
    .map((timestamp) => `ffmpeg -hide_banner -y -ss ${timestamp.from} -to ${timestamp.to} -i ${input.videoFile} -c copy ${timestamp.outputVideoFile}`)
    .slice(0, 5)
    .join(' && \\\n');
const runCommand = (command, args) => {
    if (args.dryRun)
        console.log(command);
    else {
        console.log(`# Executing:\n${command}`);
        let child = child_process_1.default.execSync(command).toString();
        console.log(child);
        console.log("Done.");
    }
};
runCommand(buildCommand(validate(args)), args);

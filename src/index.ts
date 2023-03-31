import yargs from "yargs/yargs";
import fs from "fs";
import path from "path";
import cp from "child_process";

type ValidPath = string;
type ValidDir = string;

interface Timestamp {
    from: string;
    to: string;
    text?: string;
}
interface Input {
    videoFile: ValidPath;
    outputDir: ValidPath & ValidDir;
    timestamps: Timestamp[];
}

// Parse arguments
const args = yargs(process.argv.slice(2)).options({
    videoFile: {
        type: "string",
        demandOption: true,
        describe: "Source video file",
    },
    outputDir: {
        type: "string",
        demandOption: true,
        describe: "Output folder for videos",
    },
    timestampsFile: {
        type: "string",
        describe: "The *.stamps file containing timestamps",
    },
    timestamps: {
        type: "array",
        default: [],
        describe: "Timestamps defined as an array",
    },
    dryRun: {
        type: "boolean",
        default: false,
        describe: "Pretend to execute the command",
    },
}).argv;

const validate = (args: any): Input => {
    const validatePath = (path: string): ValidPath => {
        if (fs.existsSync(path)) return path;
        else throw new Error(`Path ${path} does not exists.`);
    };

    const isDir = (path: ValidPath): ValidPath & ValidDir => {
        if (fs.lstatSync(path).isDirectory()) return path;
        else throw new Error(`The path - ${path} - is not a directory.`);
    };

    const validateTimestamp = (raw: string): Timestamp | undefined => {
        if (raw.startsWith("#") || raw == "") return undefined;
        const matches =
            [...raw.matchAll(/(\d+:\d+\:?\d+).\-.(\d+:\d+\:?\d+).\-.(.*)/g)] || [];
        if (!matches[0]) return undefined;
        let [, from, to, text] = matches[0].map((t) => t.trim());
        return { from, to, text } as Timestamp;
    };

    return {
        videoFile: validatePath(args.videoFile),
        outputDir: isDir(validatePath(args.outputDir)),
        timestamps: (args.timestamps.length !== 0
            ? args.timestamps
            : fs.readFileSync(args.timestampsFile).toString().split("\n")
        )
            .map(validateTimestamp)
            .filter((t: any) => t !== undefined),
    } as Input;
};

const adjustTimestamp = (input: string): string =>
    input.match(/\d+:\d+/gm) ? "00:" + input : input;

const buildCommand = (input: Input) =>
    input.timestamps
        .map((ts) => ({
            ...ts,
            from: adjustTimestamp(ts.from),
            to: adjustTimestamp(ts.to),
        }))
        .map((ts) => ({
            ...ts,
            outputVideoFile: path.join(
                input.outputDir,
                [ts.from.replace(/\:/g, "_"), path.basename(input.videoFile)].join("-")
            ),
        }))
        .map(
            (timestamp: Timestamp & { outputVideoFile: string }) =>
                `ffmpeg -hide_banner -y -ss ${timestamp.from} -to ${timestamp.to} -i ${input.videoFile} -c copy ${timestamp.outputVideoFile}`
        )
        .slice(0, 5)
        .join(" && \\\n");

const runCommand = (command: string, args: any & { dryRun: boolean }) => {
    if (args.dryRun) console.log(command);
    else {
        console.log(`# Executing:\n${command}`);
        let child = cp.execSync(command).toString();
        console.log(child);
        console.log("Done.");
    }
};

runCommand(buildCommand(validate(args)), args);

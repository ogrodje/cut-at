# cut-at

[cut-at] is a simple CLI tool for cutting log videos to short clips.

We use this tool at [Ogrodje Podcast][ogrodje] for creating of shorts and reels.

## Development

```bash
# Assure you have Node.js or use Nix Shell.
$ yarn install 
$ yarn build
$ node build/index.js --help
# Or
$ yarn run start:dev
```

## Usage

Create a "stamps" file with similar content

```
# This is examples stamps file.
09:33 - 10:13 - First clip
10:20 - 11:30 - Second clip
16:20 - # This won't work
18:30 - 20:00 - Some other clip
20:00 - 01:20:30 - Long clip
```

Then feed it to CLI application

```bash
node build/index.js \
    --outputDir=./output --videoFile=path/to/video/S02E03.mp4 \
    --timestampsFile=./s02e03.stamps
```

CLI inteface options

```
Options:
  --help            Show help                                          [boolean]
  --version         Show version number                                [boolean]
  --videoFile       Source video file                        [string] [required]
  --outputDir       Output folder for videos                 [string] [required]
  --timestampsFile  The *.stamps file containing timestamps             [string]
  --timestamps      Timestamps defined as an array         [array] [default: []]
  --dryRun          Pretend to execute the command    [boolean] [default: false]
```

## Author

[Oto Brglez](https://github.com/otobrglez)

[cut-at]: https://github.com/ogrodje/otobrglez
[ogrodje]: https://youtube.com/@ogrodje

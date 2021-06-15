const fsp = require("fs/promises")
const { constants } = require("fs")
const path = require("path")
const chalk = require("chalk")
const hbjs = require("handbrake-js")

const createTitle = movie =>
  movie.name
    .replace(/_$/g, "")
    .replace(/_/g, ".")
    .toLocaleLowerCase();

const parse = async location =>  {
  const dir = await fsp.opendir(location)
  const allFiles = []
  for await (const movie of dir) {
    const mkvLocation = path.join(location, movie.name)
    const movieTitle = createTitle(movie)
    const mkvs = await fsp.readdir(mkvLocation)
    const files = mkvs.map((mkv, _, self) => {
      let newTitle = `${movieTitle}.mkv`;
      if (self.length > 1) {
        const match = mkv.match(/(\d{2})/g);
        if (match) {
          newTitle = `${movieTitle}.${match[0]}.mkv`;
        }
      }
      input = path.join(mkvLocation, mkv)
      output = path.join(process.env.OUTPUT, newTitle)
      return { input, output }
    })
    allFiles.push({ film: movieTitle, files })
  }
  return allFiles
}

const executeHandbrake = (input, output) => {
  return new Promise((resolve, reject) => {
    hbjs.spawn({
      input,
      output,
      preset: "H.265 MKV 720p30",
      encoder: "x265",
      ab: 192,
      "encoder-preset": "veryslow",
      "keep-display-aspect": true,
      X: "threads=23"
    })
      .on("error", err => console.log(chalk.red(err.toString())))
      .on("progress", progress => {
        console.log(
          chalk.magenta(output),
          chalk.blueBright(progress.task),
          "avgFps: ", chalk.green(progress.avgFps),
          "fps: ", chalk.green(progress.fps),
          chalk.green(progress.percentComplete), "% ",
          chalk.green(progress.eta))
      })
      .on('end', () => resolve())
      .on('error', () => reject())
  })
}

const runViaHandbrakeCli = async allFiles => {
  for (const {input, output} of allFiles.flatMap(({files}) => files)) {
    try {
      await fsp.access(output, constants.F_OK)
      console.log(chalk.gray("Skipping " + input + " as it already exists"))
      continue
    } catch {
      console.log(chalk.gray("Encoding " + input + " as it doesn't exist"))
    }
    await executeHandbrake(input, output)
  }
}

const debug = (allFiles) => {
  allFiles.forEach(({film, files}) => {
    console.log("===============================")
    console.log(chalk.bold.yellow(film))
    console.log("===============================")
    console.log(files)
  });
  return allFiles
}

console.log(chalk.bold.cyan("MKVFolder: " + process.env.MKVFolder));
console.log(chalk.bold.cyan("OUTPUT: " + process.env.OUTPUT));
parse(process.env.MKVFolder)
  .then(debug)
  .then(runViaHandbrakeCli)
  .catch(console.error)

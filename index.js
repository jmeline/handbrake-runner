const util = require("util")
const fsp = require("fs/promises")
const { constants } = require("fs")
const exec = util.promisify(require("child_process").exec)
const path = require("path")
const chalk = require("chalk")

const createTitle = movie =>
  movie.name
    .replace(/_$/g, "")
    .replace(/_/g, ".")
    .toLocaleLowerCase();

async function parse(location) {
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

const debug = (allFiles) => {
  allFiles.forEach(({film, files}) => {
    console.log("===============================")
    console.log(chalk.bold.yellow(film))
    console.log("===============================")
    console.log(files)
  });
  return allFiles
}

const executeHandbrake = async (input, output) => {
  const promise = exec(
    `HandBrakeCLI -i ${input} -o ${output}          \
    --preset="H.265 MKV 720p30"                     \
    --quality 20                                    \
    --encoder x265                                  \
    -B 192                                          \
    --encoder-preset veryslow                       \
    --keep-display-aspect                           \
    -x threads=23`)
  const child = promise.child
  child.stdout.on("data", data => console.log(chalk.greenBright(data)))
  child.stderr.on("data", data => console.log(chalk.red(data)))
  child.on("close", data => console.log(chalk.green("Success! ", data)))
  const { stderr, stdout} = await promise

  if (stderr) {
    console.log(chalk.bold.red(stderr))
  }
  if (stdout) {
    console.log(chalk.bold.greenBright(stdout))
  }
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

console.log(chalk.bold.cyan("MKVFolder: " + process.env.MKVFolder));
console.log(chalk.bold.cyan("OUTPUT: " + process.env.OUTPUT));
parse(process.env.MKVFolder)
  .then(debug)
  .then(runViaHandbrakeCli)
  .catch(console.error)
const fsp = require("fs/promises")
const { exec } = require("child_process")
const path = require("path")
const chalk = require("chalk")

const outputDir = "output"
const dir = __dirname + "/" + outputDir

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
    // exec(`HandBrakeCLI -i ${input} -o ${output}       \
    //   --preset="H.265 MKV 720p30"                     \
    //   --quality 20                                    \
    //   --encoder x265                                  \
    //   -B 192                                          \
    //   --encoder-preset veryslow                       \
    //   --keep-display-aspect                           \
    //   -x threads=23`)
    // }
  }

  allFiles.forEach(({film, files}) => {
    console.log("===============================")
    console.log(chalk.bold.yellow(film))
    console.log("===============================")
    console.log(files)
  });
  //console.log({ allFiles })
}

console.log(chalk.bold.cyan("MKVFolder: " + process.env.MKVFolder));
console.log(chalk.bold.cyan("OUTPUT: " + process.env.OUTPUT));
parse(process.env.MKVFolder)
  .catch(console.error)

// fsp.access(dir, fs.constants.F_OK, err => {
//   console.log("MKVFolder: " + chalk.bold.cyan(process.env.MKVFolder));
//   console.log(chalk.bold.cyan("OUTPUT: " + process.env.OUTPUT));
//   // if (err) {
//   //   console.error(`Directory: ${dir} does not exist`)
//   //
//   //   // create folder for movies
//   // } else {
//   //   console.log(`Directory: ${dir} does exist`)
//   // }

//   parse(process.env.MKVFolder)
//     .catch(console.error)
// })
// if () {
//   fs.mkdirSync()

// }

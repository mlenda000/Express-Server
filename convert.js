
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

// Get arguments from command line
const mode = process.argv[2]; // 'file' or 'folder'
const target = process.argv[3]; // file name or folder name

const outputBase = 'F://Express-Server/Movies'; // Destination folder

if (!mode || !target) {
  console.error('Usage: node convert.js <file|folder> <filename|foldername>');
  process.exit(1);
}

function convertFile(inputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  const base = path.basename(inputPath, ext);

  if (!['.mov', '.avi', '.mkv'].includes(ext)) {
    console.log(`Skipping ${inputPath} — unsupported format.`);
    return;
  }

  const tempOutputPath = path.join(path.dirname(inputPath), `${base}.mp4`);
  const finalOutputPath = path.join(outputBase, `${base}.mp4`);

  if (fs.existsSync(finalOutputPath)) {
    console.log(`Skipping ${base}.mp4 — already converted and moved.`);
    return;
  }

  console.log(`Converting ${base} to MP4...`);
  ffmpeg(inputPath)
    .outputOptions('-c:s mov_text')
    .output(tempOutputPath)
    .videoCodec('libx264')
    .audioCodec('aac')
    .on('end', () => {
      console.log(`Converted: ${base}.mp4`);
      fs.rename(tempOutputPath, finalOutputPath, err => {
        if (err) {
          console.error(`Error moving ${base}.mp4:`, err.message);
        } else {
          console.log(`Moved to ${finalOutputPath}`);
        }
      });
    })
    .on('error', err => console.error(`Error converting ${base}:`, err.message))
    .run();
}

if (mode === 'file') {
  const inputPath = path.join('F://movies', target);
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }
  convertFile(inputPath);
} else if (mode === 'folder') {
  const folderPath = path.join(__dirname, target);
  if (!fs.existsSync(folderPath)) {
    console.error(`Folder not found: ${folderPath}`);
    process.exit(1);
  }

  fs.readdirSync(folderPath).forEach(file => {
    const inputPath = path.join(folderPath, file);
    convertFile(inputPath);
  });
} else {
  console.error('Invalid mode. Use "file" or "folder".');
  process.exit(1);
}

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

const mediaFolders = ['movies', 'tv', 'music']; // Add folders as needed

mediaFolders.forEach(folder => {
  const dirPath = path.join(__dirname, folder);
  fs.readdirSync(dirPath).forEach(file => {
    const ext = path.extname(file).toLowerCase();
    const base = path.basename(file, ext);

    if (ext === '.mov' || ext === '.avi' || ext === '.mkv') {
      const inputPath = path.join(dirPath, file);
      const outputPath = path.join(dirPath, `${base}.mp4`);

      // Skip if .mp4 already exists
      if (fs.existsSync(outputPath)) {
        console.log(`Skipping ${file} — already converted.`);
        return;
      }

      console.log(`Converting ${file} to MP4...`);
      ffmpeg(inputPath)
        .outputOptions('-c:s mov_text')
        .output(outputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .on('end', () => console.log(`Converted: ${file}`))
        .on('error', err => console.error(`Error converting ${file}:`, err.message))
        .run();
    }
  });
});

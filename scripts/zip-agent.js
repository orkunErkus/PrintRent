const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const agentDir = path.join(__dirname, '..', 'agent');
const outDir = path.join(__dirname, '..', 'client', 'dist', 'agent');
const outFile = path.join(outDir, 'printrent-agent.zip');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const output = fs.createWriteStream(outFile);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`Agent zip created: ${outFile} (${archive.pointer()} bytes)`);
});

archive.on('error', (err) => { throw err; });

archive.pipe(output);
archive.directory(agentDir, false);
archive.finalize();

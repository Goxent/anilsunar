const { exec } = require('child_process');

console.log('🔄 Starting auto-sync process...');

exec('npm run sasto-sync', (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Error running bot: ${error.message}`);
    return;
  }
  if (stderr) console.error(stderr);
  console.log(stdout);

  console.log('📦 Committing updated data to git...');
  const gitCmd = 'git config user.email "anil99senchury@gmail.com" && git config user.name "Anil Sunar" && git add nepse-dashboard/src/data/sasto_full_report.json && git commit -m "chore: auto-update sasto market data"';
  
  exec(gitCmd, (gitErr, gitStdout, gitStderr) => {
    if (gitErr) {
      console.error(`⚠️ Git commit issue (maybe no changes?): ${gitErr.message}`);
      return;
    }
    console.log(gitStdout);
    console.log('✅ Auto-sync complete!');
  });
});

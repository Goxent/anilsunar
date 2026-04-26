const { exec } = require('child_process');

console.log('🔄 Starting daily-sync process...');

exec('npm run daily-sync', (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Error running sync: ${error.message}`);
    // Don't exit here, still try to commit what we have if any
  }
  if (stderr) console.error(stderr);
  console.log(stdout);

  console.log('📦 Committing updated data to git...');
  const gitCmd = 'git add src/app/data/ && git commit -m "chore: sync market data" && git push';
  
  exec(gitCmd, (gitErr, gitStdout, gitStderr) => {
    if (gitErr) {
      console.error(`⚠️ Git issue (maybe no changes or push failed?): ${gitErr.message}`);
      return;
    }
    console.log(gitStdout);
    console.log('✅ Daily sync and push complete!');
  });
});

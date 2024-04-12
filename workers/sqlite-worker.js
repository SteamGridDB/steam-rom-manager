process.on('message', (data) => {
  try {
    const task = data.task; 
    const dbPath = data.dbPath;
    const options = data.options;
    const sqlite = require("better-sqlite3")
    const db = sqlite(dbPath);

    if (task === 'gog-galaxy') {
      const details = db.prepare("select * from LimitedDetails").all();
      const playtaskparams = db.prepare("select * from PlayTaskLaunchParameters").all();
      let playtasks = db.prepare("select * from PlayTasks").all();
      playtasks = playtasks.map(x => Object.assign(x, {
        productId: parseInt(x.gameReleaseKey.split('_').pop()),
        productType: x.gameReleaseKey.split('_')[0]
      }))
      .filter(x => x.productType == 'gog' || (options.externals && x.productType == 'generic'))
      .filter(x => x.isPrimary)
      .map((x) => {
        x.params = playtaskparams.filter((y) => y.playTaskId==x.id)[0]
        let xdetails = details.filter((y) => y.productId==x.productId);
        if(xdetails.length && xdetails[0]) {
          x.title = xdetails[0].title
        }
        return x;
      });
      process.send({
        type: 'result',
        result: playtasks
      })
    }

    else if (task === 'amazon-games') {
      const query = "select ProductTitle, InstallDirectory, Installed, Id from DbSet";
      process.send({
        type: 'result',
        result: db.prepare(query).all()
      })
    }

    else if (task === 'itch.io') {
      const query = "select title, verdict from caves as c join games as g on c.game_id = g.id";
      process.send({
        type: 'result',
        result: db.prepare(query).all()
      })
    }

    db.close();
    process.exit(0);
  } catch(e) {
    process.send({type: 'error', error: e})
  }
})

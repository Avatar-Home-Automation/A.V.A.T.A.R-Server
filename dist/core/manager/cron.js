import { CronJob } from 'cron';

async function start() {
  const plugins = await Avatar.Plugin.getList();
  for (var i = 0 ; i < plugins.length ; i++){
    const plugin = plugins[i];
    if (!plugin.cron) continue;
    job(plugin);
  }
}

function job(plugin) {
  if (!plugin.cron.time) { 
    return error(L.get(["cron.startError", plugin]));
  }
  info(L.get(["cron.start", plugin.name, plugin.cron.time]));

  // Create job
  new CronJob( plugin.cron.time, async () => {
      const setCron = await plugin.getInstance();
      setCron.cron(plugin.cron);
  }, null, true);
}

async function initCron() {
  Avatar.Cron = {
    'start': start
  }
}

export { initCron };

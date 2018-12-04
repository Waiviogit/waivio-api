module.exports = {
  apps : [{
    name: 'waivio-api',
    script: './bin/www',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    instances: 1,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: '8080'
    }
  }],

  deploy : {
    production : {
      user : 'admin',
      host : '35.157.207.192',
      ref  : 'origin/master',
      repo : 'git@github.com:Waiviogit/waivio-api.git',
      path : '/home/admin/waivio-api',
      'post-deploy' : 'npm install && pm2 startOrRestart ecosystem.config.js --env production'
    }
  }
};

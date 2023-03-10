import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const childprocess = require('child_process')
const path = require('path')

let electronProcess = null

// https://vitejs.dev/config/
export default defineConfig({
  base: path.resolve(__dirname, './dist'),
  build: {
    watch: {
      include: 'src/**'
    }
  },
  plugins: [
    vue(),
    {
      name: 'watch-electron',
      buildStart() {
        // kill electron to restart at the end of build
        if (electronProcess) {
          electronProcess.removeAllListeners('exit');
          electronProcess.kill();
          electronProcess = null;
        }
        //additionally, watch electrons main and preload files
        this.addWatchFile(path.resolve(__dirname, 'main.js'))
        this.addWatchFile(path.resolve(__dirname, 'preload.js'))
      }
    },
    {
      name: 'start-electron',
      closeBundle: () => {
        // start electron after build is finished
        electronProcess = childprocess.spawn('npm', ['run', 'electron:start'])
        // get console output for electron process
        electronProcess.stdout.on('data', (data) => {
          console.log(`${data}`);
        });
      }
    },
  ],
})

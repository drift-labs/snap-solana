const through = require("through2");

// Note: this is not being used right now because it didn't like @solana/web3.js, can't figure out a fix

module.exports = {
  cliOptions: {
    src: "./src/index.ts",
    port: 8080,
  },
  bundlerCustomizer: (bundler) => {
    bundler.transform(function () {
      let data = "";
      return through(
        function (buffer, _encoding, callback) {
          data += buffer;
          callback();
        },
        function (callback) {
          this.push("globalThis.Buffer = require('buffer/').Buffer;");
          this.push(data);
          callback();
        }
      );
    });
  },
};

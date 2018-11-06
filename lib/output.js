const ora = require("ora");
const kleur = require("kleur");

module.exports = {
  param: text => `${kleur.gray('"')}${kleur.bold(text)}${kleur.gray('"')}`,
  info: (...input) => `${kleur.gray(">")} ${input.join("\n")}`,
  error: (...input) => {
    return `${kleur.red("> Error!")} ${input.join("\n")}`;
  },
  task: async function(getPromise, options) {
    const { color } = options;
    const spinner = ora({ color });
    let result;

    const setText = text => {
      spinner.text = text;
    };

    try {
      spinner.start();
      result = await getPromise(setText);
    } catch (err) {
      spinner.stop();
      throw err;
    }

    spinner.stopAndPersist({ symbol: "✓" });

    return result;
  }
};

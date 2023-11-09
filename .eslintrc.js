module.exports = {
  extends: [
    "airbnb-typescript",
    "airbnb/hooks",
    "plugin:@typescript-eslint/recommended",
    "plugin:jest/recommended",
    "prettier",
    "plugin:prettier/recommended",
  ],
  plugins: ["prettier", "jest", "import"],
  env: {
    browser: true,
    es6: true,
    jest: true,
  },
  parserOptions: {
    project: "./tsconfig.json",
  },
  rules: {
    "prettier/prettier": "error",
    "react/jsx-filename-extension": [0],
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-any": "off",
  },
};

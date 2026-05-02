import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^node:"],
            ["^phaser$"],
            ["^@config/"],
            ["^@core/"],
            ["^@data/"],
            ["^@gameplay/"],
            ["^@scenes/"],
            ["^\.\.(?!/?$)", "^\.\./?$"],
            ["^\./(?=.*/)(?!/?$)", "^\.(?!/?$)", "^\./?$"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
    },
  },
];

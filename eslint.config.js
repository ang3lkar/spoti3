import globals from "globals";

export default [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-console": "off",
      "no-undef": "error",
      "prefer-const": "error",
      "no-var": "error",
    },
  },
  {
    ignores: [
      "node_modules/**",
      "downloads/**",
      "*.mp3",
      "coverage/**",
      ".git/**",
      "*.log",
    ],
  },
];

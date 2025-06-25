# Linting and Formatting

This project uses ESLint and Prettier to maintain code quality and consistent formatting across the codebase.

## Available Scripts

### Linting

To lint all packages:

```bash
npm run lint
```

To lint specific packages:

```bash
npm run lint:frontend
npm run lint:backend
```

### Auto-fixing Lint Issues

To automatically fix lint issues across all packages:

```bash
npm run lint:fix
```

To fix lint issues in specific packages:

```bash
npm run lint:fix:frontend
npm run lint:fix:backend
```

### Formatting

To format all files with Prettier:

```bash
npm run format
```

## Configuration

- ESLint configurations are in `.eslintrc.js` files in each package
- Prettier configuration is in the root `.prettierrc` file
- Ignore patterns are in `.eslintignore` and `.prettierignore` files

## Editor Integration

For the best development experience, install ESLint and Prettier extensions in your code editor to see lint errors and formatting issues in real-time.

### VSCode Extensions

- ESLint: `dbaeumer.vscode-eslint`
- Prettier: `esbenp.prettier-vscode`

## Pre-commit Hooks

To ensure code quality, it's recommended to run linting before committing changes:

```bash
npm run lint && npm run test
```

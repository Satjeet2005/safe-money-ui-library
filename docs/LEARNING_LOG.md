# Learning Log

Record of technical concepts, tools, and lessons learned across each work package.

## WP-01: Repository Scaffold

- **Tools used:** pnpm workspaces, Corepack, Node.js 22 LTS, strict TypeScript, ESLint (flat config), Prettier.
- **Concept:** Setting up a monorepo with strict boundary isolation between the reusable library (`@satjeet2005/safe-money-ui`) and the demo consumer application (`transfer-demo`).
- **How it works:** Corepack pins the exact package manager version; strict compiler options ensure full type safety with no unchecked indexed access or loose optional properties.

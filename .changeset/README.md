# Changesets

Every change to a published output (`packages/*`) adds a changeset: `npm run changeset`, pick the bump, describe the change for product teams. All `@guategeeks/*` packages share one version (`fixed`), so products upgrade them together. The lab app is not versioned.

Packages stay `private` until phase 4 chooses the registry; `npx changeset version` still bumps versions and writes changelogs.

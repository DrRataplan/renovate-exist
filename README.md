# renovate-exist

A [Renovate](https://docs.renovatebot.com/) preset that keeps EXPath package dependencies in an eXist-db app's `expath-pkg.xml` up to date, using the [eXist-db public-repo](https://exist-db.org/exist/apps/public-repo) as the source of versions.

## Usage

In the app's `renovate.json`:

```json
{
  "extends": ["config:recommended", "github>DrRataplan/renovate-exist"]
}
```

## What gets updated

| In `expath-pkg.xml` | Meaning | When Renovate opens a PR | Change |
|---|---|---|---|
| `semver="1"` | any 1.x.x | a new major (2.0.0) | `semver="2"` |
| `semver-min="6.1" semver-max="6"` | 6.1 up to any 6.x.x | a new major (7.0.1) | `semver-min="7.0.1" semver-max="7"` |
| `semver-min="1.0"` | 1.0 or newer | any newer release (1.1.0) | `semver-min="1.1.0"` |

Not handled yet: the `processor` dependency on eXist-db itself, `version="…"` (exact version lists), and attributes in a different order than `package` first.

## How it works

- **Versions** come from public-repo's package listing, `/public/apps.xml`, which returns JSON when asked with `Accept: application/json` (Renovate does this for `json` custom datasources). A JSONata transform picks the package by its name URI and returns its newest and older versions.
- **Reading `expath-pkg.xml`**: Renovate has no XML custom manager, so each dependency form is matched by one short regex on a single `<dependency>` element. The replacement is written from a template, so only that element changes.

## Testing

`test/` runs the preset end to end against a real public-repo:

1. Start eXist-db with [public-repo](https://github.com/eXist-db/public-repo) deployed on `localhost:8080` (see `.github/workflows/test.yml` for the exact steps: build public-repo with `ant`, add its `semver-xq` and `templating` dependencies, autodeploy into the `duncdrum/existdb` image).
2. `npm ci && npm test` builds small fixture packages from `test/packages.json`, publishes them to public-repo (user `repo`, password `repo`), runs Renovate with `--platform=local` against `test/app/expath-pkg.xml` (jinks' file plus one `semver-min` dependency), and checks the proposed updates against `test/expected.json`.

Set `PUBLIC_REPO_URL`, `PUBLIC_REPO_USERNAME` or `PUBLIC_REPO_PASSWORD` to test against another instance.

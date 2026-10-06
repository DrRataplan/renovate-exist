# renovate-exist

Renovate preset for eXist-db apps. Keeps the dependencies in `expath-pkg.xml` up to date, using versions from the [eXist-db public-repo](https://exist-db.org/exist/apps/public-repo).

## Usage

```json
{
  "extends": ["config:recommended", "github>DrRataplan/renovate-exist"]
}
```

Pin a release with `github>DrRataplan/renovate-exist#v1.0.0`.

## What it updates

| `expath-pkg.xml` | Updated when | Becomes |
|---|---|---|
| `semver="1"` | 2.0.0 is out | `semver="2"` |
| `semver-min="6.1" semver-max="6"` | 7.0.1 is out | `semver-min="7.0.1" semver-max="7"` |
| `semver-min="1.0"` | 1.1.0 is out | `semver-min="1.1.0"` |

Not supported (yet): the eXist-db `processor` dependency, `version="…"`, and attributes before `package`.

## How

Versions come from public-repo's `/public/apps.xml`, which serves JSON on `Accept: application/json`. Renovate has no XML manager, so `expath-pkg.xml` is read with one small regex per dependency form.

## Test

Needs eXist-db with public-repo on `localhost:8080`. See `.github/workflows/test.yml` for the setup.

```sh
npm ci
npm test
```

This publishes test packages to public-repo, runs Renovate on `test/app/expath-pkg.xml`, and checks the result against `test/expected.json`.

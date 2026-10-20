# renovate-exist

Renovate preset for eXist-db apps. Keeps the dependencies in `expath-pkg.xml` up to date, using versions from the [eXist-db public-repo](https://exist-db.org/exist/apps/public-repo).

## Usage

1. Add a `.github/renovate.json` file with the following contents:
```json
{
  "extends": ["config:recommended", "github>DrRataplan/renovate-exist"]
}
```
2. Pin a release with `github>DrRataplan/renovate-exist#v1.0.0`.
3. Install the [**Mend Renovate**](https://github.com/marketplace/renovate) app from the Github Marketplace.
4. Link your repository
5. Get updates on your expath dependencies when the public repo updates

## What it updates

| `expath-pkg.xml` | Updated when | Becomes |
|---|---|---|
| `semver="1"` | 2.0.0 is out | `semver="2"` |
| `semver-min="6.1" semver-max="6"` | 7.0.1 is out | `semver-min="7.0.1" semver-max="7"` |
| `semver-min="1.0"` | 1.1.0 is out | `semver-min="1.1.0"` |

Not supported (yet): the eXist-db `processor` dependency, `version="…"`, and attributes before `package`.

**The order of attributes matters**. Renovate does not process XML natively, instead it uses regexes to extract the versions and update them.
Before enabling Renovate please make sure your expath.xml looks like this.

```xml
   <dependency package="http://example.com/my-first-package" semver="1"/>
   <dependency package="http://example.com/my-secondpackage" semver-min="1.1.2" semver-max="1"/>
```

## How

Versions come from public-repo's `/public/apps.xml`, which serves JSON on `Accept: application/json`. Renovate has no XML manager, so `expath-pkg.xml` is read with one small regex per dependency form.

## Test

Needs eXist-db with public-repo on `localhost:8080`. See `.github/workflows/test.yml` for the setup.

```sh
npm ci
npm test
```

This publishes test packages to public-repo, runs Renovate on `test/app/expath-pkg.xml`, and checks the result against `test/expected.json`.

# Contributing

## Tests

Tests can be launched with `npm run test`.

## LDAP tests

LDAP tests an be launched with `npm run test-ldap`.

You will need to have the [mockup LDAP server](https://github.com/rroemhild/docker-test-openldap) launched on your computer to run the LDAP tests:

Pull the image (only neede once):

```
docker pull rroemhild/test-openldap
```

Then start the container:

```
docker run --privileged -d -p 389:389 rroemhild/test-openldap
```

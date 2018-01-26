# Contributing

Please, have a look at the [wiki](https://framagit.org/framasoft/ep_mypads/wikis/home).

## Tests

Tests can be launched with `npm run test`.

## LDAP tests

LDAP tests an be launched with `npm run test-ldap`.

You will need to have the [mockup LDAP server](https://github.com/rroemhild/docker-test-openldap) launched on your computer to run the LDAP tests:

The first time you start the container:

```
docker run --privileged -d -p 389:389 rroemhild/test-openldap --name test-openldap
```

After the first start of the container, you will be able to start it with:

```
docker start test-openldap
```

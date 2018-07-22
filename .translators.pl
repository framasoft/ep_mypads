#!/usr/bin/perl
use strict;
use warnings;

use JSON;

my $json = JSON->new->utf8->space_before(0)->space_after(1)->indent(1)->canonical(1);

my $new_json = {};
my $old_json = '';

while (defined(my $line = <STDIN>)) {
    $old_json .= $line;
}

$old_json = decode_json($old_json);

for my $l (@{$old_json}) {
    $new_json->{$l->{lang}} = [] unless $new_json->{$l->{lang}};
    push @{$new_json->{$l->{lang}}}, @{$l->{users}};
}

print $json->encode($new_json);

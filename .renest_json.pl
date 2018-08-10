#!/usr/bin/perl
use strict;
use warnings;

use JSON;
use Hash::Merge::Simple qw(merge);
use Getopt::Long;

my $en_file = 'po/mypads.default.json';
GetOptions ("file|f=s" => \$en_file);

my $json = JSON->new->utf8->space_before(0)->space_after(1)->indent(1)->canonical(1);

my $en;
{
  open my $fh, '<', $en_file or die;
  local $/ = undef;
  $en = <$fh>;
  close $fh;
}

$en = $json->decode($en);

my $new_json = {};
my $old_json = '';

while (defined(my $line = <STDIN>)) {
    $old_json .= $line;
}

$old_json = decode_json($old_json);
for my $key (keys %{$old_json}) {
    my $value = $old_json->{$key};

    $value = $en->{$key} unless (defined($value) && $value ne '');

    my @keys  = split(/\./, $key);
    while (scalar(@keys)) {
        $value = {
            pop(@keys) => $value
        };
    }

    $new_json = merge $new_json, $value;
}

print $json->encode($new_json);

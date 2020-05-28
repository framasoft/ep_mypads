#!/bin/bash
redis-cli flushdb
for i in fry* zoidberg* leela.json
do
    export ID=$(jq -r ._id < $i)
    cat $i | tr '\012' ' ' | sed -e "s/ \+/ /g" |  redis-cli -x set mypads:user:$ID
done
for i in pad*
do
    export ID=$(jq -r ._id < $i)
    cat $i | tr '\012' ' ' | sed -e "s/ \+/ /g" |  redis-cli -x set mypads:pad:$ID
done
for i in group*
do
    export ID=$(jq -r ._id < $i)
    cat $i | tr '\012' ' ' | sed -e "s/ \+/ /g" |  redis-cli -x set mypads:group:$ID
done

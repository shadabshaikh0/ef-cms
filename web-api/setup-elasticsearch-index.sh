#!/bin/bash -e

# Usage
#   creates the elasticsearch index with configuration

# Requirements
#   - aws cli must be installed on your machine
#   - aws credentials must be setup on your machine
#   - node must be setup on your machine

# Arguments
#   - $1 - the environment [dev, stg, prod, exp1, exp1, etc]

( ! command -v aws > /dev/null ) && echo "aws was not found on your path. Please install aws." && exit 1
( ! command -v node > /dev/null ) && echo "node was not found on your path. Please install node." && exit 1

[ -z "$1" ] && echo "The ENV to deploy to must be provided as the \$1 argument.  An example value of this includes [dev, stg, prod... ]" && exit 1
[ -z "${AWS_ACCESS_KEY_ID}" ] && echo "You must have AWS_ACCESS_KEY_ID set in your environment" && exit 1
[ -z "${AWS_SECRET_ACCESS_KEY}" ] && echo "You must have AWS_SECRET_ACCESS_KEY set in your environment" && exit 1

ENV=$1

pushd ./web-api/terraform/main
  ../bin/deploy-init.sh "${1}"
  ELASTICSEARCH_ENDPOINT_ALPHA="$(terraform output elasticsearch_endpoint_alpha)"
  ELASTICSEARCH_ENDPOINT_BETA="$(terraform output elasticsearch_endpoint_beta)"
popd

ELASTICSEARCH_ENDPOINT_ALPHA="${ELASTICSEARCH_ENDPOINT_ALPHA%\"}"
ELASTICSEARCH_ENDPOINT_ALPHA="${ELASTICSEARCH_ENDPOINT_ALPHA#\"}"

ELASTICSEARCH_ENDPOINT_BETA="${ELASTICSEARCH_ENDPOINT_BETA%\"}"
ELASTICSEARCH_ENDPOINT_BETA="${ELASTICSEARCH_ENDPOINT_BETA#\"}"

node ./web-api/elasticsearch/elasticsearch-index-settings.js "${ELASTICSEARCH_ENDPOINT_ALPHA}"
node ./web-api/elasticsearch/elasticsearch-index-settings.js "${ELASTICSEARCH_ENDPOINT_BETA}"

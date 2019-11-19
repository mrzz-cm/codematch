#!/bin/sh

mongo admin --eval 'db.createUser(
        {
          user: "admin",
          pwd: "password",
          roles: [ 
            { role: "userAdminAnyDatabase", db: "admin" }, 
            "readWriteAnyDatabase"
          ]
        }
      )'
mongo codematch --eval 'db.createUser(
      {
        user: "codematch",
        pwd: "password",
        roles: [ "dbOwner" ]
      }
    )'

# mongorestore --db=codematch --username=codematch --password=password \
#     "$TRAVIS_BUILD_DIR/backend/data/tests/dump/codematch"

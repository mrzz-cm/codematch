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


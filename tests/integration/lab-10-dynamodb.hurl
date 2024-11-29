# tests/integration/lab-10-dynamodb.hurl

# 1. POST a new JSON fragment to http://localhost:8080
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
{ "service": "DynamoDB" }

# Expected Response
HTTP/1.1 201
[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"


# 2. GET the fragment info (i.e., metadata)
GET {{fragment1_url}}/info
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: application/json; charset=utf-8
Content-Length: 259
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == {{fragment1_id}}
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 25


# 3. POST a second Markdown fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1
`DynamoDB is **great**.`

# Expected Response
HTTP/1.1 201
[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.fragment.id"


# 4. GET the second fragment info (i.e., metadata)
GET {{fragment2_url}}/info
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: application/json; charset=utf-8
Content-Length: 256
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == {{fragment2_id}}
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 22


# 5. GET all fragment for the same authorized without expanding
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: application/json; charset=utf-8
[Asserts]
# Assert that the fragments array contains the two ids we captured earlier
jsonpath "$.fragments" includes {{fragment1_id}}
jsonpath "$.fragments" includes {{fragment2_id}}


# 6. DELETE the first fragment
DELETE http://localhost:8080/v1/fragments/{{fragment1_id}}
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200


# 7. GET the first fragment
GET http://localhost:8080/v1/fragments/{{fragment1_id}}
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 404


# 8. GET all of the fragments for the same authorized user without expanding them
# and check if the first fragment is deleted
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
[Asserts]
jsonpath "$.fragments" not includes {{fragment1_id}}
jsonpath "$.fragments" includes {{fragment2_id}}

# tests/integration/a3-update-fragments

# 1. POST a new JSON fragment to http://localhost:8080
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
{ "title": "Hello" }

# Expected Response
HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 20
# Capture the Location URL into a variable named `url`
[Captures]
url: header "Location"


# 2. GET the fragment we just posted by its URL to check existence
GET {{url}}
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: application/json
Content-Length: 20
[Asserts]
jsonpath "$.title" == "Hello"


# 3. Update fragment
PUT {{url}}
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
{ "title": "Hello World" }

# Expected Response
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "application/json"
# Updated length
jsonpath "$.fragment.size" == 26
jsonpath "$.fragment.formats" includes "application/json"
jsonpath "$.fragment.formats" includes "application/yaml"
jsonpath "$.fragment.formats" includes "text/plain"
jsonpath "$.fragment.formats" not includes "text/md"
jsonpath "$.fragment.formats" not includes "text/html"
jsonpath "$.fragment.formats" not includes "image/png"
jsonpath "$.fragment.formats" not includes "image/jpeg"
jsonpath "$.fragment.formats" not includes "image/avif"
jsonpath "$.fragment.formats" not includes "image/gif"


# 4. GET the fragment we just updated and check if fragment data is updated
GET {{url}}
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: application/json
[Asserts]
jsonpath "$.title" == "Hello World"


# 5. GET the fragment info and check if fragment metadata is updated (especially size)
GET {{url}}/info
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: application/json; charset=utf-8
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 26


# 6. Update fragment's type should fail
PUT {{url}}
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`Try to change fragment type`

# Expected Response
HTTP/1.1 400
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 400
jsonpath "$.error.message" == "A fragment's type can not be changed after it is created"





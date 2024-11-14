# tests/integration/post-fragments-json.hurl
# 1. Posting a fragment of json type
# Authenticated POST to /v1/fragments
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
{
  "title": "Hello World", 
  "description": "This is a simple JSON example."
}

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
jsonpath "$.fragment.size" == 80
# Capture the Location URL into a variable named `url`
[Captures]
url: header "Location"


# 2. Try to GET the fragment we just posted by its URL
GET {{url}}
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: application/json
Content-Length: 80
[Asserts]
jsonpath "$.title" == "Hello World"
jsonpath "$.description" == "This is a simple JSON example."

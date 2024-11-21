# tests/integration/lab-9-s3.hurl

# 1. Posting a text fragment to /v1/fragments
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`Hello S3!`

# Expected Response
HTTP/1.1 201
[Captures]
url: header "Location"


# 2. Get the fragment
GET {{url}}
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: text/plain
[Asserts]
body == "Hello S3!"


# 3. Delete the fragment
DELETE {{url}}
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200


# 4. Send a get request to confirm fragment not found
GET {{url}}
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" == "Fragment by id not found"



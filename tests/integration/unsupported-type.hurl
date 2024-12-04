# tests/integration/unsupported-type.hurl
# Authenticated POST to /v1/fragments
POST http://localhost:8080/v1/fragments
# We're sending an un supported type application/xml fragment
Content-Type: application/xml
[BasicAuth]
user1@email.com:password1
```
fragmentSample:
  description: This is a test fragment in XML format
```

# Expected Response
HTTP/1.1 415
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 415
jsonpath "$.error.message" == "Unsupported Content-Type"

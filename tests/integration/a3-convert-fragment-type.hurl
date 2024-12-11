# tests/integration/a3-convert-fragment-type

# 1. Test image conversion
# 1.1. POST a new jpg fragment to http://localhost:8080
POST http://localhost:8080/v1/fragments
Content-Type: image/jpeg
[BasicAuth]
user1@email.com:password1
file,seneca.jpg;

# Expected Response
HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "image/jpeg"
jsonpath "$.fragment.size" == 24544
[Captures]
url: header "Location"


# 1.2. GET the JPEG fragment info
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
jsonpath "$.fragment.type" == "image/jpeg"
jsonpath "$.fragment.size" == 24544


# 1.3. GET the JPEG fragment as PNG
GET {{url}}.png
[BasicAuth]
user1@email.com:password1

# Expected Response for conversion
HTTP/1.1 200
Content-Type: image/png


# 1.4. GET the JPEG fragment as JPEG
GET {{url}}.jpg
[BasicAuth]
user1@email.com:password1

# Expected Response for conversion
HTTP/1.1 200
Content-Type: image/jpeg


# 1.5. GET the JPEG fragment as WEBP
GET {{url}}.webp
[BasicAuth]
user1@email.com:password1

# Expected Response for conversion
HTTP/1.1 200
Content-Type: image/webp


# 1.6. GET the JPEG fragment as avif
GET {{url}}.avif
[BasicAuth]
user1@email.com:password1

# Expected Response for conversion
HTTP/1.1 200
Content-Type: image/avif


# 1.7. GET the JPEG fragment as gif
GET {{url}}.gif
[BasicAuth]
user1@email.com:password1

# Expected Response for conversion
HTTP/1.1 200
Content-Type: image/gif



# 2. Test txt conversion 
# 2.1. POST a txt fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`This is a fragment`

# Expected Response
HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 18
[Captures]
url2: header "Location"


# 2.2. Get txt fragment
GET {{url2}}
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: text/plain
[Asserts]
body == "This is a fragment"


# 2.3 Get the txt fragment as txt fragment
GET {{url2}}.txt
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: text/plain
[Asserts]
body == "This is a fragment"




# 3. Test md conversion 
# 3.1. POST a md fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1
`# Markdown Fragment`

# Expected Response
HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 19
[Captures]
url3: header "Location"


# 3.2. Get md fragment
GET {{url3}}
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: text/markdown
[Asserts]
body == "# Markdown Fragment"


# 3.3 Get the md fragment as .md fragment
GET {{url3}}.md
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: text/markdown
[Asserts]
body == "# Markdown Fragment"


# 3.4 Get the md fragment as .html fragment
GET {{url3}}.html
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: text/html; charset=utf-8
[Asserts]
body contains "<h1>Markdown Fragment</h1>"


# 3.5 Get the md fragment as .txt fragment
GET {{url3}}.txt
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: text/plain; charset=utf-8
[Asserts]
body contains "MARKDOWN FRAGMENT"



# 4. Test html Conversion
# 4.1. POST a text/html fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/html
[BasicAuth]
user1@email.com:password1
`<p>This is HTML</p>`

# Expected Response
HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/html"
jsonpath "$.fragment.size" == 19
[Captures]
url4: header "Location"


# 4.2. GET the text/html fragment
GET {{url4}}
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: text/html
[Asserts]
body == "<p>This is HTML</p>"


# 4.3. GET the text/html fragment as .txt
GET {{url4}}.txt
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: text/plain; charset=utf-8
[Asserts]
body == "This is HTML"


# 4.4. GET the text/html fragment as .html
GET {{url4}}.html
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: text/html
[Asserts]
body == "<p>This is HTML</p>"



# 5. Test text/csv Conversion
# 5.1. POST a text/csv fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/csv
[BasicAuth]
user1@email.com:password1
file,csvtest.csv;

# Expected Response
HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/csv"
jsonpath "$.fragment.size" == 65
[Captures]
url5: header "Location"

# 5.2. Get the csv fragment
GET {{url5}}
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: text/csv
[Asserts]
body contains "Number,Footnote\r\n1,This is footnote one\r\n2,This is footnote two"

# 5.3. GET the text/csv fragment as .csv
GET {{url5}}.csv
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: text/csv
[Asserts]
body contains "Number,Footnote\r\n1,This is footnote one\r\n2,This is footnote two"


# 5.4. GET the text/csv fragment as .txt
GET {{url5}}.txt
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: text/plain
[Asserts]
body contains "Number,Footnote\r\n1,This is footnote one\r\n2,This is footnote two"


# 5.5. GET the text/csv fragment as .json
GET {{url5}}.json
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: application/json; charset=utf-8
[Asserts]
body contains "[{\"Number\":\"1\",\"Footnote\":\"This is footnote one\"},{\"Number\":\"2\",\"Footnote\":\"This is footnote two\"}]"



# 6. Test application/json Conversion
# 6.1. POST an application/json fragment
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
file, jsontest.json;

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
jsonpath "$.fragment.size" == 27
[Captures]
url6: header "Location"


# 6.2. GET the application/json fragment
GET {{url6}}
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: application/json
[Asserts]
jsonpath "$.title" == "Hello World"


# 6.3. GET the application/json fragment as .json
GET {{url6}}
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: application/json
[Asserts]
jsonpath "$.title" == "Hello World"


# 6.4. GET the application/json fragment as .yaml
GET {{url6}}.yaml
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: application/yaml; charset=utf-8
[Asserts]
body contains "title: Hello World"


# 6.5. GET the application/json fragment as .yml
GET {{url6}}.yml
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: application/yaml; charset=utf-8
[Asserts]
body contains "title: Hello World"


# 6.6. GET the application/json fragment as .txt
GET {{url6}}.txt
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: text/plain; charset=utf-8
[Asserts]
body contains "{ \"title\": \"Hello World\" }"



# 7. Test application/yaml Conversion
# 7.1. POST an application/yaml fragment
POST http://localhost:8080/v1/fragments
Content-Type: application/yaml
[BasicAuth]
user1@email.com:password1
file, ymltest.yml;

# Expected Response
HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "application/yaml"
jsonpath "$.fragment.size" == 26
[Captures]
url7: header "Location"


# 7.2. GET the application/yaml fragment
GET {{url7}}
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: application/yaml
[Asserts]
body contains "myName: Zoey\nprogram: BSD"


#7.3. GET the application/yaml fragment as .yaml
GET {{url7}}.yaml
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: application/yaml
[Asserts]
body contains "myName: Zoey\nprogram: BSD"


# 7.4 GET the application/yaml fragment as .txt
GET {{url7}}.txt
[BasicAuth]
user1@email.com:password1

# Expected Response
HTTP/1.1 200
Content-Type: text/plain; charset=utf-8
[Asserts]
body contains "myName: Zoey\nprogram: BSD"

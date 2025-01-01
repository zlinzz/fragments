# Fragments Microservice API Project

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Description](#description)
- [Technologies](#technologies)
- [Setup](#setup)
- [Docker and Docker Compose](#docker-and-docker-compose)
   * [Docker](#docker)
   * [Docker Compose](#docker-compose)
      + [Getting Started](#getting-started)
      + [MinIO as the S3 storage backend (Optional: Second Choice)](#minio-as-the-s3-storage-backend-optional-second-choice)
      + [Accessing Services](#accessing-services)
- [API Usage and Supported Features](#api-usage-and-supported-features)
   * [Routes](#routes)
   * [Valid Fragment Creation Types](#valid-fragment-creation-types)
   * [Valid Fragment Conversions](#valid-fragment-conversions)
   * [Curl Command Examples](#curl-command-examples)
- [Fragments UI Testing Web App](#fragments-ui-testing-web-app)



## Description

A scalable fragments management microservice API that supports creating, retrieving, converting, updating, and deleting fragments in various MIME types (e.g., text/plain, application/json, image/png). The API securely authenticates users via AWS Cognito, ensuring only authorized access to the fragments. A CI/CD pipeline is implemented using GitHub Actions to automate linting, testing, building and pushing Docker images, and deploying to AWS ECS with the pre-built ECR Docker image. The project also leveraged AWS services such as DynamoDB for fragment metadata, S3 for fragment data content, and CloudWatch for monitoring and logging.



## Technologies

- **Backend Framework & Language:** JavaScript, Express.js
- **Authentication & Security:** AWS Cognito, Passport, Helmet
- **Database & Storage:** AWS DynamoDB, AWS S3, In-Memory Storage (fallback to in-memory storage if environment variables are not provided)
- **Containerization, Deployment & Orchestration:** Docker, Docker Hub, AWS ECR, AWS ECS
- **CI/CD:** GitHub Actions
- **Testing:** Jest, Supertest, Hurl
- **Other Utilities:** dotenv, sharp, markdown-it, pino, eslint, etc.



## Setup

1. **Clone the repository**  
   Navigate to the directory where you want to clone the repository, then run:
   ```bash
   git clone https://github.com/zlinzz/fragments.git
   ```
2. **Navigate to the fragments directory**
   ```bash
   cd fragments
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Add environment files**  
   Ensure you have the required environment variables set up. Create `.env` and any necessary configuration files (e.g., .htpasswd) as needed.
   > **Note:** You can edit the .htpasswd file to set your own username and password for HTTP Basic Auth. This will allow you to customize the authentication credentials for your development environment.
      
   - Example 1 - use In-Memory Storage & HTTP Basic Auth strategy:
     - PORT, LOG_LEVEL, HTPASSWD_FILE
   - Example 2 - run in production-like env, use AWS DynamoDB and S3 & AWS Cognito Auth (follow step 8):
     - PORT, LOG_LEVEL
     - AWS_COGNITO_POOL_ID, AWS_COGNITO_CLIENT_ID, API_URL, AWS_REGION
     - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN
5. **Start the development server**
   ```bash
   npm start
   ```
6. **Run unit tests**
   ```bash
   npm run test
   ```
7. **Run integration tests**
   ```bash
   npm run test:integration
   ```
8. **Run the application in a production-like environment**  
   To run the application with Docker containers, follow the instructions in the ,[Docker and Docker Compose](#docker-and-docker-compose) section.



## Docker and Docker Compose

### Docker

This project includes a Docker image available on Docker Hub that you can pull and run easily. Follow these steps to get started:

1. Pull the Docker image from Docker Hub:
   ```bash
   docker pull zlinzz/fragments:latest
   ```
2. Use your own `.env` file (refer to step 4 example 1 in the [Setup](#setup) section for guidance) and run:
   ```bash
   docker run --env-file .env -p 8080:8080 zlinzz/fragments:latest
   ```
   Or use the provided `env.jest` file:
   ```bash
   docker run --env-file env.jest -e LOG_LEVEL=debug -p 8080:8080 zlinzz/fragments:latest
   ```
3. You are now ready to send requests! Refer to the [Curl Command Examples](#curl-command-examples) section for guidance.
4. To stop the container:
   ```bash
   docker ps
   docker kill <id>
   ```


### Docker Compose

This project includes a multi-container setup managed by **Docker Compose**. The setup allows for a full functional-offline and testing environment with separate containers for each service using `docker-compose.yml` or `docker-compose.local.yml`.

#### Getting Started

Use the `docker-compose.yml` file to set up the environment with DynamoDB local as the DynamoDB backend and LocalStack as the S3 backend.

1. Start the containers by running:
   ```bash
   docker compose up
   ```
   > **Note:** if you make changes to your fragments source code, and want to rebuild your Docker image, you can use the --build flag to force a rebuild: docker compose up --build.
   > You should see log messages from all three services: `fragments`, `dynamodb-local`, and `localstack`.
2. Make sure you can access all three services:
   ```sh
   $ curl localhost:8080
   {"status":"ok","author":"David Humphrey <david.humphrey@senecapolytechnic.ca>","githubUrl":"https://github.com/humphd/fragments","version":"0.8.0"}

   $ curl localhost:8000
   {"__type":"com.amazonaws.dynamodb.v20120810#MissingAuthenticationToken","Message":"Request must contain either a valid (registered) AWS access key ID or X.509 certificate."}

   $ curl localhost:4566/_localstack/health
   {"services": {"acm": "available", "apigateway": "available", "cloudformation": "available", "cloudwatch": "available", "config": "available", "dynamodb": "available", "dynamodbstreams": "available", "ec2": "available", "es": "available", "events": "available", "firehose": "available", "iam": "available", "kinesis": "available", "kms": "available", "lambda": "available", "logs": "available", "opensearch": "available", "redshift": "available", "resource-groups": "available", "resourcegroupstaggingapi": "available", "route53": "available", "route53resolver": "available", "s3": "available", "s3control": "available", "secretsmanager": "available", "ses": "available", "sns": "available", "sqs": "available", "ssm": "available", "stepfunctions": "available", "sts": "available", "support": "available", "swf": "available", "transcribe": "available"}, "version": "2.0.0.dev"}
   ```
   > **Note:**: use `localhost:4566/_localstack/health` route for accessing LocalStack healthcheck endpoint.
3. Install the [AWS cli](https://aws.amazon.com/cli/), which we'll use in the next step to run commands against the local AWS services.
4. Make the `local-aws-setup.sh` script executable and try running it. It should be able to create the S3 Bucket and DynamoDB Table:
   ```sh
   $ chmod +x ./scripts/local-aws-setup.sh
   $ docker compose up -d
   $ ./scripts/local-aws-setup.sh
   Setting AWS environment variables for LocalStack
   AWS_ACCESS_KEY_ID=test
   AWS_SECRET_ACCESS_KEY=test
   AWS_SESSION_TOKEN=test
   AWS_DEFAULT_REGION=us-east-1
   Waiting for LocalStack S3...
   LocalStack S3 Ready
   Creating LocalStack S3 bucket: fragments
   {
    "Location": "/fragments"
   }
   Creating DynamoDB-Local DynamoDB table: fragments
   {
    "TableDescription": {
        "AttributeDefinitions": [
            {
                "AttributeName": "ownerId",
                "AttributeType": "S"
            },
            {
                "AttributeName": "id",
                "AttributeType": "S"
            }
        ],
        "TableName": "fragments",
        "KeySchema": [
            {
                "AttributeName": "ownerId",
                "KeyType": "HASH"
            },
            {
                "AttributeName": "id",
                "KeyType": "RANGE"
            }
        ],
        "TableStatus": "ACTIVE",
        "CreationDateTime": "2022-03-22T11:13:15.952000-04:00",
        "ProvisionedThroughput": {
            "LastIncreaseDateTime": "1969-12-31T19:00:00-05:00",
            "LastDecreaseDateTime": "1969-12-31T19:00:00-05:00",
            "NumberOfDecreasesToday": 0,
            "ReadCapacityUnits": 10,
            "WriteCapacityUnits": 5
        },
        "TableSizeBytes": 0,
        "ItemCount": 0,
        "TableArn": "arn:aws:dynamodb:ddblocal:000000000000:table/fragments"
    }
   }
   ```
5. Now, you are good to send requests!
   You can use curl or any HTTP client to interact with the services running locally. For example, to create a fragment using curl:
   ```bash
   curl -i -X POST -u fakeuser@email.com:fakepassword -H "Content-Type: text/plain" -d "This is a fragment" http://localhost:8080/v1/fragments
   ```
6. To exit, run:
   ```bash
   docker compose down
   ```

#### MinIO as the S3 storage backend (Optional: Second Choice)

Use the `docker-compose.local.yml` file to set up the environment with MinIO as the S3 storage backend.

1. Start your containers:
   ```sh
   cd fragments
   docker compose -f docker-compose.local.yml up -d
   ```
   > **Note:** We are using a different filename for our `docker-compose.yml`, so we indicate that with the `-f` flag.
2. Log in to the [MinIO](https://min.io) console (similar to the AWS S3 Console) by going to <http://localhost:9001>, and using the `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` values you entered above.
3. Create a new bucket by clicking the **Create Bucket** button.
4. Choose a name for your bucket, for example `fragments` (which we set as the default in `docker-compose.local.yml` above) and click **Create Bucket**.
5. Add a file to your bucket by clicking the **Upload** button and choosing a file to upload.
6. Look at the `minio/data` directory on your host, and you should see a new folder with the same name as the bucket you just created, and the file you uploaded. Anything you put in this bucket will get stored in this location (i.e., outside of the container).
7. Add the `minio/` directory to your `.gitignore` file.
8. Stop your containers
```sh
docker compose -f docker-compose.local.yml down
```
9. Restart your containers:
```sh
docker compose -f docker-compose.local.yml up -d
```
10. Log in to the MinIO Console at <http://localhost:9001> using the same username and password as before, and confirm that the bucket and object are still there.
    You can now use S3 locally and have your data survive starting/stopping the containers. This is an ideal setup for local development, since you also get a console for viewing your data.

#### Accessing Services

- **Fragments API:** `http://localhost:8080`
- **DynamoDB Local Console:** `http://localhost:8000`
- **LocalStack Healthcheck:** `http://localhost:4566/_localstack/health`
  - Use this URL to check the status of the LocalStack services.
- **MinIO:**
  - **API Console:** `http://localhost:9000`
  - **Web Console:** `http://localhost:9001` (for managing MinIO buckets and objects in web UI)



## API Usage and Supported Features

### Routes

| **Route**                | **Method** | **Description**                                                                                                                                                               |
| ------------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                      | GET        | Health check route to confirm the API is running.                                                                                                                             |
| `v1/fragments`           | POST       | Creates a new fragment with the provided fragment data in request `body` and fragment type in `Content-Type`.                                                                 |
| `v1/fragments`           | GET        | Retrieves all fragments belonging to the current user (i.e., authenticated user). The response includes a fragments array of ids.                                             |
| `v1/fragments/?expand=1` | GET        | Retrieves all fragments belonging to the current user (i.e., authenticated user), expanded to include a full representation of the fragments' metadata (i.e., not just `id`). |
| `v1/fragments/:id`       | GET        | Gets an authenticated user's fragment data (i.e., raw binary data) with the given `id`.                                                                                       |
| `v1/fragments/:id.ext`   | GET        | Converts the fragment data to the type associated with the extension (`ext` refers to the extension, e.g., `.txt` or `.png`).                                                      |
| `v1/fragments/:id`       | PUT        | Updates the data for the authenticated user's existing fragment with the specified `id` (`Content-Type` should be the same).                                                 |
| `v1/fragments/:id/info`  | GET        | Gets the metadata for one of the authenticated user's existing fragments with the specified `id`.                                                                             |
| `v1/fragments/:id`       | DELETE     | Deletes one of the authenticated user's existing fragments with the given `id`.                                                                                               |

> **Note:** routes starting with `/v1` require user authentication.


### Valid Fragment Creation Types

The API supports creating fragments in the following MIME types:

- `text/plain`
- `text/plain; charset=utf-8`
- `text/markdown`
- `text/html`
- `text/csv`
- `application/json`
- `application/yaml`
- `image/png`
- `image/jpeg`
- `image/webp`
- `image/avif`
- `image/gif`
> **Note:** we store the entire Content-Type (i.e., with the charset if present), but also allow using only the media type prefix (e.g., text/html vs. text/html; charset=iso-8859-1).


### Valid Fragment Conversions

This is the current list of valid conversions for each fragment type (others may be added in the future):

| Type               | Valid Conversion Extensions              |
| ------------------ | ---------------------------------------- |
| `text/plain`       | `.txt`                                   |
| `text/markdown`    | `.md`, `.html`, `.txt`                   |
| `text/html`        | `.html`, `.txt`                          |
| `text/csv`         | `.csv`, `.txt`, `.json`                  |
| `application/json` | `.json`, `.yaml`, `.yml`, `.txt`         |
| `application/yaml` | `.yaml`, `.txt`                          |
| `image/png`        | `.png`, `.jpg`, `.webp`, `.gif`, `.avif` |
| `image/jpeg`       | `.png`, `.jpg`, `.webp`, `.gif`, `.avif` |
| `image/webp`       | `.png`, `.jpg`, `.webp`, `.gif`, `.avif` |
| `image/avif`       | `.png`, `.jpg`, `.webp`, `.gif`, `.avif` |
| `image/gif`        | `.png`, `.jpg`, `.webp`, `.gif`, `.avif` |


### Curl Command Examples

1. To create a new txt/plain fragment (POST v1/fragments):
   ```bash
   curl -i -X POST -u fakeuser@email.com:fakepassword -H "Content-Type: text/plain" -d "This is a fragment" http(s)://fragments-api.com/v1/fragments
   ```
2. To POST a binary file using `--data-binary <filename>` (POST v1/fragments):
   ```bash
   curl -i -X POST -u fakeuser@email.com:fakepassword -H "Content-Type: image/png" --data-binary @filepath http(s)://fragments-api.com/v1/fragments
   ```
3. To retrieve all fragments (GET v1/fragments):
   ```bash
   curl -i -u fakeuser@email.com:fakepassword http(s)://fragments-api.com/v1/fragments
   ```
4. To retrieve all fragments expanded (GET v1/fragments/?expand=1):
   ```bash
   curl -i -u fakeuser@email.com:fakepassword http(s)://fragments-api.com/v1/fragments?expand=1
   ```
5. To retrieve a specific fragment with id (GET v1/fragments/:id):
   ```bash
   curl -i -u fakeuser@email.com:fakepassword http(s)://fragments-api.com/v1/fragments/<id>
   ```
6. To retrieve and store a fragment's data in local (GET v1/fragments/:id):
   ```bash
   curl -u fakeuser@email.com:fakepassword -o filepath http(s)://fragments-api.com/v1/fragments/<id>
   ```
   > **Note:** When you get and store image, don't include -i, which will include response headers in the output and the stored file will not be the the same binary.
7. To convert a fragment to html type (GET v1/fragments/:id.ext):
   ```bash
   curl -i -u fakeuser@email.com:fakepassword http(s)://fragments-api.com/v1/fragments/<id>.html
   ```
8. To update a text/plain fragment's data with id (PUT v1/fragments/:id):
   ```bash
   curl -i -X PUT -u fakeuser@email.com:fakepassword -H "Content-Type: text/plain" -d "This is updated data" http(s)://fragments-api.com/v1/fragments/<id>
   ```
9. To get a fragment's metadata with id (GET v1/fragments/:id/info):
   ```bash
   curl -i -u fakeuser@email.com:fakepassword http(s)://fragments-api.com/v1/fragments/<id>.info
   ```
10. To delete a specific fragment with id (DELETE v1/fragments/:id)
   ```bash
   curl -i -X DELETE -u fakeuser@email.com:fakepassword http(s)://fragments-api.com/v1/fragments/<id>
   ```



## Fragments UI Testing Web App

You can find the UI testing repository for the API's front-end on: https://github.com/zlinzz/fragments-ui

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Installation
` npm install or yarn `


## Requirements
* NodeJS installed
* Identity Pool and User Pool already set up
* create a file in src/config/ named aws-config.json
* Fulfill the identityPoolId, userPoolId and region
* Run ` npm start or yarn start `

## Considerations
I recommend to previous sign up two users, and associate them with two different groups.
E.g: User 1 belongs to Group 1 that has access to bucket 1 only. Similarly, User 2 belongs Group 2 and can access Bucket 2.

Note: If an user is not associated with any group, it will inherit the default role defined in "Authenticated role" in Cognito Identity Pool.


## Test     
Sign with user 1 and try accessing Bucket 1, it should list the objects. In contrast, it should deny access to Bucket 2. Likewise, User 2 should have access to Group 2 and not Bucket 1
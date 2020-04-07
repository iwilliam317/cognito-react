import React, { Component } from 'react';
import './App.css';
import { Auth } from "aws-amplify";
import aws from 'aws-sdk'
import axios from 'axios'
import config from './config/aws-config.json'

class App extends Component {
  state = {
    username: '',
    password: '',
    bucket: '',
    user: {},
    files: [],
    error: {
      message: null,
      code: null,
      name: null
    },
    isAuthenticated: false,
  }

  handleChange = event => {
    this.setState({ [event.target.id]: event.target.value })
  }

  clearState = () => {
    this.setState({
      ...this.state, error: {
        message: null,
        code: null,
        name: null
      },
      files: [],
      apiGatewayResponse: ''
    })
  }

  signIn = async event => {
    event.preventDefault()
    this.clearState()
    try {
      const { username, password } = this.state
      const user = await Auth.signIn(username, password)
      const { accessKeyId, secretAccessKey, sessionToken, ...rest } = await Auth.currentCredentials()
      console.log(rest)

      this.setState({ ...this.state, isAuthenticated: true, user: user.attributes, accessKeyId, secretAccessKey, sessionToken })

    } catch (error) {
      this.setState({ ...this.state, error })
    }

  }

  signOut = async event => {
    event.preventDefault();
    try {
      Auth.signOut();
      this.setState({ ...this.state, isAuthenticated: false, user: {} })
    } catch (error) {
      this.setState({ ...this.state, error })
    }
  }

  listObjects = async event => {
    event.preventDefault()
    this.clearState()

    const { accessKeyId, secretAccessKey, sessionToken } = this.state
    const s3 = new aws.S3({ accessKeyId, sessionToken, secretAccessKey })
    const { bucket: Bucket } = this.state
    const params = {
      Bucket
    };

    try {
      const data = await s3.listObjects(params).promise()
      const files = data.Contents
      this.setState({ ...this.state, files })

    } catch (error) {
      this.setState({ ...this.state, error })
    }
  }

  checkCurrentSession = async () => {

    try {
      const isSession = await Auth.currentSession()
      if (isSession) {
        const { accessKeyId, secretAccessKey, sessionToken } = await Auth.currentCredentials()
        const user = await Auth.currentUserInfo()
        console.log(user)
        this.setState({ ...this.state, isAuthenticated: true, accessKeyId, secretAccessKey, sessionToken, user: user.attributes, username: user.username })
      }

    } catch (error) {
      this.setState({ ...this.state, error })
    }

  }

  checkApiCognitoAuthorizer = async event => {
    event.preventDefault()
    try {
      const { username } = this.state
      const hashToken = config.api.HASH_ID_TOKEN
      const token = localStorage.getItem(`${hashToken}.${username}.idToken`)
      const key = config.api.KEY

      if (token && key) {
        const url = 'https://my-api.obanw.myinstance.com/v1/testquotaandcognito'
        const headers = {"x-cognito-token": token, "x-api-key": key}
        const response = await axios.get(url, { headers })
        this.setState({ ...this.state, apiGatewayResponse: JSON.stringify(response.data) })

      }
    } catch (error) {
      console.log(error)
      this.setState({ ...this.state, error })
    }
  }
  componentDidMount() {
    this.checkCurrentSession()
  }

  render() {
    const { handleChange, signIn, listObjects, signOut, checkApiCognitoAuthorizer } = this
    const { username, password, isAuthenticated, bucket, error, user, files, apiGatewayResponse } = this.state
    return (
      <div className="App">
        <header className="App-header">

          {!isAuthenticated ?
            (
              <form onSubmit={signIn}>
                <h1>Cognito - React </h1>
                <div>
                  <label>Email/Username: </label>
                  <input id='username' onChange={handleChange} value={username}></input>
                </div>
                <div>
                  <label>Password: </label>
                  <input id='password' type='password' onChange={handleChange} value={password}></input>
                </div>
                <button>Sign in</button>

              </form>
            ) :
            (
              <>
                <h1>Hello <strong>{user.email}</strong></h1>
                <div>
                  <label>S3 Bucket: </label>
                  <input id='bucket' value={bucket} onChange={handleChange} />
                  <button onClick={listObjects}>List Files</button>
                  <button onClick={checkApiCognitoAuthorizer}>Test Api Gateway</button>
                  <button onClick={signOut}>Sign Out</button>
                </div>
                <div>
                  <ul>
                    {files.map((file, index) => (<li key={index}>{file.Key}</li>))}

                  </ul>
                </div>
                <div>
                  {apiGatewayResponse}
                </div>
              </>
            )}
          <div>
            {error.message}
          </div>
        </header>
      </div>
    );
  }
}

export default App;

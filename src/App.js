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
    apiGatewayResponse: '',
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
      error: {
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

      this.setState({ isAuthenticated: true, user: user.attributes, accessKeyId, secretAccessKey, sessionToken })

    } catch (error) {
      this.setState({ error })
    }

  }

  signOut = async event => {
    event.preventDefault();
    try {
      Auth.signOut();
      this.setState({ isAuthenticated: false, user: {}, password: '' })
    } catch (error) {
      this.setState({ error })
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
      this.setState({ files })

    } catch (error) {
      this.setState({ error })
    }
  }

  checkCurrentSession = async () => {

    try {
      const session = await Auth.currentSession()
      if (session) {
        const { accessKeyId, secretAccessKey, sessionToken } = await Auth.currentCredentials()
        const user = await Auth.currentUserInfo()
        const idToken = session.getIdToken().getJwtToken()
        this.setState({ isAuthenticated: true, accessKeyId, secretAccessKey, sessionToken, user: user.attributes, username: user.username, idToken })
      }

    } catch (error) {
      this.setState({ error })
    }

  }

  checkApiCognitoAuthorizer = async event => {
    event.preventDefault()
    this.clearState()
    try {
      const { idToken } = this.state
      const { KEY: key, URL: url } = config.api

      if (idToken && key) {
        const headers = { "authorization": idToken, "x-api-key": key }

        // POST
        const data = { "message": "hello world" }
        const config = { headers }
        const response = await axios.post(url, data, config)

        // GET
        // const params = { "message": "hello world" }
        // const config = { headers, params }
        // const response = await axios.get(url, config)

        this.setState({ apiGatewayResponse: JSON.stringify(response.data) })

      }
    } catch (error) {
      console.log(error)
      this.setState({ error })
    }
  }
  componentDidMount() {
    console.log('step componentDidMount')
    this.checkCurrentSession()
  }

  render() {
    console.log('step render')
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

                  <input id='username' onChange={handleChange} value={username} placeholder='type your email/username'></input>
                </div>
                <div>

                  <input id='password' type='password' onChange={handleChange} value={password} placeholder='type your password'></input>
                </div>
                <button>Sign in</button>

              </form>
            ) :
            (
              <>
                <h1>Hello <strong>{username}</strong></h1> <button onClick={signOut}>Sign Out</button>
                <div id='div-s3'>
                  <h3>S3</h3>
                  <input id='bucket' value={bucket} onChange={handleChange} placeholder='Type the bucket name' />
                  <button onClick={listObjects}>List Files</button>


                  <div>
                    <ul>
                      {files.map((file, index) => (<li key={index}>{file.Key}</li>))}

                    </ul>
                  </div>
                </div>
                <div id='div-api-gateway'>
                  <h3>Api Gateway</h3>
                  <button onClick={checkApiCognitoAuthorizer}>Test Api Gateway</button>
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

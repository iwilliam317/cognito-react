import React, { Component } from 'react';
import './App.css';
import { Auth } from "aws-amplify";
import aws from 'aws-sdk'

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
      files: []
    })
  }

  signIn = async event => {
    event.preventDefault()
    this.clearState()

    try {
      const { username, password } = this.state
      const user = await Auth.signIn(username, password)
      const { accessKeyId, secretAccessKey, sessionToken } = await Auth.currentCredentials()

      this.setState({ ...this.state, isAuthenticated: true, user: user.attributes, accessKeyId, secretAccessKey, sessionToken })

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

        this.setState({ ...this.state, isAuthenticated: true, accessKeyId, secretAccessKey, sessionToken, user: user.attributes })
      }

    } catch (error) {
      this.setState({ ...this.state, error })
    }

  }
  componentDidMount() {
    this.checkCurrentSession()
  }

  render() {
    const { handleChange, signIn, listObjects } = this
    const { username, password, isAuthenticated, bucket, error, user, files } = this.state
    return (
      <div className="App">
        <header className="App-header">
          {!isAuthenticated ?
            (
              <form onSubmit={signIn}>
                <input id='username' onChange={handleChange} value={username}></input>
                <input id='password' type='password' onChange={handleChange} value={password}></input>
                <button>Sign in</button>

              </form>
            ) :
            (
              <>
                <h1>Hello <strong>{user.email}</strong>  </h1>
                <input id='bucket' value={bucket} onChange={handleChange} />
                <button onClick={listObjects}>List Files in S3</button>

                <div>
                  <ul>
                    {files.map((file, index) => (<li key={index}>{file.Key}</li>))}

                  </ul>
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

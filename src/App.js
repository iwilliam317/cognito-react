import React, { Component } from 'react';
import './App.css';
import { Auth } from "aws-amplify";

class App extends Component {
  state = {
    username: '',
    password: '',
    bucket: '',
    user: {},
    error: {
      message: null,
      code: null,
      name: null
    },
    isUserLogged: false
  }

  handleChange = event => {
    this.setState({ [event.target.id]: event.target.value })
  }

  signIn = async event => {
    event.preventDefault()

    try {
      const { username, password } = this.state
      const user = await Auth.signIn(username, password)
      const credentials = await Auth.currentCredentials()
      console.log(credentials)
      this.setState({ ...this.state, isUserLogged: true, user: user.attributes })
      console.log(user)
    } catch (error) {
      this.setState({...this.state, error})
    }

  }

  listObjects = async () => {
    // const s3 = new aws.S3()
    const { bucket: Bucket } = this.state
    var params = {
      Bucket
    };
    console.log(params)


    // s3.listObjects(params, function (err, data) {
      // if (err) logMessage(err.message);
      // else {
      //   data.Contents.forEach(element => {
      //     console.log(element.Key);
      //   });

      // }


    // })
  }

  render() {
    const { handleChange, signIn, listObjects } = this
    const { username, password, isUserLogged, bucket } = this.state
    return (
      <div className="App">
        <header className="App-header">
          {!isUserLogged ?
            (
              <form onSubmit={signIn}>
                <input id='username' onChange={handleChange} value={username}></input>
                <input id='password' type='password' onChange={handleChange} value={password}></input>
                <button>Sign in</button>
                <div>
                  {this.state.error.message}
                </div>
              </form>
            ) :
            (
              <>
                <p>User Logged {this.state.user.email}</p>
                <input id='bucket' value={bucket} onChange={handleChange} />
                <button onClick={listObjects}>List Files in S3</button>
              </>
            )}
        </header>
      </div>
    );
  }
}


export default App;

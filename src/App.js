import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { database, auth } from "./Firebase.js";
import { ref, push, set, onChildAdded } from "firebase/database";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
} from "firebase/auth";
import MapFeed from "./Components/MapFeed.js";
import Post from "./Components/Post.js";
import LoginForm from "./Components/LoginForm.js";
import NavBar from "./Components/NavBar.js";
import PostForm from "./Components/PostForm.jsx";
import FriendFinder from "./Components/FriendFinder.js";
import FriendManager from "./Components/FriendManager.js";
import PasswordReset from "./Components/PasswordReset.js";
import "./App.css";
import Filter from "./Components/Filter.js";
import AvatarPicker from "./Components/AvatarPicker.js";
import Help from "./Components/Help.js";

export const UserContext = React.createContext({ email: null });
export const USERS_DATABASE_KEY = "users";

function App() {
  const navigate = useNavigate();
  const currentRoute = useLocation();
  const [user, setUser] = useState({});
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [filterStatus, setFilterStatus] = useState(false);
  const [userFilterAnimalVal, setUserFilterAnimalVal] = useState("");
  const [userFilterEncounterVal, setUserFilterEncounterVal] = useState("");
  const [userFilterDateVal, setUserFilterDateVal] = useState("");
  useEffect(() => {
    if (!user.email) {
      navigate("/login-signup");
    } else if (currentRoute.pathname === "/help") {
      return;
    } else {
      navigate("/");
    }
  }, [user.email]);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser({ email: null });
      }
    });
  }, []);

  useEffect(() => {
    const usersRef = ref(database, USERS_DATABASE_KEY);
    onChildAdded(usersRef, (data) => {
      if (user.email === data.val().email) {
        let userToUpdate = { ...user };
        userToUpdate.userDatabaseKey = data.key;
        setUser(userToUpdate);
      }
    });
  }, [user.email]);

  const handleLoginInput = (name, value) => {
    if (name === "email") {
      setEmailInput(value);
    } else if (name === "password") {
      setPasswordInput(value);
    }
  };

  const signIn = () => {
    signInWithEmailAndPassword(auth, emailInput, passwordInput)
      .then(() => setDefaultAvatar())
      .then(() => {
        navigate("/");
      })
      .catch((error) => {
        showAlert(error);
      });
  };

  const signUp = () => {
    createUserWithEmailAndPassword(auth, emailInput, passwordInput)
      .then((userCredential) => {
        if (userCredential) {
          addUserToDatabase(userCredential.user);
        }
      })
      .then(() => setDefaultAvatar())
      .then(() => {
        navigate("../help");
      })
      .catch((error) => {
        showAlert(error);
      });
  };

  const addUserToDatabase = (user) => {
    const usersListRef = ref(database, USERS_DATABASE_KEY);
    const newUserRef = push(usersListRef);
    set(newUserRef, {
      uid: user.uid,
      email: user.email,
      avatar:
        "https://firebasestorage.googleapis.com/v0/b/animap-2deae.appspot.com/o/profiles%2Fbear-profile-green.png?alt=media&token=65716337-7289-4f92-9409-32a11c43e666",
      requestsReceived: { userKey: { email: "", status: null } },
      requestsSent: { userKey: { email: "", status: null } },
      friends: { userKey: { email: "", status: null } },
    });
  };

  const setDefaultAvatar = () => {
    if (auth.currentUser && !auth.currentUser.photoURL) {
      updateProfile(auth.currentUser, {
        photoURL:
          "https://firebasestorage.googleapis.com/v0/b/animap-2deae.appspot.com/o/profiles%2Fbear-profile-green.png?alt=media&token=65716337-7289-4f92-9409-32a11c43e666",
      });
    }
  };

  const signOutUser = () => {
    signOut(auth).catch((error) => {
      showAlert(error);
    });
  };

  const showAlert = (error) => {
    const errorCode = error.code;
    const errorMessage = errorCode.split("/")[1].replaceAll("-", " ");
    alert(`Wait a minute... an error occurred: ${errorMessage}`);
  };

  const handleResetFromFilter = (boolean) => {
    setFilterStatus(boolean);
  };

  const handleDataFromFilter = (
    filterAnimalVal,
    filterEncounterVal,
    filterDateVal
  ) => {
    setUserFilterAnimalVal(filterAnimalVal);
    setUserFilterEncounterVal(filterEncounterVal);
    setUserFilterDateVal(filterDateVal);
    setFilterStatus(true);
  };

  return (
    <div className="App">
      <header className="App-header">
        <UserContext.Provider value={user}>
          <NavBar signOutUser={signOutUser} />
          <Routes>
            <Route
              path="/"
              element={
                <MapFeed
                  userFilterAnimalVal={userFilterAnimalVal}
                  userFilterEncounterVal={userFilterEncounterVal}
                  userFilterDateVal={userFilterDateVal}
                  filterStatus={filterStatus}
                />
              }
            >
              <Route
                path="login-signup"
                element={
                  <LoginForm
                    onChange={handleLoginInput}
                    email={emailInput}
                    password={passwordInput}
                    login={signIn}
                    signup={signUp}
                  />
                }
              />
              <Route path="post-form" element={<PostForm />} />
              <Route path="posts/:postId" element={<Post />} />
              <Route
                path="q"
                element={
                  <Filter
                    handleDataFromFilter={handleDataFromFilter}
                    handleResetFromFilter={handleResetFromFilter}
                  />
                }
              />
              <Route path="friend-finder" element={<FriendFinder />} />
              <Route path="friend-manager" element={<FriendManager />} />
              <Route path="choose-avatar" element={<AvatarPicker />} />
              <Route path="reset-password" element={<PasswordReset />} />
              <Route path="help" element={<Help />} />
            </Route>
          </Routes>
        </UserContext.Provider>
      </header>
    </div>
  );
}

export default App;

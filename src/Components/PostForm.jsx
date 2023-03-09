import React, { useState } from "react";
import { database, storage } from "../Firebase";
import { ref as databaseRef, push, set } from "firebase/database";
import {
  ref as storageRef,
  getDownloadURL,
  uploadBytes,
} from "firebase/storage";

// This function allows user to post sightings with the input description, upload photo and the type of encounter.
const POSTS_DATABASE_KEY = "posts";
const POSTS_IMAGES_FOLDER_NAME = "images";

export default function PostForm(props) {
  const [userMessage, setUserMessage] = useState("");
  const [userInputFile, setUserInputFile] = useState("");
  const [userFileInputValue, setUserFileInputValue] = useState("");
  const [lon, setLon] = useState(0);
  const [lat, setLat] = useState(0);

  // writing data into our database
  const writeData = (url) => {
    // insert date into our post
    const postDate = new Date().toLocaleString();
    // ref to direct posts into database
    const postsListRef = databaseRef(database, POSTS_DATABASE_KEY);
    const newPostRef = push(postsListRef);
    set(newPostRef, {
      content: userMessage,
      date: postDate,
      url: url,
      location: { lon: lon, lat: lat },
    });
  };
  // reset the post form
  const resetPostForm = () => {
    setUserInputFile(null);
    setUserFileInputValue("");
    setUserMessage("");
  };

  //submit will store the images and execute write data
  const handleSubmit = (e) => {
    e.preventDefault();

    const fileRef = storageRef(
      storage,
      `${POSTS_IMAGES_FOLDER_NAME}/${userInputFile.name}`
    );
    uploadBytes(fileRef, userInputFile)
      .then(() => getDownloadURL(fileRef).then((url) => writeData(url)))
      .then(resetPostForm);
  };

  // every map pin will call this function to send lon and lat to the postform
  const getLocationFromMap = (lon, lat) => {
    setLon(lon);
    setLat(lat);
  };

  // type of encounter: :) or :(
  const goodEncounter = <button>{`🙂`}</button>;
  const badEncounter = <button>{`🙁`}</button>;

  // [If implemented] public or friends-only
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
        ></input>
        <br />
        <div>
          {goodEncounter} {badEncounter}
        </div>
        <br />
        <input
          type="file"
          name="userFileInputValue"
          value={userFileInputValue}
          onChange={(e) => {
            setUserInputFile(e.target.files[0]);
            setUserFileInputValue(e.target.value);
          }}
        />
        <input type="submit" value="submit" name="submit" />
      </form>
    </div>
  );
}

import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "../Firebase.js";
import { USERS_DATABASE_KEY } from "../App.js";
import { onChildAdded, ref, set, update } from "firebase/database";
import { UserContext } from "../App.js";
import { Modal, CloseButton, Button } from "react-bootstrap";

export default function FriendManager(props) {
  const user = useContext(UserContext);
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const usersRef = ref(database, USERS_DATABASE_KEY);
    onChildAdded(usersRef, (userData) => {
      if (userData.val().email === user.email) {
        setRequests(userData.val().requestsReceived);
        setFriends(userData.val().friends);
      }
    });
  }, [user.email]);

  const handleAccept = (e) => {
    updateRequestReceived(e);
    updateFriends(e);
  };

  const updateRequestReceived = (e) => {
    // const updatedRequest = {};
    // update[
    //   `${USERS_DATABASE_KEY}/${props.userDatabaseKey}/requestsReceived/${e.target.id}`
    // ] = { email: requests[e.target.id].email, status: true };
    // update(ref(database), updatedRequest);
    const requestRef = ref(
      database,
      `${USERS_DATABASE_KEY}/${props.userDatabaseKey}/requestsReceived/${e.target.id}`
    );
    update(requestRef, { email: requests[e.target.id].email, status: true });
  };

  const updateFriends = (e) => {
    const receiverNewFriendRef = ref(
      database,
      `${USERS_DATABASE_KEY}/${props.userDatabaseKey}/friends/${e.target.id}`
    );
    set(receiverNewFriendRef, { email: requests[e.target.id].email });

    const requestorNewFriendRef = ref(
      database,
      `${USERS_DATABASE_KEY}/${e.target.id}/friends/${props.userDatabaseKey}`
    );
    set(requestorNewFriendRef, { email: user.email });
  };

  const renderPendingRequests = () => {
    const requestsRender = [];
    for (const key in requests) {
      if (requests[key].status === false) {
        requestsRender.push(
          <div key={key}>
            {requests[key].email}
            <Button id={key} onClick={handleAccept}>
              Accept
            </Button>
            <Button id={key}>Reject</Button>
          </div>
        );
      }
    }
    return requestsRender;
  };

  const renderMyFriends = () => {
    if (Object.values(friends).length > 1) {
      return Object.values(friends).map((friend) => (
        <div key={friend.email}>{friend.email}</div>
      ));
    } else {
      return <div>You don't have any friends yet!</div>;
    }
  };

  const navigate = useNavigate();
  return (
    <Modal show={true}>
      <Modal.Header>
        <Modal.Title>FRIEND REQUESTS</Modal.Title>
        <CloseButton onClick={() => navigate("/")} />
      </Modal.Header>
      <Modal.Body>
        <div id="friend-requests-container">{renderPendingRequests()}</div>
        <div id="friends-container">My friends: {renderMyFriends()}</div>
      </Modal.Body>
    </Modal>
  );
}
